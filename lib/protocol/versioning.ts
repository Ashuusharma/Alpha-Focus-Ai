export type ProtocolEngineVersions = {
  protocolEngine: string;
  routineIntelligence: string;
  knowledgePack: string;
  ingredientIntelligence: string;
  prompt: string;
  clinicalProfileSchema: string;
  resultJsonSchema: string;
};

// Exported so lib/ai/protocolGovernance.ts can fold it into the protocol
// cache key — a bump here should invalidate cached reports generated under
// the old engine version, same as a prompt or model change does.
export const PROTOCOL_ENGINE_VERSION = "v2.0.0";

export function buildProtocolVersions(
  promptVersion: string,
  knowledgeVersion?: string,
  clinicalProfileSchemaVersion = "clinical_profile.v2.1.0",
  resultJsonSchemaVersion = "protocol_report.v2.1.0"
): ProtocolEngineVersions {
  return {
    protocolEngine: PROTOCOL_ENGINE_VERSION,
    routineIntelligence: "v1.3.0",
    knowledgePack: knowledgeVersion || "v4.1.0",
    ingredientIntelligence: "v1.0.0",
    prompt: promptVersion,
    clinicalProfileSchema: clinicalProfileSchemaVersion,
    resultJsonSchema: resultJsonSchemaVersion,
  };
}
