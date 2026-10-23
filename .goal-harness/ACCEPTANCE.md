# Acceptance

| 기준 | 상태 | 증거 |
|---|---|---|
| 진단 입력/즉시 결과/공유 결과가 HOUSE LAB 토큰을 사용하고 모바일에서 읽힌다 | PASS | CSS Module, 320~1440px 확인·스크린샷 |
| 메뉴가 JS 없이 열리고 키보드/링크 선택이 작동한다 | PASS | browser-flow: native/no-JS/Enter/Escape/같은 페이지 링크 |
| 입력 변경 후 과거 요청의 성공/실패가 표시되지 않는다 | PASS | browser-states: 6가지 조건 변경 후 abort를 무시하는 지연 응답 및 지연 실패 무시 |
| 지역 없음/요청 중/오류/추천 없음이 구별된다 | PASS | browser-states + qa-empty.db 지역 안내/제출 차단 |
| 기존 test/lint/build/type-check가 통과한다 | PASS | EVIDENCE 명령 exit 0, 기존 lint 경고 1건 |
| URL/점수/안전 정책과 운영 자원을 보존하고 인수 문서를 갱신한다 | PASS | diff/실제 API 복수 안전 필터/공유 query 확인, 운영 변경 없음, PROJECT_STATE |
