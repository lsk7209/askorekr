/**
 * 농사로 실내정원용 식물 ETL — 전체 수집 버전
 * 실행: node scripts/etl-nongsaro-garden-live.mjs [옵션]
 *
 * 옵션:
 *   --limit N      최대 N개만 수집 (기본: 전체)
 *   --page-size N  페이지당 항목 수 (기본: 100)
 *   --delay N      API 호출 간격 ms (기본: 500)
 *   --dry-run      DB에 저장하지 않음
 *   --resume       이미 저장된 슬러그 건너뜀
 *
 * 필수 환경변수:
 *   NONGSARO_API_KEY  공공데이터포털 일반 인증키(Encoding)
 *
 * 선택 환경변수:
 *   TURSO_DATABASE_URL  Turso 클라우드 URL (없으면 file:local.db)
 *   TURSO_AUTH_TOKEN    Turso 토큰
 */

import { createClient } from "@libsql/client";
import { existsSync, readFileSync } from "node:fs";
import {
  fetchGardenDetail,
  fetchGardenList,
  normalizeNongsaroGardenPlant
} from "../src/features/etl/nongsaro-garden.ts";

// ── env 로드 ───────────────────────────────────────────────
function loadEnv() {
  for (const file of [".env", ".env.local"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [name, ...rest] = trimmed.split("=");
      if (!process.env[name]) process.env[name] = rest.join("=").replace(/^["']|["']$/g, "");
    }
  }
}

// ── CLI 파싱 ──────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  return {
    limit: get("--limit") ? parseInt(get("--limit")) : Infinity,
    pageSize: parseInt(get("--page-size") ?? "100"),
    delay: parseInt(get("--delay") ?? "500"),
    dryRun: args.includes("--dry-run"),
    resume: args.includes("--resume")
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseJson(v) {
  try { return v ? JSON.parse(v) : {}; } catch { return {}; }
}

// ── DB 함수 ───────────────────────────────────────────────
async function getExistingSlugs(db) {
  const rows = await db.execute("SELECT slug FROM plants");
  return new Set(rows.rows.map((r) => String(r.slug)));
}

async function createPipelineRun(db, inputCount) {
  const r = await db.execute({
    sql: "INSERT INTO pipeline_runs (stage, started_at, status, input_count, output_count, rejected_count, meta) VALUES (?, ?, 'running', ?, 0, 0, ?) RETURNING id",
    args: ["etl:nongsaro-garden:layer1", Date.now(), inputCount, JSON.stringify({ source: "nongsaro_garden" })]
  });
  return Number(r.rows[0].id);
}

async function finishPipelineRun(db, id, status, outputCount, rejectedCount, errorLog) {
  await db.execute({
    sql: "UPDATE pipeline_runs SET finished_at = ?, status = ?, output_count = ?, rejected_count = ?, error_log = ? WHERE id = ?",
    args: [Date.now(), status, outputCount, rejectedCount, errorLog ?? null, id]
  });
}

async function upsertPlant(db, normalized) {
  const now = Date.now();
  const ex = await db.execute({ sql: "SELECT source_refs FROM plants WHERE slug = ? LIMIT 1", args: [normalized.plant.slug] });
  const sourceRefs = { ...parseJson(ex.rows[0]?.source_refs), ...normalized.plant.sourceRefs };

  await db.execute({
    sql: `INSERT INTO plants (scientific_name, korean_name, slug, family, genus, synonyms, origin, source_refs, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(slug) DO UPDATE SET
            scientific_name = excluded.scientific_name,
            korean_name = excluded.korean_name,
            family = coalesce(excluded.family, plants.family),
            genus = coalesce(excluded.genus, plants.genus),
            synonyms = excluded.synonyms,
            origin = coalesce(excluded.origin, plants.origin),
            source_refs = excluded.source_refs,
            updated_at = excluded.updated_at`,
    args: [normalized.plant.scientificName, normalized.plant.koreanName, normalized.plant.slug,
           normalized.plant.family, normalized.plant.genus, JSON.stringify(normalized.plant.synonyms),
           normalized.plant.origin, JSON.stringify(sourceRefs), now, now]
  });

  const row = await db.execute({ sql: "SELECT id FROM plants WHERE slug = ? LIMIT 1", args: [normalized.plant.slug] });
  return Number(row.rows[0].id);
}

async function upsertMetrics(db, plantId, metrics) {
  await db.execute({
    sql: `INSERT INTO plant_metrics (plant_id, pet_safety_score_dog, pet_safety_score_cat, child_safety_score, toxicity_notes,
            difficulty_score, indoor_outdoor_class, light_lux_min, light_lux_max, water_freq_days,
            temp_min_c, temp_max_c, humidity_min_pct, humidity_max_pct, derived_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(plant_id) DO UPDATE SET
            pet_safety_score_dog = coalesce(excluded.pet_safety_score_dog, plant_metrics.pet_safety_score_dog),
            pet_safety_score_cat = coalesce(excluded.pet_safety_score_cat, plant_metrics.pet_safety_score_cat),
            child_safety_score = coalesce(excluded.child_safety_score, plant_metrics.child_safety_score),
            toxicity_notes = coalesce(excluded.toxicity_notes, plant_metrics.toxicity_notes),
            difficulty_score = coalesce(excluded.difficulty_score, plant_metrics.difficulty_score),
            indoor_outdoor_class = coalesce(excluded.indoor_outdoor_class, plant_metrics.indoor_outdoor_class),
            light_lux_min = coalesce(excluded.light_lux_min, plant_metrics.light_lux_min),
            light_lux_max = coalesce(excluded.light_lux_max, plant_metrics.light_lux_max),
            water_freq_days = coalesce(excluded.water_freq_days, plant_metrics.water_freq_days),
            temp_min_c = coalesce(excluded.temp_min_c, plant_metrics.temp_min_c),
            temp_max_c = coalesce(excluded.temp_max_c, plant_metrics.temp_max_c),
            humidity_min_pct = coalesce(excluded.humidity_min_pct, plant_metrics.humidity_min_pct),
            humidity_max_pct = coalesce(excluded.humidity_max_pct, plant_metrics.humidity_max_pct),
            derived_at = excluded.derived_at`,
    args: [plantId, metrics.petSafetyScoreDog, metrics.petSafetyScoreCat, metrics.childSafetyScore,
           metrics.toxicityNotes, metrics.difficultyScore, metrics.indoorOutdoorClass,
           metrics.lightLuxMin, metrics.lightLuxMax, metrics.waterFreqDays,
           metrics.tempMinC, metrics.tempMaxC, metrics.humidityMinPct, metrics.humidityMaxPct, Date.now()]
  });
}

async function insertImageIfNeeded(db, plantId, imageUrl) {
  if (!imageUrl) return;
  const ex = await db.execute({ sql: "SELECT id FROM plant_images WHERE plant_id = ? AND url = ? LIMIT 1", args: [plantId, imageUrl] });
  if (ex.rows.length > 0) return;
  await db.execute({
    sql: "INSERT INTO plant_images (plant_id, url, source, license, attribution, is_primary) VALUES (?, ?, 'nongsaro', '농사로 OpenAPI', '농촌진흥청 농사로', false)",
    args: [plantId, imageUrl]
  });
}

// ── 메인 ──────────────────────────────────────────────────
async function main() {
  loadEnv();
  const { limit, pageSize, delay, dryRun, resume } = parseArgs();
  const apiKey = process.env.NONGSARO_API_KEY?.trim();
  if (!apiKey) throw new Error("NONGSARO_API_KEY가 .env.local에 없습니다.\n  공공데이터포털 > 농촌진흥청_농사로 실내정원용 식물 정보 서비스 > 일반 인증키(Encoding) 발급");

  const baseUrl = process.env.NONGSARO_GARDEN_API_BASE_URL?.trim();
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN
  });

  const existingSlugs = resume ? await getExistingSlugs(db) : new Set();
  if (resume) console.log(`  ↺ 재개 모드: 기존 ${existingSlugs.size}개 슬러그 건너뜀`);

  // Step 1: 총 개수 조회
  console.log("🔍 총 식물 수 확인 중...");
  const firstPage = await fetchGardenList(apiKey, { pageNo: 1, numOfRows: 1 }, baseUrl);
  const totalCount = Math.min(firstPage.totalCount, isFinite(limit) ? limit : Infinity);
  const totalPages = Math.ceil(totalCount / pageSize);
  console.log(`📋 수집 대상: ${totalCount}개 / 전체 ${firstPage.totalCount}개 (${totalPages}페이지)\n`);

  let runId;
  if (!dryRun) runId = await createPipelineRun(db, totalCount);

  let collected = 0;
  let saved = 0;
  let skipped = 0;
  const rejected = [];

  try {
    outer: for (let page = 1; page <= totalPages; page++) {
      const list = await fetchGardenList(apiKey, { pageNo: page, numOfRows: pageSize }, baseUrl);
      console.log(`  [페이지 ${page}/${totalPages}] ${list.items.length}개 수신`);

      for (const item of list.items) {
        if (isFinite(limit) && collected >= limit) break outer;
        collected++;

        const cntntsNo = item.cntntsNo;
        if (!cntntsNo) { rejected.push({ reason: "cntntsNo 없음", item }); continue; }

        // resume 모드에서 이미 있는 식물 건너뜀
        const previewSlug = String(item.cntntsSj ?? "").toLowerCase().replace(/\s+/g, "-").slice(0, 20);
        if (resume && [...existingSlugs].some(s => s.includes(previewSlug))) {
          skipped++;
          continue;
        }

        await sleep(delay);
        let detail;
        try {
          detail = await fetchGardenDetail(apiKey, cntntsNo, baseUrl);
        } catch (e) {
          rejected.push({ reason: `detail API 오류: ${e.message}`, cntntsNo });
          continue;
        }

        const normalized = detail ? normalizeNongsaroGardenPlant(detail, item) : null;
        if (!normalized) { rejected.push({ reason: "필수 필드 없음", cntntsNo }); continue; }

        if (resume && existingSlugs.has(normalized.plant.slug)) { skipped++; continue; }

        if (!dryRun) {
          const plantId = await upsertPlant(db, normalized);
          await upsertMetrics(db, plantId, normalized.metrics);
          await insertImageIfNeeded(db, plantId, normalized.imageUrl);
          existingSlugs.add(normalized.plant.slug);
        }
        saved++;

        if (saved % 50 === 0 || saved <= 5) {
          console.log(`    ✅ ${saved}개 저장됨 — 최근: ${normalized.plant.koreanName} (${normalized.plant.scientificName})`);
        }
      }

      if (page < totalPages) await sleep(delay);
    }

    if (!dryRun && runId) await finishPipelineRun(db, runId, "success", saved, rejected.length);
    console.log(`\n${"=".repeat(50)}`);
    console.log(`🌿 완료!`);
    console.log(`  ✅ 저장: ${saved}개`);
    console.log(`  ⏭ 건너뜀: ${skipped}개`);
    console.log(`  ❌ 거부: ${rejected.length}개`);
    if (dryRun) console.log(`  (드라이런: DB 저장 안 함)`);

  } catch (error) {
    if (!dryRun && runId) await finishPipelineRun(db, runId, "fail", saved, rejected.length, String(error));
    throw error;
  } finally {
    await db.close();
  }
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
