# Status | 마지막: 2026-05-10
## 현재 작업
IndexNow 수동 제출 엔드포인트 구현·검증 완료
## 최근 변경 (최근 5개만)
- 05-10: IndexNow 내부 제출 API와 키 파일 라우트 추가
- 05-10: `/diagnose/[regionCode]/[env]` SSR 결과 페이지와 진단 결과 링크 추가
- 05-10: sitemap 식물 상세 lastmod 비정상 미래 날짜 보정
- 05-10: 진단 고급 조건(안전성/광량/경험/관리 시간) 타입·필터·UI 추가
- 05-10: about/contact/privacy/terms/disclaimer 정적 페이지와 sitemap 등록 추가
## TODO
- [ ] AdSense 검수 readiness 점검
## 결정사항
- IndexNow 보호 토큰은 `INTERNAL_API_TOKEN`, 키는 `INDEXNOW_KEY` 사용
- IndexNow keyLocation은 `https://askore.kr/indexnow-key.txt`
- 대표 도메인: https://askore.kr
- 배포 기준 GitHub: https://github.com/lsk7209/askorekr
- DB: Drizzle + libSQL/Turso 호환 SQLite 스키마 우선
## 주의
- 실제 API 키와 Turso 토큰은 커밋하지 않음
- dev 서버는 검증 시 http://127.0.0.1:3001 사용
- Vercel 프로젝트: limsubs-projects/askorekr
