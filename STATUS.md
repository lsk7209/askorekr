# Status | 마지막: 2026-05-10
## 현재 작업
sitemap lastmod 보정/정밀 진단/보조 페이지 배포 준비 완료
## 최근 변경 (최근 5개만)
- 05-10: sitemap 식물 상세 lastmod가 비정상 미래 날짜면 현재 시각으로 보정
- 05-10: 진단 고급 조건(안전성/광량/경험/관리 시간) 타입·필터·UI 추가
- 05-10: about/contact/privacy/terms/disclaimer 정적 페이지와 sitemap 등록 추가
- 05-10: `/tools/diagnose` 시·도 → 시·군·구 2단 선택과 결과 추천 사유 추가
- 05-09: askore.kr 기준 네이버 인증, sitemap, RSS, robots 추가
## TODO
- [ ] 배포 후 `https://askore.kr/sitemap.xml`에서 `+058320` 제거 확인
- [ ] `/diagnose/[regionCode]/[env]` SSR 캐시 결과 페이지 구현
## 결정사항
- 진단 Quick API payload는 `regionCode`, `environment` 기존 계약 유지
- 추천 사유는 API 응답의 `recommendationReason`으로 내려 UI 카드에 표시
- 공간 크기 필터는 식물 크기 데이터 확보 전까지 제외
- 대표 도메인: https://askore.kr
- 배포 기준 GitHub: https://github.com/lsk7209/askorekr
- DB: Drizzle + libSQL/Turso 호환 SQLite 스키마 우선
## 주의
- 실제 API 키와 Turso 토큰은 커밋하지 않음
- dev 서버는 검증 시 http://127.0.0.1:3001 사용
- 농사로 live ETL 실행: NONGSARO_API_KEY 확보 후 `node scripts/etl-nongsaro-garden-live.mjs --limit 3`
- Vercel 프로젝트: limsubs-projects/askorekr
