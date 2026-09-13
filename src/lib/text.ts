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
