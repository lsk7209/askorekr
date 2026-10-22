/**
 * 동적 라우트의 slug 파라미터는 한글 등 비ASCII 문자가 퍼센트 인코딩된 채 전달될 수 있다.
 * DB에는 디코딩된 slug가 저장되어 있어 그대로 조회하면 sitemap에 있는 URL도 404가 된다.
 */
export function decodeSlugParam(slug: string): string {
  try {
    return decodeURIComponent(slug).normalize("NFC");
  } catch {
    return slug;
  }
}
