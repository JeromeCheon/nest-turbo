# 로봇 운영 실습 시스템 개발 로드맵

휴머노이드 로봇의 부위를 클릭하면 실제 MQTT 왕복이 일어나는 풀스택 실습 시스템.

## 개요

로봇 운영 실습 시스템은 학습용 프로젝트로 다음 기능을 제공합니다:

- **회원가입 / 로그인**: JWT access 쿠키 + PostgreSQL `Session` refresh 회전
- **로봇 대시보드**: 등록된 로봇을 리스트/카드뷰로, 상태 배지 포함
- **로봇 상세 + MQTT**: 인라인 SVG 휴머노이드 6부위 클릭 → 브라우저가 브로커에 publish → NestJS 구독 → `RobotEvent` 기록 → `robot/{id}/state` 되쏘기 → 화면 반짝임 + 로그 패널

기준 문서: [`docs/PRD.md`](./PRD.md)

## 개발 워크플로우

1. **작업 계획** — 코드베이스 현재 상태 파악, 이 `ROADMAP.md` 갱신, 우선순위 작업은 마지막 완료 작업 다음에 삽입
2. **작업 생성** — 고수준 명세, 대상 파일, 수락 기준, 구현 단계 포함. API/비즈니스 로직 작업은 "테스트 체크리스트" 필수
3. **작업 구현** — **구현·의존성 설치는 인간 개발자가 진행**. AI는 명세 HTML(`docs/specs/*.spec.html`) / 단위 테스트 골격 / 주석 가이드만 제공. `apps/web` 코드는 프론트 전담 서브에이전트가 작성. 각 단계 후 중단하고 지시 대기
4. **로드맵 갱신** — 완료 작업을 ✅로 표시. shrimp-task-manager MCP 연결 시 task 상태를 이 문서와 동기화하고, 미연결이면 이 문서의 체크박스가 유일한 추적 수단

**상태 표기**: Phase `✅`(완료) · Task `✅ - 완료` / `- 우선순위` / (표기 없음, 대기) · 구현 사항 `- [x]`(완료) / `- [ ]`(미완료)

---

## 개발 단계

### Phase 1: 골격 + 공유 계약 구축

- **Task 001: 인프라 컨테이너 + 환경변수** ✅ - 완료
  - 구현 담당: 인간 개발자 · AI 산출물: `docs/specs/task-001-infra.spec.html`(요청 시)
  - [x] `docker-compose.yml`: `emqx/emqx:5`(포트 `1883` `8083` `18083`, 익명 허용) + `postgres:17-alpine`(포트 `5432`, env `POSTGRES_USER/PASSWORD/DB=robotops`, 명명 볼륨 `robotops_pgdata`, `pg_isready` healthcheck)
  - [x] `apps/api/.env.example`: `DATABASE_URL="postgresql://robotops:robotops@localhost:5432/robotops?schema=public"`, `JWT_SECRET`, `MQTT_URL="mqtt://localhost:1883"`, `ACCESS_TOKEN_TTL=15m`, `REFRESH_TOKEN_TTL=7d`
  - [x] `apps/web/.env.local.example`: `NEXT_PUBLIC_API_URL="http://localhost:3000"`, `NEXT_PUBLIC_MQTT_WS_URL="ws://localhost:8083/mqtt"`
  - 완료 기준: `docker compose up -d` → EMQX 대시보드 `:18083` 접속 + `pg_isready` 통과
    > 변경 사항 요약: `docker-compose.yml`(emqx 5.8.8 + postgres:17-alpine healthcheck) + 양쪽 `.env.example` 생성, `docker compose ps`에서 두 컨테이너 Up(postgres healthy)·`pg_isready` 통과·`:18083` HTTP 200 재확인 완료.

- **Task 002: `@repo/api` 공유 타입 + MQTT 토픽 헬퍼** ✅ - 완료
  - 구현 담당: 인간 개발자
  - [x] `packages/api/src/entry.ts` export 추가: `RobotDto`, `RobotStatus`(union), `RobotPart`(union 6값), `AuthUserDto`, `RegisterDto`, `LoginDto`, `RobotEventDto`
  - [x] 토픽 헬퍼: `commandTopic(id, part)`, `stateTopic(id)`, `parseCommandTopic(topic)` — 순수 TS, `@nestjs/*` import 금지(`apps/web`도 소비)
  - 완료 기준: `pnpm --filter @repo/api build` 통과(소비 측이 `dist/`를 봄)
    > 변경 사항 요약: `packages/api/src/entry.ts`에 7종 DTO/union 타입 export, `packages/api/src/mqtt/topics.ts`에 `commandTopic`/`stateTopic`/`parseCommandTopic`(`@nestjs/*` 미의존) 구현. `pnpm --filter @repo/api build` 재확인 및 `dist/` 산출물에 반영됨을 확인.

