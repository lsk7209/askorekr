# Status | 마지막: 2026-10-23
## 현재 작업
현재 상태 정본은 [PROJECT_STATE.md](PROJECT_STATE.md). 10-23 후속으로 진단 입력·추천·공유 결과 V2 및 JS 없이 열리는 모바일 메뉴를 로컬 구현·검증 완료했다. 후속 사용자 요청으로 GitHub push 및 기존 OVH 자동 반영 확인 진행 중.

이전 세션 기록: 홈·공통 헤더/푸터·전역 색 조정은 905d74c main 푸시·CI success. 당시 **운영(OVH) 미반영**(홈 문구·CSS 해시 동일). 후속 사용자 안내는 GitHub push 자동 배포이며, 새 환경 파일의 비밀번호 인증은 publickey-only로 거절됨. 최신 확인은 PROJECT_STATE/하네스 참조.
## 최근 변경 (최근 5개만)
- 10-23 후속: 진단 V2·요청 무효화·상태 안내·native 모바일 메뉴. 검증과 변경 파일은 `.goal-harness/REPORT.md` 참조.
- 10-23: HOUSE LAB V2 홈/헤더/푸터 이식(CSS Modules, 공간 선택은 설명만 변경·추천은 /tools/diagnose), Pretendard 폰트명 정정('Pretendard Variable'), 미사용 전역 CSS 제거, 헤더 landmark·홈 강조색 대비 개선, 전역 --terracotta #a85a35·--sage #567559 (axe 11페이지 위반 0). 커밋 4f2fa68·a770891·7252a14·905d74c
- 10-23: sitemap의 한글 slug 블로그 글 404 수정(blog/plant/category slug 디코딩), publish-blog-tick의 중단된 Google ping 제거·토큰 timing-safe 비교(376075c). 품질기반 noindex는 라이브 측정상 근거 부족(블로그 길이 균일, -spp 식물은 인기종)으로 보류
- 10-22: AdSense 심사 대비 개선(식물명 오링크 수정, 개인정보처리방침·운영자 정보 보강, 예약 발행 틱당 1개 제한) — docs/adsense/ 참조
- 10-01: GitHub Actions(`db-backfill.yml`)로 운영 Turso DB 밀리초 타임스탬프 480건 초 단위 백필 및 안전성 전수 검증 완료
## TODO
- [ ] 배포 후 라이브 확인: 홈 V2(공간 선택·모바일 메뉴·FAQ), 광고 슬롯 실노출, 글이 있는 운영 DB에서 가드닝 저널 표시, 헤더/푸터 회귀. 미검증: 스크린리더 실기·CLS 측정
- [x] JS 없이 열리는 모바일 메뉴(<details> 기반), 진단 입력·추천·공유 결과 V2 로컬 구현/검증
- [ ] P1 남은 개발: 식물 상세·블로그 상세 V2 확장
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
