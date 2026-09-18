# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 작업 방식 (필수)

- **코드 탐색·분석·수정은 Serena MCP 도구를 우선 사용한다** (`mcp__plugin_serena_serena__*`). 심볼 단위 조회(`get_symbols_overview`, `find_symbol`), 참조 추적(`find_referencing_symbols`), 심볼 단위 편집(`replace_symbol_body`, `insert_after_symbol`)을 일반 파일 통독/문자열 치환보다 먼저 시도한다. 세션 시작 시 `activate_project` → `initial_instructions`를 호출한다.
- **구현 판단에는 ponytail 스킬을 우선 적용한다.** 모든 코딩 작업(작성·추가·리팩터·수정·리뷰·의존성 선택)에서 "가장 게으르지만 동작하는" 해법을 택한다: YAGNI → 기존 코드 재사용 → 표준 라이브러리 → 이미 설치된 의존성 → 한 줄. 새 추상화·보일러플레이트·투기적 유연성 금지.
- PRD(`docs/PRD.md`)의 Working Mode: **AI는 가이드 위주**, 파일 생성·구현은 사용자가 직접 한다. 단계별 파일 목록 + 시그니처 + 스펙 제시 → `mcp__shrimp-task-manager__*`로 task 등록 → 사용자 구현 → AI가 검증·완료. `apps/web`만 전담 서브에이전트가 코드 작성(의존성 설치는 사용자).
- 응답 언어 한국어, 커밋 메시지 영어.

## 명령어

패키지 매니저 **pnpm 8.15.5** (Node ≥18). 루트에서 turbo로 전체 실행:

```bash
pnpm dev          # 전체 dev 서버 (turbo, persistent) — web :3001, api :3000
pnpm build        # 전체 빌드. turbo `^build`로 packages 먼저
pnpm lint         # 전체 lint
pnpm test         # 전체 유닛 테스트 (jest)
pnpm test:e2e     # 전체 e2e
pnpm format       # prettier --write (루트 스크립트로만 존재)
```

앱/패키지 단위:

```bash
pnpm --filter api dev
pnpm --filter web check-types                 # tsc --noEmit
pnpm --filter @repo/api build                 # tsc -b — @repo/api 수정 후 필수 (Gotchas 참고)

# 단일 테스트 (apps/api: ts-jest, src/**/*.spec.ts 만)
pnpm --filter api exec jest src/app.controller.spec.ts
pnpm --filter api exec jest -t "테스트 이름 패턴"
```

e2e는 `apps/api/test/*.e2e-spec.ts`, `jest --config ./test/jest-e2e.json`.

## 구조 (큰 그림)

Turborepo + pnpm 워크스페이스 (`apps/*`, `packages/*`).

| 위치                         | 역할                                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `apps/api`                   | NestJS 11 (`nest start`/`nest build`), 포트 3000                                                                               |
| `apps/web`                   | Next.js 16 / React 19 App Router, 포트 3001 고정, `--turbopack`                                                                |
| `packages/api` (`@repo/api`) | **프론트·백 공용 순수 TS** — DTO/타입 (+ PRD 기준 MQTT 토픽 헬퍼). `@nestjs/*` import 금지. `tsc -b`로 빌드해 `dist/`를 export |
| `packages/eslint-config`     | 서브패스 export: `./base` `./nest-js` `./next-js` `./library` `./react-internal` `./prettier-base`                             |
| `packages/jest-config`       | `nestConfig`/`nextConfig` 등. `apps/api/jest.config.ts`가 그대로 재export                                                      |
| `packages/typescript-config` | `nestjs.json` / `nextjs.json` base tsconfig                                                                                    |
| `packages/ui` (`@repo/ui`)   | 스텁 React 컴포넌트 (`./src/*.tsx` 직접 export, 빌드 없음)                                                                     |

`@repo/api`는 `apps/api`와 `apps/web` 양쪽에서 import되는 **타입 계약의 단일 출처**다. 향후 web 컴포넌트가 이 타입으로 api 응답을 받고, api controller/service가 같은 DTO를 쓴다.

### 현재 상태 vs 목표

