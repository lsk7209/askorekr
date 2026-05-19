/**
 * 식물 DB 기반 블로그 글 자동 생성
 * 실행: node scripts/generate-plant-posts.mjs [옵션]
 *
 * plants 테이블에 있는 식물 중 블로그 글이 없는 식물을 대상으로
 * "[식물명] 키우기 완전 가이드" 형식의 글을 Gemini로 생성합니다.
 *
 * 옵션:
 *   --limit N        최대 N개 생성 (기본: 전체)
 *   --dry-run        DB 저장 안 함
 *   --offset N       N번째 식물부터 시작 (기본: 0)
 */

import { createClient } from "@libsql/client";
import { existsSync, readFileSync } from "node:fs";

// ── env 로드 ───────────────────────────────────────────────
function loadEnv() {
  for (const file of [".env", ".env.local"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const [n, ...r] = t.split("=");
      if (!process.env[n]) process.env[n] = r.join("=").replace(/^["']|["']$/g, "");
    }
  }
}

loadEnv();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TURSO_URL = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;
const PUBLISH_INTERVAL_HOURS = 5;
const QUALITY_THRESHOLD = 88;
const MAX_RETRIES = 2;

if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY 없음");
  process.exit(1);
}

const args = process.argv.slice(2);
const limitArg = args.find(a => a.startsWith("--limit="))?.split("=")[1];
const limit = limitArg ? parseInt(limitArg) : Infinity;
const offsetArg = args.find(a => a.startsWith("--offset="))?.split("=")[1];
const offset = offsetArg ? parseInt(offsetArg) : 0;
const isDryRun = args.includes("--dry-run");

const db = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const PRO_MODEL = process.env.GEMINI_PRO_MODEL ?? "gemini-2.5-pro";
const FLASH_MODEL = process.env.GEMINI_FLASH_MODEL ?? "gemini-2.5-flash";

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function callGemini(model, prompt, temperature = 0.7) {
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens: 8192, responseMimeType: "application/json" }
  };
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty Gemini response");
  return JSON.parse(text);
}

// ── 리서치 프롬프트 ────────────────────────────────────────
function buildResearchPrompt(topic) {
  return `
당신은 한국 반려식물·가드닝 전문 리서처입니다.
다음 주제를 한국 독자(20~40대, 아파트 생활자) 관점에서 심층 분석하세요.

주제: "${topic}"

반드시 아래 JSON 형식으로만 응답하세요:
{
  "primaryKeyword": "메인 SEO 키워드 (한국어, 월 검색량 높은 것)",
  "secondaryKeywords": ["연관 키워드1", "키워드2", "키워드3", "키워드4"],
  "searchIntent": "정보형 또는 비교형 또는 How-to형",
  "targetAudience": "구체적인 독자 프로필 한 문장",
  "uniqueAngle": "한국 기후·생활 환경 기반 차별화 관점",
  "keyFacts": ["핵심 사실1 (정량 데이터)", "핵심 사실2", "핵심 사실3", "핵심 사실4", "핵심 사실5"],
  "commonMistakes": ["흔한 실수1", "흔한 실수2", "흔한 실수3"],
  "outline": ["H2 섹션 제목1", "H2 섹션 제목2", "H2 섹션 제목3", "H2 섹션 제목4", "H2 섹션 제목5"],
  "faq": [
    {"q": "자주 묻는 질문1", "a": "간결한 답변1"},
    {"q": "자주 묻는 질문2", "a": "간결한 답변2"},
    {"q": "자주 묻는 질문3", "a": "간결한 답변3"},
    {"q": "자주 묻는 질문4", "a": "간결한 답변4"},
    {"q": "자주 묻는 질문5", "a": "간결한 답변5"}
  ]
}
`.trim();
}

const INTRO_STYLES = [
  "독자의 실패 경험 공감으로 시작 → 해결책 예고",
  "한국 기후·계절 이슈 제시 → 이 글이 해결해 주는 이유",
  "식물의 흥미로운 생물학적 특성으로 시작 → 관리법 연결",
  "SNS/유행 언급 → 실전 관리 현실 제시",
  "Q&A 형식: '혹시 이런 경험 있으세요?' 로 시작"
];
const STRUCTURE_TYPES = [
  "문제해결형: 증상별 원인·해결책 → 예방 → 심화 팁 순서",
  "단계별 가이드형: 구매 전 → 첫날 → 1개월 → 계절별",
  "비교분석형: 잘못된 방법 vs 올바른 방법 대조",
  "체크리스트형: 핵심 포인트를 점검표로 구성",
  "스토리텔링형: 독자 상황 → 문제 → 해결 여정"
];
const CLOSING_STYLES = [
  "독자에게 질문 남기기 ('여러분의 경험을 댓글로 알려주세요')",
  "다음 단계 행동 유도 ('지금 바로 확인해보세요')",
  "플랜티프렌즈 사이트 내 관련 기능 안내",
  "계절별 다음 할 일 미리보기"
];

