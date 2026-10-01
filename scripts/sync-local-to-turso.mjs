/**
 * 로컬 SQLite(local.db) → Turso 클라우드 식물 데이터 동기화
 * 실행: node scripts/sync-local-to-turso.mjs [--dry-run] [--allow-id-remap]
 *
 * plants + plant_metrics + plant_images 테이블을 Turso에 upsert 합니다.
 * blog_posts 는 동기화하지 않습니다 (별도 운영).
 *
 * OPS-03: 동기화 전 로컬·리모트 테이블 스키마(필수 컬럼) 및 slug↔id 정합성 사전검사를 수행합니다.
 * DATA-03: 안전성 필드 4개는 coalesce 없이 excluded 값을 직접 반영해 오염값 잔류를 방지합니다.
 */

import { createClient } from "@libsql/client";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const REQUIRED_TABLE_COLUMNS = {
  plants: [
    "id", "scientific_name", "korean_name", "slug", "family", "genus",
    "synonyms", "origin", "gbif_id", "wiki_url_ko", "source_refs", "created_at", "updated_at"
  ],
  plant_metrics: [
    "id", "plant_id", "climate_score_by_region", "pet_safety_score_dog", "pet_safety_score_cat",
    "child_safety_score", "toxicity_notes", "difficulty_score", "indoor_outdoor_class",
    "light_lux_min", "light_lux_max", "water_freq_days", "temp_min_c", "temp_max_c",
    "humidity_min_pct", "humidity_max_pct", "flower_meaning", "derived_at"
  ],
  plant_images: [
    "id", "plant_id", "url", "source", "license", "attribution", "is_primary", "width", "height"
  ]
};

export function validateTableColumns(tableName, requiredColumns, actualColumns) {
  const actualSet = new Set(actualColumns);
  const missing = requiredColumns.filter((col) => !actualSet.has(col));
  if (missing.length > 0) {
    throw new Error(
      `[OPS-03] 스키마 불일치 (${tableName}): 필수 컬럼 누락 -> ${missing.join(", ")}`
    );
  }
  return true;
}

/**
 * 로컬 plants(id, slug)와 리모트 plants(id, slug) 간의 ID/slug 정합성을 검사한다.
 * - 동일 slug인데 id가 다른 경우(idMismatch)
 * - 동일 id인데 slug가 다른 경우(slugCollision)
 */
export function inspectPlantIdentityAlignment(localPlants, remotePlants) {
  const remoteBySlug = new Map();
  const remoteById = new Map();

  for (const r of remotePlants) {
    remoteBySlug.set(String(r.slug), Number(r.id));
    remoteById.set(Number(r.id), String(r.slug));
  }

  const idMismatches = [];
  const slugCollisions = [];

  for (const l of localPlants) {
    const localId = Number(l.id);
    const localSlug = String(l.slug);

    const remoteIdForSlug = remoteBySlug.get(localSlug);
    if (remoteIdForSlug !== undefined && remoteIdForSlug !== localId) {
      idMismatches.push({ slug: localSlug, localId, remoteId: remoteIdForSlug });
    }

    const remoteSlugForId = remoteById.get(localId);
    if (remoteSlugForId !== undefined && remoteSlugForId !== localSlug) {
      slugCollisions.push({ id: localId, localSlug, remoteSlug: remoteSlugForId });
    }
  }

  return {
    ok: idMismatches.length === 0 && slugCollisions.length === 0,
    idMismatches,
    slugCollisions
  };
}

/**
 * 로컬 plant_id -> 리모트 실제 plant_id 매핑 테이블을 생성한다.
 */
export function buildLocalToRemotePlantIdMap(localPlants, remotePlants) {
  const remoteBySlug = new Map();
  for (const r of remotePlants) {
    remoteBySlug.set(String(r.slug), Number(r.id));
  }

  const idMap = new Map();
  for (const l of localPlants) {
    const localId = Number(l.id);
    const localSlug = String(l.slug);
    const remoteId = remoteBySlug.get(localSlug);
    idMap.set(localId, remoteId !== undefined ? remoteId : localId);
  }
  return idMap;
}

