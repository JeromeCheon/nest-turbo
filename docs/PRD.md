# PRD — 로봇 운영 실습 시스템 (Robot Ops Practice System)

- 상태: Approved
- 작성일: 2026-09-09
- 브랜치: `init-robot-management`
- 원본 설계: `~/.gstack/projects/JeromeCheon-nest-turbo/jaehongcheon-init-robot-management-design-20260909-164257.md`

---

## 1. 개요

`create-turbo -e with-nestjs` 스타터 상태의 Turborepo 위에, 회원가입/로그인을 갖추고
등록된 로봇들의 현황을 대시보드로 보여주며, 로봇 상세 페이지에서 화면에 그려진 휴머노이드
로봇의 부위(눈·팔·다리)를 클릭하면 실제 MQTT 메시지를 publish 하는 **실습용 시스템**을 만든다.

핵심 학습 목표:

- NestJS 4-layer DDD (Controller → UseCase → Domain → Repository)
- 인증: JWT access token + 서버 세션(refresh) 회전
- Prisma 마이그레이션 (PostgreSQL)
- 실제 MQTT 브로커를 통한 pub/sub 왕복 (브라우저 → 브로커 → 서버 → 브로커 → 브라우저)

## 2. 목표 / 비목표

### 목표

- 회원가입·로그인 후 대시보드에서 내 로봇 목록을 리스트/카드뷰로 확인
- 로봇 상세에서 SVG 휴머노이드의 6개 부위를 개별 클릭 → MQTT publish
- NestJS가 같은 브로커에 구독자로 붙어 커맨드를 수신 → 이벤트 기록 → 상태 되쏘기
- `docker compose up` 한 번 + `pnpm dev`로 로컬에서 전체 스택 구동

### 비목표

- 프로덕션 배포, CI/CD (선택적 lint/build 워크플로만 여지로 둠)
- 실제 하드웨어 로봇 제어, 액추에이터 시뮬레이션
- MQTT 인증/ACL (실습용 익명 허용)
- 다중 API 인스턴스, 수평 확장
- 결제, 조직/권한 관리, 알림

## 3. 사용자 시나리오

1. 사용자가 `/register`에서 이메일·비밀번호로 가입한다. 가입 시 로봇 3개가 시드된다.
2. `/login`에서 로그인하면 httpOnly 쿠키(access + refresh)가 설정되고 `/dashboard`로 이동한다.
3. 대시보드에서 로봇 목록을 리스트/카드뷰로 토글하며 본다. 각 로봇에 상태 배지가 보인다.
4. "로봇 등록" 버튼으로 다이얼로그를 열어 `name`, `model`을 입력해 새 로봇을 추가한다.
5. 로봇 카드를 클릭해 `/robots/[id]` 상세로 이동한다.
6. 상세 화면의 휴머노이드 SVG에서 왼쪽 눈을 클릭한다.
   - 브라우저가 `robot/{id}/command/eyeLeft`로 MQTT 메시지를 publish 한다.
   - NestJS 구독자가 수신 → `RobotEvent` 기록 → 로봇 상태 `active` → `robot/{id}/state` publish.
   - 브라우저가 `state`를 수신해 해당 부위를 반짝이고 로그 패널에 송·수신 메시지를 남긴다.
   - 5초 뒤 서버가 상태를 `idle`로 되돌린다.
7. EMQX 대시보드(`:18083`)에서 같은 메시지 흐름을 실시간으로 관찰한다.
8. `/auth/logout` 시 세션이 무효화되고 쿠키가 삭제되어 보호 라우트 접근 시 `/login`으로 리다이렉트된다.

## 4. 기능 요구사항

### 4.1 인증

| 항목      | 내용                                                                                                                                                                                                  |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 가입      | `POST /auth/register` — DTO 검증(class-validator), 이메일 중복 검사, bcrypt 해시, `User` 저장, 로봇 3개 시드                                                                                          |
| 로그인    | `POST /auth/login` — bcrypt 검증 → access JWT(15m) 발급 + `Session` row 생성(refresh 토큰 sha256 해시, `expiresAt` = now+7d, `userAgent`) + `access_token`·`refresh_token` httpOnly·SameSite=Lax 쿠키 |
| 내 정보   | `GET /auth/me` — `JwtAuthGuard` (Passport JWT, 쿠키에서 토큰 추출)                                                                                                                                    |
| 토큰 회전 | `POST /auth/refresh` — refresh 쿠키 해시로 `Session` 조회 → 만료·revoke 확인 → 회전(기존 `revokedAt` 세팅, 새 row 생성) → 새 access JWT + 새 refresh 쿠키                                             |
| 로그아웃  | `POST /auth/logout` — 현재 세션 `revokedAt` 세팅, 두 쿠키 clear                                                                                                                                       |
| 만료 처리 | 클라이언트 fetch 래퍼: 401 → `/auth/refresh` 1회 → 성공 시 원요청 재시도, 실패 시 `/login`. in-flight refresh 프로미스 1개 공유(중복 회전 방지). RSC fetch도 동일, 실패 시 `redirect('/login')`       |

