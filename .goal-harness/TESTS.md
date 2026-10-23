# Tests

- pnpm.cmd test: 기존 안전성·입력 검증·ETL·SEO 회귀.
- pnpm.cmd lint; pnpm.cmd build; pnpm.cmd type-check.
- 브라우저: 1440/880/390/320px 화면, 가로 넘침, 키보드 메뉴/Escape/링크 닫힘, JS-off 메뉴.
- 격리 QA DB: 추천 성공, 복수 안전 조건, 공유 결과, 0건; 입력 변경 중 느린 응답/오류 무시, 비JSON/네트워크 실패 복구.
- 지역 없는 DB에서 비활성 원인과 안내 확인.
- detector와 diff를 한 번 검토하고 실제 결함만 수정한다.
