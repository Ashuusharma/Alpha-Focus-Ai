import { timingSafeEqual } from "crypto";

export function secureCompare(input: string, expected: string): boolean {
  const left = Buffer.from(input || "", "utf8");
  const right = Buffer.from(expected || "", "utf8");

  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
