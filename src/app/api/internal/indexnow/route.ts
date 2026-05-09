import { getIndexNowConfig, publicEnv } from "@/env";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const INDEXNOW_ENDPOINTS = [
  { engine: "bing", endpoint: "https://www.bing.com/indexnow" },
  { engine: "naver", endpoint: "https://searchadvisor.naver.com/indexnow" }
] as const;

const MAX_URLS_PER_REQUEST = 1000;
const RESPONSE_BODY_LIMIT = 500;

type IndexNowRequestBody = {
  url?: unknown;
  urls?: unknown;
  dryRun?: unknown;
};

type SubmitResult = {
  engine: string;
  endpoint: string;
  ok: boolean;
  status: number;
  body: string;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization")?.trim();
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  return request.headers.get("x-internal-api-token")?.trim();
}

function normalizeHostname(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function isAllowedSiteUrl(value: string) {
  try {
    const url = new URL(value);
    const siteUrl = new URL(publicEnv.siteUrl);
    const isWebUrl = url.protocol === "https:" || url.protocol === "http:";

    return (
      isWebUrl &&
      normalizeHostname(url.hostname) === normalizeHostname(siteUrl.hostname)
    );
  } catch {
    return false;
  }
}

function collectUrlCandidates(body: IndexNowRequestBody) {
  const candidates: unknown[] = [];

  if (typeof body.url === "string") {
    candidates.push(body.url);
  }

  if (Array.isArray(body.urls)) {
    candidates.push(...body.urls);
  }

  return candidates;
}

function normalizeUrlList(body: IndexNowRequestBody) {
  const seen = new Set<string>();
  const urls: string[] = [];
  const invalid: string[] = [];

  for (const candidate of collectUrlCandidates(body)) {
    if (typeof candidate !== "string" || candidate.trim().length === 0) {
      invalid.push(String(candidate));
      continue;
    }

    const normalized = candidate.trim();
    if (!isAllowedSiteUrl(normalized)) {
      invalid.push(normalized);
      continue;
    }

    const absoluteUrl = new URL(normalized).toString();
    if (!seen.has(absoluteUrl)) {
      seen.add(absoluteUrl);
      urls.push(absoluteUrl);
    }
  }

  return {
    urls: urls.slice(0, MAX_URLS_PER_REQUEST),
    invalid,
    truncated: urls.length > MAX_URLS_PER_REQUEST
  };
}

async function readBody(request: Request): Promise<IndexNowRequestBody | null> {
  try {
    return (await request.json()) as IndexNowRequestBody;
  } catch {
    return null;
  }
}

async function submitToIndexNow(
  engine: string,
  endpoint: string,
  payload: Record<string, unknown>
): Promise<SubmitResult> {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store"
    });
    const body = await response.text();

    return {
      engine,
      endpoint,
      ok: response.ok,
      status: response.status,
      body: body.slice(0, RESPONSE_BODY_LIMIT)
    };
  } catch (error) {
    return {
      engine,
      endpoint,
      ok: false,
      status: 0,
      body: error instanceof Error ? error.message : "Unknown fetch error"
    };
  }
}

export async function POST(request: Request) {
  const { key, internalToken } = getIndexNowConfig();

  if (!internalToken) {
    return jsonError("IndexNow internal token is not configured.", 503);
  }

  if (getBearerToken(request) !== internalToken) {
    return jsonError("Unauthorized.", 401);
  }

  if (!key) {
    return jsonError("IndexNow key is not configured.", 503);
  }

  const body = await readBody(request);
  if (!body) {
    return jsonError("Valid JSON body is required.", 400);
  }

  const { urls, invalid, truncated } = normalizeUrlList(body);
  if (urls.length === 0) {
    return jsonError("At least one valid same-site URL is required.", 400);
  }

  const host = new URL(publicEnv.siteUrl).hostname;
  const keyLocation = new URL("/indexnow-key.txt", publicEnv.siteUrl).toString();
  const payload = {
    host,
    key,
    keyLocation,
    urlList: urls
  };

  if (body.dryRun === true) {
    return NextResponse.json({
      dryRun: true,
      submittedUrls: urls,
      invalidUrls: invalid,
      truncated,
      keyLocation,
      payload: { ...payload, key: "[redacted]" }
    });
  }

  const results = await Promise.all(
    INDEXNOW_ENDPOINTS.map(({ engine, endpoint }) =>
      submitToIndexNow(engine, endpoint, payload)
    )
  );

  return NextResponse.json({
    submittedUrls: urls,
    invalidUrls: invalid,
    truncated,
    keyLocation,
    results
  });
}
