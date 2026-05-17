"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdFormat = "auto" | "rectangle" | "horizontal" | "vertical";

type Props = {
  publisherId?: string;
  slot?: string;
  label: string;
  className?: string;
  format?: AdFormat;
  minHeight?: number;
};

export function AdsenseAd({
  publisherId,
  slot,
  label,
  className,
  format = "auto",
  minHeight = 90
}: Props) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!publisherId || !slot || pushed.current) return;
    pushed.current = true;

    try {
      window.adsbygoogle = window.adsbygoogle ?? [];
      window.adsbygoogle.push({});
    } catch {
      // AdSense can be blocked by browsers or extensions; content should remain usable.
    }
  }, [publisherId, slot]);

  if (!publisherId || !slot) {
    return null;
  }

  const classes = ["adsense-unit", className].filter(Boolean).join(" ");

  return (
    <aside
      className={classes}
      aria-label={label}
      style={{ minHeight, overflow: "hidden" }}
    >
      <ins
        className="adsbygoogle"
        data-ad-client={publisherId}
        data-ad-format={format}
        data-ad-slot={slot}
        data-full-width-responsive="true"
        style={{ display: "block", minHeight }}
      />
    </aside>
  );
}
