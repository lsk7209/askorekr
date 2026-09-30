# WORK_LOG

## 2026-09-30 15:23 (세션 2 - 작업 A~C)

### 배경
askore_codex_improvement_plan_2026-09-30.md 개선 명세서 기반 작업. 안전성 데이터 정확성(SAFE-01~03), 날짜/원본 데이터 정규화(DATA-01~03), CLI 파싱(OPS-01) 개선. `fix/safety-data-integrity` 브랜치(`chore/remove-gemini-fix-domain`에서 분기)에서 작업.

### 작업 A: 현황 파악
- docs/HANDOFF.md는 이미 최신 상태(모니터링 인증 완료) 확인.
- 계획서가 지적한 코드 문제를 실제 파일에서 전부 재확인: `mapSafety`의 `없` 오탐, `request.ts`의 조용한 입력 완화, `diagnosePlants`의 캐시 실패시 전체 실패 구조, `plant_metrics` 스키마 PK 불일치 등.

### 작업 B: SAFE-01~03
- [src/features/plants/safety-policy.ts] 신규 — `classifySafetyScore`/`summarizeSafety`/`describeSafetyForCopy` 공통 함수. 점수 80+ `safe_evidence`, 60- `toxic`, 그 사이는 `unknown`(보수 처리).
- [src/features/etl/nongsaro-garden.ts] `mapSafety` 재작성 — `toxicity.includes("없")` 단순매칭 제거. "정보 없음"(unknown)과 "독성이 없음"(안전 근거)과 "~없다고 볼 수 없음"(이중부정, 낮은 점수)을 정규식으로 구분.
- [src/app/plant/[slug]/page.tsx] `buildPlantLead`/`generateMetadata`에서 발견한 별도 버그 수정 — 점수가 0~100 스케일인데 `>= 4`로 비교해 45점도 "안전"으로 표시되던 임계값 버그. safety-policy 모듈로 교체.
- [src/app/plant/[slug]/plant-detail-content.tsx] FAQ 및 안전성 섹션에 `describeSafetyForCopy` 통일 적용.
- [src/features/diagnose/request.ts] `validateDiagnoseRequestStrict` 신규 추가 — 필드 생략은 기본값 허용, 잘못된 값(문자열 "cat", 미지원 enum 등)은 필드별 오류로 명시 거절. 기존 관대한 `parseDiagnoseRequest`/`parseDiagnoseRouteRequest`는 URL 라우트 계약 유지를 위해 보존.
- [src/app/api/diagnose/route.ts] 엄격 검증 사용, 400 + `fieldErrors` 반환.
- 테스트: `safe-01-map-safety.test.mjs`, `safe-03-strict-validation.test.mjs` (T01/T02/T06/T07/T08 케이스 포함).

### 작업 C: DATA-01~03, OPS-01
- DATA-01(날짜 단위): Drizzle SQLite `integer(mode:"timestamp")`는 초 단위 기대(node_modules 소스 확인 — 읽을 때 `*1000`, 쓸 때 `/1000`). ETL/seed 스크립트 8개(`etl-nongsaro-garden-live`, `etl-nibr-live`, `etl-nihhs-flower-live`, `etl-nongsaro-flower-live`, `etl-nibr-ktsn-live`, `etl-kfri-sample`, `etl-nibr-sample`, `seed-sample`)가 원시 SQL로 `Date.now()`(밀리초)를 직접 넣어 1000배 부풀려진 날짜가 되던 버그를 `Math.floor(Date.now()/1000)`로 전부 수정.
- OPS-01(`--limit` 파싱): `etl-nongsaro-garden-live.mjs`에 `getFlagValue`(공백/등호 두 형태 지원)와 `parsePositiveIntOrThrow`(0/음수/NaN 명시 거절) 추가. CLI 파싱을 `loadEnv()`보다 먼저 실행.
- DATA-03(coalesce 오염): 같은 파일 `upsertMetrics`에서 안전성 필드 4개(`pet_safety_score_dog/cat`, `child_safety_score`, `toxicity_notes`)만 coalesce 제거하고 `excluded` 직접 사용 — SAFE-01 수정으로 `unknown`(null) 판정이 재수집 시 과거 오염값에 덮이지 않도록. 다른 필드(난이도/광량/온도 등)는 계획서 권고대로 coalesce 보존.
- DATA-02(원본 의미 손실): `mapLight`를 첫 매칭 코드만→모든 매칭 코드의 min~max 범위 합산으로 수정(복수 광량 코드 보존). `mapWaterDays`를 4계절 평균→최소값(가장 잦은 물주기, 건조 스트레스 방지 우선)으로 변경. `origin` 결측 시 `SOURCE_LABEL`(출처 레이블)을 원산지처럼 저장하던 버그를 `null`(원산지 미확인)로 수정.
- 보류: `winterLwetTpCode`(겨울 최저온도) 매핑, 계절별 물주기 값을 스키마에 그대로 저장(마이그레이션 필요) — 공식 코드 정의 미확인 및 스키마 변경 필요로 후속 작업으로 분리.
- 테스트: `data-01-ops-01-etl-cli.test.mjs`, `data-02-normalization.test.mjs`.

### 검증
- 4개 신규 테스트(`safe-01`, `safe-03`, `data-01-ops-01`, `data-02`) 모두 통과.
- `pnpm type-check`, `pnpm build` 모두 성공 (exit 0), 22개 페이지 정상 생성.

