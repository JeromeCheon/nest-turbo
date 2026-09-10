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
pnpm --filter api exec jest src/links/links.service.spec.ts
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

`@repo/api`는 `apps/api`와 `apps/web` 양쪽에서 import되는 **타입 계약의 단일 출처**다. web 서버 컴포넌트가 이 타입으로 api 응답을 받고(`apps/web/app/page.tsx` → `http://localhost:3000/links` fetch), api controller/service가 같은 DTO를 쓴다.

### 현재 상태 vs 목표

- **현재**: `create-turbo -e with-nestjs` 스타터 거의 그대로. `apps/api/src/links`는 인메모리 배열 + `TODO:` 문자열 스텁 데모, `apps/web`은 스타터 랜딩 페이지.
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
- 포트: api 3000, web 3001. `apps/web/app/page.tsx`가 api를 `localhost:3000`으로 하드코딩 fetch.
- 루트 `.env.local`의 `SLACK_WEBHOOK_URL`은 앱 설정이 아니라 `.claude/hooks/slack-notify.py`(Stop·권한요청 → Slack) 전용. `python3 .claude/hooks/slack-notify.py --selftest`로 검증.
- 루트 `.eslintrc.mjs`는 레거시(`apps/**`·`packages/**` 무시). 실제 lint는 각 워크스페이스의 flat config `eslint.config.mjs`.

## MCP 서버 (`.mcp.json`)

`playwright`, `context7`(HTTP), `sequential-thinking`, `shadcn`, `shrimp-task-manager`(DATA_DIR=`shrimp_data/`). Serena는 플러그인으로 제공.
