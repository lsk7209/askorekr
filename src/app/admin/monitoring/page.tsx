import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "모니터링 대시보드",
  robots: { index: false, follow: false }
};

export const revalidate = 3600;

type GscData = {
  period?: { startDate: string; endDate: string };
  topQueries?: { query: string; impressions: number; clicks: number; ctr: string; position: string }[];
  topPages?: { page: string; clicks: number; impressions: number; ctr: string; position: string }[];
  error?: string;
};

type Ga4Data = {
  period?: { days: number };
  summary?: { sessions: number; newUsers: number; pageViews: number; bounceRate: string } | null;
  topPages?: { page: string; sessions: number; views: number; bounceRate: string; avgDuration: string }[];
  devices?: { device: string; sessions: number; newUsers: number }[];
  error?: string;
};

async function fetchGsc(): Promise<GscData> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://askore.kr";
    const res = await fetch(`${baseUrl}/api/monitoring/gsc?days=30`, {
      next: { revalidate: 3600 }
    });
    return res.ok ? res.json() : { error: "GSC API 오류" };
  } catch {
    return { error: "GSC 연결 실패" };
  }
}

async function fetchGa4(): Promise<Ga4Data> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://askore.kr";
    const res = await fetch(`${baseUrl}/api/monitoring/ga4?days=30`, {
      next: { revalidate: 3600 }
    });
    return res.ok ? res.json() : { error: "GA4 API 오류" };
  } catch {
    return { error: "GA4 연결 실패" };
  }
}

