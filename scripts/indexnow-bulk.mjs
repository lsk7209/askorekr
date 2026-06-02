/**
 * IndexNow 기존 발행 글 일괄 제출
 * 실행: node scripts/indexnow-bulk.mjs
 *
 * 필요 환경변수: INDEXNOW_KEY, INTERNAL_API_TOKEN
 * (TURSO_DATABASE_URL, TURSO_AUTH_TOKEN은 DB 직접 조회용)
 */

import { createClient } from "@libsql/client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://askore.kr";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
const INTERNAL_TOKEN = process.env.INTERNAL_API_TOKEN;
const TURSO_URL = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

const BATCH_SIZE = 100;

if (!INDEXNOW_KEY || !INTERNAL_TOKEN) {
  console.error("❌ INDEXNOW_KEY, INTERNAL_API_TOKEN 환경변수 필요");
  process.exit(1);
}

async function getPublishedSlugs() {
  const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
  const result = await client.execute(
    "SELECT slug FROM blog_posts WHERE is_published = 1 ORDER BY published_at DESC"
  );
  return result.rows.map((r) => String(r[0]));
}

async function submitBatch(urls) {
  const res = await fetch(`${SITE_URL}/api/internal/indexnow`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${INTERNAL_TOKEN}`
    },
    body: JSON.stringify({ urls })
  });
  const data = await res.json();
  const ok = data.results?.filter((r) => r.ok).length ?? 0;
  const fail = data.results?.filter((r) => !r.ok).length ?? 0;
  return { ok, fail, submitted: urls.length };
}

async function main() {
  console.log("📡 IndexNow 일괄 제출 시작");

  const slugs = await getPublishedSlugs();
  console.log(`   발행된 블로그 글: ${slugs.length}개`);

  const urls = slugs.map((s) => `${SITE_URL}/blog/${s}`);
  let totalOk = 0, totalFail = 0;

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const result = await submitBatch(batch);
    totalOk += result.ok;
    totalFail += result.fail;
    console.log(`   배치 ${Math.floor(i / BATCH_SIZE) + 1}: ${result.submitted}개 제출 → 성공 ${result.ok}, 실패 ${result.fail}`);
    // 과부하 방지
    if (i + BATCH_SIZE < urls.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log(`\n✅ 완료: 총 ${slugs.length}개 → 성공 ${totalOk}, 실패 ${totalFail}`);
}

main().catch(console.error);
