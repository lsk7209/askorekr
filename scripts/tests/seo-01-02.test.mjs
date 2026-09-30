import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readSource(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

// SEO-02: robots.ts가 /api/og를 명시적으로 허용해야 함 (OG 이미지 공개 접근)
{
  const source = readSource("../../src/app/robots.ts");
  assert.ok(
    source.includes('"/api/og"'),
    "robots.ts는 /api/og를 명시적으로 allow해야 함 (소셜 크롤러의 OG 이미지 접근)"
  );
  assert.ok(
    source.includes('"/api/"'),
    "다른 내부 API(/api/)는 여전히 disallow로 보호되어야 함"
  );
}

// SEO-02: layout.tsx OG description에 내부 개발 용어(pSEO)가 노출되지 않아야 함
{
  const source = readSource("../../src/app/layout.tsx");
  assert.equal(
    source.includes("pSEO"),
    false,
    "OG description에 내부 개발 용어(pSEO)가 남아있으면 안 됨"
  );
}

// SEO-02: 홈페이지에 동작하지 않는 SearchAction이 없어야 함 (/tools/diagnose는 텍스트 검색을 지원하지 않음)
{
  const source = readSource("../../src/app/page.tsx");
  const codeLines = source
    .split("\n")
    .filter((line) => !line.trim().startsWith("*") && !line.trim().startsWith("//"));
  const codeOnly = codeLines.join("\n");
  assert.equal(
    codeOnly.includes('"@type": "SearchAction"'),
    false,
    "실제 텍스트 검색 기능이 없는데 SearchAction 구조화 데이터를 노출하면 안 됨"
  );
}

// SEO-01: sitemap.ts가 실제 변경일 데이터가 없는 정적/카테고리 페이지에 lastModified: now를 넣지 않아야 함
{
  const source = readSource("../../src/app/sitemap.ts");
  const codeLines = source
    .split("\n")
    .filter((line) => !line.trim().startsWith("*") && !line.trim().startsWith("//"));
  const codeOnly = codeLines.join("\n");
  assert.equal(
    codeOnly.includes("lastModified: now"),
    false,
    "실제 변경일을 모르는 페이지에 요청 시각(now)을 lastModified로 넣으면 안 됨"
  );
  // plant/blog는 safeLastModified로 실제 updatedAt/publishedAt 기반이어야 함 (그대로 유지)
  assert.ok(
    codeOnly.includes("safeLastModified(plant.updatedAt"),
    "plant 페이지는 실제 updatedAt 기반 lastModified를 유지해야 함"
  );
}

// SEO-01: sitemap.ts의 DB 조회 실패가 조용히 삼켜지지 않고 로그를 남겨야 함
{
  const source = readSource("../../src/app/sitemap.ts");
  assert.ok(
    source.includes("console.error"),
    "사이트맵 하위 쿼리 실패 시 로그를 남겨야 함 (조용히 빈 배열로 숨기지 않음)"
  );
}

console.log("SEO_01_02_OK");
