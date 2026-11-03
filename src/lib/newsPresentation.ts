// Cards are compact previews; detailed normal reading keeps its evidence labels.
export function cleanNewsCardText(text: string | null | undefined): string {
  return (text ?? "").replace(/\[(?:사실|전망|분석)\]/g, "")
    .replace(/\[\s*(?=[A-Za-z0-9]*\d)[A-Za-z0-9]{6}\s*\]|\(\s*(?=[A-Za-z0-9]*\d)[A-Za-z0-9]{6}\s*\)/g, "")
    .replace(/\s+/g, " ").trim();
}
export function newsCardSummary(text: string | null | undefined): string {
  const clean = cleanNewsCardText(text);
  const sentences = clean.split(/(?<=[.!?。！？])(?!\d)\s+/).slice(0, 2).join(" ");
  return sentences.length > 150 ? sentences.slice(0, 149).trimEnd() + "…" : sentences;
}
export function newsCardPoint(text: string | null | undefined): string {
  const lines = (text ?? "").split(/\n+/).map(line => line.trim()).filter(Boolean);
  return cleanNewsCardText(lines.length > 1 && /^[“"]/.test(lines[0]) ? lines[lines.length - 1] : text);
}
export function articleParagraph(text: string, showLabels: boolean) {
  const match = showLabels ? text.match(/^\s*\[(사실|전망|분석)\]\s*/) : null;
  return { label: match?.[1] ?? null, text: match ? text.slice(match[0].length) : text };
}
export function publisherName(source?: string): string {
  const value = source?.trim() ?? "";
  for (const name of ["연합뉴스", "한국경제", "매일경제"]) if (value.includes(name)) return name;
  return value || "출처 확인 중";
}
export function newsImageUrl(value?: string | null): string | null {
  try {
    const url = new URL(value ?? "");
    if (!["https:","http:"].includes(url.protocol) || url.username || url.password || /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2[0-9]|3[01])\.|\[)/i.test(url.hostname)) return null;
    return url.href;
  } catch { return null; }
}
export function categoryColor(category: string): string {
  return ({"시장":"#E8EDF2", "국내증시":"#E8EDF2", "기업·종목":"#F2EDE7", "산업·기술":"#E9EFED", "금리·통화정책":"#EEEAF2", "금리·채권":"#EEEAF2", "환율·원자재":"#F3EFDF"} as Record<string,string>)[category] ?? "#EEF0F3";
}
