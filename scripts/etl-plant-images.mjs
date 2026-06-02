/**
 * GBIF API로 식물 이미지 수집 ETL
 * 실행: node scripts/etl-plant-images.mjs [--limit=N] [--dry-run]
 *
 * 동작:
 *  1. DB에서 scientificName 목록 조회 (plant_images 없는 식물만)
 *  2. GBIF /species/match?name= 로 taxonKey 획득
 *  3. GBIF /occurrence/search?taxonKey=&mediaType=StillImage 로 CC 이미지 URL 수집
 *  4. plant_images 테이블에 저장
 */

import { createClient } from "@libsql/client";

const TURSO_URL = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;
const GBIF_BASE = "https://api.gbif.org/v1";

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const limitArg = args.find(a => a.startsWith("--limit="))?.split("=")[1];
const limit = limitArg ? parseInt(limitArg) : 50;
const delayMs = 300; // GBIF API 부하 방지

const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function gbifSpeciesMatch(scientificName) {
  const url = `${GBIF_BASE}/species/match?name=${encodeURIComponent(scientificName)}&verbose=false`;
  const res = await fetch(url, { headers: { "User-Agent": "PlantFriends-ETL/1.0 (askore.kr)" } });
  if (!res.ok) return null;
  const data = await res.json();
  return data.usageKey ?? data.speciesKey ?? null;
}

async function gbifOccurrenceImages(taxonKey) {
  const url = `${GBIF_BASE}/occurrence/search?taxonKey=${taxonKey}&mediaType=StillImage&limit=5&hasCoordinate=false`;
  const res = await fetch(url, { headers: { "User-Agent": "PlantFriends-ETL/1.0 (askore.kr)" } });
  if (!res.ok) return [];
  const data = await res.json();

  const images = [];
  for (const occ of data.results ?? []) {
    for (const media of occ.media ?? []) {
      if (!media.identifier) continue;
      const license = media.license ?? occ.license ?? "";
      if (!license.includes("creativecommons") && !license.includes("CC")) continue;
      images.push({
        url: media.identifier,
        source: "GBIF",
        license: license.replace("http://creativecommons.org/licenses/", "CC ").replace("/4.0/", ""),
        attribution: [media.creator, media.publisher, occ.institutionCode].filter(Boolean).join(", ") || "GBIF contributor",
        width: media.format?.includes("width=") ? parseInt(media.format.match(/width=(\d+)/)?.[1] ?? "0") : null,
        height: media.format?.includes("height=") ? parseInt(media.format.match(/height=(\d+)/)?.[1] ?? "0") : null
      });
      if (images.length >= 2) break;
    }
    if (images.length >= 2) break;
  }
  return images;
}

async function getPlantsWithoutImages() {
  const result = await client.execute(`
    SELECT p.id, p.scientific_name, p.korean_name
    FROM plants p
    LEFT JOIN plant_images pi ON pi.plant_id = p.id
    WHERE pi.id IS NULL
    ORDER BY p.id
    LIMIT ${limit}
  `);
  return result.rows.map(r => ({ id: Number(r[0]), scientificName: String(r[1]), koreanName: String(r[2]) }));
}

async function insertImage(plantId, img, isPrimary) {
  await client.execute({
    sql: `INSERT INTO plant_images (plant_id, url, source, license, attribution, is_primary, width, height)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [plantId, img.url, img.source, img.license, img.attribution, isPrimary ? 1 : 0, img.width, img.height]
  });
}

async function main() {
  console.log(`\n🌿 식물 이미지 ETL 시작 (GBIF)`);
  console.log(`   대상: 최대 ${limit}종 | 드라이런: ${isDryRun ? "예" : "아니오"}\n`);

  const plants = await getPlantsWithoutImages();
  console.log(`   이미지 없는 식물: ${plants.length}종\n`);

  let success = 0, noImage = 0, fail = 0;

  for (let i = 0; i < plants.length; i++) {
    const plant = plants[i];
    process.stdout.write(`[${i+1}/${plants.length}] ${plant.koreanName} (${plant.scientificName}) → `);

    try {
      // 1. taxonKey 획득
      const taxonKey = await gbifSpeciesMatch(plant.scientificName);
      if (!taxonKey) { console.log("taxonKey 없음"); noImage++; await sleep(delayMs); continue; }

      // 2. 이미지 검색
      await sleep(delayMs);
      const images = await gbifOccurrenceImages(taxonKey);

      if (images.length === 0) {
        console.log("이미지 없음");
        noImage++;
        await sleep(delayMs);
        continue;
      }

      if (isDryRun) {
        console.log(`${images.length}개 발견 (드라이런)`);
        console.log(`     → ${images[0].url.slice(0, 80)}`);
      } else {
        for (let j = 0; j < images.length; j++) {
          await insertImage(plant.id, images[j], j === 0);
        }
        console.log(`✅ ${images.length}개 저장`);
      }
      success++;
    } catch (err) {
      console.log(`❌ ${err.message}`);
      fail++;
    }
    await sleep(delayMs);
  }

  console.log(`\n✅ 완료: 이미지 저장 ${success}종 | 이미지 없음 ${noImage}종 | 오류 ${fail}종`);
  await client.close();
}

main().catch(e => { console.error(e); process.exit(1); });
