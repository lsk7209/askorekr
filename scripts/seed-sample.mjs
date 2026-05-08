import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN
});

const now = Date.now();

const regions = [
  { code: "11680", sido: "서울특별시", sigungu: "강남구", latitude: 37.5172, longitude: 127.0473 },
  { code: "41135", sido: "경기도", sigungu: "성남시 분당구", latitude: 37.3828, longitude: 127.1189 },
  { code: "26110", sido: "부산광역시", sigungu: "중구", latitude: 35.1062, longitude: 129.0323 }
];

const plants = [
  {
    scientificName: "Monstera deliciosa",
    koreanName: "몬스테라",
    slug: "monstera-deliciosa",
    family: "Araceae",
    genus: "Monstera",
    indoorOutdoorClass: "indoor",
    difficultyScore: 34,
    climateScoreByRegion: { "11680": 88, "41135": 86, "26110": 91 },
    petSafetyScoreDog: 35,
    petSafetyScoreCat: 35,
    childSafetyScore: 55,
    toxicityNotes: "반려동물이 씹지 않도록 위치를 분리하는 편이 좋아요.",
    lightLuxMin: 800,
    lightLuxMax: 3000,
    waterFreqDays: 7,
    tempMinC: 18,
    tempMaxC: 28,
    humidityMinPct: 45,
    humidityMaxPct: 75,
    flowerMeaning: { primary: "깊은 관계와 성장" }
  },
  {
    scientificName: "Epipremnum aureum",
    koreanName: "스킨답서스",
    slug: "epipremnum-aureum",
    family: "Araceae",
    genus: "Epipremnum",
    indoorOutdoorClass: "indoor",
    difficultyScore: 18,
    climateScoreByRegion: { "11680": 84, "41135": 82, "26110": 90 },
    petSafetyScoreDog: 40,
    petSafetyScoreCat: 40,
    childSafetyScore: 60,
    toxicityNotes: "섭취하지 않도록 높은 선반이나 행잉 위치가 알맞아요.",
    lightLuxMin: 500,
    lightLuxMax: 2500,
    waterFreqDays: 6,
    tempMinC: 16,
    tempMaxC: 30,
    humidityMinPct: 40,
    humidityMaxPct: 80,
    flowerMeaning: { primary: "꾸준한 생명력" }
  },
  {
    scientificName: "Dracaena trifasciata",
    koreanName: "산세베리아",
    slug: "dracaena-trifasciata",
    family: "Asparagaceae",
    genus: "Dracaena",
    indoorOutdoorClass: "indoor",
    difficultyScore: 12,
    climateScoreByRegion: { "11680": 81, "41135": 80, "26110": 87 },
    petSafetyScoreDog: 45,
    petSafetyScoreCat: 45,
    childSafetyScore: 70,
    toxicityNotes: "반려동물 섭취 가능성이 낮은 위치에 두는 것을 권장해요.",
    lightLuxMin: 400,
    lightLuxMax: 4000,
    waterFreqDays: 14,
    tempMinC: 15,
    tempMaxC: 30,
    humidityMinPct: 30,
    humidityMaxPct: 60,
    flowerMeaning: { primary: "단단한 보호" }
  },
  {
    scientificName: "Olea europaea",
    koreanName: "올리브나무",
    slug: "olea-europaea",
    family: "Oleaceae",
    genus: "Olea",
    indoorOutdoorClass: "both",
    difficultyScore: 56,
    climateScoreByRegion: { "11680": 70, "41135": 69, "26110": 83 },
    petSafetyScoreDog: 85,
    petSafetyScoreCat: 85,
    childSafetyScore: 90,
    toxicityNotes: "일반 가드닝 참고용 안전성 점수이며 섭취 상황은 전문가 상담이 필요해요.",
    lightLuxMin: 5000,
    lightLuxMax: 20000,
    waterFreqDays: 5,
    tempMinC: 5,
    tempMaxC: 32,
    humidityMinPct: 35,
    humidityMaxPct: 65,
    flowerMeaning: { primary: "평화와 풍요" }
  },
  {
    scientificName: "Salvia rosmarinus",
    koreanName: "로즈마리",
    slug: "salvia-rosmarinus",
    family: "Lamiaceae",
    genus: "Salvia",
    indoorOutdoorClass: "both",
    difficultyScore: 48,
    climateScoreByRegion: { "11680": 73, "41135": 72, "26110": 86 },
    petSafetyScoreDog: 75,
    petSafetyScoreCat: 75,
    childSafetyScore: 82,
    toxicityNotes: "향이 강해 반려동물 반응을 관찰하며 배치하는 편이 좋아요.",
    lightLuxMin: 4000,
    lightLuxMax: 18000,
    waterFreqDays: 4,
    tempMinC: 8,
    tempMaxC: 30,
    humidityMinPct: 30,
    humidityMaxPct: 60,
    flowerMeaning: { primary: "기억과 우정" }
  }
];

const categories = [
  {
    slug: "indoor-foliage",
    title: "실내 관엽식물",
    description: "집 안에서 키우기 좋은 잎보기 식물을 모았어요.",
    parentSlug: null
  },
  {
    slug: "herbs",
    title: "허브",
    description: "향과 쓰임이 분명해 베란다 가드닝에 자주 쓰이는 식물이에요.",
    parentSlug: null
  },
  {
    slug: "balcony-trees",
    title: "베란다 나무",
    description: "햇빛이 있는 베란다와 실외 공간에 어울리는 나무형 식물이에요.",
    parentSlug: null
  }
];

