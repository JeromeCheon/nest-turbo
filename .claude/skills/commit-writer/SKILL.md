---
name: commit-writer
description: >
  git 커밋 작성 표준. Conventional Commits 메시지 작성, 변경을 논리 단위 커밋으로
  분할, GitHub Flow 브랜치 네이밍, 금지 패턴(한 줄 커밋, Co-Authored-By trailer 등)을
  정의한다. 커밋을 만들거나 커밋 메시지를 쓰거나 커밋을 검증할 때 반드시 이 스킬을
  읽는다. "커밋", "커밋해줘", "커밋 메시지", "커밋 나눠줘", "커밋 다시" 요청에서 사용.
---

# Commit Writer — 커밋 작성·검증 공용 기준

이 파일은 **커밋을 만드는 쪽(commit-writer)** 과 **검증하는 쪽(commit-reviewer)** 이
같은 규칙으로 움직이도록 하는 단일 출처다. 규칙을 다른 곳에 복사하지 말고 이 파일을
참조한다.

## 왜 이 규칙인가

커밋 히스토리는 코드의 "왜"를 담는 유일한 장기 기록이다. `git blame`으로 한 줄을
추적했을 때 `fix bug` 한 줄만 나오면 그 커밋은 아무 정보도 주지 못한다. 6개월 뒤의
동료(또는 나 자신)가 회귀를 추적하고 변경 의도를 복원할 수 있어야 한다. 아래 규칙은
전부 이 목적에 복무한다.

## 1. Conventional Commits 메시지 형식

```
<type>(<scope>): <subject>
<빈 줄>
<body>
<빈 줄>
<footer (선택)>
```

### 제목 줄 (`<type>(<scope>): <subject>`)

- **type** (필수): 아래 표에서 하나
- **scope** (선택, 권장): 변경이 닿는 영역. 이 레포는 워크스페이스명·모듈명을 쓴다
  — `api`, `web`, `@repo/api`, `auth`, `robots`, `mqtt`, `deps`, `ci`
- **subject** (필수):
  - 명령형 현재 시제 — "add", "fix", "change" (O) / "added", "fixes", "changing" (X)
  - 소문자로 시작, 끝에 마침표 없음
  - 50자 목표, **72자 초과 금지**
  - "무엇을 했는지"를 요약하되 diff를 그대로 읽지 말 것

| type       | 용도                                                         |
| ---------- | ------------------------------------------------------------ |
| `feat`     | 사용자가 체감하는 기능 추가                                  |
| `fix`      | 버그 수정                                                    |
| `docs`     | 문서만 변경 (README, 주석, `docs/`, `CLAUDE.md`)             |
| `style`    | 동작 변화 없는 포맷팅 (공백, 세미콜론, prettier)             |
| `refactor` | 동작 변화 없는 구조 개선 (기능 추가도 버그 수정도 아님)      |
| `perf`     | 성능 개선 목적의 변경                                        |
| `test`     | 테스트 추가·수정만                                           |
| `build`    | 빌드 시스템·의존성 변경 (`package.json`, `pnpm-lock`, turbo) |
| `ci`       | CI 설정 변경 (`.github/workflows`, 훅)                       |
| `chore`    | 그 외 잡무 (설정 파일, `.gitignore`, 도구 구성)              |
| `revert`   | 이전 커밋 되돌림. body에 `This reverts commit <sha>.`        |

### 본문 (`<body>`) — **필수, 생략 불가**

- 제목 아래 **빈 줄 하나** 두고 시작
- 각 줄 72자에서 wrap
- **"무엇"이 아니라 "왜"와 "맥락"**: 이 변경이 필요한 이유, 이전 동작의 문제,
  선택한 접근과 버린 대안, 부수 효과. diff를 보면 아는 내용(어떤 함수를 고쳤는지)은
  반복하지 않는다
- 최소 1문장. 제목을 말만 바꿔 다시 쓰는 건 본문이 아니다
  - 나쁨: 제목 `fix(auth): correct token expiry` / 본문 `Fixed the token expiry bug.`
  - 좋음: 본문 `Access tokens were issued with a 15-minute TTL but the refresh`
    `guard compared against seconds, so every token was treated as expired`
    `immediately. Align both sides on milliseconds.`
