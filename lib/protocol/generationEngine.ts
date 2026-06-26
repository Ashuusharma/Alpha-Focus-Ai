import { generateProtocolWithOrchestrator } from "@/lib/ai/ProtocolOrchestrator";
import { ProtocolInput } from "@/lib/protocol/contract";
import { ProtocolReport } from "@/types/protocolReport";

export async function generateProtocolReportFromAI(input: ProtocolInput): Promise<{ report: ProtocolReport; usedFallback: boolean; model: string }> {
  const result = await generateProtocolWithOrchestrator(input);
  return {
    report: result.report,
    usedFallback: result.status !== "ok",
    model: result.model,
  };
}
