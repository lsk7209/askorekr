import { ImageResponse } from "next/og";
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from "@/seo/og";

export const runtime = "edge";

const MAX_TITLE_LENGTH = 42;
const MAX_SUBTITLE_LENGTH = 80;
const MAX_LABEL_LENGTH = 24;

function trimText(value: string | null, fallback: string, maxLength: number) {
  const text = value?.trim() || fallback;

  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = trimText(
    searchParams.get("title"),
    "플랜티프렌즈",
    MAX_TITLE_LENGTH
  );
  const subtitle = trimText(
    searchParams.get("subtitle"),
    "한국 기후와 생활 환경에 맞는 반려식물 가이드",
    MAX_SUBTITLE_LENGTH
  );
  const label = trimText(
    searchParams.get("label"),
    "PlantyFriends",
    MAX_LABEL_LENGTH
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fbfaf4",
          color: "#233126",
          padding: "72px",
          fontFamily:
            "Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
          position: "relative"
        }}
      >
        <div
          style={{
            position: "absolute",
            right: "-120px",
            top: "-80px",
            width: "420px",
            height: "420px",
            borderRadius: "50%",
            background: "#dfe8d8"
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "90px",
            bottom: "72px",
            width: "210px",
            height: "210px",
            borderRadius: "50%",
            background: "#c6724a"
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            width: "820px",
            zIndex: 1
          }}
        >
          <div
            style={{
              color: "#c6724a",
              fontSize: "30px",
              fontWeight: 800
            }}
          >
            {label}
          </div>
          <div
            style={{
              color: "#24452d",
              fontSize: "82px",
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: "0"
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "34px",
              lineHeight: 1.35,
              color: "#35523a"
            }}
          >
            {subtitle}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 1,
            borderTop: "3px solid #d9d8c7",
            paddingTop: "28px",
            fontSize: "28px",
            fontWeight: 800
          }}
        >
          <span>askore.kr</span>
          <span>기후 · 난이도 · 안전성 · 관리 가이드</span>
        </div>
      </div>
    ),
    {
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT
    }
  );
}
