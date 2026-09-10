# Conventional Commits — 예시 모음

`SKILL.md` §1의 규칙을 구체 예시로 보강한다. 판단이 애매할 때만 로드한다.

## type 선택 결정 트리

```
동작이 바뀌었나?
├─ 아니오 → 포맷팅만? → style
│           구조만 개선? → refactor
│           문서만? → docs
│           테스트만? → test
│           빌드/의존성? → build   (CI 설정이면 ci)
│           그 외 설정/잡무? → chore
└─ 예 → 사용자가 체감하는 새 기능? → feat
        버그 수정? → fix
        성능 목적? → perf
        이전 커밋 되돌림? → revert
```

`feat`인지 `fix`인지 애매하면: 이전 상태가 "의도된 정상"이었으면 `feat`,
"의도에 반하는 결함"이었으면 `fix`.

## good / bad 대조

### 제목

| bad                                                                       | good                                                        | 이유                     |
| ------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------ |
| `Fixed login bug`                                                         | `fix(auth): reject expired refresh tokens`                  | type 없음, 과거형, 모호  |
| `feat: stuff`                                                             | `feat(web): add robot list card view`                       | subject가 내용을 안 담음 |
| `feat(api): Added new endpoint for creating robots and also fixed a typo` | `feat(api): add POST /robots endpoint` (+ 별도 `docs` 커밋) | 두 관심사, 너무 김       |
| `refactor(web): changes.`                                                 | `refactor(web): extract useRobotStore hook`                 | 마침표, 내용 없음        |

### 본문

**bad** — 제목 재진술:

```
fix(mqtt): reconnect on broker drop

Added reconnect logic for broker drop.
```

**good** — 왜/맥락:

```
fix(mqtt): reconnect on broker drop

The mqtt client emitted 'offline' when EMQX restarted and never
recovered, so all subsequent part clicks silently failed. Enable the
built-in reconnect with a 2s backoff and log each attempt so operators
can see the gap.
```

### 분할

**bad** — 한 커밋에 여러 관심사:

```
feat(auth): add JWT login, refactor user repo, update prettier config
```

**good** — 3커밋:

```
style: apply prettier to auth module
refactor(auth): move user lookup into UserRepository
feat(auth): add JWT login use case
```

순서도 의미 있다 — 포맷팅·리팩터를 먼저 두면 기능 커밋의 diff가 깨끗해진다.

## revert 형식

```
revert(web): remove optimistic robot status update

This reverts commit 3f2a1b0c.

The optimistic update showed "online" before the MQTT state message
arrived, which misled users when the broker was actually down. Revert
until we can distinguish "pending" from "confirmed".
```

## BREAKING CHANGE

```
feat(@repo/api): rename stateTopic() to robotStateTopic()

The old name collided with the session state helper and made imports
ambiguous across web and api.

BREAKING CHANGE: stateTopic() is now robotStateTopic(). Update all
call sites in apps/web and apps/api.
```
