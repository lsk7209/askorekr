import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN
});

function checkMarkup(md) {
  return {
    bold: (md.match(/\*\*[^*]+\*\*/g) || []).length,
    italic: (md.match(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g) || []).length,
    mark: (md.match(/==[^=]+==/g) || []).length,
    h2: (md.match(/^## /gm) || []).length,
    h3: (md.match(/^### /gm) || []).length,
    callout: (md.match(/^> /gm) || []).length,
    table: (md.match(/^\|/gm) || []).length,
    list: (md.match(/^[-*] /gm) || []).length,
    faqQ: (md.match(/^### .*[?？]/gm) || []).length,
    charCount: md.replace(/\s+/g, "").length
  };
}

async function main() {
  // 각 카테고리별 랜덤 1개씩 샘플
  const samples = await db.execute(`
    SELECT title, category, quality_score, body_markdown, slug
    FROM blog_posts
    WHERE is_published = 0 AND quality_score IS NOT NULL
    GROUP BY category
    ORDER BY RANDOM()
    LIMIT 6
  `);

  // 전체 구조 통계
  const all = await db.execute(`
    SELECT body_markdown FROM blog_posts WHERE quality_score IS NOT NULL LIMIT 200
  `);

  let totals = { bold:0, italic:0, mark:0, h2:0, h3:0, callout:0, table:0, faqQ:0, chars:0, count:0 };
  let noMark=0, noCallout=0, noTable=0, noFaq=0, shortPost=0;

  for (const row of all.rows) {
    const md = row[0];
    const s = checkMarkup(String(md));
    totals.bold += s.bold; totals.italic += s.italic; totals.mark += s.mark;
    totals.h2 += s.h2; totals.callout += s.callout; totals.table += s.table;
    totals.faqQ += s.faqQ; totals.chars += s.charCount; totals.count++;
    if (s.mark === 0) noMark++;
    if (s.callout === 0) noCallout++;
    if (s.table === 0) noTable++;
    if (s.faqQ < 3) noFaq++;
    if (s.charCount < 1200) shortPost++;
  }

  const n = totals.count;
  console.log("=== 구조 요소 평균 (200개 샘플) ===");
  console.log(`  **굵게** 평균: ${(totals.bold/n).toFixed(1)}회/글`);
  console.log(`  *이탤릭* 평균: ${(totals.italic/n).toFixed(1)}회/글`);
  console.log(`  ==형광== 평균: ${(totals.mark/n).toFixed(1)}회/글`);
  console.log(`  ## H2 평균: ${(totals.h2/n).toFixed(1)}개/글`);
  console.log(`  callout(>) 평균: ${(totals.callout/n).toFixed(1)}개/글`);
  console.log(`  표(|) 평균: ${(totals.table/n).toFixed(1)}행/글`);
  console.log(`  FAQ(###?) 평균: ${(totals.faqQ/n).toFixed(1)}개/글`);
  console.log(`  글자수 평균: ${Math.round(totals.chars/n).toLocaleString()}자`);

  console.log("\n=== 요소 누락 비율 ===");
  console.log(`  ==형광== 0개: ${noMark}개 (${(noMark/n*100).toFixed(0)}%)`);
  console.log(`  callout 0개: ${noCallout}개 (${(noCallout/n*100).toFixed(0)}%)`);
  console.log(`  표 없음: ${noTable}개 (${(noTable/n*100).toFixed(0)}%)`);
  console.log(`  FAQ 3개 미만: ${noFaq}개 (${(noFaq/n*100).toFixed(0)}%)`);
  console.log(`  1200자 미만: ${shortPost}개 (${(shortPost/n*100).toFixed(0)}%)`);

  console.log("\n=== 카테고리별 샘플 글 구조 ===");
  for (const row of samples.rows) {
    const title = row[0]; const cat = row[1]; const score = row[2]; const md = row[3];
    const s = checkMarkup(String(md));
    console.log(`\n[${score}점] ${cat}`);
    console.log(`  제목: ${String(title).slice(0, 55)}`);
    console.log(`  글자: ${s.charCount.toLocaleString()}자 | H2: ${s.h2}개 | FAQ: ${s.faqQ}개`);
    console.log(`  굵게: ${s.bold} | 이탤릭: ${s.italic} | 형광: ${s.mark} | callout: ${s.callout} | 표: ${s.table}행`);
  }
}

main().catch(console.error);
