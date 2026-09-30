#!/usr/bin/env node

/**
 * DB 백필 스크립트:
 * 1. 밀리초(13자리)로 잘못 저장된 SQLite timestamp 컬럼을 초(10자리) 단위로 변환 (DATA-01 후속 백필)
 * 2. 안전성 점수 무결성 진단 (SAFE-01 후속)
 *
 * 사용법:
 *   node scripts/backfill-timestamps-and-safety.mjs            # Dry-run (안전 모드, 변경 없음)
 *   node scripts/backfill-timestamps-and-safety.mjs --execute  # 실제 적용
 */

import { createClient } from "@libsql/client";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// 환경변수 로드
function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = (match[2] || "").trim().replace(/^["']|["']$/g, "");
      }
    }
  }
}

loadEnv();

const isExecute = process.argv.includes("--execute");
const dbUrl = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log("==================================================");
console.log(`[Askore DB Backfill Tool]`);
console.log(`- 모드: ${isExecute ? "🚨 EXECUTE (실제 DB 수정)" : "🛡️ DRY-RUN (검사만 수행)"}`);
console.log(`- 대상 DB: ${dbUrl}`);
console.log("==================================================\n");

const db = createClient({
  url: dbUrl,
  authToken: authToken
});

// 타임스탬프 필드를 가진 테이블과 컬럼 목록
const TIMESTAMP_TARGETS = [
  { table: "plants", columns: ["created_at", "updated_at"] },
  { table: "plant_metrics", columns: ["derived_at"] },
  { table: "plant_content", columns: ["published_at", "last_revalidated_at"] },
  { table: "care_guides", columns: ["published_at"] },
  { table: "tools_results", columns: ["computed_at"] },
  { table: "blog_posts", columns: ["scheduled_at", "published_at", "created_at", "updated_at"] },
  { table: "pipeline_runs", columns: ["started_at", "finished_at"] },
  { table: "quality_gate_failures", columns: ["detected_at"] },
  { table: "lint_violations", columns: ["detected_at"] },
  { table: "publish_queue", columns: ["scheduled_for"] }
];

async function main() {
  try {
    let totalMillisecondRecords = 0;

    console.log("🔍 1. 타임스탬프 단위 검사 (밀리초 > 100,000,000,000):");

    for (const target of TIMESTAMP_TARGETS) {
      // 테이블 존재 여부 확인
      const tableCheck = await db.execute({
        sql: "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
        args: [target.table]
      });

      if (tableCheck.rows.length === 0) {
        continue;
      }

      for (const col of target.columns) {
        // 밀리초 형태(11자리 이상, 100,000,000,000 초과) 검사
        const query = `
          SELECT COUNT(*) as count, MIN(${col}) as min_val, MAX(${col}) as max_val
          FROM ${target.table}
          WHERE ${col} IS NOT NULL AND ${col} > 100000000000
        `;
        const res = await db.execute(query);
        const count = Number(res.rows[0].count);

        if (count > 0) {
          totalMillisecondRecords += count;
          console.log(`  ⚠️ [${target.table}.${col}] 밀리초 단위 레코드 발견: ${count}개 (범위: ${res.rows[0].min_val} ~ ${res.rows[0].max_val})`);

          if (isExecute) {
            const updateSql = `
              UPDATE ${target.table}
              SET ${col} = CAST(${col} / 1000 AS INTEGER)
              WHERE ${col} IS NOT NULL AND ${col} > 100000000000
            `;
            await db.execute(updateSql);
            console.log(`     ✅ ${target.table}.${col} 초 단위로 변환 완료!`);
          }
        }
      }
    }

    if (totalMillisecondRecords === 0) {
      console.log("  ✨ 모든 타임스탬프가 정상적인 초 단위(10자리)입니다. 수정할 대상 없음.\n");
    } else if (!isExecute) {
      console.log(`\n  ℹ️ 총 ${totalMillisecondRecords}개 레코드가 밀리초 형식입니다.`);
      console.log("  👉 실제 적용하려면 `--execute` 옵션을 붙여 실행하세요.\n");
    } else {
      console.log(`\n  🎉 총 ${totalMillisecondRecords}개 레코드의 타임스탬프 변환이 완료되었습니다!\n`);
    }

    // 2. 안전성 점수 진단
    console.log("🔍 2. 안전성 점수 무결성 상태 점검:");
    const metricsTableCheck = await db.execute({
      sql: "SELECT name FROM sqlite_master WHERE type='table' AND name = 'plant_metrics'",
      args: []
    });

    if (metricsTableCheck.rows.length > 0) {
      const safetyStats = await db.execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN pet_safety_score_dog >= 80 THEN 1 ELSE 0 END) as dog_safe,
          SUM(CASE WHEN pet_safety_score_cat >= 80 THEN 1 ELSE 0 END) as cat_safe,
          SUM(CASE WHEN pet_safety_score_dog IS NULL AND pet_safety_score_cat IS NULL THEN 1 ELSE 0 END) as both_unknown,
          SUM(CASE WHEN pet_safety_score_dog <= 60 OR pet_safety_score_cat <= 60 THEN 1 ELSE 0 END) as any_toxic
        FROM plant_metrics
      `);

      const row = safetyStats.rows[0];
      console.log(`  - 전체 식물 메트릭: ${row.total}건`);
      console.log(`  - 반려견 안전 판정(>=80): ${row.dog_safe}건`);
      console.log(`  - 반려묘 안전 판정(>=80): ${row.cat_safe}건`);
      console.log(`  - 독성 위험(<=60): ${row.any_toxic}건`);
      console.log(`  - 안전 근거 미확인(NULL/Unknown): ${row.both_unknown}건`);
    }

    console.log("\n==================================================");
    console.log("점검이 완료되었습니다.");
    console.log("==================================================");

  } catch (err) {
    console.error("❌ 오류 발생:", err);
    process.exit(1);
  }
}

main();
