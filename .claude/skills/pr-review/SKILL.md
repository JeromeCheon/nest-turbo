---
name: pr-review
description: >
  GitHub PR 하네스. "PR 올려줘", "이 브랜치 PR 만들어줘", "PR 초안", "풀리퀘",
  "pull request 생성" 요청 시 pr-writer가 `.github/pull_request_template.md`를 채운
  초안을 만들고, pr-reviewer가 루브릭으로 검증한 뒤 기준 미달이면 REDO를 돌리고,
  최종 PASS일 때만 `gh`로 PR을 생성한다. 후속: "PR 다시", "PR 설명 고쳐",
  "PR REDO"도. PR 목록 조회·머지·revert는 직접 처리. 이 파일은 `## 리뷰 루브릭`
  (pr-reviewer가 읽는 채점 기준)과 `## 오케스트레이션`(메인 스레드가 두 에이전트를
  굴리는 절차)으로 나뉜다.
---

# PR 하네스

현재 브랜치의 커밋들을 검증된 PR로 만드는 생성-검증 하네스. **최종 PASS 전까지
GitHub에 아무것도 만들지 않는다** — 초안·리뷰는 전부 로컬(`_workspace/`).

---

# 리뷰 루브릭

pr-reviewer가 **제안된 PR** = `_workspace/pr-draft.md` + `git log/diff <base>..HEAD`
를 채점하는 기준. pr-reviewer는 PR·커밋·GitHub를 **수정하지 않고 판정만** 한다.

## 왜 이 규칙인가

PR 리뷰의 절반은 "이 설명만 읽고 변경 의도를 이해할 수 있는가", 나머지 절반은
"이 커밋 묶음을 그대로 히스토리에 남겨도 되는가"다. 코드 로직 리뷰가 아니라
**전달 가능성**과 **히스토리 위생**을 본다.

## 채점 항목 (PASS = 전부 충족)

1. **제목** — 변경 묶음 전체를 정확히 요약. `<type>(<scope>): <summary>` 형식,
   명령형, 72자 이하. 특정 커밋 제목 복붙이 아니다
2. **개요 = "무엇을 왜"** — 템플릿 주석 지시대로 무엇을·왜 바꿨는지 서술.
   "어떻게"(구현 단계) 나열이면 실패. (분량 하한은 항목 9)
3. **PR 유형 체크박스가 diff와 일치** — 체크된 항목이 실제 변경 성격과 맞고,
   해당하는데 빠진 항목이 없다
4. **작업 내용 = 요약 + 개조식** — 맨 앞 요약 1~2문장 뒤에 개발 기능/로직을 개조식
   불릿으로 열거. 커밋 해시/제목 나열이면 실패. (상세도 기준은 항목 9)
5. **PR Checklist가 정직** — 커밋 컨벤션 준수 항목이 `<base>..HEAD` 실제 커밋과
   맞는지 교차 확인. 테스트 항목이 사실과 맞는지(테스트가 없는데 체크돼 있으면 실패)
6. **커밋 히스토리 위생** — `<base>..HEAD`에 `WIP`·`fixup!`·`squash!`·`amend` 흔적·
   되돌려진 커밋 쌍이 없다. 커밋은 제목 한 줄만인 게 정상(`commit` 스킬 정책) —
   본문 유무는 지적하지 않는다. 문제가 있으면 REDO 사유 =
   **"`commit` 스킬로 히스토리 정리 필요"** (pr-writer가 초안에서 못 고침)
7. **diff 위생** — PR 설명과 무관한 파일 변경, 시크릿(키·토큰·`.env` 실값),
   대용량 바이너리, 디버그 잔재(`console.log`, 주석 처리된 코드 블록)가 없다
