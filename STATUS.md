# Status | 마지막: 2026-10-01
## 현재 작업
OPS-03(동기화 스키마/ID 정합성), DISCOVERY-01(동음이의어 보호 및 FAQ 정합성), 의존성 보안 패치(취약점 0건) 완료 및 main 반영
## 최근 변경 (최근 5개만)
- 10-01: Next.js 15.5.27 업그레이드 및 pnpm overrides 적용 (`pnpm audit --prod` 취약점 20건 → 0건 해소)
- 10-01: OPS-03/DATA-03 `sync-local-to-turso.mjs` 스키마·ID/slug 정합성 사전검사 및 안전성 coalesce 제거
- 10-01: DISCOVERY-01 국명 동음이의어 오링크 방지(`name-map.ts`) 및 홈 FAQ 안내 문구 정합성 개선
- 10-01: GitHub Actions CI 워크플로우 신설 (.github/workflows/ci.yml) 및 `pnpm test` 일괄 실행 (7개 스위트)
- 10-01: next.config.mjs HSTS 헤더 추가, middleware.ts 정적 에셋 제외 최적화, 타임스탬프 백필 도구 추가
## TODO
- [ ] 운영 Turso DB 타임스탬프 백필 스크립트 실행 (`node scripts/backfill-timestamps-and-safety.mjs --execute`)
- [ ] AdSense 신청 전 운영자 계정에서 최종 제출
## 결정사항
- IndexNow 보호 토큰은 `INTERNAL_API_TOKEN`, 키는 `INDEXNOW_KEY` 사용
- IndexNow keyLocation은 제출 URL origin 기준으로 동적 생성 (`{origin}/{INDEXNOW_KEY}.txt`)
- IndexNow payload는 제출 URL origin별로 나눠 `host/keyLocation` 생성
- 대표 도메인: https://askore.kr (non-www, GSC 등록 도메인 기준. www 접속 시 301 리다이렉트)
- 배포 기준 GitHub: https://github.com/lsk7209/askorekr
- DB: Drizzle + libSQL/Turso 호환 SQLite 스키마 우선
## 주의
- 실제 API 키와 Turso 토큰은 커밋하지 않음
- dev 서버는 검증 시 비어있는 3001/3002 포트 사용
- Vercel 프로젝트: limsubs-projects/askorekr
- 광고 슬롯 ID가 없으면 `.adsense-unit`은 렌더링되지 않음
- 모니터링 엔드포인트: `/api/health`