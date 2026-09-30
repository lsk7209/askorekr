/**
 * 기존 블로그 글 수렴 패턴 제거 스크립트
 * 실행: node scripts/diversify-blog-posts.mjs [--dry-run] [--limit=N]
 *
 * 수행 작업:
 *  1. 첫 번째 H2 제목 "인트로" → 주제별 고유 제목으로 교체
 *  2. 반복 표현 다양화 ("이 친구는~" 등)
 *  3. 한국 환경 callout 박스 추가 (없는 경우)
 *  4. 마무리 서명 위 마지막 문단 다양화
 */

import { createClient } from "@libsql/client";

const isDryRun = process.argv.includes("--dry-run");

/** "--limit=N" 형태만 지원(기존 문서 계약). 값이 있는데 양의 정수가 아니면 명시적으로 거절한다. */
function parseLimitArg(argv) {
  const limitArg = argv.find((a) => a.startsWith("--limit="));
  if (!limitArg) return 9999;

  const raw = limitArg.split("=")[1];
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`--limit 값이 올바르지 않습니다: "${raw}" (양의 정수만 허용)`);
  }
  return parsed;
}

const limit = parseLimitArg(process.argv);

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN
});

// ── 대체 인트로 제목 패풀 ──────────────────────────────────
const INTRO_HEADING_ALTERNATES = [
  "왜 지금 {plant}인가요?",
  "{plant}, 제대로 알고 시작하기",
  "이런 고민 해보셨나요?",
  "{plant}를 선택한 이유",
  "한국 집에서 {plant} 키우기 전에",
  "{plant}에 대한 솔직한 이야기",
  "처음 만나는 {plant}",
  "집 안에서 {plant}가 행복할 수 있을까요?",
  "오늘의 식물 이야기"
];

// ── 반복 표현 대체 규칙 ────────────────────────────────────
const PHRASE_REPLACEMENTS = [
  // "이 친구는" → 식물 이름 직접 호칭 (컨텍스트 없을 때 일반 대체)
  { from: /이 친구는~/g, to: "이 식물은~" },
  { from: /이 친구가/g, to: "이 식물이" },
  { from: /이 친구를/g, to: "이 식물을" },
  { from: /이 친구에게/g, to: "이 식물에게" },
  { from: /이 친구와/g, to: "이 식물과" },
  { from: /기특한 반려식물/g, to: "매력적인 실내 식물" },
  { from: /기특한 친구/g, to: "든든한 식물" },
  { from: /기특한 녀석/g, to: "매력적인 식물" },
  { from: /기특하게/g, to: "훌륭하게" },
  { from: /기특하다/g, to: "대단하다" },
  { from: /기특한/g, to: "매력적인" },
  { from: /이만한 친구가 없/g, to: "이만한 식물이 없" },
  { from: /국민 반려식물로 등극/g, to: "많은 사랑을 받는 식물" },
  { from: /국민 식물/g, to: "인기 식물" },
  { from: /쏠쏠하/g, to: "각별하" },
  { from: /쏠쏠한/g, to: "소소한" },
  { from: /든든한 반려식물/g, to: "믿음직한 실내 식물" },
  { from: /완벽한 반려식물/g, to: "훌륭한 실내 식물" },
  { from: /완벽한 식물/g, to: "이상적인 식물" },
];

// ── 한국 환경 callout 템플릿 ──────────────────────────────
const KOREAN_ENV_CALLOUTS = [
  "> **한국 아파트 환경 포인트**: 우리나라 주거 환경은 겨울철 실내 습도가 30% 이하로 떨어지기 쉬워요. 겨울에는 가습기 활용이나 잎 분무로 습도를 보완해 주세요.",
  "> **계절별 관리 팁**: 한국의 장마(6~7월)와 강한 여름 햇빛(7~8월)에 주의하세요. 장마철에는 과습, 한여름에는 직사광선 화상이 주요 위험 요인입니다.",
  "> **도시 아파트 관리 포인트**: 미세먼지가 심한 날 창문을 닫으면 통풍이 부족해집니다. 서큘레이터로 실내 공기를 순환시켜 뿌리 과습과 곰팡이를 예방하세요.",
  "> **한국 물 관리**: 수돗물의 염소 성분에 민감한 식물이라면 물을 하루 받아두었다 사용하거나 정수된 물을 사용하는 것이 좋아요.",
  "> **베란다 vs 실내**: 한국 아파트 베란다는 겨울에 0°C 이하로 내려갈 수 있어요. 냉해에 약한 식물은 11월부터 실내로 이동해 주세요.",
];

