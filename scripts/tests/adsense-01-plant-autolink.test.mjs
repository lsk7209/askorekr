import assert from "node:assert/strict";
import {
  createPlantNameLinker,
  isAutoLinkableName
} from "../../src/features/plants/name-map.ts";

const nameMap = {
  조: "setaria-italica",
  감: "diospyros-kaki",
  자란: "bletilla-striata",
  타임: "thymus-vulgaris",
  관음죽: "rhapis-excelsa",
  테이블야자: "chamaedorea-elegans",
  몬스테라: "monstera-deliciosa"
};

// 1. 1글자 국명과 일상어 충돌 국명은 링크 대상에서 제외
{
  assert.equal(isAutoLinkableName("조"), false);
  assert.equal(isAutoLinkableName("자란"), false);
  assert.equal(isAutoLinkableName("타임"), false);
  assert.equal(isAutoLinkableName("몬스테라"), true);
}

// 2. 운영 사이트에서 발견된 단어 중간 오링크가 재발하지 않아야 함
{
  const link = createPlantNameLinker(nameMap);
  const html = link("조금은 차갑고, 건조하면 무조건 정서적 안정감을 얻고 습기를 먹고 자란다고 해요. 광합성 타임");
  assert.equal(html.includes("<a "), false, html);
}

// 3. 한글 단어 경계: 무늬관음죽의 '관음죽'은 링크하지 않고, 조사 붙은 단독 국명은 링크
{
  const link = createPlantNameLinker(nameMap);
  assert.equal(link("무늬관음죽 키우기").includes("<a "), false);
  assert.equal(
    createPlantNameLinker(nameMap)("관음죽은 그늘에 강해요"),
    '<a href="/plant/rhapis-excelsa">관음죽</a>은 그늘에 강해요'
  );
  assert.equal(
    createPlantNameLinker(nameMap)("테이블야자가 정답"),
    '<a href="/plant/chamaedorea-elegans">테이블야자</a>가 정답'
  );
}

// 4. 식물별 첫 1회만 링크 (한 글 안에서 링커 상태 공유)
{
  const link = createPlantNameLinker(nameMap);
  const first = link("몬스테라는 쉬워요");
  const second = link("몬스테라 물주기");
  assert.ok(first.includes('href="/plant/monstera-deliciosa"'));
  assert.equal(second.includes("<a "), false);
}

// 5. 글 전체 링크 수 상한
{
  const link = createPlantNameLinker(nameMap, 1);
  const html = link("몬스테라와 관음죽");
  assert.equal(html.match(/<a /g)?.length, 1);
}

// 6. 기존 <a> 내부와 태그 속성은 건드리지 않음
{
  const link = createPlantNameLinker(nameMap);
  const html = link('<a href="/blog/x">몬스테라 가이드</a> <strong title="몬스테라">관음죽</strong>');
  assert.equal(
    html,
    '<a href="/blog/x">몬스테라 가이드</a> <strong title="몬스테라"><a href="/plant/rhapis-excelsa">관음죽</a></strong>'
  );
}

console.log("adsense-01 plant autolink tests passed");
