import type { Metadata } from "next";
import Script from "next/script";
import { publicEnv } from "@/env";
import { buildOgImageUrl, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from "@/seo/og";
import "./globals.css";

const siteUrl = publicEnv.siteUrl;
const GOOGLE_SITE_VERIFICATION =
  "RP69sUcy912-MgKrDEC3ICVzBt5Q_kefbiVQmUOGIWg";
const NAVER_SITE_VERIFICATION = "abcfd7fa27ee16b626d8d096c9a984a2fcbee6c8";
const defaultOgImage = buildOgImageUrl({
  title: "플랜티프렌즈",
  subtitle: "한국 집에 맞는 반려식물 선택 가이드"
});

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
    type: "website",
    images: [
      {
        url: defaultOgImage,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        alt: "플랜티프렌즈 대표 이미지"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "플랜티프렌즈",
    description: "한국 집에 맞는 반려식물 선택 가이드",
    images: [defaultOgImage]
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
    google: GOOGLE_SITE_VERIFICATION,
    other: {
      "naver-site-verification": NAVER_SITE_VERIFICATION
    }
  }
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "플랜티프렌즈",
  url: siteUrl,
  logo: `${siteUrl}/icon.svg`,
  description: "한국 기후 적합도와 생활 환경에 맞는 반려식물 정보를 제공하는 데이터 기반 가드닝 사이트",
  sameAs: []
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css"
          as="style"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
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
                gtag('config', '${publicEnv.ga4Id}', {
                  page_path: window.location.pathname,
                  send_page_view: true
                });
              `}
            </Script>
          </>
        ) : null}
        {children}
      </body>
    </html>
  );
}
