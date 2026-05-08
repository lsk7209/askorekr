import Link from "next/link";

const phaseItems = [
  "Next.js 15 App Router",
  "Drizzle ORM + libSQL/Turso 스키마",
  "페르소나·금지어 설정",
  "진단·도감·카테고리 샘플 흐름"
] as const;

const entryLinks = [
  { href: "/tools/diagnose", label: "반려식물 진단" },
  { href: "/category/indoor-foliage", label: "실내 관엽식물" },
  { href: "/category/herbs", label: "허브" }
] as const;

export default function Home() {
  return (
    <main className="site-shell">
      <section className="hero" aria-labelledby="home-title">
        <p className="eyebrow">PlantyFriends Phase 0</p>
        <h1 id="home-title">플랜티프렌즈</h1>
        <p className="lead">
          한국 기후와 생활 환경에 맞는 반려식물 선택을 돕는 데이터 기반
          가드닝 플랫폼입니다.
        </p>
        <div className="entry-links" aria-label="주요 진입점">
          {entryLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="status-panel" aria-labelledby="phase-title">
        <h2 id="phase-title">현재 구축 범위</h2>
        <ul>
          {phaseItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
