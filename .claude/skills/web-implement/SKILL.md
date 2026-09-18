---
name: web-implement
description: >
  Next.js 16(App Router)/React 19/shadcn/ui/TailwindCSS v4 FE 구현 하네스.
  "Task 00N 구현해줘", "Task N 코드 작성", "웹 만들어줘", "대시보드 UI
  만들어줘", "apps/web 작업해줘", "이 컴포넌트 만들어줘" 등 **실제 코드 작성**
  요청 시 web-implementer가 `apps/web`에 코드를 쓰고, web-reviewer가
  정적 검증(lint/type-check) + Playwright MCP 실동작 검증으로 채점해
  PASS/REDO를 판정한다. 후속: "구현 다시", "이 부분만 다시 만들어줘",
  "web REDO"도 이 스킬로 처리. **"Task N 실행해줘"/"스펙 뽑아줘"는 스펙
  HTML만 만드는 `task-guide-generate` 스킬이 담당하며 이 스킬과 겹치지
  않는다.** Task 완료 처리(ROADMAP 갱신)는 `roadmap` 스킬, 커밋은 `commit`
  스킬. 이 파일은 `# 기준`(writer·reviewer 공용 규칙), `# 리뷰 루브릭`
  (reviewer가 읽는 채점 기준), `# 오케스트레이션`(메인 스레드가 두
  에이전트를 굴리는 절차)으로 나뉜다.
---

# Web Implement 하네스

