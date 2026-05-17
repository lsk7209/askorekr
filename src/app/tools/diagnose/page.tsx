import type { Metadata } from "next";
import { getRegions } from "@/features/diagnose/logic";
import { DiagnoseQuickForm } from "./quick-form";

export const metadata: Metadata = {
  title: "반려식물 진단",
  description:
    "지역과 실내외 환경을 기준으로 한국 생활 환경에 맞는 반려식물 후보를 찾아보세요.",
  alternates: {
    canonical: "/tools/diagnose"
  }
};

export default async function DiagnosePage() {
  const regions = await getRegions().catch(() => []);

  return (
    <main className="tool-shell">
      <section className="tool-hero" aria-labelledby="diagnose-title">
        <p className="eyebrow">Quick Diagnose</p>
        <h1 id="diagnose-title">반려식물 진단</h1>
        <p className="lead">
          지역 기후와 키울 공간을 기준으로 잘 맞는 식물을 먼저 추려드려요.
        </p>
      </section>
      <DiagnoseQuickForm regions={regions} />
    </main>
  );
}
