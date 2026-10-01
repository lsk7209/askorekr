# Status | 마지막: 2026-10-01
## 현재 작업
안정성/성능/DevOps P0/P1 개선 완료 (CI 파이프라인, 테스트 자동화, HSTS, 미들웨어 최적화, DB 백필 도구)
## 최근 변경 (최근 5개만)
- 10-01: GitHub Actions CI 워크플로우 신설 (.github/workflows/ci.yml)
- 10-01: `pnpm test` 명령어로 6개 테스트 일괄 실행 (node --test 기반)
- 10-01: next.config.mjs HSTS 보안 헤더 추가 및 미사용 최적화 패키지 정리
- 10-01: middleware.ts matcher 최적화 (정적 에셋 제외로 엣지 실행 비용/지연 절감)
- 10-01: 타임스탬프 및 안전성 점수 무결성 백필/진단 도구(scripts/backfill-timestamps-and-safety.mjs) 추가
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