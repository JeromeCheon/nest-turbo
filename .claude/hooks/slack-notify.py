#!/usr/bin/env python3
"""Claude Code → Slack 알림 훅: 권한 요청(Notification) / 작업 완료(Stop)."""

import datetime
import glob
import json
import os
import sys
import urllib.error
import urllib.request

KST = datetime.timezone(datetime.timedelta(hours=9))
UTC = datetime.timezone.utc
CONTEXT_LIMIT = int(os.environ.get("CLAUDE_CONTEXT_LIMIT") or 1_000_000)
PROJECTS_DIR = os.path.expanduser("~/.claude/projects")
SUMMARY_MAX = 700


def load_webhook_url():
  for name in (".env.local", ".env"):
    try:
      with open(os.path.join(os.getcwd(), name)) as f:
        for line in f:
          line = line.strip()
          if line.startswith("SLACK_WEBHOOK_URL="):
            return line.split("=", 1)[1].strip().strip("\"'")
    except FileNotFoundError:
      continue
  return os.environ.get("SLACK_WEBHOOK_URL", "")


def now_kst():
  return datetime.datetime.now(KST).strftime("%Y-%m-%d %H:%M KST")


def fmt_tokens(n):
  n = int(n or 0)
  if n < 1000:
    return str(n)
  if n < 1_000_000:
    return f"{n / 1000:.1f}k"
  return f"{n / 1_000_000:.1f}M"


def fmt_duration(sec):
  sec = int(sec or 0)
  h, rem = divmod(sec, 3600)
  m, s = divmod(rem, 60)
  return f"{h}시간 {m}분" if h else f"{m}분 {s}초" if m else f"{s}초"


def bar(pct, width=10):
  filled = int(max(0, min(100, pct)) / 100 * width)
  return "▓" * filled + "░" * (width - filled)


def iso(ts):
  return datetime.datetime.fromisoformat(ts.replace("Z", "+00:00"))


def iter_jsonl(path):
  try:
    with open(path) as f:
      for line in f:
        line = line.strip()
        if line:
          try:
            yield json.loads(line)
          except ValueError:
            pass
  except OSError:
    return


def summarize(text):
  """마지막 assistant 텍스트를 슬랙 인용용으로 축약: 코드블록·★Insight 블록·구분선 제거 후 길이 컷."""
  divider = set("─-— ")
  keep, in_fence, in_insight = [], False, False
  for ln in text.splitlines():
    raw = ln.strip()
    if raw.startswith("```"):
      in_fence = not in_fence
      continue
    s = raw.strip("`").strip()
    if "★ Insight" in s:
      in_insight = True
      continue
    if in_insight:
      if s and set(s) <= divider:
        in_insight = False
      continue
    if in_fence or (s and set(s) <= divider):
      continue
    keep.append(ln)
  out = "\n".join(l for l in keep if l.strip())
  return (out[:SUMMARY_MAX] + "…") if len(out) > SUMMARY_MAX else out


