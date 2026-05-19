/**
 * 국립원예특작과학원 오늘의 꽃 조회 서비스(2.0) ETL
 * 실행: node scripts/etl-nihhs-flower-live.mjs [옵션]
 *
 * 366일 일별 꽃 → plants + plant_metrics + plant_images 저장
 * 한국명, 학명, 꽃말, 기르기방법, 이미지 포함
 *
 * 필수 환경변수:
 *   NIHHS_FLOWER_API_KEY  (Decoding 키)
 *
 * 옵션:
 *   --dry-run    DB 저장 안 함
 *   --resume     기존 슬러그 건너뜀
 *   --delay N    호출 간격 ms (기본: 300)
 */

import { createClient } from "@libsql/client";
import { XMLParser } from "fast-xml-parser";
import { existsSync, readFileSync } from "node:fs";

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

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const resume = args.includes("--resume");
const delay = parseInt(args.find(a => a.startsWith("--delay="))?.split("=")[1] ?? "300");

const API_KEY = encodeURIComponent(process.env.NIHHS_FLOWER_API_KEY?.trim() ?? "");
if (!API_KEY) {
  console.error("❌ NIHHS_FLOWER_API_KEY 없음");
  process.exit(1);
}

const BASE = "https://apis.data.go.kr/1390804/NihhsTodayFlowerInfo01";
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
  parseTagValue: false,
  cdataPropName: "__cdata"
});
const EMPTY = new Set(["", "-", "null", "undefined", "없음"]);

function readText(v) {
  if (v === null || v === undefined) return null;
  // Handle CDATA
  const raw = typeof v === "object" && v.__cdata ? v.__cdata : v;
  const t = String(raw).trim();
  return EMPTY.has(t.toLowerCase()) ? null : t;
}

