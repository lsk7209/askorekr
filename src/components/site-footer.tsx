import Link from "next/link";
import styles from "./site-footer.module.css";

const NAV_LINKS = [
  { href: "/tools/diagnose", label: "식물 진단" },
  { href: "/blog", label: "블로그" },
  { href: "/category/indoor-foliage", label: "실내 관엽" },
  { href: "/category/herbs", label: "허브" },
  { href: "/category/balcony-trees", label: "베란다 나무" }
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
    <footer className={styles.footer}>
      <div className={styles.layout}>
        <div className={styles.grid}>
          <div>
            <div className={`${styles.eyebrow} ${styles.mono}`}>MAKE ROOM FOR GREEN</div>
            <div className={styles.title}>
              PLANTY<span aria-hidden="true">✳</span>
            </div>
            <p className={styles.note}>
              식물과 사람이 함께 살기 좋은 집을 연구합니다.
              <br />
              우리 집에 맞는 식물부터, 오래 잘 키우는 방법까지.
            </p>
          </div>
          <nav className={styles.nav} aria-label="바닥글 주요 메뉴">
            <Link href="/" className={styles.brand}>플랜티프렌즈</Link>
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href}>{label}</Link>
            ))}
          </nav>
        </div>
        <nav className={styles.policy} aria-label="사이트 정보">
          {POLICY_LINKS.map(({ href, label }) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
        </nav>
        <div className={styles.bottom}>
          <span className={styles.mono}>© {new Date().getFullYear()} 플랜티프렌즈</span>
          <span>본 사이트의 정보는 참고용이며 전문가 상담을 대체하지 않습니다.</span>
        </div>
      </div>
    </footer>
  );
}
