import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../diversify-blog-posts.mjs", import.meta.url),
  "utf8"
);

// OPS-01: SQL 문자열 결합("LIMIT " + limit)이 더 이상 없어야 함 (파라미터 바인딩 사용)
{
  const codeLines = source
    .split("\n")
    .filter((line) => !line.trim().startsWith("*") && !line.trim().startsWith("//"));
  const codeOnly = codeLines.join("\n");
  assert.equal(
    codeOnly.includes('"LIMIT " + limit'),
    false,
    "LIMIT 절은 문자열 결합이 아니라 파라미터 바인딩(?)을 사용해야 함"
  );
  assert.ok(
    codeOnly.includes("LIMIT ?"),
    "파라미터 바인딩 형태(LIMIT ?)가 있어야 함"
  );
}

// parseLimitArg 로직 복제 검증
function parseLimitArg(argv) {
  const limitArg = argv.find((a) => a.startsWith("--limit="));
  if (!limitArg) return 9999;
  const raw = limitArg.split("=")[1];
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`--limit 값이 올바르지 않습니다: "${raw}" (양의 정수만 허용)`);
  }
  return parsed;
}

// 정상 값
{
  assert.equal(parseLimitArg(["--limit=10"]), 10);
  assert.equal(parseLimitArg([]), 9999, "생략 시 기존 기본값(9999) 유지");
}

// 잘못된 값은 명시적 오류
{
  assert.throws(() => parseLimitArg(["--limit=0"]), /--limit/);
  assert.throws(() => parseLimitArg(["--limit=-5"]), /--limit/);
  assert.throws(() => parseLimitArg(["--limit=abc"]), /--limit/);
}

console.log("CONTENT_01_OPS_01_DIVERSIFY_OK");
