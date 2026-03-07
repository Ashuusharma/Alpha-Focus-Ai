import { useRouter } from "next/navigation";
import AnalyzerQuestionsPage from "./AnalyzerQuestionsPage";

export default function AnalyzerQuestionsRoute() {
  const router = useRouter();

  const handleSubmit = (answers: Record<string, string>, severities: Record<string, string>) => {
    // Save answers and severities
    sessionStorage.setItem("analyzerAnswers", JSON.stringify(answers));
    sessionStorage.setItem("analyzerSeverities", JSON.stringify(severities));
    sessionStorage.setItem("questionsAnswered", "true");
    // Persist assessment data for the result page to read without bloating the URL
    sessionStorage.setItem("resultAnswers", JSON.stringify(answers));
    const photoData = sessionStorage.getItem("photoAnalysis");
    if (photoData) {
      sessionStorage.setItem("photoAnalysis", photoData);
    }

    const selectedCategoriesRaw = sessionStorage.getItem("selectedCategories");
    const selectedCategories = selectedCategoriesRaw ? (JSON.parse(selectedCategoriesRaw) as string[]) : [];
    const firstCategory = selectedCategories[0];

    if (firstCategory) {
      router.push(`/assessment?category=${firstCategory}`);
      return;
    }

    router.push("/assessment");
  };

  return <AnalyzerQuestionsPage onSubmit={handleSubmit} />;
}
