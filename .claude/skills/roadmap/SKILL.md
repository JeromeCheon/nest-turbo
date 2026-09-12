---
name: roadmap
description: >
  개발 로드맵 하네스. "ROADMAP 만들어줘", "docs/PRD 기준으로 로드맵", "Phase 추가",
  "Task 추가", "Task 명세 뽑아줘", "테스트 골격" 요청은 roadmap-planner로,
  "작업 끝났어 로드맵 갱신", "Task 00N 완료 처리", "ROADMAP 업데이트하고 다음 우선순위",
  "진행 상태 동기화" 요청은 roadmap-updater로 라우팅한다. 후속: "로드맵 다시",
  "이 Task는 아직 아니야", "우선순위 다시 잡아줘", "명세 보완", "완료 처리 취소"도.
  단순 질문(로드맵 내용 조회)은 직접 응답. 이 파일은 `## 기준`(planner·updater 공용
  규칙)과 `## 오케스트레이션`(메인 스레드가 두 에이전트를 라우팅·조율하는 절차)으로
  나뉜다. 에이전트는 `## 기준`만 읽는다.
---

# Roadmap 하네스

`docs/PRD.md`를 실행 가능한 `docs/ROADMAP.md`로 바꾸고(roadmap-planner), 구현 작업
후 완료를 검증해 상태를 갱신하는(roadmap-updater) 하네스.

---

# 기준

**로드맵을 만드는 쪽(roadmap-planner)** 과 **완료를 처리하는 쪽(roadmap-updater)** 이
같은 형식·잣대로 움직이도록 하는 단일 출처. 규칙을 복사하지 말고 이 섹션을 참조한다.

## 0. 위치와 기준 문서

- 로드맵 파일: **`docs/ROADMAP.md`** (레포 루트 아님 — 실제 위치에 맞춘다)
- 기준 문서: `docs/PRD.md` (단일 기준. 충돌 시 PRD 우선, 공백은 로드맵에 명시)
- 명세 산출물: `docs/specs/<task-id>-<slug>.spec.html`
- 참고: `CLAUDE.md`, 현재 코드베이스 상태(Serena로 확인)

## 1. 왜 구조 우선(Structure-First)인가

실제 기능보다 전체 골격을 먼저 세운다: **골격 → 타입/계약 → UI(더미) → 기능 →
최적화.** 초기에 앱 전체 플로우를 체험할 수 있어야 통합 리스크가 앞당겨 드러나고,
백엔드·프론트를 독립 트랙으로 병렬 진행할 수 있다. 의존성 낮은 작업을 앞에 둔다.

## 2. ROADMAP.md 구조

```markdown
# <프로젝트> 개발 로드맵

<한 줄 설명>

## 개요

<핵심 기능 3~5개 불릿>
기준 문서: docs/PRD.md

## 개발 워크플로우

1. 작업 계획 → 2. 작업 생성 → 3. 작업 구현(인간) → 4. 로드맵 갱신
   **상태 표기**: <§4 규칙 요약>

## 개발 단계

### Phase 1: <이름>

- **Task 001: <동사>+<대상>+<목적>** - 우선순위
  - <구현 사항>
  - <구현 사항>

### Phase 2: ...
```

## 3. Task 작성 형식

- 제목: `Task XXX: <동사> <대상> <목적>` (예: `Task 005: Prisma + auth 모듈 구현`)
- 본문에 포함: 고수준 명세 / 대상 파일 목록(경로 + 한 줄 목적) / 수락 기준 /
  구현 단계
- **API·비즈니스 로직 Task는 "## 테스트 체크리스트" 필수** — Jest 단위 시나리오 +
  e2e(또는 Playwright MCP) 시나리오
- `구현 담당: 인간 개발자` 표기 + 에이전트 산출물(명세 HTML / 테스트 골격 /
  주석 가이드) 경로 링크
- 프론트(`apps/web`) Task: "코드화는 프론트 전담 서브에이전트, 의존성 설치는
  인간 개발자" 노트. planner는 화면·라우트·상태·`@repo/api` 데이터 계약까지만 명세
- Task 크기: 인간 1인 기준 1~2주, 독립적, 측정 가능한 완료 기준

## 4. 상태 표기 규칙

기존 `docs/ROADMAP.md`의 표기와 일치시킨다.

