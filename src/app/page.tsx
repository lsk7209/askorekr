import Link from "next/link";
import { AdsenseAd } from "@/components/adsense-ad";
import { HouseExplorer } from "@/components/home/house-explorer";
import {
  SeasonArt,
  SosDrawing,
  SpecimenHerbs,
  SpecimenIndoor,
  SpecimenTrees
} from "@/components/home/home-art";
import styles from "@/components/home/home.module.css";
import { publicEnv } from "@/env";
import { getPublishedBlogPosts, type BlogListItem } from "@/features/blog/queries";

export const revalidate = 3600;
export const dynamic = "force-static";

const SOS_HREF = `/blog?cat=${encodeURIComponent("병충해")}`;
const SEASON_HREF = `/blog?cat=${encodeURIComponent("계절관리")}`;

const processSteps = [
  { count: "CHECK / 01", icon: "⌂", title: "공간", body: "실내와 실외 중 어디에 둘 예정인가요?" },
  { count: "CHECK / 02", icon: "☼", title: "빛", body: "햇빛과 그늘의 정도를 함께 살펴봅니다." },
  { count: "CHECK / 03", icon: "♧", title: "생활", body: "돌볼 시간과 반려동물 등 실제 생활을 고려합니다." },
  { count: "MATCH / 04", icon: "↗", title: "비교", body: "추천 후보의 환경 조건과 주의사항을 확인합니다." }
] as const;

const seasonNotes = [
  {
    title: "봄·여름: 성장기 집중 관리",
    body: "기온이 오르면 식물의 수분 흡수량이 빠르게 늘어납니다. 물주기 간격을 줄이고, 분갈이가 필요한지 뿌리를 확인합니다. 직사광선은 잎 화상을 일으킬 수 있으므로 커튼 필터링을 병행하세요."
  },
  {
    title: "가을·겨울: 휴면기 과관리 주의",
    body: "성장 속도가 느려지는 시기에는 물주기와 비료를 줄여야 합니다. 난방으로 실내가 건조해지면 잎 끝이 마르기 쉽습니다. 가습기나 분무로 습도를 보충하되 잎에 물이 고이지 않도록 주의하세요."
  },
  {
    title: "장마철: 과습·곰팡이 대응",
    body: "비가 많은 시기에는 흙이 마르지 않아 뿌리가 상하기 쉽습니다. 통풍을 늘리고 물주기 전 반드시 흙 2~3cm 깊이가 마른지 확인합니다. 배수 구멍이 막혀 있으면 즉시 청소하세요."
  }
] as const;

const standards = [
  {
    no: "01",
    title: "한국의 생활환경",
    body: "지역 기후와 실내외 조건에 대한 공개 자료 및 사이트 편집 기준을 바탕으로 살펴봅니다. 해외 가이드의 평균 온도만 보지 않고 서울 기준 기후 적합도와 계절 관리 부담을 함께 정리합니다."
  },
  {
    no: "02",
    title: "관리 부담과 안전 조건",
    body: "관리 난이도와 반려동물 독성 관련 정보는 조건과 주의점을 분명히 구분합니다. 강아지, 고양이, 어린 자녀가 있는 집은 독성 기록과 접촉 가능성을 함께 봐야 하며, 안전 점수는 추천 순위에 반영됩니다."
  },
  {
    no: "03",
    title: "정보와 판단의 경계",
    body: "추천 결과는 선택을 돕는 참고 정보이며, 중독·알레르기 등 긴급 상황에서는 전문가의 진료가 필요합니다. 확정되지 않은 의학적 효능이나 치료 효과는 안내하지 않습니다."
  }
] as const;