- **현재**: `create-turbo -e with-nestjs` 스타터에서 `links` 데모 모듈 제거 완료, `apps/web`은 스타터 랜딩 페이지.
- **목표**: `docs/PRD.md` — "로봇 운영 실습 시스템"(상태 Approved, 브랜치 `init-robot-management`). 확장 방향:
  - `apps/api/src/{auth,robots}/` — **NestJS 4-layer DDD**: Controller → `application/`(UseCase) → `domain/`(entity·VO·repository interface·port) → `infrastructure/`(Prisma repo, adapter)
  - Prisma + PostgreSQL (`prisma migrate`) — `User` / `Session` / `Robot` / `RobotEvent`. 로컬은 `docker-compose.yml`의 `postgres:17-alpine` 컨테이너 (`DATABASE_URL=postgresql://...`)
  - 인증: JWT access(httpOnly 쿠키, 15m) + `Session` 테이블 refresh 토큰 회전(DB엔 sha256 해시만)
  - MQTT: `@nestjs/microservices` **미사용**. `mqtt` 패키지 클라이언트로 직접 `robot/+/command/+`를 구독하는 인프라 어댑터(`MqttRobotCommandListener`) + state publish
  - `docker-compose.yml` 컨테이너 2개: EMQX (포트 1883 / 8083 / 18083) + PostgreSQL (포트 5432)
  - 전 API 응답 봉투 `{ success, data, error }` — `common/response.interceptor.ts` + `common/all-exceptions.filter.ts`
  - `@repo/api`에 `commandTopic()` / `stateTopic()` / `parseCommandTopic()` 토픽 헬퍼(프론트·백 공용)

## 컨벤션

- 들여쓰기 2칸, camelCase / 컴포넌트 PascalCase. `apps/web`은 `any` 금지 (`next lint --max-warnings 0`).
- 프론트 스택(PRD): Tailwind + shadcn/ui + Zustand + React Hook Form + Zod.
- `@repo/eslint-config/nest-js`는 `no-floating-promises`·`no-unsafe-argument`를 `warn`, `no-explicit-any`는 off.
- import 그룹 사이 빈 줄: 외부 → `@repo/*` → 로컬 (기존 파일 스타일).

## Gotchas

- **`@repo/api` 수정 후 재빌드 필수.** 소비 측이 `dist/`를 보므로 `pnpm --filter @repo/api build`(또는 `... dev` 워치) 없이는 옛 타입/코드가 잡힌다. `pnpm dev`는 turbo가 의존 그래프상 함께 띄운다.
- **CORS + 쿠키 인증**: `apps/api/src/main.ts`는 현재 `app.enableCors()`(전체 허용). 쿠키 인증을 붙이면 `enableCors({ origin: 'http://localhost:3001', credentials: true })`로 바꿔야 한다 — `*` + credentials는 브라우저가 거부.
- **Prisma**: PRD상 `apps/api`의 `build`·`postinstall`에 `prisma generate`를 추가해야 fresh clone `pnpm build`가 안 깨진다 (아직 미적용).
- 포트: api 3000, web 3001.
- 루트 `.env.local`의 `SLACK_WEBHOOK_URL`은 앱 설정이 아니라 `.claude/hooks/slack-notify.py`(Stop·권한요청 → Slack) 전용. `python3 .claude/hooks/slack-notify.py --selftest`로 검증.
- 루트 `.eslintrc.mjs`는 레거시(`apps/**`·`packages/**` 무시). 실제 lint는 각 워크스페이스의 flat config `eslint.config.mjs`.

## MCP 서버 (`.mcp.json`)

`playwright`, `context7`(HTTP), `sequential-thinking`, `shadcn`, `shrimp-task-manager`(DATA_DIR=`shrimp_data/`). Serena는 플러그인으로 제공.

## 하네스 (공통 모델)

각 하네스 = **주 스킬 1개**(`## 기준`/`## 리뷰 루브릭` + `## 오케스트레이션`) +
보조 스킬 + `.claude/agents/`의 에이전트 2개(생성 / 검증-REDO). 에이전트는 주 스킬을
경로로 참조하고 자기 섹션만 읽는다. 별도 `*-orchestrator` 스킬은 두지 않는다.

## 하네스: git commit

**목표:** 자연어 커밋 요청을 Conventional Commits + GitHub Flow 규칙의 검증된 커밋으로 변환 (생성 → 검증 → REDO).

**트리거:** "커밋해줘" 등 커밋 생성/수정 요청 시 `commit` 스킬 사용. 커밋 로그 조회·revert는 직접 처리.

**정책:** 하네스가 만드는 커밋에는 `Co-Authored-By` / `Claude-Session` / `🤖 Generated with` trailer를 넣지 않는다 (이 레포 한정, 세션 기본 attribution 지침 오버라이드). 커밋 메시지는 제목 한 줄만 — 본문·footer 없음, 이유·맥락은 PR 설명에. 로컬 커밋까지만, push는 명시 요청 시.

