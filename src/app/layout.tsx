import type { Metadata } from "next";
import Script from "next/script";
import { publicEnv } from "@/env";
import "./globals.css";

const siteUrl = publicEnv.siteUrl;
const GOOGLE_SITE_VERIFICATION =
  "RP69sUcy912-MgKrDEC3ICVzBt5Q_kefbiVQmUOGIWg";

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
  },
  verification: {
    google: GOOGLE_SITE_VERIFICATION
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {publicEnv.adsensePubId ? (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publicEnv.adsensePubId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        ) : null}
        {publicEnv.ga4Id ? (
          <>
            <Script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${publicEnv.ga4Id}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${publicEnv.ga4Id}');
              `}
            </Script>
          </>
        ) : null}
        {children}
      </body>
    </html>
  );
}
