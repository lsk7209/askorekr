import type {
  NormalizedPlant,
  NormalizedPlantBatch,
  RawPlantRecord,
  RejectedRecord
} from "./types";

const KFRI_SOURCE_LABEL = "국립수목원 국가표준식물목록";
const REQUIRED_FIELD_REASON = "학명 또는 국명이 비어 있음";
const SLUG_FALLBACK_PREFIX = "plant";
const EMPTY_VALUES = new Set(["", "-", "null", "undefined"]);

const SCIENTIFIC_NAME_KEYS = [
  "scientificName",
  "scientific_name",
  "plantScnm",
  "plant_scientific_name",
  "학명"
];

const KOREAN_NAME_KEYS = [
  "koreanName",
  "korean_name",
  "plantGnrlNm",
  "plant_korean_name",
  "국명",
  "식물명"
];

const FAMILY_KEYS = ["family", "familyNm", "family_name", "과명"];
const GENUS_KEYS = ["genus", "genusNm", "genus_name", "속명"];
const SYNONYM_KEYS = ["synonyms", "synonym", "synm", "이명"];
const ID_KEYS = ["plantScnmId", "scientificNameId", "id", "종ID", "학명ID"];

function readText(record: RawPlantRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value !== "string" && typeof value !== "number") {
      continue;
    }

    const text = String(value).trim();

    if (!EMPTY_VALUES.has(text.toLowerCase())) {
      return text;
    }
  }

  return null;
}

function parseSynonyms(record: RawPlantRecord) {
  const value = readText(record, SYNONYM_KEYS);

  if (!value) {
    return [];
  }

  return value
    .split(/[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function createSlug(scientificName: string, koreanName: string) {
  const romanSlug = scientificName
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (romanSlug) {
    return romanSlug;
  }

  const koreanHash = [...koreanName].reduce((sum, char) => {
    return sum + char.codePointAt(0)!;
  }, 0);

  return `${SLUG_FALLBACK_PREFIX}-${koreanHash}`;
}

function createSourceRef(record: RawPlantRecord) {
  const sourceId = readText(record, ID_KEYS);

  if (!sourceId) {
    return KFRI_SOURCE_LABEL;
  }

  return `${KFRI_SOURCE_LABEL}:${sourceId}`;
}

export function normalizeKfriPlant(
  record: RawPlantRecord
): NormalizedPlant | null {
  const scientificName = readText(record, SCIENTIFIC_NAME_KEYS);
  const koreanName = readText(record, KOREAN_NAME_KEYS);

  if (!scientificName || !koreanName) {
    return null;
  }

  return {
    scientificName,
    koreanName,
    slug: createSlug(scientificName, koreanName),
    family: readText(record, FAMILY_KEYS),
    genus: readText(record, GENUS_KEYS),
    synonyms: parseSynonyms(record),
    origin: "국립수목원 국가표준식물목록",
    sourceRefs: {
      국립수목원: createSourceRef(record)
    }
  };
}

export function normalizeKfriPlants(
  records: RawPlantRecord[]
): NormalizedPlantBatch {
  const accepted: NormalizedPlant[] = [];
  const rejected: RejectedRecord[] = [];

  for (const record of records) {
    const plant = normalizeKfriPlant(record);

    if (plant) {
      accepted.push(plant);
      continue;
    }

    rejected.push({
      source: "kfri",
      reason: REQUIRED_FIELD_REASON,
      record
    });
  }

  return { accepted, rejected };
}