export const PLANT_METRICS_UPSERT_SQL = `INSERT INTO plant_metrics (id, plant_id, climate_score_by_region, pet_safety_score_dog, pet_safety_score_cat,
  child_safety_score, toxicity_notes, difficulty_score, indoor_outdoor_class,
  light_lux_min, light_lux_max, water_freq_days, temp_min_c, temp_max_c,
  humidity_min_pct, humidity_max_pct, flower_meaning, derived_at)
VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
ON CONFLICT(plant_id) DO UPDATE SET
  climate_score_by_region=coalesce(excluded.climate_score_by_region,plant_metrics.climate_score_by_region),
  pet_safety_score_dog=excluded.pet_safety_score_dog,
  pet_safety_score_cat=excluded.pet_safety_score_cat,
  child_safety_score=excluded.child_safety_score,
  toxicity_notes=excluded.toxicity_notes,
  difficulty_score=coalesce(excluded.difficulty_score,plant_metrics.difficulty_score),
  indoor_outdoor_class=coalesce(excluded.indoor_outdoor_class,plant_metrics.indoor_outdoor_class),
  light_lux_min=coalesce(excluded.light_lux_min,plant_metrics.light_lux_min),
  light_lux_max=coalesce(excluded.light_lux_max,plant_metrics.light_lux_max),
  water_freq_days=coalesce(excluded.water_freq_days,plant_metrics.water_freq_days),
  temp_min_c=coalesce(excluded.temp_min_c,plant_metrics.temp_min_c),
  temp_max_c=coalesce(excluded.temp_max_c,plant_metrics.temp_max_c),
  humidity_min_pct=coalesce(excluded.humidity_min_pct,plant_metrics.humidity_min_pct),
  humidity_max_pct=coalesce(excluded.humidity_max_pct,plant_metrics.humidity_max_pct),
  flower_meaning=coalesce(excluded.flower_meaning,plant_metrics.flower_meaning),
  derived_at=excluded.derived_at`;

async function getTableColumnNames(client, tableName) {
  const res = await client.execute(`PRAGMA table_info(${tableName})`);
  return res.rows.map((r) => String(r.name));
}

async function verifyDatabaseSchemas(local, remote) {
  for (const [tableName, requiredCols] of Object.entries(REQUIRED_TABLE_COLUMNS)) {
    const localCols = await getTableColumnNames(local, tableName);
    const remoteCols = await getTableColumnNames(remote, tableName);
    validateTableColumns(`local.${tableName}`, requiredCols, localCols);
    validateTableColumns(`remote.${tableName}`, requiredCols, remoteCols);
  }
}

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