`docs/ROADMAP.md`의 FE Task(또는 자연어 FE 요청)를 `apps/web`의 실제 동작하는
코드로 바꾸는 생성-검증 하네스. **의존성 설치는 절대 하지 않는다** —
`docs/PRD.md` Working Mode("`apps/web`만 전담 서브에이전트가 코드 작성,
의존성 설치는 사용자")를 그대로 따르는 고정 규칙이다.

---

# 기준

web-implementer와 web-reviewer가 같은 잣대로 움직이도록 하는 단일 출처.
규칙을 복사하지 말고 이 섹션을 참조한다.

## 0. 입력 우선순위

1. `docs/specs/task-0NN-*.spec.html`이 이미 있으면 **1순위 소스**로 쓴다 —
   `task-guide-generate` 하네스가 이미 PRD 근거·설계 결정·완성 코드를
   정리해 뒀으므로 재설계하지 않고 그대로 적용한다(중복 설계 방지)
2. 스펙이 없으면 `docs/ROADMAP.md`(해당 Task 블록) + `docs/PRD.md`(정확한
   필드·데이터 계약, ROADMAP과 충돌하면 PRD 우선)를 직접 읽는다
3. Task 번호 없이 자연어 요청("이 컴포넌트 만들어줘")도 처리한다 — 이때
   ROADMAP/PRD는 참고만

## 1. 쓰기 범위

`apps/web/**`만. `apps/api`, `packages/*`, `docs/ROADMAP.md`, `docs/PRD.md`는
절대 쓰지 않는다. `@repo/api`에 필요한 타입이 없으면 직접 고치지 말고
"packages/api에 `X` 타입 필요 — 별도 확인 요청" 노트로 남긴다.

## 2. 의존성 설치 절대 금지

`pnpm add`/`pnpm install`/`pnpm remove`, `npx shadcn init`, 신규 컴포넌트에
대한 `npx shadcn add <component>`(내부적으로 패키지 설치를 트리거함)를
**직접 실행하지 않는다.** 필요한 패키지/컴포넌트가 없으면:

1. shadcn MCP `search_items_in_registries`/`view_items_in_registries`로
   대상 컴포넌트를 찾는다
2. `get_add_command_for_items`로 정확한 설치 커맨드를 받는다
3. `BLOCKED: 의존성 필요 — <정확한 명령어>`로 반환한다(사용자가 직접 실행
   후 재요청)

## 3. 최신 문법 확인

Next.js 16 App Router, React 19, Tailwind v4(CSS-first `@import
"tailwindcss"`, `@tailwindcss/postcss`), shadcn/ui 관련 API는 학습 데이터가
오래됐을 수 있는 지점(신규 훅, v4 설정 문법 등)만 context7 MCP
(`resolve-library-id` → `query-docs`)로 먼저 확인한다. 확실히 아는 기초
문법까지 매번 조회하지 않는다(과잉 조회 금지).

## 4. 코드 탐색·편집은 Serena MCP 우선

`get_symbols_overview`/`find_symbol`/`find_referencing_symbols`로 기존
컴포넌트·훅·스토어를 먼저 찾아 재사용하고, 심볼 단위 편집
(`replace_symbol_body`/`insert_after_symbol`)을 파일 전체 재작성보다
우선한다(레포 CLAUDE.md 전역 규칙).

## 5. ponytail 원칙

YAGNI → 기존 컴포넌트/유틸 재사용 → shadcn 기본 컴포넌트 → 한 줄. 새
추상화·전역 상태·커스텀 훅은 실제 재사용 지점이 2곳 이상일 때만 만든다.
더미 데이터는 컴포넌트 파일 내 상수로 충분하면 별도 mock 레이어를 만들지
않는다.

## 6. 레포 컨벤션

`any` 금지(`next lint --max-warnings 0`), 2칸 들여쓰기, camelCase/
PascalCase, Tailwind + shadcn/ui + Zustand + React Hook Form + Zod 스택
고정(PRD §4.3), 반응형 필수, 다크모드는 Tailwind 토큰.

## 7. 완료 기준

ROADMAP Task의 체크리스트를 그대로 채택한다. 별도로 만들지 않는다.

## 8. 단위테스트는 이 하네스의 범위 밖

`apps/web`에 테스트 러너가 아직 없고, ROADMAP의 FE Task(004~008, 013)
완료 기준 어디에도 단위테스트 항목이 없다(반면 백엔드 Task 010~012는
Jest 단위 + Playwright e2e를 명시적으로 나눠 요구함 — 필요하면 이미
구분해서 명시하는 관례가 이 레포에 있다는 뜻). 테스트 러너 설치도 "의존성
설치는 사용자" 규칙에 걸리므로, 이 하네스는 Playwright MCP 실동작 검증만
다룬다. 사용자가 명시적으로 단위테스트를 요청하면 별도로 논의한다(이
하네스의 기본 동작이 아니다).

---

# 리뷰 루브릭

web-reviewer가 `apps/web` 변경사항을 채점하는 기준. 코드를 수정하지 않고
**판정만** 한다.

## 채점 항목 (PASS = 전부 충족)

1. **정적 검증** — `pnpm --filter web check-types`, `pnpm --filter web lint`
   둘 다 exit 0
2. **쓰기 범위 준수** — `git status --porcelain` 대조, `apps/web/**` 외
   변경 없음
3. **의존성 미실행 확인** — `package.json`/`pnpm-lock.yaml`이 writer
   단계에서 변경되지 않았는가(변경됐으면 규칙 위반 → REDO)
4. **실동작 검증(Playwright MCP)** — dev 서버(포트 3001, 이미 떠 있으면
   재사용/직접 기동했으면 검증 후 종료) → 대상 라우트 접속 → 해당 ROADMAP
   Task 완료 기준을 골든 패스로 실제 클릭/입력해 재현 → 최소 1개 엣지
   케이스 확인(빈 상태·유효성 에러·존재하지 않는 라우트 등) → 콘솔 에러
   없음(`browser_console_messages`)
5. **ponytail 관점 코드 리뷰** — 불필요한 추상화/미사용 의존성/과도한
   전역 상태 없는지
6. **경계 사례는 통과 쪽으로** — 애매하면 REDO 대신 PASS, 단 실동작 검증
   (4번)은 예외 없이 실제로 수행한다(건너뛰고 PASS 주지 않는다)

## 판정 출력 → `_workspace/web-review.md`

```markdown
# Web Review — <대상 Task/요청>

## 판정: PASS | REDO

## 항목별 결과

### 1. 정적 검증

- 판정 / (REDO면) 에러 위치 + 수정 지시

### 2~6. ...

## 종합

<전체 REDO 사유 1~3줄, 또는 PASS 확인 + 검증한 골든 패스/엣지 케이스 요약>
```

반환 첫 줄에 `PASS` 또는 `REDO`, 이어서 3~5줄 요약.

---

# 오케스트레이션

메인 스레드가 두 에이전트를 굴리는 절차. web-implementer와 web-reviewer는
동시에 돌지 않고 `apps/web`의 실제 파일 / `_workspace/web-review.md`
파일을 사이에 두고 이어진다.

## 실행 모드: 서브 에이전트

## 에이전트 구성

| 에이전트        | subagent_type     | model  | 읽는 스킬 섹션  | 역할                                           |
| --------------- | ----------------- | ------ | --------------- | ---------------------------------------------- |
| web-implementer | `web-implementer` | sonnet | `# 기준`        | 스펙/ROADMAP/PRD 기반 apps/web 코드 작성       |
| web-reviewer    | `web-reviewer`    | sonnet | `# 리뷰 루브릭` | 정적 검증 + Playwright 실동작 검증 → PASS/REDO |

두 에이전트는 시작 시 이 파일의 자기 섹션만 읽는다.

## 워크플로우

### Phase 0: 컨텍스트 확인

1. 요청에서 Task 번호를 파싱한다(있으면 "003"으로 정규화, 없으면 자연어
   요청 그대로 사용)
2. Task 번호가 있는데 `docs/ROADMAP.md`에 없으면 **중단**, "ROADMAP에
   Task N이 없습니다. `roadmap` 스킬로 먼저 추가하세요" 안내
3. `docs/specs/task-0NN-*.spec.html` 존재 여부 확인 → 있으면 Phase 1에서
   writer에게 경로 전달
4. **선행 의존성 개략 확인** — `apps/web/package.json`에 tailwindcss/
   shadcn 관련 기본 패키지가 전혀 없는 첫 실행(Task 004 이전 상태)이면,
   바로 writer를 부르지 않고 "먼저 Tailwind v4 + shadcn init이
   필요합니다" 안내와 함께 Phase 1을 1회만 "설치 명령 조사 전용"으로
   호출(`BLOCKED` 응답을 기대)하고 종료
5. `_workspace/web-review.md`가 이전 실행 잔재면 삭제

### Phase 1: 구현

`Agent(subagent_type: "web-implementer", model: "sonnet")` 호출. 담을 것:

- Task 번호 또는 자연어 요청
- 스펙 경로(있으면)
- REDO 재실행이면 `_workspace/web-review.md` 경로

반환에서 확인: `BLOCKED: ...` 여부, 변경 파일 목록. BLOCKED면 REDO 루프
진입 없이 즉시 사용자에게 설치 안내 후 중단.

### Phase 2: 검증

`Agent(subagent_type: "web-reviewer", model: "sonnet")` 호출. 담을 것:

- 변경된 파일 목록
- 대상 라우트/완료 기준

반환 첫 줄이 `PASS`/`REDO`.

### Phase 3: REDO 루프

- `PASS` → Phase 4
- `REDO` → `_workspace/web-review.md`를 실어 writer 재호출(Phase 1) → 다시
  Phase 2. **최대 2회**
- 2회 후에도 `REDO` → 코드는 그대로 두고, 미해결 항목을 사용자에게 보고,
  판단을 넘긴다

### Phase 4: 보고

- 변경 파일 목록과 완료 기준 충족 여부 보고
- "ROADMAP 완료 처리는 `roadmap` 스킬로", "커밋은 `commit` 스킬로" 안내
- 파일 수정만 하고 커밋은 하지 않는다

## 에러 핸들링

| 상황                            | 대응                                                   |
| ------------------------------- | ------------------------------------------------------ |
| Task 번호가 ROADMAP에 없음      | 중단, `roadmap` 스킬로 Task 추가부터 안내              |
| 의존성/컴포넌트 미설치(BLOCKED) | REDO로 세지 않고 즉시 설치 명령 안내 후 중단           |
| 포트 3001 이미 사용 중          | reviewer가 기존 서버로 간주해 재사용, 종료하지 않음    |
| 2회 REDO 후에도 미달            | 코드 보존, 미해결 항목 사용자에게 판단 요청            |
| lint/type-check 실패            | REDO 사유로 reviewer가 구체 에러 위치 인용             |
| writer/reviewer 1회 실패        | 1회 재호출. 재실패 시 부분 결과로 보고하고 미완료 명시 |

## 테스트 시나리오

### 정상 흐름

1. 사용자: "Task 007 구현해줘"
2. Phase 0 → ROADMAP에 Task 007 존재 확인, 스펙 없으면 ROADMAP+PRD 직접
   사용
3. Phase 1 → web-implementer가 대시보드 리스트/카드 토글 + 등록 Dialog
   구현
4. Phase 2 → web-reviewer가 lint/type-check 통과 확인 후 dev 서버 기동,
   Playwright로 토글 클릭 + Dialog 제출 재현 → `PASS`
5. Phase 4 → 변경 파일 보고 + "완료 처리는 `roadmap` 스킬로" 안내

### REDO 흐름 (콘솔 에러)

1. Phase 1 → writer가 구현했지만 브라우저 콘솔에 에러 발생하는 코드 포함
2. Phase 2 → reviewer가 Playwright 검증 중 콘솔 에러 발견 → `REDO`
3. Phase 3 → `_workspace/web-review.md` 실어 writer 재호출 → 에러 수정
4. Phase 2 재검증 → `PASS`
5. Phase 4 → 보고

### 에러 흐름 (의존성 미설치)

1. 사용자: "Task 004 구현해줘" (Tailwind/shadcn 아직 미설치 상태)
2. Phase 0 → 의존성 개략 확인에서 tailwindcss 패키지 전무 확인
3. Phase 1 → writer가 필요한 정확한 설치 명령을 `BLOCKED`로 반환
4. 사용자에게 설치 명령 안내 후 중단(REDO 루프 진입 안 함)
