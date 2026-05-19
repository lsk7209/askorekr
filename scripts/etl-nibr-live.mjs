/**
 * 국립생물자원관 생물종지식정보시스템 식물 ETL
 * 실행: node scripts/etl-nibr-live.mjs [옵션]
 *
 * 필수 환경변수:
 *   NIBR_API_KEY  data.go.kr → "국립생물자원관_생물종지식정보시스템" 일반 인증키(Encoding)
 *
 * 옵션:
 *   --limit N      최대 N개
 *   --page-size N  페이지당 항목 수 (기본: 100)
 *   --delay N      호출 간격 ms (기본: 300)
 *   --dry-run      DB 저장 안 함
 *   --resume       기존 슬러그 건너뜀
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

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
  return {
    limit: get("--limit") ? parseInt(get("--limit")) : Infinity,
    pageSize: parseInt(get("--page-size") ?? "100"),
    delay: parseInt(get("--delay") ?? "300"),
    dryRun: args.includes("--dry-run"),
    resume: args.includes("--resume")
  };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function parseJson(v) { try { return v ? JSON.parse(v) : {}; } catch { return {}; } }

const xmlParser = new XMLParser({ ignoreAttributes: false, trimValues: true, parseTagValue: false });
const EMPTY = new Set(["", "-", "null", "undefined", "미분류"]);

// NIBR API base — 공공데이터포털 표준 XML REST
const BASE_URL = "http://openapi.nature.go.kr/openapi/service/rest/SpeciesInfoService";

function readText(v) {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const t = String(v).trim();
  return EMPTY.has(t.toLowerCase()) ? null : t;
}

function asArray(v) { if (!v) return []; return Array.isArray(v) ? v : [v]; }

function createSlug(sciName, korName) {
  const slug = sciName.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (slug) return slug;
  const h = [...korName].reduce((s, c) => s + c.codePointAt(0), 0);
  return `nibr-${h}`;
}

async function fetchSpeciesList(apiKey, pageNo, pageSize) {
  const url = new URL(`${BASE_URL}/getSpeciesList`);
  url.searchParams.set("ServiceKey", apiKey);
  url.searchParams.set("pageNo", String(pageNo));
  url.searchParams.set("numOfRows", String(pageSize));
  url.searchParams.set("kingdom", "식물");

  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const parsed = xmlParser.parse(await r.text());

  const header = parsed.response?.header;
  const code = readText(header?.resultCode);
  if (code && code !== "00") throw new Error(`NIBR API ${code}: ${readText(header?.resultMsg) ?? ""}`);

  const body = parsed.response?.body;
  return {
    items: asArray(body?.items?.item ?? []),
    totalCount: Number(readText(body?.totalCount) ?? 0)
  };
}

async function fetchSpeciesDetail(apiKey, spcieNo) {
  const url = new URL(`${BASE_URL}/getSpeciesDetail`);
  url.searchParams.set("ServiceKey", apiKey);
  url.searchParams.set("spcieNo", String(spcieNo));

  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const parsed = xmlParser.parse(await r.text());
  return parsed.response?.body?.item;
}

function normalize(listItem, detail) {
  // listItem fields: spcieNo, korNm, sciNm, ordNm, familyNm, genusNm, spcsNm
  // detail fields: spcieNo, korNm, sciNm, familyNm, genusNm, orgplce, toxctyInfo, imgUrl...
  const spcieNo = readText(listItem?.spcieNo ?? detail?.spcieNo);
  const sciName = readText(listItem?.sciNm ?? detail?.sciNm);
  const korName = readText(listItem?.korNm ?? detail?.korNm);

  if (!spcieNo || !sciName || !korName) return null;

  const imageUrl = readText(detail?.mainImgUrl ?? listItem?.imgUrl);

  return {
    plant: {
      scientificName: sciName,
      koreanName: korName,
      slug: createSlug(sciName, korName),
      family: readText(listItem?.familyNm ?? detail?.familyNm),
      genus: readText(listItem?.genusNm ?? detail?.genusNm),
      synonyms: [],
      origin: readText(detail?.orgplce) ?? "국립생물자원관",
      sourceRefs: { "생물자원관": `국립생물자원관:${spcieNo}` }
    },
    metrics: {
      difficultyScore: null,
      indoorOutdoorClass: "outdoor",
      lightLuxMin: null,
      lightLuxMax: null,
      waterFreqDays: null,
      tempMinC: null,
      tempMaxC: null,
      humidityMinPct: null,
      humidityMaxPct: null,
      petSafetyScoreDog: null,
      petSafetyScoreCat: null,
      childSafetyScore: null,
      toxicityNotes: readText(detail?.toxctyInfo)
    },
    imageUrl
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
          ON CONFLICT(plant_id) DO UPDATE SET
            toxicity_notes=coalesce(excluded.toxicity_notes,plant_metrics.toxicity_notes),
            derived_at=excluded.derived_at`,
    args: [plantId, m.petSafetyScoreDog, m.petSafetyScoreCat, m.childSafetyScore,
           m.toxicityNotes, m.difficultyScore, m.indoorOutdoorClass,
           m.lightLuxMin, m.lightLuxMax, m.waterFreqDays,
           m.tempMinC, m.tempMaxC, m.humidityMinPct, m.humidityMaxPct, Date.now()]
  });
}

async function insertImageIfNeeded(db, plantId, imageUrl) {
  if (!imageUrl) return;
  const ex = await db.execute({ sql: "SELECT id FROM plant_images WHERE plant_id = ? AND url = ? LIMIT 1", args: [plantId, imageUrl] });
  if (ex.rows.length > 0) return;
  await db.execute({
    sql: "INSERT INTO plant_images (plant_id, url, source, license, attribution, is_primary) VALUES (?, ?, 'nibr', '국립생물자원관 CC BY', '국립생물자원관', false)",
    args: [plantId, imageUrl]
  });
}

async function main() {
  loadEnv();
  const { limit, pageSize, delay, dryRun, resume } = parseArgs();
  const apiKey = process.env.NIBR_API_KEY?.trim();
  if (!apiKey) {
    console.error("❌ NIBR_API_KEY 없음");
    console.error("   data.go.kr → 국립생물자원관_생물종지식정보시스템 → 일반 인증키(Encoding) 신청");
    console.error("   승인 후 .env.local에 NIBR_API_KEY=<키> 추가");
    process.exit(1);
  }

  const db = createClient({
    url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN
  });

  const existingSlugs = resume ? await getExistingSlugs(db) : new Set();
  if (resume) console.log(`  ↺ 재개 모드: ${existingSlugs.size}개 건너뜀`);

  console.log("🔍 식물 총 개수 확인 중...");
  const first = await fetchSpeciesList(apiKey, 1, 1);
  const totalCount = Math.min(first.totalCount, isFinite(limit) ? limit : Infinity);
  const totalPages = Math.ceil(totalCount / pageSize);
  console.log(`📋 수집 대상: ${totalCount}개 (${totalPages}페이지)\n`);

  let collected = 0, saved = 0, skipped = 0;
  const rejected = [];

  for (let page = 1; page <= totalPages; page++) {
    const { items } = await fetchSpeciesList(apiKey, page, pageSize);
    console.log(`  [페이지 ${page}/${totalPages}] ${items.length}개 수신`);

    for (const item of items) {
      if (isFinite(limit) && collected >= limit) break;
      collected++;

      const spcieNo = item.spcieNo;
      if (!spcieNo) { rejected.push({ reason: "spcieNo 없음", item }); continue; }

      await sleep(delay);
      let detail;
      try { detail = await fetchSpeciesDetail(apiKey, spcieNo); }
      catch (e) { rejected.push({ reason: `detail 오류: ${e.message}`, spcieNo }); continue; }

      const n = normalize(item, detail);
      if (!n) { rejected.push({ reason: "필수 필드 없음", spcieNo }); continue; }

      if (resume && existingSlugs.has(n.plant.slug)) { skipped++; continue; }

      if (!dryRun) {
        const plantId = await upsertPlant(db, n);
        await upsertMetrics(db, plantId, n.metrics);
        await insertImageIfNeeded(db, plantId, n.imageUrl);
        existingSlugs.add(n.plant.slug);
      }
      saved++;
      if (saved <= 3 || saved % 100 === 0) console.log(`    ✅ ${saved}개 — ${n.plant.koreanName} (${n.plant.scientificName})`);
    }

    if (page < totalPages) await sleep(delay);
  }

  const finalCount = dryRun ? "드라이런" : (await db.execute("SELECT count(*) as cnt FROM plants")).rows[0].cnt;
  console.log(`\n${"=".repeat(50)}`);
  console.log(`🌿 완료! 저장: ${saved} / 건너뜀: ${skipped} / 거부: ${rejected.length}`);
  console.log(`   Turso 총 식물: ${finalCount}개`);
  await db.close();
}

main().catch(e => { console.error(e.message ?? e); process.exit(1); });
