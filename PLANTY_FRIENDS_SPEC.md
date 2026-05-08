# 플랜티프렌즈 (PlantyFriends) V1 SPEC

> Claude Code 자율 실행용 종합 스펙 문서
> 작성일: 2026-05-08
> 결정 이력: 9라운드 tikitaka + 5-페르소나 리뷰 합의

---

## 0. 한 줄 요약

**한국 MZ 반려식물·가드닝 사용자 대상의 종합 pSEO 사이트.** 5만종 식물·나무 백본 위에 "한국 기후·지역 적합도 점수 + 반려동물·아이 안전성 + 난이도 + 꽃말" 4개 차별화 데이터 레이어를 얹어, 키우기 가이드와 진단 도구를 메인 진입점으로 운영. AdSense Auto Ads 단일 수익. 12주 안에 V1 완성.

---

## 1. 프로젝트 정체성 + 사이트 페르소나 v1

### 1.1 기본 정보

| 항목 | 값 |
|---|---|
| 프로젝트 코드명 | `planty-friends` |
| 사이트명 (한글) | 플랜티프렌즈 |
| 사이트명 (영문) | PlantyFriends |
| 도메인 후보 | `plantyfriends.com` / `plantyfriends.kr` / `plantyfriends.co.kr` (Phase 0에서 실확보 검증) |
| 언어 | 한국어 100% (영문 `/en/` 프리픽스 V2 이후 검토) |
| 타겟 시장 | 한국 (Naver·Daum·Google·AI 검색) |

### 1.2 사이트 페르소나 (페르소나 시스템 v1)

```yaml
persona:
  brand_name: 플랜티프렌즈
  category: gardening_lifestyle
  target_audience:
    primary: "20~35세 MZ 여성, 도시 거주, 반려식물 1~5개 보유 또는 입문 검토 중"
    secondary: "30~45세 남녀, 정원·베란다 가드닝 실전 운영자"
  tone:
    voice: 친근·캐주얼 (반말 아님, 친구 같은 존댓말)
    persona_first_person: "저희" (1인칭 사용시), 식물 의인화 OK ("이 친구는~")
    avoid: 권위적·학술적 톤, 의료·약효 단정 표현, 과장된 마케팅 카피
  visual_direction:
    palette: "세이지 그린·아이보리·테라코타 부드러운 자연 톤"
    typography: "Pretendard 또는 Spoqa Han Sans Neo, 본문 16~17px, 행간 1.7"
    photography: "자연광·식물 클로즈업 중심, 인스타그램 친화"
  trust_signals:
    - "공공 데이터 출처(국립수목원·국립생물자원관) 페이지 하단 명시"
    - "Quick Facts 박스에 측정 단위·범위 명확 표기"
    - "필자 페이지 ‘플랜티프렌즈 편집팀 + AI 보조’ 명시 (정직)"
    - "각 페이지 마지막 업데이트 일시 노출"
  ymyl_classification: low (약초·효능 V1 제거로 YMYL 위험 축소)
  forbidden_content:
    - 의료적 효능·약효 단정 ("치료한다", "낫는다", "복용 권장")
    - 반려동물 의료 단정 ("이 식물 먹으면 무조건 안전" 등)
    - 출처 없는 통계·연구 인용
```

이 페르소나는 모든 콘텐츠 생성 프롬프트의 system message에 강제 주입.

---

## 2. V1 페이지 타입 + URL 구조

### 2.1 V1 페이지 우선순위 (5-페르소나 합의 후 재조정)

| 순위 | 페이지 타입 | URL 패턴 | 발행 규모 (V1 종료 시) | 역할 |
|---|---|---|---|---|
| 1 | 키우기 가이드 (how-to) | `/guide/[slug]` | 200~500편 | **메인 진입점** · CPC 높음 · MZ 사용자 검색 의도 정확 매칭 |
| 2 | 도구·진단 | `/tools/diagnose` (단일 인터랙티브) `/diagnose/[region]/[env]` (캐시 결과) | 캐시 결과 ~1만+ | **차별화 무기** · AEO 유리 · AI Overview 카니발 면역 |
| 3 | 종 도감 (backbone) | `/plant/[slug]` | 5만종 backbone, 실 발행 ~3.5만 | 키워드 풀 · backbone · 진입점 아님 (도구·가이드에서 진입) |
| 4 | 꽃말·전통문화 | `/meaning/[slug]` | 종 도감의 sub-section + 별도 page (선물·기념일 키워드) | 롱테일 차별화 |

### 2.2 보조 페이지

| URL 패턴 | 용도 |
|---|---|
| `/category/[slug]` | 카테고리 허브 (실내식물·다육·관엽·구근·정원수·조경수·과수·허브 등) |
| `/about` | 사이트 소개 + 데이터 출처 + 편집 정책 |
| `/contact` | 연락처 + 제보 폼 |
| `/privacy` | 개인정보처리방침 (한국어 PIPA 기준) |
| `/terms` | 이용약관 |
| `/disclaimer` | 면책 고지 (정보 제공 목적, 의료·전문가 상담 권고) |
| `/sitemap.xml` + `/sitemap-{n}.xml` | 분할 사이트맵 (카테고리별 ~15개) |
| `/robots.txt` | sitemap_index 참조 |
| `/ads.txt` | AdSense 인증 |

### 2.3 V1.5+ 페이지 (Phase 5 이후)

- `/compare/[slug-a]-vs-[slug-b]` 비교 페이지
- `/question/[slug]` 자연어 질문 Q&A 허브
- 어필리에이트 상품 페이지 (쿠팡 파트너스)

---

## 3. 차별화 4 데이터 레이어

V1의 거의 유일한 SERP·LLM 인용 무기. 각 레이어는 정량 데이터로 backend에 저장되고, 프론트에서 시각화 + LLM 인용용 Quick Facts 박스로 노출.

### 3.1 한국 기후·지역 적합도 점수 (mandatory, 차별화 코어)

