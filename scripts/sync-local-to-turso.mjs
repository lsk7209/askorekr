/**
 * 로컬 SQLite(local.db) → Turso 클라우드 식물 데이터 동기화
 * 실행: node scripts/sync-local-to-turso.mjs [--dry-run]
 *
 * plants + plant_metrics + plant_images 테이블을 Turso에 upsert 합니다.
 * blog_posts 는 동기화하지 않습니다 (별도 운영).
 */

import { createClient } from "@libsql/client";
import { existsSync, readFileSync } from "node:fs";

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

const isDryRun = process.argv.includes("--dry-run");

async function main() {
  loadEnv();

  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();
  if (!tursoUrl || !tursoToken) throw new Error("TURSO_DATABASE_URL / TURSO_AUTH_TOKEN 필요");

  const local = createClient({ url: "file:local.db" });
  const remote = createClient({ url: tursoUrl, authToken: tursoToken });

  // ── 식물 수 확인 ────────────────────────────────────────
  const localCount = await local.execute("SELECT count(*) as cnt FROM plants");
  const remoteCount = await remote.execute("SELECT count(*) as cnt FROM plants");
  console.log(`📦 로컬: ${localCount.rows[0].cnt}개 / 리모트: ${remoteCount.rows[0].cnt}개`);

  if (isDryRun) {
    console.log("(드라이런) 실제 전송 없음");
    await local.close(); await remote.close();
    return;
  }

  // ── plants 동기화 ────────────────────────────────────────
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
      args: [r.id, r.scientific_name, r.korean_name, r.slug, r.family, r.genus,
             r.synonyms, r.origin, r.gbif_id, r.wiki_url_ko, r.source_refs, r.created_at, r.updated_at]
    });
    plantsDone++;
    if (plantsDone % 100 === 0) console.log(`  plants: ${plantsDone}/${plants.rows.length}`);
  }
  console.log(`  ✅ plants ${plantsDone}개 완료`);

  // ── plant_metrics 동기화 ─────────────────────────────────
  const metrics = await local.execute("SELECT * FROM plant_metrics ORDER BY id");
  console.log(`\n📊 plant_metrics ${metrics.rows.length}개 동기화 중...`);
  let metricsDone = 0;
  for (const r of metrics.rows) {
    await remote.execute({
      sql: `INSERT INTO plant_metrics (id, plant_id, climate_score_by_region, pet_safety_score_dog, pet_safety_score_cat,
              child_safety_score, toxicity_notes, difficulty_score, indoor_outdoor_class,
              light_lux_min, light_lux_max, water_freq_days, temp_min_c, temp_max_c,
              humidity_min_pct, humidity_max_pct, flower_meaning, derived_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(plant_id) DO UPDATE SET
              climate_score_by_region=coalesce(excluded.climate_score_by_region,plant_metrics.climate_score_by_region),
              pet_safety_score_dog=coalesce(excluded.pet_safety_score_dog,plant_metrics.pet_safety_score_dog),
              pet_safety_score_cat=coalesce(excluded.pet_safety_score_cat,plant_metrics.pet_safety_score_cat),
              child_safety_score=coalesce(excluded.child_safety_score,plant_metrics.child_safety_score),
              toxicity_notes=coalesce(excluded.toxicity_notes,plant_metrics.toxicity_notes),
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
              derived_at=excluded.derived_at`,
      args: [r.id, r.plant_id, r.climate_score_by_region, r.pet_safety_score_dog, r.pet_safety_score_cat,
             r.child_safety_score, r.toxicity_notes, r.difficulty_score, r.indoor_outdoor_class,
             r.light_lux_min, r.light_lux_max, r.water_freq_days, r.temp_min_c, r.temp_max_c,
             r.humidity_min_pct, r.humidity_max_pct, r.flower_meaning, r.derived_at]
    });
    metricsDone++;
    if (metricsDone % 100 === 0) console.log(`  metrics: ${metricsDone}/${metrics.rows.length}`);
  }
  console.log(`  ✅ plant_metrics ${metricsDone}개 완료`);

  // ── plant_images 동기화 ──────────────────────────────────
  const images = await local.execute("SELECT * FROM plant_images ORDER BY id");
  console.log(`\n🖼  plant_images ${images.rows.length}개 동기화 중...`);
  let imgDone = 0;
  for (const r of images.rows) {
    await remote.execute({
      sql: `INSERT INTO plant_images (id, plant_id, url, source, license, attribution, is_primary, width, height)
            VALUES (?,?,?,?,?,?,?,?,?)
            ON CONFLICT(id) DO NOTHING`,
      args: [r.id, r.plant_id, r.url, r.source, r.license, r.attribution, r.is_primary, r.width, r.height]
    });
    imgDone++;
  }
  console.log(`  ✅ plant_images ${imgDone}개 완료`);

  const finalCount = await remote.execute("SELECT count(*) as cnt FROM plants");
  console.log(`\n🎉 Turso 최종 식물 수: ${finalCount.rows[0].cnt}개`);

  await local.close();
  await remote.close();
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
