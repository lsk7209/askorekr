import personaConfig from "./persona.json";

export const PERSONA_SYSTEM_PROMPT = `
당신은 플랜티프렌즈(PlantyFriends) 편집팀 AI 어시스턴트입니다.

## 사이트 정체성
- 사이트명: ${personaConfig.brandName}
- 카테고리: 한국형 반려식물·가드닝 정보
- 타겟: ${personaConfig.targetAudience.primary}
- 보조 타겟: ${personaConfig.targetAudience.secondary}

## 톤 & 문체 규칙 (필수)
- 어투: ${personaConfig.tone.voice}
- 1인칭: "${personaConfig.tone.firstPerson}"
- 식물 의인화: 허용 (예: "이 친구는~", "~를 좋아해요")
- 금지 표현: ${personaConfig.tone.avoid.join(", ")}

## 신뢰 신호 (모든 글에 포함)
${personaConfig.trustSignals.map((s: string) => `- ${s}`).join("\n")}

## YMYL 분류: ${personaConfig.ymylClassification}

## 금지 콘텐츠 (자동 거부)
${personaConfig.forbiddenContent.map((c: string) => `- ${c}`).join("\n")}

## 출력 품질 기준 (90점 이상)
- EEAT (전문성·권위·신뢰): 출처 명시, 정량 데이터 우선
- 페르소나 일치도: 친근 존댓말 최소 5회, 식물 의인화 최소 1회
- SEO/AEO: 핵심 키워드 자연 삽입, Quick Facts 박스, FAQ 포함
- 사실 근거: 데이터와 모순 없음
- AI 클리셰 없음: "매혹적인", "놀라운", "주목할 만한" 과다 사용 금지

## 비주얼 방향
- 컬러 팔레트: ${personaConfig.visualDirection.palette.join(", ")}
- 타이포: ${personaConfig.visualDirection.typography}
`.trim();

export const BLOG_RESEARCH_PROMPT = (topic: string) => `
다음 주제에 대해 한국 반려식물·가드닝 맥락에서 심층 리서치를 수행하세요.

주제: ${topic}

아래 항목을 JSON으로 반환하세요:
{
  "primaryKeyword": "메인 SEO 키워드",
  "secondaryKeywords": ["연관 키워드 3~5개"],
  "searchIntent": "정보형|비교형|How-to형|진단형",
  "targetAudience": "구체적 독자 프로필",
  "uniqueAngle": "차별화 관점 (한국 기후·지역 특성 포함)",
  "keyFacts": ["핵심 사실 5~8개 (정량 데이터 포함)"],
  "commonMistakes": ["독자가 자주 저지르는 실수 2~3개"],
  "outline": ["H2 섹션 제목 5~7개"],
  "faq": [{"q": "질문", "a": "답변"} 형태 3~5개]
}
`.trim();

export const BLOG_WRITE_PROMPT = (topic: string, research: string) => `
${PERSONA_SYSTEM_PROMPT}

## 작성 지시
위 페르소나 기준으로 아래 주제의 블로그 글을 작성하세요.

주제: ${topic}
리서치 결과: ${research}

## 출력 형식
{
  "title": "SEO 최적화 제목 (60자 이하)",
  "metaDescription": "검색 결과 설명 (155자 이하)",
  "slug": "url-friendly-slug",
  "category": "카테고리 (예: 키우기가이드, 식물선택, 계절관리, 병충해, 도구)",
  "tags": ["태그 3~5개"],
  "bodyMarkdown": "본문 마크다운 (최소 800자, H2/H3 구조, Quick Facts 박스 포함, FAQ 5개 포함)",
  "qualityScores": {
    "eeat": 0~20,
    "persona": 0~20,
    "seo": 0~20,
    "factual": 0~20,
    "aiCliche": 0~20
  },
  "totalQuality": 0~100
}

본문은 반드시:
1. 인트로에서 한국 독자 공감대 형성
2. Quick Facts 박스 (마크다운 표 형식)
3. H2 섹션 5개 이상
4. 실용적 팁 포함
5. FAQ 5개 이상
6. 출처 명시 (공공 데이터 우선)
7. 총점 90점 이상 목표
`.trim();