- **Task 003: NestJS 모듈 골격 + Prisma 스키마 + 응답 봉투** - 우선순위
  - 구현 담당: 인간 개발자 · AI 산출물: 단위 테스트 골격(`common/*.spec.ts`)
  - [ ] `apps/api/src/{common,prisma,auth,robots,mqtt}` 디렉터리 + 빈 모듈/컨트롤러, `app.module.ts` 와이어링
  - [ ] `common/response.interceptor.ts`(성공 → `{ success:true, data, error:null }`), `common/all-exceptions.filter.ts`(예외 → `{ success:false, data:null, error:{ code, message } }`; class-validator → `code:"VALIDATION"`, 도메인 예외 → `code`: 클래스명 UPPER_SNAKE), `common/current-user.decorator.ts`
  - [ ] `apps/api/prisma/schema.prisma`: `datasource db { provider = "postgresql" }` + 모델 `User` / `Session` / `Robot` / `RobotEvent`(PRD §6). 마이그레이션 실행은 Phase 3
  - [ ] `apps/api/package.json`: `build`를 `prisma generate && nest build`로, `postinstall`에 `prisma generate` 추가
  - 완료 기준: `pnpm --filter api build` 통과(Prisma Client 생성 포함), 앱 부팅 시 라우트 목록에 빈 컨트롤러 노출

- **Task 004: 프론트 스캐폴딩 + 라우트 골격**
  - 구현 담당: 프론트 전담 서브에이전트 · **의존성 설치는 인간 개발자**
  - [ ] Tailwind v4(`@tailwindcss/postcss`) + shadcn/ui `init`
  - [ ] 스타터 잔재 정리: `app/page.module.css` 삭제, `app/globals.css` → Tailwind 지시문, `layout.tsx`의 `localFont`/`metadata` 정리
  - [ ] App Router 빈 페이지: `/register` `/login` `/dashboard` `/robots/[id]`, `middleware.ts` 골격(`access_token` 쿠키 확인 → 없으면 `/login`)
  - 완료 기준: `pnpm --filter web dev` 기동, 4개 라우트 200, `pnpm --filter web check-types` 통과

### Phase 2: UI/UX 완성 (더미 데이터)

- **Task 005: 공통 컴포넌트 라이브러리** - 우선순위
  - 구현 담당: 프론트 전담 서브에이전트
  - [ ] 상태 배지(`idle` / `active` / `error` / `offline`), 라이브 로그 패널(최근 50건), 연결 상태 인디케이터(`connected` / `connecting` / `disconnected`)
  - [ ] `<HumanoidRobot />` 인라인 SVG — 6부위 클릭 대상(`data-part`: `eyeLeft` `eyeRight` `armLeft` `armRight` `legLeft` `legRight`), hover 하이라이트, 클릭 반짝임(CSS)
  - 완료 기준: Storybook 없이 임시 페이지에서 6부위 클릭 이벤트 확인, 반응형/다크모드 토큰 적용

- **Task 006: 인증 페이지 UI (더미)**
  - 구현 담당: 프론트 전담 서브에이전트
  - [ ] `/register` `/login`: React Hook Form + Zod + shadcn `Form`
  - [ ] 에러 렌더(이메일 중복 / 비밀번호 불일치 / 네트워크) — 폼 상단 또는 필드
  - [ ] 제출 성공(더미: 항상 성공) → `/dashboard` 리다이렉트
  - 완료 기준: 유효성 검증 메시지 노출, 제출 중 버튼 disabled

- **Task 007: 대시보드 UI (더미)**
  - 구현 담당: 프론트 전담 서브에이전트
  - [ ] 리스트/카드 뷰 토글 — Zustand + `localStorage` 지속
  - [ ] 로봇별 상태 배지, 카드 클릭 → `/robots/[id]`
  - [ ] "로봇 등록" shadcn `Dialog` + 폼(더미: 로컬 상태에 추가)
  - [ ] 로딩 스켈레톤, Dialog 제출 중 버튼 disabled
  - 완료 기준: 하드코딩 더미 목록으로 두 뷰 전환·등록 UX 완결

