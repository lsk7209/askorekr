import { NextResponse } from "next/server";
import {
  assertRegionExists,
  diagnosePlants
} from "@/features/diagnose/logic";
import { validateDiagnoseRequestStrict } from "@/features/diagnose/request";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (body === null) {
    return NextResponse.json(
      { error: "요청 본문은 유효한 JSON이어야 합니다." },
      { status: 400 }
    );
  }

  const validation = validateDiagnoseRequestStrict(body);

  if (!validation.ok) {
    return NextResponse.json(
      { error: "입력값을 확인해 주세요.", fieldErrors: validation.errors },
      { status: 400 }
    );
  }

  const payload = validation.value;
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
