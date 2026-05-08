import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN
});

const stage = "etl:nibr:layer1";
const now = Date.now();

const fixtures = [
  {
    speciesId: "NIBR0001",
    sciNm: "Acer palmatum",
    korNm: "단풍나무",
    familyNm: "Sapindaceae",
    genusNm: "Acer",
    habitatInfo: "산지 숲 가장자리와 계곡 주변"
  },
  {
    speciesId: "NIBR0002",
    sciNm: "Rhododendron mucronulatum",
    korNm: "진달래",
    familyNm: "Ericaceae",
    genusNm: "Rhododendron",
    habitatInfo: "양지바른 산지와 능선"
  },
  {
    speciesId: "NIBR0003",
    sciNm: "Missing Korean Name"
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

  return `nibr-plant-${koreanHash}`;
}

function normalize(record) {
  const scientificName = readText(record, ["sciNm", "scientificName"]);
  const koreanName = readText(record, ["korNm", "koreanName"]);

  if (!scientificName || !koreanName) {
    return null;
  }

  const sourceId = readText(record, ["speciesId", "taxonId", "id"]);
  const sourceRef = sourceId
    ? `국립생물자원관 생물종지식정보:${sourceId}`
    : "국립생물자원관 생물종지식정보";

  return {
    scientificName,
    koreanName,
    slug: createSlug(scientificName, koreanName),
    family: readText(record, ["familyNm", "family"]),
    genus: readText(record, ["genusNm", "genus"]),
    synonyms: [],
    origin:
      readText(record, ["habitatInfo", "habitat", "distribution"]) ??
      "국립생물자원관 생물종지식정보",
    sourceRefs: { 국립생물자원관: sourceRef }
  };
}

function normalizeBatch(records) {
  const accepted = [];
  const rejected = [];

  for (const record of records) {
    const plant = normalize(record);

    if (plant) {
      accepted.push(plant);
      continue;
    }

    rejected.push({
      source: "nibr",
      reason: "학명 또는 국명이 비어 있음",
      record
    });
  }

  return { accepted, rejected };
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
      JSON.stringify({ source: "nibr", rejected })
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
      plant.origin,
      JSON.stringify(sourceRefs),
      now,
      now
    ]
  });
}

const { accepted, rejected } = normalizeBatch(fixtures);
const runId = await createPipelineRun(fixtures.length, rejected);

for (const plant of accepted) {
  await upsertPlant(plant);
}

await finishPipelineRun(runId, accepted.length, rejected.length);

console.info(
  `NIBR sample ETL run ${runId}: input=${fixtures.length}, ` +
    `accepted=${accepted.length}, rejected=${rejected.length}`
);