- **Task 008: 로봇 상세 UI (더미, MQTT 미연동)**
  - 구현 담당: 프론트 전담 서브에이전트
  - [ ] `<HumanoidRobot />` 배치, 6부위 클릭 시 로그 패널에 더미 메시지 append + 반짝임
  - [ ] 연결 상태 인디케이터(더미 고정), EMQX 대시보드 링크
  - [ ] 더미 목록에 없는 `id` → `notFound()`
  - 완료 기준: 클릭 → 반짝 → 로그 흐름이 더미로 완결, 사용자 플로우 검증

### Phase 3: 핵심 기능 구현

- **Task 009: Prisma 마이그레이션 + `PrismaService`** - 우선순위
  - 구현 담당: 인간 개발자
  - [ ] Postgres 컨테이너 기동 후 `pnpm --filter api exec prisma migrate dev` — 4개 테이블 생성
  - [ ] `PrismaService`(`OnModuleInit` connect / `OnModuleDestroy` disconnect), 도메인 repository 인터페이스 ↔ Prisma 구현 배선 지점 확보
  - 테스트 체크리스트:
    - [ ] `prisma studio`로 테이블·컬럼 확인
    - [ ] 컨테이너 재시작 후 데이터 유지(명명 볼륨)

- **Task 010: `auth` 모듈 (4-layer DDD)**
  - 구현 담당: 인간 개발자 · AI 산출물: `docs/specs/task-010-auth.spec.html` + 단위 테스트 골격
  - [ ] `domain/`: `User`(`verifyPassword`), `Session`(`isActive` / `revoke` / `rotate`), `Email`·`PasswordHash` VO, `UserRepository`·`SessionRepository` interface, `PasswordHasher`·`TokenService` port
  - [ ] `application/`: `RegisterUserUseCase`(+ 로봇 3개 시드), `LoginUseCase`, `RefreshSessionUseCase`, `LogoutUseCase`, `GetMeUseCase`
  - [ ] `infrastructure/`: `PrismaUserRepository`, `PrismaSessionRepository`, `BcryptPasswordHasher`, `JwtTokenService`
  - [ ] `guards/JwtAuthGuard`(Passport JWT, 쿠키에서 access token 추출), `cookie-parser` 등록
  - [ ] `main.ts` CORS → `app.enableCors({ origin: 'http://localhost:3001', credentials: true })`
  - [ ] 로그인: access JWT(15m) + `Session` row(refresh sha256 해시, `expiresAt`, `userAgent`) + httpOnly·`SameSite=Lax` 쿠키 2개. refresh: 회전(기존 `revokedAt`, 새 row). logout: `revokedAt` + 쿠키 clear
  - 테스트 체크리스트:
    - [ ] Jest 단위: `Session.rotate`/`isActive`, `LoginUseCase` 실패 경로(도메인 예외), bcrypt 해시·검증, `RefreshSessionUseCase` 만료·revoke 거부
    - [ ] Playwright MCP e2e: `register → login → /auth/me → refresh → logout`
    - [ ] Playwright MCP e2e: access token 만료(15m) 후 401 → 자동 `/auth/refresh` → 재시도 무중단
    - [ ] 수동: API 재시작 후 로그인 유지(PostgreSQL `Session` 생존), logout 후 `/dashboard` → `/login`

- **Task 011: `robots` 모듈 (4-layer DDD)**
  - 구현 담당: 인간 개발자 · AI 산출물: `docs/specs/task-011-robots.spec.html` + 단위 테스트 골격
  - [ ] `domain/`: `Robot`(`applyCommand` → 어떤 status에서든 `active`), `RobotEvent`, `RobotPart`·`RobotStatus` VO, `RobotRepository`·`RobotEventRepository` interface, `RobotCommandPublisher` port
  - [ ] `application/`: `RegisterRobotUseCase`, `ListRobotsUseCase`, `GetRobotUseCase`(소유자 검증), `HandleRobotCommandUseCase`
  - [ ] `infrastructure/`: `PrismaRobotRepository`, `PrismaRobotEventRepository`
  - [ ] `controller`: `GET /robots`(`JwtAuthGuard`), `GET /robots/:id`(소유자 불일치 404), `POST /robots`(`{ name, model }` → `idle`)
  - 테스트 체크리스트:
    - [ ] Jest 단위: `Robot.applyCommand` 상태 전이, `RobotPart` 6값 검증, `GetRobotUseCase` 소유자 불일치
    - [ ] Playwright MCP e2e: 로그인 후 `GET /robots`, 남의 로봇 404, `POST /robots` 후 목록 반영