- 입력: 사용자가 선택한 시·군·구 행정코드
- 출력: 0~100 점수 + 적합도 등급 (★~★★★★★)
- 알고리즘: 식물의 내한성·내서성·일조 요구·강수 요구 vs 지역의 KMA 월별 평균기온·최저기온·강수량·습도·일조시간 매칭. 가중 평균 후 정규화.
- 이 점수는 진단 도구 1단계 출력 + 종 도감 페이지 Quick Facts 박스 + 카테고리 허브 정렬 키.

### 3.2 반려동물·아이 안전성

- 출력: `pet_safety_score_dog`, `pet_safety_score_cat`, `child_safety_score` (각 0~100)
- 데이터 소스: ASPCA 독성 데이터(영문 → 한국어 매핑) + 국립생물자원관 + 학술 논문 검토 결과
- 진단 도구 3단계에서 "반려동물 있나요?" 입력 시 안전성 점수 ≥80 종으로 후보 필터링.

### 3.3 난이도·관리 부담 점수

- 출력: `difficulty_score` (0~100, 100 = 가장 어려움)
- 입력 메트릭: 광량 요구의 까다로움, 물주기 빈도 변동성, 온도 민감도, 병충해 취약성, 분갈이 빈도
- 진단 도구 5단계에서 "초보·중급·고수" 자가평가와 매칭.

### 3.4 꽃말·전통문화

- 출력: `flower_meaning` JSON (대표 꽃말, 색상별 꽃말, 한국·중국·일본·서양 문화별 의미, 어울리는 선물 상황)
- 약초·효능 V1 제거됨. "전통적으로 ~로 알려져 있다" 같은 문화·역사 기록만 유지.
- 별도 `/meaning/[slug]` 페이지 + 종 도감 페이지 sub-section.

---

## 4. 데이터 소스

### 4.1 1차 시드 (Phase 1에서 사용)

| 소스 | 용도 | 인증 |
|---|---|---|
| 국립수목원 국가표준식물목록 API | 분류·학명 마스터, 한국명, 이명, ~5만종 | API 키 신청 |
| 국립생물자원관 생물종지식정보 | 서식지·사진·일부 형태 정보 | API 키 신청 |
| 위키피디아 한국어 | 보충 설명·일부 이미지 (CC BY-SA 표기 필수) | 공개 API |

### 4.2 보조 (Phase 2 이후 추가)

- 농촌진흥청 농업기술포털 (재배·작물)
- 산림청 임업·수목 데이터 (조경수·정원수)
- KMA 기상청 지역별 평년값 (적합도 점수 입력)
- 행정안전부 표준 행정코드 (시·군·구)

### 4.3 의도적 제외

- 약초·효능 데이터 (YMYL 리스크 축소 위해 V1에서 완전 제외)
- 사용자 사진 업로드 (저작권·moderation 부담)

---

## 5. 데이터 모델 (Drizzle ORM 스키마)

### 5.1 Layer 1: Raw 공공 데이터

```typescript
// src/db/schema/layer1.ts
import { sqliteTable, text, integer, real, primaryKey, index } from 'drizzle-orm/sqlite-core';

export const plants = sqliteTable('plants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  scientificName: text('scientific_name').notNull().unique(),  // 학명 (Linnaean)
  koreanName: text('korean_name').notNull(),                    // 대표 한국명
  slug: text('slug').notNull().unique(),                        // URL slug (예: "monstera-deliciosa")
  family: text('family'),                                       // 과
  genus: text('genus'),                                         // 속
  synonyms: text('synonyms', { mode: 'json' }).$type<string[]>(),
  origin: text('origin'),                                       // 원산지
  gbifId: text('gbif_id'),                                      // GBIF taxonKey
  wikiUrlKo: text('wiki_url_ko'),                               // 한국어 위키 URL
  sourceRefs: text('source_refs', { mode: 'json' }).$type<{
    국립수목원?: string;
    국립생물자원관?: string;
    위키피디아?: string;
  }>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (t) => ({
  familyIdx: index('plants_family_idx').on(t.family),
  genusIdx: index('plants_genus_idx').on(t.genus),
  slugIdx: index('plants_slug_idx').on(t.slug),
}));

export const plantImages = sqliteTable('plant_images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  plantId: integer('plant_id').notNull().references(() => plants.id),
  url: text('url').notNull(),
  source: text('source').notNull(),                             // 'kfri'|'nibr'|'wiki'|'cdn'
  license: text('license').notNull(),                           // 'CC-BY-SA-3.0' 등
  attribution: text('attribution'),                             // 위키 등 표기 필요한 경우
  isPrimary: integer('is_primary', { mode: 'boolean' }).default(false),
  width: integer('width'),
  height: integer('height'),
}, (t) => ({
  plantIdx: index('plant_images_plant_idx').on(t.plantId),
}));

export const regions = sqliteTable('regions', {
  code: text('code').primaryKey(),                              // 행안부 표준 코드 (예: "11680")
  sido: text('sido').notNull(),                                 // 시·도 (예: "서울특별시")
  sigungu: text('sigungu').notNull(),                           // 시·군·구 (예: "강남구")
  latitude: real('latitude'),
  longitude: real('longitude'),
});

export const regionClimate = sqliteTable('region_climate', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  regionCode: text('region_code').notNull().references(() => regions.code),
  month: integer('month').notNull(),                            // 1~12
  avgTempC: real('avg_temp_c'),
  minTempC: real('min_temp_c'),
  maxTempC: real('max_temp_c'),
  precipitationMm: real('precipitation_mm'),
  humidityPct: real('humidity_pct'),
  sunshineHours: real('sunshine_hours'),
  source: text('source').default('KMA'),                        // KMA 평년값 (1991~2020)
}, (t) => ({
  regionMonthIdx: index('region_climate_region_month_idx').on(t.regionCode, t.month),
}));
```

### 5.2 Layer 2: Derived 정량 지표 (차별화 4 레이어의 실체)

