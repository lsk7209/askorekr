# Status | 마지막: 2026-05-08
## 현재 작업
Turso/Vercel 실제 환경 변수 연결 완료
## 최근 변경 (최근 5개만)
- 05-08: Turso 실제 DB 스키마 적용, seed/ETL 샘플 검증, Vercel Turso env 주입
- 05-08: Vercel planty-friends 프로젝트 생성/링크 및 공개 env 주입
- 05-08: env 검증 스크립트, Vercel 빌드 설정, 로컬 .env.local 추가
- 05-08: 생물자원관 ETL 정규화/적재 샘플과 출처 병합 저장 추가
- 05-08: 국립수목원 ETL 정규화/적재 모듈과 샘플 실행 스크립트 추가
## TODO
- [x] 국립수목원 ETL 샘플 실행 검증
- [x] 생물자원관 ETL 어댑터 구현
- [x] 로컬 환경 변수 연결 및 검증 스크립트 구현
- [x] Vercel 프로젝트 생성/링크 및 공개 env 주입
- [x] Turso 실제 libsql URL/토큰 확보 후 Vercel 프로젝트 env 주입
- [ ] Git repository 연결 후 Vercel Preview env 주입
## 결정사항
- 첫 범위: Phase 0 골격까지만 구현
- DB: Drizzle + libSQL/Turso 호환 SQLite 스키마 우선
- 진단 Quick: 지역+환경 필터 후 기후 적합도 70점 이상 top 10 반환
- 종 도감 상세: 서울 강남구(11680) 기준 기후 적합도를 기본 Quick Facts로 표시
- 카테고리 허브: taxonomy category 기준 목록을 서울 강남구 적합도순으로 정렬
- 국립수목원: 2025년 대체 API(15142872) 기준, 실제 endpoint는 가이드 확인 전 하드코딩하지 않음
- ETL 출처: 다중 원천 실행 시 plants.source_refs를 덮어쓰지 않고 병합
- 환경: 로컬은 file:local.db 허용, 프로덕션은 libsql:// Turso URL과 토큰 필수
- Turso DB: 실제 DB에 16개 테이블, 샘플 plants 8개, ETL run 2개 검증
## 주의
- 실제 API 키와 Turso 토큰은 커밋하지 않음
- Vercel 프로젝트: limsubs-projects/planty-friends
- Preview env는 Git repository 연결 전까지 브랜치 env 주입 불가
- drizzle-kit migrate/push가 Turso에서 원인 출력 없이 실패해 drizzle SQL 파일을 libSQL 클라이언트로 순차 적용함
- dev 서버는 3000 포트 사용 중이라 http://127.0.0.1:3001 에서 실행
