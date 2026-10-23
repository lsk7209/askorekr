"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import styles from "./site-header.module.css";

// 홈 섹션 앵커는 하위 페이지에서도 홈으로 이동하도록 항상 "/#id" 형태를 쓴다.
const SECTION_LINKS = [
  { href: "/#how", label: "입주 절차" },
  { href: "/#dossier", label: "식물 입주자 명부" },
  { href: "/#sos", label: "식물 SOS" },
  { href: "/#season", label: "시즌 리포트" }
] as const;

const INFO_LINKS = [
  { href: "/about", label: "소개" },
  { href: "/contact", label: "문의" }
] as const;

const DIAGNOSE_HREF = "/tools/diagnose";

export function SiteHeader() {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const toggleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (menuRef.current) menuRef.current.open = false;
  }, [pathname]);

  const current = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined;
  const close = () => {
    if (menuRef.current) menuRef.current.open = false;
  };

  return (
    <header className={styles.header}>
      <div className={`${styles.topline} ${styles.mono}`}>
        <span>THE PLANT RESIDENCE BUREAU</span>
        <span className={styles.toplineLinks}>
          <Link href="/about" aria-current={current("/about")}>소개</Link>
          <Link href="/contact" aria-current={current("/contact")}>문의</Link>
        </span>
      </div>
      <div className={`${styles.layout} ${styles.nav}`}>
          <Link href="/" className={styles.wordmark} aria-label="플랜티프렌즈 홈으로" onClick={close}>
            <span className={styles.mark} aria-hidden="true">✳</span>
            <span>
              <span className={styles.wordmarkTitle}>PLANTY</span>
              <span className={`${styles.wordmarkSub} ${styles.mono}`}>HOUSE LAB / 플랜티프렌즈</span>
            </span>
          </Link>
          <nav className={`${styles.links} ${styles.desktopOnly}`} aria-label="주 메뉴">
            {SECTION_LINKS.map(({ href, label }) => (
              <Link key={href} href={href}>{label}</Link>
            ))}
            <Link href="/blog" aria-current={current("/blog")}>가드닝 저널</Link>
          </nav>
          <Link
            href={DIAGNOSE_HREF}
            className={`${styles.cta} ${styles.desktopOnly}`}
            aria-current={current(DIAGNOSE_HREF)}
          >
            입주 심사 시작 <span className={styles.arrow} aria-hidden="true">↗</span>
          </Link>
          <details
            ref={menuRef}
            className={styles.mobileMenu}
            onKeyDown={(event) => {
              if (event.key === "Escape" && menuRef.current?.open) {
                event.preventDefault();
                close();
                toggleRef.current?.focus();
              }
            }}
          >
            <summary ref={toggleRef} className={styles.toggle}>
              <span className={styles.openLabel}>메뉴 열기</span>
              <span className={styles.closeLabel}>메뉴 닫기</span>
            </summary>
            <nav className={styles.links} aria-label="모바일 주 메뉴">
              {SECTION_LINKS.map(({ href, label }) => (
                <Link key={href} href={href} onClick={close}>{label}</Link>
              ))}
              <Link href="/blog" aria-current={current("/blog")} onClick={close}>가드닝 저널</Link>
              {INFO_LINKS.map(({ href, label }) => (
                <Link key={href} href={href} aria-current={current(href)} onClick={close}>{label}</Link>
              ))}
              <Link href={DIAGNOSE_HREF} className={styles.cta} aria-current={current(DIAGNOSE_HREF)} onClick={close}>
                입주 심사 시작 <span aria-hidden="true">↗</span>
              </Link>
            </nav>
          </details>
      </div>
    </header>
  );
}
