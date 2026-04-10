import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { resolveServerPaths } from "@/features/config/server-env";
import {
  type LlmCostTracker,
  type LlmUsageTrackingContext,
} from "@/features/cost/server/llm-cost-tracker";
import {
  buildGenericDocumentExtractionPrompt,
  genericDocumentExtractionPlanSchema,
  getGenericDocumentExtractionInstructions,
  materializeGenericDocumentExtractionContract,
} from "@/features/extraction/domain/generic-document-extraction";
import {
  type DocumentExtractionService,
  type DocumentExtractionServiceInput,
} from "@/features/extraction/services/document-extraction-service";
import {
  createOpenAiTabularExtractionRunner,
  createOpenAiTabularExtractionService,
} from "@/features/extraction/services/openai-tabular-extraction-service";
import { loadNormalizedTabularSheets } from "@/features/parsing/services/load-normalized-tabular-sheets";

type RunGenericDocumentExtractionInput = {
  input: string;
  instructions: string;
  model: string;
  trackingContext?: LlmUsageTrackingContext;
};

type RunGenericDocumentExtraction = (
  input: RunGenericDocumentExtractionInput,
) => Promise<null | typeof genericDocumentExtractionPlanSchema._output>;

type CreateOpenAiDocumentExtractionServiceInput = {
  llmCostTracker?: LlmCostTracker;
  model: string;
  now?: () => string;
  runGenericDocumentExtraction: RunGenericDocumentExtraction;
  runTabularExtractionPlan: Parameters<
    typeof createOpenAiTabularExtractionService
  >[0]["runTabularExtractionPlan"];
};

const maxPreviewColumns = 10;
const maxPreviewRowsPerSheet = 25;
const maxPreviewSheets = 4;
const maxTextPreviewCharacters = 14_000;
const maxTextPreviewLines = 180;

export function createOpenAiDocumentExtractionService(
  input: CreateOpenAiDocumentExtractionServiceInput,
): DocumentExtractionService {
  const specializedTabularService = createOpenAiTabularExtractionService({
    llmCostTracker: input.llmCostTracker,
    model: input.model,
    now: input.now,
    runTabularExtractionPlan: input.runTabularExtractionPlan,
  });

  return {
    async extract(serviceInput: DocumentExtractionServiceInput) {
      if (serviceInput.parserRoute === "tabular") {
        if (serviceInput.classification !== null) {
          const specializedContract = await specializedTabularService.extract({
            body: serviceInput.body,
            classification: serviceInput.classification,
            document: serviceInput.document,
            parserArtifact: serviceInput.parserArtifact,
          });

          if (specializedContract !== null) {
            return specializedContract;
          }
        }

        const sheets = await loadNormalizedTabularSheets(
          serviceInput.document.fileName,
          serviceInput.body,
        );
        const genericPlan = await input.runGenericDocumentExtraction({
          input: buildGenericDocumentExtractionPrompt({
            documentFamilyHint:
              serviceInput.classification?.suggestedDocumentFamily,
            fileName: serviceInput.document.fileName,
            parserRoute: "tabular",
            tabularPreview: buildTabularPreview(sheets),
          }),
          instructions: getGenericDocumentExtractionInstructions(),
          model: input.model,
          trackingContext: {
            documentId: serviceInput.document.id,
            feature: "extraction",
            operation: "generic-document-extraction",
            orgId: serviceInput.document.orgId,
          },
        });

        if (genericPlan === null) {
          throw new Error(
            "OpenAI generic extraction returned no structured extraction plan.",
          );
        }

        return materializeGenericDocumentExtractionContract({
          createdAt: (input.now ?? (() => new Date().toISOString()))(),
          documentChecksumSha256: serviceInput.document.checksumSha256,
          documentId: serviceInput.document.id,
          plan: genericPlan,
        });
      }

      const genericPlan = await input.runGenericDocumentExtraction({
        input: buildGenericDocumentExtractionPrompt({
          documentFamilyHint: serviceInput.document.suggestedDocumentFamily,
          fileName: serviceInput.document.fileName,
          parserRoute: "text",
          textPreview: buildTextPreview(serviceInput.textParserArtifact.text),
        }),
        instructions: getGenericDocumentExtractionInstructions(),
        model: input.model,
        trackingContext: {
          documentId: serviceInput.document.id,
          feature: "extraction",
          operation: "generic-document-extraction",
          orgId: serviceInput.document.orgId,
        },
      });

      if (genericPlan === null) {
        throw new Error(
          "OpenAI generic extraction returned no structured extraction plan.",
        );
      }

      return materializeGenericDocumentExtractionContract({
        createdAt: (input.now ?? (() => new Date().toISOString()))(),
        documentChecksumSha256: serviceInput.document.checksumSha256,
        documentId: serviceInput.document.id,
        plan: genericPlan,
      });
    },
  };
}

