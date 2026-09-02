# FinSight Frontend

FinSight는 경제 뉴스를 이해하고 스스로 투자 판단을 내리도록 돕는 초보 투자자용 AI 기반 투자 인사이트 플랫폼입니다. React Native 앱 + Spring Boot 백엔드 + FastAPI AI 서비스로 구성되어 있으며, 이 저장소는 그중 프론트엔드(React Native + Expo 모바일 앱)입니다. 앱은 오직 `finsight-backend`(Spring Boot)하고만 통신하고, AI 관련 로직(뉴스 재작성, 용어 설명, 판단 피드백)은 백엔드가 내부적으로 처리한 결과만 내려받습니다.

## 이 앱이 하는 일

PPT 기획안의 5가지 핵심 흐름을 화면으로 그대로 구현했습니다.

1. **홈** — 코스피/코스닥/원달러 시장 현황 + 오늘의 핵심 뉴스 3건
2. **뉴스 상세** — 원문/쉽게읽기 탭, 초보자용·일반용·분석용 3단계 읽기 수준 선택, 본문 속 어려운 용어를 탭하면 뜻/이 뉴스에서는/시장 영향을 보여주는 팝업
3. **판단하기** — 뉴스를 읽고 상승/중립/하락을 예측하고 판단 근거를 남기는 화면
4. **AI 피드백(차트 분석)** — 예측과 실제 결과를 비교해 정확도와 근거를 보여주고, 관련 종목 미니 차트로 시각화
5. **AI 차트 도슨트** — 관심 종목 차트에서 급등락 구간을 탭하면 관련 뉴스와 "왜 올랐는지" 설명을 보여주는 화면
6. **기록** — 과거 판단 이력과 실제 결과 비교
7. **학습** — 투자 용어/뉴스 읽는 법 등 정적 학습 가이드 + 오늘의 한 줄 팁
8. **프로필** — 최소 구현 (로그인/개인화는 이후 작업)

## 구조

화면 하나가 여러 책임을 갖지 않도록, 화면마다 폴더를 만들고 그 안에서 섹션별 작은 컴포넌트로 쪼갰습니다.

```
src/
├── navigation/
│   ├── RootNavigator.tsx     하단 탭: 홈 / AI차트 / 기록 / 학습 / 프로필
│   ├── HomeStack.tsx         Home → NewsDetail → Judgement → Feedback
│   ├── ChartStack.tsx / HistoryStack.tsx
│   └── types.ts
│
├── screens/
│   ├── home/
│   │   ├── HomeScreen/            index + HomeHeader / MarketPanel / NewsSection
│   │   ├── NewsDetailScreen/      index + DetailTopBar / SentimentBadge / BodyTabs / ArticleBody / ImportanceReasonCard
│   │   ├── JudgementScreen/       index + NewsSummaryCard / DirectionChoices / ReasonInput
│   │   └── FeedbackScreen/        index + ResultBanner / ReasonsCard / FeedbackChart
│   ├── chart/ChartScreen/         index + StockSearchBar / PopularStockChips / StockHeader / ChartCard / InsightBanner / ChartDocentPanel / RelatedNewsList
│   ├── history/HistoryScreen/     index + HistoryItem
│   ├── learn/LearnScreen/         index + GuideList / DailyTips
│   └── profile/ProfileScreen/     index + ProfileHeader / SettingsList
│
├── components/           화면 간에 공유되는 조각: NewsCard, MarketStatCard, TermPopup, ChoiceCard, LevelTabs, MiniLineChart(react-native-svg 커스텀 차트), ScreenTopBar, BottomActionBar
├── store/useAppStore.ts  zustand: 읽기 수준 선택, 판단 draft 등 화면 간 공유 상태
├── lib/api.ts            axios 엔드포인트 함수 + 백엔드 응답을 앱 타입으로 정규화
├── lib/sampleData.ts     백엔드가 꺼져 있거나 특정 필드가 없을 때 쓰는 폴백 샘플 데이터
├── lib/{format,text}.ts  포맷팅/텍스트 유틸리티
└── types/api.ts          백엔드 응답(Raw) 타입 + 화면에서 쓰는 정규화된 타입
```

`App.tsx`는 `QueryClientProvider` → `NavigationContainer` → `RootNavigator`만 조립하고, 화면 로직은 전부 `src/screens`에 있습니다.

## 백엔드 연결이 없어도 항상 동작합니다

모든 화면은 react-query로 백엔드를 호출하고, 실패하거나 응답 형식이 다르면 `src/lib/sampleData.ts`의 현실적인 한국어 샘플 데이터로 자동 대체됩니다. 그래서 백엔드/DB를 켜지 않은 상태에서도 `npm run start`만으로 7개 화면을 전부 눌러볼 수 있습니다 — 평가 시연 시 인프라 없이도 바로 확인 가능합니다.

## 실행 방법

```bash
npm install
npm run start
```

Expo Go 앱으로 QR코드를 스캔하거나, 웹으로 미리보려면:

```bash
npx expo install react-dom react-native-web   # 웹 지원 최초 1회만
npm run web
```

### 백엔드 연결 (선택)

실제 데이터를 받으려면 `finsight-backend`를 8080 포트로 띄운 뒤, `.env.example`을 참고해 `.env`를 만드세요.

```bash
cp .env.example .env
```

실기기(Expo Go)에서 테스트할 때는 `localhost`가 폰 자신을 가리키므로, Mac의 로컬 네트워크 IP를 사용해야 합니다:

```text
EXPO_PUBLIC_API_BASE_URL=http://192.168.0.10:8080/api
```

값을 바꾼 뒤에도 반영이 안 되면 `npm run start:clear`로 캐시를 지우고 다시 시작하세요.

## 참고

- 실제 비밀 값(API 키 등)은 프론트엔드에서 다루지 않습니다 — 모든 외부 API 키는 백엔드(`finsight-backend`)에서만 사용됩니다.
- 백엔드 응답 필드명이 정확히 무엇인지 확신하기 어려운 엔드포인트(`/news/{id}`, `/market/summary`, `/charts/{symbol}` 등)는 `src/types/api.ts`에서 여러 후보 필드명을 함께 받아들이도록(loose typing) 만들어 두었습니다.
