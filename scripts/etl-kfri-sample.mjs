import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN
});

const now = Date.now();
const stage = "etl:kfri:layer1";

const fixtures = [
  {
    plantScnmId: "P000001",
    plantScnm: "Acer palmatum",
    plantGnrlNm: "단풍나무",
    familyNm: "Sapindaceae",
    genusNm: "Acer",
    synm: "Acer palmatum var. palmatum"
  },
  {
    plantScnmId: "P000002",
    plantScnm: "Camellia japonica",
    plantGnrlNm: "동백나무",
    familyNm: "Theaceae",
    genusNm: "Camellia",
    synm: ""
  },
  {
    plantScnmId: "P000003",
    plantScnm: "",
    plantGnrlNm: "학명누락샘플"
  }
];

const emptyValues = new Set(["", "-", "null", "undefined"]);

function readText(record, keys) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value !== "string" && typeof value !== "number") {
      continue;
    }

    const text = String(value).trim();

    if (!emptyValues.has(text.toLowerCase())) {
      return text;
    }
  }

  return null;
}

function createSlug(scientificName, koreanName) {
  const romanSlug = scientificName
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (romanSlug) {
    return romanSlug;
  }

  const koreanHash = [...koreanName].reduce((sum, char) => {
    return sum + char.codePointAt(0);
  }, 0);

  return `plant-${koreanHash}`;
}

function normalize(record) {
  const scientificName = readText(record, ["plantScnm", "scientificName"]);
  const koreanName = readText(record, ["plantGnrlNm", "koreanName"]);

  if (!scientificName || !koreanName) {
    return null;
  }

  const sourceId = readText(record, ["plantScnmId", "id"]);
  const sourceRef = sourceId
    ? `국립수목원 국가표준식물목록:${sourceId}`
    : "국립수목원 국가표준식물목록";

  return {
    scientificName,
    koreanName,
    slug: createSlug(scientificName, koreanName),
    family: readText(record, ["familyNm", "family"]),
    genus: readText(record, ["genusNm", "genus"]),
    synonyms: (readText(record, ["synm", "synonyms"]) ?? "")
      .split(/[,;|]/)
      .map((item) => item.trim())
      .filter(Boolean),
    sourceRefs: { 국립수목원: sourceRef }
  };
}

async function createPipelineRun(inputCount, rejected) {
  const result = await db.execute({
    sql: `
      insert into pipeline_runs (
        stage, started_at, status, input_count, output_count, rejected_count,
        meta
      )
      values (?, ?, ?, ?, 0, 0, ?)
      returning id
    `,
    args: [
      stage,
      now,
      "running",
      inputCount,
      JSON.stringify({ source: "kfri", rejected })
    ]
  });

  return Number(result.rows[0].id);
}

async function finishPipelineRun(id, outputCount, rejectedCount) {
  await db.execute({
    sql: `
      update pipeline_runs
      set finished_at = ?, status = ?, output_count = ?, rejected_count = ?
      where id = ?
    `,
    args: [Date.now(), "success", outputCount, rejectedCount, id]
  });
}

async function upsertPlant(plant) {
  const existing = await db.execute({
    sql: "select source_refs from plants where slug = ? limit 1",
    args: [plant.slug]
  });
  const sourceRefs = {
    ...JSON.parse(existing.rows[0]?.source_refs ?? "{}"),
    ...plant.sourceRefs
  };

  await db.execute({
    sql: `
      insert into plants (
        scientific_name, korean_name, slug, family, genus, synonyms, origin,
        source_refs, created_at, updated_at
      )
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      on conflict(slug) do update set
        scientific_name = excluded.scientific_name,
        korean_name = excluded.korean_name,
        family = excluded.family,
        genus = excluded.genus,
        synonyms = excluded.synonyms,
        origin = excluded.origin,
        source_refs = excluded.source_refs,
        updated_at = excluded.updated_at
    `,
    args: [
      plant.scientificName,
      plant.koreanName,
      plant.slug,
      plant.family,
      plant.genus,
      JSON.stringify(plant.synonyms),
      "국립수목원 국가표준식물목록",
      JSON.stringify(sourceRefs),
      now,
      now
    ]
  });
}

const accepted = [];
const rejected = [];

for (const fixture of fixtures) {
  const plant = normalize(fixture);

  if (plant) {
    accepted.push(plant);
  } else {
    rejected.push({
      source: "kfri",
      reason: "학명 또는 국명이 비어 있음",
      record: fixture
    });
  }
}

const runId = await createPipelineRun(fixtures.length, rejected);

for (const plant of accepted) {
  await upsertPlant(plant);
}

await finishPipelineRun(runId, accepted.length, rejected.length);

console.info(
  `KFRI sample ETL run ${runId}: input=${fixtures.length}, ` +
    `accepted=${accepted.length}, rejected=${rejected.length}`
);
