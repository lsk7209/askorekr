export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

type OgImageInput = {
  title: string;
  subtitle?: string;
  label?: string;
};

export function buildOgImageUrl({ title, subtitle, label }: OgImageInput) {
  const params = new URLSearchParams({
    title,
    subtitle: subtitle ?? "한국형 반려식물 가이드",
    label: label ?? "PlantyFriends"
  });

  return `/api/og?${params.toString()}`;
}
