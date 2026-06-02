import type { Metadata } from "next";
import { getRegions } from "@/features/diagnose/logic";
import { DiagnoseQuickForm } from "./quick-form";
import { buildOgImageUrl, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from "@/seo/og";
import { publicEnv } from "@/env";

const ogImage = buildOgImageUrl({
  title: "반려식물 진단",
  subtitle: "지역·실내외 환경 기반으로 맞는 식물 후보 추천",
  label: "Quick Diagnose"
});

export const metadata: Metadata = {
  title: "반려식물 진단 — 지역·환경 기반 식물 추천",
  description:
    "서울·경기·부산 등 지역 기후와 실내·베란다·마당 환경을 기준으로 한국 생활에 맞는 반려식물 후보를 바로 찾아보세요.",
  alternates: { canonical: "/tools/diagnose" },
  openGraph: {
    title: "반려식물 진단 | 플랜티프렌즈",
    description: "지역 기후·실내외·반려동물 안전 기준으로 내 환경에 맞는 식물을 추천합니다.",
    type: "website",
    locale: "ko_KR",
    images: [{ url: ogImage, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: "반려식물 진단 도구" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "반려식물 진단 | 플랜티프렌즈",
    description: "지역·환경 기반 반려식물 추천 도구",
    images: [ogImage]
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "플랜티프렌즈 반려식물 진단",
      url: `${publicEnv.siteUrl}/tools/diagnose`,
      description: "지역 기후와 실내외 환경을 기준으로 한국 생활에 맞는 반려식물을 추천하는 진단 도구",
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web",
      inLanguage: "ko-KR",
      offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      publisher: { "@type": "Organization", name: "플랜티프렌즈", url: publicEnv.siteUrl }
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "홈", item: `${publicEnv.siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "반려식물 진단", item: `${publicEnv.siteUrl}/tools/diagnose` }
      ]
    }
  ]
};

export default async function DiagnosePage() {
  const regions = await getRegions().catch(() => []);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="tool-shell">
        <section className="tool-hero" aria-labelledby="diagnose-title">
          <p className="eyebrow">Quick Diagnose</p>
          <h1 id="diagnose-title">반려식물 진단</h1>
          <p className="lead">
            지역 기후, 실내·베란다·마당 환경, 반려동물 여부를 기준으로 잘 맞는 식물을 추려드려요.
          </p>
        </section>
        <DiagnoseQuickForm regions={regions} />
      </main>
    </>
  );
}
