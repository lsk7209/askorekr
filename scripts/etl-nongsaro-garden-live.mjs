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
/**
 * "--flag value"와 "--flag=value" 두 형태를 모두 지원한다.
 * 문서(주석 상단 사용법)는 "--limit N" 형태를 보이지만, 등호 형태로 호출해도
 * 조용히 무제한(Infinity)으로 해석되지 않도록 두 형태 모두 인식한다.
 */
function getFlagValue(args, flag) {
  const eqPrefix = `${flag}=`;
  const eqArg = args.find((a) => a.startsWith(eqPrefix));
  if (eqArg !== undefined) {
    return eqArg.slice(eqPrefix.length);
  }
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

/** 양의 정수만 허용. 누락/음수/0/NaN은 명시적으로 거절한다 (조용히 무제한 실행하지 않음). */
function parsePositiveIntOrThrow(raw, flagName, fallback) {
  if (raw === undefined) {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flagName} 값이 올바르지 않습니다: "${raw}" (양의 정수만 허용)`);
  }
  return parsed;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const limitRaw = getFlagValue(args, "--limit");

  return {
    limit: limitRaw === undefined ? Infinity : parsePositiveIntOrThrow(limitRaw, "--limit"),
    pageSize: parsePositiveIntOrThrow(getFlagValue(args, "--page-size"), "--page-size", 100),
    delay: parsePositiveIntOrThrow(getFlagValue(args, "--delay"), "--delay", 500),
    dryRun: args.includes("--dry-run"),
    resume: args.includes("--resume")
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Drizzle 스키마의 timestamp 컬럼(mode: "timestamp")은 초 단위 유닉스 타임을 기대한다
 * (읽을 때 value*1000으로 밀리초 변환). 원시 SQL로 직접 쓸 때 Date.now()(밀리초)를 그대로
 * 넣으면 나중에 Drizzle이 읽을 때 1000배 부풀려진 날짜(비정상 미래)가 된다.
 * 이 스크립트의 모든 timestamp 쓰기는 이 함수를 사용해 초 단위로 통일한다.
 */
function nowSeconds() {
  return Math.floor(Date.now() / 1000);
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
    args: ["etl:nongsaro-garden:layer1", nowSeconds(), inputCount, JSON.stringify({ source: "nongsaro_garden" })]
  });
  return Number(r.rows[0].id);
}

async function finishPipelineRun(db, id, status, outputCount, rejectedCount, errorLog) {
  await db.execute({
    sql: "UPDATE pipeline_runs SET finished_at = ?, status = ?, output_count = ?, rejected_count = ?, error_log = ? WHERE id = ?",
    args: [nowSeconds(), status, outputCount, rejectedCount, errorLog ?? null, id]
  });
}

async function upsertPlant(db, normalized) {
  const now = nowSeconds();
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
  // 안전성 관련 필드(pet_safety_score_*, child_safety_score, toxicity_notes)는
  // coalesce로 기존 값을 보존하지 않고 재수집 시 원본(excluded) 값을 그대로 덮어쓴다.
  // 이유: SAFE-01 수정 이후 mapSafety는 근거가 애매하면 null(unknown)을 반환하는데,
  // coalesce(excluded.pet_safety_score_dog, plant_metrics.pet_safety_score_dog)를 쓰면
  // 재수집으로 null이 들어와도 과거 잘못 저장된 85점 등이 계속 유지되어 정정 효과가 사라진다.
  // 다른 필드(난이도/광량/온도/습도 등)는 원본 API가 일시적으로 필드를 누락해도 기존 값을
  // 보존하는 편이 안전하므로 coalesce를 그대로 유지한다.
  await db.execute({
    sql: `INSERT INTO plant_metrics (plant_id, pet_safety_score_dog, pet_safety_score_cat, child_safety_score, toxicity_notes,
            difficulty_score, indoor_outdoor_class, light_lux_min, light_lux_max, water_freq_days,
            temp_min_c, temp_max_c, humidity_min_pct, humidity_max_pct, derived_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(plant_id) DO UPDATE SET
            pet_safety_score_dog = excluded.pet_safety_score_dog,
            pet_safety_score_cat = excluded.pet_safety_score_cat,
            child_safety_score = excluded.child_safety_score,
            toxicity_notes = excluded.toxicity_notes,
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
           metrics.tempMinC, metrics.tempMaxC, metrics.humidityMinPct, metrics.humidityMaxPct, nowSeconds()]
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
  // CLI 인자를 가장 먼저 검증한다. 잘못된 --limit/--page-size/--delay는
  // env 로드나 API 호출 같은 부작용이 실행되기 전에 즉시 실패해야 한다.
  const { limit, pageSize, delay, dryRun, resume } = parseArgs();
  loadEnv();
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

main().catch((e) => {
  const message = e?.message ?? String(e);

  if (/Nongsaro API error 11/.test(message)) {
    console.error(
      JSON.stringify({
        ok: false,
        retryable: false,
        source: "nongsaro-garden",
        reason: "nongsaro_api_key_not_registered"
      })
    );
    process.exit(1);
  }

  if (message.includes("fetch failed")) {
    console.error(
      JSON.stringify({
        ok: false,
        retryable: true,
        source: "nongsaro-garden",
        reason: "transient_nongsaro_fetch_failed"
      })
    );
    process.exit(1);
  }

  console.error(message);
  process.exit(1);
});