const faqs = [
  {
    question: "초보자가 처음 고를 식물은 무엇인가요?",
    answer:
      "특정 이름보다 놓을 공간의 빛, 관리 가능한 시간, 가족 구성 등을 먼저 확인한 뒤 후보 식물을 비교하는 것이 좋습니다. 플랜티프렌즈 진단 도구를 활용할 수 있습니다."
  },
  {
    question: "반려동물과 함께 살면 식물을 키울 수 없나요?",
    answer:
      "모든 식물이 동일한 위험을 갖는 것은 아닙니다. 개별 식물의 독성 자료와 반려동물의 접근 가능성을 확인하고, 섭취가 의심되면 수의사에게 바로 문의해야 합니다."
  },
  {
    question: "집 그림을 눌러 바로 추천 결과가 나오는 건가요?",
    answer:
      "아니요. 집 그림에서는 거실·작은 방·베란다에서 살펴볼 환경 조건을 안내할 뿐, 선택한 값이 저장되거나 추천 계산에 쓰이지는 않습니다. 실제 추천은 반려식물 진단 도구에서 지역·환경·빛·관리 여건·반려동물과 아이 안전 조건을 입력한 뒤 확인해 주세요."
  },
  {
    question: "플랜티프렌즈의 정보는 전문가 진단인가요?",
    answer:
      "아닙니다. 공개 자료와 편집 기준을 바탕으로 정리한 생활 가이드이며, 섭취·중독·알레르기 의심 상황은 전문가 상담이 필요합니다."
  },
  {
    question: "원하는 식물 정보는 어떻게 찾을 수 있나요?",
    answer:
      "실내 관엽식물·허브·베란다 나무 등 주제별 카테고리 분류에서 식물을 직접 탐색할 수 있습니다. 어떤 식물이 맞는지 모를 때는 거주 지역과 환경 조건을 입력하는 반려식물 진단 도구를 활용하면 후보 목록을 쉽게 좁힐 수 있습니다."
  }
] as const;

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "플랜티프렌즈",
      url: publicEnv.siteUrl,
      inLanguage: "ko-KR",
      description:
        "한국 생활 환경에 맞는 반려식물 선택을 돕는 데이터 기반 가드닝 가이드"
      // SearchAction(Sitelinks 검색창)은 제거했다. /tools/diagnose가 q 쿼리
      // 파라미터를 처리하는 텍스트 검색 기능을 실제로 제공하지 않아, 이 마크업이
      // 있으면 검색 결과의 검색창이 동작하지 않는 기능을 약속하게 된다 (SEO-02).
      // 실제 이름 검색 라우트가 구현되면 그때 다시 추가한다.
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer
        }
      }))
    }
  ]
};

type RecentPosts = { status: "ok"; posts: BlogListItem[] } | { status: "error" };

async function loadRecentPosts(): Promise<RecentPosts> {
  try {
    return { status: "ok", posts: await getPublishedBlogPosts(4, 0) };
  } catch {
    return { status: "error" };
  }
}

function formatPostDate(date: Date | null) {
  if (!date || Number.isNaN(date.getTime())) return null;
  return {
    iso: date.toISOString(),
    label: date.toLocaleDateString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  };
}

// 광고는 메뉴·공간 선택·CTA와 구분되는 별도 띠로 표시한다. 설정이 없으면 띠 자체를 그리지 않는다.
function AdBand({ slot, label }: { slot?: string; label: string }) {
  const publisherId = publicEnv.adsensePubId;
  if (!publisherId || !slot) return null;
  return (
    <div className={styles.adBand}>
      <span className={`${styles.adLabel} ${styles.mono}`}>광고</span>
      <AdsenseAd publisherId={publisherId} slot={slot} label={label} />
    </div>
  );
}

