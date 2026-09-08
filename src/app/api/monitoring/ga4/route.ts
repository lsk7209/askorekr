import { authorizeInternalRequest } from "@/lib/internal-api-auth";
import { NextResponse } from "next/server";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GA4_BASE = "https://analyticsdata.googleapis.com/v1beta";

async function getAccessToken() {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GA4_CLIENT_ID ?? "",
      client_secret: process.env.GA4_CLIENT_SECRET ?? "",
      refresh_token: process.env.GA4_REFRESH_TOKEN ?? "",
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
  const propertyId = process.env.GA4_PROPERTY_ID ?? "536871374";

  if (!process.env.GA4_CLIENT_ID || !process.env.GA4_CLIENT_SECRET || !process.env.GA4_REFRESH_TOKEN) {
    return NextResponse.json({ error: "GA4 credentials not configured" }, { status: 503 });
  }

  try {
    const token = await getAccessToken();
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const startDate = `${days}daysAgo`;

    const [pageRes, deviceRes, summaryRes] = await Promise.all([
      fetch(`${GA4_BASE}/properties/${propertyId}:runReport`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate: "today" }],
          dimensions: [{ name: "pagePath" }],
          metrics: [
            { name: "sessions" }, { name: "screenPageViews" },
            { name: "bounceRate" }, { name: "averageSessionDuration" }
          ],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: 20
        })
      }),
      fetch(`${GA4_BASE}/properties/${propertyId}:runReport`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate: "today" }],
          dimensions: [{ name: "deviceCategory" }],
          metrics: [{ name: "sessions" }, { name: "newUsers" }],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }]
        })
      }),
      fetch(`${GA4_BASE}/properties/${propertyId}:runReport`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate: "today" }],
          metrics: [
            { name: "sessions" }, { name: "newUsers" },
            { name: "screenPageViews" }, { name: "bounceRate" }
          ]
        })
      })
    ]);

    const [pageData, deviceData, summaryData] = await Promise.all([
      pageRes.json(), deviceRes.json(), summaryRes.json()
    ]);

    type Row = { dimensionValues?: { value: string }[]; metricValues: { value: string }[] };

    const summary = summaryData.rows?.[0];

    return NextResponse.json({
      period: { days },
      summary: summary ? {
        sessions: parseInt(summary.metricValues[0].value),
        newUsers: parseInt(summary.metricValues[1].value),
        pageViews: parseInt(summary.metricValues[2].value),
        bounceRate: (parseFloat(summary.metricValues[3].value) * 100).toFixed(1) + "%"
      } : null,
      topPages: (pageData.rows ?? []).map((r: Row) => ({
        page: r.dimensionValues?.[0]?.value ?? "",
        sessions: parseInt(r.metricValues[0].value),
        views: parseInt(r.metricValues[1].value),
        bounceRate: (parseFloat(r.metricValues[2].value) * 100).toFixed(0) + "%",
        avgDuration: Math.round(parseFloat(r.metricValues[3].value)) + "초"
      })),
      devices: (deviceData.rows ?? []).map((r: Row) => ({
        device: r.dimensionValues?.[0]?.value ?? "",
        sessions: parseInt(r.metricValues[0].value),
        newUsers: parseInt(r.metricValues[1].value)
      }))
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
