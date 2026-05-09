# Status | 마지막: 2026-05-09
## 현재 작업
Google 인증/GA4 태그 적용 완료, GitHub 배포 진행
## 최근 변경 (최근 5개만)
- 05-09: GA4 gtag 스크립트와 NEXT_PUBLIC_GA4_ID env 주입
- 05-09: Google Search Console 사이트 인증 메타태그 추가
- 05-09: app/layout.tsx에 env 기반 AdSense 스크립트 추가
- 05-09: 농사로 garden live ETL 스크립트와 정규화/metrics/images 매핑 추가
- 05-09: 농사로 garden API 매뉴얼/샘플 분석 및 XML 파서 추가
## TODO
- [x] 국립수목원 ETL 샘플 실행 검증
- [x] 생물자원관 ETL 어댑터 구현
- [x] 로컬 환경 변수 연결 및 검증 스크립트 구현
- [x] Vercel 프로젝트 생성/링크 및 공개 env 주입
- [x] Turso 실제 libsql URL/토큰 확보 후 Vercel 프로젝트 env 주입
- [x] Git repository 연결 후 Vercel Preview env 주입
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
- GitHub: https://github.com/lsk7209/planty-friends
- 추가 GitHub 원격: https://github.com/lsk7209/askorekr
- 배포 기준 GitHub: https://github.com/lsk7209/askorekr
- Preview env: preview 브랜치 전용으로 주입
- 농사로 garden: http://api.nongsaro.go.kr/service/garden, 별도 NONGSARO_API_KEY 필요
## 주의
- 실제 API 키와 Turso 토큰은 커밋하지 않음
- 공공데이터 키는 농사로 API에서 resultCode 11로 거부됨
- 농사로 live ETL 실행: NONGSARO_API_KEY 확보 후 `node scripts/etl-nongsaro-garden-live.mjs --limit 3`
- Vercel 프로젝트: limsubs-projects/askorekr
- drizzle-kit migrate/push가 Turso에서 원인 출력 없이 실패해 drizzle SQL 파일을 libSQL 클라이언트로 순차 적용함
- dev 서버는 3000 포트 사용 중이라 http://127.0.0.1:3001 에서 실행