function pick(arr, seed) { return arr[seed % arr.length]; }

function buildWritePrompt(topic, plant, research, seed = 0) {
  return `
당신은 플랜티프렌즈(PlantyFriends) 편집팀 시니어 에디터입니다.

## 사이트 페르소나 규칙 (필수 준수)
- 브랜드: 플랜티프렌즈
- 타겟: 20~35세 MZ, 도시 아파트 생활자, 반려식물 1~5개 보유
- 어투: 친근한 존댓말 ("~예요", "~답니다", "~해요")
- 금지 표현: "이 친구는~" 반복, "기특한", "쏠쏠", "든든한 친구", "국민 식물"
- 금지: 의료 효능 단정, "무조건 안전", 출처 없는 통계

## 이 글의 고유 구조
- 인트로 스타일: ${pick(INTRO_STYLES, seed)}
- 본문 구조: ${pick(STRUCTURE_TYPES, seed + 1)}
- 마무리 스타일: ${pick(CLOSING_STYLES, seed + 2)}
- 첫 H2 제목: "인트로"나 "들어가며" 금지 — 주제 핵심어 담은 고유 제목 사용

## 대상 식물 정보
- 한국명: ${plant.korean_name}
- 학명: ${plant.scientific_name}
- 과(Family): ${plant.family ?? "미분류"}
- 원산지: ${plant.origin ?? "열대·아열대"}

## 주제
"${topic}"

## 리서치 데이터
${JSON.stringify(research, null, 2)}

## 필수 포함 요소
1. Quick Facts 표 (한국 환경 기준: 적정 온도/습도/광량/물주기 간격)
2. 한국 아파트 환경 특이사항 callout (> 로 시작하는 blockquote)
3. FAQ 5개 이상 (### 으로 시작, 실제 검색 쿼리 형태)
4. 정량 데이터 최소 3개 (온도, 습도, 빛 조도 또는 물주기 일수)
5. 마지막에 "---\\n*플랜티프렌즈 편집팀*" 서명

## 출력 형식 (반드시 JSON만 반환)
{
  "title": "SEO 최적화 제목 (60자 이하, 핵심 키워드 앞부분 배치)",
  "metaDescription": "검색 결과 노출 설명 (150~160자, 핵심 키워드 포함, 행동 유도)",
  "slug": "seo-friendly-url-slug",
  "category": "키우기가이드",
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"],
  "bodyMarkdown": "[고유 구조로 작성된 마크다운. 최소 1500자, H2 섹션 5개 이상]",
  "qualityScores": {
    "eeat": 점수(0-20),
    "structure_uniqueness": 점수(0-20),
    "seo": 점수(0-20),
    "factual": 점수(0-20),
    "cliche_avoidance": 점수(0-20)
  },
  "totalQuality": 합계점수(0-100)
}
`.trim();
}

function toSlug(title) {
  return title.toLowerCase()
    .replace(/[가-힣]+/g, m => [...m].map(c => c.charCodeAt(0)).join("-"))
    .replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
    .slice(0, 80);
}

// ── 마지막 예약 시간 기준으로 스케줄 계산 ─────────────────
async function getLastScheduledAt() {
  const r = await db.execute("SELECT max(scheduled_at) as mx FROM blog_posts WHERE scheduled_at IS NOT NULL");
  const mx = r.rows[0]?.mx;
  if (mx) return new Date(Number(mx) * 1000);
  return new Date(); // fallback to now
}

async function getExistingTitles() {
  const r = await db.execute("SELECT title FROM blog_posts");
  return new Set(r.rows.map(row => String(row.title).toLowerCase().slice(0, 20)));
}

