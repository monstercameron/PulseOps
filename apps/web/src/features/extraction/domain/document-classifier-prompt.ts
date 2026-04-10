import { supportedDocumentFamilies } from "@/features/foundation/domain/document-families";

type BuildDocumentClassifierPromptInput = {
  fileName: string;
  headers: readonly string[];
  sampleRows?: readonly Record<string, string>[];
};

export function buildDocumentClassifierPrompt({
  fileName,
  headers,
  sampleRows = [],
}: BuildDocumentClassifierPromptInput): string {
  const familyOptions = supportedDocumentFamilies
    .map((family) => `- ${family.id}: ${family.label}. ${family.description}`)
    .join("\n");
  const renderedHeaders = headers.length > 0 ? headers.join(", ") : "(none)";
  const renderedSampleRows =
    sampleRows.length > 0
      ? JSON.stringify(sampleRows.slice(0, 3), null, 2)
      : "[]";

  return [
    "You are classifying a business document for the Weekly Cash and Margin Brief.",
    "Choose the single best document family from the allowed list.",
    "Return strict JSON with keys: suggestedDocumentFamily, confidenceScore, matchedSignals, rationale.",
    "Do not invent new document families.",
    "",
    "Allowed document families:",
    familyOptions,
    "",
    `File name: ${fileName}`,
    `Headers: ${renderedHeaders}`,
    "Sample rows:",
    renderedSampleRows,
  ].join("\n");
}
