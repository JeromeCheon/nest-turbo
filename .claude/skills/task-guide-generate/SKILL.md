---
name: task-guide-generate
description: >
  Task 실행 가이드 하네스. "Task 00N 실행해줘", "execute task N", "task N
  시작해줘", "task N 작업해줘", "task N 가이드/스펙 뽑아줘" 요청 시
  task-guide-writer가 `docs/ROADMAP.md`의 해당 Task를 `docs/specs/task-0NN-*.spec.html`로
  만들고, task-guide-reviewer가 루브릭으로 검증한 뒤 기준 미달이면 REDO를 돌린다.
  후속: "스펙 다시", "가이드 보완", "Task N 스펙 REDO"도 이 스킬로 처리. **Task
  완료 처리(로드맵 갱신)는 다루지 않는다 — 그건 `roadmap` 스킬.** 이 파일은
  `## 기준`(writer·reviewer 공용 규칙), `## 리뷰 루브릭`(reviewer가 읽는 채점
  기준), `## 오케스트레이션`(메인 스레드가 두 에이전트를 굴리는 절차)으로 나뉜다.
---

# Task Guide 하네스

`docs/ROADMAP.md`의 한 Task를 실행 가능한 스펙 HTML로 바꾸는 생성-검증 하네스.
**앱 코드는 절대 쓰지 않는다** — `docs/PRD.md` Working Mode("AI는 가이드 위주,
파일 생성·구현은 사용자가 직접")를 그대로 따르며, 매 실행마다 재확인하지 않는
**고정 규칙**이다.

---

# 기준

task-guide-writer와 task-guide-reviewer가 같은 형식·잣대로 움직이도록 하는
단일 출처. 규칙을 복사하지 말고 이 섹션을 참조한다.

## 0. 위치와 기준 문서

- 대상 문서: `docs/ROADMAP.md`(Task 원문) — 없는 Task 번호면 생성하지 않는다
- 근거 문서: `docs/PRD.md`(정확한 필드·데이터 계약. ROADMAP과 충돌하면 PRD 우선)
- 참고(있으면): shrimp-task-manager `get_task_detail`/`query_task` — 등록된 설명
  대조용. ROADMAP·PRD가 우선이고 shrimp는 참고만
- 산출물: `docs/specs/task-0NN-<slug>.spec.html`
- 스타일 기반: `references/spec-template.html` — 매번 이 파일을 시작점으로 삼는다

## 1. 왜 스펙만 산출하는가

`docs/PRD.md` "Working Mode"와 `CLAUDE.md` 작업 방식이 이미 "AI는 가이드 위주,
구현은 사용자"를 못 박아 뒀다. 이 하네스가 트리거될 때마다 "스펙만 vs AI가 직접
구현"을 재질문하지 않는다 — 항상 스펙만 산출한다. `apps/web` Task도 마찬가지로
코드화는 프론트 전담 서브에이전트 몫이지 이 하네스가 아니다.

## 2. 고정 4단계 템플릿 (이 순서, 전부 필수)

1. **작업 개요** — 목적 1~2문장 + 완료 기준 + 메타(Task 번호·의존성·구현 담당·
   shrimp ID 있으면)
2. **필요한 파일 및 디렉토리 구조** — `<pre class="tree">...</pre>` 필수.
   **`<div>`로 그리면 안 된다** — 이 레포 포맷터(prettier)가 `<div>` 내부
   whitespace를 저장 시 재배치해 트리가 깨진 실사고가 있다(Task 002). `<pre>`
   (및 `<script>`/`<style>`/`<textarea>`)만 내용을 그대로 보존한다
3. **각 파일 필드 정의 및 가이드** — 파일·타입별 필드 테이블(필드·타입·설명).
   설명은 PRD 근거를 우선 인용한다. PRD가 침묵하는 설계 판단(라이브러리 채택
   여부 등)은 "설계 결정"으로 표시하되 **실제 효용·비용 비교**를 적는다 —
   "정책이 그래서"만 쓰는 건 금지(Task 002 리뷰 피드백에서 확립된 기준)
4. **최종 파일 결과** — 파일마다 `<details><summary>경로</summary>`(네이티브
   disclosure, `open` 속성 없이 **기본 접힘**, JS 불필요) 안에 완성 코드. 그대로
   붙여넣기 가능해야 하고, 코드 안에 설명 주석을 넣지 않는다(설명은 3번 섹션 전담)

## 3. 스타일

`references/spec-template.html`의 CSS(라이트/다크 테마 대응 `:root`/
`prefers-color-scheme`, `.decision` 테이블, `.verdict` 박스, `.file-card`,
`details.file-card`의 삼각형 마커)를 그대로 재사용한다. 매번 처음부터 디자인하지
않는다 — 내용만 채운다.

## 4. 공통 금지 (writer 전용, reviewer는 검증만 하므로 해당 없음)

- `.ts`/`.tsx`/`.json`(`package.json` 등) 등 **앱 코드·설정 파일 작성 금지**
- `pnpm add`/`pnpm install`, `prisma migrate`/`generate` 등 실행 금지
- `docs/ROADMAP.md`/`docs/PRD.md` 임의 수정 금지(읽기 전용 입력)
- Task 완료 처리(`✅` 표기) 금지 — `roadmap` 하네스(roadmap-updater)의 역할
- 쓰기 허용 범위: `docs/specs/*.spec.html` 하나뿐

---

# 리뷰 루브릭

task-guide-reviewer가 **스펙 HTML**을 채점하는 기준. 스펙을 수정하지 않고
**판정만** 한다.

## 채점 항목 (PASS = 전부 충족)

1. **4단계 섹션 존재·순서** — 작업 개요 → 파일·디렉토리 구조 → 필드 가이드 →
   최종 파일 결과, 이 순서로 전부 있는가
2. **트리 다이어그램 태그** — `<pre>`(또는 동급 whitespace-safe 태그)인가.
   `<div>`면 실패
3. **설계 결정 근거** — "설계 결정"으로 표시된 항목에 실제 비교(효용/비용/대안)가
   있는가. "정책이라서"만 있고 비교가 없으면 실패
4. **`<details>` 기본 접힘** — 최종 파일 결과의 각 파일이 `<details>` 기반이고
   `open` 속성이 없는가
5. **코드 블록 순수성** — 붙여넣기를 방해하는 인라인 설명 주석이 없는가
6. **HTML 유효성** — `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('<path>').read())"`
   실행 시 파서 에러 없는가
7. **쓰기 범위 준수** — `git status --porcelain`으로 스펙 파일 외 변경이 없는가
   (특히 앱 코드 미작성 확인)

**경계 사례는 통과 쪽으로** — 설계 결정 근거가 한 문장이라도 실제 비교면 통과.
완전히 비교가 없을 때만 REDO.

## 판정 출력 → `_workspace/task-guide-review.md`

```markdown
# Task Guide Review — <스펙 파일 경로>

## 판정: PASS | REDO

## 항목별 결과

### 1. 4단계 섹션 존재·순서

- 판정 / (REDO면) 무엇이 어떻게 틀렸는지 + 수정 지시

...

## 종합

<전체 REDO 사유 1~3줄, 또는 PASS 확인>
```

반환 첫 줄에 `PASS` 또는 `REDO`, 이어서 3~5줄 요약.

---

# 오케스트레이션

메인 스레드가 두 에이전트를 굴리는 절차. task-guide-writer와 task-guide-reviewer는
동시에 돌지 않고 `docs/specs/*.spec.html` / `_workspace/task-guide-review.md`
파일을 사이에 두고 이어진다.

## 실행 모드: 서브 에이전트

## 에이전트 구성

| 에이전트            | subagent_type         | model  | 읽는 스킬        | 역할                            |
| ------------------- | --------------------- | ------ | ---------------- | ------------------------------- |
| task-guide-writer   | `task-guide-writer`   | opus   | `## 기준`        | ROADMAP+PRD 읽어 스펙 HTML 작성 |
| task-guide-reviewer | `task-guide-reviewer` | sonnet | `## 리뷰 루브릭` | 스펙 채점 → `PASS`/`REDO`       |

두 에이전트는 시작 시 이 파일의 자기 섹션만 읽는다.

## 워크플로우

### Phase 0: 컨텍스트 확인

1. 요청에서 Task 번호를 파싱한다("Task 003", "task 3", "execute task 3" 등 →
   `003`으로 정규화, ROADMAP 번호 체계에 맞춘다)
2. `docs/ROADMAP.md`에 해당 Task가 있는지 확인 — 없으면 **중단**, "ROADMAP에
   Task N이 없습니다. 먼저 `roadmap` 스킬로 Task를 추가하세요" 안내
3. `docs/specs/task-0NN-*.spec.html`가 이미 있으면 사용자에게 "덮어쓸까요, 새로
   만들까요?" 확인(재실행 시나리오)
4. `_workspace/task-guide-review.md`가 이전 실행 잔재면 삭제

### Phase 1: 스펙 생성

`Agent(subagent_type: "task-guide-writer", model: "opus")` 호출. 담을 것:

- Task 번호
- REDO 재실행이면 `_workspace/task-guide-review.md` 경로

반환에서 확인: `BLOCKED: ...` 여부, 산출 경로, 설계 결정으로 채운 항목.

### Phase 2: 검증

`Agent(subagent_type: "task-guide-reviewer", model: "sonnet")` 호출. 담을 것:

- 대상 스펙 파일 경로

반환 첫 줄이 `PASS`/`REDO`.

### Phase 3: REDO 루프

- `PASS` → Phase 4
- `REDO` → `_workspace/task-guide-review.md`를 실어 writer 재호출(Phase 1) → 다시
  Phase 2. **최대 2회**
- 2회 후에도 `REDO` → 스펙은 남겨두고, 미해결 항목을 사용자에게 보고, 판단을 넘긴다

### Phase 4: 보고

- 산출 경로(`docs/specs/task-0NN-*.spec.html`)와 요약(대상 Task, 4단계 섹션 확인,
  설계 결정 항목) 보고
- "구현은 이 스펙을 보고 직접 진행, 완료되면 `roadmap` 스킬로 완료 처리" 안내
- 파일 수정만 하고 커밋은 하지 않는다("커밋하려면 `commit` 스킬" 안내)

## 에러 핸들링

| 상황                     | 대응                                                   |
| ------------------------ | ------------------------------------------------------ |
| ROADMAP에 Task 번호 없음 | 중단, `roadmap` 스킬로 Task 추가부터 안내              |
| PRD 근거 부족            | writer가 "PRD 확인 필요" 노트로 표시, 중단하지 않음    |
| 스펙 이미 존재           | 덮어쓸지 새로 만들지 사용자 확인                       |
| 2회 REDO 후에도 미달     | 스펙은 보존, 미해결 항목 사용자에게 판단 요청          |
| writer/reviewer 1회 실패 | 1회 재호출. 재실패 시 부분 결과로 보고하고 미완료 명시 |

## 테스트 시나리오

### 정상 흐름

1. 사용자: "Task 003 실행해줘"
2. Phase 0 → ROADMAP에 Task 003 존재 확인
3. Phase 1 → task-guide-writer가 PRD §5.3 등을 근거로
   `docs/specs/task-003-*.spec.html` 생성
4. Phase 2 → task-guide-reviewer `PASS`
5. Phase 4 → 경로 보고 + "구현 후 `roadmap` 스킬로 완료 처리" 안내

### REDO 흐름 (트리 다이어그램이 `<div>`)

1. Phase 1 → writer가 실수로 `<div class="tree">`로 작성
2. Phase 2 → reviewer `REDO`(루브릭 2 위반)
3. Phase 3 → `_workspace/task-guide-review.md` 실어 writer 재호출 → `<pre>`로 수정
4. Phase 2 재검증 → `PASS`
5. Phase 4 → 보고

### 에러 흐름 (없는 Task 번호)

1. 사용자: "Task 099 실행해줘"
2. Phase 0 → ROADMAP에 Task 099 없음 → 중단
3. "ROADMAP에 Task 099가 없습니다. `roadmap` 스킬로 먼저 추가하세요" 안내
