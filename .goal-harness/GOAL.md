# HOUSE LAB V2 진단 흐름 확장

2026-10-23 / medium / web / R2. 시작 HEAD: 19d01f5, 작업 트리 clean.

## Final Deliverable / User Value
홈과 이어지는 진단 입력·추천 결과·공유 결과 화면과 JS 없이 사용하는 모바일 메뉴.

## Required Features
- 기존 HOUSE LAB 토큰을 재사용하는 범위 한정 CSS Modules.
- 입력 변경 후 이전 요청 결과·오류를 표시하지 않는다.
- 요청 중, 지역 없음, 추천 없음, 오류 상태를 구분한다.
- 모바일 메뉴는 native details로 열리며 Escape·링크 선택 시 닫힌다.

## Non-Goals
식물/블로그 상세 V2는 다음 단계. 추천 점수·안전 필터·DB 스키마·운영 데이터·태그·URL은 유지. 배포와 외부 게시 없음.

## Done Conditions / User-Visible Result
ACCEPTANCE.md와 TESTS.md에 따라 로컬 UI·기존 회귀·빌드 검증 후 현재 상태 기록.
