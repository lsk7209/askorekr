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