def read_transcript(path):
  """transcript JSONL을 1회 순회해 알림에 필요한 값을 뽑는다 (sidechain 메시지는 제외)."""
  # ponytail: 파일 전체 순회 — 훅은 1회성이라 스트리밍 불필요
  tok = {"input": 0, "output": 0, "cache_read": 0, "cache_write": 0}
  model = branch = version = cwd = None
  ctx = 0
  first = last = summary = None
  for e in iter_jsonl(path):
    if e.get("timestamp"):
      first = first or e["timestamp"]
      last = e["timestamp"]
    branch = e.get("gitBranch") or branch
    version = e.get("version") or version
    cwd = e.get("cwd") or cwd
    if e.get("type") != "assistant" or e.get("isSidechain"):
      continue
    msg = e.get("message") or {}
    model = msg.get("model") or model
    u = msg.get("usage") or {}
    if u:
      inp = u.get("input_tokens", 0) or 0
      cr = u.get("cache_read_input_tokens", 0) or 0
      cw = u.get("cache_creation_input_tokens", 0) or 0
      tok["input"] += inp
      tok["output"] += u.get("output_tokens", 0) or 0
      tok["cache_read"] += cr
      tok["cache_write"] += cw
      ctx = inp + cr + cw  # 마지막 main-chain 메시지의 컨텍스트 점유량
    for b in msg.get("content", []):
      if isinstance(b, dict) and b.get("type") == "text" and b.get("text", "").strip():
        summary = b["text"]

  duration = 0
  try:
    duration = max(0, int((iso(last) - iso(first)).total_seconds()))
  except (TypeError, AttributeError, ValueError):
    pass
  return {
    "model": model or "?",
    "branch": branch or "?",
    "version": version,
    "cwd": cwd,
    "tokens": tok,
    "context": ctx,
    "duration": duration,
    "summary": summarize(summary) if summary else "(요약 없음)",
  }


def tokens_last_5h():
  """계정 전체 트랜스크립트에서 최근 5시간 assistant 토큰(입력+출력+캐시생성) 합산."""
  # ponytail: 원시 합계라 Claude의 가중치 기반 한도 %와는 다름. mtime으로 최근 파일만 연다
  cutoff = datetime.datetime.now(UTC) - datetime.timedelta(hours=5)
  total = 0
  for path in glob.glob(os.path.join(PROJECTS_DIR, "*", "*.jsonl")):
    try:
      if os.path.getmtime(path) < cutoff.timestamp():
        continue
    except OSError:
      continue
    for e in iter_jsonl(path):
      if e.get("type") != "assistant":
        continue
      try:
        if iso(e["timestamp"]) < cutoff:
          continue
      except (KeyError, AttributeError, ValueError):
        continue
      u = (e.get("message") or {}).get("usage") or {}
      total += (u.get("input_tokens", 0) or 0) + (u.get("output_tokens", 0) or 0) \
          + (u.get("cache_creation_input_tokens", 0) or 0)
  return total


def project_name(event, info):
  cwd = event.get("cwd") or info["cwd"] or os.getcwd()
  return os.path.basename(cwd.rstrip("/")) or cwd


def send_slack(url, payload):
  req = urllib.request.Request(
    url, data=json.dumps(payload).encode(),
    headers={"Content-Type": "application/json"}, method="POST")
  try:
    urllib.request.urlopen(req, timeout=10)
  except urllib.error.URLError as e:
    print(f"[slack-notify] 전송 실패: {e}", file=sys.stderr)


def permission_payload(event):
  info = read_transcript(event.get("transcript_path", ""))
  return {"blocks": [
    {"type": "header", "text": {"type": "plain_text", "text": "⚠️ Claude Code 권한 요청", "emoji": True}},
    {"type": "section", "fields": [
      {"type": "mrkdwn", "text": f"*요청 내용:*\n{event.get('message', '(내용 없음)')}"},
      {"type": "mrkdwn", "text": f"*프로젝트:*\n`{project_name(event, info)}` (`{info['branch']}`)"},
    ]},
    {"type": "context", "elements": [
      {"type": "mrkdwn", "text": f"세션 `{event.get('session_id', '')[:8]}` · {now_kst()}"}]},
    {"type": "divider"},
  ]}


