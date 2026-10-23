# Plan

1. 상태·실제 코드 확인: STATUS/WORK_LOG/Git 및 진단 UI를 확인한다. 완료: 19d01f5 clean 확인. 독립 읽기 전용 agent는 진단 경로만 조사.
2. 구현: 헤더 native details, 진단 CSS Module, 입력 상태/빈 데이터 안내를 수정한다. 기존 URL/API/점수 정책은 유지. UI/요청 상태 브라우저 검증을 준비한다.
3. 검증: test/lint/build, build 이후 type-check를 실행한다(Next 출력 동시 생성 방지). 격리된 로컬 DB에서 실제 추천 및 모바일/desktop 흐름을 확인한다. 실패 시 원인 수정 후 해당 검사 재실행.
4. 리뷰·인수: diff/수용 기준을 점검하고 PROJECT_STATE와 증거를 갱신한다. 롤백은 이번 diff 단위로 가능하며 기존 DB/운영 자원은 변경하지 않는다.
