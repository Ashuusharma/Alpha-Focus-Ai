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

    // Lightweight navigation (no large query payloads)
    router.push("/result");
  };

  return <AnalyzerQuestionsPage onSubmit={handleSubmit} />;
}
