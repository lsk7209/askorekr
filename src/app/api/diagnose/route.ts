import { NextResponse } from "next/server";
import {
  assertRegionExists,
  diagnosePlants,
  parseDiagnoseRequest
} from "@/features/diagnose/logic";

export async function POST(request: Request) {
  const payload = parseDiagnoseRequest(await request.json().catch(() => null));

  if (!payload) {
    return NextResponse.json(
      { error: "지역과 환경 값을 확인해 주세요." },
      { status: 400 }
    );
  }

  const regionExists = await assertRegionExists(payload.regionCode);

  if (!regionExists) {
    return NextResponse.json(
      { error: "지원하지 않는 지역입니다." },
      { status: 404 }
    );
  }

  const result = await diagnosePlants(payload);

  return NextResponse.json(result);
}
