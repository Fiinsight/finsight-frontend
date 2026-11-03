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

  const uniqueTerms = Array.from(new Set(terms.map(term=>term.trim()).filter(Boolean))).sort((a, b) => b.length - a.length);
  if (!uniqueTerms.length) return [{text,isTerm:false}];
  const pattern = new RegExp(uniqueTerms.map(escapeRegExp).join("|"), "gi");
  const particles = new Set(["은","는","이","가","을","를","의","와","과","에","로","도","만","으로","에서","에게","까지","부터","보다","처럼","에도","에는","에선","으로는","에서는","이며","이고","이다","입니다"]);
  const seen = new Set<string>();
  const result: {text:string;isTerm:boolean}[] = [];
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index, end = start + match[0].length;
    const before = text[start - 1] ?? "";
    const after = text.slice(end).match(/^[가-힣A-Za-z0-9]+/)?.[0];
    const key = match[0].toLowerCase();
    if (/[가-힣A-Za-z0-9]/.test(before) || (after && !particles.has(after)) || seen.has(key)) continue;
    if (start > cursor) result.push({text:text.slice(cursor,start),isTerm:false});
    result.push({text:match[0],isTerm:true});seen.add(key);cursor=end;
  }
  if (cursor < text.length) result.push({text:text.slice(cursor),isTerm:false});
  return result.length ? result : [{text,isTerm:false}];
}

export function splitParagraphs(text: string): string[] {
  return text.split("\n\n").filter((paragraph) => paragraph.trim().length > 0);
}

/** Shared source/summary cleanup; keep the publisher's paragraph breaks. */
export function cleanArticleText(text: string): string {
  return text.replace(/\[[^\]]{0,500}(?:자료사진|재판매|DB 금지)[^\]]{0,500}\]/gs, "")
    .replace(/[\w.+-]+@[\w.-]+/g, "")
    .split(/\n+/).map(paragraph => paragraph
      .replace(/^(?:\([^()\n]{1,40}\)\s*)?[가-힣·]{2,12}\s*(?:기자|특파원)\s*=\s*/, "")
      .split(/(?<=[.!?。！？])(?![0-9])\s+/)
      .map(line => line.trim())
      .filter(line => line && !/자료사진|재판매|DB 금지|무단전재|저작권|현황판.*(?:표시|나타나)|딜링룸.*(?:보고|보이고|현황)|^사진은|^사진\s*[=:]|^자료\s*사진|^촬영|^광고|^관련기사|^▶/.test(line))
      .join(" "))
    .filter(Boolean).join("\n\n").trim();
}

/** Prefer the selected reading level; raw fallback uses the same source cleanup. */
export function judgementArticleSummary(detail: {levels?:Record<string,string>;rawContent:string;summary:string}, level:string):string {
  const source = detail.levels?.[level]?.trim() || detail.rawContent || detail.summary;
  return cleanArticleText(source).split(/(?<=[.!?。！？])(?![0-9])\s+|\n+/).slice(0,2).join(' ') || '원문에서 판단 근거를 확인해주세요.';
}

export function sourceExcerpt(text:string):string {
  const paragraphs: string[] = [];
  let count = 0, size = 0;
  for (const paragraph of cleanArticleText(text).split(/\n+/)) {
    const kept: string[] = [];
    for (const sentence of paragraph.split(/(?<=[.!?。！？])(?![0-9])\s+/)) {
      if (!sentence.trim()) continue;
      const length = Array.from(sentence).length;
      if (count >= 6 || size + length + 2 > 1200) break;
      kept.push(sentence); count++; size += length + 2;
    }
    if (kept.length) paragraphs.push(kept.join(' '));
    if (count >= 6) break;
  }
  return paragraphs.join('\n\n');
}
