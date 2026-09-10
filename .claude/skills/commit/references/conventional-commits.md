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

본문은 넣지 않는다. 커밋은 제목 한 줄이 전부다. 이유·맥락은 PR 설명에 쓴다.

```
fix(mqtt): reconnect with 2s backoff on broker drop   ← 이게 전부
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

## revert

revert는 이 하네스가 아니라 직접 처리한다. `git revert`가 만드는 기본 메시지를
제목 한 줄로 줄이고(`git revert --no-edit` 후 `git commit --amend -m`), 되돌린
사유는 PR 설명에 쓴다.

## BREAKING CHANGE

제목은 그대로 `type(scope): subject`. 호환성이 깨진다는 사실과 마이그레이션
안내는 **PR 설명**에 `BREAKING CHANGE:` 단락으로 쓴다. 커밋 메시지에는 넣지 않는다.