| 대상      | 완료           | 진행/대기                                 |
| --------- | -------------- | ----------------------------------------- |
| Phase     | 제목 끝에 `✅` | 표기 없음                                 |
| Task      | `✅ - 완료`    | `- 우선순위`(즉시 시작) / 표기 없음(대기) |
| 구현 사항 | `- [x]`        | `- [ ]`                                   |

- **신규 Task는 빈 박스(`- [ ]`) + "변경 사항 요약" 없이** 작성한다
- **완료 처리 시에만** 해당 Task 아래 `> 변경 사항 요약: ...` 한 줄을 추가한다
- `- 우선순위`는 마지막 완료 Task **바로 다음** 대기 Task 하나에만 붙인다
- 이미 `✅` 처리된 항목을 임의로 되돌리지 않는다 (명시 지시가 있을 때만)

## 5. 완료 판정 기준 (updater 전용)

Task 또는 구현 사항을 `✅` / `- [x]`로 바꾸려면 **모두** 충족:

1. Task의 **수락 기준**에 적힌 조건이 코드베이스에서 실제로 만족된다
   (Serena 심볼 조회로 존재·시그니처 확인, 단순 파일 존재만으로 판단하지 않음)
2. "테스트 체크리스트"가 있는 Task면 해당 테스트가 **실제로 통과**한다
   (`pnpm --filter <pkg> test` / `check-types` / `build` 실행 결과로 확인)
3. PRD·명세와의 계약(타입, API 형태, 토픽 헬퍼 등)이 어긋나지 않는다

- 일부만 충족 → Task는 대기로 두고, **충족된 구현 사항 체크박스만** `- [x]`
- 판단이 애매하면 완료로 올리지 않고 로드맵에 "부분 완료 — <미충족 항목>" 노트
- 검증 불가(도구 실행 실패 등)면 완료 처리하지 않고 사유를 보고

## 6. 공통 금지 (planner · updater 모두)

- `.ts`/`.tsx` 등 **앱 구현 코드 작성 금지**
- `package.json` 수정, `pnpm add`/`pnpm install` 실행 금지
- `prisma migrate`/`prisma generate` 등 DB·인프라 상태 변경 금지
- 쓰기 허용 범위: `docs/ROADMAP.md`, `docs/specs/*.html`, (명시 요청 시) 테스트
  골격 파일. **그 외 어떤 파일도 수정하지 않는다**
- 요청이 범위를 벗어나면 거절하고 "명세 HTML + 테스트 골격 + 주석 가이드"로 대체 제안

## 7. shrimp-task-manager 연동

`DATA_DIR=shrimp_data/`로 연결되어 있으면:

- planner: ROADMAP의 각 Task를 `plan_task` → `split_tasks`로 등록
- updater: `list_tasks`/`query_task`로 로드맵 Task 제목·키워드에 대응하는
  shrimp task를 찾는다. **`verify_task`는 대상 task가 `in_progress` 상태여야만
  호출 가능** — `pending`이면 먼저 `execute_task(taskId)`로 전환한 뒤
  `verify_task(taskId, score, summary)`를 호출한다. `update_task`에는 `status`
  파라미터가 없어 상태를 바꿀 수 없다. 상태를 `completed`로 전환하는 유일한
  경로는 `verify_task`이며, `score >= 80`이면 자동으로 완료 전환된다.
  `update_task`는 완료 처리가 아니라 relatedFiles 등 부가 정보 수정에만 쓴다
- `score`는 §5 완료 판정 기준을 모두 충족했을 때만 이 경로를 타므로 90으로
  고정한다. `summary`(30자 이상 필수)는 ROADMAP에 적는 `> 변경 사항 요약`
  문장을 재사용하고, 30자 미만이면 보강한다
- 대응 shrimp task를 못 찾거나 `verify_task` 호출이 실패하면(dependencies
  미완료 등) **`docs/ROADMAP.md` 갱신은 그대로 유지**하고 shrimp 동기화 실패
  사실만 보고에 명시한다 — ROADMAP 완료 처리를 shrimp 실패로 되돌리지 않는다
- **`docs/ROADMAP.md`와 shrimp task 목록을 항상 일치시킨다**
- 미연결이면 `docs/ROADMAP.md`의 체크박스가 유일한 추적 수단

---

# 오케스트레이션

메인 스레드가 두 에이전트를 라우팅·조율하는 절차. 두 에이전트는 동시에 돌지 않고
`docs/ROADMAP.md` 파일 하나를 사이에 두고 이어진다 — planner가 빈 박스로 Task를
만들고, updater가 완료 시 채운다. `Agent` 도구로 직접 호출하고 반환값으로 결과를
수집한다.

