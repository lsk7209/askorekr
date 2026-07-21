import { XMLParser } from "fast-xml-parser";
import type { NormalizedPlant, RawPlantRecord } from "./types";

const DEFAULT_BASE_URL = "http://api.nongsaro.go.kr/service/garden";
const SOURCE_LABEL = "농사로 실내정원용 식물";
const EMPTY_VALUES = new Set(["", "-", "null", "undefined"]);

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
  parseTagValue: false,
});

export type GardenListItem = {
  cntntsNo?: string | number;
  cntntsSj?: string;
  rtnFileUrl?: string;
  rtnThumbFileUrl?: string;
  rtnStreFileNm?: string;
  rtnFileCours?: string;
};

export type GardenDetailItem = {
  cntntsNo?: string | number;
  plntbneNm?: string;
  plntzrNm?: string;
  distbNm?: string;
  fmlNm?: string;
  orgplceInfo?: string;
  toxctyInfo?: string;
  managelevelCode?: string;
  managelevelCodeNm?: string;
  grwhTpCode?: string;
  grwhTpCodeNm?: string;
  winterLwetTpCode?: string;
  winterLwetTpCodeNm?: string;
  hdCode?: string;
  hdCodeNm?: string;
  watercycleSprngCode?: string;
  watercycleSummerCode?: string;
  watercycleAutumnCode?: string;
  watercycleWinterCode?: string;
  lighttdemanddoCode?: string;
  lighttdemanddoCodeNm?: string;
  dlthtsManageInfo?: string;
  speclmanageInfo?: string;
};

export type GardenMetricPatch = {
  difficultyScore: number | null;
  indoorOutdoorClass: "indoor";
  lightLuxMin: number | null;
  lightLuxMax: number | null;
  waterFreqDays: number | null;
  tempMinC: number | null;
  tempMaxC: number | null;
  humidityMinPct: number | null;
  humidityMaxPct: number | null;
  petSafetyScoreDog: number | null;
  petSafetyScoreCat: number | null;
  childSafetyScore: number | null;
  toxicityNotes: string | null;
};

export type NormalizedGardenPlant = {
  plant: NormalizedPlant;
  metrics: GardenMetricPatch;
  imageUrl: string | null;
};

