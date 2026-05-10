import { XMLParser } from "fast-xml-parser";

const DEFAULT_BASE_URL = process.env.QA_SITE_URL ?? "https://www.askore.kr";
const USER_AGENT = "askorekr-site-qa/1.0";
const REQUIRED_JSON_LD_PATHS = [/^\/$/, /^\/plant\//, /^\/category\//];

const parser = new XMLParser({
  ignoreAttributes: false
});

function normalizeBaseUrl(value) {
  return value.replace(/\/$/, "");
}

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function getPath(url) {
  return new URL(url).pathname;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "user-agent": USER_AGENT }
  });
  const text = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    contentType: response.headers.get("content-type") ?? "",
    text
  };
}

function extractSitemapUrls(xml) {
  const data = parser.parse(xml);
  const urls = toArray(data.urlset?.url)
    .map((item) => item.loc)
    .filter(Boolean);

  return urls;
}

function countMatches(html, pattern) {
  return [...html.matchAll(pattern)].length;
}

function hasCanonical(html) {
  return /<link[^>]+rel=["']canonical["'][^>]+href=["'][^"']+["']/i.test(html);
}

function hasTitle(html) {
  return /<title>[^<]{5,}<\/title>/i.test(html);
}

function shouldRequireJsonLd(url) {
  const path = getPath(url);
  return REQUIRED_JSON_LD_PATHS.some((pattern) => pattern.test(path));
}

function checkPage(url, result) {
  const errors = [];
  const warnings = [];
  const h1Count = countMatches(result.text, /<h1\b/gi);
  const jsonLdCount = countMatches(result.text, /application\/ld\+json/gi);

  if (!result.ok) errors.push(`HTTP ${result.status}`);
  if (!result.contentType.includes("text/html")) {
    errors.push(`HTML 응답 아님: ${result.contentType}`);
  }
  if (!hasTitle(result.text)) errors.push("title 누락");
  if (h1Count !== 1) errors.push(`h1 ${h1Count}개`);
  if (!hasCanonical(result.text)) errors.push("canonical 누락");
  if (!result.text.includes("pagead2.googlesyndication.com")) {
    errors.push("AdSense 스크립트 누락");
  }
  if (shouldRequireJsonLd(url) && jsonLdCount === 0) {
    warnings.push("JSON-LD 없음");
  }

  return { url, errors, warnings };
}

async function checkStaticEndpoint(url, expectedType) {
  const result = await fetchText(url);
  const errors = [];

  if (!result.ok) errors.push(`HTTP ${result.status}`);
  if (expectedType && !result.contentType.includes(expectedType)) {
    errors.push(`content-type 확인 필요: ${result.contentType}`);
  }

  return { url, errors, warnings: [] };
}

function printSection(title, items) {
  if (items.length === 0) return;

  console.info(`\n${title}`);
  for (const item of items) {
    console.info(`- ${item}`);
  }
}

function summarize(checks) {
  const failed = checks.filter((check) => check.errors.length > 0);
  const warned = checks.filter((check) => check.warnings.length > 0);

  printSection(
    "실패",
    failed.map((check) => `${check.url}: ${check.errors.join(", ")}`)
  );
  printSection(
    "주의",
    warned.map((check) => `${check.url}: ${check.warnings.join(", ")}`)
  );

  console.info(`\nQA checked=${checks.length} failed=${failed.length} warned=${warned.length}`);

  if (failed.length > 0) {
    process.exit(1);
  }
}

async function main() {
  const baseUrl = normalizeBaseUrl(process.argv[2] ?? DEFAULT_BASE_URL);
  const sitemapUrl = `${baseUrl}/sitemap.xml`;
  const sitemap = await fetchText(sitemapUrl);

  if (!sitemap.ok) {
    throw new Error(`사이트맵 요청 실패: HTTP ${sitemap.status}`);
  }

  const urls = extractSitemapUrls(sitemap.text).map((url) =>
    url.replace(/^https:\/\/askore\.kr/, "https://www.askore.kr")
  );
  const pageChecks = [];

  for (const url of urls) {
    const result = await fetchText(url);
    pageChecks.push(checkPage(url, result));
  }

  const staticChecks = await Promise.all([
    checkStaticEndpoint(`${baseUrl}/robots.txt`, "text/plain"),
    checkStaticEndpoint(`${baseUrl}/feed.xml`, "xml"),
    checkStaticEndpoint(sitemapUrl, "xml"),
    checkStaticEndpoint(`${baseUrl}/ads.txt`, "text/plain")
  ]);

  summarize([...pageChecks, ...staticChecks]);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
