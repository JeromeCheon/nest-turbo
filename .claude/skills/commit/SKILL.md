---
name: commit
description: >
  git 커밋 하네스. "커밋", "커밋해줘", "커밋해", "변경사항 커밋", "이거 커밋",
  "지금까지 작업 커밋", "commit" 요청 시 commit-writer로 논리 단위 커밋을 만들고
  commit-reviewer로 검증한 뒤 기준 미달이면 REDO를 돌린다. 후속: "커밋 다시",
  "커밋 메시지 수정", "커밋 다시 나눠줘", "커밋 REDO", "방금 커밋 고쳐"도 이 스킬로
  처리. 커밋 로그 조회·revert·PR 생성 같은 읽기/되돌리기/원격 작업은 직접 처리.
  이 파일은 `## 기준`(commit-writer·commit-reviewer 공용 규칙)과
  `## 오케스트레이션`(메인 스레드가 두 에이전트를 굴리는 절차)으로 나뉜다.
  에이전트는 `## 기준`만 읽는다.
---

# Commit 하네스

작업 트리의 변경을 검증된 Conventional Commits로 만드는 생성-검증 하네스.
**로컬 커밋까지만** — push는 사용자가 명시할 때만.

---

# 기준

**커밋을 만드는 쪽(commit-writer)** 과 **검증하는 쪽(commit-reviewer)** 이 같은
규칙으로 움직이도록 하는 단일 출처다. 규칙을 다른 곳에 복사하지 말고 이 섹션을
참조한다.

## 왜 이 규칙인가

커밋 히스토리는 `git log --oneline`으로 훑는 목록이다. 각 줄이 제목 하나로 무엇을
왜 했는지 읽혀야 한다. `fix bug` 같은 제목은 아무 정보도 주지 못한다. 맥락·이유가
길게 필요하면 그건 PR 설명에 쓴다 — 커밋에는 안 쓴다. 아래 규칙은 전부 이 목적에
복무한다.

## 1. Conventional Commits 메시지 형식

```
<type>(<scope>): <subject>
```

**제목 한 줄로 끝낸다. 본문·footer를 붙이지 않는다.**

### 제목 줄 (`<type>(<scope>): <subject>`)

- **type** (필수): 아래 표에서 하나
- **scope** (선택, 권장): 변경이 닿는 영역. 이 레포는 워크스페이스명·모듈명을 쓴다
  — `api`, `web`, `@repo/api`, `auth`, `robots`, `mqtt`, `deps`, `ci`, `harness`
- **subject** (필수):
  - 명령형 현재 시제 — "add", "fix", "change" (O) / "added", "fixes", "changing" (X)
  - 소문자로 시작, 끝에 마침표 없음
  - 50자 목표, **72자 초과 금지**
  - "무엇을 했는지"를 요약하되 diff를 그대로 읽지 말 것
  - 본문이 없으므로 제목만으로 무엇을 왜 했는지 읽혀야 한다. 제목에 안 담기면
    커밋을 더 쪼갠다

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
| `revert`   | 이전 커밋 되돌림 (revert는 하네스가 아니라 직접 처리)        |

> `.claude/` 하네스(에이전트·스킬) 추가/변경은 도구 동작을 늘리는 것이므로 `feat`,
> 포인터·문서 갱신은 `docs`, 설정 파일 손질은 `chore`로 본다. scope는 `harness`.

### 본문 (`<body>`) — **넣지 않는다**

- 커밋 메시지는 제목 한 줄이 전부다. 제목 뒤에 빈 줄·본문·footer를 붙이지 않는다
- 변경 이유·맥락·이슈 링크·BREAKING CHANGE 설명이 필요하면 **PR 설명**에 쓴다
- `git commit -m "<제목>"` 한 번. `-m`을 두 번 쓰거나 `-F`로 여러 줄을 넣지 않는다

## 2. 금지 — 절대 넣지 않는다

- **본문·footer** — 커밋은 제목 한 줄로 끝낸다. 여러 줄 메시지를 만들지 않는다
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

### 비대화형 제약 (서브 에이전트)

