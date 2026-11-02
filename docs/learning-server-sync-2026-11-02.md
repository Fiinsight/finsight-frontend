# 서버 읽기 기록 및 학습 탭 가독성 (미배포)

## 동작

- 로그인 시 기존 사용자별 기기 로그를 해당 계정의 서버에 한 번 병합한다. stable device ID와 서버 import PK로 응답 유실·재시도·다중 기기 중복을 막는다.
- 이후 GET/PUT 서버 응답이 기준이다. 기기 캐시는 가져오기 및 캐시 용도이며 오프라인 읽기를 출석 달성으로 확정하지 않는다. 실패하면 다음 로그인/조회 시 재시도한다. 판단 상세 조회 로그는 기존 기기 저장을 유지한다.
- 계정이 전환되는 중에도 가져오기 요청은 처음 세션의 토큰으로 보내며, 다른 계정으로 바뀌면 완료 marker/응답 캐시를 쓰지 않는다.
- AttendanceCard는 서버에서 받은 일별 3개 읽기 기준을 재사용한다. 다른 탭의 카드 색·배치 등 디자인은 바꾸지 않았고 데이터 출처 안내만 계정 기준으로 바꿨다.
- 오늘 할 일은 읽기 로그와 완료 기사 ID의 차집합으로 남은 기사 퀴즈 수를 표시하고 퀴즈로 이동한다. 일일 퀴즈 1개 목표 완료는 남은 기사와 별개로 설명한다.
- 오늘의 용어는 카드별 정의 미리보기(최대 두 줄) → 눌러 전체 펼치기/접기. 미리보기는 단어 경계에서 끊어 `있습니…` 같은 중간 어미가 생기지 않게 한다.
- 이어서 풀 퀴즈에 기사별 버튼과 퀴즈 남음 배지. 빈 복습 안내를 구체화했다.
- learning 폴더 컴포넌트와 학습 제목에서 본문 15px 이상. shared theme·다른 탭 스타일은 변경하지 않았다.

## 검증

- npx tsc --noEmit 통과, npm test 170 passed / 실패 0, expo web export 통과.
- 안정적인 UI 비교를 위해 같은 응답 fixture를 Playwright에서 가로채 사용했다. 실제 운영 사용자 데이터나 DB 쓰기가 아니며 실기기 스크린샷도 아니다.
- 375×1000, 1440×1000 뷰포트. React Native 내부 ScrollView라 상단/중간/하단을 별도로 캡처했다. before는 상단 두 폭, after는 상단/중간/하단 및 정의 펼침 상태.
- audit JSON의 본문 Text 검사에서 <15px 및 대비 <4.5:1, 가로 넘침 0건. 하단 공통 탭 바는 다른 탭 디자인 범위이므로 이 본문 검사에서 제외했다.

| 화면 | 375px | 1440px |
|---|---|---|
| 수정 전 | [before](qa-evidence-2026-11-02-learning/before-375.png) | [before](qa-evidence-2026-11-02-learning/before-1440.png) |
| 수정 후 상단 | [after](qa-evidence-2026-11-02-learning/after-375.png) | [after](qa-evidence-2026-11-02-learning/after-1440.png) |
| 수정 후 중간 | [middle](qa-evidence-2026-11-02-learning/after-middle-375.png) | [middle](qa-evidence-2026-11-02-learning/after-middle-1440.png) |
| 수정 후 하단 | [bottom](qa-evidence-2026-11-02-learning/after-bottom-375.png) | [bottom](qa-evidence-2026-11-02-learning/after-bottom-1440.png) |
| 정의 펼침 | [expanded](qa-evidence-2026-11-02-learning/after-expanded-375.png) | [expanded](qa-evidence-2026-11-02-learning/after-expanded-1440.png) |

## 반영 순서

backend의 V19/V20 및 읽기 API를 먼저 반영하고 API·계정 삭제 검증 후 이 frontend를 배포한다. 새 프론트를 먼저 배포하면 새 API가 없어 읽기·출석 조회를 실패로 표시한다. 기존 데이터는 병합 완료 전까지 기기 저장에 보존된다. PR 머지 자체는 현재 Expo 데모 배포를 갱신하지 않는다.

이 작업에서는 배포·운영 DB 쓰기·Render 환경변수 변경·LLM 활성화를 하지 않았다.
