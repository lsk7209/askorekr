import type { Metadata } from "next";
import Script from "next/script";
import { publicEnv } from "@/env";
import "./globals.css";

const siteUrl = publicEnv.siteUrl;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "플랜티프렌즈 | 한국형 반려식물 가이드",
    template: "%s | 플랜티프렌즈"
  },
  description:
    "한국 기후 적합도, 반려동물 안전성, 난이도, 꽃말까지 함께 보는 데이터 기반 반려식물 가이드입니다.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "플랜티프렌즈",
    description: "한국형 반려식물·가드닝 pSEO 사이트",
    url: siteUrl,
    siteName: "플랜티프렌즈",
    locale: "ko_KR",
    type: "website"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large"
    }
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {publicEnv.adsensePubId ? (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publicEnv.adsensePubId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        ) : null}
      </head>
      <body>{children}</body>
    </html>
  );
}
