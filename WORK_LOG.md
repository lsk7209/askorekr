# WORK_LOG

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
