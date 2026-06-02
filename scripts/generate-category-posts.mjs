/**
 * 소외 카테고리 집중 생성 스크립트
 * 실행: node scripts/generate-category-posts.mjs --category=도구 [--count=50] [--dry-run]
 *
 * 지원 카테고리: 도구 / 꽃말문화 / 병충해 / 계절관리 / 식물선택
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { integer, real, sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { and, eq } from "drizzle-orm";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TURSO_URL = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;
const QUALITY_THRESHOLD = 90;
const MAX_RETRIES = 3;
const PUBLISH_INTERVAL_HOURS = 5;

if (!GEMINI_API_KEY) { console.error("❌ GEMINI_API_KEY 필요"); process.exit(1); }

const args = process.argv.slice(2);
const category = args.find(a => a.startsWith("--category="))?.split("=")[1];
const count = parseInt(args.find(a => a.startsWith("--count="))?.split("=")[1] ?? "50");
const isDryRun = args.includes("--dry-run");

if (!category) { console.error("❌ --category=도구 형식으로 지정 필요"); process.exit(1); }

// ── 카테고리별 전용 주제 목록 ─────────────────────────────
const CATEGORY_TOPICS = {
  "도구": [
    "화분 배수 트레이 추천: 물받이 없이 키우면 벌어지는 일",
    "식물 분무기 추천: 가격대별 미스트·압축·전동 분무기 비교",
    "식물 조도계 사용법: 내 방 빛의 양 제대로 측정하기",
    "관엽식물 전용 가위·가지치기 도구 추천 TOP 5",
    "화분 자동급수기 비교: 타이머·중력식·스마트 급수 차이",
    "식물 온습도계 선택 가이드: 정확도·배터리·디자인 비교",
    "분갈이 삽·모종삽 추천: 크기별 용도와 재질 완전 정리",
    "식물 지지대·지주 종류: 대나무·철사·코코 지주 비교",
    "행잉 화분 걸이 설치법: 천장·벽·창문 걸이 완전 가이드",
    "식물 LED 성장등 파장 설명: 적색·청색·풀스펙트럼 차이",
    "테라리움 만들기 도구 세트: 긴 핀셋·미니 삽·흙 깔때기",
    "코코피트·펄라이트·난석 배합 도구: 올바른 비율 계량법",
    "식물 영양제 계량 도구: 과비 방지 정확한 희석 가이드",
    "화분 받침대·플랜트 스탠드 추천: 높이별 인테리어 활용",
    "식물 이름표·라벨링 시스템: 화분 정리하는 실용 방법",
    "분무 호스·물뿌리개 추천: 베란다 텃밭용 vs 실내용 차이",
    "식물 방제 스프레이 종류: 살충·살균·영양 스프레이 비교",
    "화분 망·배수망 종류와 크기: 올바른 사용법 완전 가이드",
    "식물 전용 수저세트: 분갈이 도구 DIY vs 구매 비교",
    "글로우 성장등 설치법: 식물 등 위치·거리·타이머 설정",
    "뿌리 확인용 투명 화분 활용: 성장 관찰 완전 가이드",
    "식물 세척 도구: 잎 닦기 천·붓·솔 종류와 사용 시기",
    "탄산칼슘 제거제: 물받이 흰 자국 완벽 청소 도구 가이드",
    "핀셋으로 하는 식물 세밀 관리: 병충해·이끼 제거 완전판",
    "식물 재배 달력·앱 활용: 물주기·비료·분갈이 스케줄 관리",
    "자동화 식물 관리 시스템: 스마트홈 연동 급수 솔루션",
    "초보 식물러 필수 도구 세트: 5만원으로 준비하는 가드닝 키트",
    "식물 클램프·집게 활용: 덩굴식물 유인·고정 완전 가이드",
    "코코넛 섬유 포트: 생분해 화분 사용법과 장단점",
    "식물 열화상 카메라 활용: 과습·냉해 조기 발견 방법",
    "식물 영양 측정 토양 센서: EC·pH 측정기 사용법",
    "화분 손잡이·이동 바퀴: 대형 화분 이동 편리하게 하기",
    "식물 병충해 확대경: 응애·깍지벌레 조기 발견 도구",
    "분갈이 비닐 매트: 실내 분갈이 흙 정리 완전 가이드",
    "뿌리 건강 체크 도구: 수분 측정기 vs 직접 확인 비교",
    "식물 전용 물통: BPA-free 재질과 용량 선택 기준",
    "아이비 토피어리 철사 틀: 모양 잡기 도구와 방법",
    "씨앗 발아 트레이·돔: 습도 유지 발아율 높이는 도구",
    "화분 무게 달기: 물주기 타이밍 알려주는 무게 측정법",
    "식물 재배 일지 앱 BEST 5: 성장 기록과 알림 기능 비교",
    "접목 테이프·접목칼: 장미·선인장 접목 도구 완전 가이드",
    "저면관수 화분 시스템: 자동 수분 공급 설치 완전판",
    "식물 배양토 pH 측정기: 산성·알칼리 조정 도구 가이드",
    "난초 전용 화분·바크 도구: 착생란 키우기 도구 세트",
    "다육이 전용 분갈이 도구: 가시 없이 안전하게 다루는 법",
    "수경재배 도구 세트: 영양액·용기·펌프 초보 가이드",
    "화분 위생 관리 도구: 화분 세척·소독 완전 가이드",
    "가드닝 장갑 추천: 재질·두께·기능별 비교 완전판",
    "식물 영양제 디스펜서: 정확한 계량으로 과비 방지하기",
    "UV 살균 식물 도구: 흙·화분 소독으로 병충해 예방하기"
  ],
  "꽃말문화": [
    "무궁화 꽃말과 역사: 대한민국 국화의 깊은 의미",
    "진달래 꽃말: 봄의 전령이 담은 사랑과 그리움",
    "개나리 꽃말: 희망과 기대감을 담은 노란 봄꽃",
    "벚꽃 꽃말: 일본 vs 한국 벚꽃 문화 차이와 의미",
    "국화 꽃말: 계절과 색깔별 의미, 제사상 vs 선물",
    "장미 흰색 꽃말: 순결·존경·새로운 시작의 의미",
    "장미 노란색 꽃말: 우정과 질투 사이, 선물 시 주의사항",
    "카네이션 분홍 꽃말: 어머니의 사랑과 감사 표현",
    "해바라기 꽃말: 숭배와 충성, 여름 선물로 적합한 이유",
    "라벤더 꽃말: 헌신과 침묵, 아로마테라피와 연결된 의미",
    "히아신스 색깔별 꽃말: 보라·분홍·흰색 히아신스 의미",
    "데이지 꽃말: 순결과 희망, 어린 시절 추억의 꽃",
    "수국 꽃말: 변덕과 냉정함, 선물로 쓸 때 주의할 점",
    "튤립 색깔별 꽃말: 빨강·노랑·보라·흰색 튤립 의미 총정리",
    "백합 꽃말: 순결과 죽음, 결혼식 vs 장례식 의미 차이",
    "아이리스 꽃말: 신뢰와 용기, 프랑스 왕실 상징의 역사",
    "프리지아 꽃말: 순수한 사랑과 우정, 봄 선물의 정석",
    "스위트피 꽃말: 작별과 감사, 졸업 선물로 사랑받는 이유",
    "안스리움 꽃말: 열정과 환대, 공간 인테리어 식물의 의미",
    "극락조화 꽃말: 기쁨과 자유, 이국적 매력의 상징",
    "치자 꽃말: 행복한 사랑, 순백의 향기 가득한 여름꽃",
    "동백 꽃말: 신중한 사랑, 겨울에 피는 붉은 꽃의 비밀",
    "목련 꽃말: 고귀함과 자연애, 봄의 시작을 알리는 꽃",
    "매화 꽃말: 인내와 절개, 설 연휴 선물로 의미 있는 이유",
    "한국 꽃 문화 역사: 전통 화훼와 현대 플로리스트의 변화",
    "사계절 꽃 의미: 봄·여름·가을·겨울 계절별 꽃 선물 가이드",
    "서양 꽃 언어(Victorian floriography): 꽃다발로 메시지 전달법",
    "꽃 선물 실수 TOP 10: 문화별 금기 꽃과 색깔 완전 정리",
    "식물 증정 에티켓: 상황별 꽃과 식물 선물 완전 가이드",
    "결혼식 부케 꽃말: 행복한 결혼을 바라는 꽃 조합",
    "약혼·프러포즈 꽃: 청혼 의미를 담은 꽃다발 완전 가이드",
    "생일 케이크 꽃 장식: 나이·성별별 어울리는 꽃 추천",
    "개업 화환 꽃말: 번창·성공 기원 화환 종류와 의미",
    "추석·설날 꽃 문화: 명절에 어울리는 식물 선물 가이드",
    "임산부 꽃 선물: 임신 중 안전한 꽃과 피해야 할 꽃",
    "반려동물 있는 집 꽃다발: 독성 없는 꽃 선택 완전 가이드",
    "꽃말 미신 vs 사실: 수국이 냉정함을 상징한다는 것, 진실은?",
    "일본 하나코토바: 일본 전통 꽃말과 한국 꽃말 비교",
    "한국 시조·가사 속 꽃: 문학에서 꽃이 상징하는 것들"
  ],
  "병충해": [
    "응애 완전 정복: 거미줄 같은 실, 원인부터 퇴치까지",
    "깍지벌레 종류별 제거법: 솜깍지·가루깍지 구분과 방제",
    "뿌리파리 완전 퇴치: 흙 속 유충부터 성충까지 없애는 법",
    "흰가루병 치료법: 하얀 가루 핀 잎, 원인과 친환경 처방",
    "역병·뿌리 썩음 응급처치: 갈변하는 줄기 골든타임 처방",
    "잿빛곰팡이병 방제: 회색 솜털 같은 균, 습도 관리가 핵심",
    "진딧물 자연 퇴치법: 천적 무당벌레와 목초액 활용하기",
    "온실가루이 없애기: 흰 날파리 종류와 황색 끈끈이 트랩",
    "총채벌레 방제: 꽃·새잎 파고드는 미세 해충 완전 가이드",
    "선충 토양 처리: 뿌리혹선충으로 시드는 식물 구하기",
    "탄저병 vs 점무늬병: 갈색 반점 원인 정확히 구분하기",
    "세균성 무름병: 물 흠뻑 맞은 듯 연화되는 줄기 대처법",
    "바이러스성 모자이크병: 얼룩 잎 발견 시 즉시 해야 할 것",
    "과습 vs 건조 구분법: 잎 처짐 원인 정확히 진단하기",
    "식물 영양 결핍 시각 진단: 질소·인·칼륨·철 결핍 구분",
    "겨울 냉해 피해 식물 살리기: 잎끝 갈변 응급 처치",
    "여름 일소(日燒) 피해 치료: 화상 입은 잎 처리와 예방",
    "뿌리 산소 부족: 과습 화분에 공기 넣어주는 방법",
    "달팽이 야행성 피해: 야간 잎 갉아먹는 달팽이 퇴치법",
    "나방 유충 방제: 흙 속 굼벵이·청벌레 완전 퇴치 가이드",
    "깍지벌레 알코올 솜 처리법: 안전하게 제거하는 단계별 방법",
    "응애 물 세척 방제법: 샤워로 없애는 친환경 방제",
    "토양 산도 문제: pH 이상으로 영양 흡수 안 되는 식물 치료",
    "식물 소금 피해: 과비·토양 염류집적 문제 해결법",
    "병든 식물 격리 기준: 전파 막는 즉각 대처 매뉴얼",
    "화분 멸균 방법: 재사용 화분·흙 소독 완전 가이드",
    "유황합제·석회유황 사용법: 겨울철 예방 방제 타이밍",
    "친환경 방제약 만들기: 마늘 물·계피 물·목초액 레시피",
    "병충해 예방 환경 조성: 통풍·빛·습도로 병충해 없애기",
    "식물 면역 강화 영양제: 병충해에 강한 식물 만드는 법",
    "병충해 발견 즉시 체크리스트: 5분 안에 진단하는 방법",
    "식물 검역: 새 식물 들일 때 병충해 없는 식물 고르기",
    "화분 흙 교체 타이밍: 오염된 흙 버리는 기준과 방법",
    "기생식물·이끼류 제거: 식물에 붙은 불청객 완전 처리",
    "응애 내성 문제: 살비제 번갈아 쓰는 저항성 방지법",
    "무농약 방제 원칙: 집 안 반려동물·아이 있을 때 안전 방제"
  ],
  "계절관리": [
    "1월 실내식물 관리: 가장 추운 달 난방 건조 대처법",
    "2월 분갈이 준비: 봄 시작 전 화분 점검 체크리스트",
    "3월 봄 새잎 관리: 갑작스러운 성장 급증 대처법",
    "4월 비료 시작 가이드: 생장기 시작 영양 공급 타이밍",
    "5월 황금 연휴 식물 관리: 장기 여행 전 준비 완전판",
    "6월 장마 전 식물 준비: 과습 예방 화분 배수 점검",
    "7월 폭염 실내식물 대처: 에어컨 바람·강광 동시 관리",
    "8월 열대야 식물 관리: 밤 온도 높을 때 과습 예방법",
    "9월 가을 환경 변화: 광량 줄 때 식물 적응 도우는 방법",
    "10월 월동 준비 시작: 냉해 취약 식물 실내 이동 기준",
    "11월 물주기 줄이기: 성장 둔화기 과습 없이 관리하기",
    "12월 크리스마스 식물 선물: 계절 식물 관리 완전 가이드",
    "봄 분갈이 시기 판단: 뿌리 상태로 분갈이 타이밍 잡는 법",
    "여름 베란다 차광: 한국 직사광선 강도와 차광 방법",
    "가을 구근 심기: 수선화·튤립·히아신스 심는 최적 시기",
    "겨울 구근 냉장 처리: 저온 요구 구근 꽃 피우는 방법",
    "장마철 흙 곰팡이 대처: 흰 균사 발생 즉각 처리법",
    "태풍 전후 식물 관리: 바람 피해 식물 응급 처치 매뉴얼",
    "봄 꽃가루 시즌 식물 관리: 꽃가루 쌓인 잎 관리법",
    "한국 사계절 물주기 변화: 계절별 물주기 간격 조정표",
    "여름 휴가 식물 돌봄: 2주 집 비울 때 식물 살리는 법",
    "겨울 귀성길 식물 관리: 명절 연휴 식물 혼자 두기 팁",
    "봄 온도 변화 적응: 낮과 밤 기온차 심할 때 관리법",
    "가을 잎 변색 원인: 단풍 드는 식물 vs 병든 식물 구분",
    "겨울 창문 결로 관리: 유리 근처 식물 냉해 예방법",
    "봄 병충해 폭발 시기: 기온 상승 시 방제 선제 대응법",
    "여름 뿌리 과열 방지: 화분 온도 낮추는 방법",
    "한국 미세먼지 계절별 대처: 봄·겨울 실내 공기정화",
    "가을 식물 영양 축적: 겨울 나기 전 비료 마지막 시기",
    "겨울 가습기 식물 배치: 건조 방 실내식물 위치 최적화",
    "계절별 분갈이 흙 선택: 봄·여름·가을·겨울 배합토 차이"
  ],
  "식물선택": [
    "1인 가구 식물 추천: 바쁜 싱글이 키우기 쉬운 식물 5가지",
    "신혼부부 식물 선물: 함께 키우기 좋은 커플 식물 추천",
    "반려견 있는 집 안전 식물 BEST: 강아지 독성 없는 TOP 10",
    "반려묘 있는 집 식물 선택: 고양이 독성 검증 완전 가이드",
    "어린이 방 식물 선택: 무독성·교육 효과·관리 쉬운 종",
    "남향 거실 식물 추천: 햇빛 충분한 공간 최적 식물",
    "북향 창가 식물: 그늘에서도 잘 자라는 식물 완전 가이드",
    "베란다 없는 집 식물: 창문만으로 키울 수 있는 종류",
    "20평대 아파트 식물 배치: 공간별 적합 식물 인테리어",
    "오피스텔 식물: 좁고 환기 부족한 공간의 최선 선택",
    "초보자 첫 식물 선택: 실패율 낮은 식물 기준 7가지",
    "여행 자주 가는 사람 식물: 관리 최소화 식물 TOP 5",
    "공기정화 성능 순위: NASA 연구 기반 식물 효과 비교",
    "수면 개선 식물: 산소 방출량 많은 식물 침실 배치법",
    "집중력 향상 식물: 스터디룸·홈오피스 최적 식물",
    "미세먼지 제거 식물: 한국 대기 기준 최적 공기정화",
    "새집 증후군 식물: 포름알데히드·벤젠 제거 식물 추천",
    "가성비 식물 추천: 2만원 이하로 인테리어 효과 큰 식물",
    "프리미엄 희귀 식물 추천: 인테리어 포인트 식물 가이드",
    "화분 예산별 추천: 1만·3만·5만·10만원대 식물 세트",
    "식물 성격 유형별 추천: MBTI로 보는 나에게 맞는 식물",
    "한국 날씨 최적 식물: 서울·부산·제주 기후별 추천",
    "여름 실내 인테리어 식물: 더운 계절 시원해 보이는 식물",
    "겨울 실내 따뜻한 분위기 식물: 크리스마스 인테리어",
    "약용·허브 식물 선택: 요리·의약 활용 가능한 종류",
    "먹을 수 있는 식물: 식용 가능한 실내 채소·허브 추천",
    "향기 좋은 실내 식물: 아파트에서 키우기 좋은 향식물",
    "꽃 오래 피는 식물: 개화 기간 긴 관화 식물 TOP 10",
    "사계절 꽃 피는 식물: 연중 꽃 감상 가능한 종류",
    "열매 맺는 실내 식물: 수확 가능한 식물 가드닝 가이드",
    "식물 나눔 받기 좋은 종류: 초보가 번식 쉬운 식물",
    "행운 불러오는 식물: 한국·동양 풍수에서 인기 식물",
    "큰 화분 단품 식물: 거실 포인트 대형 관엽 추천",
    "미니 식물 컬렉션: 소형 식물로 공간 꾸미는 방법"
  ]
};

const topicList = CATEGORY_TOPICS[category];
if (!topicList) {
  console.error(`❌ 지원 카테고리: ${Object.keys(CATEGORY_TOPICS).join(" / ")}`);
  process.exit(1);
}

// ── DB 연결 ────────────────────────────────────────────────
const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
const blogPosts = sqliteTable("blog_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  metaDescription: text("meta_description"),
  category: text("category").notNull().default("가드닝"),
  tags: text("tags", { mode: "json" }),
  bodyMarkdown: text("body_markdown").notNull(),
  qualityScore: real("quality_score"),
  qualityBreakdown: text("quality_breakdown", { mode: "json" }),
  researchJson: text("research_json", { mode: "json" }),
  generatedBy: text("generated_by").default("gemini-2.5-pro"),
  scheduledAt: integer("scheduled_at", { mode: "timestamp" }),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  isPublished: integer("is_published", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
}, t => ({ slugIdx: index("blog_posts_slug_idx").on(t.slug) }));
const db = drizzle(client, { schema: { blogPosts } });

// ── Gemini API ─────────────────────────────────────────────
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const PRO_MODEL = process.env.GEMINI_PRO_MODEL ?? "gemini-2.5-pro";
const FLASH_MODEL = process.env.GEMINI_FLASH_MODEL ?? "gemini-2.5-flash";

async function callGemini(model, prompt, temperature = 0.7) {
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens: 8192, responseMimeType: "application/json" }
    })
  });
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty Gemini response");
  return JSON.parse(text);
}

// ── 리서치 프롬프트 ────────────────────────────────────────
function buildResearchPrompt(topic) {
  return `당신은 한국 반려식물·가드닝 전문 리서처입니다.
주제: "${topic}"
반드시 JSON만 반환:
{"primaryKeyword":"메인키워드","secondaryKeywords":["키1","키2","키3"],"searchIntent":"정보형","uniqueAngle":"차별화 관점","keyFacts":["사실1","사실2","사실3"],"commonMistakes":["실수1","실수2"],"outline":["H2-1","H2-2","H2-3","H2-4","H2-5"],"faq":[{"q":"Q1?","a":"A1"},{"q":"Q2?","a":"A2"},{"q":"Q3?","a":"A3"},{"q":"Q4?","a":"A4"},{"q":"Q5?","a":"A5"}]}`.trim();
}

// ── 글 생성 프롬프트 ──────────────────────────────────────
const INTROS = ["독자의 실패 경험 공감 → 해결책 예고","한국 기후·계절 이슈 → 이 글이 해결해 주는 이유","식물의 흥미로운 특성 → 관리법 연결","SNS 유행 언급 → 실전 현실 제시","놀라운 데이터로 시작 → 관심 유도"];
const STRUCTS = ["문제해결형: 증상→원인→해결→예방","단계별 가이드형: 구매 전→첫날→1개월","비교분석형: 잘못 vs 올바른 방법","체크리스트형: 핵심 점검표 구성","심층분석형: 원리→적용→심화"];

function buildWritePrompt(topic, research, seed = 0) {
  const intro = INTROS[seed % INTROS.length];
  const struct = STRUCTS[(seed + 1) % STRUCTS.length];
  return `당신은 플랜티프렌즈(PlantyFriends) 편집팀 시니어 에디터입니다.
카테고리: "${category}" (반드시 이 값으로 고정)
주제: "${topic}"
인트로 스타일: ${intro}
본문 구조: ${struct}

## 리서치 데이터
${JSON.stringify(research, null, 2)}

## 필수 포함 요소
- **핵심 용어** 굵게(**text**) 최소 6회
- *중요 포인트* 이탤릭(*text*) 최소 3회
- ==형광 하이라이트== (==text==) 핵심 결론 2회 이상
- 한국 아파트 환경 callout (> 로 시작 blockquote) 최소 1개
- 정량 데이터 최소 3개 (온도℃, 습도%, 일수 등)
- FAQ 5개 이상 (### 으로 시작, ?로 끝)
- 표 1개 이상 (| 형식)
- 사이트 페르소나: 20~35세 MZ 여성, 도시 아파트, 친근한 존댓말
- 금지: "기특한", "쏠쏠", "든든한 친구", "국민 식물", "완벽한"
- 첫 H2: "인트로"/"들어가며" 금지

## 출력 형식 (JSON만)
{
  "title": "SEO 제목 (60자 이하, primaryKeyword 앞배치)",
  "metaDescription": "설명 (150~160자, primaryKeyword 포함)",
  "slug": "english-slug",
  "category": "${category}",
  "tags": ["tag1","tag2","tag3","tag4","tag5"],
  "bodyMarkdown": "마크다운 본문 (1800자 이상, H2 5개 이상)",
  "qualityScores": {"eeat":0,"structure_uniqueness":0,"seo":0,"factual":0,"cliche_avoidance":0},
  "totalQuality": 0
}
품질 90점 이상 필수.`.trim();
}

function toSlug(title) {
  return title.toLowerCase()
    .replace(/[가-힣]+/g, m => [...m].map(c => c.charCodeAt(0)).join("-"))
    .replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

async function getExistingSlugs() {
  const rows = await db.select({ slug: blogPosts.slug }).from(blogPosts);
  return new Set(rows.map(r => r.slug));
}

async function getScheduledCount() {
  const rows = await db.select({ id: blogPosts.id }).from(blogPosts)
    .where(eq(blogPosts.isPublished, false));
  return rows.length;
}

function getScheduledAt(index, existingCount) {
  const now = new Date();
  const hours = (existingCount + index + 1) * 5;
  return new Date(now.getTime() + hours * 3600000);
}

async function main() {
  const topics = topicList.slice(0, count);
  console.log(`\n🌱 카테고리 집중 생성: ${category}`);
  console.log(`   주제: ${topics.length}개 | 드라이런: ${isDryRun ? "예" : "아니오"}\n`);

  const existingSlugs = await getExistingSlugs();
  const scheduledCount = await getScheduledCount();
  console.log(`   기존: ${existingSlugs.size}개 | 예약 대기: ${scheduledCount}개\n`);

  let success = 0, fail = 0, skip = 0;

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    console.log(`[${i+1}/${topics.length}] 📝 ${topic}`);

    let saved = false;
    for (let attempt = 0; attempt < MAX_RETRIES && !saved; attempt++) {
      try {
        console.log(`   🔍 리서치 중...`);
        const research = await callGemini(FLASH_MODEL, buildResearchPrompt(topic), 0.5);
        console.log(`   ✓ 리서치 완료`);
        console.log(`   ✍️ 글 생성 중...`);
        const post = await callGemini(PRO_MODEL, buildWritePrompt(topic, research, i + attempt * 100), 0.8);

        if (!post.title || !post.bodyMarkdown) throw new Error("필수 필드 누락");
        if ((post.totalQuality ?? 0) < QUALITY_THRESHOLD) {
          console.log(`   ⚠️ 품질 미달 (${post.totalQuality}점), 재시도 ${attempt+1}/${MAX_RETRIES}`);
          continue;
        }

        console.log(`   📊 품질: ${post.totalQuality}점`);
        const slug = post.slug || toSlug(post.title);
        const finalSlug = existingSlugs.has(slug) ? `${slug}-${Date.now()}` : slug;

        if (isDryRun) {
          console.log(`   ✅ [드라이런] → "${post.title}"`);
        } else {
          const scheduledAt = getScheduledAt(i, scheduledCount);
          const now = new Date();
          await db.insert(blogPosts).values({
            slug: finalSlug, title: post.title, metaDescription: post.metaDescription,
            category: post.category ?? category, tags: post.tags ?? [],
            bodyMarkdown: post.bodyMarkdown, qualityScore: post.totalQuality,
            qualityBreakdown: post.qualityScores, researchJson: research,
            generatedBy: PRO_MODEL, scheduledAt, isPublished: false,
            createdAt: now, updatedAt: now
          });
          existingSlugs.add(finalSlug);
          console.log(`   ✅ 저장 → 예약: ${scheduledAt.toLocaleString("ko-KR")}`);
        }
        success++; saved = true;
      } catch (err) {
        console.error(`   ❌ 오류: ${err.message}`);
        if (attempt === MAX_RETRIES - 1) fail++;
      }
    }
  }

  console.log(`\n✅ 완료: 성공 ${success} | 실패 ${fail} | 건너뜀 ${skip}`);
  await client.close();
}

main().catch(e => { console.error(e); process.exit(1); });