const taxonomy = {
  "monstera-deliciosa": "indoor-foliage",
  "epipremnum-aureum": "indoor-foliage",
  "dracaena-trifasciata": "indoor-foliage",
  "olea-europaea": "balcony-trees",
  "salvia-rosmarinus": "herbs"
};

await db.batch(
  regions.map((region) => ({
    sql: `
      insert into regions (code, sido, sigungu, latitude, longitude)
      values (?, ?, ?, ?, ?)
      on conflict(code) do update set
        sido = excluded.sido,
        sigungu = excluded.sigungu,
        latitude = excluded.latitude,
        longitude = excluded.longitude
    `,
    args: [region.code, region.sido, region.sigungu, region.latitude, region.longitude]
  }))
);

await db.batch(
  categories.map((category) => ({
    sql: `
      insert into dictionary_categories (slug, title, description, parent_slug, plant_count)
      values (?, ?, ?, ?, 0)
      on conflict(slug) do update set
        title = excluded.title,
        description = excluded.description,
        parent_slug = excluded.parent_slug
    `,
    args: [
      category.slug,
      category.title,
      category.description,
      category.parentSlug
    ]
  }))
);

for (const plant of plants) {
  await db.execute({
    sql: `
      insert into plants (
        scientific_name, korean_name, slug, family, genus, synonyms, origin,
        gbif_id, wiki_url_ko, source_refs, created_at, updated_at
      )
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      on conflict(slug) do update set
        scientific_name = excluded.scientific_name,
        korean_name = excluded.korean_name,
        family = excluded.family,
        genus = excluded.genus,
        updated_at = excluded.updated_at
    `,
    args: [
      plant.scientificName,
      plant.koreanName,
      plant.slug,
      plant.family,
      plant.genus,
      "[]",
      "샘플 데이터",
      null,
      null,
      JSON.stringify({ sample: "Phase 1 quick diagnose seed" }),
      now,
      now
    ]
  });

  const result = await db.execute({
    sql: "select id from plants where slug = ?",
    args: [plant.slug]
  });
  const plantId = Number(result.rows[0]?.id);

  await db.execute({
    sql: `
      insert into plant_metrics (
        plant_id, climate_score_by_region, pet_safety_score_dog,
        pet_safety_score_cat, child_safety_score, toxicity_notes,
        difficulty_score, indoor_outdoor_class, light_lux_min, light_lux_max,
        water_freq_days, temp_min_c, temp_max_c, humidity_min_pct,
        humidity_max_pct, flower_meaning, derived_at
      )
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      on conflict(plant_id) do update set
        climate_score_by_region = excluded.climate_score_by_region,
        pet_safety_score_dog = excluded.pet_safety_score_dog,
        pet_safety_score_cat = excluded.pet_safety_score_cat,
        child_safety_score = excluded.child_safety_score,
        toxicity_notes = excluded.toxicity_notes,
        difficulty_score = excluded.difficulty_score,
        indoor_outdoor_class = excluded.indoor_outdoor_class,
        light_lux_min = excluded.light_lux_min,
        light_lux_max = excluded.light_lux_max,
        water_freq_days = excluded.water_freq_days,
        temp_min_c = excluded.temp_min_c,
        temp_max_c = excluded.temp_max_c,
        humidity_min_pct = excluded.humidity_min_pct,
        humidity_max_pct = excluded.humidity_max_pct,
        flower_meaning = excluded.flower_meaning,
        derived_at = excluded.derived_at
    `,
    args: [
      plantId,
      JSON.stringify(plant.climateScoreByRegion),
      plant.petSafetyScoreDog,
      plant.petSafetyScoreCat,
      plant.childSafetyScore,
      plant.toxicityNotes,
      plant.difficultyScore,
      plant.indoorOutdoorClass,
      plant.lightLuxMin,
      plant.lightLuxMax,
      plant.waterFreqDays,
      plant.tempMinC,
      plant.tempMaxC,
      plant.humidityMinPct,
      plant.humidityMaxPct,
      JSON.stringify(plant.flowerMeaning),
      now
    ]
  });

  const category = taxonomy[plant.slug];

  await db.execute({
    sql: `
      insert into plant_taxonomy_path (plant_id, path_slash, depth, category)
      values (?, ?, ?, ?)
      on conflict(plant_id) do update set
        path_slash = excluded.path_slash,
        depth = excluded.depth,
        category = excluded.category
    `,
    args: [plantId, `plants/${category}/${plant.slug}`, 3, category]
  });
}

for (const category of categories) {
  const count = await db.execute({
    sql: "select count(*) as count from plant_taxonomy_path where category = ?",
    args: [category.slug]
  });

  await db.execute({
    sql: "update dictionary_categories set plant_count = ? where slug = ?",
    args: [Number(count.rows[0]?.count ?? 0), category.slug]
  });
}

console.info(
  `Seeded ${regions.length} regions, ${categories.length} categories and ${plants.length} plants.`
);
