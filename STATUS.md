# Status | 마지막: 2026-10-23
## 현재 작업
한글 slug 404 수정 등 376075c까지 main 푸시 완료. **운영(OVH) 미반영 지속** — askore는 자동배포 timer 미설치로 추정(푸시 후 라이브 구버전 유지, /privacy etag 6aun6mr49he6u). 이 PC에는 OVH 접속수단·E:\server-ovhcloud 없음
## 최근 변경 (최근 5개만)
- 10-23: sitemap의 한글 slug 블로그 글 404 수정(blog/plant/category slug 디코딩), publish-blog-tick의 중단된 Google ping 제거·토큰 timing-safe 비교(376075c). 품질기반 noindex는 라이브 측정상 근거 부족(블로그 길이 균일, -spp 식물은 인기종)으로 보류
- 10-22: AdSense 심사 대비 개선(식물명 오링크 수정, 개인정보처리방침·운영자 정보 보강, 예약 발행 틱당 1개 제한) — docs/adsense/ 참조
- 10-01: GitHub Actions(`db-backfill.yml`)로 운영 Turso DB 밀리초 타임스탬프 480건 초 단위 백필 및 안전성 전수 검증 완료
- 10-01: Next.js 15.5.27 업그레이드 및 pnpm overrides 적용 (`pnpm audit --prod` 취약점 20건 → 0건 해소)
- 10-01: OPS-03/DATA-03 `sync-local-to-turso.mjs` 스키마·ID/slug 정합성 사전검사 및 안전성 coalesce 제거
- 10-01: DISCOVERY-01 국명 동음이의어 오링크 방지(`name-map.ts`) 및 홈 FAQ 안내 문구 정합성 개선
## TODO
- [ ] OVH 서버에 askore main 배포 — OVH 접속 가능한 PC에서 petjigi-auto-deploy.timer(E:\server-ovhcloud\...\petjigi_updater.py)와 동일 방식으로 설치 요청 (OVH 접속 가능한 PC 또는 ~/.ssh/ovh1_config·키 복사). petjigi처럼 auto-deploy timer 설치 검토
- [ ] 배포 후 라이브 확인 4건: /privacy 'myadcenter' 링크, /blog/6-plants-for-your-humid-bathroom 의 '조금·자란다' 오링크 제거, /plant/monstera-deliciosa 과·속 '063053' 미노출, /about 운영자 정보·블로그 수 실측
- [ ] GSC 색인 요청(About·Privacy·상위 글), 거절 이력 있으면 30일 후 재신청
- [ ] 상위 20~30개 글 직접 재작성(실사진·실경험) — GSC 데이터로 대상 선정
- [ ] AdSense 신청 전 운영자 계정에서 최종 제출
- [ ] 운영 DB quality_score로 하위 글 noindex·sitemap 제외 기준 재검토(로컬 DB 비어 있음, 운영 접속 필요)
- [ ] 라이브 슬러그 `sinuolata`(종소명만) 데이터 오류 확인
- [ ] ssh1.txt(nexttech) 비밀번호가 세션 로그에 노출됨 — 교체 권장
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
- Vercel 프로젝트: limsubs-projects/askorekr (단, 운영 도메인 askore.kr은 OVH VPS·Caddy가 서빙 — 응답 헤더 `X-Askorekr-Hosting: ovh`. Vercel 배포 성공 ≠ 운영 반영)
- 광고 슬롯 ID가 없으면 `.adsense-unit`은 렌더링되지 않음
- 모니터링 엔드포인트: `/api/health`