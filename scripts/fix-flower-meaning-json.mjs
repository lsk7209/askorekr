/**
 * plant_metrics.flower_meaning 컬럼 수정
 * plain string → { primary: "..." } JSON으로 변환
 * 실행: node scripts/fix-flower-meaning-json.mjs
 */
import { createClient } from "@libsql/client";
import { existsSync, readFileSync } from "node:fs";

function loadEnv() {
  for (const file of [".env", ".env.local"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const [n, ...r] = t.split("=");
      if (!process.env[n]) process.env[n] = r.join("=").replace(/^["']|["']$/g, "");
    }
  }
}

loadEnv();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN
});

const rows = await db.execute(
  "SELECT plant_id, flower_meaning FROM plant_metrics WHERE flower_meaning IS NOT NULL"
);

let fixed = 0, already = 0;

for (const row of rows.rows) {
  const val = String(row.flower_meaning);
  let parsed;
  try {
    parsed = JSON.parse(val);
  } catch {
    parsed = null;
  }

  if (parsed !== null && typeof parsed === "object") {
    already++;
    continue;
  }

  await db.execute({
    sql: "UPDATE plant_metrics SET flower_meaning = ? WHERE plant_id = ?",
    args: [JSON.stringify({ primary: val }), row.plant_id]
  });
  fixed++;
}

console.log(`완료: ${fixed}개 수정, ${already}개 이미 JSON 형식`);
await db.close();
