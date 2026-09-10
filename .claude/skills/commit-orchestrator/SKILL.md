---
name: commit-orchestrator
description: >
  git 커밋 하네스를 조율한다. "커밋", "커밋해줘", "커밋해", "변경사항 커밋",
  "이거 커밋", "지금까지 작업 커밋", "commit" 요청 시 commit-writer로 커밋을 만들고
  commit-reviewer로 검증한 뒤 기준 미달이면 REDO를 돌린다. 후속: "커밋 다시",
  "커밋 메시지 수정", "커밋 다시 나눠줘", "커밋 REDO", "방금 커밋 고쳐"도 이 스킬로
  처리. 커밋 로그 조회·revert·PR 생성 같은 읽기/되돌리기/원격 작업은 직접 처리.
---

# Commit Orchestrator

작업 트리의 변경을 검증된 Conventional Commits로 만드는 생성-검증 하네스.
**로컬 커밋까지만** — push는 사용자가 명시할 때만.

## 실행 모드: 서브 에이전트

commit-writer와 commit-reviewer는 동시에 돌지 않고 커밋 히스토리와
`_workspace/commit-review.md` 파일을 사이에 두고 이어진다. `Agent` 도구로 직접
호출하고 반환값으로 판정을 수집한다.

## 에이전트 구성

| 에이전트        | subagent_type     | model  | 역할                                    |
| --------------- | ----------------- | ------ | --------------------------------------- |
| commit-writer   | `commit-writer`   | haiku  | 변경 분석 → 논리 단위 분할 → 커밋 작성  |
| commit-reviewer | `commit-reviewer` | sonnet | 커밋 루브릭 채점 → `PASS` / `REDO` 판정 |

공용 기준: `commit-writer` 스킬(`.claude/skills/commit-writer/SKILL.md`) — 두
에이전트가 시작 시 반드시 읽는다.

## 워크플로우

### Phase 0: 컨텍스트 확인

1. `git status --porcelain` 이 비어 있으면 → **커밋할 변경 없음, 중단**
2. `git branch --show-current` 확인:
   - `main` / `master` / `develop` / `release/*` 이면 → **중단하고 사용자에게
     작업 브랜치명을 묻는다** (`<type>/<kebab-slug>` 예시 제시). 브랜치를 자동
     생성하지 않는다. 답을 받으면 브랜치명을 Phase 1 프롬프트에 실어 전달
3. `_workspace/commit-review.md` 가 이전 실행에서 남아 있고 이번이 후속 요청이면
   → 삭제하거나 무시하고 새로 시작 (오래된 피드백 혼입 방지)

### Phase 1: 커밋 작성

`Agent(subagent_type: "commit-writer", model: "haiku")` 호출. 프롬프트에 담을 것:

- (있으면) 사용자가 준 새 브랜치명
- 사용자가 특정 변경만 커밋하라고 했으면 그 범위
- REDO 재실행이면 `_workspace/commit-review.md` 경로

반환에서 확인:

- `BLOCKED: protected branch ...` → Phase 0-2로 되돌아가 사용자에게 브랜치 확인
- 만든 커밋 수 · 각 제목 · 스테이징 안 하고 남긴 변경

### Phase 2: 검증

`Agent(subagent_type: "commit-reviewer", model: "sonnet")` 호출. 프롬프트에 담을 것:

- 검증 대상 커밋 범위 — `<base-sha>..HEAD`. `<base-sha>` 는 이번 실행 직전의
  HEAD(Phase 1 호출 전에 `git rev-parse HEAD` 로 기록해 둔다)
- 범위를 못 넘기면 reviewer가 `@{u}..HEAD` → `main..HEAD` 폴백

반환 첫 줄이 `PASS` / `REDO` / `NO_COMMITS`.

### Phase 3: REDO 루프

- `PASS` → Phase 4
- `REDO` → `_workspace/commit-review.md` 경로를 실어 commit-writer 재호출(Phase 1)
  → 다시 Phase 2. **최대 2회.**
- 2회 REDO 후에도 `REDO` → **강제 PASS 하지 않는다.** 커밋은 그대로 두고
  `_workspace/commit-review.md` 의 미해결 위반을 사용자에게 보고, 판단을 넘긴다
- `NO_COMMITS` → writer가 아무것도 못 만든 것. writer 반환 요약의 사유를 전달

### Phase 4: 보고

- `git log --oneline <base-sha>..HEAD` 로 만든 커밋 나열
- 스테이징하지 않고 남긴 변경이 있으면 명시
- **push 하지 않는다.** "push 하려면 말해줘 / PR은 별도 요청" 안내
- `_workspace/` 는 보존한다

## 에러 핸들링

| 상황                          | 대응                                                      |
| ----------------------------- | --------------------------------------------------------- |
| writer `BLOCKED`(보호 브랜치) | 사용자에게 브랜치명 확인 → 받으면 Phase 1 재호출          |
| reviewer 커밋 범위 판정 실패  | `@{u}..HEAD` → `main..HEAD` → `-5` 폴백, 사용한 범위 보고 |
| pre-commit 훅 실패            | writer가 훅 출력 보고 후 중단. `--no-verify` 우회 금지    |
| writer 2회 연속 실패          | 중단하고 부분 결과(있으면) + 실패 사유 보고               |
| 2회 REDO 후에도 미달          | 커밋 유지, 미해결 위반 사용자에게 전달, 강제 통과 안 함   |

## 테스트 시나리오

### 정상 흐름

1. 사용자: "지금까지 작업한 거 커밋해줘" (feature 브랜치, dirty tree)
2. Phase 0 → 변경 있음, 브랜치 비보호, base-sha 기록
3. Phase 1 → commit-writer가 관심사별 3개 atomic 커밋 생성
4. Phase 2 → commit-reviewer `PASS`
5. Phase 4 → 커밋 3개 목록 보고, push 안 함

### REDO 흐름

1. Phase 1 → writer가 커밋 1개를 본문 없이 생성
2. Phase 2 → reviewer `REDO` (항목 2 위반: 본문 없음)
3. Phase 3 → `_workspace/commit-review.md` 실어 writer 재호출 →
   `git commit --amend` 로 본문 추가
4. Phase 2 재검증 → `PASS`
5. Phase 4 → 보고

### 에러 흐름

1. 사용자: "커밋해줘" (현재 `main` 브랜치)
2. Phase 0-2 → 보호 브랜치 감지, 중단, "어느 브랜치에 커밋할까요?
   예: `feat/robot-dashboard`" 질문
3. 사용자: "feat/harness-setup"
4. Phase 1 → 브랜치명 전달, writer가 `git switch -c feat/harness-setup` 후 커밋
5. Phase 2 → `PASS` → Phase 4 보고