### 4.2 대시보드 (`/dashboard`)

- 서버 컴포넌트가 `GET /robots`(쿠키 forward)로 내 로봇 목록 조회 — **로드 시점 스냅샷**(실시간 구독 없음)
- 클라이언트 컴포넌트가 리스트/카드뷰 토글 (Zustand + localStorage 지속)
- 로봇별 상태 배지: `idle` / `active` / `error` / `offline`
- "로봇 등록" shadcn `Dialog` + RHF/Zod 폼 → `POST /robots` → 성공 시 `router.refresh()`
- 로딩 스켈레톤, 제출 중 버튼 disabled

### 4.3 로봇 상세 (`/robots/[id]`)

- 서버 컴포넌트가 로봇 조회 → 없거나 내 로봇이 아니면 `notFound()`
- `<HumanoidRobot />` 인라인 SVG — 클릭 가능한 6부위: `eyeLeft`, `eyeRight`, `armLeft`, `armRight`, `legLeft`, `legRight` (`data-part` 속성)
- `NEXT_PUBLIC_MQTT_WS_URL`로 mqtt.js WS 연결
- 부위 클릭 → `commandTopic(id, part)`로 publish, payload `{ ts, clientId, action: "click" }`
- `stateTopic(id)` 및 `robot/{id}/command/+` 구독 → 해당 부위 CSS 반짝임 + 로그 패널(최근 50건)
- `clientId`는 localStorage UUID (없으면 생성)
- 연결 상태 인디케이터: `connected` / `connecting` / `disconnected` — 끊긴 동안 클릭 버튼 disabled (mqtt.js 자동 재연결에 맡기되 UI는 직접 반영)
- EMQX 대시보드 링크

### 4.4 로봇 CRUD (API)

| 엔드포인트        | 설명                                   |
| ----------------- | -------------------------------------- |
| `GET /robots`     | `JwtAuthGuard` — 내 로봇 목록          |
| `GET /robots/:id` | 내 로봇 단건, 소유자 불일치 시 404     |
| `POST /robots`    | `{ name, model }` — 상태 `idle`로 생성 |

## 5. 아키텍처

### 5.1 모노레포 구조

```
docker-compose.yml            # emqx/emqx:5 (1883, 8083, 18083) + postgres:17-alpine (5432)
apps/api/                     # NestJS 11
  prisma/schema.prisma
  .env(.example)              # DATABASE_URL, JWT_SECRET, MQTT_URL, ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL
  src/
    common/                   # response.interceptor, all-exceptions.filter, current-user.decorator
    prisma/prisma.service.ts
    auth/                     # controller + application/ + domain/ + infrastructure/ + guards/
    robots/                   # controller + application/ + domain/ + infrastructure/
    mqtt/mqtt.module.ts       # mqtt.connect(MQTT_URL) 클라이언트 provider (전역)
    app.module.ts
apps/web/                     # Next.js 16 / React 19 (포트 3001) — 전담 서브에이전트
  .env.local(.example)        # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_MQTT_WS_URL
packages/api/src/             # @repo/api — 공유 타입 + 토픽 헬퍼 (순수 TS, @nestjs/* import 금지)
```

### 5.2 NestJS 4-layer DDD

**auth 모듈**

- `application/`: `RegisterUserUseCase`, `LoginUseCase`, `RefreshSessionUseCase`, `LogoutUseCase`, `GetMeUseCase`
- `domain/`: `User`(entity: `verifyPassword`), `Session`(entity: `isActive` / `revoke` / `rotate`), `Email`·`PasswordHash`(VO), `UserRepository`·`SessionRepository`(interface), `PasswordHasher`·`TokenService`(port)
- `infrastructure/`: `PrismaUserRepository`, `PrismaSessionRepository`, `BcryptPasswordHasher`, `JwtTokenService`
- `guards/`: `JwtAuthGuard` (Passport JWT strategy, 쿠키에서 access token 추출)

