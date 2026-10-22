# APPLIED_CHANGES — 2026-10-22

PATCH_PLAN.md의 [AUTO] A1~A6 적용. 커밋·배포는 하지 않음.

| ID | 변경 | 파일 |
|---|---|---|
| A1 | 식물명 자동 링크: 한글 단어 경계·조사 허용, 1글자/일상어 충돌 국명 제외, 식물별 첫 1회, 글당 최대 8개, 기존 `<a>` 내부·태그 속성 보호 | `src/features/plants/name-map.ts`, `src/app/blog/[slug]/page.tsx`, `scripts/tests/adsense-01-plant-autolink.test.mjs` |
| A2 | 문의 이메일 `hello@plantyfriends.com`(NXDOMAIN) → `contact@askore.kr` 공용 상수 | `src/lib/site-contact.ts`, `src/app/contact/page.tsx` |
| A3 | 개인정보처리방침 10개 조항으로 확장 (AdSense 제3자 쿠키·해제 링크, GA 차단, 쿠키 거부, 위탁·국외이전, 파기, 보호책임자, 구제기관) | `src/app/privacy/page.tsx` |
| A4 | About 콘텐츠 현황을 DB 실측(식물·블로그·지역 수)으로 표시, 일 1회 재검증 | `src/app/about/page.tsx`, `src/features/plants/queries.ts` |
| A5 | 식물 상세 `과·속`에 숫자 분류 코드 노출 차단 | `src/app/plant/[slug]/plant-detail-content.tsx` |
| A6 | 블로그 하단 출처를 구체 기관명 + 편집 기준 링크로 교체 | `src/app/blog/[slug]/page.tsx` |

검증: `pnpm test` 8/8 통과, `pnpm type-check` 통과, `pnpm lint` 오류 0(기존 `<img>` 경고 1), `pnpm build` 성공.

## 2차 적용 — 2026-10-22

| ID | 변경 | 파일 |
|---|---|---|
| M1 | About에 운영자 정보·작성/검수 원칙·오류 정정 정책 섹션 추가, Organization 스키마에 `publishingPrinciples`·`correctionsPolicy`, 블로그 저자 링크를 운영자 섹션으로 연결 (가상의 실명·경력은 넣지 않음) | `src/app/about/page.tsx`, `src/app/blog/[slug]/page.tsx`, `src/app/globals.css` |
| R1 | 예약 발행을 cron 틱당 1개로 제한(가장 오래된 예약부터) → 하루 최대 약 5개 | `src/features/blog/queries.ts` |

이메일 `contact@askore.kr`는 표기용으로 유지(실제 수신 설정은 하지 않기로 함).