## 하네스: roadmap

**목표:** `docs/PRD.md` → `docs/ROADMAP.md` 생성·확장(planner)과 구현 후 완료 검증·상태 갱신(updater)을 분리 조율.

**트리거:** 로드맵 생성/Task 추가/명세 요청, 또는 "작업 끝났어 로드맵 갱신 / Task 완료 처리" 요청 시 `roadmap` 스킬 사용. 로드맵 내용 단순 조회는 직접 응답.

**정책:** 두 에이전트 모두 앱 구현 코드·`package.json`·의존성·`prisma migrate`를 건드리지 않는다. 쓰기는 `docs/ROADMAP.md` / `docs/specs/*.html` / (요청 시) 테스트 골격만. updater는 수락 기준을 코드베이스에서 실제 검증(Serena + 테스트/빌드 실행)한 항목만 `✅` 처리.

## 하네스: github PR

**목표:** 현재 브랜치의 커밋들을 `.github/pull_request_template.md` 기반 PR 초안으로 만들고(pr-writer), 루브릭 검증 + REDO 후(pr-reviewer), **최종 PASS일 때만** `gh`로 PR 생성(draft 아님).

**트리거:** "PR 올려줘", "이 브랜치 PR 만들어줘", "풀리퀘" 등 요청 시 `pr-review` 스킬 사용. PR 목록 조회·머지·revert는 직접 처리.

**정책:** pr-reviewer는 GitHub에 게시하지 않고 로컬 리포트만. PASS 전까지 GitHub에 아무것도 안 만듦. PASS 후 사용자 확인을 받고 `--draft` 없이 바로 리뷰 가능한 PR로 생성(머지는 사람이). 커밋 히스토리 문제는 `commit` 하네스로 넘긴다. 작업 트리가 dirty면 중단하고 `commit` 하네스 먼저 안내.

## 하네스: task guide 생성

**목표:** `docs/ROADMAP.md`의 특정 Task를 실행 가능한 스펙 HTML(`docs/specs/task-0NN-*.spec.html`)로 변환(writer → reviewer REDO 루프). Task 완료 처리는 다루지 않는다.

**트리거:** "Task 00N 실행해줘", "execute task N", "task N 시작해줘/작업해줘/가이드·스펙 뽑아줘" 요청 시 `task-guide-generate` 스킬 사용. Task 완료 처리·로드맵 갱신 요청은 `roadmap` 하네스로.

**정책:** 앱 코드(`.ts`/`.tsx`)·`package.json`·의존성·마이그레이션 절대 금지 — 고정 규칙, 매 실행 재질문 없음(PRD Working Mode 근거). 쓰기는 `docs/specs/*.spec.html`만. 스펙은 고정 4단계 템플릿(작업 개요/파일·디렉토리 구조/필드 가이드/최종 파일 결과)을 따르고, 디렉터리 트리는 반드시 `<pre>`(`<div>` 금지 — prettier가 공백을 재배치해 깨짐), 최종 파일 결과는 `<details>` 기본 접힘.

## 하네스: web 구현

**목표:** `docs/ROADMAP.md`의 FE Task(또는 자연어 FE 요청)를 `apps/web`에 실제 동작하는 코드로 구현(web-implementer)하고, 정적 검증(lint/type-check) + Playwright MCP 실동작 검증으로 채점(web-reviewer)해 REDO 루프를 돈다. 이 레포에서 **실제 앱 코드를 다루는 첫 구현 하네스**다.

**트리거:** "Task 00N 구현해줘", "웹 만들어줘", "대시보드 UI 만들어줘", "apps/web 작업해줘" 등 **실제 코드 작성** 요청 시 `web-implement` 스킬 사용. "Task N 실행해줘/스펙 뽑아줘"는 `task-guide-generate`(스펙 HTML만 산출)로 — 겹치지 않는다. Task 완료 처리는 `roadmap`, 커밋은 `commit` 하네스로.

**정책:** 쓰기 범위는 `apps/web/**`뿐(`apps/api`·`packages/*`·ROADMAP·PRD 금지). **의존성 설치 절대 금지** — `pnpm add`/`npx shadcn init`/`npx shadcn add` 실행 안 함, 필요하면 정확한 설치 명령과 함께 `BLOCKED` 반환하고 사용자가 직접 설치(PRD Working Mode 근거). 단위테스트는 이 하네스의 스코프 밖(E2E만) — `apps/web`에 테스트 러너가 없고 ROADMAP의 FE Task 완료 기준에도 단위테스트 항목이 없음(백엔드 Task는 Jest+e2e를 명시적으로 나눠 요구하는 것과 대비). 필요해지면 그때 reviewer에 가벼운 스텝으로 추가하거나 별도 판단.

