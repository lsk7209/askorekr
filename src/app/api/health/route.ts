import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { publicEnv } from "@/env";

const DB_TIMEOUT_MS = 3000;

type CheckStatus = "ok" | "fail";

type HealthCheck = {
  status: CheckStatus;
  latencyMs?: number;
  error?: string;
};

export const dynamic = "force-dynamic";

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("timeout")), timeoutMs);
    })
  ]);
}

async function checkDatabase(): Promise<HealthCheck> {
  const startedAt = Date.now();

  try {
    await withTimeout(db.run(sql`select 1`), DB_TIMEOUT_MS);

    return {
      status: "ok",
      latencyMs: Date.now() - startedAt
    };
  } catch (error) {
    return {
      status: "fail",
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "unknown"
    };
  }
}

export async function GET() {
  const database = await checkDatabase();
  const status = database.status === "ok" ? "ok" : "degraded";
  const httpStatus = status === "ok" ? 200 : 503;

  return NextResponse.json(
    {
      status,
      checkedAt: new Date().toISOString(),
      checks: {
        app: { status: "ok" satisfies CheckStatus },
        database,
        siteUrl: { status: publicEnv.siteUrl ? "ok" : "fail" },
        adsensePublisher: {
          status: publicEnv.adsensePubId ? "ok" : "fail"
        }
      }
    },
    {
      status: httpStatus,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
