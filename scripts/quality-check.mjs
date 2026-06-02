import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function main() {
  const dist = await db.execute(`
    SELECT
      CASE
        WHEN quality_score >= 95 THEN '95-100점'
        WHEN quality_score >= 90 THEN '90-94점'
        WHEN quality_score >= 85 THEN '85-89점'
        WHEN quality_score >= 80 THEN '80-84점'
        ELSE '80점미만'
      END as range,
      COUNT(*) as cnt
    FROM blog_posts
    WHERE quality_score IS NOT NULL
    GROUP BY range ORDER BY range DESC
  `);

  const stats = await db.execute(`
    SELECT COUNT(*) total, COUNT(quality_score) scored,
      ROUND(AVG(quality_score),1) avg_q,
      MIN(quality_score) min_q, MAX(quality_score) max_q,
      COUNT(CASE WHEN quality_score < 90 THEN 1 END) below90
    FROM blog_posts
  `);

  const cats = await db.execute(`
    SELECT category, COUNT(*) cnt, ROUND(AVG(quality_score),1) avg
    FROM blog_posts WHERE quality_score IS NOT NULL
    GROUP BY category ORDER BY avg DESC
  `);

  const low = await db.execute(`
    SELECT title, quality_score, category
    FROM blog_posts WHERE quality_score < 90
    ORDER BY quality_score LIMIT 15
  `);

  const recent = await db.execute(`
    SELECT title, quality_score, category, is_published
    FROM blog_posts ORDER BY created_at DESC LIMIT 5
  `);

  const [s] = stats.rows;
  console.log("=== 전체 통계 ===");
  console.log(`전체: ${s[0]}개 | 채점됨: ${s[1]}개 | 평균: ${s[2]}점 | 최소: ${s[3]} | 최대: ${s[4]}`);
  console.log(`90점 미만: ${s[5]}개 (${((Number(s[5])/Number(s[1]))*100).toFixed(1)}%)`);

  console.log("\n=== 점수 분포 ===");
  dist.rows.forEach(r => console.log(`  ${r[0]}: ${r[1]}개`));

  console.log("\n=== 카테고리별 ===");
  cats.rows.forEach(r => console.log(`  ${r[0]}: ${r[1]}개, 평균 ${r[2]}점`));

  if (low.rows.length) {
    console.log("\n=== 90점 미만 글 ===");
    low.rows.forEach(r => console.log(`  [${r[1]}점] ${String(r[0]).slice(0,50)} (${r[2]})`));
  } else {
    console.log("\n✅ 90점 미만 글 없음");
  }

  console.log("\n=== 최근 생성 5개 ===");
  recent.rows.forEach(r => console.log(`  [${r[1]}점] ${String(r[0]).slice(0,50)} | 발행: ${r[3] ? "O" : "예약"}`));
}

main().catch(console.error);