export function createOpenAiDocumentExtractionServiceFromEnv(
  env: NodeJS.ProcessEnv = process.env,
  input?: Readonly<{
    llmCostTracker?: LlmCostTracker;
  }>,
): DocumentExtractionService | null {
  const serverPaths = resolveServerPaths(env);

  if (
    typeof serverPaths.openAiApiKey !== "string" ||
    serverPaths.openAiApiKey.trim().length === 0
  ) {
    return null;
  }

  const client = new OpenAI({
    apiKey: serverPaths.openAiApiKey,
  });

  return createOpenAiDocumentExtractionService({
    llmCostTracker: input?.llmCostTracker,
    model: serverPaths.openAiExtractionModel,
    runGenericDocumentExtraction: createOpenAiGenericDocumentExtractionRunner(
      client,
      input?.llmCostTracker,
    ),
    runTabularExtractionPlan: createOpenAiTabularExtractionRunner(
      client,
      input?.llmCostTracker,
    ),
  });
}

function createOpenAiGenericDocumentExtractionRunner(
  client: OpenAI,
  llmCostTracker?: LlmCostTracker,
): RunGenericDocumentExtraction {
  return async ({ input, instructions, model, trackingContext }) => {
    if (trackingContext !== undefined) {
      await llmCostTracker?.assertWithinUsageCap({
        context: trackingContext,
      });
    }

    const response = await client.responses.parse({
      instructions,
      input,
      model,
      store: false,
      text: {
        format: zodTextFormat(
          genericDocumentExtractionPlanSchema,
          "bizops_generic_document_extraction_plan",
        ),
      },
    });

    if (trackingContext !== undefined) {
      await llmCostTracker?.recordOpenAiResponse({
        context: trackingContext,
        model,
        response,
      });
    }

    return response.output_parsed;
  };
}

function buildTabularPreview(
  sheets: Awaited<ReturnType<typeof loadNormalizedTabularSheets>>,
): string {
  return sheets
    .slice(0, maxPreviewSheets)
    .map((sheet) => {
      const previewHeaders = sheet.headers.slice(0, maxPreviewColumns);
      const previewRows = sheet.records.slice(0, maxPreviewRowsPerSheet);

      return [
        `Sheet: ${sheet.name}`,
        `Columns: ${previewHeaders.join(", ")}`,
        `Total rows: ${sheet.rowCount}`,
        ...previewRows.map((row, rowIndex) =>
          [
            `Row ${rowIndex + 2}:`,
            previewHeaders
              .map((header) => `${header}=${row[header] ?? ""}`)
              .join(" | "),
          ].join(" "),
        ),
      ].join("\n");
    })
    .join("\n\n");
}

function buildTextPreview(text: string): string {
  const normalizedPreview = text
    .slice(0, maxTextPreviewCharacters)
    .split("\n")
    .slice(0, maxTextPreviewLines);

  return normalizedPreview
    .map((line, lineIndex) => `${lineIndex + 1}: ${line}`)
    .join("\n");
}
