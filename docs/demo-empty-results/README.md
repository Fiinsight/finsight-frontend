# 빈 추천·유사 뉴스 화면 검증

성공 응답에 결과가 없으면 유사 뉴스 카드 전체를 숨긴다. 로딩·오류·재시도와 정상 결과는 유지한다. 학습의 빈 추천 섹션은 기존 코드가 이미 숨기고 있어 수정하지 않았다.

- 운영의 기존 테스트 계정으로 읽기 조회한 추천은 RULE_INTEREST 결과가 있었고, 해당 빈 유사 검색은 DATA_UNAVAILABLE/NO_ELIGIBLE_DATA였다. 이번 운영 조회에서 INDEX_NOT_CONFIGURED를 직접 재현했다고 주장하지 않는다.
- 로컬 실제 화면 컴포넌트에 status=RULE_FALLBACK, note=INDEX_NOT_CONFIGURED, results=[] 및 빈 추천 응답을 주입해 375px/1440px에서 검증했다. 운영 데이터·화면을 조작한 것이 아니며 실기기 캡처도 아니다. 쓰기 API는 모두 fixture로 처리했다.
- 수정 전 유사 뉴스의 빈 안내 카드가 보였고, 수정 후 없어졌다. 내부 상태 문자열은 화면에 노출되지 않았다.
- npx tsc --noEmit, npm test 173 passed / 실패 0, expo web export 성공.

| 화면 | 375px | 1440px |
|---|---|---|
| 유사 뉴스 수정 전 | [before](empty-before-375.png) | [before](empty-before-1440.png) |
| 유사 뉴스 수정 후 | [after](empty-after-375.png) | [after](empty-after-1440.png) |
| 학습 빈 추천 숨김 | [learning](recommendation-empty-375.png) | [learning](recommendation-empty-1440.png) |
