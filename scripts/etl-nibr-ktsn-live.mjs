/**
 * 국립생물자원관 국가생물종목록 ETL
 * 실행: node scripts/etl-nibr-ktsn-live.mjs [옵션]
 *
 * Endpoint: https://species.nibr.go.kr/gwsvc/openapi/rest/ktsn/taxons/search
 * 식물계(PLANTAE) 전체 목록 수집 → plants + plant_metrics + plant_images 저장
 *
 * 필수 환경변수:
 *   NIBR_KTSN_API_KEY  (UUID 형태의 API 키)
 *
 * 옵션:
 *   --limit N      최대 N개
 *   --page-size N  페이지당 항목 수 (기본: 100)
 *   --delay N      호출 간격 ms (기본: 300)
 *   --dry-run      DB 저장 안 함
 *   --resume       기존 슬러그 건너뜀
 */

import { createClient } from "@libsql/client";
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
const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
const limit = get("--limit") ? parseInt(get("--limit")) : Infinity;
const pageSize = parseInt(get("--page-size") ?? "100");
const delay = parseInt(get("--delay") ?? "300");
const dryRun = args.includes("--dry-run");
const resume = args.includes("--resume");

const API_KEY = process.env.NIBR_KTSN_API_KEY?.trim();
if (!API_KEY) {
  console.error("❌ NIBR_KTSN_API_KEY 없음");
  console.error("   .env.local에 NIBR_KTSN_API_KEY=<UUID> 추가");
  process.exit(1);
}

const BASE = "https://species.nibr.go.kr/gwsvc/openapi/rest/ktsn/taxons/search";
const EMPTY = new Set(["", "-", "null", "undefined", "없음", "미분류"]);