```typescript
// src/db/schema/layer2.ts
export const plantMetrics = sqliteTable('plant_metrics', {
  plantId: integer('plant_id').primaryKey().references(() => plants.id),

  // 차별화 1: 한국 기후 적합도 (지역별 점수 JSON)
  climateScoreByRegion: text('climate_score_by_region', { mode: 'json' })
    .$type<Record<string, number>>(),                           // { "11680": 87, "26110": 92, ... }

  // 차별화 2: 안전성
  petSafetyScoreDog: integer('pet_safety_score_dog'),           // 0~100
  petSafetyScoreCat: integer('pet_safety_score_cat'),
  childSafetyScore: integer('child_safety_score'),
  toxicityNotes: text('toxicity_notes'),                        // 짧은 노트 (의료 단정 금지)

  // 차별화 3: 난이도
  difficultyScore: integer('difficulty_score'),                 // 0~100 (높을수록 어려움)

  // 환경 분류 + 정량 범위
  indoorOutdoorClass: text('indoor_outdoor_class'),             // 'indoor'|'outdoor'|'both'
  lightLuxMin: integer('light_lux_min'),
  lightLuxMax: integer('light_lux_max'),
  waterFreqDays: integer('water_freq_days'),                    // 이상적 물주기 간격 (일)
  tempMinC: real('temp_min_c'),
  tempMaxC: real('temp_max_c'),
  humidityMinPct: integer('humidity_min_pct'),
  humidityMaxPct: integer('humidity_max_pct'),

  // 차별화 4: 꽃말·전통문화
  flowerMeaning: text('flower_meaning', { mode: 'json' }).$type<{
    primary?: string;
    byColor?: Record<string, string>;
    byCulture?: { ko?: string; cn?: string; jp?: string; west?: string };
    giftOccasions?: string[];
  }>(),

  derivedAt: integer('derived_at', { mode: 'timestamp' }).notNull(),
});

export const plantTaxonomyPath = sqliteTable('plant_taxonomy_path', {
  plantId: integer('plant_id').primaryKey().references(() => plants.id),
  pathSlash: text('path_slash').notNull(),                      // 'plantae/tracheophyta/.../monstera-deliciosa'
  depth: integer('depth').notNull(),
  category: text('category'),                                   // 'indoor-foliage'|'succulent'|'garden-tree' 등 매핑
}, (t) => ({
  pathIdx: index('plant_taxonomy_path_path_idx').on(t.pathSlash),
  categoryIdx: index('plant_taxonomy_path_category_idx').on(t.category),
}));

export const dedupEmbeddings = sqliteTable('dedup_embeddings', {
  contentId: integer('content_id').primaryKey().references(() => plantContent.id),
  plantId: integer('plant_id').notNull(),
  embeddingPool: text('embedding_pool').notNull(),              // 분류군별 pool (예: 'maple-genus')
  embedding: text('embedding', { mode: 'json' }).$type<number[]>(),  // 768~1536 dim
}, (t) => ({
  poolIdx: index('dedup_embeddings_pool_idx').on(t.embeddingPool),
}));
```

### 5.3 Layer 3: AI 해석 텍스트

```typescript
// src/db/schema/layer3.ts
export const plantContent = sqliteTable('plant_content', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  plantId: integer('plant_id').notNull().references(() => plants.id).unique(),

  // AEO/LLM 인용 최적화 (50-150 word chunks)
  summaryOneLiner: text('summary_one_liner'),
  quickFactsJson: text('quick_facts_json', { mode: 'json' }).$type<{
    label: string;
    value: string;
    unit?: string;
  }[]>(),

  // 키우기 가이드 (페르소나 톤 강제)
  careGuideIntro: text('care_guide_intro'),
  careGuideWater: text('care_guide_water'),
  careGuideLight: text('care_guide_light'),
  careGuideTemperature: text('care_guide_temperature'),
  careGuideRepotting: text('care_guide_repotting'),
  careGuidePest: text('care_guide_pest'),

  // 꽃말·전통문화 (약초·효능 제외)
  flowerMeaningText: text('flower_meaning_text'),

  // FAQ
  faqJson: text('faq_json', { mode: 'json' }).$type<{ q: string; a: string }[]>(),

  // 메타
  qualityScore: real('quality_score'),                          // 0~100
  qualityBreakdown: text('quality_breakdown', { mode: 'json' }).$type<{
    eeat: number;
    persona: number;
    seo: number;
    factual: number;
    aiCliche: number;
  }>(),
  generatedBy: text('generated_by').default('gemini-2.5-pro'),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  lastRevalidatedAt: integer('last_revalidated_at', { mode: 'timestamp' }),
  isPublished: integer('is_published', { mode: 'boolean' }).default(false),
}, (t) => ({
  publishedIdx: index('plant_content_published_idx').on(t.isPublished, t.publishedAt),
}));

export const careGuides = sqliteTable('care_guides', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),                        // '/guide/[slug]'
  title: text('title').notNull(),
  category: text('category'),                                   // 'watering'|'repotting'|'pest'|'season' 등
  bodyMarkdown: text('body_markdown').notNull(),
  qualityScore: real('quality_score'),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  isPublished: integer('is_published', { mode: 'boolean' }).default(false),
}, (t) => ({
  slugIdx: index('care_guides_slug_idx').on(t.slug),
  publishedIdx: index('care_guides_published_idx').on(t.isPublished, t.publishedAt),
}));

export const toolsResults = sqliteTable('tools_results', {
  cacheKey: text('cache_key').primaryKey(),                     // 'region:11680|env:indoor|pet:cat|exp:beginner'
  regionCode: text('region_code').notNull(),
  environment: text('environment').notNull(),                   // 'indoor'|'outdoor'
  petType: text('pet_type'),                                    // 'cat'|'dog'|'both'|'none'|null
  experience: text('experience'),                               // 'beginner'|'intermediate'|'expert'|null
  resultPlantIds: text('result_plant_ids', { mode: 'json' }).$type<number[]>(),
  computedAt: integer('computed_at', { mode: 'timestamp' }).notNull(),
});

export const dictionaryCategories = sqliteTable('dictionary_categories', {
  slug: text('slug').primaryKey(),                              // '/category/indoor-foliage'
  title: text('title').notNull(),
  description: text('description'),
  parentSlug: text('parent_slug'),
  plantCount: integer('plant_count').default(0),
});
```

