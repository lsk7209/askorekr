"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type Props = {
  publisherId?: string;
  slot?: string;
  label: string;
  className?: string;
};

export function AdsenseAd({ publisherId, slot, label, className }: Props) {
  useEffect(() => {
    if (!publisherId || !slot) return;

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
    <aside className={classes} aria-label={label}>
      <ins
        className="adsbygoogle"
        data-ad-client={publisherId}
        data-ad-format="auto"
        data-ad-slot={slot}
        data-full-width-responsive="true"
        style={{ display: "block" }}
      />
    </aside>
  );
}