8. **base·머지 가능성** — base가 `main`. `git merge-tree $(git merge-base HEAD main)
HEAD main` 으로 충돌 없음 확인. 충돌 있으면 REDO(리베이스 필요)
9. **개요·작업 내용 분량 임계값** (항목 2·4의 구체 기준):
   - **개요**: 완결 문장 **2개 이상**, 그중 최소 하나는 "왜"(문제·동기·맥락).
     "무엇"만 있고 "왜"가 없으면 REDO. `<base>..HEAD` 커밋이 1개뿐이고 사소한
     변경이면 1문장 허용
   - **개요 재진술 금지**: 개요가 제목과 **90% 이상 겹치면** REDO (제목에 없는
     정보가 있어야 한다 — `commit-reviewer.md` §3 항목 2와 같은 90% 잣대)
   - **작업 내용**: 맨 앞에 요약 **1~2문장** 필수 — 없이 불릿만이면 REDO. 이어
     개발 기능/로직을 개조식 불릿으로, `<base>..HEAD` 커밋 **1개당 최소 1불릿**,
     각 불릿은 커밋 제목 복붙이 아닌 명사형 한 줄. 커밋 5개 초과면 논리 그룹으로
     묶어 그룹당 1불릿 + 하위 세부 허용

**경계 사례는 통과 쪽으로** — 위 기준을 아슬하게 넘긴 초안은 PASS + 코멘트로 남기고,
명백한 위반(개요 공란/1문장뿐/"어떻게"만 나열, 작업 내용이 커밋 해시 나열)만 REDO.

## 판정 출력 → `_workspace/pr-review.md`

```markdown
# PR Review — <base>..HEAD (<branch>)

## 판정: PASS | REDO

## 항목별 결과

### 1. 제목

- 판정 / (REDO면) 무엇이 어떻게 틀렸는지 + 수정 지시

### 2. 개요

...

## 종합

<전체 REDO 사유 1~3줄, 또는 PASS 확인>
```

반환 첫 줄에 `PASS` 또는 `REDO`, 이어서 3~5줄 요약.

---

# 오케스트레이션

메인 스레드가 두 에이전트를 굴리는 절차. pr-writer와 pr-reviewer는 동시에 돌지
않고 `_workspace/pr-draft.md` / `_workspace/pr-review.md` 파일을 사이에 두고 이어진다.

## 실행 모드: 서브 에이전트

## 에이전트 구성

| 에이전트    | subagent_type | model  | 읽는 스킬                      | 역할                                       |
| ----------- | ------------- | ------ | ------------------------------ | ------------------------------------------ |
| pr-writer   | `pr-writer`   | sonnet | `pr-create`                    | 템플릿 채워 초안 작성, 최종 `gh pr create` |
| pr-reviewer | `pr-reviewer` | sonnet | `pr-review`의 `## 리뷰 루브릭` | 초안+diff 채점 → `PASS`/`REDO`             |

## 워크플로우

### Phase 0: 컨텍스트 확인

1. `git status --porcelain` 이 비어 있지 않으면 → **중단.** "커밋 안 된 변경이
   있습니다. 먼저 `commit` 스킬로 커밋하세요" 안내
2. `git branch --show-current` 가 `main`/보호 브랜치 → **중단.** PR 만들 작업
   브랜치가 아님
3. `git log --oneline main..HEAD` 가 0개 → **중단.** "main보다 앞선 커밋이 없습니다"
4. `gh pr view --json url,state 2>/dev/null` 로 이 브랜치 PR이 이미 있으면 →
   기존 PR URL을 사용자에게 보여주고 "갱신(설명 다시 작성)할까요, 그대로 둘까요?" 확인
5. `_workspace/pr-review.md` 가 이전 실행 잔재면 삭제

### Phase 1: 초안 작성

`Agent(subagent_type: "pr-writer", model: "sonnet")` 호출. 담을 것:

- base(`main`)/head(현재 브랜치)
- 사용자가 준 PR 의도·관련 이슈 번호(있으면)
- REDO 재실행이면 `_workspace/pr-review.md` 경로

반환에서 확인:

- `BLOCKED: ...` → Phase 0 해당 항목으로 되돌아가 사용자에게 안내
- `_workspace/pr-draft.md` 생성 여부, 제목, 감지한 PR 유형

