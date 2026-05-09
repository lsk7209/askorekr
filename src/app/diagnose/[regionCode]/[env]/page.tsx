import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  assertRegionExists,
  diagnosePlants,
  getRegions
} from "@/features/diagnose/logic";
import {
  buildDiagnoseResultPath,
  parseDiagnoseRouteRequest
} from "@/features/diagnose/request";
import {
  ConditionSummary,
  NewsletterBox,
  ResultPlants
} from "./result-content";

type Props = {
  params: Promise<{ regionCode: string; env: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateMetadata({
  params,
  searchParams
}: Props): Promise<Metadata> {
  const request = await getRouteRequest(params, searchParams);

  if (!request) {
    return {
      title: "진단 결과를 찾을 수 없습니다"
    };
  }

  const regionName = await getRegionName(request.regionCode);
  const title = `${regionName} 반려식물 진단 결과`;
  const description =
    "지역, 실내외 환경, 안전성, 광량, 관리 부담 조건에 맞는 반려식물 후보를 확인하세요.";

  return {
    title,
    description,
    alternates: {
      canonical: buildDiagnoseResultPath(request)
    },
    openGraph: {
      title: `${title} | 플랜티프렌즈`,
      description,
      type: "website",
      locale: "ko_KR"
    }
  };
}

export default async function DiagnoseResultPage(props: Props) {
  const request = await getRouteRequest(props.params, props.searchParams);

  if (!request || !(await assertRegionExists(request.regionCode))) {
    notFound();
  }

  const [result, regionName] = await Promise.all([
    diagnosePlants(request),
    getRegionName(request.regionCode)
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${regionName} 반려식물 진단 결과`,
    description:
      "사용자가 선택한 지역과 생활 환경 조건에 맞는 반려식물 추천 결과입니다.",
    inLanguage: "ko-KR"
  };

  return (
    <main className="diagnose-result-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="diagnose-result-header">
        <p className="eyebrow">Diagnose Result</p>
        <h1>{regionName} 반려식물 진단 결과</h1>
        <p className="lead">
          선택한 조건에 맞춰 기후 적합도와 관리 부담을 함께 본 추천 결과입니다.
        </p>
        <div className="result-actions">
          <Link className="primary-link" href="/tools/diagnose">
            다시 진단하기
          </Link>
        </div>
      </header>

      <ConditionSummary result={result} regionName={regionName} />
      <ResultPlants result={result} />
      <NewsletterBox />
    </main>
  );
}

async function getRouteRequest(
  paramsPromise: Props["params"],
  searchParamsPromise: Props["searchParams"]
) {
  const [{ regionCode, env }, searchParams] = await Promise.all([
    paramsPromise,
    searchParamsPromise
  ]);

  return parseDiagnoseRouteRequest(regionCode, env, searchParams);
}

async function getRegionName(regionCode: string) {
  const regions = await getRegions();
  const region = regions.find((item) => item.code === regionCode);

  return region ? `${region.sido} ${region.sigungu}` : regionCode;
}
