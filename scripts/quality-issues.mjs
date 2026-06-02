import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function main() {
  const banned = await db.execute(
    "SELECT COUNT(*) FROM blog_posts WHERE body_markdown LIKE '%기특한%' OR body_markdown LIKE '%쏠쏠%' OR body_markdown LIKE '%든든한 친구%' OR body_markdown LIKE '%국민 식물%'"
  );
  console.log("금지표현 포함:", banned.rows[0][0] + "개");

  const intro = await db.execute(
    "SELECT COUNT(*) FROM blog_posts WHERE body_markdown LIKE '%## 인트로%' OR body_markdown LIKE '%## 들어가며%'"
  );
  console.log("인트로/들어가며 H2:", intro.rows[0][0] + "개");

  const noCallout = await db.execute(
    "SELECT COUNT(*) FROM blog_posts WHERE body_markdown NOT LIKE '%> %'"
  );
  console.log("callout 없는 전체 글:", noCallout.rows[0][0] + "개");

  const hasMark = await db.execute(
    "SELECT COUNT(*) FROM blog_posts WHERE body_markdown LIKE '%==%'"
  );
  console.log("==mark== 있는 글:", hasMark.rows[0][0] + "개");

  const dayAgo = Math.floor(Date.now() / 1000) - 86400;
  const recentMark = await db.execute(
    `SELECT COUNT(*) FROM blog_posts WHERE created_at > ${dayAgo} AND body_markdown LIKE '%==%'`
  );
  const recentTotal = await db.execute(
    `SELECT COUNT(*) FROM blog_posts WHERE created_at > ${dayAgo}`
  );
  console.log(`최근 1일 생성: ${recentTotal.rows[0][0]}개 중 mark 있음: ${recentMark.rows[0][0]}개`);

  // 샘플: 금지표현 글
  const bannedSample = await db.execute(
    "SELECT title, quality_score FROM blog_posts WHERE body_markdown LIKE '%기특한%' LIMIT 5"
  );
  if (bannedSample.rows.length) {
    console.log("\n금지표현('기특한') 샘플:");
    bannedSample.rows.forEach(r => console.log("  [" + r[1] + "점] " + String(r[0]).slice(0, 50)));
  }
}

main().catch(console.error);
