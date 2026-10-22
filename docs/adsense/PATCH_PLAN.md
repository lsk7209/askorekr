# AdSense PATCH_PLAN — askore.kr (플랜티프렌즈)

진단일: 2026-10-22 · 스택: Next.js 15.5 (App Router) + Turso · 배포: Vercel
진단 근거: 운영 사이트(https://askore.kr) 실측 + 소스 코드 정적 점검

## 진단 요약

| 구분 | 항목 | 판정 | 근거 |
|---|---|---|---|
| 필수 페이지 | About/Contact/Privacy/Terms/Disclaimer | ✅ 존재 | 모두 200, 푸터 1클릭 |
| 필수 페이지 | Contact 이메일 동작 | ❌ CRITICAL | `hello@plantyfriends.com` — 도메인 자체가 존재하지 않음(NXDOMAIN) |
| 필수 페이지 | Privacy AdSense 고지 | ⚠️ WARNING | 제3자 공급업체·Google 쿠키·맞춤광고 해제(adssettings) 안내, 보호책임자·파기절차 없음 |
| 콘텐츠 | 블로그 본문 자동 식물 링크 | ❌ CRITICAL(QA) | 단어 중간 매칭: `조금`→조(/plant/setaria-italica), `무조건`·`건조`→조, `자란다`→자란, `감`→감나무, `광합성 타임`→타임. 글 1개에 오링크 다수 |
| 콘텐츠 | 발행 속도 | ❌ CRITICAL(정책) | 5개월간 블로그 892개, 하루 최대 96개(5/17), 10월 중순 하루 20개 — Scaled Content Abuse 시그널 |
| 콘텐츠 | 템플릿 획일성 | ⚠️ WARNING | 샘플 8개 공통: "SNS 속 그 식물" 도입 → `Quick Facts` → FAQ, "플랜티프렌즈가 ~ 알려드릴게요" |
| 콘텐츠 | 이미지 | ⚠️ WARNING | 샘플 블로그 8/8 본문 이미지 0개 |
| 콘텐츠 | 식물 상세 페이지 | ⚠️ WARNING | 474개 동일 문단 템플릿, `과·속 063053 / Monstera`처럼 농사로 숫자 코드 노출, 조(곡물) 같은 비반려식물 포함 |
| E-E-A-T | 저자 | ⚠️ WARNING | 전 글 "플랜티프렌즈 편집팀", 실존 운영자 정보 없음 |
| E-E-A-T | About 현황 수치 | ⚠️ WARNING | "블로그 600개 이상"(실제 892), 업데이트일 2026-06-02 고정 |
| E-E-A-T | 블로그 출처 문구 | ⚠️ WARNING | "공개 자료 및 편집 기준" — 구체적 기관명 없음 |
| 기술 SEO | robots/sitemap/canonical/viewport/HTTPS | ✅ PASS | sitemap 1,377 URL, 메타·스키마(BlogPosting/Breadcrumb/FAQ) 정상 |
| 광고 | ads.txt / AdSense 스크립트 | ✅ PASS | pub-3050601904412736 일치, `<ins>`는 슬롯 없으면 미렌더 |
| YMYL | 반려동물 독성 | ✅ PASS | 면책 고지·푸터 고지 존재 |

## 수정 계획

### [AUTO] — 코드로 자동 수정
- **A1 (CRITICAL)** 블로그 식물명 자동 링크 정상화 — 한글 단어 경계 검사, 2자 미만·일반어 충돌 국명(조·감·자란·타임 등) 제외, 식물별 첫 1회만, 글당 최대 링크 수 제한. 테스트 추가.
- **A2 (CRITICAL)** Contact·Privacy 이메일을 실제 수신 가능한 주소로 교체 (주소는 사용자 지정 필요).
- **A3 (WARNING)** 개인정보처리방침 보강 — 제3자 공급업체(Google) 쿠키·맞춤광고, 해제 링크, 쿠키 거부 방법, 처리 위탁/국외 이전, 보호책임자, 파기 절차.
- **A4 (WARNING)** About 콘텐츠 현황을 DB 실측 수치로 동적 표시.
- **A5 (WARNING)** 식물 상세 `과·속`의 숫자 코드 숨김 처리.
- **A6 (WARNING)** 블로그 하단 출처 문구를 구체 기관명(농사로·국립수목원·국립생물자원관·기상청) + 편집 기준 링크로 교체.

### [REVIEW] — 운영 판단 필요
- **R1** 심사 기간 동안 예약 발행 속도 축소(일 1~2개 이하) 또는 일시 중지.
- **R2** 데이터가 빈약한 식물 상세(과·속 없음, 비원예 작물 등)는 `noindex` 검토.

### [MANUAL] — 사용자 작업
- **M1** About에 실존 운영자(이름/닉네임, 경력·가드닝 경험) 추가 — E-E-A-T 핵심.
- **M2** 트래픽 상위 20~30개 글을 직접 재작성: 실사진, 1인칭 경험, 템플릿 도입부 제거.
- **M3** 수정 배포 후 GSC 색인 요청 → 거절 이력이 있으면 30일 경과 후 재신청.
