import type { Metadata } from "next";
import { getRegions } from "@/features/diagnose/logic";
import { DiagnoseQuickForm } from "./quick-form";
import { buildOgImageUrl, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from "@/seo/og";
import { publicEnv } from "@/env";

const ogImage = buildOgImageUrl({
  title: "반려식물 진단",
  subtitle: "지역·실내외 환경 기반으로 맞는 식물 후보 추천",
  label: "Quick Diagnose",
});

export const metadata: Metadata = {
  title: "반려식물 진단 — 지역·환경 기반 식물 추천",
  description:
    "서울·경기·부산 등 지역 기후와 실내·베란다·마당 환경을 기준으로 한국 생활에 맞는 반려식물 후보를 바로 찾아보세요.",
  alternates: { canonical: "/tools/diagnose" },
  openGraph: {
    title: "반려식물 진단 | 플랜티프렌즈",
    description:
      "지역 기후·실내외·반려동물 안전 기준으로 내 환경에 맞는 식물을 추천합니다.",
    type: "website",
    locale: "ko_KR",
    images: [
      {
        url: ogImage,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        alt: "반려식물 진단 도구",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "반려식물 진단 | 플랜티프렌즈",
    description: "지역·환경 기반 반려식물 추천 도구",
    images: [ogImage],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "플랜티프렌즈 반려식물 진단",
      url: `${publicEnv.siteUrl}/tools/diagnose`,
      description:
        "지역 기후와 실내외 환경을 기준으로 한국 생활에 맞는 반려식물을 추천하는 진단 도구",
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web",
      inLanguage: "ko-KR",
      offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      publisher: {
        "@type": "Organization",
        name: "플랜티프렌즈",
        url: publicEnv.siteUrl,
      },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "홈",
          item: `${publicEnv.siteUrl}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "반려식물 진단",
          item: `${publicEnv.siteUrl}/tools/diagnose`,
        },
      ],
    },
  ],
};

export default async function DiagnosePage() {
  const regions = await getRegions().catch(() => []);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="tool-shell">
        <section className="tool-hero" aria-labelledby="diagnose-title">
          <p className="eyebrow">Quick Diagnose</p>
          <h1 id="diagnose-title">반려식물 진단</h1>
          <p className="lead">
            지역 기후, 실내·베란다·마당 환경, 반려동물 여부를 기준으로 잘 맞는
            식물을 추려드려요.
          </p>
        </section>
        <DiagnoseQuickForm regions={regions} />

        <section
          className="diagnose-guide"
          aria-labelledby="diagnose-guide-title"
        >
          <h2 id="diagnose-guide-title">진단을 시작하기 전에 확인할 것</h2>
          <p>
            반려식물 진단은 집 안 환경과 생활 패턴을 기준으로 식물 후보를
            추립니다. 빛, 물주기 여유, 안전 조건을 미리 정리해두면 결과를 더
            정확하게 활용할 수 있습니다.
          </p>
          <div className="diagnose-steps">
            <article>
              <h3>1단계: 환경 조건 입력</h3>
              <p>
                실내·베란다·마당 중 어디에 둘지 먼저 정합니다. 같은 지역이라도
                창의 방향과 직사광선 노출 시간에 따라 추천 식물이 달라집니다.
                북향 방은 간접광만 들어오므로 빛 요구량이 낮은 식물이
                적합합니다.
              </p>
            </article>
            <article>
              <h3>2단계: 안전 조건 설정</h3>
              <p>
                강아지, 고양이, 어린 자녀가 있으면 독성 기록이 낮은 식물을 우선
                추려야 합니다. 식물의 잎이나 줄기를 씹었을 때 문제가 생기는 종은
                접근하기 어려운 위치에 두거나 제외하는 것이 좋습니다.
              </p>
            </article>
            <article>
              <h3>3단계: 관리 가능 시간 선택</h3>
              <p>
                물주기, 분무, 영양제 교체 등 주당 관리에 쓸 수 있는 시간을
                현실적으로 고릅니다. 과관리보다 관리 부담이 낮은 식물을 선택하는
                편이 장기적으로 성공률이 높습니다.
              </p>
            </article>
            <article>
              <h3>4단계: 결과 비교 및 선택</h3>
              <p>
                진단 결과로 나온 후보를 기후 적합도, 관리 난이도, 독성 여부로
                비교합니다. 한 번에 여러 식물을 들이기보다 조건이 가장 잘 맞는
                한 종을 먼저 키워보는 방법을 권장합니다.
              </p>
            </article>
          </div>
        </section>

        <section className="diagnose-faq" aria-labelledby="diagnose-faq-title">
          <h2 id="diagnose-faq-title">반려식물 진단 자주 묻는 질문</h2>
          <article>
            <h3>진단 결과는 저장되나요?</h3>
            <p>
              아닙니다. 입력한 지역·환경·안전 조건은 현재 화면의 추천 계산에만
              사용되며 서버에 저장되지 않습니다. 페이지를 새로고침하면
              초기화됩니다.
            </p>
          </article>
          <article>
            <h3>같은 식물이 반복해서 나오는 이유가 있나요?</h3>
            <p>
              입력한 조건(빛, 관리 시간, 안전 점수)에 가장 많이 겹치는 식물이
              상위에 표시됩니다. 조건을 바꾸면 순위도 바뀝니다.
            </p>
          </article>
          <article>
            <h3>지역을 모르면 어떻게 하나요?</h3>
            <p>
              서울·경기 기준으로 선택하면 한국 평균 기후에 가장 가깝습니다.
              제주나 남해안은 겨울 최저 기온이 높으므로 열대성 식물 적합도가
              다소 올라갑니다.
            </p>
          </article>
          <article>
            <h3>진단 결과를 구매 결정에 바로 써도 되나요?</h3>
            <p>
              진단 결과는 탐색의 출발점이며 확정 답이 아닙니다. 실제 구매 전
              해당 식물의 상세 페이지에서 독성 메모, 계절 주의사항, 관리
              난이도를 반드시 확인하세요.
            </p>
          </article>
          <article>
            <h3>반려동물 독성 정보는 어디서 확인하나요?</h3>
            <p>
              플랜티프렌즈의 식물 상세 페이지에 독성 메모가 포함되어 있습니다.
              단, 이 정보는 공개 자료 기반의 참고 정보이며 수의사 진단을
              대체하지 않습니다.
            </p>
          </article>
          <article>
            <h3>같은 조건으로 여러 번 진단해도 결과가 다를 수 있나요?</h3>
            <p>
              동일한 조건을 입력하면 동일한 후보가 나옵니다. 조건 값(빛, 관리
              시간, 독성 기준)을 조금씩 바꿔가며 진단하면 경계선에 있는 식물을
              탐색하는 데 도움이 됩니다.
            </p>
          </article>
          <article>
            <h3>반려동물이 없는 집에서도 독성 정보가 필요한가요?</h3>
            <p>
              방문자나 어린 자녀가 있다면 독성 메모를 함께 확인하는 것이
              좋습니다. 식물 일부를 무심코 만지거나 접촉했을 때 피부 자극을
              일으키는 종도 있으므로 독성 점수는 반려동물 여부와 무관하게 참고
              지표로 활용할 수 있습니다.
            </p>
          </article>
          <article>
            <h3>진단 도구와 식물 상세 페이지의 차이는 무엇인가요?</h3>
            <p>
              진단 도구는 여러 조건을 한 번에 입력해 후보를 좁히는 탐색
              단계입니다. 식물 상세 페이지는 해당 식물의 관리 방법, 계절
              주의사항, 병충해 대응, 독성 메모를 단독으로 깊이 파악하는
              단계입니다. 진단 후 후보 식물의 상세 페이지를 함께 확인하면 결정이
              빠릅니다.
            </p>
          </article>
          <article>
            <h3>진단 결과에 나오지 않는 식물을 찾으려면 어떻게 하나요?</h3>
            <p>
              진단 도구는 입력한 조건에 맞는 후보를 좁히는 용도입니다. 특정
              식물을 직접 찾으려면 검색창에 식물 이름을 입력하거나 카테고리 탐색
              메뉴에서 분류별로 살펴보세요. 원하는 식물이 목록에 없다면 추가
              요청 기능을 통해 의견을 남길 수 있습니다.
            </p>
          </article>
          <article>
            <h3>실내 식물과 베란다 식물은 어떻게 구분하나요?</h3>
            <p>
              직사광선 노출 여부가 핵심 기준입니다. 베란다는 창문 방향에 따라
              직광이 들어오는 경우가 많고, 실내는 간접광만 받는 공간이 대부분
              입니다. 진단 도구에서 배치 환경을 선택하면 각 조건에 맞는 식물
              후보를 별도로 추려볼 수 있습니다.
            </p>
          </article>
        </section>
      </main>
    </>
  );
}
