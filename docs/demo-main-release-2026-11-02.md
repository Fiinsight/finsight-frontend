# 데모 전 main 이력 정리와 배포 순서

이 문서는 PR 검토와 머지 **후** 실행할 절차입니다. 이번 정리 작업에서는 PR만 생성하며 main 머지·운영 배포·환경변수 변경을 수행하지 않습니다.

## 확인한 운영 버전

| 저장소 | 현재 운영 커밋 | 운영 근거 | main 정리 대상 |
|---|---|---|---|
| frontend | `e1156a2042dc8f3acf7b2a5c0ce3609ae1d0c36a` | Expo Hosting production `v5keac5ci0`, `https://finsight-demo.expo.app` | `codex/home-news-more`: 운영 코드 + 아래 누락 수정 + 이 문서 |
| backend | `7997f1daa6d2bcc6feff808a236c345b3e62a0a9` | Render Live `dep-dbjva9942hec73e5trn0` | [backend #169](https://github.com/Fiinsight/finsight-backend/pull/169) |
| AI | `514a47e827fd758429a7d7ec9af94ac46b14a66b` | 위 backend의 `Dockerfile.render-free`가 고정한 ADD URL | [AI #68](https://github.com/Fiinsight/finsight-ai/pull/68) |

프론트 작업 1 수정 커밋은 `89e372f13b512e6e0a26bf64beabd4b89654fbe3`이며 **아직 운영에 배포하지 않았습니다**. 첫 더보기 클릭에서 화면에 잘린 핵심 브리핑과 관심종목 뉴스를 먼저 복원합니다. 이후 서버 페이지를 붙이고 id 중복을 제거합니다. 한국 날짜 또는 브리핑 id가 달라진 뒤 렌더링하면 페이지 상태를 새로 시작하고, 이전 요청의 응답은 새 목록에 반영되지 않습니다.

작업 1 검증: `npx tsc --noEmit`, `npm test` 163개 통과(실패·제외 0), `npx expo export --platform web` 성공. 6개 테스트를 추가했습니다. 상태를 초기화하지 않아야 하는 동일 id 응답과 이전 페이지의 지연 응답도 확인했습니다.

## 이력과 충돌

- 프론트 기준 main: `e484cb621c1e4b6084bddcaab87111b2ac3ae9ee`.
- 백엔드 기준 main: `1511caceb33bb1abc1dbe478dca59a4eaf9639d5`.
- AI 기준 main: `6aa00e999ea2ff2a54a66757a34ff8553cecb970`.
- 세 main 모두 대상 브랜치의 조상이며 `git merge-tree --write-tree` 검사에서 충돌이 없었습니다. 충돌 해결을 위해 운영 파일을 덮어쓴 작업은 없습니다. force push·main 직접 push도 하지 않습니다.
- **세 PR 모두 Create a merge commit 방식으로 머지**하여 운영 SHA를 main의 조상으로 보존하는 것을 권장합니다. Squash/Rebase로 머지하면 파일 내용은 같아도 아래 SHA 포함 관계 검사가 실패할 수 있습니다.
- 기존 스택 PR들은 자동으로 닫거나 base를 변경하지 않았습니다. 종합 PR 머지 후 중복된 기존 PR을 확인해 정리할 수 있습니다.

## 사용자 머지 순서

1. 세 종합 PR의 diff와 CI를 확인합니다. 백엔드는 `test`와 `prod-migrations`, AI는 pytest, 프론트는 타입 검사·테스트·web export를 확인합니다.
2. AI #68 → backend #169 → frontend 종합 PR 순서로 main에 머지합니다. 이 단계에서 배포하지 않으려면 기존 자동 배포 설정도 먼저 확인합니다.
3. AI 운영 SHA가 AI main에 포함되었는지 아래 명령으로 검증합니다. 포함되기 전에는 Dockerfile의 AI 고정값을 바꾸지 않습니다.
4. 확인된 **실제 AI main HEAD SHA**로 고정값을 교체하는 별도 backend PR을 생성합니다. 그 PR을 검토·머지한 다음 backend와 frontend를 main에서 배포합니다.

## AI 고정값 변경 PR — AI main 머지 후에만 생성

미래의 merge commit SHA를 추정해 넣거나 `main`이라는 움직이는 branch 이름으로 고정하지 않습니다. 현재 AI main에는 운영 SHA가 아직 없어 이 후속 PR은 지금 만들지 않습니다.

```sh
# finsight-ai 저장소에서
 git fetch origin
 git merge-base --is-ancestor 514a47e827fd758429a7d7ec9af94ac46b14a66b origin/main
 git rev-parse origin/main
```

첫 명령의 포함 관계 검사가 실패하면 중단합니다. 성공하면 마지막 명령의 전체 40자리 SHA를 기록합니다.

backend 종합 PR까지 머지된 뒤 backend 최신 main에서 `codex/pin-ai-main-after-reconciliation` 브랜치를 만듭니다. `Dockerfile.render-free`의 아래 URL에서 SHA **하나만** 실제 AI main SHA로 교체하고 별도 PR을 올립니다.

```text
https://codeload.github.com/Fiinsight/finsight-ai/tar.gz/514a47e827fd758429a7d7ec9af94ac46b14a66b
```

그 PR 본문에는 이전/새 SHA, AI #68 머지 링크, `merge-base --is-ancestor` 성공, 새 AI main CI 결과를 적습니다. 가능하면 AI merge 결과의 tree가 검토한 운영 tree와 같은지도 `git diff 514a47e origin/main`으로 확인합니다. 다른 변경이 함께 들어갔다면 해당 차이를 검토하고 AI 테스트를 다시 실행합니다.

Dockerfile과 entrypoint의 토큰 공유 동작은 유지합니다. 지정한 `AI_INTERNAL_TOKEN`이 있으면 두 프로세스에 같은 값이 전달되어야 하며, 현재 entrypoint의 미지정 시 공통 임시 토큰 생성도 유지합니다. 토큰 값을 PR·로그·프론트 번들에 쓰지 않습니다. 외부 LLM·유료 기능이나 숙련도 원장 활성화 flag를 새로 켜지 않습니다.

## main 기준 배포

### 1. Backend

- 별도 AI 고정값 PR 머지까지 끝난 최신 backend main SHA를 기록합니다.
- `git switch main`, `git pull --ff-only origin main` 후 Java 21 환경에서 backend 테스트와 실제 PostgreSQL `prod-migrations` 검사를 실행합니다.
- Render의 배포 대상이 main 기준인지 확인하고, 기록한 **backend main SHA**를 배포합니다. 기존 service·domain·plan을 새로 만들지 않습니다.
- Live 화면의 SOURCE가 해당 SHA인지 확인하고 `/actuator/health/liveness`, `/actuator/health/readiness`를 검사합니다.
- 운영에 적용된 V18을 다시 수정하거나 출석·숙련도 초안 SQL을 임의 적용하지 않습니다.

### 2. Frontend

깨끗한 frontend main 체크아웃에서 실행합니다. 개발 브랜치의 남은 dist를 그대로 배포하지 않습니다.

```sh
git switch main
git pull --ff-only origin main
npm ci
npx tsc --noEmit
npm test
EXPO_PUBLIC_API_BASE_URL=https://finsight-backend-gh7c.onrender.com/api npx expo export --platform web
npx eas-cli deploy --prod --non-interactive
```

기존 EAS projectId `8fda91d0-1fe1-4fd2-ac5f-26e42d765466`와 production 주소 `https://finsight-demo.expo.app`을 확인합니다. 별도 `finsight.expo.app` 프로젝트로 잘못 배포하지 않습니다. backend가 정상화된 후 프론트를 배포합니다. 배포 ID·실제 main SHA·생성된 JS 파일명을 기록합니다.

## 배포 후 확인

- **홈 뉴스**: 첫 화면은 3개. 관심종목 1개 + 핵심 브리핑 3개인 계정에서 더보기를 누르면 잘렸던 핵심 3번째 기사가 먼저 복원되고 관심종목 나머지·서버 뉴스가 중복 없이 이어짐. 관심종목 없는 계정도 확인. 짧거나 빈 마지막 페이지에서는 버튼 숨김.
- **브리핑 갱신**: 한국 날짜/핵심 id 변경 후 초기 3개와 page=0으로 복원되고 오래된 추가 목록이 남지 않음.
- **판단 기록 상세 URL**: 본인 소유의 `/history/judgements/<id>`를 직접 열고 새로고침해 같은 상세 화면이 복원되는지 확인.
- **학습 탭**: 흰 ‘오늘 할 일’ 카드 하나, 내 목표·기사 3개·퀴즈 1개 체크리스트와 해당 행선지 버튼 표시. 목표만 달성하고 다른 항목은 미완료인 경우도 모순 없이 표시되는지 확인.
- 375px 웹의 가로 넘침, 로그인·학습 API, RULE/EXCERPT 폴백과 원문 출처 링크를 확인하고 화면을 남깁니다.

## 복구 기준

운영을 바꾸기 전 frontend `v5keac5ci0` 및 backend `7997f1d`를 이전 버전으로 기록합니다. 배포 후 문제가 생기면 기존 Expo deployment를 production으로 재승격하거나 이전 backend SHA를 재배포할 수 있습니다. DB down-migration과 main 이력 덮어쓰기는 복구 수단으로 사용하지 않습니다.