### 5.4 Pipeline·운영 테이블

```typescript
// src/db/schema/pipeline.ts
export const pipelineRuns = sqliteTable('pipeline_runs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  stage: text('stage').notNull(),                               // 'etl'|'derive'|'generate'|'critic'|'dedup'
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  finishedAt: integer('finished_at', { mode: 'timestamp' }),
  status: text('status').notNull(),                             // 'running'|'success'|'fail'
  inputCount: integer('input_count'),
  outputCount: integer('output_count'),
  rejectedCount: integer('rejected_count'),
  errorLog: text('error_log'),
  meta: text('meta', { mode: 'json' }),
});

export const qualityGateFailures = sqliteTable('quality_gate_failures', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  plantId: integer('plant_id'),
  contentId: integer('content_id'),
  gate: text('gate').notNull(),                                 // 'rule'|'critic'|'lint'|'dedup'
  reason: text('reason').notNull(),
  detectedAt: integer('detected_at', { mode: 'timestamp' }).notNull(),
  resolved: integer('resolved', { mode: 'boolean' }).default(false),
});

export const lintViolations = sqliteTable('lint_violations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  contentId: integer('content_id').notNull(),
  rule: text('rule').notNull(),                                 // 'banned_word'|'missing_field'|'persona_mismatch'
  word: text('word'),                                           // 금지어인 경우
  field: text('field'),                                         // 빠진 필드인 경우
  detectedAt: integer('detected_at', { mode: 'timestamp' }).notNull(),
});

export const publishQueue = sqliteTable('publish_queue', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  plantId: integer('plant_id'),
  guideId: integer('guide_id'),
  scheduledFor: integer('scheduled_for', { mode: 'timestamp' }).notNull(),
  priority: integer('priority').default(50),                    // 0~100, 높을수록 먼저
  attempts: integer('attempts').default(0),
  status: text('status').default('queued'),                     // 'queued'|'processing'|'done'|'failed'
}, (t) => ({
  scheduledIdx: index('publish_queue_scheduled_idx').on(t.status, t.scheduledFor),
}));
```

---

## 6. 콘텐츠 파이프라인 (5-stage Quality Gate)

모든 페이지는 다음 5단계를 100% 통과해야 발행. 한 단계라도 실패 시 `quality_gate_failures` 기록 + `is_published=false`.

### Stage 1: Rule-based Pre-check

**자동 reject 조건 (필수 필드)**
- 학명 없음
- 한국명 없음
- Layer 1 사진 0장
- Layer 2 `climate_score_by_region` 비어있음
- Layer 2 `indoor_outdoor_class` 미정

→ 이 단계에서 약 30%가 reject. 5만종 → 실 발행 후보 ~3.5만종으로 정해짐.

### Stage 2: Gemini Pro Generate

- 모델: `gemini-2.5-pro` (생성용)
- 시스템 프롬프트: 페르소나 강제 (1.2 참조) + 강 프레이밍 lint 사전 임베드
- 입력: Layer 1 + Layer 2 데이터 JSON
- 출력: Layer 3 모든 필드 (summary, quick_facts, care_guide_*, flower_meaning_text, faq_json)
- Few-shot 예시 3개 페르소나 톤 일관성 강화

### Stage 3: Critic + Rewrite

- 모델: `gemini-2.5-pro` (critic mode, 별도 시스템 프롬프트)
- 5축 평가 (각 0~20점, 총 100):
  - **EEAT** (출처·근거·정확성)
  - **페르소나 일치도** (톤·어투·금지어 위반 없음)
  - **SEO·AEO** (키워드 포함·Quick Facts 박스·FAQ 구조)
  - **사실 근거** (Layer 1·2 데이터와 모순 없음)
  - **AI 클리셰 검출** ("매혹적인", "놀라운", "주목할 만한" 등 빈도 측정)
- 85점 미달 → 약점 영역 보강 프롬프트로 재생성 (최대 3회)
- 3회 실패 → `manual_review_queue`로 이관 (자동 발행 안 함)

### Stage 4: Lint (금지어·필수필드 자동 검출)

```yaml
banned_words:
  medical_efficacy:
    - "치료"
    - "낫는다"
    - "복용"
    - "효능 ~함"
    - "약효"
    - "병이 낫"
  pet_medical_certainty:
    - "무조건 안전"
    - "절대 안전"
    - "먹어도 OK"
  unsupported_claims:
    - "연구 결과" (출처 없을 시)
    - "전문가가" (출처 없을 시)
  ai_cliches_threshold:
    - "매혹적인" (페이지당 1회 초과시 reject)
    - "놀라운" (페이지당 2회 초과시 reject)
    - "주목할 만한" (페이지당 1회 초과시 reject)

required_persona_signals:
  - 친근 존댓말 ("~예요", "~답니다") 최소 5회
  - 식물 의인화 표현 ("이 친구", "~를 좋아해요") 최소 1회
```

위반 시 `lint_violations`에 기록 + `is_published=false`.

### Stage 5: Cosine Dedup

- 임베딩 모델: Gemini text embedding (768 dim)
- **분류군별 pool 분리** (예: 단풍나무 속 30+ species는 같은 pool에서만 dedup)
- 임계값: cosine similarity ≥ 0.85 → reject (학명 token weighting 추가로 가까운 분류군 false positive 완화)
- pool 외 cross-pool은 임계값 0.92 (더 관대)

---

## 7. 진단 도구 (Quick + 정밀 5-step)

### 7.1 Quick (1-2 step)

**Step 1: 지역**
- UI: 시·도 → 시·군·구 2단 select
- 출력: `regionCode` → `climateScoreByRegion[regionCode]` 활성화

