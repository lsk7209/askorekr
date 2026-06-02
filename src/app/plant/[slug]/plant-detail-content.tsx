import Link from "next/link";
import { AdsenseAd } from "@/components/adsense-ad";
import { publicEnv } from "@/env";
import type { PlantDetail } from "@/features/plants/queries";
import type { RelatedPlant } from "@/features/plants/related-queries";
import type { BlogListItem } from "@/features/blog/queries";
import {
  formatDifficulty,
  formatDifficultyLabel,
  formatHumidityGuide,
  formatLightCondition,
  formatLightGuide,
  formatRange,
  formatScore,
  formatTemperatureGuide,
  formatWaterCycle,
  formatWaterGuide
} from "./plant-formatters";
import { PlantRelatedLinks } from "./plant-related-links";

export type PlantFaq = {
  question: string;
  answer: string;
};

type Props = {
  plant: PlantDetail;
  faqs: PlantFaq[];
  relatedPlants: RelatedPlant[];
  relatedBlogPosts?: BlogListItem[];
};

export function getPlantFaqs(plant: PlantDetail): PlantFaq[] {
  return [
    {
      question: `${plant.koreanName}는 초보자가 키우기 쉬운가요?`,
      answer: `${plant.koreanName}의 관리 난이도는 ${formatDifficultyLabel(plant.difficultyScore)}으로 분류됩니다. 처음 키운다면 빛과 물주기 조건을 먼저 맞추고, 잎 상태를 보면서 위치를 조정하는 방식이 좋습니다.`
    },
    {
      question: `${plant.koreanName}는 실내에서 키워도 되나요?`,
      answer: `${plant.koreanName}는 ${formatLightCondition(plant)} 조건을 확인해야 합니다. 실내에서 키울 때는 창가와의 거리, 직사광 노출 시간, 통풍을 함께 점검하세요.`
    },
    {
      question: `${plant.koreanName}는 반려동물에게 안전한가요?`,
      answer: `${plant.koreanName}의 안전성은 강아지 ${formatScore(plant.petSafetyScoreDog)}, 고양이 ${formatScore(plant.petSafetyScoreCat)} 기준으로 기록되어 있습니다. 반려동물이 잎을 씹지 않게 두고, 이상 반응이 있으면 전문가에게 확인해야 합니다.`
    }
  ];
}