// ── 마무리 다양화 풀 ──────────────────────────────────────
const OUTRO_VARIANTS = [
  "\n플랜티프렌즈에서 비슷한 환경에 맞는 식물을 더 찾아보세요!",
  "\n궁금한 점은 플랜티프렌즈 식물 진단 기능을 활용해 보세요.",
  "\n여러분의 식물 이야기도 들려주세요!",
  "\n다음 분갈이 전에 이 가이드를 다시 한번 확인해 보세요.",
  "\n플랜티프렌즈와 함께라면 건강한 반려식물 생활을 이어갈 수 있어요.",
];

// ── 제목에서 식물 이름 추출 (간단한 휴리스틱) ────────────
function extractPlantName(title) {
  const m = title.match(/^([가-힣a-zA-Z·\s]+?)[\s:,]/);
  if (m) return m[1].trim();
  return "";
}

// ── 인트로 제목 교체 ──────────────────────────────────────
function replaceIntroHeading(md, plantName, seed) {
  // "## 인트로\n\n" 패턴 감지
  if (!/^## 인트로\s*\n/m.test(md)) return md;

  const alt = INTRO_HEADING_ALTERNATES[seed % INTRO_HEADING_ALTERNATES.length];
  const heading = alt.replace("{plant}", plantName || "이 식물");
  return md.replace(/^## 인트로(\s*\n)/m, `## ${heading}$1`);
}

// ── callout 추가 (Quick Facts 뒤에) ──────────────────────
function addKoreanCallout(md, seed) {
  // 이미 > 로 시작하는 blockquote가 있으면 스킵
  if (/^> \*\*(한국|계절|도시|베란다|수돗)/m.test(md)) return md;

  const callout = KOREAN_ENV_CALLOUTS[seed % KOREAN_ENV_CALLOUTS.length];

  // "## Quick Facts" 섹션 다음 빈 줄 2개 이후에 삽입
  const qfMatch = md.match(/^## Quick Facts[\s\S]*?\n\n/m);
  if (!qfMatch) return md + "\n\n" + callout;

  const insertPos = md.indexOf(qfMatch[0]) + qfMatch[0].length;
  return md.slice(0, insertPos) + callout + "\n\n" + md.slice(insertPos);
}

// ── 마무리 다양화 ─────────────────────────────────────────
function diversifyOutro(md, seed) {
  const outroVariant = OUTRO_VARIANTS[seed % OUTRO_VARIANTS.length];
  // "---\n*플랜티프렌즈 편집팀*" 앞에 아웃트로 삽입 (이미 있으면 스킵)
  const sigPattern = /\n---\n\*플랜티프렌즈 편집팀\*/;
  if (!sigPattern.test(md)) return md;

  const existingOutroCheck = OUTRO_VARIANTS.some((v) => md.includes(v.trim()));
  if (existingOutroCheck) return md;

  return md.replace(sigPattern, outroVariant + "\n\n---\n*플랜티프렌즈 편집팀*");
}

// ── 반복 표현 교체 ────────────────────────────────────────
function replacePhrases(md) {
  let result = md;
  for (const { from, to } of PHRASE_REPLACEMENTS) {
    result = result.replace(from, to);
  }
  return result;
}

// ── 메인 ──────────────────────────────────────────────────
async function main() {
  const result = await client.execute({
    sql: "SELECT id, title, body_markdown FROM blog_posts ORDER BY id LIMIT ?",
    args: [limit]
  });

  console.log(`📋 처리 대상: ${result.rows.length}개 글 (${isDryRun ? "드라이런" : "실제 업데이트"})`);

  let changed = 0;
  let unchanged = 0;

  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows[i];
    const { id, title } = row;
    const originalMd = String(row.body_markdown ?? "");
    const plantName = extractPlantName(String(title));
    const seed = i;

    let md = originalMd;
    md = replaceIntroHeading(md, plantName, seed);
    md = addKoreanCallout(md, seed);
    md = diversifyOutro(md, seed);
    md = replacePhrases(md);

    if (md === originalMd) {
      unchanged++;
      continue;
    }

    if (!isDryRun) {
      const now = Math.floor(Date.now() / 1000);
      await client.execute({
        sql: "UPDATE blog_posts SET body_markdown = ?, updated_at = ? WHERE id = ?",
        args: [md, now, id]
      });
    }
    changed++;

    if (i < 3 || i % 50 === 0) {
      console.log(`  [${i + 1}] ${title} → 수정됨`);
    }
  }

  console.log(`\n✅ 완료: 수정 ${changed}개 / 미변경 ${unchanged}개`);
  await client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