- 정말 사소해서 쓸 "왜"가 없다면(오타 수정 등) 그 변경은 대개 다른 커밋에 합쳐야
  하는 신호다. 그래도 단독 커밋이면 한 문장으로 맥락을 남긴다

### 푸터 (`<footer>`) — 선택

- `BREAKING CHANGE: <설명>` — 호환성 깨짐. 있으면 반드시
- `Refs: #123`, `Closes: #123` — 이슈 연결

## 2. 금지 — 절대 넣지 않는다

- **한 줄 커밋** (본문 없는 커밋). 예외 없음
- **`Co-Authored-By:` trailer** — 사람이 명시적으로 요청하지 않는 한 넣지 않는다
- **`Claude-Session:` trailer**, **`🤖 Generated with ...`** 류 자동 서명 — 넣지 않는다.
  이 레포는 커밋 본문에 도구 서명을 남기지 않는 정책이다
- `git commit --no-verify` — 훅을 우회하지 않는다
- `git add -A` / `git add .` 무검토 스테이징 — 항상 어떤 파일이 들어가는지 확인하고
  명시적 pathspec으로 스테이징한다
- `git push --force`, force-with-lease 포함 — 이 스킬 범위에서 하지 않는다
- `main` / `master` / `develop` / `release/*` 브랜치에 직접 커밋

## 3. 논리 단위 커밋 분할 (적극 분할)

한 커밋은 **하나의 논리적 변경**만 담는다. 되돌릴 때 딱 그것만 되돌려지고, 리뷰할
때 한 가지만 판단하면 되는 단위.

### 분할 기준

- 서로 다른 관심사는 분리: 기능 구현 / 리팩터 / 포맷팅 / 설정 / 문서 / 의존성
- "그리고"로 커밋 제목을 이어야 하면 두 커밋이다
- 한 기능이라도 선행 리팩터가 있으면 `refactor` → `feat` 순서로 나눈다
- 무관한 파일이 우연히 같이 수정됐으면(예: 기능 작업 중 건드린 `.gitignore`) 별도 커밋

### 스테이징 방법

```bash
git status --porcelain           # 전체 변경 파악
git add path/to/file other/file  # 커밋 단위로 명시적 스테이징
git add -p path/to/file          # 한 파일에 여러 관심사가 섞였을 때 hunk 단위
git diff --staged                # 커밋 직전 스테이징 내용 최종 확인
```

관심사가 섞인 파일은 `git add -p`로 해당 hunk만 담고, 나머지는 다음 커밋으로 넘긴다.

## 4. GitHub Flow 브랜치 전략

- **`main`만 장수 브랜치**이고 항상 배포 가능 상태로 유지
- 모든 작업은 `main`에서 딴 **단기 브랜치**에서 진행하고, PR로 병합
- 브랜치 네이밍: **`<type>/<kebab-slug>`**
  - `feat/robot-dashboard`, `fix/login-401`, `refactor/auth-usecase`,
    `docs/commit-harness`, `chore/eslint-flat-config`
  - type은 §1 표와 동일 어휘, slug는 소문자-하이픈, 3~5단어
- 보호 브랜치에 있으면 커밋하지 말고 새 브랜치명을 사람에게 확인받는다
  (브랜치 자동 생성 금지)

## 5. 메시지 템플릿

```
feat(robots): add MQTT command listener for part clicks

The dashboard publishes a command topic when a robot part is clicked,
but nothing on the API side consumed it, so RobotEvent rows were never
written. Subscribe to robot/+/command/+ in a dedicated infra adapter
and route each message through the ApplyCommand use case.

Refs: #14
```

```
chore(deps): pin pnpm to 8.15.5 in packageManager field

CI picked up pnpm 9 from the runner default and the lockfile format
changed, breaking `pnpm install --frozen-lockfile`. Pin the version so
local and CI resolve identically.
```

## 6. 참고

- 전체 type 예시와 good/bad 대조: `references/conventional-commits.md` (필요 시 로드)
