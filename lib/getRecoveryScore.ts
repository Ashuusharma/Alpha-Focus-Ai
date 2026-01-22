export function getRecoveryScore(answers: Record<string, string>) {
  let score = 50;
  const reasons: string[] = [];

  Object.values(answers).forEach((value) => {
    if (
      value.toLowerCase().includes("frequent") ||
      value.toLowerCase().includes("stress")
    ) {
      score -= 5;
      reasons.push("Frequent stress or aggressive habits detected");
    }

    if (
      value.toLowerCase().includes("daily") ||
      value.toLowerCase().includes("regular")
    ) {
      score += 5;
      reasons.push("Consistent care habits support recovery");
    }
  });

  score = Math.max(30, Math.min(score, 95));

  if (reasons.length === 0) {
    reasons.push("Your routine shows a balanced recovery approach");
  }

  return { score, reasons };
}