### Phase 2: 검증

`Agent(subagent_type: "pr-reviewer", model: "sonnet")` 호출. 담을 것:

- 검증 범위 `<base>..HEAD` (base = `main`, 없으면 `git merge-base HEAD main`)
- `_workspace/pr-draft.md` 경로

반환 첫 줄이 `PASS` / `REDO`.

### Phase 3: REDO 루프

- `PASS` → Phase 4
- `REDO` → `_workspace/pr-review.md` 를 실어 pr-writer 재호출(Phase 1) → 다시
  Phase 2. **최대 2회**
- 2회 후에도 `REDO` → **PR 생성하지 않는다.** `_workspace/pr-review.md` 의 미해결
  항목을 사용자에게 보고, 판단을 넘긴다
- reviewer가 항목 6(히스토리 위생) REDO를 냈고 pr-writer가 "`commit` 스킬 필요"로
  반환하면 → 루프 중단, 사용자에게 "`commit` 스킬로 히스토리 정리 후 다시" 안내

### Phase 4: PASS → PR 생성

1. 승인된 **제목과 본문 전문**을 사용자에게 보여주고 **"이대로 PR 생성할까요?"
   명시적 확인을 받는다** — draft가 아니라 바로 열리는 PR이므로
2. `Agent(subagent_type: "pr-writer", model: "sonnet")` 를 `mode: create` 로 재호출 —
   `gh pr create --base main --title <t> --body-file <f>` 실행, PR URL 반환
3. `gh` 인증 실패·네트워크 오류면 초안 경로와 수동 생성 명령을 사용자에게 제공

### Phase 5: 보고

- 생성된 PR URL 보고 (draft 아님 — 바로 리뷰 가능)
- "머지는 사람이 GitHub에서" 안내
- `_workspace/` 보존

## 에러 핸들링

| 상황                            | 대응                                            |
| ------------------------------- | ----------------------------------------------- |
| 작업 트리 dirty                 | 중단, `commit` 스킬 먼저 안내                   |
| `main..HEAD` 커밋 0개           | 중단, 커밋할 작업이 있는지 확인 요청            |
| 이미 PR 존재                    | 기존 URL 제시, 갱신 여부 확인                   |
| reviewer 항목 6 REDO (히스토리) | 루프 중단, `commit` 스킬로 정리 후 재시도 안내  |
| 2회 REDO 후에도 미달            | PR 생성 안 함, 미해결 항목 사용자에게           |
| `gh pr create` 실패             | 초안 파일 경로 + 수동 명령 제공, PR 미생성 보고 |
| pr-writer 2회 연속 실패         | 중단, 실패 사유 보고                            |

## 테스트 시나리오

### 정상 흐름

1. 사용자: "이 브랜치 PR 올려줘" (feature 브랜치, clean tree, main보다 4커밋 앞섬)
2. Phase 0 → 통과 (dirty 아님, 비보호, 커밋 있음, 기존 PR 없음)
3. Phase 1 → pr-writer가 템플릿 채워 `_workspace/pr-draft.md` 생성
4. Phase 2 → pr-reviewer `PASS`
5. Phase 4 → 제목·본문 표시 → 사용자 확인 → `gh pr create` → PR URL
6. Phase 5 → URL 보고

### 에러 흐름 (dirty tree)

1. 사용자: "PR 만들어줘" (스테이징 안 된 변경 있음)
2. Phase 0-1 → 중단, "커밋 안 된 변경이 있습니다. `commit` 스킬로 먼저 커밋하세요"
3. PR 생성 안 함

### REDO 흐름 (개요 부실)

1. Phase 1 → pr-writer가 개요에 "어떻게"(구현 단계)만 나열
2. Phase 2 → pr-reviewer `REDO` (루브릭 2 위반)
3. Phase 3 → `_workspace/pr-review.md` 실어 pr-writer 재호출 → 개요를 "무엇/왜"로 재작성
4. Phase 2 재검증 → `PASS`
5. Phase 4 → PR 생성