def stop_payload(event):
  info = read_transcript(event.get("transcript_path", ""))
  ctx, t = info["context"], info["tokens"]
  ctx_pct = round(ctx / CONTEXT_LIMIT * 100)
  meta = " · ".join(x for x in (
    f"세션 `{event.get('session_id', '')[:8]}`",
    f"CC v{info['version']}" if info["version"] else "",
    f"완료 {now_kst()}",
  ) if x)
  return {"blocks": [
    {"type": "header", "text": {"type": "plain_text", "text": "✅ Claude Code 작업 완료", "emoji": True}},
    {"type": "section", "fields": [
      {"type": "mrkdwn", "text": f"*프로젝트:*\n`{project_name(event, info)}`"},
      {"type": "mrkdwn", "text": f"*브랜치:*\n`{info['branch']}`"},
      {"type": "mrkdwn", "text": f"*모델:*\n`{info['model']}`"},
      {"type": "mrkdwn", "text": f"*세션 활성 시간:*\n{fmt_duration(info['duration'])}"},
    ]},
    {"type": "section", "text": {"type": "mrkdwn", "text":
      f"*컨텍스트*  {fmt_tokens(ctx)} / {fmt_tokens(CONTEXT_LIMIT)}  `{bar(ctx_pct)}` {ctx_pct}%"}},
    {"type": "section", "text": {"type": "mrkdwn", "text":
      f"*토큰 사용량 (세션)*\n입력 {fmt_tokens(t['input'])} · 출력 {fmt_tokens(t['output'])} · "
      f"캐시read {fmt_tokens(t['cache_read'])} · 캐시write {fmt_tokens(t['cache_write'])}"}},
    {"type": "section", "text": {"type": "mrkdwn", "text":
      f"*최근 5시간 토큰*  ≈ {fmt_tokens(tokens_last_5h())}  _(계정 전체 · 입력+출력+캐시생성)_"}},
    {"type": "section", "text": {"type": "mrkdwn", "text":
      "*작업 요약*\n" + "\n".join(f"> {l}" for l in info["summary"].splitlines())}},
    {"type": "context", "elements": [{"type": "mrkdwn", "text": meta}]},
    {"type": "divider"},
  ]}


def selftest():
  assert fmt_tokens(24) == "24"
  assert fmt_tokens(15213) == "15.2k"
  assert fmt_tokens(1_300_000) == "1.3M"
  assert fmt_duration(3188) == "53분 8초"
  assert fmt_duration(3660) == "1시간 1분"
  assert bar(21) == "▓▓░░░░░░░░"
  assert summarize("```\nx\n```\n결과입니다.\n─────\n`★ Insight ──`\n- p\n`────`") == "결과입니다."

  import tempfile
  rows = [
    {"type": "user", "timestamp": "2026-01-01T00:00:00.000Z", "gitBranch": "main", "version": "1.2.3"},
    {"type": "assistant", "isSidechain": True, "timestamp": "2026-01-01T00:00:30.000Z",
     "message": {"model": "sub", "usage": {"input_tokens": 999}}},
    {"type": "assistant", "timestamp": "2026-01-01T00:01:00.000Z", "message": {
      "model": "claude-x",
      "usage": {"input_tokens": 10, "output_tokens": 20,
                "cache_read_input_tokens": 30, "cache_creation_input_tokens": 40},
      "content": [{"type": "text", "text": "끝났습니다."}]}},
  ]
  with tempfile.NamedTemporaryFile("w", suffix=".jsonl", delete=False) as f:
    f.write("\n".join(json.dumps(r) for r in rows))
    p = f.name
  try:
    got = read_transcript(p)
  finally:
    os.unlink(p)
  assert got["branch"] == "main" and got["model"] == "claude-x", got
  assert got["context"] == 80, got            # sidechain 999 무시
  assert got["tokens"]["output"] == 20 and got["duration"] == 60, got
  assert got["summary"] == "끝났습니다.", got
  print("ok")


def main():
  if sys.argv[1:2] == ["--selftest"]:
    return selftest()
  url = load_webhook_url()
  if not url:
    return
  try:
    event = json.loads(sys.stdin.read())
  except ValueError:
    return
  name = event.get("hook_event_name")
  if name == "Stop" and not event.get("stop_hook_active"):
    send_slack(url, stop_payload(event))
  elif name == "Notification" and event.get("notification_type") == "permission_prompt":
    send_slack(url, permission_payload(event))


if __name__ == "__main__":
  main()