**Step 2: 환경**
- UI: 토글 ("실내" / "실외" / "둘 다 가능")
- 출력: `indoorOutdoorClass` 필터

→ 이 단계 결과: 5만종 후보 → ~수천 종 후보 (지역 적합도 ≥70 + 환경 일치)

### 7.2 정밀 (3-5 step, 옵션)

**Step 3: 반려동물·아이**
- UI: 체크박스 ("강아지", "고양이", "어린 자녀")
- 출력: 안전성 점수 ≥80 필터 → ~수백 종

**Step 4: 광량·공간**
- UI: 광량 (직사광·반양지·간접광·그늘), 공간 크기 (소·중·대)
- 출력: light_lux_min/max + 식물 크기 매칭 → ~수십 종

**Step 5: 관리 빈도·경험**
- UI: 경험 자가평가 (초보·중급·고수), 주당 케어 가능 시간
- 출력: difficulty_score 매칭 → top 10

### 7.3 결과 페이지

- URL: `/diagnose/[regionCode]/[env]?pet=...&light=...&difficulty=...`
- SSR + 24h ISR (`tools_results` 캐시 활용)
- top 10 카드 + 각 카드에 적합도 점수·왜 추천인지 한 줄·종 도감 페이지 링크
- 결과 페이지 footer에 비강제 이메일 캡처 1회 ("주간 가드닝 팁 받기")

---

## 8. 인프라 + 기술 스택

### 8.1 핵심 스택

| 영역 | 선택 |
|---|---|
| 프론트엔드 | Next.js 15 (App Router) |
| 호스팅 | Vercel Pro (paid) |
| 데이터베이스 | Turso (libSQL, 분산) |
| ORM | Drizzle ORM |
| 패키지 매니저 | pnpm |
| CI/CD | GitHub Actions + Vercel Git Integration |
| 크론 | Vercel Cron (paid 필수) |
| AI | Gemini 2.5 Pro (생성·critic), Gemini 2.5 Flash (bulk·embed) |
| 결제 | (V1 없음. V1.5에서 PortOne v2 + Toss 검토) |
| 이메일 | Resend API |
| 모니터링 | Vercel Analytics + GA4 + GSC API + AdSense Management API |

### 8.2 페이지 렌더링 전략

| 페이지 타입 | 전략 | revalidate |
|---|---|---|
| `/plant/[slug]` (5만+) | ISR | 24h |
| `/guide/[slug]` (~500) | SSG | on-demand |
| `/category/[slug]` | ISR | 12h |
| `/diagnose/...` (캐시 결과) | ISR | 7d |
| `/tools/diagnose` (인터랙티브) | CSR + SSR shell | - |
| `/meaning/[slug]` | ISR | 24h |
| `/about` `/contact` `/privacy` `/terms` `/disclaimer` | SSG | on-demand |

빌드 시간 폭발 방지: 5만 페이지 초기 prerender 안 함. 첫 방문 시 ISR로 생성.

### 8.3 사이트맵 분할

`next-sitemap` 또는 자체 generator. 단일 sitemap.xml 5만 URL 한계 회피.

```
/sitemap.xml                 (sitemap_index)
  ├── /sitemap-plants-1.xml  (5천 URL)
  ├── /sitemap-plants-2.xml
  ├── ...
  ├── /sitemap-plants-10.xml
  ├── /sitemap-guides.xml
  ├── /sitemap-categories.xml
  └── /sitemap-meanings.xml
```

각 sitemap의 `lastmod`는 정확한 페이지 변경 일시 반영. 모든 페이지 동일 일시 = Scaled Content Abuse 패턴 트리거 → blog-optimizer 스킬의 sitemap_validator로 정기 검증.

### 8.4 발행 큐 (5천/일 ramp 처리)

GitHub Actions 단일 워크플로 30분 한계 못 맞춤 → Vercel Cron + Turso queue 조합.

```
Vercel Cron (every 5 min, paid):
  → /api/internal/publish-tick
  → publish_queue에서 status='queued' AND scheduled_for <= now() LIMIT 50
  → 50개 청크 처리 (Layer 3 generation + lint + dedup + DB write + revalidatePath)
  → 청크 완료 후 다음 5분 tick 대기
```

5천/일 = 시간당 ~210 = 5분당 ~17.5 → 50 청크면 충분 마진. AdSense 검수 통과 후에만 ramp 활성화.

---

## 9. AI 사용 정책

### 9.1 모델 매트릭스

| 작업 | 모델 | 이유 |
|---|---|---|
| Layer 3 본문 생성 | gemini-2.5-pro | 품질 우선, 페르소나 일관성 |
| Critic 평가 | gemini-2.5-pro | 동일 모델 self-critic, 5축 점수 |
| Bulk ETL 정제·번역 | gemini-2.5-flash | 비용·속도 우선 |
| 임베딩 (dedup) | gemini-text-embedding-004 | dim 768, 분류군별 pool 분리 |
| Claude (백업) | (사용 안 함) | 메모리 패턴: Claude는 production 콘텐츠 파이프라인에 사용 안 함 |

### 9.2 Few-shot 예시

페르소나 톤 일관성을 위해 모든 generate 프롬프트에 3개 few-shot 예시 임베드. 예시는 `prompts/few-shot/plant-content-{1..3}.md`에 저장하고 Phase 1에서 사람이 수동 작성.

### 9.3 Rate Limit

- Gemini Pro: 분당 60 요청, 일 10만 요청 (paid tier)
- 초과 시 Turso queue에 backoff 5/15/30분 재시도

---

## 10. 수익 모델

### 10.1 V1 (Phase 4 종료까지)

- **AdSense Auto Ads** 단일 (전체 페이지)
- 광고 정책 친화 디자인:
  - fold 위 광고 슬롯 자리 보장 (CLS 최소화 위해 `min-height` 명시)
  - 본문 길이 800자 이상 페이지에만 in-article ad
  - 모바일 sticky bottom 광고 1개
