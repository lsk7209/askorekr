import Link from "next/link";

const NAV_LINKS = [
  { href: "/tools/diagnose", label: "식물 진단" },
  { href: "/blog", label: "블로그" },
  { href: "/category/indoor-foliage", label: "실내 관엽" },
  { href: "/category/herbs", label: "허브" }
] as const;

const POLICY_LINKS = [
  { href: "/about", label: "소개" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/terms", label: "이용약관" },
  { href: "/disclaimer", label: "면책 고지" },
  { href: "/contact", label: "문의" }
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <nav className="site-footer-nav" aria-label="주요 메뉴">
          <Link href="/" className="site-footer-brand">플랜티프렌즈</Link>
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
        </nav>
        <nav className="site-footer-policy" aria-label="사이트 정보">
          {POLICY_LINKS.map(({ href, label }) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
        </nav>
        <p className="site-footer-copy">
          © {new Date().getFullYear()} 플랜티프렌즈. 본 사이트의 정보는 참고용이며 전문가 상담을 대체하지 않습니다.
        </p>
      </div>
    </footer>
  );
}