- **Task 012: MQTT 어댑터 (구독 + state publish)**
  - 구현 담당: 인간 개발자 · AI 산출물: `docs/specs/task-012-mqtt.spec.html` + 단위 테스트 골격
  - [ ] `mqtt/mqtt.module.ts`: `mqtt.connect(MQTT_URL)` 클라이언트 provider, 전역 export
  - [ ] `robots/infrastructure/MqttRobotCommandListener`: `OnModuleInit`에서 `robot/+/command/+` 구독, `'connect'` 이벤트마다 재구독. 토픽 파싱 → `HandleRobotCommandUseCase(robotId, part, payload, source:'web')`
  - [ ] `robots/infrastructure/MqttRobotCommandPublisher`(`RobotCommandPublisher` 구현): `publishState` → `robot/{id}/state`
  - [ ] auto-idle: 로봇당 타이머 1개(`Map`), 새 커맨드 시 `clearTimeout` + 재설정(디바운스), 5초 뒤 `status='idle'` publish + `RobotEvent(source:'system')`
  - 테스트 체크리스트:
    - [ ] Jest 단위: 토픽 파싱(`parseCommandTopic`), 디바운스 타이머(연타 시 타이머 1개 유지)
    - [ ] 수동/Playwright: EMQX 웹 클라이언트로 `robot/x/command/eyeLeft` publish → `RobotEvent` row + `robot/x/state` 되쏨 → 5초 뒤 `idle`

- **Task 013: 프론트 실연동 (더미 → 실제 API/MQTT)**
  - 구현 담당: 프론트 전담 서브에이전트
  - [ ] auth fetch 래퍼: 401 → `/auth/refresh` 1회 → 재시도, in-flight refresh 프로미스 1개 공유. RSC fetch는 쿠키 forward + 실패 시 `redirect('/login')`
  - [ ] `middleware.ts`: `access_token` 쿠키 확인 → 없으면 `/login`
  - [ ] 대시보드: 서버 컴포넌트 `GET /robots`(쿠키 forward), 등록 후 `router.refresh()`. 로드 시점 스냅샷(실시간 구독 없음)
  - [ ] 로봇 상세: 서버 컴포넌트 조회 → `notFound()`, 클라이언트 mqtt.js WS 연결(`NEXT_PUBLIC_MQTT_WS_URL`), 클릭 → `commandTopic` publish, `stateTopic` + `command/+` 구독 → 부위 반짝 + 로그 패널. `clientId`는 `localStorage` uuid. 연결 끊김 시 클릭 disabled
  - 완료 기준: 더미 제거, 실제 로그인 → 실제 목록 → 실제 MQTT 왕복

- **Task 013-1: 통합 테스트**
  - 구현 담당: 인간 개발자(시나리오는 AI가 명세)
  - 테스트 체크리스트:
    - [ ] Playwright MCP 전체 플로우: 가입 → 로그인 → 대시보드 → 로봇 상세 → 왼쪽 눈 클릭 → EMQX 대시보드에 `command` 관측 → 로그 패널 outbound+inbound(~200ms) → 반짝임 → `RobotEvent` 기록
    - [ ] 엣지: 브로커 끊김(클릭 disabled), 401 자동 refresh, 남의 로봇 `notFound`, access token 만료 후 무중단

### Phase 4: 마무리

- **Task 014: 안정화 + 문서**
  - 구현 담당: 인간 개발자
  - [ ] 회원가입 시드 확인 — `("Atlas","AT-1")`, `("Nova","NV-2")`, `("Pixel","PX-3")` 모두 `idle`
  - [ ] status auto-idle 타이머 최종 확인
  - [ ] `README` Quickstart: `docker compose up -d` → `pnpm install` → `prisma migrate dev` → `pnpm dev`
  - 완료 기준: `pnpm lint && pnpm build` green, `apps/web`에 `any` 없음, 모든 API 응답 봉투 형태

- **Task 015: CI (선택)**
  - 구현 담당: 인간 개발자
  - [ ] GitHub Actions: `pnpm lint && pnpm build && pnpm test`

---

## 미결정 / PRD 열린 질문 (착수 전 확인)

- 구독 어댑터를 `mqtt/` 공용 클라이언트에 붙일지, `robots` 전용 클라이언트를 둘지 — 전자 권장 (Task 012)
- 기존 `links` 데모 모듈 유지/삭제 — 기능 영향 없음, Task 003에서 결정
- auto-idle 타이머는 API 인스턴스 1개 전제 — 다중 인스턴스 필요 시 `@nestjs/schedule`/큐로 승격 (범위 밖)
- EMQX authn/ACL — 실습용 익명 허용, 후속 과제