- 푸터 비강제 이메일 캡처 1회 ("주간 가드닝 팁 받기", Resend)

### 10.2 V1.5+ (Phase 5)

- 쿠팡 파트너스 (화분·영양제·원예도구·조명) — 가이드·진단 결과 페이지에서 선별 노출
- 식물 분양몰 어필리에이트 (선별)
- 자체 프리미엄 진단 도구 (월 구독 또는 일회 결제, PortOne v2)

### 10.3 AdSense 계정 결정 (보류)

도메인 실확보 후 결정. 별도 신규 계정이 추천 (Revenue PM 페르소나 합의). Phase 0 종료 시 결정.

---

## 11. YMYL · 콘텐츠 안전 정책

### 11.1 V1 의도적 제거

- **약초·효능** 콘텐츠 V1 완전 제거. 차별화 4 layer는 "꽃말·전통문화"로만 유지.
- 의료적 효능·약효 단정은 Stage 4 lint에서 자동 reject.

### 11.2 반려동물·아이 안전성 표시 정책

- 안전성 점수는 `pet_safety_score_*` (0~100) 정량 표시 + 출처(ASPCA·국립생물자원관) 명시.
- "무조건 안전" 같은 단정은 Stage 4 lint에서 자동 reject.
- 모든 안전성 페이지 하단에 "수의사 상담 권고" 디스클레이머 자동 삽입.

### 11.3 디스클레이머

`/disclaimer` 페이지 + 모든 페이지 footer 1줄 + 안전성 섹션 풀스크린 모달 1회 노출.

```
"본 사이트의 정보는 일반 가드닝 참고용입니다. 반려동물의 식물 섭취 의심 시 즉시 수의사에게 문의하세요. 응급실: 1588-7651 (사단법인 한국수의사회 24시간 상담)"
```

### 11.4 March 2026 코어 업데이트 대응

- Holistic CWV (LCP·INP·CLS) 모든 페이지 green 유지.
- Scaled Content Abuse 방지: sitemap lastmod 정확, 발행 속도 ramp 지키기, 페르소나 일관성 lint.
- HCU(Helpful Content Update) 대응: Quick Facts 박스 + FAQ + 구조화 데이터 (Schema.org `Plant`·`HowTo`·`FAQPage`).

---

## 12. 발행 Ramp + AdSense 검수

### Phase 2 (W4): 200 시드 + AdSense 검수

- 200종 고품질 시드 (Layer 1·2 다 채워진 종 우선 선정, 카테고리 균형: 실내 60% + 정원수 25% + 다육·구근 15%)
- 키우기 가이드 30편 동시 발행 (V1 1순위)
- 진단 도구 quick(지역+환경) 작동
- 카테고리 허브 8개 (실내·다육·관엽·구근·정원수·조경수·과수·허브)
- 필수 페이지 (About·Contact·Privacy·Terms·Disclaimer) 작성 완료
- AdSense 검수 신청 → 14~30일 대기 평균
- 대기 중 정밀 진단(3-5 step) UI 개발 병행

### Phase 3 (W5-6): Ramp 500/일

- 검수 통과 시 500/일 발행 시작
- 5분 cron tick × 50 청크/tick = 12 tick/시간 = 600 페이지/시간 capacity. 일 발행 500은 마진 충분.
- 카테고리 허브 자동 생성 (분류군 50+개 추가)
- 키우기 가이드 추가 발행 (목표 W6 종료 시 200편 누적)

### Phase 4 (W7-12): Ramp 5천/일

- 일 1천 → 2천 → 3천 → 5천 단계적 증속 (주별)
- 5만종 backbone 완성 (실 발행 ~3.5만)
- 정밀 진단 5-step 활성화
- 꽃말·전통문화 별도 페이지 발행 시작

### 검수 거절 시 대응

- 거절 메일 수신 → adsense-optimizer 스킬 트리거 (5단계 파이프라인)
- 30일 대기 + 보강 후 재신청. 4회 이상 거절 시 60일 대기.
- 거절 사유 분석 + PATCH_PLAN.md 자동 생성

---

## 13. API 라우트

| 라우트 | 메서드 | 용도 |
|---|---|---|
| `/api/diagnose` | POST | 진단 도구 실시간 매칭 |
| `/api/plants/[slug]` | GET | 종 도감 데이터 (ISR 백업용) |
| `/api/categories/[slug]` | GET | 카테고리 허브 데이터 |
| `/api/guides/[slug]` | GET | 키우기 가이드 데이터 |
| `/api/newsletter/subscribe` | POST | 이메일 캡처 (Resend) |
| `/api/internal/publish-tick` | POST | Vercel Cron 진입점 (인증 필요) |
| `/api/internal/quality-gate-report` | GET | 큐 상태·실패율 모니터링 |
| `/api/internal/indexnow` | POST | 발행 시 Naver·Bing 동시 ping |
| `/api/internal/sitemap-revalidate` | POST | sitemap_index 재생성 트리거 |

내부 API는 `INTERNAL_API_TOKEN` 헤더 인증.

---

## 14. 환경 변수

```bash
# Vercel + Next.js
NEXT_PUBLIC_SITE_URL=https://plantyfriends.com
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX

# Database (Turso)
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...

# AI Providers
GEMINI_API_KEY=...
GEMINI_PRO_MODEL=gemini-2.5-pro
GEMINI_FLASH_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=text-embedding-004

# Public Data Sources
KFRI_API_KEY=...                    # 국립수목원
NIBR_API_KEY=...                    # 국립생물자원관
KMA_API_KEY=...                     # 기상청 (Phase 2 이후)

# Search Engine Indexing
INDEXNOW_KEY=...                    # IndexNow (Naver·Bing 동시)
GOOGLE_INDEXING_API_KEY=...
NAVER_SEARCH_ADVISOR_KEY=...

# Analytics + Monetization
GSC_API_CLIENT_ID=...
GSC_API_CLIENT_SECRET=...
ADSENSE_API_CLIENT_ID=...
ADSENSE_API_CLIENT_SECRET=...

# Email
RESEND_API_KEY=...
NEWSLETTER_FROM=hello@plantyfriends.com

# Internal
INTERNAL_API_TOKEN=...              # /api/internal/* 보호
CRON_SECRET=...                     # Vercel Cron 인증
NODE_ENV=production
```

