export type ProtocolEngineVersions = {
  protocolEngine: string;
  routineIntelligence: string;
  knowledgePack: string;
  ingredientIntelligence: string;
  prompt: string;
  clinicalProfileSchema: string;
  resultJsonSchema: string;
};

export function buildProtocolVersions(
  promptVersion: string,
  knowledgeVersion?: string,
  clinicalProfileSchemaVersion = "clinical_profile.v2.1.0",
  resultJsonSchemaVersion = "protocol_report.v2.1.0"
): ProtocolEngineVersions {
  return {
    protocolEngine: "v2.0.0",
    routineIntelligence: "v1.3.0",
    knowledgePack: knowledgeVersion || "v4.1.0",
    ingredientIntelligence: "v1.0.0",
    prompt: promptVersion,
    clinicalProfileSchema: clinicalProfileSchemaVersion,
    resultJsonSchema: resultJsonSchemaVersion,
  };
}