## 실행 모드: 서브 에이전트

## 에이전트 구성

| 에이전트        | subagent_type     | model  | 역할                                | 쓰기 범위                         |
| --------------- | ----------------- | ------ | ----------------------------------- | --------------------------------- |
| roadmap-planner | `roadmap-planner` | opus   | PRD → ROADMAP 생성·확장, Task 명세  | `docs/ROADMAP.md`, `docs/specs/*` |
| roadmap-updater | `roadmap-updater` | sonnet | 완료 검증 + 상태 표기·요약·우선순위 | `docs/ROADMAP.md`만               |

두 에이전트는 시작 시 이 파일의 `## 기준` 섹션을 읽는다.

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
3. **범위 파악:** updater 경로면 사용자가 언급한 Task 번호를 추출한다. 없으면
   "최근 작업 전체"로 넘기고 updater가 `git diff`로 범위를 추정하게 한다

### Phase 1a: planner 경로

`Agent(subagent_type: "roadmap-planner", model: "opus")` 호출. 담을 것:

- 지시 유형(신규 생성 / Phase 추가 / Task 추가 / 명세 HTML / 테스트 골격)
- 대상(어떤 기능·Phase·Task 번호), 기존 `docs/ROADMAP.md` 존재 여부

반환을 받으면 Phase 3으로.

### Phase 1b: updater 경로

`Agent(subagent_type: "roadmap-updater", model: "sonnet")` 호출. 담을 것:

- 검증 범위(Task 번호 목록 또는 "최근 작업 전체")
- 사용자가 "끝났다"고 말한 항목 원문, 완료 처리 취소 요청이면 대상 Task와 사유

반환을 받으면 Phase 2로.

### Phase 2: 검증 결과 점검 (updater 경로만)

- **검증 불가 / 부분 완료 항목**은 그대로 사용자에게 전달(강제 완료 안 함)
- 사용자가 특정 항목을 "그건 아직 아니다"라고 하면 그 Task 범위만 좁혀 **1회**
  updater 재호출(상태 복원). 2회째도 판정 불가면 중단하고 사용자 판단에 맡긴다

### Phase 3: 보고

- planner: 추가/변경된 Phase·Task, 지정된 우선순위, PRD 불일치·미결정 사항
- updater: `✅` 처리된 항목, 검증 방법(실행 테스트·조회 심볼), 부분 완료·검증 불가
  항목, 새 우선순위 Task, shrimp 동기화 결과(성공/실패, 대상 taskId)
- 산출물 경로(`docs/ROADMAP.md`, 새 `docs/specs/*.spec.html`)를 명시
- 파일 수정만 하고 커밋은 하지 않는다("커밋하려면 `commit` 스킬" 안내)

## 에러 핸들링

| 상황                              | 대응                                                   |
| --------------------------------- | ------------------------------------------------------ |
| planner가 PRD 불완전 보고         | 부족 항목을 사용자에게 그대로 전달, 진행 중단          |
| updater 테스트 실행 실패          | 해당 Task 완료 처리 안 함, "검증 불가" 사유 전달       |
| 라우팅 애매(생성인지 갱신인지)    | 사용자에게 한 줄 확인 후 진행                          |
| 에이전트 1회 실패                 | 1회 재호출. 재실패 시 부분 결과로 보고하고 미완료 명시 |
| updater가 "새 Task 필요" 반환     | planner를 이어서 호출할지 사용자에게 확인              |
| shrimp verify_task 실패/매칭 실패 | `docs/ROADMAP.md`는 완료 유지, 동기화 실패 사실만 보고 |

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
   → `list_tasks`로 대응 shrimp task 검색 → `verify_task` 호출(`score: 90`) →
   `completed` 전환 확인
4. Phase 2 → 검증 불가 항목 없음
5. Phase 3 → 완료 항목·검증 방법·새 우선순위 보고

### 에러 흐름

1. 사용자: "Task 005 auth 끝났어, 완료 처리해줘"
2. Phase 1b → updater가 `pnpm --filter api test`에서 auth UseCase 테스트 3개 실패 확인
3. updater 반환: "검증 불가 — auth 완료 처리 안 함, 실패 테스트 3건"
4. Phase 2 → 검증 불가 항목을 사용자에게 전달, `docs/ROADMAP.md`는 Task 005 대기 유지
5. Phase 3 → "Task 005는 테스트 통과 후 재요청 필요" 보고
