import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  REQUIRED_TABLE_COLUMNS,
  validateTableColumns,
  inspectPlantIdentityAlignment,
  buildLocalToRemotePlantIdMap,
  PLANT_METRICS_UPSERT_SQL
} from "../sync-local-to-turso.mjs";
import { buildUniquePlantNameSlugMap } from "../../src/features/plants/name-map.ts";

// 1. OPS-03: 스키마 필수 컬럼 검증
{
  assert.equal(
    validateTableColumns("plants", REQUIRED_TABLE_COLUMNS.plants, REQUIRED_TABLE_COLUMNS.plants),
    true
  );

  assert.throws(
    () => validateTableColumns("plants", REQUIRED_TABLE_COLUMNS.plants, ["id", "slug"]),
    /\[OPS-03\] 스키마 불일치/
  );
}

// 2. OPS-03: 로컬·리모트 ID/slug 정합성 사전검사 및 plant_id 매핑
{
  const alignedLocal = [
    { id: 1, slug: "monstera-deliciosa" },
    { id: 2, slug: "epipremnum-aureum" }
  ];
  const alignedRemote = [
    { id: 1, slug: "monstera-deliciosa" },
    { id: 2, slug: "epipremnum-aureum" }
  ];

  const okResult = inspectPlantIdentityAlignment(alignedLocal, alignedRemote);
  assert.equal(okResult.ok, true);
  assert.equal(okResult.idMismatches.length, 0);
  assert.equal(okResult.slugCollisions.length, 0);

  // 리모트에서 동일 slug가 다른 id(10)를 갖고 있는 경우 감지 및 리매핑 확인
  const mismatchedRemote = [
    { id: 10, slug: "monstera-deliciosa" },
    { id: 2, slug: "ficus-elastica" }
  ];
  const mismatchResult = inspectPlantIdentityAlignment(alignedLocal, mismatchedRemote);
  assert.equal(mismatchResult.ok, false);
  assert.equal(mismatchResult.idMismatches.length, 1);
  assert.deepEqual(mismatchResult.idMismatches[0], {
    slug: "monstera-deliciosa",
    localId: 1,
    remoteId: 10
  });
  assert.equal(mismatchResult.slugCollisions.length, 1);

  const idMap = buildLocalToRemotePlantIdMap(alignedLocal, mismatchedRemote);
  assert.equal(idMap.get(1), 10, "로컬 id 1(monstera-deliciosa)은 리모트 id 10으로 매핑되어야 함");
}

// 3. DATA-03: sync-local-to-turso.mjs의 안전성 필드가 coalesce 없이 excluded를 직접 반영해야 함
{
  assert.ok(
    PLANT_METRICS_UPSERT_SQL.includes("pet_safety_score_dog=excluded.pet_safety_score_dog"),
    "pet_safety_score_dog는 coalesce 없이 excluded를 직접 사용해야 함"
  );
  assert.ok(
    PLANT_METRICS_UPSERT_SQL.includes("pet_safety_score_cat=excluded.pet_safety_score_cat"),
    "pet_safety_score_cat는 coalesce 없이 excluded를 직접 사용해야 함"
  );
  assert.ok(
    PLANT_METRICS_UPSERT_SQL.includes("child_safety_score=excluded.child_safety_score"),
    "child_safety_score는 coalesce 없이 excluded를 직접 사용해야 함"
  );
  assert.ok(
    PLANT_METRICS_UPSERT_SQL.includes("toxicity_notes=excluded.toxicity_notes"),
    "toxicity_notes는 coalesce 없이 excluded를 직접 사용해야 함"
  );
}

// 4. DISCOVERY-01: 동음이의어 국명은 자동 링크에서 제외되고 유일한 국명만 매핑되어야 함
{
  const rows = [
    { koreanName: "몬스테라", slug: "monstera-deliciosa" },
    { koreanName: "고무나무", slug: "ficus-elastica" },
    { koreanName: "고무나무", slug: "ficus-benghalensis" },
    { koreanName: "  스킨답서스 ", slug: "epipremnum-aureum" }
  ];

  const nameMap = buildUniquePlantNameSlugMap(rows);
  assert.deepEqual(nameMap, {
    몬스테라: "monstera-deliciosa",
    스킨답서스: "epipremnum-aureum"
  });
  assert.equal(
    "고무나무" in nameMap,
    false,
    "동음이의어(고무나무 2종)는 문맥 없는 오링크 방지를 위해 제외되어야 함"
  );
}

// 5. DISCOVERY-01 / SEO-02: 홈페이지 FAQ 문구에 미구현 '식물 이름으로 검색' 표현이 없어야 함
{
  const pageSource = readFileSync(new URL("../../src/app/page.tsx", import.meta.url), "utf8");
  assert.equal(
    pageSource.includes("식물 이름으로 검색하거나"),
    false,
    "홈페이지 FAQ에 미구현된 이름 검색 안내 문구가 남아있으면 안 됨"
  );
}

console.log("OPS_03_DISCOVERY_01_OK");