### 확인만 하고 수정하지 않은 항목 (별도 승인/후속 작업 필요)
- `winterLwetTpCode`(겨울 최저온도) 코드→숫자 매핑: 공식 API 문서 확인 전 임의 매핑 금지.
- 계절별 물주기 값을 그대로 보존하는 스키마 컬럼 추가: DB 마이그레이션 필요.
- `SafetyAssessment`(출처 URL, 검토일, 적용 학명 범위 등 근거 메타데이터) 전체 도입: 대규모 스키마 마이그레이션 필요.
- RECO-01(공개 자격 shadow audit), RECO-02(캐시 실패/안전 실패 분리), UX-01(경쟁 요청 처리), CONTENT-01(중복 방지), SEO-01/02(사이트맵/OG) — 계획서의 작업 D~F, 다음 세션에서 진행 예정.

### 미결 사항
- `fix/safety-data-integrity` 브랜치 → `chore/remove-gemini-fix-domain` → `main` 순으로 PR 병합 필요.
- 계획서의 작업 D(CONTENT-01/OPS-01 나머지), E(RECO-01/02, UX-01), F(SEO-01/02) 미착수.
- 운영 DB에 이미 저장된 잘못된 값(밀리초 날짜, `없` 오탐으로 85점 처리된 안전성 값)의 실제 정정(백필)은 이번 세션에서 수행하지 않음 — 코드 수정과 데이터 마이그레이션은 별개이며, 데이터 정정은 운영 DB 접근 권한이 필요해 별도 승인 대상.

---

## 2026-09-30 15:14 (세션 시작 시간)

### 수행 작업
- [.env.example] `NEXT_PUBLIC_SITE_URL`을 `https://www.askore.kr` → `https://askore.kr`(non-www)로 정정. `src/env.ts`의 `DEFAULT_SITE_URL`과 `middleware.ts`의 www→non-www 리다이렉트 동작이 이미 non-www를 대표 도메인으로 삼고 있어, 문서 쪽 불일치를 코드 기준으로 맞춤.
- [.env.example] `GEMINI_API_KEY`, `GEMINI_PRO_MODEL`, `GEMINI_FLASH_MODEL`, `GEMINI_EMBEDDING_MODEL` 변수 제거.
- [STATUS.md] '현재 작업', '결정사항'의 대표 도메인을 non-www 기준으로 정정. IndexNow keyLocation 설명도 실제 코드(origin별 동적 생성) 기준으로 수정. 과거 05-10 변경 이력은 그대로 보존.
- [scripts/generate-blog-posts.mjs] 삭제 — Gemini API로 블로그 글 300개를 자동 생성하는 스크립트. 전역 규칙(외부 AI API로 콘텐츠 생성 금지)에 위배되어 제거.
- [scripts/generate-plant-posts.mjs] 삭제 — 동일 이유.
- [scripts/generate-category-posts.mjs] 삭제 — 동일 이유.
- [scripts/diversify-blog-posts.mjs] 검토 후 보존 — Gemini API를 호출하지 않고 기존 텍스트를 규칙 기반으로 치환하는 스크립트라 규칙 위반 아님.
- [src/db/schema/layer3.ts] `plantContent`, `blogPosts` 테이블의 `generatedBy` 컬럼 기본값을 `"gemini-2.5-pro"` → `"manual"`로 변경. 컬럼 자체는 기존 데이터 이력 보존을 위해 유지.
- [package.json] Gemini 관련 npm script 없음을 확인 (`db:generate`는 drizzle-kit 명령이라 무관).

### 확인만 하고 수정하지 않은 항목
- `drizzle/0000_far_slipstream.sql`, `drizzle/0001_blog_posts.sql`, `drizzle/meta/0000_snapshot.json`에 `gemini-2.5-pro` 문자열이 남아있음. 마이그레이션 이력 파일이라 수정하지 않음. 스키마 기본값 변경을 실제 마이그레이션에 반영하려면 `drizzle-kit generate`로 새 마이그레이션을 만들어야 하며, 이는 DB 연결이 필요해 별도 승인 영역으로 분리.
- 외부에서 전달받은 `askore_codex_improvement_plan_2026-09-30.md` (안전성 데이터, 추천 로직, ETL, 콘텐츠 검증 등 대규모 개선 명세) — 이번 세션 스코프 밖으로 판단, 다음 세션에서 우선순위 논의 필요.

### 설정 변경
- 없음 (환경변수 값 변경은 `.env.example` 템플릿 문서에 한정, 실제 `.env`/Vercel 환경변수는 변경하지 않음)

### 검증
- `pnpm install --frozen-lockfile`, `pnpm type-check`, `pnpm lint`, `pnpm build` 모두 성공 (exit 0).
- lint 경고 3건(img 태그, 미사용 변수)은 기존부터 있던 것으로 이번 변경과 무관.
- build 결과 22개 페이지 정상 생성 확인.

### Git 작업 관련 특이사항
- **주의**: `scripts/generate-blog-posts.mjs` 삭제 커밋(`0b93895`)이 실수로 `main` 브랜치에 직접 커밋됨. 이후 나머지 작업은 `chore/remove-gemini-fix-domain` 브랜치로 분리해 진행함. PR 생성 및 병합 여부는 사용자 확인 필요.

### 미결 사항
- `chore/remove-gemini-fix-domain` 브랜치의 PR 생성/병합 여부 확인 필요.
- main에 직접 커밋된 `0b93895`를 그대로 둘지, 별도 조치가 필요한지 사용자 확인 필요.
- 외부 개선 명세서(`askore_codex_improvement_plan_2026-09-30.md`)의 작업 범위를 다음 세션에서 우선순위별로 분리해 진행할지 논의 필요. 해당 문서는 안전성 데이터 정확성, 추천 로직, ETL 신뢰성, 콘텐츠 중복 방지 등 훨씬 큰 스코프의 작업을 요구함.
- drizzle 마이그레이션에 남은 `gemini-2.5-pro` 기본값 문자열 — 새 마이그레이션 생성은 DB 연결 및 별도 승인 필요.

---
