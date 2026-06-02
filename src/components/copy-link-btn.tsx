"use client";

import { useState } from "react";

export function CopyLinkBtn({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 구형 브라우저 폴백
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="copy-link-btn"
      aria-label="글 링크 복사"
    >
      {copied ? "✓ 복사됨" : "링크 복사"}
    </button>
  );
}
