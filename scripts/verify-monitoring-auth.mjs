import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const gsc = await readFile("src/app/api/monitoring/gsc/route.ts", "utf8");
const ga4 = await readFile("src/app/api/monitoring/ga4/route.ts", "utf8");
const page = await readFile("src/app/admin/monitoring/page.tsx", "utf8");

for (const [name, source] of [["GSC", gsc], ["GA4", ga4]]) {
  assert.match(source, /authorizeInternalRequest\(request\)/, `${name} monitoring API must require internal authorization`);
  assert.match(source, /status:\s*401/, `${name} monitoring API must reject unauthorized requests`);
}

assert.match(page, /notFound\(\)/, "The browser monitoring page must not expose analytics without a session-based admin design");
assert.doesNotMatch(page, /GSC_API_CLIENT_SECRET|GA4_CLIENT_SECRET|GEMINI_API_KEY/, "The disabled page must not publish credential-shaped examples");

console.log("MONITORING_AUTH_OK");
