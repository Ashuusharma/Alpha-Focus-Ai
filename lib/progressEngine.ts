import { categories, questions, CategoryId } from "./questions";

type Answers = Record<string, string>;

export function calculateQuestionProgress(answers: Answers): number {
  const activeCategories = categories.filter((cat) =>
    questions[cat.id].some((q) => answers[q.id])
  );

  if (activeCategories.length === 0) return 0;

  const categoryShare = 50 / activeCategories.length;
  let total = 0;

  activeCategories.forEach((cat) => {
    const answered = questions[cat.id].filter(
      (q) => answers[q.id]
    ).length;

    const perQuestion = categoryShare / questions[cat.id].length;
    total += answered * perQuestion;
  });

  return Math.min(50, Math.round(total));
}

export function calculateResultProgress(
  questionProgress: number,
  cartItemsCount: number,
  checkoutClicked: boolean
): number {
  let resultProgress = 50;

  // Product engagement → up to +40%
  resultProgress += Math.min(40, cartItemsCount * 10);

  // Checkout intent → +10%
  if (checkoutClicked) resultProgress += 10;

  return Math.min(100, Math.round(resultProgress));
}