function readText(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const text = String(value).trim();
  return EMPTY_VALUES.has(text.toLowerCase()) ? null : text;
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function getBody(parsed: RawPlantRecord) {
  return (parsed.response as RawPlantRecord | undefined)?.body as
    | RawPlantRecord
    | undefined;
}

function getHeader(parsed: RawPlantRecord) {
  return (parsed.response as RawPlantRecord | undefined)?.header as
    | RawPlantRecord
    | undefined;
}

function getItems(body: RawPlantRecord | undefined) {
  const items = body?.items as RawPlantRecord | undefined;
  return asArray(items?.item as GardenListItem | GardenListItem[] | undefined);
}

function getTotalCount(body: RawPlantRecord | undefined) {
  const items = body?.items as RawPlantRecord | undefined;
  return Number(readText(items?.totalCount ?? body?.totalCount) ?? 0);
}

function getItem(body: RawPlantRecord | undefined) {
  return body?.item as GardenDetailItem | undefined;
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

  return `nongsaro-garden-${koreanHash}`;
}

function mapLight(code: string | null) {
  if (!code) {
    return { min: null, max: null };
  }

  if (code.includes("055001")) {
    return { min: 300, max: 800 };
  }

  if (code.includes("055002")) {
    return { min: 800, max: 1500 };
  }

  if (code.includes("055003")) {
    return { min: 1500, max: 10000 };
  }

  return { min: null, max: null };
}

function mapDifficulty(manageLevel: string | null) {
  if (!manageLevel) {
    return null;
  }

  if (manageLevel === "089001") {
    return 20;
  }

  if (manageLevel === "089002") {
    return 50;
  }

  if (manageLevel === "089003") {
    return 80;
  }

  return null;
}

function mapTemperature(code: string | null) {
  if (code === "082001") {
    return { min: 10, max: 15 };
  }

  if (code === "082002") {
    return { min: 16, max: 20 };
  }

  if (code === "082003") {
    return { min: 21, max: 25 };
  }

  if (code === "082004") {
    return { min: 26, max: 30 };
  }

  return { min: null, max: null };
}

function mapHumidity(code: string | null) {
  if (code === "083001") {
    return { min: 0, max: 40 };
  }

  if (code === "083002") {
    return { min: 40, max: 70 };
  }

  if (code === "083003") {
    return { min: 70, max: 100 };
  }

  return { min: null, max: null };
}

function mapWaterDays(codes: (string | null)[]) {
  const days = codes
    .map((code): number | null => {
      if (code === "053001") {
        return 1;
      }

      if (code === "053002") {
        return 3;
      }

      if (code === "053003") {
        return 7;
      }

      if (code === "053004") {
        return 14;
      }

      return null;
    })
    .filter((value): value is number => value !== null);

  if (days.length === 0) {
    return null;
  }

  return Math.round(days.reduce((sum, value) => sum + value, 0) / days.length);
}

function mapSafety(toxicity: string | null) {
  if (!toxicity) {
    return {
      petSafetyScoreDog: null,
      petSafetyScoreCat: null,
      childSafetyScore: null,
    };
  }

  if (toxicity.includes("없")) {
    return {
      petSafetyScoreDog: 85,
      petSafetyScoreCat: 85,
      childSafetyScore: 85,
    };
  }

  return {
    petSafetyScoreDog: 45,
    petSafetyScoreCat: 45,
    childSafetyScore: 55,
  };
}

export function parseNongsaroXml(xml: string) {
  return xmlParser.parse(xml) as RawPlantRecord;
}

export function assertNongsaroSuccess(parsed: RawPlantRecord) {
  const header = getHeader(parsed);
  const resultCode = readText(header?.resultCode);
  const resultMsg = readText(header?.resultMsg);

  if (resultCode && resultCode !== "00") {
    throw new Error(`Nongsaro API error ${resultCode}: ${resultMsg ?? ""}`);
  }
}

export function buildNongsaroGardenUrl(
  operation: string,
  apiKey: string,
  params: Record<string, string | number | undefined> = {},
  baseUrl = DEFAULT_BASE_URL,
) {
  const url = new URL(`${baseUrl}/${operation}`);
  url.searchParams.set("apiKey", apiKey);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

export async function fetchNongsaroXml(url: URL, retries = 3) {
  let lastError: unknown;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Nongsaro HTTP error ${response.status}`);
      }

      const xml = await response.text();
      const parsed = parseNongsaroXml(xml);
      assertNongsaroSuccess(parsed);
      return parsed;
    } catch (error) {
      lastError = error;
      if (attempt < retries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, 2 ** attempt * 1000),
        );
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function fetchGardenList(
  apiKey: string,
  params: Record<string, string | number | undefined> = {},
  baseUrl = DEFAULT_BASE_URL,
) {
  const parsed = await fetchNongsaroXml(
    buildNongsaroGardenUrl("gardenList", apiKey, params, baseUrl),
  );
  const body = getBody(parsed);

  return {
    items: getItems(body),
    totalCount: getTotalCount(body),
  };
}

export async function fetchGardenDetail(
  apiKey: string,
  cntntsNo: string | number,
  baseUrl = DEFAULT_BASE_URL,
) {
  const parsed = await fetchNongsaroXml(
    buildNongsaroGardenUrl("gardenDtl", apiKey, { cntntsNo }, baseUrl),
  );
  return getItem(getBody(parsed));
}

function getImageUrl(listItem?: GardenListItem) {
  const fileUrl = readText(listItem?.rtnFileUrl);

  if (fileUrl) {
    return fileUrl;
  }

  const fileName = readText(listItem?.rtnStreFileNm)?.split("|")[0];
  const filePath = readText(listItem?.rtnFileCours)?.split("|")[0];

  if (!fileName || !filePath) {
    return null;
  }

  return `http://www.nongsaro.go.kr/${filePath}/${fileName}`;
}

export function normalizeNongsaroGardenPlant(
  detail: GardenDetailItem,
  listItem?: GardenListItem,
): NormalizedGardenPlant | null {
  const cntntsNo = readText(detail.cntntsNo ?? listItem?.cntntsNo);
  const scientificName = readText(detail.plntbneNm);
  const koreanName = readText(listItem?.cntntsSj) ?? readText(detail.distbNm);

  if (!cntntsNo || !scientificName || !koreanName) {
    return null;
  }

  const light = mapLight(readText(detail.lighttdemanddoCode));
  const temp = mapTemperature(readText(detail.grwhTpCode));
  const humidity = mapHumidity(readText(detail.hdCode));
  const toxicityNotes = readText(detail.toxctyInfo);
  const safety = mapSafety(toxicityNotes);

  return {
    plant: {
      scientificName,
      koreanName,
      slug: createSlug(scientificName, koreanName),
      family: readText(detail.fmlNm),
      genus: null,
      synonyms: readText(detail.distbNm) ? [readText(detail.distbNm)!] : [],
      origin: readText(detail.orgplceInfo) ?? SOURCE_LABEL,
      sourceRefs: {
        농사로: `${SOURCE_LABEL}:${cntntsNo}`,
      },
    },
    metrics: {
      difficultyScore: mapDifficulty(readText(detail.managelevelCode)),
      indoorOutdoorClass: "indoor",
      lightLuxMin: light.min,
      lightLuxMax: light.max,
      waterFreqDays: mapWaterDays([
        readText(detail.watercycleSprngCode),
        readText(detail.watercycleSummerCode),
        readText(detail.watercycleAutumnCode),
        readText(detail.watercycleWinterCode),
      ]),
      tempMinC: temp.min,
      tempMaxC: temp.max,
      humidityMinPct: humidity.min,
      humidityMaxPct: humidity.max,
      toxicityNotes,
      ...safety,
    },
    imageUrl: getImageUrl(listItem),
  };
}
