import assert from "node:assert/strict";

// etl-nongsaro-garden-live.mjs의 getFlagValue/parsePositiveIntOrThrow/nowSeconds 로직을
// 복제해 검증한다. 원본 스크립트는 top-level에서 즉시 main()을 실행하고 네트워크/DB 접근을
// 시도하므로 import하지 않는다 (오프라인 검증 원칙, OPS-01).

function getFlagValue(args, flag) {
  const eqPrefix = `${flag}=`;
  const eqArg = args.find((a) => a.startsWith(eqPrefix));
  if (eqArg !== undefined) return eqArg.slice(eqPrefix.length);
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

function parsePositiveIntOrThrow(raw, flagName, fallback) {
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flagName} 값이 올바르지 않습니다: "${raw}" (양의 정수만 허용)`);
  }
  return parsed;
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

// T25: "--limit 5"와 "--limit=5" 둘 다 5로 파싱되어야 함
{
  const args1 = ["--limit", "5"];
  const args2 = ["--limit=5"];
  assert.equal(parsePositiveIntOrThrow(getFlagValue(args1, "--limit"), "--limit"), 5, "공백 분리 --limit 5");
  assert.equal(parsePositiveIntOrThrow(getFlagValue(args2, "--limit"), "--limit"), 5, "등호 --limit=5");
}

// T26 관련: 잘못된 --limit(0, 음수, NaN)은 명시적 오류
{
  assert.throws(() => parsePositiveIntOrThrow(getFlagValue(["--limit", "0"], "--limit"), "--limit"), /--limit/);
  assert.throws(() => parsePositiveIntOrThrow(getFlagValue(["--limit", "-3"], "--limit"), "--limit"), /--limit/);
  assert.throws(() => parsePositiveIntOrThrow(getFlagValue(["--limit", "abc"], "--limit"), "--limit"), /--limit/);
}

// 누락 시 기존 기본값(무제한/Infinity 등) 허용
{
  const value = getFlagValue([], "--limit");
  assert.equal(value, undefined);
}

// T11 관련: nowSeconds()는 밀리초가 아닌 초 단위를 반환해야 함 (10자리, Date.now()의 1/1000 스케일)
{
  const seconds = nowSeconds();
  const millis = Date.now();
  assert.ok(seconds < millis, "초 단위 값은 밀리초 값보다 작아야 함");
  assert.ok(Math.abs(seconds * 1000 - millis) < 5000, "초*1000이 현재 밀리초와 근접해야 함(오차 5초 이내)");
  // Drizzle이 이 값을 읽을 때 *1000을 하므로, 결과가 현재 시각과 근접해야 정상
  const roundTrip = new Date(seconds * 1000);
  const now = new Date();
  assert.ok(Math.abs(roundTrip.getTime() - now.getTime()) < 5000, "Drizzle round-trip 시 현재 시각과 근접해야 함 (비정상 미래 아님)");
}

console.log("DATA_01_OPS_01_OK");