**robots 모듈**

- `application/`: `RegisterRobotUseCase`, `ListRobotsUseCase`, `GetRobotUseCase`, `HandleRobotCommandUseCase`
- `domain/`: `Robot`(entity: `applyCommand` → 어떤 status에서든 `active`), `RobotEvent`(entity), `RobotPart`·`RobotStatus`(VO), `RobotRepository`·`RobotEventRepository`(interface), `RobotCommandPublisher`(port)
- `infrastructure/`: `PrismaRobotRepository`, `PrismaRobotEventRepository`, `MqttRobotCommandPublisher`(port 구현, state publish), `MqttRobotCommandListener`(`OnModuleInit` 구독 어댑터 → `HandleRobotCommandUseCase`)

**MQTT 인바운드 방식**: `@nestjs/microservices` 트랜스포트를 쓰지 않는다. `mqtt` 패키지 클라이언트로
직접 구독하는 평범한 인프라 어댑터(`MqttRobotCommandListener`)가 `robot/+/command/+`를 구독하고
UseCase를 호출한다. `'connect'` 이벤트마다 재구독한다.

### 5.3 공유 타입 (`@repo/api`)

- 타입: `RobotDto`, `RobotStatus`(union), `RobotPart`(union, 6값), `AuthUserDto`, `RegisterDto`, `LoginDto`, `RobotEventDto`
- 토픽 헬퍼: `commandTopic(id, part)`, `stateTopic(id)`, `parseCommandTopic(topic)` — 프론트·백 공용

## 6. 데이터 모델 (Prisma / PostgreSQL)

`schema.prisma`의 `datasource`는 `provider = "postgresql"`, `url = env("DATABASE_URL")`.
아래 모델은 provider와 무관하게 동일하다 — `String` / `DateTime` / `cuid()` / `@unique` /
`onDelete: Cascade` 모두 PostgreSQL에서 그대로 동작한다. SQLite → PostgreSQL 전환으로
바뀌는 것은 `datasource` 블록과 `DATABASE_URL`뿐이고 모델·마이그레이션 명령은 동일하다.

```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  createdAt    DateTime  @default(now())
  robots       Robot[]
  sessions     Session[]
}

model Session {
  id               String    @id @default(cuid())
  userId           String
  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  refreshTokenHash String    @unique  // 원문은 쿠키에만, DB엔 sha256 해시
  userAgent        String?
  expiresAt        DateTime
  createdAt        DateTime  @default(now())
  revokedAt        DateTime?
}

model Robot {
  id        String       @id @default(cuid())
  ownerId   String
  owner     User         @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  name      String
  model     String
  status    String       @default("idle")  // idle | active | error | offline
  createdAt DateTime     @default(now())
  events    RobotEvent[]
}

model RobotEvent {
  id        String   @id @default(cuid())
  robotId   String
  robot     Robot    @relation(fields: [robotId], references: [id], onDelete: Cascade)
  part      String   // eyeLeft | eyeRight | armLeft | armRight | legLeft | legRight
  source    String   // "web" | "system"
  payload   String   // JSON 문자열
  createdAt DateTime @default(now())
}
```

## 7. MQTT 토픽 스킴 & 왕복

| 방향              | 토픽                             | payload                                                         |
| ----------------- | -------------------------------- | --------------------------------------------------------------- |
| 브라우저 → 브로커 | `robot/{robotId}/command/{part}` | `{ "ts": <epoch ms>, "clientId": "<uuid>", "action": "click" }` |
| Nest → 브로커     | `robot/{robotId}/state`          | `{ "part": "<part>", "status": "<status>", "ts": <epoch ms> }`  |

`part ∈ { eyeLeft, eyeRight, armLeft, armRight, legLeft, legRight }`

**처리 흐름**

1. `MqttRobotCommandListener`가 `robot/+/command/+` 수신 → 토픽에서 `robotId`·`part` 파싱
2. `HandleRobotCommandUseCase(robotId, part, payload, source: 'web')`
   - `Robot.applyCommand(part)` → 로봇 단위 status `active` (로봇 없음/소유자 불일치 시 무시 + warn)
   - `RobotEvent` 저장 (`source: 'web'`)
   - `RobotCommandPublisher.publishState(...)` → `robot/{robotId}/state`
3. **auto-idle**: 로봇당 타이머 1개(Map). 새 커맨드 시 기존 타이머 `clearTimeout` 후 재설정(디바운스).
   5초 뒤 `status='idle'` publish + `RobotEvent(source:'system')`. 서로 다른 부위 연타 시 마지막 커맨드 기준 last-write-wins가 의도된 동작.

