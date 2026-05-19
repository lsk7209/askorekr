import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="home-footer">
      <nav aria-label="사이트 정보">
        <Link href="/about">소개</Link>
        <Link href="/privacy">개인정보처리방침</Link>
        <Link href="/terms">이용약관</Link>
        <Link href="/disclaimer">면책 고지</Link>
        <Link href="/contact">문의</Link>
      </nav>
    </footer>
  );
}
