"use client";

import { useState } from "react";

type Props = { url: string; title?: string };

export function CopyLinkBtn({ url, title }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    // 모바일 네이티브 공유 우선
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: title ?? "플랜티프렌즈", url });
        return;
      } catch {
        // 취소하거나 지원 안 하면 클립보드로 폴백
      }
    }
    // 클립보드 복사 폴백
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="copy-link-btn"
      aria-label="글 공유"
    >
      {copied ? "✓ 복사됨" : "공유"}
    </button>
  );
}
