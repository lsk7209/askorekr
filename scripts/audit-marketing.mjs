import { createSign } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
const OAUTH_URL = "https://oauth2.googleapis.com/token";
const DEFAULT_SITE = "https://www.askore.kr";
const DEFAULT_GSC_SA = "D:\\env\\cursorai-451704-85a5abbe8eeb.json";
const DEFAULT_ADSENSE_CLIENT = "D:\\env\\adsense_oauth_client.json";
const SCOPE_GSC = "https://www.googleapis.com/auth/webmasters.readonly";
const SCOPE_GA4 = "https://www.googleapis.com/auth/analytics.readonly";
const ENV_FILES = [".env", ".env.local"];
function sanitizeRefreshToken(value) {
  return value?.trim().replace(/^"|"$/g, "");
}
function isLikelyRefreshToken(value) {
  return /^1\/\/[A-Za-z0-9._-]+$/.test(value ?? "");
}
function oauthErrorDetails(status, data) {
  const error = data?.error;
  const description = data?.error_description;
  const message = data?.message;
  if (typeof description === "string" && description.length > 0) {
    return description;
  }
  if (typeof error === "string" && error.length > 0) {
    return error;
  }
  if (typeof message === "string" && message.length > 0) {
    return message;
  }
  return `HTTP ${status}`;
}
function oauthErrorHint(status, data) {
  const error = data?.error;
  if (error === "invalid_grant") {
    return "refresh token이 만료/철회되었거나 client_id가 변경된 경우입니다. 새 토큰 발급 후 갱신하세요.";
  }
  if (error === "invalid_client") {
    return "client_id 또는 client_secret이 잘못되었습니다. OAuth 클라이언트 값과 adsense_oauth_client.json을 확인하세요.";
  }
  if (error === "unauthorized_client") {
    return "OAuth 클라이언트 권한 또는 승인된 리디렉트 URI를 점검하세요.";
  }
  if (status === 400) {
    return "요청 파라미터 또는 refresh token의 유효성 문제 가능성이 큽니다.";
  }
  return "계정/권한/네트워크 설정을 점검하세요.";
}
async function requestOAuthJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { Accept: "application/json", ...(options.headers || {}) },
    ...options
  });
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  return { ok: response.ok, status: response.status, data };
}
async function adSenseAccessToken() {
  const refreshToken = sanitizeRefreshToken(env("ADSENSE_REFRESH_TOKEN"));
  if (!refreshToken) {
    throw new Error(
      "ADSENSE_REFRESH_TOKEN missing. (1) ADSENSE_API_CLIENT_ID/SECRET 또는 ADSENSE_OAUTH_CLIENT_PATH 점검, (2) refresh token 갱신 필요"
    );
  }
  if (!isLikelyRefreshToken(refreshToken)) {
    throw new Error(
      "ADSENSE_REFRESH_TOKEN format may be invalid. Google OAuth refresh token is usually starts with '1//'"
    );
  }
  const clientId = env("ADSENSE_API_CLIENT_ID");
  const clientSecret = env("ADSENSE_API_CLIENT_SECRET");
  const oauth = clientId && clientSecret ? { id: clientId, secret: clientSecret } : adSenseOAuthClient();
  if (!oauth.id || !oauth.secret) throw new Error("ADSENSE API client id/secret missing");
  const token = await requestOAuthJson(OAUTH_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: oauth.id,
      client_secret: oauth.secret,
      refresh_token: refreshToken
    })
  });
  if (!token.ok || !token.data.access_token) {
    throw new Error(
      `adsense refresh token exchange failed: ${oauthErrorDetails(token.status, token.data)}. ${oauthErrorHint(token.status, token.data)}`
    );
  }
  return token.data.access_token;
}
function setEnvFileValues() {
  for (const file of ENV_FILES) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const [k, ...v] = t.split("=");
      if (!process.env[k]) process.env[k] = v.join("=").replace(/^['"]|['"]$/g, "");
    }
  }
}
function env(name) {
  const v = process.env[name]?.trim();
  return v && v.length > 0 ? v : undefined;
}
function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}
function siteCandidates(baseUrl) {
  try {
    const url = new URL(baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
    const host = url.hostname;
    const noWww = host.startsWith("www.") ? host.slice(4) : undefined;
    const variants = [
      `${url.protocol}//${host}/`,
      `${url.protocol}//${host}${url.pathname}`,
      `${url.protocol}//${host}${url.pathname}`.replace(/\/+/g, "/"),
      `sc-domain:${host}`,
      `${url.protocol}//${host.toLowerCase()}/`,
      `${url.protocol}//${url.host}/`
    ];
    if (noWww) {
      variants.push(`${url.protocol}//${noWww}/`);
      variants.push(`sc-domain:${noWww}`);
    }
    return uniqueValues(variants.map((v) => v.replace(/\/+$/, (v.startsWith("sc-domain:") ? "" : "/"))));
  } catch {
    return [baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`];
  }
}
function toBase64Json(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}
function makeJwt(sa, scope) {
  const now = Math.floor(Date.now() / 1000);
  const header = toBase64Json({ alg: "RS256", typ: "JWT" });
  const claim = toBase64Json({
    iss: sa.client_email,
    scope,
    aud: OAUTH_URL,
    iat: now,
    exp: now + 3600
  });
  const raw = `${header}.${claim}`;
  const sig = createSign("RSA-SHA256").update(raw).sign(sa.private_key, "base64url");
  return `${raw}.${sig}`;
}
function readJson(filePath, ctx) {
  if (!filePath || !existsSync(filePath)) {
    throw new Error(`${ctx} file missing: ${filePath ?? "unset"}`);
  }
  return JSON.parse(readFileSync(filePath, "utf8"));
}
async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { Accept: "application/json", ...(options.headers || {}) },
    ...options
  });
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  return { ok: response.ok, status: response.status, data };
}
async function serviceAccountToken(scope, envName, fallbackPath) {
  const path = env(envName) ?? fallbackPath;
  const sa = readJson(path, "service account");
  const assertion = makeJwt(sa, scope);
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion
  });
  const token = await requestJson(OAUTH_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });
  if (!token.ok || !token.data.access_token) {
    throw new Error(`service account token failed: ${token.status}`);
  }
  return token.data.access_token;
}
function adSenseOAuthClient() {
  const oauthFile = readJson(env("ADSENSE_OAUTH_CLIENT_PATH") ?? DEFAULT_ADSENSE_CLIENT, "ad sense oauth");
  const source = oauthFile.installed ?? oauthFile.web ?? {};
  return { id: source.client_id, secret: source.client_secret };
}
function dayAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}
function summarizeGa4Properties(summaries) {
  const items = [];
  for (const account of summaries) {
    const accountName = account?.displayName ?? "account";
    for (const prop of account?.propertySummaries ?? []) {
      const property = prop?.property;
      if (!property) continue;
      items.push(`${accountName} / ${prop.displayName ?? "property"} (${property})`);
    }
  }
  return items.slice(0, 10);
}
async function suggestGa4Properties() {
  try {
    const token = await serviceAccountToken(SCOPE_GA4, "GA4_SERVICE_ACCOUNT_KEY_PATH", DEFAULT_GSC_SA);
    const response = await requestJson("https://analyticsadmin.googleapis.com/v1alpha/accountSummaries", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) return [];
    return summarizeGa4Properties(Array.isArray(response.data.accountSummaries) ? response.data.accountSummaries : []);
  } catch {
    return [];
  }
}
async function checkSearchConsole(baseUrl) {
  const siteUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const token = await serviceAccountToken(SCOPE_GSC, "GSC_SERVICE_ACCOUNT_KEY_PATH", DEFAULT_GSC_SA);
  const sites = await requestJson("https://www.googleapis.com/webmasters/v3/sites", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!sites.ok) return { status: "warn", message: `sites list failed (${sites.status})` };
  const entries = Array.isArray(sites.data.siteEntry) ? sites.data.siteEntry : [];
  const candidateSites = siteCandidates(siteUrl);
  const registered = entries.map((row) => row?.siteUrl).filter(Boolean);
  if (!candidateSites.some((site) => registered.includes(site))) {
    return {
      status: "warn",
      message: `GSC mismatch. expected one of [${candidateSites.join(", ")}], registered sample: ${registered.slice(0, 5).join(", ")}`
    };
  }
  const matched = entries.find((entry) => {
    if (!entry?.siteUrl) return false;
    return candidateSites.includes(entry.siteUrl);
  });
  const querySite = matched?.siteUrl ?? siteUrl;
  const accessHint = matched?.permissionLevel
    ? ` (permissionLevel: ${matched.permissionLevel})`
    : " (권한 레벨 미노출)";
  const query = await requestJson(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(querySite)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ startDate: dayAgo(14), endDate: dayAgo(1), dimensions: ["query"], rowLimit: 5 })
    }
  );
  if (!query.ok) {
    if (query.status === 403) {
      return {
        status: "warn",
        message: `searchAnalytics failed (403): 서비스 계정(${env("GSC_SERVICE_ACCOUNT_KEY_PATH") ?? DEFAULT_GSC_SA})의 현재 권한은 ${accessHint}입니다. Search Console 소유자에게 해당 속성 조회권한(Owner 또는 Full user)이 필요합니다.`
      };
    }
    if (query.status === 404) {
      return {
        status: "warn",
        message: "searchAnalytics failed (404): 사이트 속성이 없거나 등록되지 않았습니다. Search Console 속성 확인 필요."
      };
    }
    return { status: "warn", message: `searchAnalytics failed (${query.status})` };
  }
  return { status: "ok", message: `rows=${query.data.rows?.length ?? 0}` };
}
async function checkGA4() {
  const propertyInput = env("GA4_PROPERTY_ID");
  if (!propertyInput) {
    const candidates = await suggestGa4Properties();
    const sample = candidates.length > 0 ? `접근 가능한 property 예시: ${candidates.join(", ")}` : "서비스 계정 권한/설정 확인 필요";
    return {
      status: "warn",
      message: `GA4_PROPERTY_ID missing. 측정 ID(NEXT_PUBLIC_GA4_ID)와 달리 analyticsdata API는 numeric property id(예: properties/xxxxxx) 필요. ${sample}`
    };
  }
  const propertyId = propertyInput.replace(/^properties\//i, "");
  if (!/^\d+$/.test(propertyId)) {
    return {
      status: "warn",
      message: "GA4_PROPERTY_ID 형식 오류. properties/{numericId} 또는 숫자 ID(예: 123456789)만 허용"
    };
  }
  const property = `properties/${propertyId}`;
  const token = await serviceAccountToken(SCOPE_GA4, "GA4_SERVICE_ACCOUNT_KEY_PATH", DEFAULT_GSC_SA);
  const response = await requestJson(
    `https://analyticsdata.googleapis.com/v1beta/${property}:runReport`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({
        dateRanges: [{ startDate: dayAgo(7), endDate: dayAgo(1) }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
        limit: "10"
      })
    }
  );
  if (!response.ok) {
    if (response.status === 403) {
      return {
        status: "warn",
        message: "runReport failed (403): 서비스 계정에 GA4 속성 권한이 없습니다. Analytics 관리에서 사용자 역할을 부여하세요."
      };
    }
    if (response.status === 404) {
      return {
        status: "warn",
        message: `runReport failed (404): GA4 property를 찾지 못했습니다. 입력값(현재 ${property}) 확인 필요`
      };
    }
    return { status: "warn", message: `runReport failed (${response.status})` };
  }
  return { status: "ok", message: `rows=${response.data.rows?.length ?? 0}` };
}
async function checkAdSense() {
  const token = await adSenseAccessToken();
  const accounts = await requestJson("https://adsense.googleapis.com/v2/accounts", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!accounts.ok) {
    if (accounts.status === 401) {
      return {
        status: "warn",
        message: "accounts list failed (401): access token 발급/교체 필요 또는 토큰이 잘못되었습니다."
      };
    }
    if (accounts.status === 403) {
      return {
        status: "warn",
        message: "accounts list failed (403): AdSense API 권한이 없거나 승인된 계정이 아닙니다."
      };
    }
    if (accounts.status === 400) {
      return {
        status: "warn",
        message: "accounts list failed (400): 요청 형식 불일치 또는 사용자 액세스 상태 불일치"
      };
    }
    return { status: "warn", message: `accounts list failed (${accounts.status})` };
  }
  const list = Array.isArray(accounts.data.accounts) ? accounts.data.accounts : [];
  if (list.length === 0) return { status: "warn", message: "accounts is empty" };
  return { status: "ok", message: `accounts=${list.length}, sample=${list[0]?.name ?? ""}` };
}
async function safe(name, fn) {
  try {
    return [name, await fn()];
  } catch (error) {
    return [name, { status: "warn", message: error instanceof Error ? error.message : String(error) }];
  }
}
async function main() {
  setEnvFileValues();
  const baseUrl = env("NEXT_PUBLIC_SITE_URL") ?? DEFAULT_SITE;
  const checks = await Promise.all([
    safe("Search Console", () => checkSearchConsole(baseUrl)),
    safe("GA4", checkGA4),
    safe("AdSense", checkAdSense)
  ]);
  console.info(`marketing audit target: ${baseUrl}`);
  for (const [name, result] of checks) {
    const status = result.status === "ok" ? "[OK]" : "[WARN]";
    console.info(`${status} ${name}: ${result.message}`);
  }
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
