// Small text-processing helpers shared by any screen that needs to split
// body copy around a set of highlighted terms.

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Splits `text` into plain segments and term segments, preserving order. */
export function splitAroundTerms(text: string, terms: string[]): { text: string; isTerm: boolean }[] {
  if (terms.length === 0 || !text) {
    return [{ text, isTerm: false }];
  }

  const uniqueTerms = Array.from(new Set(terms)).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(${uniqueTerms.map(escapeRegExp).join("|")})`, "g");
  const parts = text.split(pattern);
  const termSet = new Set(uniqueTerms);

  return parts.map((part) => ({ text: part, isTerm: termSet.has(part) }));
}

export function splitParagraphs(text: string): string[] {
  return text.split("\n\n").filter((paragraph) => paragraph.trim().length > 0);
}

/** Prefer the selected reading level; raw fallback must not promote a photo caption as evidence. */
export function judgementArticleSummary(detail: {levels?:Record<string,string>;rawContent:string;summary:string}, level:string):string {
  const source = detail.levels?.[level]?.trim() || detail.rawContent || detail.summary;
  return source.replace(/^.{0,180}?기자\s*=\s*/, '').split(/(?<=[.!?。])(?!(?:\d))\s+|\n+/)
    .filter(line => !/자료사진|재판매|DB 금지|현황판.*(?:표시|나타나)|딜링룸.*(?:보고|보이고|현황)|사진은|촬영/.test(line))
    .slice(0,2).join(' ') || '원문에서 판단 근거를 확인해주세요.';
}

export function sourceExcerpt(text:string):string {
  const first=text.trim().split(/(?<=[.!?。！？])(?![0-9])\s+|\n+/).slice(0,3).join(' ');
  const chars=Array.from(first);
  return chars.length<=300?first:chars.slice(0,299).join('').trimEnd()+'…';
}