## 8. 인프라

- `docker-compose.yml`에 서비스 2개:
  - `emqx` — `emqx/emqx:5`. 포트 `1883:1883`(MQTT), `8083:8083`(WS, `/mqtt`), `18083:18083`(대시보드, 기본 `admin`/`public`). MQTT 익명 접속 허용(EMQX 5 기본값)
  - `postgres` — `postgres:17-alpine`. 포트 `5432:5432`. env `POSTGRES_USER=robotops` / `POSTGRES_PASSWORD=robotops` / `POSTGRES_DB=robotops`. 볼륨 `robotops_pgdata:/var/lib/postgresql/data`(재시작 후 데이터 유지). healthcheck `pg_isready -U robotops` — `docker compose up` 직후 `prisma migrate` 레이스 방지
  - `POSTGRES_USER`로 만들어지는 계정은 공식 이미지에서 superuser이므로 `prisma migrate dev`의 shadow DB 자동 생성/삭제가 그대로 동작한다

```yaml
services:
  emqx:
    image: emqx/emqx:5
    ports: ['1883:1883', '8083:8083', '18083:18083']
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: robotops
      POSTGRES_PASSWORD: robotops
      POSTGRES_DB: robotops
    ports: ['5432:5432']
    volumes: ['robotops_pgdata:/var/lib/postgresql/data']
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U robotops']
      interval: 3s
      timeout: 3s
      retries: 10
volumes:
  robotops_pgdata:
```

- `apps/api/.env`: `DATABASE_URL="postgresql://robotops:robotops@localhost:5432/robotops?schema=public"`, `JWT_SECRET`, `MQTT_URL="mqtt://localhost:1883"`, `ACCESS_TOKEN_TTL=15m`, `REFRESH_TOKEN_TTL=7d`
- `apps/web/.env.local`: `NEXT_PUBLIC_API_URL="http://localhost:3000"`, `NEXT_PUBLIC_MQTT_WS_URL="ws://localhost:8083/mqtt"`
- `apps/api` `main.ts`: `app.enableCors({ origin: 'http://localhost:3001', credentials: true })` (httpOnly 쿠키 인증에 필수, `*` 불가)
- `apps/api` `build` 스크립트에 `prisma generate` 추가, `postinstall`에도 추가 (fresh clone `pnpm build` 대비)
- 의존성 변화 없음 — Prisma가 PostgreSQL 쿼리 엔진을 내장하므로 `pg` 패키지 불필요. `provider = "postgresql"`로만 바꾼다

## 9. API 응답 포맷

모든 응답은 봉투 형태:

```jsonc
// 성공
{ "success": true,  "data": <payload>, "error": null }
// 실패
{ "success": false, "data": null, "error": { "code": "<CODE>", "message": "<메시지>" } }
```

- `common/response.interceptor.ts`가 성공 응답을 감쌈
- `common/all-exceptions.filter.ts`가 모든 예외를 봉투로 변환
  - class-validator 실패 → `code: "VALIDATION"`, `message`: 첫 위반 메시지
  - 도메인 예외 → `code`: 예외 클래스명(UPPER_SNAKE), `message`: 예외 메시지

## 10. 비기능 요구사항

- 프론트엔드 `any` 타입 금지, 반응형 필수, 다크모드는 Tailwind 기본 토큰
- 상태 처리: 로딩 / 빈 / 에러 / 연결끊김 모두 화면에 반영
- 폼 에러(이메일 중복, 비밀번호 불일치, 네트워크)를 사용자에게 표시 (응답 봉투의 `error.message`)
- 모든 백엔드 연산에 에러 핸들링
- CSRF: localhost 실습 기준 httpOnly + SameSite=Lax로 충분 (배포 시 오리진 검증/CSRF 토큰 추가 필요 — 범위 밖)

## 11. 결정 사항 & 열린 질문

### 결정됨