export default async function Home() {
  const recent = await loadRecentPosts();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className={styles.home}>
        <section className={styles.hero} aria-labelledby="home-title">
          <div className={`${styles.layout} ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <div className={`${styles.heroEyebrow} ${styles.mono}`}>
                <span className={styles.liveDot} aria-hidden="true" /> PLANTY HOUSE LAB / VOL. 01
              </div>
              <h1 id="home-title">
                <span className={styles.line}>식물도,</span>
                <span className={`${styles.line} ${styles.outlined}`}>살 집을</span>
                <span className={styles.line}>고릅니다.</span>
              </h1>
              <p className={styles.heroLead}>
                햇살 좋은 거실과 서늘한 작은 방에는
                <br />
                <b>서로 다른 식물 이웃</b>이 필요합니다.
                <br />
                우리 집에 어울리는 반려식물, 초록의 입주자를 찾아보세요.
              </p>
              <div className={styles.ctaRow}>
                <Link href="/tools/diagnose" className={styles.buttonMain}>
                  우리 집 식물 찾기 <span aria-hidden="true">↗</span>
                </Link>
                <Link href="/#dossier" className={styles.textCta}>
                  식물 입주자 구경하기 <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className={styles.heroAside}>
                <div>
                  <span className={styles.mono}>01 / SPACE</span>
                  <strong>우리 집 배치 환경</strong>
                </div>
                <div>
                  <span className={styles.mono}>02 / CLIMATE</span>
                  <strong>한국 지역 기후</strong>
                </div>
                <div>
                  <span className={styles.mono}>03 / SAFETY</span>
                  <strong>함께 사는 가족</strong>
                </div>
              </div>
            </div>
            <HouseExplorer />
          </div>
        </section>

        <div className={styles.strip} aria-hidden="true">
          <div className={`${styles.layout} ${styles.stripInner} ${styles.mono}`}>
            <span>BETTER HOME</span>
            <span className={styles.cross}>✳</span>
            <span>BETTER PLANTS</span>
            <span className={styles.cross}>✳</span>
            <span>BETTER LIVING</span>
            <span className={styles.cross}>✳</span>
          </div>
        </div>

        <section id="how" className={styles.section} aria-labelledby="how-title">
          <div className={styles.layout}>
            <div className={styles.sectionIntro}>
              <div>
                <span className={`${styles.sectionIndex} ${styles.mono}`}>[ 01 / HOW TO MATCH ]</span>
                <h2 id="how-title" className={styles.sectionTitle}>
                  좋은 식물보다,
                  <br />
                  나에게 맞는 식물.
                </h2>
              </div>
              <p>
                이름이 예쁘다는 이유만으로 데려오기엔 식물마다 원하는 환경이 다릅니다. 플랜티프렌즈는 집의
                조건부터 살펴보는 방식을 제안합니다.
              </p>
            </div>
            <ol className={styles.process} aria-label="식물 찾기 과정">
              {processSteps.map((step) => (
                <li key={step.title} className={styles.processStep}>
                  <span className={`${styles.processCount} ${styles.mono}`}>{step.count}</span>
                  <span className={styles.processIcon} aria-hidden="true">
                    {step.icon}
                  </span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <AdBand slot={publicEnv.adsenseSlots.homeTop} label="홈 상단 광고" />

        <section id="dossier" className={`${styles.section} ${styles.indexSection}`} aria-labelledby="dossier-title">
          <div className={styles.layout}>
            <div className={styles.sectionIntro}>
              <div>
                <span className={`${styles.sectionIndex} ${styles.mono}`}>[ 02 / THE RESIDENT INDEX ]</span>
                <h2 id="dossier-title" className={styles.sectionTitle}>
                  식물 입주자 명부<span style={{ color: "#d9482d" }}>.</span>
                </h2>
              </div>
              <div>
                <p>
                  성격을 단정하는 식물 MBTI 대신, 빛과 공간·관리에 따라 식물을 비교하는 실용 도감입니다.
                </p>
                <Link className={styles.indexDetail} href="/tools/diagnose">
                  환경에 맞는 후보 추천 받기 <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>
            <div className={styles.specimens}>
              <Link
                className={`${styles.specimen} ${styles.specimenA}`}
                href="/category/indoor-foliage"
                aria-label="실내 관엽식물 도감 열기"
              >
                <div className={`${styles.specimenTop} ${styles.mono}`}>
                  <span>SPECIMEN / 001</span>
                  <i aria-hidden="true">↗</i>
                </div>
                <div className={styles.specimenArt}>
                  <SpecimenIndoor />
                  <span className={`${styles.artCaption} ${styles.mono}`}>INDOOR / FOLIAGE</span>
                </div>
                <div className={styles.specimenBottom}>
                  <div>
                    <p className={`${styles.caption} ${styles.mono}`}>FILE NO. 001 / GREEN INTERIOR</p>
                    <h3>실내 관엽식물</h3>
                    <p>거실과 방의 빛·습도를 비교해 보세요.</p>
                  </div>
                  <span className={styles.specimenArrow} aria-hidden="true">↗</span>
                </div>
              </Link>
              <Link
                className={`${styles.specimen} ${styles.specimenB}`}
                href="/category/herbs"
                aria-label="허브 도감 열기"
              >
                <div className={`${styles.specimenTop} ${styles.mono}`}>
                  <span>SPECIMEN / 002</span>
                  <i aria-hidden="true">↗</i>
                </div>
                <div className={styles.specimenArt}>
                  <SpecimenHerbs />
                  <span className={`${styles.artCaption} ${styles.mono}`}>KITCHEN / HERBS</span>
                </div>
                <div className={styles.specimenBottom}>
                  <div>
                    <p className={`${styles.caption} ${styles.mono}`}>FILE NO. 002 / SCENT &amp; FLAVOR</p>
                    <h3>향긋한 허브</h3>
                    <p>채광·물주기·활용법을 함께 살펴보세요.</p>
                  </div>
                  <span className={styles.specimenArrow} aria-hidden="true">↗</span>
                </div>
              </Link>
              <Link
                className={`${styles.specimen} ${styles.specimenC}`}
                href="/category/balcony-trees"
                aria-label="베란다 나무 도감 열기"
              >
                <div className={`${styles.specimenTop} ${styles.mono}`}>
                  <span>SPECIMEN / 003</span>
                  <i aria-hidden="true">↗</i>
                </div>
                <div className={styles.specimenArt}>
                  <SpecimenTrees />
                  <span className={`${styles.artCaption} ${styles.mono}`}>BALCONY / TREES</span>
                </div>
                <div className={styles.specimenBottom}>
                  <div>
                    <p className={`${styles.caption} ${styles.mono}`}>FILE NO. 003 / OUTDOOR SPACE</p>
                    <h3>베란다 나무</h3>
                    <p>공간과 계절의 온도 차이를 확인하세요.</p>
                  </div>
                  <span className={styles.specimenArrow} aria-hidden="true">↗</span>
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section id="sos" className={styles.sos} aria-labelledby="sos-title">
          <div className={`${styles.layout} ${styles.sosGrid}`}>
            <div>
              <span className={`${styles.sosEyebrow} ${styles.mono}`}>[ 03 / PLANT HELP DESK ]</span>
              <div className={styles.sosBig} aria-hidden="true">
                SOS!
              </div>
            </div>
            <div className={styles.sosSide}>
              <h2 id="sos-title">
                잎이 노래졌나요?
                <br />
                식물이 보내는 신호부터.
              </h2>
              <p>
                지금 당장 무엇을 사야 할지보다, 어떤 환경에서 문제가 생겼는지 먼저 살펴보세요. 흔한 증상과
                관리 가이드를 모았습니다.
              </p>
              <ul className={styles.sosTags} aria-label="다루는 증상">
                <li>잎 색 변화</li>
                <li>병충해</li>
                <li>과습·건조</li>
                <li>환경 변화</li>
              </ul>
              <Link className={styles.sosLink} href={SOS_HREF}>
                식물 SOS 가이드 열기 <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <SosDrawing className={styles.sosDrawing} />
          </div>
        </section>

        <section id="season" className={`${styles.section} ${styles.season}`} aria-labelledby="season-title">
          <div className={styles.layout}>
            <span className={`${styles.sectionIndex} ${styles.mono}`}>[ 04 / THE SEASON REPORT ]</span>
            <div className={styles.seasonBox}>
              <div className={styles.seasonCopy}>
                <div>
                  <span className={`${styles.eyebrow} ${styles.mono}`}>KOREAN PLANT CALENDAR</span>
                  <h2 id="season-title">
                    같은 화분,
                    <br />
                    달라지는 계절.
                  </h2>
                  <p>
                    우리 집에 잘 맞던 식물도 계절이 바뀌면 필요한 관리가 달라질 수 있습니다. 가을·겨울에는
                    빛과 온도, 난방에 따른 건조함을 함께 점검하세요.
                  </p>
                </div>
                <Link href={SEASON_HREF} className={styles.seasonLink}>
                  계절 관리 노트 보러 가기 <span aria-hidden="true">↗</span>
                </Link>
              </div>
              <div className={styles.seasonGraphic}>
                <span className={`${styles.seasonNumber} ${styles.mono}`}>SEASONAL SPECIMEN / STUDY</span>
                <SeasonArt />
                <div className={`${styles.seasonBottom} ${styles.mono}`}>
                  <span>NOTES FOR REAL HOMES</span>
                  <span aria-hidden="true">↗</span>
                </div>
              </div>
            </div>
            <div className={styles.seasonNotesWrap}>
              <span className={`${styles.seasonNotesLabel} ${styles.mono}`}>계절별 반려식물 관리 포인트</span>
              <ul className={styles.seasonNotes}>
                {seasonNotes.map((note) => (
                  <li key={note.title}>
                    <h3>{note.title}</h3>
                    <p>{note.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <AdBand slot={publicEnv.adsenseSlots.contentMid} label="홈 중간 광고" />

        <section className={styles.journal} aria-labelledby="journal-title">
          <div className={styles.layout}>
            <div className={styles.journalHead}>
              <div>
                <span className={`${styles.sectionIndex} ${styles.mono}`}>[ 05 / GARDENING JOURNAL ]</span>
                <h2 id="journal-title" className={styles.sectionTitle}>
                  최신 가드닝 글
                </h2>
              </div>
              <Link href="/blog" className={styles.journalAll}>
                전체 보기 <span aria-hidden="true">→</span>
              </Link>
            </div>
            {recent.status === "ok" && recent.posts.length > 0 ? (
              <ul className={styles.journalList}>
                {recent.posts.map((post) => {
                  const date = formatPostDate(post.publishedAt);
                  return (
                    <li key={post.slug} className={styles.journalItem}>
                      <div className={`${styles.journalMeta} ${styles.mono}`}>
                        <span>{post.category}</span>
                        {date && <time dateTime={date.iso}>{date.label}</time>}
                      </div>
                      <h3>
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h3>
                      {post.metaDescription && <p>{post.metaDescription}</p>}
                    </li>
                  );
                })}
              </ul>
            ) : recent.status === "ok" ? (
              <div className={styles.journalState} role="status">
                <p>아직 공개된 글이 없습니다. 새 글이 발행되면 이곳에 표시됩니다.</p>
                <Link href="/blog">블로그 둘러보기 →</Link>
              </div>
            ) : (
              <div className={styles.journalState} role="status">
                <p>최신 글을 지금 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</p>
                <Link href="/blog">블로그에서 직접 보기 →</Link>
              </div>
            )}
          </div>
        </section>

        <AdBand slot={publicEnv.adsenseSlots.contentBottom} label="홈 하단 광고" />

        <section className={styles.editorial} id="standards" aria-labelledby="standards-title">
          <div className={`${styles.layout} ${styles.editorialGrid}`}>
            <div>
              <span className={`${styles.sectionIndex} ${styles.mono}`}>[ 06 / OUR EDITORIAL RULES ]</span>
              <h2 id="standards-title">
                추천에는
                <br />
                이유가 있어야 합니다.
              </h2>
              <p className={styles.editorialLead}>
                예쁜 그림만큼 중요한 것은 실제 생활에 도움이 되는 정보입니다. 플랜티프렌즈의 비교 기준과
                정보의 한계를 함께 보여줍니다. 식물 기본 정보, 관리 난이도, 독성 메모, 기후 적합도는 공개
                자료와 내부 편집 기준을 바탕으로 정리하며, 새 데이터가 들어오면 페이지가 갱신됩니다.
              </p>
              <div className={styles.editorialNote}>
                <strong>검수 전 안내</strong>
                <p>
                  식물 섭취, 반려동물 중독 의심, 알레르기 반응처럼 안전과 관련된 문제는 즉시 수의사나 의료
                  전문가에게 확인해야 합니다.
                </p>
              </div>
            </div>
            <ol className={styles.standards}>
              {standards.map((item) => (
                <li key={item.no} className={styles.standard}>
                  <span className={styles.mono}>{item.no}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={styles.faq} aria-labelledby="faq-title">
          <div className={`${styles.layout} ${styles.faqGrid}`}>
            <div>
              <span className={`${styles.sectionIndex} ${styles.mono}`}>[ 07 / ASK THE LAB ]</span>
              <h2 id="faq-title">
                자주 묻는
                <br />
                질문과 답.
              </h2>
            </div>
            <div>
              {faqs.map((item) => (
                <details key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