export function PlantGuideContent({ plant, faqs, relatedPlants, relatedBlogPosts = [] }: Props) {
  return (
    <>
      <section className="quick-facts" aria-labelledby="quick-facts-title">
        <h2 id="quick-facts-title">Quick Facts</h2>
        <dl>
          <Fact label="학명" value={plant.scientificName} />
          <Fact
            label="과·속"
            value={`${plant.family ?? "-"} / ${plant.genus ?? "-"}`}
          />
          <Fact
            label="서울 기준 적합도"
            value={`${plant.climateScore}점 ${plant.climateGrade}`}
          />
          <Fact label="관리 난이도" value={formatDifficulty(plant.difficultyScore)} />
          <Fact label="물주기" value={formatWaterCycle(plant.waterFreqDays)} />
          <Fact label="광량" value={formatRange(plant.lightLuxMin, plant.lightLuxMax, "lux")} />
          <Fact label="온도" value={formatRange(plant.tempMinC, plant.tempMaxC, "℃")} />
          <Fact label="습도" value={formatRange(plant.humidityMinPct, plant.humidityMaxPct, "%")} />
        </dl>
      </section>

      <section className="plant-section" aria-labelledby="summary-title">
        <h2 id="summary-title">{plant.koreanName} 키우기 핵심</h2>
        <p>
          {plant.koreanName}는 {plant.scientificName}로 기록된 식물입니다.
          서울 기준 기후 적합도는 {plant.climateScore}점({plant.climateGrade})
          이며, 관리 난이도는 {formatDifficulty(plant.difficultyScore)}입니다.
          집 안에서 오래 키우려면 물을 주는 주기보다 흙이 마르는 속도, 빛의
          방향, 계절별 온도 변화를 함께 보는 것이 중요합니다.
        </p>
        <p>
          처음 들일 때는 바로 큰 화분으로 옮기기보다 1~2주 정도 현재 위치에서
          잎 처짐, 잎끝 마름, 흙의 건조 속도를 관찰하세요. 같은 식물이라도
          남향 창가, 북향 방, 베란다처럼 놓는 위치에 따라 관리 난이도가 달라질
          수 있습니다.
        </p>
      </section>

      <AdsenseAd
        publisherId={publicEnv.adsensePubId}
        slot={publicEnv.adsenseSlots.contentMid}
        label={`${plant.koreanName} 본문 중간 광고`}
      />

      <section className="plant-section" aria-labelledby="care-title">
        <h2 id="care-title">빛·물·온습도 관리</h2>
        <div className="plant-care-grid">
          <CareItem title="빛" body={formatLightGuide(plant)} />
          <CareItem title="물" body={formatWaterGuide(plant)} />
          <CareItem title="온도" body={formatTemperatureGuide(plant)} />
          <CareItem title="습도" body={formatHumidityGuide(plant)} />
        </div>
      </section>

      <section className="plant-section" aria-labelledby="safety-title">
        <h2 id="safety-title">반려동물·아이 안전성</h2>
        <p>
          강아지 {formatScore(plant.petSafetyScoreDog)}, 고양이{" "}
          {formatScore(plant.petSafetyScoreCat)}, 어린 자녀{" "}
          {formatScore(plant.childSafetyScore)} 기준으로 기록되어 있습니다.
          점수는 선택을 돕는 참고값이며, 실제 섭취나 피부 접촉 반응까지 보장하지
          않습니다.
        </p>
        {plant.toxicityNotes ? <p>{plant.toxicityNotes}</p> : null}
        <ul className="plant-checklist">
          <li>반려동물이 잎을 씹는 습관이 있으면 손이 닿지 않는 위치에 둡니다.</li>
          <li>가지치기한 잎과 흙 표면의 낙엽은 바로 치웁니다.</li>
          <li>섭취가 의심되면 식물 이름과 증상을 기록해 전문가에게 문의합니다.</li>
        </ul>
      </section>

      <section className="plant-section" aria-labelledby="season-title">
        <h2 id="season-title">계절별 점검 포인트</h2>
        <ul className="plant-checklist">
          <li>봄에는 새잎과 뿌리 활동이 늘어 물마름 속도를 다시 확인합니다.</li>
          <li>여름에는 강한 직사광과 실내 냉방 바람을 동시에 피하는 위치가 좋습니다.</li>
          <li>가을에는 밤 기온이 낮아지므로 창가 냉해와 과습을 함께 조심합니다.</li>
          <li>겨울에는 성장 속도가 느려져 물주기 간격을 늘리는 편이 안전합니다.</li>
        </ul>
      </section>

      <section className="plant-section" aria-labelledby="meaning-title">
        <h2 id="meaning-title">꽃말·문화 기록</h2>
        <p>
          {plant.flowerMeaningPrimary
            ? `${plant.koreanName}의 대표 의미는 "${plant.flowerMeaningPrimary}"으로 정리되어 있습니다. 선물용으로 고를 때는 의미보다 받는 사람의 생활 환경과 관리 가능 시간을 먼저 확인하는 것이 좋습니다.`
            : `${plant.koreanName}의 꽃말·문화 기록은 아직 충분히 정리되지 않았습니다. 선물용으로 고를 때는 의미보다 빛, 물주기, 안전성을 먼저 확인하세요.`}
        </p>
      </section>

      <section className="plant-section" aria-labelledby="faq-title">
        <h2 id="faq-title">자주 묻는 질문</h2>
        <div className="plant-faq-list">
          {faqs.map((faq) => (
            <article key={faq.question} className="plant-faq-item">
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <PlantRelatedLinks plants={relatedPlants} />

      <AdsenseAd
        publisherId={publicEnv.adsensePubId}
        slot={publicEnv.adsenseSlots.contentBottom}
        label={`${plant.koreanName} 본문 하단 광고`}
      />

      {relatedBlogPosts.length > 0 && (
        <section className="plant-section" aria-labelledby="plant-blog-title">
          <h2 id="plant-blog-title">관련 가드닝 가이드</h2>
          <div className="plant-blog-list">
            {relatedBlogPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="plant-blog-card">
                <span className="plant-blog-category">{post.category}</span>
                <span className="plant-blog-title">{post.title}</span>
                {post.metaDescription && (
                  <span className="plant-blog-desc">{post.metaDescription}</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="plant-section plant-next-actions" aria-labelledby="next-title">
        <h2 id="next-title">다음에 확인할 것</h2>
        <p>
          현재 집 환경에 더 잘 맞는 후보가 있는지 비교하려면 지역과 실내 조건을
          넣어 진단 도구를 함께 확인하세요.
        </p>
        <div className="entry-links">
          <Link href="/tools/diagnose">반려식물 진단하기</Link>
          <Link href="/category/indoor-foliage">실내 식물 더 보기</Link>
        </div>
      </section>
    </>
  );
}

function CareItem({ title, body }: { title: string; body: string }) {
  return (
    <article className="care-item">
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
