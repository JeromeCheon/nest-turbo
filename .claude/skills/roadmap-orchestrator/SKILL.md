---
name: roadmap-orchestrator
description: >
  개발 로드맵 하네스를 조율한다. "ROADMAP 만들어줘", "docs/PRD 기준으로 로드맵",
  "Phase 추가", "Task 추가", "Task 명세 뽑아줘", "테스트 골격" 요청은 roadmap-planner로,
  "작업 끝났어 로드맵 갱신", "Task 00N 완료 처리", "ROADMAP 업데이트하고 다음 우선순위",
  "진행 상태 동기화" 요청은 roadmap-updater로 라우팅한다. 후속: "로드맵 다시",
  "이 Task는 아직 아니야", "우선순위 다시 잡아줘", "명세 보완", "완료 처리 취소"도
  이 스킬로 처리. 단순 질문(로드맵 내용 조회 등)은 직접 응답.
---

# Roadmap Orchestrator

`docs/PRD.md` → `docs/ROADMAP.md` 생성/확장(**roadmap-planner**)과, 구현 작업 후
완료 검증/상태 갱신(**roadmap-updater**)을 조율하는 통합 스킬.

## 실행 모드: 서브 에이전트

두 에이전트는 동시에 돌지 않고 `docs/ROADMAP.md` 파일 하나를 사이에 두고 이어진다.
팀 통신이 불필요하므로 `Agent` 도구로 직접 호출하고 반환값으로 결과를 수집한다.

## 에이전트 구성

| 에이전트        | subagent_type     | model  | 역할                                | 쓰기 범위                         |
| --------------- | ----------------- | ------ | ----------------------------------- | --------------------------------- |
| roadmap-planner | `roadmap-planner` | opus   | PRD → ROADMAP 생성·확장, Task 명세  | `docs/ROADMAP.md`, `docs/specs/*` |
| roadmap-updater | `roadmap-updater` | sonnet | 완료 검증 + 상태 표기·요약·우선순위 | `docs/ROADMAP.md`만               |

공용 기준: `roadmap` 스킬(`.claude/skills/roadmap/SKILL.md`) — 두 에이전트가 시작
시 반드시 읽는다.

## 워크플로우

### Phase 0: 라우팅 + 컨텍스트 확인

1. **요청 분류:**
   - 생성/확장/명세 계열("로드맵 만들어", "Phase/Task 추가", "명세 뽑아줘",
     "테스트 골격", "주석 가이드") → **planner 경로**
   - 완료/갱신 계열("작업 끝났어", "Task 00N 완료", "상태 동기화", "우선순위 다시",
     "이 Task는 아직 아니야") → **updater 경로**
   - 애매하면 사용자에게 한 줄로 확인
2. **선행 조건:**
   - planner 경로인데 `docs/PRD.md` 없음 → 중단, PRD 필요 보고
   - updater 경로인데 `docs/ROADMAP.md` 없음 → 중단, "planner 먼저" 안내
3. **범위 파악:** updater 경로면 사용자가 언급한 Task 번호를 추출한다.
   없으면 "최근 작업 전체"로 넘기고 updater가 `git diff`로 범위를 추정하게 한다

### Phase 1a: planner 경로

`Agent(subagent_type: "roadmap-planner", model: "opus")` 호출. 프롬프트에 담을 것:

- 지시 유형(신규 생성 / Phase 추가 / Task 추가 / 명세 HTML / 테스트 골격)
- 대상(어떤 기능·Phase·Task 번호)
- 기존 `docs/ROADMAP.md` 존재 여부(있으면 확장 모드)

반환을 받으면 Phase 3으로.

### Phase 1b: updater 경로

`Agent(subagent_type: "roadmap-updater", model: "sonnet")` 호출. 프롬프트에 담을 것:

- 검증 범위(Task 번호 목록 또는 "최근 작업 전체")
- 사용자가 "끝났다"고 말한 항목 원문
- 완료 처리 취소 요청이면 대상 Task와 사유

반환을 받으면 Phase 2로.

### Phase 2: 검증 결과 점검 (updater 경로만)

updater 반환 요약을 확인한다:

- **검증 불가 / 부분 완료 항목**이 있으면 그대로 사용자에게 전달(강제 완료 안 함)
- 사용자가 특정 항목을 "그건 아직 아니다"라고 하면 그 Task 범위만 좁혀 **1회**
  updater 재호출(상태 복원). 2회째도 판정 불가면 중단하고 사용자 판단에 맡긴다

### Phase 3: 보고

- planner: 추가/변경된 Phase·Task, 지정된 우선순위, PRD 불일치·미결정 사항
- updater: `✅` 처리된 항목, 검증 방법(실행 테스트·조회 심볼), 부분 완료·검증 불가
  항목, 새 우선순위 Task
- 산출물 경로(`docs/ROADMAP.md`, 새 `docs/specs/*.spec.html`)를 명시한다
- 파일 수정만 하고 커밋은 하지 않는다("커밋하려면 commit-orchestrator" 안내)

## 에러 핸들링

| 상황                           | 대응                                                   |
| ------------------------------ | ------------------------------------------------------ |
| planner가 PRD 불완전 보고      | 부족 항목을 사용자에게 그대로 전달, 진행 중단          |
| updater 테스트 실행 실패       | 해당 Task 완료 처리 안 함, "검증 불가" 사유 전달       |
| 라우팅 애매(생성인지 갱신인지) | 사용자에게 한 줄 확인 후 진행                          |
| 에이전트 1회 실패              | 1회 재호출. 재실패 시 부분 결과로 보고하고 미완료 명시 |
| updater가 "새 Task 필요" 반환  | planner를 이어서 호출할지 사용자에게 확인              |

## 테스트 시나리오

### 정상 흐름 (planner)

1. 사용자: "docs/PRD.md 기준으로 로드맵 만들어줘"
2. Phase 0 → planner 경로, PRD 존재 확인
3. Phase 1a → roadmap-planner 호출, `docs/ROADMAP.md` 생성
4. Phase 3 → Phase/Task 요약 + 우선순위 Task 보고

### 정상 흐름 (updater)

1. 사용자: "Task 001 인프라 끝났어, 로드맵 갱신하고 다음 우선순위 잡아줘"
2. Phase 0 → updater 경로, 범위 = Task 001, `docs/ROADMAP.md` 존재 확인
3. Phase 1b → roadmap-updater 호출 → Serena 조회 + `pnpm --filter api build` 실행
   → 수락 기준 충족 확인 → `✅ - 완료` + 변경 사항 요약 + Task 002에 `- 우선순위`
4. Phase 2 → 검증 불가 항목 없음
5. Phase 3 → 완료 항목·검증 방법·새 우선순위 보고

### 에러 흐름

1. 사용자: "Task 005 auth 끝났어, 완료 처리해줘"
2. Phase 1b → updater가 `pnpm --filter api test`에서 auth UseCase 테스트 3개 실패 확인
3. updater 반환: "검증 불가 — auth 완료 처리 안 함, 실패 테스트 3건"
4. Phase 2 → 검증 불가 항목을 사용자에게 전달, `docs/ROADMAP.md`는 Task 005 대기 유지
5. Phase 3 → "Task 005는 테스트 통과 후 재요청 필요" 보고