async function main() {
  loadEnv();

  const isDryRun = process.argv.includes("--dry-run");
  const allowIdRemap = process.argv.includes("--allow-id-remap");

  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();
  if (!tursoUrl || !tursoToken) throw new Error("TURSO_DATABASE_URL / TURSO_AUTH_TOKEN 필요");

  const local = createClient({ url: "file:local.db" });
  const remote = createClient({ url: tursoUrl, authToken: tursoToken });

  try {
    // ── 1. 스키마 정합성 사전검사 (OPS-03) ────────────────────
    console.log("🔍 로컬 및 리모트 스키마 정합성 검사 중...");
    await verifyDatabaseSchemas(local, remote);
    console.log("  ✅ 스키마 정합성 확인 완료");

    // ── 2. 식물 수 및 ID/slug 정합성 사전검사 ─────────────────
    const localPlantsIdentity = await local.execute("SELECT id, slug FROM plants ORDER BY id");
    const remotePlantsIdentity = await remote.execute("SELECT id, slug FROM plants ORDER BY id");
    console.log(
      `📦 로컬: ${localPlantsIdentity.rows.length}개 / 리모트: ${remotePlantsIdentity.rows.length}개`
    );

    const alignment = inspectPlantIdentityAlignment(
      localPlantsIdentity.rows,
      remotePlantsIdentity.rows
    );

    if (!alignment.ok) {
      console.warn(
        `⚠️ [OPS-03] ID/slug 불일치 감지: slug동일·ID불일치 ${alignment.idMismatches.length}건, ID동일·slug충돌 ${alignment.slugCollisions.length}건`
      );
      if (!allowIdRemap) {
        throw new Error(
          "[OPS-03] 로컬과 리모트의 plants ID/slug 매핑이 일치하지 않아 동기화를 중단합니다. 리모트 slug 기준으로 plant_id를 재매핑하려면 --allow-id-remap 플래그를 사용하세요."
        );
      }
    } else {
      console.log("  ✅ plants ID/slug 정합성 확인 완료");
    }

    if (isDryRun) {
      console.log("(드라이런) 실제 전송 없음");
      return;
    }

    // ── 3. plants 동기화 ────────────────────────────────────────
    const plants = await local.execute("SELECT * FROM plants ORDER BY id");
    console.log(`\n🌿 plants ${plants.rows.length}개 동기화 중...`);
    let plantsDone = 0;
    for (const r of plants.rows) {
      await remote.execute({
        sql: `INSERT INTO plants (id, scientific_name, korean_name, slug, family, genus, synonyms, origin, gbif_id, wiki_url_ko, source_refs, created_at, updated_at)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
              ON CONFLICT(slug) DO UPDATE SET
                scientific_name=excluded.scientific_name, korean_name=excluded.korean_name,
                family=coalesce(excluded.family,plants.family), genus=coalesce(excluded.genus,plants.genus),
                synonyms=excluded.synonyms, origin=coalesce(excluded.origin,plants.origin),
                source_refs=excluded.source_refs, updated_at=excluded.updated_at`,
        args: [
          r.id, r.scientific_name, r.korean_name, r.slug, r.family, r.genus,
          r.synonyms, r.origin, r.gbif_id, r.wiki_url_ko, r.source_refs, r.created_at, r.updated_at
        ]
      });
      plantsDone++;
      if (plantsDone % 100 === 0) console.log(`  plants: ${plantsDone}/${plants.rows.length}`);
    }
    console.log(`  ✅ plants ${plantsDone}개 완료`);

    // 리모트의 최신 (id, slug) 매핑을 다시 조회해 외래키 plant_id 정합성 보장
    const updatedRemoteIdentity = await remote.execute("SELECT id, slug FROM plants ORDER BY id");
    const plantIdMap = buildLocalToRemotePlantIdMap(
      localPlantsIdentity.rows,
      updatedRemoteIdentity.rows
    );

    // ── 4. plant_metrics 동기화 ─────────────────────────────────
    const metrics = await local.execute("SELECT * FROM plant_metrics ORDER BY id");
    console.log(`\n📊 plant_metrics ${metrics.rows.length}개 동기화 중...`);
    let metricsDone = 0;
    for (const r of metrics.rows) {
      const targetPlantId = plantIdMap.get(Number(r.plant_id)) ?? r.plant_id;
      await remote.execute({
        sql: PLANT_METRICS_UPSERT_SQL,
        args: [
          r.id, targetPlantId, r.climate_score_by_region, r.pet_safety_score_dog, r.pet_safety_score_cat,
          r.child_safety_score, r.toxicity_notes, r.difficulty_score, r.indoor_outdoor_class,
          r.light_lux_min, r.light_lux_max, r.water_freq_days, r.temp_min_c, r.temp_max_c,
          r.humidity_min_pct, r.humidity_max_pct, r.flower_meaning, r.derived_at
        ]
      });
      metricsDone++;
      if (metricsDone % 100 === 0) console.log(`  metrics: ${metricsDone}/${metrics.rows.length}`);
    }
    console.log(`  ✅ plant_metrics ${metricsDone}개 완료`);

    // ── 5. plant_images 동기화 ──────────────────────────────────
    const images = await local.execute("SELECT * FROM plant_images ORDER BY id");
    console.log(`\n🖼  plant_images ${images.rows.length}개 동기화 중...`);
    let imgDone = 0;
    for (const r of images.rows) {
      const targetPlantId = plantIdMap.get(Number(r.plant_id)) ?? r.plant_id;
      await remote.execute({
        sql: `INSERT INTO plant_images (id, plant_id, url, source, license, attribution, is_primary, width, height)
              VALUES (?,?,?,?,?,?,?,?,?)
              ON CONFLICT(id) DO NOTHING`,
        args: [r.id, targetPlantId, r.url, r.source, r.license, r.attribution, r.is_primary, r.width, r.height]
      });
      imgDone++;
    }
    console.log(`  ✅ plant_images ${imgDone}개 완료`);

    const finalCount = await remote.execute("SELECT count(*) as cnt FROM plants");
    console.log(`\n🎉 Turso 최종 식물 수: ${finalCount.rows[0].cnt}개`);
  } finally {
    await local.close();
    await remote.close();
  }
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main().catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  });
}