function asArray(v) { if (!v) return []; return Array.isArray(v) ? v : [v]; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function parseJson(v) { try { return v ? JSON.parse(v) : {}; } catch { return {}; } }

function createSlug(sciName, korName) {
  const slug = sciName.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (slug) return slug;
  const h = [...korName].reduce((s, c) => s + c.codePointAt(0), 0);
  return `nihhs-${h}`;
}

async function fetchXml(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const text = await r.text();
  const parsed = xmlParser.parse(text);
  const root = parsed.document?.root ?? parsed.root;
  const code = String(root?.resultCode ?? "").trim();
  if (code === "0") throw new Error(`API 접속실패: ${root?.resultMsg ?? ""}`);
  return root;
}

// ── 전체 목록 (366개) ───────────────────────────────────────
async function fetchList() {
  const url = `${BASE}/selectTodayFlowerList01?serviceKey=${API_KEY}&pageNo=1&numOfRows=366`;
  const root = await fetchXml(url);
  return asArray(root?.result ?? []);
}

// ── 상세 정보 (dataNo 기준) ─────────────────────────────────
async function fetchDetail(dataNo) {
  const url = `${BASE}/selectTodayFlowerView01?serviceKey=${API_KEY}&dataNo=${dataNo}`;
  const root = await fetchXml(url);
  const result = root?.result;
  return Array.isArray(result) ? result[0] : result;
}

function normalize(detail) {
  const korName = readText(detail?.flowNm);
  const sciName = readText(detail?.fSctNm);

  if (!korName) return null;
  const effectiveSciName = sciName ?? korName;

  return {
    plant: {
      scientificName: effectiveSciName,
      koreanName: korName,
      slug: createSlug(effectiveSciName, korName),
      family: null,
      genus: null,
      synonyms: readText(detail?.fEngNm) ? [readText(detail.fEngNm)] : [],
      origin: "국립원예특작과학원 오늘의 꽃",
      sourceRefs: { "오늘의꽃": `NIHHS:${readText(detail?.dataNo) ?? korName}` }
    },
    metrics: {
      difficultyScore: null,
      indoorOutdoorClass: "both",
      lightLuxMin: null, lightLuxMax: null,
      waterFreqDays: null,
      tempMinC: null, tempMaxC: null,
      humidityMinPct: null, humidityMaxPct: null,
      petSafetyScoreDog: null, petSafetyScoreCat: null,
      childSafetyScore: null, toxicityNotes: null,
      flowerMeaning: readText(detail?.flowLang)
    },
    careNotes: readText(detail?.fGrow),
    description: readText(detail?.fContent),
    imageUrl: readText(detail?.imgUrl1),
    imageUrl2: readText(detail?.imgUrl2),
    imageUrl3: readText(detail?.imgUrl3)
  };
}

async function getExistingSlugs(db) {
  const rows = await db.execute("SELECT slug FROM plants");
  return new Set(rows.rows.map(r => String(r.slug)));
}

async function upsertPlant(db, n) {
  const now = Date.now();
  const ex = await db.execute({ sql: "SELECT source_refs FROM plants WHERE slug = ? LIMIT 1", args: [n.plant.slug] });
  const sourceRefs = { ...parseJson(ex.rows[0]?.source_refs), ...n.plant.sourceRefs };

  await db.execute({
    sql: `INSERT INTO plants (scientific_name, korean_name, slug, family, genus, synonyms, origin, source_refs, created_at, updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?)
          ON CONFLICT(slug) DO UPDATE SET
            scientific_name=excluded.scientific_name, korean_name=excluded.korean_name,
            synonyms=excluded.synonyms, origin=coalesce(excluded.origin,plants.origin),
            source_refs=excluded.source_refs, updated_at=excluded.updated_at`,
    args: [n.plant.scientificName, n.plant.koreanName, n.plant.slug, n.plant.family, n.plant.genus,
           JSON.stringify(n.plant.synonyms), n.plant.origin, JSON.stringify(sourceRefs), now, now]
  });

  const row = await db.execute({ sql: "SELECT id FROM plants WHERE slug = ? LIMIT 1", args: [n.plant.slug] });
  return Number(row.rows[0].id);
}

async function upsertMetrics(db, plantId, m) {
  await db.execute({
    sql: `INSERT INTO plant_metrics (plant_id, pet_safety_score_dog, pet_safety_score_cat, child_safety_score,
            toxicity_notes, difficulty_score, indoor_outdoor_class, light_lux_min, light_lux_max,
            water_freq_days, temp_min_c, temp_max_c, humidity_min_pct, humidity_max_pct, flower_meaning, derived_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
          ON CONFLICT(plant_id) DO UPDATE SET
            flower_meaning=coalesce(excluded.flower_meaning,plant_metrics.flower_meaning),
            derived_at=excluded.derived_at`,
    args: [plantId, null, null, null, null, null, m.indoorOutdoorClass,
           null, null, null, null, null, null, null, m.flowerMeaning, Date.now()]
  });
}

async function insertImage(db, plantId, imageUrl, isPrimary) {
  if (!imageUrl) return;
  const ex = await db.execute({ sql: "SELECT id FROM plant_images WHERE plant_id = ? AND url = ? LIMIT 1", args: [plantId, imageUrl] });
  if (ex.rows.length > 0) return;
  await db.execute({
    sql: "INSERT INTO plant_images (plant_id, url, source, license, attribution, is_primary) VALUES (?,?,'nihhs','CC BY-NC-SA','국립원예특작과학원',?)",
    args: [plantId, imageUrl, isPrimary ? 1 : 0]
  });
}

async function main() {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN
  });

  const existingSlugs = resume ? await getExistingSlugs(db) : new Set();
  if (resume) console.log(`  ↺ 재개 모드: ${existingSlugs.size}개 건너뜀`);

  console.log("🌸 오늘의 꽃 목록 수신 중...");
  const listItems = await fetchList();
  console.log(`📋 총 ${listItems.length}개\n`);

  let saved = 0, skipped = 0;
  const rejected = [];

  for (const item of listItems) {
    const dataNo = readText(item?.dataNo);
    if (!dataNo) { rejected.push({ reason: "dataNo 없음" }); continue; }

    await sleep(delay);

    let detail;
    try {
      detail = await fetchDetail(dataNo);
    } catch(e) {
      rejected.push({ reason: `detail 오류: ${e.message}`, dataNo });
      continue;
    }

    const n = normalize(detail);
    if (!n) { rejected.push({ reason: "필수 필드 없음", dataNo }); continue; }

    if (resume && existingSlugs.has(n.plant.slug)) { skipped++; continue; }

    if (!dryRun) {
      const plantId = await upsertPlant(db, n);
      await upsertMetrics(db, plantId, n.metrics);
      await insertImage(db, plantId, n.imageUrl, true);
      await insertImage(db, plantId, n.imageUrl2, false);
      await insertImage(db, plantId, n.imageUrl3, false);
      existingSlugs.add(n.plant.slug);
    }
    saved++;
    if (saved <= 3 || saved % 50 === 0) {
      console.log(`  ✅ ${saved}개 — ${n.plant.koreanName} (${n.plant.scientificName})  꽃말: ${n.metrics.flowerMeaning ?? "없음"}`);
    }
  }

  const finalCount = dryRun ? "드라이런" :
    (await db.execute("SELECT count(*) as cnt FROM plants")).rows[0].cnt;
  console.log(`\n${"=".repeat(50)}`);
  console.log(`🌸 완료! 저장: ${saved} / 건너뜀: ${skipped} / 거부: ${rejected.length}`);
  console.log(`   Turso 총 식물: ${finalCount}개`);
  await db.close();
}

main().catch(e => { console.error(e.message ?? e); process.exit(1); });