서브 에이전트는 `git add -p` 인터랙션을 쓸 수 없다. 한 파일이 여러 관심사에
걸치면 그 파일 **전체를 지배적 관심사 커밋 하나에** 통째로 넣는다.
**파일 내용을 손으로 재배열해 커밋 사이에 쪼개지 않는다** —
마크다운 표·코드 블록·문서 섹션이 커밋 경계에서 문법이 깨진다(이 레포에서 실제
발생 이력 있음). 손 재구성 없이는 분할이 불가능하면 REDO를 억지로 이행하지 말고
`CANNOT_COMPLY`로 에스컬레이션한다(오케스트레이션 참조).

## 4. GitHub Flow 브랜치 전략

- **`main`만 장수 브랜치**이고 항상 배포 가능 상태로 유지
- 모든 작업은 `main`에서 딴 **단기 브랜치**에서 진행하고, PR로 병합
- 브랜치 네이밍: **`<type>/<kebab-slug>`**
  - `feat/robot-dashboard`, `fix/login-401`, `refactor/auth-usecase`,
    `docs/commit-harness`, `chore/eslint-flat-config`
  - type은 §1 표와 동일 어휘, slug는 소문자-하이픈, 3~5단어
- 보호 브랜치에 있으면 커밋하지 말고 새 브랜치명을 사람에게 확인받는다
  (브랜치 자동 생성 금지)

## 5. 메시지 예시

제목 한 줄만. 아래 전부 본문 없음.

```
feat(robots): add MQTT command listener for part clicks
fix(mqtt): reconnect with 2s backoff on broker drop
refactor(auth): extract token rotation into SessionService
chore(deps): pin pnpm to 8.15.5 in packageManager field
docs(api): note the response envelope shape in README
```

## 6. 참고

- 전체 type 예시와 good/bad 대조: `references/conventional-commits.md` (필요 시 로드)

---

# 오케스트레이션

메인 스레드가 두 에이전트를 굴리는 절차. commit-writer와 commit-reviewer는 동시에
돌지 않고 커밋 히스토리와 `_workspace/commit-review.md` 파일을 사이에 두고 이어진다.
`Agent` 도구로 직접 호출하고 반환값으로 판정을 수집한다.

## 실행 모드: 서브 에이전트

## 에이전트 구성

| 에이전트        | subagent_type     | model  | 역할                                    |
| --------------- | ----------------- | ------ | --------------------------------------- |
| commit-writer   | `commit-writer`   | sonnet | 변경 분석 → 논리 단위 분할 → 커밋 작성  |
| commit-reviewer | `commit-reviewer` | sonnet | 커밋 루브릭 채점 → `PASS` / `REDO` 판정 |

> writer는 haiku에서 sonnet으로 올렸다. 분할 판단·제목 정확성·마크다운 보존에서
> haiku가 반복 실패해 REDO 루프를 소진했다.

두 에이전트는 시작 시 이 파일의 `## 기준` 섹션을 읽는다.

## 워크플로우

### Phase 0: 컨텍스트 확인

1. `git status --porcelain` 이 비어 있으면 → **커밋할 변경 없음, 중단**
2. `git branch --show-current` 확인:
   - `main` / `master` / `develop` / `release/*` 이면 → **중단하고 사용자에게
     작업 브랜치명을 묻는다** (`<type>/<kebab-slug>` 예시 제시). 브랜치를 자동
     생성하지 않는다. 답을 받으면 브랜치명을 Phase 1 프롬프트에 실어 전달
3. `_workspace/commit-review.md` 가 이전 실행에서 남아 있고 이번이 후속 요청이면
   → 삭제하거나 무시하고 새로 시작 (오래된 피드백 혼입 방지)
4. Phase 1 호출 직전 `git rev-parse HEAD` 로 `<base-sha>` 기록

### Phase 1: 커밋 작성

`Agent(subagent_type: "commit-writer", model: "sonnet")` 호출. 프롬프트에 담을 것:

- (있으면) 사용자가 준 새 브랜치명
- 사용자가 특정 변경만 커밋하라고 했으면 그 범위
- REDO 재실행이면 `_workspace/commit-review.md` 경로

반환에서 확인:

- `BLOCKED: protected branch ...` → Phase 0-2로 되돌아가 사용자에게 브랜치 확인
- `CANNOT_COMPLY: <항목> ...` → REDO 루프를 더 돌리지 않고 Phase 4로 가서
  해당 항목을 사용자에게 그대로 에스컬레이션 (writer가 구조적으로 못 고치는 지적)
- 만든 커밋 수 · 각 제목 · 스테이징 안 하고 남긴 변경

### Phase 2: 검증

`Agent(subagent_type: "commit-reviewer", model: "sonnet")` 호출. 프롬프트에 담을 것:

- 검증 대상 커밋 범위 — `<base-sha>..HEAD`
- 범위를 못 넘기면 reviewer가 `@{u}..HEAD` → `main..HEAD` 폴백

반환 첫 줄이 `PASS` / `REDO` / `NO_COMMITS`.

### Phase 3: REDO 루프

- `PASS` → Phase 4
- `REDO` → `_workspace/commit-review.md` 경로를 실어 commit-writer 재호출(Phase 1)
  → 다시 Phase 2. **최대 2회.**
- 재호출 반환이 `CANNOT_COMPLY` → 루프 종료. 커밋은 현 상태로 두고 해당 항목을
  사용자에게 보고, 판단을 넘긴다 (구조적으로 못 고치는 걸 2회 더 돌려봐야 소진)
- 2회 REDO 후에도 `REDO` → **강제 PASS 하지 않는다.** 커밋은 그대로 두고
  `_workspace/commit-review.md` 의 미해결 위반을 사용자에게 보고, 판단을 넘긴다
- `NO_COMMITS` → writer가 아무것도 못 만든 것. writer 반환 요약의 사유를 전달

### Phase 4: 보고

- `git log --oneline <base-sha>..HEAD` 로 만든 커밋 나열
- 스테이징하지 않고 남긴 변경이 있으면 명시
- **push 하지 않는다.** "push 하려면 말해줘 / PR은 `pr-review` 스킬" 안내
- `_workspace/` 는 보존한다

## 에러 핸들링

| 상황                          | 대응                                                          |
| ----------------------------- | ------------------------------------------------------------- |
| writer `BLOCKED`(보호 브랜치) | 사용자에게 브랜치명 확인 → 받으면 Phase 1 재호출              |
| writer `CANNOT_COMPLY`        | REDO 루프 즉시 종료, 미이행 항목 사용자 보고, 강제 통과 안 함 |
| reviewer 커밋 범위 판정 실패  | `@{u}..HEAD` → `main..HEAD` → `-5` 폴백, 사용한 범위 보고     |
| pre-commit 훅 실패            | writer가 훅 출력 보고 후 중단. `--no-verify` 우회 금지        |
| writer 2회 연속 실패          | 중단하고 부분 결과(있으면) + 실패 사유 보고                   |
| 2회 REDO 후에도 미달          | 커밋 유지, 미해결 위반 사용자에게 전달, 강제 통과 안 함       |

## 테스트 시나리오

### 정상 흐름

1. 사용자: "지금까지 작업한 거 커밋해줘" (feature 브랜치, dirty tree)
2. Phase 0 → 변경 있음, 브랜치 비보호, base-sha 기록
3. Phase 1 → commit-writer가 관심사별 3개 atomic 커밋 생성
4. Phase 2 → commit-reviewer `PASS`
5. Phase 4 → 커밋 3개 목록 보고, push 안 함

### REDO 흐름

1. Phase 1 → writer가 커밋 1개를 제목 뒤 본문까지 붙여 생성
2. Phase 2 → reviewer `REDO` (기준 §1·§2 본문 금지 위반)
3. Phase 3 → `_workspace/commit-review.md` 실어 writer 재호출 →
   `git commit --amend -m "<제목>"` 로 본문 제거
4. Phase 2 재검증 → `PASS`
5. Phase 4 → 보고

### 에러 흐름

1. 사용자: "커밋해줘" (현재 `main` 브랜치)
2. Phase 0-2 → 보호 브랜치 감지, 중단, "어느 브랜치에 커밋할까요?
   예: `feat/robot-dashboard`" 질문
3. 사용자: "feat/harness-setup"
4. Phase 1 → 브랜치명 전달, writer가 `git switch -c feat/harness-setup` 후 커밋
5. Phase 2 → `PASS` → Phase 4 보고
