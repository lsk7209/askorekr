import type { Metadata } from "next";
import Link from "next/link";
import { publicEnv } from "@/env";
import { CONTACT_EMAIL } from "@/lib/site-contact";

const UPDATED_AT = "2026-10-22";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description:
    "플랜티프렌즈의 개인정보 수집 항목, 이용 목적, Google AdSense 쿠키·맞춤형 광고, 보유 기간과 이용자 권리를 안내합니다.",
  alternates: {
    canonical: "/privacy"
  },
  openGraph: {
    title: "개인정보처리방침 | 플랜티프렌즈",
    description: "사이트 이용 중 처리될 수 있는 개인정보 기준을 안내합니다.",
    type: "website",
    locale: "ko_KR"
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "플랜티프렌즈 개인정보처리방침",
  url: `${publicEnv.siteUrl}/privacy`,
  inLanguage: "ko-KR",
  publisher: { "@type": "Organization", name: "플랜티프렌즈", url: publicEnv.siteUrl }
};

export default function PrivacyPage() {
  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <main className="policy-shell">
      <header className="policy-header">
        <p className="eyebrow">Privacy</p>
        <h1>개인정보처리방침</h1>
        <p className="lead">
          플랜티프렌즈는 서비스 제공에 필요한 최소 범위에서 개인정보를
          처리합니다.
        </p>
        <PolicyNav />
      </header>

      <article className="policy-article">
        <section className="policy-section" aria-labelledby="collect-title">
          <h2 id="collect-title">1. 수집 항목과 방법</h2>
          <p>
            플랜티프렌즈는 회원가입 기능을 제공하지 않으며, 이름·연락처 같은
            정보를 입력받는 양식도 운영하지 않습니다. 처리될 수 있는 정보는
            다음과 같습니다.
          </p>
          <ul>
            <li>
              <strong>문의 이메일</strong>: 이용자가 직접 보낸 이메일 주소와 문의
              내용
            </li>
            <li>
              <strong>자동 수집 정보</strong>: 접속 IP 주소, 브라우저·기기 종류,
              방문 일시, 방문 페이지, 쿠키 식별자 (서비스 이용 과정에서 자동 생성)
            </li>
          </ul>
        </section>

        <section className="policy-section" aria-labelledby="purpose-title">
          <h2 id="purpose-title">2. 이용 목적</h2>
          <ul>
            <li>문의·오류 제보에 대한 확인과 회신</li>
            <li>방문 통계 분석을 통한 콘텐츠·사이트 품질 개선</li>
            <li>광고 게재 및 부정 이용(비정상 트래픽) 방지</li>
          </ul>
        </section>

        <section className="policy-section" aria-labelledby="ads-title">
          <h2 id="ads-title">3. 쿠키와 맞춤형 광고 (Google AdSense)</h2>
          <p>
            이 사이트는 Google AdSense로 광고를 게재합니다. Google을 포함한
            제3자 공급업체는 쿠키를 사용해 이용자의 이 사이트 또는 다른
            웹사이트 방문 기록을 바탕으로 광고를 게재합니다. Google은 광고
            쿠키를 사용해 Google과 파트너가 이용자의 인터넷 방문 기록에 기반한
            광고를 제공할 수 있도록 합니다.
          </p>
          <p>
            이용자는{" "}
            <a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer" className="text-link">
              Google 내 광고 센터
            </a>
            에서 맞춤형 광고를 해제할 수 있으며,{" "}
            <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-link">
              aboutads.info
            </a>
            에서 제3자 공급업체의 맞춤형 광고 쿠키 사용을 거부할 수 있습니다.
            Google의 데이터 사용 방식은{" "}
            <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="text-link">
              Google 파트너 사이트 데이터 사용 안내
            </a>
            에서 확인할 수 있습니다.
          </p>
        </section>

        <section className="policy-section" aria-labelledby="analytics-title">
          <h2 id="analytics-title">4. 방문 분석 (Google Analytics)</h2>
          <p>
            사이트 이용 현황을 파악하기 위해 Google Analytics를 사용합니다.
            수집된 정보는 개인을 식별하지 않는 통계 형태로만 확인합니다. 분석
            수집을 원하지 않으면{" "}
            <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-link">
              Google 애널리틱스 차단 브라우저 부가기능
            </a>
            을 설치할 수 있습니다.
          </p>
        </section>

        <section className="policy-section" aria-labelledby="cookie-title">
          <h2 id="cookie-title">5. 쿠키 거부 방법</h2>
          <p>
            이용자는 브라우저 설정에서 쿠키 저장을 거부하거나 삭제할 수
            있습니다. (Chrome: 설정 → 개인정보 및 보안 → 서드파티 쿠키 / Safari:
            설정 → 개인정보 보호 / Edge: 설정 → 쿠키 및 사이트 권한) 쿠키를
            거부해도 사이트의 식물 정보와 진단 도구는 그대로 이용할 수 있습니다.
          </p>
        </section>

        <section className="policy-section" aria-labelledby="outsourcing-title">
          <h2 id="outsourcing-title">6. 처리 위탁 및 국외 이전</h2>
          <p>서비스 운영을 위해 아래 사업자의 서비스를 이용하며, 이 과정에서 정보가 국외(미국)에서 처리될 수 있습니다.</p>
          <ul>
            <li>Google LLC — 광고 게재(AdSense), 방문 분석(Analytics)</li>
            <li>Vercel Inc. — 웹사이트 호스팅 및 접속 로그 처리</li>
          </ul>
        </section>

        <section className="policy-section" aria-labelledby="retention-title">
          <h2 id="retention-title">7. 보유 기간과 파기</h2>
          <p>
            문의 이메일은 회신 완료 후 1년이 지나면 지체 없이 파기합니다. 전자적
            파일은 복구할 수 없는 방법으로 삭제하며, 법령에 따라 보관이 필요한
            경우에는 해당 기간 동안 분리 보관합니다. 쿠키와 분석 데이터는 각
            서비스 제공자의 보존 정책을 따릅니다.
          </p>
        </section>

        <section className="policy-section" aria-labelledby="rights-title">
          <h2 id="rights-title">8. 이용자 권리</h2>
          <p>
            이용자는 언제든지 본인 개인정보의 열람, 정정, 삭제, 처리 정지를
            요청할 수 있습니다. 요청은 아래 이메일로 접수하며, 확인 후 지체 없이
            조치합니다. 플랜티프렌즈는 만 14세 미만 아동의 개인정보를 의도적으로
            수집하지 않습니다.
          </p>
        </section>

        <section className="policy-section" aria-labelledby="officer-title">
          <h2 id="officer-title">9. 개인정보 보호책임자</h2>
          <ul>
            <li>담당: 플랜티프렌즈 운영자</li>
            <li>
              이메일: <a href={`mailto:${CONTACT_EMAIL}`} className="text-link">{CONTACT_EMAIL}</a>
            </li>
          </ul>
          <p>
            개인정보 침해에 대한 상담이 필요하면 개인정보침해신고센터
            (privacy.kisa.or.kr, 국번 없이 118) 또는 개인정보분쟁조정위원회
            (www.kopico.go.kr, 1833-6972)에 문의할 수 있습니다.
          </p>
        </section>

        <section className="policy-section" aria-labelledby="change-title">
          <h2 id="change-title">10. 방침 변경</h2>
          <p>
            이 방침이 바뀌면 시행일과 함께 이 페이지에 공지합니다.
          </p>
        </section>
      </article>

      <footer className="policy-footer">
        <p>시행일 및 마지막 업데이트: {UPDATED_AT}</p>
      </footer>
    </main>
    </>
  );
}

function PolicyNav() {
  return (
    <nav className="policy-nav" aria-label="보조 페이지">
      <Link href="/about">소개</Link>
      <Link href="/contact">문의</Link>
      <Link href="/privacy">개인정보처리방침</Link>
      <Link href="/terms">이용약관</Link>
      <Link href="/disclaimer">면책 고지</Link>
    </nav>
  );
}