function readText(v) {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  return EMPTY.has(t.toLowerCase()) ? null : t;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function parseJson(v) { try { return v ? JSON.parse(v) : {}; } catch { return {}; } }

function createSlug(sciName, korName) {
  const slug = sciName.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (slug) return slug;
  const h = [...korName].reduce((s, c) => s + c.codePointAt(0), 0);
  return `nibr-ktsn-${h}`;
}

async function fetchPage(pageNo) {
  const url = new URL(BASE);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("kingdom", "PLANTAE");
  url.searchParams.set("taxonRank", "SPECIES");
  url.searchParams.set("pageNo", String(pageNo));
  url.searchParams.set("numOfRows", String(pageSize));
  url.searchParams.set("lang", "kor");

  const r = await fetch(url.toString(), {
    headers: { "Accept": "application/json" },
    signal: AbortSignal.timeout(15000)
  });

  if (!r.ok) {
    const err = await r.text();
    throw new Error(`HTTP ${r.status}: ${err.slice(0, 200)}`);
  }

  const data = await r.json();

  if (data.status && data.status !== 200) {
    throw new Error(`API ${data.errorCode}: ${data.message}`);
  }

  // Response structure: { total: N, items: [...] } or { data: { total: N, items: [...] } }
  const result = data.data ?? data;
  return {
    items: result.items ?? result.taxons ?? result.list ?? [],
    totalCount: result.total ?? result.totalCount ?? result.count ?? 0
  };
}

function normalize(item) {
  // Common NIBR JSON fields (may vary by API version):
  // sciNm / scientificName, korNm / koreanName, familyNm, genusNm
  // orgplce / habitat, imgUrl / imageUrl
  const sciName = readText(item.sciNm ?? item.scientificName ?? item.species_name);
  const korName = readText(item.korNm ?? item.koreanName ?? item.kor_nm ?? item.vernacular_name);

  if (!korName || !sciName) return null;

  const imageUrl = readText(item.imgUrl ?? item.imageUrl ?? item.img_url);

  return {
    plant: {
      scientificName: sciName,
      koreanName: korName,
      slug: createSlug(sciName, korName),
      family: readText(item.familyNm ?? item.family),
      genus: readText(item.genusNm ?? item.genus),
      synonyms: [],
      origin: readText(item.orgplce ?? item.habitat) ?? "국립생물자원관",
      sourceRefs: { "생물자원관": `NIBR-KTSN:${readText(item.taxonId ?? item.id) ?? sciName}` }
    },
    metrics: {
      difficultyScore: null,
      indoorOutdoorClass: "outdoor",
      lightLuxMin: null, lightLuxMax: null,
      waterFreqDays: null,
      tempMinC: null, tempMaxC: null,
      humidityMinPct: null, humidityMaxPct: null,
      petSafetyScoreDog: null, petSafetyScoreCat: null,
      childSafetyScore: null, toxicityNotes: null
    },
    imageUrl
  };
}

async function getExistingSlugs(db) {
  const rows = await db.execute("SELECT slug FROM plants");
  return new Set(rows.rows.map(r => String(r.slug)));
}

// Drizzle timestamp 컬럼(mode: "timestamp")은 초 단위를 기대한다 (DATA-01).
function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

async function upsertPlant(db, n) {
  const now = nowSeconds();
  const ex = await db.execute({ sql: "SELECT source_refs FROM plants WHERE slug = ? LIMIT 1", args: [n.plant.slug] });
  const sourceRefs = { ...parseJson(ex.rows[0]?.source_refs), ...n.plant.sourceRefs };

  await db.execute({
    sql: `INSERT INTO plants (scientific_name, korean_name, slug, family, genus, synonyms, origin, source_refs, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(slug) DO UPDATE SET
            scientific_name=excluded.scientific_name, korean_name=excluded.korean_name,
            family=coalesce(excluded.family,plants.family), genus=coalesce(excluded.genus,plants.genus),
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
            water_freq_days, temp_min_c, temp_max_c, humidity_min_pct, humidity_max_pct, derived_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
          ON CONFLICT(plant_id) DO NOTHING`,
    args: [plantId, null, null, null, null, null, m.indoorOutdoorClass,
           null, null, null, null, null, null, null, nowSeconds()]
  });
}

async function insertImageIfNeeded(db, plantId, imageUrl) {
  if (!imageUrl) return;
  const ex = await db.execute({ sql: "SELECT id FROM plant_images WHERE plant_id = ? AND url = ? LIMIT 1", args: [plantId, imageUrl] });
  if (ex.rows.length > 0) return;
  await db.execute({
    sql: "INSERT INTO plant_images (plant_id, url, source, license, attribution, is_primary) VALUES (?, ?, 'nibr', '공공누리 1유형', '국립생물자원관', false)",
    args: [plantId, imageUrl]
  });
}

async function main() {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN
  });

  const existingSlugs = resume ? await getExistingSlugs(db) : new Set();
  if (resume) console.log(`  ↺ 재개 모드: ${existingSlugs.size}개 건너뜀`);

  console.log("🔍 식물 총 개수 확인 중...");
  const first = await fetchPage(1);
  const totalCount = Math.min(first.totalCount, isFinite(limit) ? limit : Infinity);
  const totalPages = Math.ceil(totalCount / pageSize);
  console.log(`📋 총 ${first.totalCount}개 / 수집 대상: ${totalCount}개 (${totalPages}페이지)\n`);

  // 첫 페이지 샘플 출력 (API 응답 구조 확인용)
  if (first.items.length > 0) {
    console.log("📦 응답 샘플:", JSON.stringify(first.items[0]).slice(0, 200));
  }

  let collected = 0, saved = 0, skipped = 0;
  const rejected = [];

  for (let page = 1; page <= totalPages; page++) {
    const { items } = page === 1 ? first : await fetchPage(page);
    console.log(`  [페이지 ${page}/${totalPages}] ${items.length}개 수신`);

    for (const item of items) {
      if (isFinite(limit) && collected >= limit) break;
      collected++;

      const n = normalize(item);
      if (!n) { rejected.push({ reason: "필수 필드 없음", item }); continue; }

      if (resume && existingSlugs.has(n.plant.slug)) { skipped++; continue; }

      if (!dryRun) {
        const plantId = await upsertPlant(db, n);
        await upsertMetrics(db, plantId, n.metrics);
        await insertImageIfNeeded(db, plantId, n.imageUrl);
        existingSlugs.add(n.plant.slug);
      }
      saved++;
      if (saved <= 3 || saved % 500 === 0) {
        console.log(`    ✅ ${saved}개 — ${n.plant.koreanName} (${n.plant.scientificName})`);
      }
    }

    if (page < totalPages) await sleep(delay);
  }

  const finalCount = dryRun ? "드라이런" :
    (await db.execute("SELECT count(*) as cnt FROM plants")).rows[0].cnt;
  console.log(`\n${"=".repeat(50)}`);
  console.log(`🌿 완료! 저장: ${saved} / 건너뜀: ${skipped} / 거부: ${rejected.length}`);
  console.log(`   Turso 총 식물: ${finalCount}개`);
  await db.close();
}

main().catch(e => { console.error(e.message ?? e); process.exit(1); });