---

## 15. SEO·AEO·GEO 표준

### 15.1 메타 태그 (모든 페이지)

```html
<title>{식물명} 키우기 가이드 + 한국 기후 적합도 | 플랜티프렌즈</title>
<meta name="description" content="{식물명}의 한국 지역별 적합도, 반려동물 안전성, 난이도, 꽃말까지. 데이터 기반 가드닝 가이드.">
<meta property="og:image" content="...">
<link rel="canonical" href="...">
<meta name="robots" content="index, follow, max-image-preview:large">
```

### 15.2 구조화 데이터 (Schema.org)

- `/plant/[slug]` → `Plant` (custom) + `Article` + `BreadcrumbList`
- `/guide/[slug]` → `HowTo` + `FAQPage` (적용 가능 시)
- `/diagnose/...` → `WebApplication` + `BreadcrumbList`
- `/category/[slug]` → `CollectionPage` + `BreadcrumbList`

### 15.3 LLM 인용 최적화

- 모든 종 도감 페이지 fold 위에 **Quick Facts 박스**: 학명·한국명·내한성·광량·물주기·반려동물 안전 (50-150 단어 청크)
- FAQ 5-7개 (FAQPage schema)
- 인용 가능한 정량 데이터 우선 노출 (적합도 점수·pH 범위·광량 lux 등)

### 15.4 IndexNow + 다중 검색엔진 ping

발행·갱신 시 자동 ping (blog-optimizer 스킬 패턴 차용):
- IndexNow → Bing·Yandex·Seznam
- Google Indexing API
- Naver Search Advisor ping
- sitemap.xml 재제출

---

## 16. 모니터링 + 운영

### 16.1 자동 모니터링 (Phase 3 이후)

- **GSC**: 색인률·노출·CTR·평균순위 (일별 수집)
- **GA4**: 세션·체류시간·이탈률·진단 도구 완료율
- **AdSense API**: RPM·CTR·정책 위반 알림
- **Vercel**: 빌드·함수 호출·에러율
- **Turso**: 쿼리 부하·DB 크기

### 16.2 일일 보고서 (자동, 새벽 5시)

- 어제 발행 페이지 수·실패율
- AdSense 수익 (전일·7일·30일)
- 상위 트래픽 페이지 top 20
- 검수 진행 상태 (검수 단계별)
- 5-페르소나 통과 체크리스트 위반 알림

저장: `~/planty-friends-runs/<날짜>/daily-report.md`

### 16.3 알림 (Email/Slack)

- AdSense 정책 위반 즉시
- 발행 실패율 ≥ 10%
- GSC 색인률 급락 (전주 대비 30%↓)
- AI Overview 카니발 의심 (CTR 30%↓ + 노출 유지)

---

## 17. 12주 Sprint 계획

### Phase 0 (W1) — Setup

- [ ] 도메인 실확보 (plantyfriends.com 가용성 확인 → 대안: .kr / .co.kr)
- [ ] AdSense 계정 결정 (별도 신규 계정 권장 — 확정 후 신청만 보류)
- [ ] GitHub 신규 레포 생성 (`planty-friends`)
- [ ] Vercel 프로젝트 + Turso DB 셋업
- [ ] Drizzle schema 마이그레이션 v1 (Layer 1·2·3 + Pipeline 모든 테이블)
- [ ] 국립수목원·생자관 API 키 신청·테스트
- [ ] Gemini API 키 + paid tier 설정
- [ ] 페르소나 v1 JSON 작성 (`config/persona.json`)
- [ ] 금지어·필수필드 lint 사전 v1 작성 (`config/lint-rules.yaml`)
- [ ] 5-페르소나 리뷰 체크리스트 작성 (`docs/persona-review.md`)
- [ ] CLAUDE.md + CLAUDE_CODE_SEO_PROMPT.md 적용

### Phase 1 (W2-3) — Pipeline 구축

- [ ] Layer 1 ETL: 수목원 → plants/plant_images/regions/region_climate
- [ ] Layer 2 derive: 적합도 스코어링 알고리즘 + 안전성 스코어 + 난이도 스코어 + 꽃말 매핑
- [ ] Layer 3 generate: Gemini Pro 프롬프트 + few-shot 3개 + 페르소나 system prompt
- [ ] Critic + rewrite 루프 (5축 평가, 85점 게이트, 3회 재시도)
- [ ] Lint 자동 검출 (banned words + persona signals + 필수 필드)
- [ ] Cosine dedup (분류군별 pool, 0.85 임계)
- [ ] Vercel Cron + Turso queue 발행 워커
- [ ] **7일 dry-run** on staging — 실제 발행 없이 100종으로 5단계 통과 확인 + critic 점수 분포 검토 + 페르소나 톤 사람 검토

### Phase 2 (W4) — 200 시드 + AdSense 검수

- [ ] 200종 고품질 시드 발행 (Layer 1·2 충분 + critic 90+ 우선 선정)
- [ ] 키우기 가이드 30편 (V1 1순위) 발행
- [ ] 카테고리 허브 8개 (실내·다육·관엽·구근·정원수·조경수·과수·허브)
- [ ] 진단 도구 quick step (지역+환경) 작동 확인
- [ ] 필수 페이지: About / Contact / Privacy (PIPA 기준) / Terms / Disclaimer
- [ ] sitemap_index 분할 작동
- [ ] IndexNow + 검색엔진 ping 자동화
- [ ] AdSense 검수 신청
- [ ] adsense-optimizer 스킬로 22개 항목 readiness 95% 이상 확인
- [ ] 정밀 진단(3-5 step) UI 개발 병행

### Phase 3 (W5-6) — Ramp 500/일