- 브로커: EMQX 단일 컨테이너 (WS 무설정, 대시보드 관찰용)
- ORM: Prisma + PostgreSQL (`prisma migrate`) — 로컬은 Docker Postgres 컨테이너
- 인증: JWT access(쿠키) + `Session` refresh 테이블 회전 (PostgreSQL)
- 인바운드 MQTT: `mqtt` 패키지 직결 구독 어댑터 (마이크로서비스 트랜스포트 아님)
- 브라우저는 상세 페이지에서 브로커에 직접 WS publish
- 로봇 등록 필드: `name` + `model`만, 상태는 `idle`로 생성
- 시드: 가입 시 유저당 로봇 3개 — `("Atlas","AT-1")`, `("Nova","NV-2")`, `("Pixel","PX-3")`
- status 라이프사이클: 커맨드 → `active`, 로봇당 디바운스 타이머 5초 뒤 `idle` (인메모리, 단일 인스턴스 전제)
- 라우트 보호: `apps/web/middleware.ts`에서 `access_token` 쿠키 확인

### 열린 질문

- 구독 어댑터를 `mqtt/` 공용 모듈 클라이언트에 붙일지, robots 전용 클라이언트를 둘지 — 전자 권장, 구현 시 확정
- EMQX authn/ACL 실습은 후속 과제
- 기존 `links` 데모 모듈 유지/삭제 — 기능 영향 없음, 구현 시 결정
- 다중 인스턴스/재시작 생존이 필요해지면 auto-idle 타이머를 `@nestjs/schedule` 또는 큐로 승격

## 12. 검증 기준 (Success Criteria)

1. `docker compose up -d` (emqx + postgres) + `pnpm install` + `pnpm dev` → web `:3001`, api `:3000`, EMQX 대시보드 `:18083`, Postgres `:5432` 접속됨. `prisma migrate dev`가 Postgres에 스키마 반영
2. 가입 → 로그인 → 대시보드 진입. 새로고침해도 로그인 유지. access token TTL(15m) 초과해도 401 → 자동 `/auth/refresh` → 재시도로 무중단. **API 재시작 후에도** 로그인 유지(PostgreSQL `Session` 생존). `/auth/refresh` 시 세션 회전 + 이전 row `revokedAt`
3. 대시보드에 시드 + 등록 로봇 표시, 리스트/카드 토글 동작, 상태 배지 렌더
4. 상세에서 왼쪽 눈 클릭 → EMQX 대시보드에 `robot/{id}/command/eyeLeft` 관측 → 로그 패널에 outbound + inbound `robot/{id}/state` ~200ms 내 표시 → 눈 반짝임 → `RobotEvent` row 기록
5. `POST /auth/logout` → 세션 `revokedAt`, 쿠키 clear, 보호 라우트 접근 시 `/login` 리다이렉트
6. 모든 API 응답이 봉투 형태. `pnpm lint`, `pnpm build` 통과. `apps/web`에 `any` 없음

## 13. 구현 순서 & Working Mode

### 구현 순서

| 단계 | 내용                                                                                                                                           | 검증                                                                                             |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1    | 인프라 + 공유 타입 — `docker-compose.yml`(emqx + postgres), `.env.example` ×2, `@repo/api` 타입·토픽 헬퍼                                      | `docker compose up` → EMQX 대시보드 접속 + `pg_isready`, `pnpm --filter @repo/api build` 통과    |
| 2    | API — Prisma + auth 모듈(DDD) — schema(`provider="postgresql"`), `prisma migrate dev`, `common/`, auth 4-layer, Passport JWT, CORS credentials | curl로 register/login/me/refresh/logout, API 재시작 후 세션 생존(Postgres)                       |
| 3    | API — robots 모듈(DDD) + MQTT 어댑터 — robots 4-layer, `mqtt/` 모듈, Listener/Publisher                                                        | EMQX 웹 클라이언트로 `robot/x/command/eyeLeft` publish → `RobotEvent` row + `robot/x/state` 되쏨 |
| 4    | Frontend (전담 서브에이전트) — Tailwind+shadcn 스캐폴딩 → auth 페이지 → dashboard → robot 상세                                                 | 클릭 → 반짝 → 로그 → EMQX 대시보드 왕복                                                          |
| 5    | 마무리 — 시드, auto-idle 타이머, README Quickstart                                                                                             | `pnpm lint && pnpm build` green                                                                  |

### Working Mode

- AI는 **가이드 위주**. 파일 생성·구현은 사용자가 직접 진행한다.
- AI 역할: 단계별로 파일 목록 + 시그니처 + 구현 스펙을 상세 제시 → shrimp task manager MCP로 task 등록 → 사용자 구현 → AI가 검증·완료.
- `apps/web`만 전담 서브에이전트(Next App Router / shadcn / Tailwind)가 코드 작성. 단 **dependency 설치는 사용자**가 하고, 구현 내용은 파일 단위로 세부 공유한다.
