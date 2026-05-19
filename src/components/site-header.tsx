"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/tools/diagnose", label: "진단" },
  { href: "/blog", label: "블로그" },
  { href: "/about", label: "소개" },
  { href: "/contact", label: "문의" }
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="home-header">
      <nav className="home-nav" aria-label="주요 메뉴">
        <Link href="/">플랜티프렌즈</Link>
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname.startsWith(href) ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