// ── 블로그 글 저장 ────────────────────────────────────────
async function saveBlogPost(post, scheduledAt) {
  const now = Math.floor(Date.now() / 1000);
  const slug = post.slug ?? toSlug(post.title);
  const scheduledSec = Math.floor(scheduledAt.getTime() / 1000);

  await db.execute({
    sql: `INSERT INTO blog_posts (slug, title, meta_description, category, tags, body_markdown,
            quality_score, quality_breakdown, generated_by, scheduled_at, is_published, created_at, updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,0,?,?)
          ON CONFLICT(slug) DO NOTHING`,
    args: [
      slug, post.title, post.metaDescription, post.category ?? "키우기가이드",
      JSON.stringify(post.tags ?? []), post.bodyMarkdown,
      post.totalQuality, JSON.stringify(post.qualityScores ?? {}),
      `gemini/${PRO_MODEL}`, scheduledSec, now, now
    ]
  });
  return slug;
}

// ── 메인 ──────────────────────────────────────────────────
async function main() {
  // 블로그 글 없는 식물 조회 (기존 제목과 겹치지 않는 것)
  const plantsRes = await db.execute(
    `SELECT id, korean_name, scientific_name, family, origin FROM plants ORDER BY id LIMIT 9999`
  );
  const existingTitles = await getExistingTitles();

  const plants = plantsRes.rows.filter(p => {
    const titlePrefix = String(p.korean_name).toLowerCase().slice(0, 6);
    return !existingTitles.has(titlePrefix);
  }).slice(offset, isFinite(limit) ? offset + limit : undefined);

  console.log(`\n🌿 식물 블로그 글 생성 시작`);
  console.log(`   대상 식물: ${plants.length}개 (offset=${offset}, limit=${isFinite(limit) ? limit : "전체"})`);
  console.log(`   드라이런: ${isDryRun ? "예" : "아니오"}\n`);

  let lastScheduledAt = await getLastScheduledAt();
  let success = 0, fail = 0, skip = 0;

  for (let i = 0; i < plants.length; i++) {
    const plant = plants[i];
    const topic = `${plant.korean_name} 키우기 완전 가이드: 한국 아파트에서 성공하는 법`;
    console.log(`\n[${i + 1}/${plants.length}] 🌱 ${plant.korean_name} (${plant.scientific_name})`);

    let attempt = 0, saved = false;

    while (attempt < MAX_RETRIES && !saved) {
      attempt++;
      if (attempt > 1) { console.log(`   ↺ 재시도 ${attempt}`); await sleep(5000); }

      try {
        console.log(`   🔍 리서치 중...`);
        let research;
        try {
          research = await callGemini(FLASH_MODEL, buildResearchPrompt(topic), 0.5);
        } catch(e) {
          research = { primaryKeyword: `${plant.korean_name} 키우기`, secondaryKeywords: [], keyFacts: [], faq: [], outline: [] };
        }

        console.log(`   ✍️ 글 생성 중...`);
        const post = await callGemini(PRO_MODEL, buildWritePrompt(topic, plant, research, i + offset), 0.9);

        const quality = post.totalQuality ?? Object.values(post.qualityScores ?? {}).reduce((a, b) => a + b, 0);
        console.log(`   📊 품질: ${quality}점`);

        if (quality < QUALITY_THRESHOLD) {
          console.log(`   ⚠️ 기준 미달 (${quality} < ${QUALITY_THRESHOLD})`);
          if (attempt >= MAX_RETRIES) { fail++; break; }
          continue;
        }

        lastScheduledAt = new Date(lastScheduledAt.getTime() + PUBLISH_INTERVAL_HOURS * 3600 * 1000);

        if (!isDryRun) {
          const slug = await saveBlogPost(post, lastScheduledAt);
          console.log(`   ✅ 저장: ${slug} (예약: ${lastScheduledAt.toISOString().slice(0, 10)})`);
        } else {
          console.log(`   (드라이런) slug=${post.slug ?? "?"} 예약=${lastScheduledAt.toISOString().slice(0, 10)}`);
        }

        success++;
        saved = true;

      } catch(e) {
        console.log(`   ❌ 오류: ${e.message.slice(0, 80)}`);
        if (attempt >= MAX_RETRIES) fail++;
        await sleep(3000);
      }
    }

    // Gemini rate limit 방지
    await sleep(2000);
  }

  const total = await db.execute("SELECT count(*) as cnt FROM blog_posts");
  console.log(`\n${"=".repeat(50)}`);
  console.log(`🎉 완료! 성공: ${success} / 실패: ${fail} / 건너뜀: ${skip}`);
  console.log(`   총 블로그 글: ${total.rows[0].cnt}개`);
  await db.close();
}

main().catch(e => { console.error(e.message ?? e); process.exit(1); });
