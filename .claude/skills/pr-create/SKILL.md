---
name: pr-create
description: >
  GitHub PR 초안 작성 표준. base/head 판별, `.github/pull_request_template.md`
  채우는 법, 제목 규칙, PR 유형 체크박스 매핑, `gh pr create` 사용법, 금지 사항을
  정의한다. pr-writer 에이전트가 PR 초안을 만들거나 최종 PR을 생성할 때 읽는다.
  PR 리뷰 루브릭·오케스트레이션은 `pr-review` 스킬에 있다.
---

# PR Create — pr-writer 전용 기준

현재 브랜치의 커밋들을 사람이 읽을 수 있는 PR로 옮기는 규칙. pr-writer는 이 파일을
읽고 `_workspace/pr-draft.md`를 만들고, 최종 승인 후 `gh`로 PR을 생성한다.

## 왜 이 규칙인가

PR 설명은 리뷰어가 diff를 읽기 전에 "무엇을 왜 바꿨는지"를 잡는 유일한 창구다.
커밋 메시지를 이어 붙인 것도, diff를 나열한 것도 아니다 — 변경 묶음 전체의 의도를
한 번에 전달해야 한다.

## 1. base / head 판별

```bash
git branch --show-current                    # head = 현재 브랜치
git rev-parse --abbrev-ref origin/HEAD       # 보통 origin/main → base = main
git log --oneline main..HEAD                 # PR에 담길 커밋
git diff main..HEAD --stat                   # 파일별 변경 규모
```

- base는 원칙적으로 `main`. `origin/HEAD`가 다른 걸 가리키면 그걸 따르고 초안에 명시
- `main..HEAD` 커밋이 0개면 PR을 만들지 않는다(pr-writer가 `BLOCKED` 반환)

## 2. 제목

- 형식: `<type>(<scope>): <summary>` — `commit` 스킬 §1의 type 어휘와 동일
- 브랜치 커밋들의 **지배적 type**을 고른다(기능 커밋이 하나라도 있으면 `feat`,
  전부 문서면 `docs` …)
- 변경 묶음 **전체**를 한 줄로 요약 — 특정 커밋 제목 하나를 베끼지 않는다
- 72자 이하, 명령형, 마침표 없음

## 3. `.github/pull_request_template.md` 채우기

템플릿을 그대로 읽어 섹션별로 채운다. 주석(`<!-- -->`)의 지시를 따른다.

| 섹션              | 채우는 법                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `## 개요`         | **무엇을 왜** 바꿨는지 2~4문장. "어떻게"(구현 디테일) 나열 금지 — 주석 지시대로. 관련 이슈 있으면 `#N` |
| `## PR 유형`      | 실제 diff에 해당하는 항목만 `- [x]`. 아래 매핑 표 참고. 여러 개 가능                                   |
| `## 작업 내용`    | `main..HEAD` 커밋을 사람이 읽을 단위로 묶어 불릿. 커밋 해시 나열 아님                                  |
| `## PR Checklist` | 정직하게 체크. 커밋 컨벤션을 실제로 지켰으면 첫 항목 `- [x]`. 테스트 여부를 사실대로                   |

### PR 유형 체크박스 ↔ 커밋 type 매핑

| 커밋 type                      | 체크할 템플릿 항목                |
| ------------------------------ | --------------------------------- |
| `feat`                         | 새로운 기능 추가                  |
| `fix`                          | 버그 수정                         |
| `style` (UI/CSS)               | CSS 등 사용자 UI 디자인 변경      |
| `style` (포맷팅), `chore` 사소 | 코드에 영향을 주지 않는 변경사항  |
| `refactor`                     | 코드 리팩토링                     |
| `docs` (주석)                  | 주석 추가 및 수정                 |
| `docs` (문서)                  | 문서 수정                         |
| `test`                         | 테스트 추가, 테스트 리팩토링      |
| `build`, `ci`                  | 빌드 부분 혹은 패키지 매니저 수정 |
| 파일/폴더 rename               | 파일 혹은 폴더명 수정             |
| 파일/폴더 삭제                 | 파일 혹은 폴더 삭제               |

## 4. `_workspace/pr-draft.md` 형식

```markdown
# Title

<type>(<scope>): <summary>

# Body

<채워진 템플릿 전문>
```

## 5. `gh pr create` (최종 PASS 후에만)

```bash
gh pr create --base main --draft \
  --title "<제목>" \
  --body-file _workspace/pr-body.md
```

- `--head` 생략 → 현재 브랜치. 필요 시 `gh`가 자동 push
- **항상 `--draft`** — ready 전환은 사람이 GitHub에서
- 생성 후 반환된 PR URL을 오케스트레이션에 넘긴다

## 6. 금지

- `gh pr merge` — 머지하지 않는다
- `gh pr ready` — 리뷰 통과 여부와 무관하게 pr-writer는 ready로 바꾸지 않는다
- `gh pr create --fill` — 커밋 메시지로 대충 채우지 않는다. 템플릿을 직접 채운다
- `git push --force` (any form)
- 커밋 수정/amend/rebase — PR 범위의 커밋 히스토리는 건드리지 않는다.
  리뷰어가 커밋 문제를 지적하면 `commit` 스킬로 넘긴다
- 리뷰(`_workspace/pr-review.md`) 없이 `gh pr create` 실행
