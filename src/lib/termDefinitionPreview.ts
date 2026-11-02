/** Use whole words, rather than showing a clipped Korean verb ending. */
export function termDefinitionPreview(definition: string, max = 40): string {
  const text = definition.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const sentence = text.match(/^.*?[.!?](?:\s|$)/)?.[0].trim();
  if (sentence && sentence.length <= max) return sentence;
  const words = text.split(" ");
  let result = "";
  for (const word of words) {
    if ((result + " " + word).trim().length > max - 2) break;
    result = (result + " " + word).trim();
  }
  return result ? `${result} …` : "정의를 펼쳐서 읽어보세요.";
}
