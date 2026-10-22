export type PlantNameSlugRow = {
  koreanName: string;
  slug: string;
};

export type PlantNameMap = Record<string, string>; // koreanName → slug

/**
 * DISCOVERY-01: 식물 국명 → 슬러그 자동 링크 맵 생성.
 * - 동일한 koreanName(공백 정규화 기준)을 가진 동음이의어가 2개 이상 존재할 경우,
 *   블로그 본문에서 문맥 없이 임의의 한 종으로 잘못 링크되는 것을 막기 위해 자동 링크 대상에서 제외한다.
 * - 유일한 국명만 결정적(deterministic)으로 매핑한다.
 */
export function buildUniquePlantNameSlugMap(
  rows: readonly PlantNameSlugRow[]
): PlantNameMap {
  const counts = new Map<string, number>();
  const firstSlug = new Map<string, string>();

  for (const row of rows) {
    const name = row.koreanName?.trim();
    const slug = row.slug?.trim();
    if (!name || !slug) continue;

    counts.set(name, (counts.get(name) ?? 0) + 1);
    if (!firstSlug.has(name)) {
      firstSlug.set(name, slug);
    }
  }

  const map: PlantNameMap = {};
  for (const [name, count] of counts.entries()) {
    if (count === 1) {
      const slug = firstSlug.get(name);
      if (slug) {
        map[name] = slug;
      }
    }
  }

  return map;
}

/**
 * ADSENSE-01: 국명이 일상 단어와 겹쳐 본문 오링크를 만드는 이름.
 * (예: "여러 가지"→가지, "광합성 타임"→타임, "고비를 넘기다"→고비, "근대 이후"→근대)
 * 1글자 국명(조·감 등)은 길이 조건으로 별도 제외한다.
 */
export const AUTO_LINK_EXCLUDED_NAMES: ReadonlySet<string> = new Set([
  "가지",
  "고비",
  "근대",
  "기장",
  "부들",
  "사철",
  "수수",
  "자란",
  "타임"
]);

const MIN_AUTO_LINK_NAME_LENGTH = 2;
const DEFAULT_MAX_AUTO_LINKS = 8;
const HANGUL_CHAR = /[ㄱ-ㆎ가-힣]/;
// 국명 바로 뒤에 붙어도 같은 단어로 볼 수 있는 조사 (긴 것 우선)
const TRAILING_PARTICLES = [
  "으로", "에서", "에게", "처럼", "보다", "까지", "부터", "이랑", "하고", "이나",
  "은", "는", "이", "가", "을", "를", "과", "와", "의", "도", "만", "에", "로", "랑", "나"
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isStandaloneWord(text: string, start: number, length: number): boolean {
  const before = text[start - 1];
  if (before && HANGUL_CHAR.test(before)) return false;

  const rest = text.slice(start + length);
  if (!rest || !HANGUL_CHAR.test(rest[0])) return true;
  return TRAILING_PARTICLES.some((particle) => rest.startsWith(particle));
}

export function isAutoLinkableName(name: string): boolean {
  return name.length >= MIN_AUTO_LINK_NAME_LENGTH && !AUTO_LINK_EXCLUDED_NAMES.has(name);
}

/**
 * ADSENSE-01: 블로그 본문 HTML 조각에서 식물 국명을 상세 페이지로 링크한다.
 * - 한글 단어 중간 매칭 금지("조금"→조, "자란다"→자란 같은 오링크 방지)
 * - 식물별 첫 1회만, 글 전체 최대 maxLinks개 (반환된 함수 하나를 글 하나에만 사용)
 * - 기존 <a> 내부 텍스트와 태그 속성은 건드리지 않는다.
 */
export function createPlantNameLinker(
  nameMap: PlantNameMap,
  maxLinks: number = DEFAULT_MAX_AUTO_LINKS
): (html: string) => string {
  const names = Object.keys(nameMap)
    .filter(isAutoLinkableName)
    .sort((a, b) => b.length - a.length);
  if (names.length === 0) return (html) => html;

  const pattern = new RegExp(names.map(escapeRegExp).join("|"), "g");
  const linked = new Set<string>();

  return (html) => {
    let insideAnchor = false;
    return html
      .split(/(<[^>]+>)/)
      .map((part) => {
        if (part.startsWith("<")) {
          if (/^<a[\s>]/i.test(part)) insideAnchor = true;
          else if (/^<\/a>/i.test(part)) insideAnchor = false;
          return part;
        }
        if (insideAnchor) return part;

        return part.replace(pattern, (match: string, offset: number) => {
          if (linked.has(match) || linked.size >= maxLinks) return match;
          if (!isStandaloneWord(part, offset, match.length)) return match;
          linked.add(match);
          return `<a href="/plant/${nameMap[match]}">${match}</a>`;
        });
      })
      .join("");
  };
}