export default async function MonitoringPage() {
  const [gsc, ga4] = await Promise.all([fetchGsc(), fetchGa4()]);

  return (
    <main className="policy-shell">
      <header className="policy-header">
        <p className="eyebrow">Admin</p>
        <h1>모니터링 대시보드</h1>
        <p className="lead">
          GSC·GA4 실시간 데이터 — 최근 30일 기준
        </p>
        <nav className="policy-nav">
          <Link href="/">홈</Link>
          <Link href="/blog">블로그</Link>
          <Link href="/tools/diagnose">진단 도구</Link>
        </nav>
      </header>

      <article className="policy-article">
        {/* GA4 요약 */}
        <section className="policy-section" aria-labelledby="ga4-summary">
          <h2 id="ga4-summary">GA4 — 트래픽 요약</h2>
          {ga4.error ? (
            <p style={{ color: "#9f2f2f" }}>{ga4.error} — GA4_CLIENT_ID, GA4_CLIENT_SECRET, GA4_REFRESH_TOKEN, GA4_PROPERTY_ID 환경 변수를 설정하세요.</p>
          ) : ga4.summary ? (
            <dl className="monitoring-grid">
              <div><dt>세션</dt><dd>{ga4.summary.sessions.toLocaleString()}</dd></div>
              <div><dt>신규 사용자</dt><dd>{ga4.summary.newUsers.toLocaleString()}</dd></div>
              <div><dt>페이지뷰</dt><dd>{ga4.summary.pageViews.toLocaleString()}</dd></div>
              <div><dt>이탈률</dt><dd>{ga4.summary.bounceRate}</dd></div>
            </dl>
          ) : (
            <p>데이터 없음</p>
          )}
        </section>

        {/* GA4 기기별 */}
        {ga4.devices && ga4.devices.length > 0 && (
          <section className="policy-section" aria-labelledby="ga4-devices">
            <h2 id="ga4-devices">GA4 — 기기별 세션</h2>
            <table className="monitoring-table">
              <thead><tr><th>기기</th><th>세션</th><th>신규사용자</th></tr></thead>
              <tbody>
                {ga4.devices.map((d) => (
                  <tr key={d.device}>
                    <td>{d.device}</td>
                    <td>{d.sessions}</td>
                    <td>{d.newUsers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* GA4 상위 페이지 */}
        {ga4.topPages && ga4.topPages.length > 0 && (
          <section className="policy-section" aria-labelledby="ga4-pages">
            <h2 id="ga4-pages">GA4 — 상위 페이지</h2>
            <table className="monitoring-table">
              <thead><tr><th>페이지</th><th>세션</th><th>뷰</th><th>이탈률</th><th>체류시간</th></tr></thead>
              <tbody>
                {ga4.topPages.map((p) => (
                  <tr key={p.page}>
                    <td><Link href={p.page} style={{ color: "var(--sage-dark)" }}>{p.page}</Link></td>
                    <td>{p.sessions}</td>
                    <td>{p.views}</td>
                    <td>{p.bounceRate}</td>
                    <td>{p.avgDuration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* GSC */}
        <section className="policy-section" aria-labelledby="gsc-section">
          <h2 id="gsc-section">GSC — 검색 성과</h2>
          {gsc.error ? (
            <p style={{ color: "#9f2f2f" }}>{gsc.error} — GSC_API_CLIENT_ID, GSC_API_CLIENT_SECRET, GSC_REFRESH_TOKEN 환경 변수를 설정하세요.</p>
          ) : (
            <>
              {gsc.topQueries && gsc.topQueries.length > 0 ? (
                <>
                  <h3>상위 검색 쿼리</h3>
                  <table className="monitoring-table">
                    <thead><tr><th>키워드</th><th>노출</th><th>클릭</th><th>CTR</th><th>순위</th></tr></thead>
                    <tbody>
                      {gsc.topQueries.map((q) => (
                        <tr key={q.query}>
                          <td>{q.query}</td>
                          <td>{q.impressions}</td>
                          <td>{q.clicks}</td>
                          <td>{q.ctr}</td>
                          <td>{q.position}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <p>⚠️ 검색 쿼리 데이터 없음 — 사이트가 아직 색인 중입니다. 사이트맵 재제출 및 IndexNow 등록이 완료되었습니다.</p>
              )}

              {gsc.topPages && gsc.topPages.length > 0 && (
                <>
                  <h3 style={{ marginTop: "20px" }}>상위 페이지</h3>
                  <table className="monitoring-table">
                    <thead><tr><th>페이지</th><th>클릭</th><th>노출</th><th>CTR</th><th>순위</th></tr></thead>
                    <tbody>
                      {gsc.topPages.map((p) => (
                        <tr key={p.page}>
                          <td style={{ fontSize: "13px", wordBreak: "break-all" }}>{p.page}</td>
                          <td>{p.clicks}</td>
                          <td>{p.impressions}</td>
                          <td>{p.ctr}</td>
                          <td>{p.position}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </>
          )}
        </section>

        {/* 색인 현황 안내 */}
        <section className="policy-section" aria-labelledby="index-status">
          <h2 id="index-status">색인 현황 및 조치 사항</h2>
          <ul>
            <li>✅ GSC 사이트맵 재제출 완료 (non-www 통일)</li>
            <li>✅ www → non-www 리다이렉트 활성화</li>
            <li>✅ Bing IndexNow 제출 완료</li>
            <li>✅ Organization 구조화 데이터 추가</li>
            <li>⏳ Google 색인 대기 중 (사이트 신규, 1~4주 소요)</li>
            <li>📋 다음 단계: Vercel 환경 변수에 GSC/GA4 자격증명 설정</li>
          </ul>
        </section>

        {/* 환경 변수 설정 안내 */}
        <section className="policy-section" aria-labelledby="env-guide">
          <h2 id="env-guide">필요한 환경 변수 (Vercel 대시보드에서 설정)</h2>
          <pre style={{ fontSize: "13px", background: "#f2f0e5", padding: "16px", borderRadius: "8px", overflowX: "auto" }}>{`# GSC (Google Search Console)
GSC_API_CLIENT_ID=619198158088-...
GSC_API_CLIENT_SECRET=GOCSPX-...
GSC_REFRESH_TOKEN=1//0eM5...

# GA4 (Google Analytics 4)
GA4_CLIENT_ID=619198158088-...
GA4_CLIENT_SECRET=GOCSPX-...
GA4_REFRESH_TOKEN=1//0e18...
GA4_PROPERTY_ID=536871374

# IndexNow
INDEXNOW_KEY=plantyfriends-askore-2026

# Gemini AI (블로그 생성)
GEMINI_API_KEY=AQ.Ab8RN6...`}</pre>
        </section>
      </article>

      <footer className="policy-footer">
        <p>마지막 업데이트: {new Date().toLocaleDateString("ko-KR")}</p>
      </footer>
    </main>
  );
}
