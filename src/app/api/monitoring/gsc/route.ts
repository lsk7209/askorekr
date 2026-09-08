import { authorizeInternalRequest } from "@/lib/internal-api-auth";
import { NextResponse } from "next/server";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GSC_BASE = "https://www.googleapis.com/webmasters/v3";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://askore.kr";

async function getAccessToken() {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GSC_API_CLIENT_ID ?? "",
      client_secret: process.env.GSC_API_CLIENT_SECRET ?? "",
      refresh_token: process.env.GSC_REFRESH_TOKEN ?? "",
      grant_type: "refresh_token"
    })
  });
  const data = await res.json();
  return data.access_token as string;
}

export async function GET(request: Request) {
  const internalAuth = authorizeInternalRequest(request);
  if (!internalAuth.configured) {
    return NextResponse.json({ error: "Internal API token not configured" }, { status: 503 });
  }
  if (!internalAuth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") ?? "30");

  if (
    !process.env.GSC_API_CLIENT_ID ||
    !process.env.GSC_API_CLIENT_SECRET ||
    !process.env.GSC_REFRESH_TOKEN
  ) {
    return NextResponse.json({ error: "GSC credentials not configured" }, { status: 503 });
  }

  try {
    const token = await getAccessToken();
    const headers = { Authorization: `Bearer ${token}` };
    const encodedSite = encodeURIComponent(SITE_URL + "/");

    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

    const [queryRes, pageRes] = await Promise.all([
      fetch(`${GSC_BASE}/sites/${encodedSite}/searchAnalytics/query`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ["query"],
          rowLimit: 20,
          orderBy: [{ fieldName: "impressions", sortOrder: "DESCENDING" }]
        })
      }),
      fetch(`${GSC_BASE}/sites/${encodedSite}/searchAnalytics/query`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ["page"],
          rowLimit: 20,
          orderBy: [{ fieldName: "clicks", sortOrder: "DESCENDING" }]
        })
      })
    ]);

    const [queryData, pageData] = await Promise.all([queryRes.json(), pageRes.json()]);

    return NextResponse.json({
      period: { startDate, endDate },
      topQueries: (queryData.rows ?? []).map((r: { keys: string[]; impressions: number; clicks: number; ctr: number; position: number }) => ({
        query: r.keys[0],
        impressions: r.impressions,
        clicks: r.clicks,
        ctr: (r.ctr * 100).toFixed(1) + "%",
        position: r.position.toFixed(1)
      })),
      topPages: (pageData.rows ?? []).map((r: { keys: string[]; impressions: number; clicks: number; ctr: number; position: number }) => ({
        page: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: (r.ctr * 100).toFixed(1) + "%",
        position: r.position.toFixed(1)
      }))
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
