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

/**
 * 광량 코드에서 빛 요구량 범위를 도출한다.
 *
 * 원본 API의 lighttdemanddoCode는 복수 코드가 구분자로 이어질 수 있다(예: "055001|055002").
 * 이전 구현은 code.includes()로 첫 매칭 코드의 범위만 반환해 나머지 허용 범위가 사라졌다.
 * 이번 수정은 문자열에 포함된 모든 알려진 코드를 찾아 각 범위의 최소~최대를 합친다.
 */
function mapLight(code: string | null) {
  if (!code) {
    return { min: null, max: null };
  }

  const knownRanges: Record<string, { min: number; max: number }> = {
    "055001": { min: 300, max: 800 },
    "055002": { min: 800, max: 1500 },
    "055003": { min: 1500, max: 10000 }
  };

  const matchedRanges = Object.entries(knownRanges)
    .filter(([knownCode]) => code.includes(knownCode))
    .map(([, range]) => range);

  if (matchedRanges.length === 0) {
    return { min: null, max: null };
  }

  return {
    min: Math.min(...matchedRanges.map((r) => r.min)),
    max: Math.max(...matchedRanges.map((r) => r.max))
  };
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

/**
 * 계절별 물주기 코드에서 대표 물주기 일수를 도출한다.
 *
 * 이전 구현은 4계절 코드를 숫자로 바꾼 뒤 평균을 냈다. 예를 들어 봄 1일·겨울 14일이면
 * 평균 약 5~8일이 되는데, 이는 어느 계절의 실제 관리 조건과도 맞지 않는 값이다.
 * (스키마상 water_freq_days는 단일 숫자 컬럼이라 계절별 값을 그대로 보존하려면
 * plant_metrics에 계절별 컬럼을 추가하는 마이그레이션이 필요하다. 이는 별도 승인이
 * 필요한 스키마 변경이라 이번 범위에서는 다루지 않는다.)
 *
 * 대신 최소값(가장 잦은 물주기 요구)을 대표값으로 채택한다. 물을 너무 자주 줘서
 * 생기는 과습보다, 필요한 시점에 못 주는 건조 스트레스를 피하는 쪽이 더 안전한
 * 기본값이라고 판단했다.
 */
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

  return Math.min(...days);
}

/**
 * 독성 설명 원문에서 안전성 점수를 도출한다.
 *
 * 이전 구현은 `toxicity.includes("없")`만으로 강아지/고양이/어린이를 모두 85점(안전)으로
 * 처리했다. 이 조건은 "독성 정보 없음"(=아직 확인되지 않음, unknown)과
 * "독성이 없음"(=비독성 확인, safe)을 구분하지 못하고, "안전하다고 볼 수 없음"처럼
 * '없'이 들어간 부정 표현까지 안전으로 잘못 변환했다.
 *
 * 이번 수정은 다음을 명확히 구분한다.
 * - 독성이 확인된 것으로 보이는 명시적 표현 → 낮은 점수(독성 확인)
 * - 정보 자체가 없다는 표현("정보 없음", "확인되지 않음") → null(근거 불충분, unknown)
 * - 그 외 애매한 문장은 안전하다고 단정하지 않고 null(unknown) 반환
 *
 * null은 기존에도 추천 안전 필터(임계값 80점)를 통과하지 못하므로 보수적 동작이 유지된다.
 */
function mapSafety(toxicity: string | null) {
  const unknown = {
    petSafetyScoreDog: null,
    petSafetyScoreCat: null,
    childSafetyScore: null
  };

  if (!toxicity) {
    return unknown;
  }

  const normalized = toxicity.trim();

  // "정보 없음", "확인되지 않음" 류 — 독성 여부 자체를 모르는 경우. 안전으로 오인하지 않는다.
  const isInfoMissing =
    /(정보|자료|기록)\s*(가|이)?\s*없/.test(normalized) ||
    /확인(되지|이)\s*(않|안)/.test(normalized) ||
    /(불명|미확인|미상)/.test(normalized);

  // "~없다고 볼 수 없다", "~않다고 할 수 없다" 류 이중 부정 — 안전을 부정하는 문장.
  const isDoubleNegative = /(없다고|않다고)\s*(볼|할)\s*수\s*없/.test(normalized);

  if (isDoubleNegative) {
    return {
      petSafetyScoreDog: 45,
      petSafetyScoreCat: 45,
      childSafetyScore: 55
    };
  }

  if (isInfoMissing) {
    return unknown;
  }

  // "독성이 없음", "무독성" 류 명시적 비독성 표현만 안전 근거로 인정한다.
  const isExplicitNonToxic = /(독성|유독성)\s*(이|가)?\s*없|무독성|비독성/.test(normalized);

  if (isExplicitNonToxic) {
    return {
      petSafetyScoreDog: 85,
      petSafetyScoreCat: 85,
      childSafetyScore: 85
    };
  }

  // 명시적 독성 표현("독성이 있음", "유독", "해로울 수 있음" 등)이나 그 외 애매한 문장은
  // 안전하다고 단정하지 않는다. 기존 동작(비독성 미확정 시 낮은 점수)을 보존한다.
  return {
    petSafetyScoreDog: 45,
    petSafetyScoreCat: 45,
    childSafetyScore: 55
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
      // 원산지 결측 시 출처 레이블(SOURCE_LABEL)을 원산지처럼 저장하지 않는다.
      // "농사로 실내정원용 식물"은 자료 출처일 뿐 원산지 정보가 아니므로, 결측이면
      // null(원산지 미확인)로 남겨 출처와 원산지 의미가 섞이지 않게 한다.
      origin: readText(detail.orgplceInfo),
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