## 하네스 변경 이력

| 날짜       | 변경 내용                                                                                                                                                                                                                              | 대상                                                                                                                   | 사유                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 2026-09-10 | commit 하네스 초기 구성 (commit-writer / commit-reviewer / commit-writer·commit-orchestrator 스킬)                                                                                                                                     | `.claude/agents/git/`, `.claude/skills/commit-*`                                                                       | -                                                                      |
| 2026-09-10 | roadmap 하네스 초기 구성 — `development-planner` 삭제 후 planner/updater 분리, `roadmap`·`roadmap-orchestrator` 스킬                                                                                                                   | `.claude/agents/planning/`, `.claude/skills/roadmap*`                                                                  | 생성·완료 처리 책임 분리                                               |
| 2026-09-10 | github PR 하네스 추가 (pr-writer / pr-reviewer / `pr-create`·`pr-review` 스킬)                                                                                                                                                         | `.claude/agents/git/pr-*`, `.claude/skills/pr-*`                                                                       | -                                                                      |
| 2026-09-10 | 오케스트레이션 병합 — `commit-orchestrator`→`commit`, `roadmap-orchestrator`→`roadmap` 주 스킬 내 `## 오케스트레이션` 섹션으로 흡수, 두 orchestrator 스킬 삭제                                                                         | `.claude/skills/`                                                                                                      | 하네스당 파일 1개로 유지보수 단순화                                    |
| 2026-09-10 | 루브릭 임계값 확정 — 본문/개요 재진술 판정 = 제목과 90% 이상 겹침, 개요 2문장·"왜" 필수, 원자성 디렉토리 상한 2, type 혼재 원칙 REDO                                                                                                   | `agents/git/commit-reviewer.md` §3, `skills/pr-review/SKILL.md` 항목 9                                                 | 통과/탈락 경계 정의                                                    |
| 2026-09-10 | commit 하네스 하드닝 — 커밋 메시지 제목 한 줄만(본문·footer 폐지, 맥락은 PR로), 비대화형 파일 손 재구성 금지, writer 구조적 미이행 시 `CANNOT_COMPLY` 에스컬레이션, commit-writer haiku→sonnet                                         | `skills/commit/SKILL.md`, `skills/commit/references/conventional-commits.md`, `agents/git/commit-{writer,reviewer}.md` | 마크다운 파손·본문 비대·REDO 소진 재발 방지                            |
| 2026-09-11 | github PR 하네스 — `--draft` 폐지(PASS 후 사용자 확인받고 바로 리뷰 가능한 PR 생성), `gh pr ready` 언급 제거, `## 작업 내용` 형식을 요약 1~2문장 + 개조식 불릿으로 규정(루브릭 항목 4·9 반영), pr-writer haiku→sonnet                  | `agents/git/pr-writer.md`, `skills/pr-create/SKILL.md`, `skills/pr-review/SKILL.md`, `CLAUDE.md`                       | draft 단계 불필요·작업 내용 가독성                                     |
| 2026-09-11 | task guide 생성 하네스 신설 — "Task N 실행해줘/execute task N"을 고정 4단계 템플릿(작업 개요/파일·디렉토리 구조/필드 가이드/최종 파일 결과 `<details>` 기본 접힘) 스펙 HTML로 변환. 앱 코드 미작성이 고정 규칙                         | `.claude/agents/dev/task-guide-{writer,reviewer}.md`, `.claude/skills/task-guide-generate/`, `CLAUDE.md`               | Task 001·002에서 즉석으로 반복하던 스펙 생성 절차 고정                 |
| 2026-09-17 | web 구현 하네스 신설 — Next.js 16/React 19/shadcn/Tailwind v4 FE 구현(web-implementer) + Playwright MCP 실동작 검증(web-reviewer). 실제 앱 코드(`apps/web`)를 쓰는 첫 하네스, 의존성 설치 금지·단위테스트 스코프 밖(E2E만)이 고정 규칙 | `.claude/agents/web/web-{implementer,reviewer}.md`, `.claude/skills/web-implement/`, `CLAUDE.md`                       | ROADMAP Task 004~008·013(프론트 전담 서브에이전트) 실행 담당 부재 해소 |
