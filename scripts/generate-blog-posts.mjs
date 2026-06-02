/**
 * 블로그 글 300개 생성 스크립트
 * 실행: node scripts/generate-blog-posts.mjs [--start=0] [--count=300] [--dry-run]
 *
 * 동작:
 *  1. 300개 주제 목록에서 순서대로 처리
 *  2. Gemini API로 리서치 → 글 생성 → 품질 평가
 *  3. 품질 90점 미달 시 최대 3회 재시도
 *  4. DB에 5시간 간격 예약 공개로 저장
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { integer, real, sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { and, eq } from "drizzle-orm";

// ── 환경 설정 ─────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TURSO_URL = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;
const QUALITY_THRESHOLD = 90;
const MAX_RETRIES = 3;
const PUBLISH_INTERVAL_HOURS = 5;

if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY 환경 변수가 필요합니다.");
  process.exit(1);
}

// ── CLI 인수 파싱 ──────────────────────────────────────────
const args = process.argv.slice(2);
const startIdx = parseInt(args.find((a) => a.startsWith("--start="))?.split("=")[1] ?? "0");
const count = parseInt(args.find((a) => a.startsWith("--count="))?.split("=")[1] ?? "300");
const isDryRun = args.includes("--dry-run");

// ── DB 연결 ────────────────────────────────────────────────
const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

const blogPosts = sqliteTable(
  "blog_posts",
  {
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
  },
  (t) => ({
    slugIdx: index("blog_posts_slug_idx").on(t.slug)
  })
);

const db = drizzle(client, { schema: { blogPosts } });

// ── 300개 주제 목록 ──────────────────────────────────────
const TOPICS = [
  // 키우기 가이드 (80개)
  "몬스테라 키우기 완전 가이드: 한국 아파트 환경에서 성공하는 법",
  "고무나무 키우기: 빛이 부족한 실내에서도 건강하게",
  "스파티필름 키우기: 공기 정화와 음지 관리 팁",
  "산세베리아 분갈이 시기와 방법: 초보도 쉽게 따라하는 가이드",
  "행운목 물주기 황금 법칙: 과습 없이 오래 키우는 방법",
  "스킨답서스 번식하기: 수경 재배부터 토양 이식까지",
  "필로덴드론 종류별 관리법: 하트형·손바닥형 차이점",
  "알로에 베라 실내 재배: 한국 겨울 저온 대처법",
  "선인장 종류와 물주기: 다육이와 선인장 차이 총정리",
  "난초 키우기: 호접란 꽃 오래 유지하는 비결",
  "허브 키우기: 주방에서 바질·로즈마리·민트 함께 키우기",
  "공기정화식물 BEST 10: 미세먼지와 포름알데히드 제거 효과",
  "반려식물 첫 선택 가이드: 초보자가 실패하지 않는 5가지 기준",
  "여름 실내식물 관리: 고온·장마철 과습 방지법",
  "겨울 실내식물 관리: 저온과 건조 환경 대처법",
  "관음죽 키우기: 직사광이 없어도 잘 자라는 대형 관엽",
  "극락조화 키우기: 한국 기후에서 꽃 피우는 조건",
  "아이비 키우기와 번식: 행잉 화분과 토피어리 활용법",
  "드라세나 종류별 관리: 마지나타·콤팩타·발색 방법",
  "칼라디움 키우기: 화려한 잎 색을 유지하는 광량 관리",
  "아글라오네마 키우기: 독특한 무늬 잎 유지 비결",
  "테이블야자 실내 키우기: 작은 공간에 열대 분위기 연출",
  "브로멜리아드 키우기: 물 저장 방법과 꽃 피우는 법",
  "에피프레넘 오레움 키우기: 황금 덩굴식물 관리 완전판",
  "마란타 키우기: 저녁에 잎이 접히는 기도식물 관리법",
  "크로톤 키우기: 화려한 색 잎 유지를 위한 빛 관리",
  "베고니아 종류별 관리: 구근·목본·초본 베고니아 차이",
  "세이지 키우기: 약초와 요리용 허브로 베란다에서 재배",
  "라벤더 실내 재배: 한국 여름 고온 다습 극복법",
  "로즈마리 겨울 관리: 영하 기온에서 살리는 방법",
  "민트 종류별 특성: 스피아민트·페퍼민트·애플민트 비교",
  "바질 씨앗 발아부터 수확까지: 단계별 재배 가이드",
  "고수 키우기: 더위를 싫어하는 허브 여름 관리법",
  "당귀 키우기: 한국 전통 약초 가정 재배 가이드",
  "제라늄 키우기: 베란다에서 계속 꽃 피우는 비결",
  "임파티엔스 키우기: 그늘진 베란다에서 화려하게 피우기",
  "페튜니아 키우기: 여름 내내 꽃이 가득한 화분 관리",
  "팬지·비올라 키우기: 가을·봄 베란다 색상 연출",
  "금어초 키우기: 서늘한 계절에 최적화된 꽃 가이드",
  "데이지 키우기: 1년생·다년생 데이지 관리법 비교",
  "수선화 구근 키우기: 실내 수경재배부터 정원 식재까지",
  "히아신스 실내 키우기: 향기로운 구근 수경 재배법",
  "튤립 실내 키우기: 저온 처리와 발아 유도 방법",
  "아마릴리스 키우기: 대형 꽃 피우는 구근 관리 비결",
  "클레마티스 키우기: 베란다 격자 활용 덩굴 가이드",
  "수국 키우기: 토양 산도와 꽃 색 변화 관계",
  "장미 화분 키우기: 베란다에서 여러 번 꽃 피우는 법",
  "동백나무 화분 키우기: 겨울 개화와 한파 관리법",
  "매실나무 베란다 재배: 열매 맺는 조건과 가지치기",
  "블루베리 화분 재배: 산성 토양 만들기와 수확 가이드",
  "딸기 화분 재배: 런너 번식과 연중 수확 전략",
  "방울토마토 베란다 재배: 수분 공급과 지지대 설치법",
  "상추 실내 재배: 수경 재배와 토양 재배 비교",
  "깻잎 베란다 재배: 씨앗부터 수확까지 60일 가이드",
  "고추 화분 재배: 조명 보충과 착과 촉진 방법",
  "파프리카 실내 재배: 착색 조건과 수확 시기 판단",
  "오이 베란다 재배: 덩굴 정리와 연속 수확 방법",
  "아보카도 씨앗 발아 키우기: 수경→토양 이식 완전 가이드",
  "레몬나무 실내 재배: 꽃과 열매 맺는 온도·습도 조건",
  "금귤 화분 재배: 한국 실내에서 결실 성공하는 방법",
  // 식물 선택 (50개)
  "좁은 원룸에 어울리는 소형 식물 BEST 8",
  "거실 인테리어에 맞는 대형 관엽식물 추천 10선",
  "주방에 두기 좋은 식용·허브 식물 추천",
  "침실에 두면 좋은 식물: 수면 돕는 산소 방출 식물",
  "고양이가 있는 집에서 키울 수 있는 안전한 식물 15종",
  "강아지에게 독성 없는 반려식물 TOP 10",
  "어린이가 있는 집 안전 식물 가이드: 독성 없는 종 선택법",
  "초보자가 절대 죽이지 않는 식물 BEST 7",
  "물 주는 걸 자주 잊어버리는 사람에게 맞는 식물",
  "햇빛이 거의 없는 북향 집에서 키울 수 있는 식물",
  "직사광선이 잘 드는 남향 베란다 최적 식물 추천",
  "여행을 자주 가는 사람을 위한 자립형 식물 추천",
  "반음지에서 잘 자라는 실내 식물 8종 비교",
  "냄새 제거에 효과적인 공기정화식물 추천",
  "습도 높은 욕실에서 키울 수 있는 식물 6종",
  "사무실·오피스 환경에 적합한 식물 추천",
  "소형 화분으로 시작하는 다육식물 컬렉션 가이드",
  "풍수지리로 보는 집안 방향별 추천 식물",
  "선물용 식물 추천: 상황별 의미 있는 식물 10선",
  "색깔 있는 잎 관엽식물 비교: 빨강·분홍·보라 잎 식물",
  "늘어지는 행잉 식물 TOP 10: 선반·행잉 바스켓 활용",
  "수경 재배로 키울 수 있는 식물 7종 추천",
  "벽면 수직 정원 만들기: 적합한 식물과 설치 방법",
  "테라리움 만들기: 용기와 식물 조합 가이드",
  "계절마다 꽃 피는 식물 조합: 1년 내내 꽃 즐기기",
  "반려식물 3개로 시작하는 식물 생활 입문 패키지",
  "저예산으로 식물 컬렉션 시작하는 법: 번식과 나눔 활용",
  "분재 입문 식물 추천: 소나무·단풍나무 화분 기초",
  "향기 나는 식물 TOP 8: 집 안에서 아로마 효과",
  "꽃말로 고르는 식물: 감사·사랑·위로 의미 담긴 식물",
  "인테리어 스타일별 식물 추천: 미니멀·보헤미안·내추럴",
  "서울 아파트 환경 최적 식물 TOP 10: 기후 적합도 기준",
  "부산·경남 아파트에서 잘 자라는 식물 추천",
  "제주도 기후에서 실내외 키울 수 있는 특산 식물",
  "강원도 내륙 겨울 혹한에서도 생존하는 식물",
  // 병충해·트러블슈팅 (50개)
  "잎이 노랗게 변하는 이유 7가지와 해결법",
  "과습으로 죽어가는 식물 살리기: 뿌리 썩음 응급처치",
  "깍지벌레 완전 제거법: 약용·천연 방제 비교",
  "잎응애 발생과 방제: 물 스프레이 방법 총정리",
  "흰가루병 치료: 식물 곰팡이병 예방과 처치",
  "흑점병 원인과 치료: 장미·가지·오이에서 발생 시",
  "잎이 갑자기 떨어지는 원인과 응급 처치",
  "뿌리 썩음 식물 살리기: 수분 점검과 토양 교체",
  "식물 잎 끝이 갈색으로 마르는 이유와 해결법",
  "여름 열사병 식물 응급처치: 잎 탈수 증상 대응",
  "겨울 냉해 입은 식물 회복 가이드",
  "고양이가 식물을 먹었을 때: 독성 여부 확인 방법",
  "강아지가 식물을 씹었을 때 즉시 해야 할 일",
  "화분 흙 위에 흰 곰팡이 피었을 때 처치법",
  "오이과실파리 방제: 방울토마토·오이 해충 완전 제거",
  "진딧물 천연 제거법: 계피물·마늘물·비눗물 활용",
  "총채벌레 방제: 식물 꽃·새잎 피해 예방",
  "뿌리파리 유충 제거: 토양 해충 완전 방제법",
  "잎이 쪼글쪼글 말리는 이유: 건조·해충·과습 구분법",
  "식물 줄기가 무르고 썩는 이유와 절단 번식 구조",
  // 계절 관리 (40개)
  "봄 식물 관리 체크리스트: 분갈이·비료·번식 타이밍",
  "장마철 실내식물 과습 방지 완전 가이드",
  "여름 휴가 중 식물 물주기: 자동 급수 장치 비교",
  "폭염 대비 베란다 식물 차광·온도 관리법",
  "가을 분갈이 시기와 방법: 겨울 준비 포팅 전략",
  "겨울 실내 난방으로 인한 건조 해결법",
  "월별 식물 관리 캘린더: 1~12월 할 일 총정리",
  "비 온 뒤 화분 관리: 장마 후 흙 배수 확인법",
  "황사·미세먼지 철 식물 잎 닦는 방법",
  "장마 끝 폭염 전환 시 식물 충격 줄이는 방법",
  "난방 시작 전 겨울 준비: 식물 실내 이동 시기",
  "입춘 식물 관리: 봄 맞이 가지치기와 비료 주기",
  "추석 연휴 식물 관리: 5일 이상 자리 비울 때",
  "설 연휴 식물 월동: 추운 날씨에 외출하는 경우",
  "4월 봄철 번식 최적 시기: 꺾꽂이·포기 나누기",
  "9월 가을 씨앗 파종 가이드: 월동 식물 준비",
  // 도구·환경 (30개)
  "화분 선택 가이드: 플라스틱·토분·도자기 재질 비교",
  "식물 전용 흙 배합법: 배수·보습 균형 맞추기",
  "실내식물 조명 선택: 식물 성장등 스펙 비교",
  "자동 급수 장치 비교: 토분 급수·저수 화분·관개 타이머",
  "식물 비료 종류와 사용법: 액비·완효성·유기질 비료",
  "분무기 선택과 활용: 식물 잎 습도 관리법",
  "수경 재배 용기 선택: 유리·도자기·수경 전용 화분",
  "식물 행잉 설치법: 천장 고리·벽 선반·마크라메",
  "식물 거치대 DIY: 집에서 만드는 플랜트 스탠드",
  "식물 촬영 팁: 인스타그램 감성 식물 사진 찍는 법",
  // 꽃말·문화 (30개)
  "장미 색깔별 꽃말: 빨강·노랑·흰색·파랑 의미",
  "해바라기 꽃말: 긍정 에너지와 기원의 상징",
  "수국 꽃말: 색깔별 의미와 선물 상황",
  "민들레 꽃말: 한국·서양 문화 차이",
  "국화 꽃말: 제사·추석에 왜 국화를 쓸까",
  "튤립 꽃말: 색깔별 의미와 프러포즈 사용법",
  "백합 꽃말: 순결·사랑·위로의 다양한 상징",
  "작약 꽃말: 부귀·번영의 한국 전통 꽃",
  "라일락 꽃말: 초등 기억과 봄의 향기",
  "아카시아 꽃말: 봄 향기와 추억의 꽃",
  "개나리 꽃말: 한국 봄을 대표하는 꽃의 의미",
  "목련 꽃말: 고귀함과 봄의 시작",
  "벚꽃 꽃말: 한국과 일본에서의 문화적 의미 차이",
  "진달래 꽃말: 한국 민족 정서와 소월의 시",
  "할미꽃 꽃말: 슬픔과 그리움의 한국 야생화",
  "은방울꽃 꽃말: 순결·행복·귀환의 상징",
  "금잔화 꽃말: 선물과 상처의 이중적 의미",
  "양귀비 꽃말: 위안과 기억의 꽃",
  "패랭이꽃 꽃말: 한국 고전 시가의 꽃",
  "봉숭아 꽃말: 한국 여름 기억과 손톱 물들이기 문화",

  // 추가 키우기 가이드 (60개)
  "홍콩 야자 키우기: 한국 실내에서 열대 감성 연출하는 법",
  "아레카 야자 키우기: 실내 습도 높이는 천연 가습기 식물",
  "피커스 알리 키우기: 잎이 자꾸 떨어지는 이유와 해결법",
  "쉐플레라 키우기: 넓은 잎 관엽식물 분갈이 완전 가이드",
  "스트렐리치아 키우기: 극락조화 꽃 피우는 빛과 온도 조건",
  "유칼립투스 실내 재배: 향기와 인테리어를 동시에 잡는 법",
  "올리브나무 화분 재배: 한국 겨울 실내 월동 완전 가이드",
  "로즈마리 키우기: 향기로운 허브 화분 관리 1년 캘린더",
  "레몬 버베나 키우기: 차와 요리에 쓰는 허브 베란다 재배",
  "애플민트 키우기: 화분에서 무한 수확하는 민트 번식법",
  "고추냉이 실내 재배: 수경 재배로 와사비 직접 키우기",
  "생강 실내 재배: 화분에서 생강 수확하는 방법",
  "강황 화분 재배: 한국 아파트 베란다에서 성공하는 법",
  "자소엽 키우기: 일본 차조기 한국 아파트 재배 가이드",
  "들깨 베란다 재배: 씨앗 발아부터 잎 수확까지",
  "쑥갓 실내 재배: 수경과 토양 재배 비교 가이드",
  "방울양배추 베란다 재배: 미니 채소 화분 기르기",
  "미니 파프리카 실내 재배: LED 조명으로 성공하는 법",
  "콩나물 집에서 키우기: 3일 만에 수확하는 완전 가이드",
  "새싹 재배: 무순·브로콜리·알팔파 건강 새싹 키우기",
  "수박 화분 재배: 베란다 미니 수박 성공 조건",
  "메론 화분 재배: 실내에서 작은 메론 키우는 법",
  "오크라 화분 재배: 여름 열대 채소 한국에서 도전하기",
  "여주 베란다 재배: 덩굴 정리와 쓴맛 줄이는 수확법",
  "여름 수국 관리: 꽃 후 전정과 내년 개화 준비",
  "동백나무 분재: 소형 화분에서 키우는 겨울 꽃나무",
  "치자나무 키우기: 향기로운 흰 꽃 피우는 조건",
  "목서 화분 재배: 가을 향기 식물 한국 실내 키우기",
  "서양란 키우기: 심비디움·덴드로비움·온시디움 관리법",
  "카틀레야 키우기: 화려한 양란 꽃 피우는 비결",
  "파피오페딜룸 키우기: 음지에서도 피는 개성 있는 난초",
  "틸란드시아 키우기: 흙 없이 공기만으로 키우는 에어플랜트",
  "에케베리아 종류별 관리: 다육이 색깔 예쁘게 유지하는 법",
  "하월시아 키우기: 음지에서 빛나는 다육식물 완전 가이드",
  "세덤 종류별 관리: 국내 월동 가능한 다육이 추천",
  "알로에 품종별 비교: 관상용 vs 식용 알로에 차이점",
  "아가베 키우기: 거대한 용설란 화분 관리 가이드",
  "코브라 릴리 키우기: 식충식물 독특한 실내 키우기",
  "파리지옥 키우기: 식충식물 먹이주기와 월동 가이드",
  "네펜데스 키우기: 열대 식충식물 한국 실내 관리법",
  "끈끈이주걱 키우기: 국내 자생 식충식물 재배 가이드",
  "수련 수조 키우기: 실내 미니 연못 만들기 완전 가이드",
  "부레옥잠 수경 재배: 수질 정화와 인테리어 동시에",
  "워터코인 수경 재배: 동전 모양 잎 수생식물 키우기",
  "물달개비 실내 수경: 보라색 꽃 수생식물 관리법",
  "바나나나무 실내 재배: 열대 분위기 연출하는 미니 바나나",
  "파파야 화분 재배: 씨앗 발아부터 열매까지 1년 도전",
  "파인애플 화분 재배: 과일 꼭지로 번식하는 방법",
  "구아바 화분 재배: 열대 과일 한국 실내에서 키우기",
  "패션프루트 베란다 재배: 덩굴 관리와 수확 가이드",
  "용과 화분 재배: 선인장 열매 한국 실내 도전기",
  "커피나무 실내 재배: 원두 직접 수확하는 화분 키우기",
  "카카오나무 화분 재배: 초콜릿 원료 실내 재배 도전",
  "바닐라 덩굴 키우기: 바닐라빈 열리는 난초과 식물",
  "사철나무 화분 재배: 한국 겨울 녹색 유지하는 관목",
  "황금 사철나무 키우기: 황금빛 무늬 관목 분재 가이드",
  "남천 화분 재배: 붉은 열매와 단풍이 아름다운 관목",
  "피라칸다 키우기: 빨간 열매 가득한 울타리 식물",
  "홍가시나무 화분 재배: 봄 붉은 새잎이 매력인 관목",

  // 추가 식물 선택 가이드 (30개)
  "연인에게 선물하기 좋은 식물 10선: 꽃말과 케어 난이도",
  "부모님 선물용 식물 추천: 장수와 건강 의미 담긴 식물",
  "집들이 선물로 인기 있는 식물 TOP 8",
  "아기 방에 두기 좋은 식물: 무독성 공기정화식물 추천",
  "반려묘가 건드려도 안전한 식물 완전 목록",
  "관상용 열매 달리는 식물 8선: 인테리어+수확 동시에",
  "겨울에도 꽃 피는 실내식물 TOP 6",
  "봄에 심으면 여름에 꽃 피는 한해살이 추천",
  "가을에 심는 구근 식물 BEST 5: 봄 개화 준비",
  "비 오는 날 기분 좋아지는 향기 식물 7선",
  "인스타그램 감성 식물 인테리어 BEST 10",
  "미니멀 인테리어에 어울리는 식물 조합",
  "북유럽 스타일 플랜테리어: 토분과 식물 매칭법",
  "한옥·전통 인테리어에 어울리는 식물 추천",
  "카페 분위기 인테리어 식물: 감성 카페처럼 꾸미기",
  "1인 가구 식물 입문 패키지: 3개 조합 추천",
  "신혼부부 식물 인테리어: 2인 생활에 맞는 식물 배치",
  "아이 있는 집 식물 안전 가이드: 독성 식물 완전 차단",
  "MBTI별 어울리는 반려식물 추천 가이드",
  "고민을 들어주는 식물: 심리적 안정 효과 식물 추천",
  "공부방에 두면 집중력 높이는 식물 5선",
  "침실 공기정화 최강 식물: 산소 방출 야간 식물",
  "욕실 습도 활용 식물: 샤워 스팀으로 키우는 식물",
  "주방 창가에 어울리는 허브 식물 조합",
  "베란다 4계절 꽃밭 만들기: 시기별 식물 교체 전략",
  "채광 좋은 남향 창가 식물 배치 완전 가이드",
  "동향·서향 창가 최적 식물 추천",
  "북향 집에서 키울 수 있는 음지 식물 완전 목록",
  "아파트 옥상 텃밭 만들기: 허가·식물·관리 가이드",
  "커뮤니티 가든 시작하기: 한국 아파트 단지 텃밭 가이드",

  // 추가 계절·관리 (20개)
  "3월 봄 식물 관리: 겨울잠 깬 식물 첫 비료 주기",
  "5월 황금연휴 식물 관리: 자리 비울 때 준비 리스트",
  "6월 장마 전 준비: 과습 예방 화분 세팅법",
  "7월 폭염 대응: 베란다 차광막 설치와 물주기 조정",
  "8월 휴가 중 식물 관리: 10일 이상 자리 비울 때",
  "9월 가을 비료 전환: 성장에서 월동 준비로",
  "10월 구근 심기 골든타임: 봄 꽃밭 미리 준비",
  "11월 실내 이동 타이밍: 베란다 식물 겨울나기",
  "12월 크리스마스 식물 장식: 포인세티아·홀리 관리",
  "1월 실내 난방 건조: 가습기 대신 식물 활용법",
  "2월 봄 준비: 가지치기·분갈이 시작 신호 확인법",
  "미세먼지 경보 날 식물 관리: 창문 열기 vs 닫기",
  "태풍 대비 베란다 식물 안전 조치",
  "폭설 후 베란다 식물 점검: 냉해 진단법",
  "봄 꽃가루 철 식물 잎 관리: 먼지 닦기와 물 스프레이",
  "여름 장마 후 화분 배수 점검: 뿌리 썩음 예방",
  "가을 낙엽 계절 실내 식물 변화 읽기",
  "겨울 난방비 절약 식물 관리: 최소 물주기 전략",
  "식물 이사 가이드: 이사할 때 식물 안전하게 옮기는 법",
  "식물 여름 휴가 보내기: 스스로 살아남는 환경 세팅",

  // 추가 병충해·응급 (20개)
  "식물 응급 진단 매뉴얼: 잎 색으로 문제 파악하기",
  "화분 뒤집어서 뿌리 확인하는 법: 건강 체크 완전 가이드",
  "물 끊인 후 살리기: 완전 시든 식물 수분 공급법",
  "곰팡이 핀 흙 교체법: 환경 개선으로 재발 방지",
  "잎에 물방울 흔적 제거: 석회 자국 없애는 법",
  "비료 과잉 증상: 비료 화상 입은 식물 응급 처치",
  "뿌리 전정법: 뿌리 과다 성장 화분 갱신 가이드",
  "식물 낙엽 후 재생: 줄기만 남은 식물 살리는 법",
  "황화 현상 원인 분석: 빛 부족 vs 영양 결핍 구분",
  "줄기 무름병 응급처치: 세균성 질환 초기 대응",
  "잎에 갈색 반점 원인: 곰팡이·세균·해충 구분법",
  "화분 뿌리파리 완전 제거: 천연 살충제 만들기",
  "온실가루이 방제: 흰 가루 해충 퇴치 완전 가이드",
  "응애류 종류별 방제: 점박이·차응애·거미응애 차이",
  "달팽이 베란다 침입 방지: 자연 방제법 완전 가이드",
  "선충 토양 처리: 뿌리혹선충 피해 식물 관리",
  "나방 유충 방제: 화분 흙 속 해충 제거법",
  "식물 바이러스 증상: 모자이크병 발생 시 대처법",
  "무름병 예방 흙 선택: 배수성 높은 혼합토 만들기",
  "깍지벌레 천적 활용: 무당벌레로 친환경 방제하기"
];

// ── Gemini API 호출 ────────────────────────────────────────
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const PRO_MODEL = process.env.GEMINI_PRO_MODEL ?? "gemini-2.5-pro";
const FLASH_MODEL = process.env.GEMINI_FLASH_MODEL ?? "gemini-2.5-flash";

async function callGemini(model, prompt, temperature = 0.7) {
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: 8192,
      responseMimeType: "application/json"
    }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty Gemini response");

  return JSON.parse(text);
}

// ── 리서치 프롬프트 ────────────────────────────────────────
function buildResearchPrompt(topic) {
  return `
당신은 한국 반려식물·가드닝 전문 리서처입니다.
다음 주제를 한국 독자(20~40대, 아파트 생활자, MZ 세대) 관점에서 심층 분석하세요.

주제: "${topic}"

반드시 아래 JSON 형식으로만 응답하세요:
{
  "primaryKeyword": "메인 SEO 키워드 (한국어, 월 검색량 높은 것)",
  "secondaryKeywords": ["연관 키워드1", "키워드2", "키워드3", "키워드4"],
  "searchIntent": "정보형 또는 비교형 또는 How-to형",
  "targetAudience": "구체적인 독자 프로필 한 문장",
  "uniqueAngle": "한국 기후·생활 환경 기반 차별화 관점",
  "keyFacts": [
    "핵심 사실1 (가능하면 정량 데이터)",
    "핵심 사실2",
    "핵심 사실3",
    "핵심 사실4",
    "핵심 사실5"
  ],
  "commonMistakes": ["흔한 실수1", "흔한 실수2", "흔한 실수3"],
  "outline": ["H2 섹션 제목1", "H2 섹션 제목2", "H2 섹션 제목3", "H2 섹션 제목4", "H2 섹션 제목5"],
  "faq": [
    {"q": "자주 묻는 질문1", "a": "간결한 답변1"},
    {"q": "자주 묻는 질문2", "a": "간결한 답변2"},
    {"q": "자주 묻는 질문3", "a": "간결한 답변3"},
    {"q": "자주 묻는 질문4", "a": "간결한 답변4"},
    {"q": "자주 묻는 질문5", "a": "간결한 답변5"}
  ]
}
`.trim();
}

// ── 구조 변형 시드 (글마다 다른 패턴 유도) ──────────────
const INTRO_STYLES = [
  "독자의 실패 경험 공감으로 시작 → 해결책 예고",
  "한국 기후·계절 이슈 제시 → 이 글이 해결해 주는 이유",
  "식물의 흥미로운 생물학적 특성으로 시작 → 관리법 연결",
  "SNS/유행 언급 → 실전 관리 현실 제시",
  "Q&A 형식: '혹시 이런 경험 있으세요?' 로 시작",
  "놀라운 데이터·통계로 시작 → 독자 관심 유도",
  "계절별 체감 상황 묘사 → 오늘 당장 필요한 이유 제시"
];
const STRUCTURE_TYPES = [
  "문제해결형: 증상별 원인·해결책 → 예방 → 심화 팁 순서",
  "단계별 가이드형: 구매 전 → 첫날 → 1개월 → 계절별",
  "비교분석형: 잘못된 방법 vs 올바른 방법 대조",
  "체크리스트형: 핵심 포인트를 점검표로 구성",
  "스토리텔링형: 독자 상황 → 문제 → 해결 여정",
  "심층분석형: 원리 이해 → 적용 조건 → 심화 응용",
  "Q&A형: 독자 자주 묻는 질문 5-7개를 H2로 구성"
];
const CLOSING_STYLES = [
  "독자에게 질문 남기기 ('여러분의 경험을 댓글로 알려주세요')",
  "다음 단계 행동 유도 ('지금 바로 확인해보세요')",
  "플랜티프렌즈 사이트 내 관련 기능 안내",
  "계절별 다음 할 일 미리보기"
];

function pickRandom(arr, seed) {
  return arr[seed % arr.length];
}

// ── 글 유형 감지 (주제별 맞춤 요소) ──────────────────────
function detectTopicType(topic) {
  if (/꽃말|꽃의\s*의미|상징|유래/.test(topic)) return "flower-meaning";
  if (/병충해|해충|곰팡이|무름|바이러스|응급|방제|진단|살충/.test(topic)) return "pest-disease";
  if (/[0-9]월|봄|여름|가을|겨울|계절|장마|폭염|월동|추위|더위/.test(topic)) return "seasonal";
  if (/화분|흙|비료|조명|분무기|급수|거치대|행잉|도구|용기/.test(topic)) return "tools";
  if (/선물|추천|BEST|선택|인테리어|어울리|조합|TOP/.test(topic)) return "plant-selection";
  return "care-guide";
}

function getTopicTypeElements(type) {
  switch (type) {
    case "flower-meaning":
      return `- 색깔/품종별 꽃말 비교 표 (필수)
- 한국·서양 문화 차이 설명
- 선물 적합 상황별 추천 (생일·기념일·위로 등)
- 관련 한국 시가·문학·전통 문화 언급
- 현실적인 구매·관리 팁 연결`;
    case "pest-disease":
      return `- 증상 진단 체크리스트 표 (필수: 증상→원인→해결책 3열)
- 단계별 응급 처치 순서 (번호 목록)
- 예방법 vs 발생 후 처치 비교 callout
- ⚠️ 경고 callout: 심각 증상·전파 위험
- 천연 방제법 + 약제 처리 모두 포함`;
    case "seasonal":
      return `- 월별 관리 포인트 표 또는 캘린더 (필수)
- 한국 기후 특이사항 callout (장마·한파·폭염)
- 계절 전환 체크리스트
- "이달의 할 일" 요약 목록
- 실패 사례 반면교사 포함`;
    case "tools":
      return `- 제품/방법 비교 표 (장단점·가격대·추천 대상 3열 이상, 필수)
- 예산별 추천 (입문·중급·프로)
- 구매 전 체크리스트
- 실제 사용 시 주의사항
- A/S·유지관리 팁`;
    case "plant-selection":
      return `- 식물별 적합도 표 (환경·난이도·특성 비교, 필수)
- 상황별 추천 목록 (공간·생활패턴·예산 기준)
- 각 식물 Quick Facts 핵심 수치
- 실패 없는 선택 기준 체크리스트
- 구매 시 피해야 할 실수`;
    default:
      return `- Quick Facts 표 (온도·습도·광량·물주기 수치, 필수)
- 단계별 실전 관리 가이드
- 계절별 주의사항
- 한국 아파트 특화 팁
- 흔한 실수와 해결법`;
  }
}

// ── 글 생성 프롬프트 ──────────────────────────────────────
function buildWritePrompt(topic, research, seed = 0) {
  const introStyle = pickRandom(INTRO_STYLES, seed);
  const structureType = pickRandom(STRUCTURE_TYPES, seed + 1);
  const closingStyle = pickRandom(CLOSING_STYLES, seed + 2);
  const topicType = detectTopicType(topic);
  const typeElements = getTopicTypeElements(topicType);

  return `
당신은 플랜티프렌즈(PlantyFriends) 편집팀 시니어 에디터입니다.

## 사이트 페르소나 규칙 (필수 준수)
- 브랜드: 플랜티프렌즈
- 타겟: 20~35세 MZ 여성, 도시 아파트 생활자, 반려식물 1~5개 보유
- 어투: 친근한 존댓말 ("~예요", "~답니다", "~해요") — 딱딱한 보고서 문체 금지
- 표현 다양성: 식물 이름 직접 호칭 우선, 의인화는 글당 최대 2회
- 금지 표현: "이 친구는~" 반복, "기특한", "쏠쏠", "든든한 친구", "국민 식물", "완벽한"
- 금지: 의료 효능 단정, "무조건 안전", 출처 없는 통계, 과장 마케팅
- 글 마지막에 "플랜티프렌즈 편집팀" 서명 포함

## 이 글의 고유 구조 (반드시 이 글에서만 사용)
- 인트로 스타일: ${introStyle}
- 본문 구조: ${structureType}
- 마무리 스타일: ${closingStyle}
- 첫 H2 제목: "인트로"나 "들어가며" 금지 — 주제 핵심어를 담은 고유 제목 사용

## 주제
"${topic}"

## 리서치 데이터
${JSON.stringify(research, null, 2)}

## 이 글 유형(${topicType})에 필수 포함 요소
${typeElements}

## 공통 필수 포함 요소
- 한국 아파트 환경 특이사항 callout (> 로 시작하는 blockquote 형식, 최소 1개)
- 정량 데이터 최소 3개 (온도℃, 습도%, 빛 조도lux 또는 물주기 일수 등 구체적 수치)
- FAQ 5개 이상 (### 으로 시작, 실제 검색 쿼리 형태로 — 질문부호로 끝날 것)

## 가독성 색상 마크업 (필수 사용)
본문에서 아래 3가지 마크업을 반드시 사용해 가독성을 높이세요 (각 최소 2~4회):
- **핵심 용어·수치** → \`**굵게**\` (연두색 배경으로 강조됨)
- *중요 포인트·경고* → \`*기울임*\` (주황/테라코타 색으로 강조됨)
- ==형광 하이라이트== → \`==텍스트==\` (노란 형광펜 효과, 가장 중요한 핵심 1~2개)
예시: **물주기 7~10일** 간격이 기본이며, 겨울엔 *과습 주의*가 필수입니다. ==분갈이는 봄에==가 원칙.

## 출력 형식 (반드시 JSON만 반환)
{
  "title": "SEO 최적화 제목 (60자 이하, primaryKeyword 앞배치 + secondaryKeywords 중 1개 자연 포함, 독자 혜택 명시)",
  "metaDescription": "검색 결과 노출 설명 (150~160자, primaryKeyword + secondaryKeywords 1-2개 자연 포함, 독자 혜택·행동 유도 문장으로 마무리)",
  "slug": "seo-friendly-url-slug-in-english-or-romanized",
  "category": "키우기가이드 또는 식물선택 또는 계절관리 또는 병충해 또는 도구 또는 꽃말문화",
  "tags": ["primaryKeyword", "secondaryKeyword1", "secondaryKeyword2", "태그4", "태그5"],
  "bodyMarkdown": "[위에서 지정한 고유 구조 + 글 유형별 필수 요소를 포함한 마크다운. 최소 1800자, H2 섹션 5개 이상]",
  "qualityScores": {
    "eeat": 점수(0-20),
    "structure_uniqueness": 점수(0-20),
    "seo": 점수(0-20),
    "factual": 점수(0-20),
    "cliche_avoidance": 점수(0-20)
  },
  "totalQuality": 합계점수(0-100)
}

## 품질 기준 (totalQuality 90점 이상 필수)
- eeat 17+: 정량 수치 3개 이상, 한국 기후·환경 특화 내용 명시, 실제 경험 기반 내용
- structure_uniqueness 17+: 다른 글과 다른 고유 H2 구조, 지정된 구조 타입 준수, 글 유형별 요소 포함
- seo 17+: title에 primaryKeyword + 연관 키워드 1개, metaDescription에 primaryKeyword + secondaryKeyword 1-2개, H2에 자연 배치
- factual 18+: 틀린 정보 없음, 구체적 수치·조건 명시
- cliche_avoidance 18+: 금지 표현 미사용, 각 글 고유 어투 유지, 템플릿 느낌 없음

본문은 최소 1800자 이상, H2 섹션 5개 이상, FAQ 5개 이상 필수.
글 유형에 맞는 표·체크리스트·callout이 없으면 totalQuality 85 미만 처리.
**bold**, *italic*, ==highlight== 마크업을 각 2회 이상 사용하지 않으면 totalQuality 85 미만 처리.
`.trim();
}

// ── 슬러그 생성 ──────────────────────────────────────────
function toSlug(title) {
  return title
    .toLowerCase()
    .replace(/[가-힣]+/g, (match) => {
      const codes = [...match].map((c) => c.charCodeAt(0));
      return codes.join("-");
    })
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

// ── 스케줄 시간 계산 ──────────────────────────────────────
function getScheduledAt(index, existingCount) {
  const now = new Date();
  const hoursFromNow = (existingCount + index + 1) * PUBLISH_INTERVAL_HOURS;
  return new Date(now.getTime() + hoursFromNow * 60 * 60 * 1000);
}

// ── 기존 슬러그 목록 조회 ────────────────────────────────
async function getExistingSlugs() {
  try {
    const rows = await db.select({ slug: blogPosts.slug }).from(blogPosts);
    return new Set(rows.map((r) => r.slug));
  } catch {
    return new Set();
  }
}

// ── 기존 발행 예정 글 수 ────────────────────────────────
async function getScheduledCount() {
  try {
    const rows = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.isPublished, false));
    return rows.length;
  } catch {
    return 0;
  }
}

// ── 메인 실행 ──────────────────────────────────────────────
async function main() {
  console.log(`\n🌱 플랜티프렌즈 블로그 글 생성 시작`);
  console.log(`   주제 목록: ${TOPICS.length}개`);
  console.log(`   시작 인덱스: ${startIdx}`);
  console.log(`   생성 수: ${count}개`);
  console.log(`   발행 간격: ${PUBLISH_INTERVAL_HOURS}시간`);
  console.log(`   품질 기준: ${QUALITY_THRESHOLD}점 이상`);
  console.log(`   드라이런: ${isDryRun ? "예 (DB 저장 안 함)" : "아니오"}`);
  console.log("");

  const existingSlugs = await getExistingSlugs();
  const scheduledCount = await getScheduledCount();
  console.log(`   기존 슬러그: ${existingSlugs.size}개`);
  console.log(`   예약 대기 중: ${scheduledCount}개\n`);

  const topics = TOPICS.slice(startIdx, startIdx + count);
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    console.log(`\n[${i + 1}/${topics.length}] 📝 ${topic}`);

    let attempt = 0;
    let saved = false;

    while (attempt < MAX_RETRIES && !saved) {
      attempt++;
      if (attempt > 1) {
        console.log(`   ↺ 재시도 ${attempt}/${MAX_RETRIES}`);
        await sleep(3000);
      }

      try {
        // Step 1: 리서치
        console.log(`   🔍 리서치 중...`);
        let research;
        try {
          research = await callGemini(FLASH_MODEL, buildResearchPrompt(topic), 0.5);
        } catch (e) {
          console.log(`   ⚠️ 리서치 실패: ${e.message}`);
          research = { primaryKeyword: topic, secondaryKeywords: [], keyFacts: [], faq: [], outline: [] };
        }

        console.log(`   ✓ 리서치 완료 (키워드: ${research.primaryKeyword})`);

        // Step 2: 글 생성
        console.log(`   ✍️ 글 생성 중...`);
        const post = await callGemini(PRO_MODEL, buildWritePrompt(topic, research, startIdx + i), 0.9);

        const totalQuality = post.totalQuality ?? (
          (post.qualityScores?.eeat ?? 0) +
          (post.qualityScores?.persona ?? 0) +
          (post.qualityScores?.seo ?? 0) +
          (post.qualityScores?.factual ?? 0) +
          (post.qualityScores?.aiCliche ?? 0)
        );

        console.log(`   📊 품질 점수: ${totalQuality}점 (기준: ${QUALITY_THRESHOLD}점)`);

        if (totalQuality < QUALITY_THRESHOLD) {
          console.log(`   ❌ 품질 미달 (${totalQuality} < ${QUALITY_THRESHOLD})`);
          continue;
        }

        // Step 3: 슬러그 중복 체크
        const slug = post.slug ?? toSlug(post.title);
        let finalSlug = slug;
        let slugSuffix = 1;
        while (existingSlugs.has(finalSlug)) {
          finalSlug = `${slug}-${++slugSuffix}`;
        }

        if (!isDryRun) {
          const now = new Date();
          const scheduledAt = getScheduledAt(successCount, scheduledCount);

          await db.insert(blogPosts).values({
            slug: finalSlug,
            title: post.title,
            metaDescription: post.metaDescription,
            category: post.category ?? "가드닝",
            tags: post.tags ?? [],
            bodyMarkdown: post.bodyMarkdown,
            qualityScore: totalQuality,
            qualityBreakdown: post.qualityScores,
            researchJson: research,
            generatedBy: PRO_MODEL,
            scheduledAt,
            isPublished: false,
            createdAt: now,
            updatedAt: now
          });

          existingSlugs.add(finalSlug);
          console.log(`   ✅ 저장 완료 → 예약: ${scheduledAt.toLocaleString("ko-KR")}`);
        } else {
          console.log(`   ✅ [드라이런] 저장 생략 → 제목: "${post.title}"`);
        }

        successCount++;
        saved = true;

      } catch (err) {
        console.log(`   ❌ 오류: ${err.message}`);
        if (attempt >= MAX_RETRIES) {
          failCount++;
          console.log(`   💀 최대 재시도 초과, 건너뜀`);
        }
      }
    }

    if (!saved && attempt >= MAX_RETRIES) {
      skipCount++;
    }

    // API rate limit 방지: 요청 간격
    if (i < topics.length - 1) {
      await sleep(2000);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`🌿 완료!`);
  console.log(`   ✅ 성공: ${successCount}개`);
  console.log(`   ❌ 실패: ${failCount}개`);
  console.log(`   ⏭ 건너뜀: ${skipCount}개`);

  if (!isDryRun && successCount > 0) {
    const firstPublish = new Date(Date.now() + PUBLISH_INTERVAL_HOURS * 60 * 60 * 1000);
    const lastPublish = new Date(Date.now() + (scheduledCount + successCount) * PUBLISH_INTERVAL_HOURS * 60 * 60 * 1000);
    console.log(`\n   📅 첫 예약 공개: ${firstPublish.toLocaleString("ko-KR")}`);
    console.log(`   📅 마지막 예약 공개: ${lastPublish.toLocaleString("ko-KR")}`);
    console.log(`   ⏰ 5시간마다 Vercel Cron이 자동 공개합니다`);
  }

  await client.close();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