- [ ] 검수 통과 확인 → 500/일 발행 활성화
- [ ] 카테고리 허브 자동 생성 (50+개)
- [ ] 키우기 가이드 200편 누적 목표
- [ ] GSC·GA4·AdSense API 모니터링 대시보드 연결 (멀티사이트 대시보드 spec 활용)
- [ ] 일일 보고서 cron 활성화

### Phase 4 (W7-12) — Ramp 5천/일 + Backbone 완성

- [ ] 1천 → 2천 → 3천 → 5천 단계적 증속 (주별)
- [ ] 5만종 backbone 완성 (실 발행 ~3.5만)
- [ ] 정밀 진단 5-step 활성화
- [ ] 꽃말·전통문화 별도 페이지 발행 시작
- [ ] AI Overview 카니발 GSC 모니터링 시작

### Phase 5 (V1.5+, W13~)

- [ ] 비교 페이지 / Q&A 허브 추가
- [ ] 쿠팡 파트너스 통합
- [ ] 자체 프리미엄 도구 평가
- [ ] English `/en/` 검토

---

## 18. 5-페르소나 리뷰 합의 사항

| 페르소나 | 합의 사항 |
|---|---|
| Revenue PM | AdSense 별도 계정 (도메인 후 결정), 푸터 비강제 이메일 캡처 V1 포함, V1.5에 가이드 추가 매출 견인 확인 |
| UX | 5만종 4중 진입(자모·카테고리·검색·추천), 진단 도구 2-step quick → 정밀 단계화, 디스클레이머는 풀스크린 모달 1회 + footer 상시 |
| Frontend | ISR + on-demand revalidation, sitemap_index 카테고리별 분할, Vercel Cron + Turso queue 발행 |
| QA | banned words lint mandatory, 필수 필드 부재 시 자동 비공개, dedup 분류군별 pool 분리, 실 발행 ~3.5만 가정 |
| Growth | "한국 기후 적합도 점수"가 사실상 유일 차별화 무기, Quick Facts 박스 50-150단어로 LLM 인용 2.3배, 도구·진단은 AI Overview 카니발 면역 |

미해결: 없음 (모든 충돌 합의 완료)

---

## 19. 의도적 비범위 (Out of Scope)

V1에서 의도적으로 제외하는 것 — Phase 5 이후 검토.

- 약초·효능 콘텐츠 (YMYL 리스크)
- 사용자 사진 업로드 / 사용자 리뷰 / 댓글 (moderation 부담)
- 모바일 앱 (반응형 웹만)
- 다국어 (한국어 100%)
- 결제·구독 (V1.5 검토)
- 어필리에이트 (V1.5)
- 식물 식별(이미지 검색) (모야모와 직접 경쟁, 차별화 어려움)
- AI 챗봇 (별도 V2 검토)

---

## 20. Verification Checklist (Claude Code 실행 종료 시)

각 Phase 완료 시 자동 검증.

### Phase 0 완료 기준
- [ ] `pnpm dev` 정상 작동
- [ ] Drizzle migrate 성공, 모든 테이블 생성
- [ ] `pnpm tsc --noEmit` 에러 0
- [ ] `.env.local` 모든 변수 채워짐
- [ ] 페르소나 JSON validate 통과
- [ ] lint-rules.yaml validate 통과

### Phase 1 완료 기준
- [ ] Layer 1 ETL: plants 5만종 ≥ 80% (4만종+) 적재
- [ ] Layer 2 derive: plant_metrics ≥ 3.5만 (필수 필드 채워진 것)
- [ ] Layer 3 dry-run: 100종 5단계 통과율 ≥ 70%
- [ ] critic 평균 점수 분포 그래프 확인 (peak가 80~90 범위)
- [ ] dedup pool 작동 확인 (단풍나무 30종 cross-reject 0)

### Phase 2 완료 기준
- [ ] 200종 + 가이드 30편 + 카테고리 8개 발행 완료
- [ ] 모든 필수 페이지 (about·contact·privacy·terms·disclaimer) HTTP 200
- [ ] adsense-optimizer readiness 22항목 ≥ 95%
- [ ] CWV 모든 페이지 green (LCP < 2.5s, INP < 200ms, CLS < 0.1)
- [ ] sitemap_index + 분할 sitemap HTTP 200
- [ ] IndexNow 첫 ping 성공
- [ ] AdSense 검수 신청 완료

### Phase 3 완료 기준
- [ ] 검수 통과 확인
- [ ] 500/일 ramp 7일 연속 안정
- [ ] 일일 보고서 cron 매일 새벽 5시 정상 실행
- [ ] GSC 색인률 ≥ 70%

### Phase 4 완료 기준
- [ ] 5천/일 ramp 안정 도달
- [ ] backbone 실 발행 ≥ 3만종
- [ ] 정밀 진단 5-step 작동
- [ ] AdSense 정책 위반 0건
- [ ] AI Overview 카니발 모니터링 알림 활성

---

## 21. 참고 — 기존 자산 재활용

| 자산 | 활용 방법 |
|---|---|
| `blog-optimizer` 스킬 | Phase 3 이후 진단·sitemap·페르소나·자율 발행에 직접 사용 |
| `adsense-optimizer` 스킬 | Phase 2 검수 신청 전 readiness check + 거절 시 5단계 파이프라인 |
| `MULTISITE_DASHBOARD_SPEC.md` | Phase 3에서 GSC·GA4·AdSense 데이터 통합 모니터링 대시보드 연결 |
| `SITE_HEALTH_MONITOR_SPEC.md` | Phase 4 이후 자동 진단·자동 패치 파이프라인 |
| 닥터맵·법률지기 패턴 | 3-layer 데이터 모델 + Quality Gate + 7일 dry-run |
| `CLAUDE.md` 표준 | 전체 SEO·AEO·GEO 표준 적용 |

---

**END OF SPEC**

이 문서는 Claude Code 자율 실행을 위한 단일 source of truth.
변경 사항은 Git PR + 이 파일 갱신으로 추적.
