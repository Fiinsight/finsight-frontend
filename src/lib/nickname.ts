export function defaultNickname(email: string): string {
  const part = email.trim().split("@")[0].slice(0, 30);
  return part.length >= 2 ? part : part ? `${part}님` : "사용자";
}
