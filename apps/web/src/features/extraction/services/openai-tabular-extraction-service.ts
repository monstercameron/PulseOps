import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { resolveServerPaths } from "@/features/config/server-env";
import {
  type LlmCostTracker,
  type LlmUsageTrackingContext,
} from "@/features/cost/server/llm-cost-tracker";
import {
  buildTabularExtractionPrompt,
  getTabularExtractionInstructions,
  materializeTabularExtractionContract,
  supportsTabularExtraction,
  tabularExtractionPlanSchema,
} from "@/features/extraction/domain/tabular-extraction-plan";
import {
  type TabularExtractionService,
  type TabularExtractionServiceInput,
} from "@/features/extraction/services/tabular-extraction-service";
import { loadNormalizedTabularSheets } from "@/features/parsing/services/load-normalized-tabular-sheets";
import { type NormalizedTabularSheet } from "@/features/parsing/lib/tabular/normalize-tabular-sheet";

type RunTabularExtractionPlanInput = {
  input: string;
  instructions: string;
  model: string;
  trackingContext?: LlmUsageTrackingContext;
};

type RunTabularExtractionPlan = (
  input: RunTabularExtractionPlanInput,
) => Promise<null | typeof tabularExtractionPlanSchema._output>;

type CreateOpenAiTabularExtractionServiceInput = {
  llmCostTracker?: LlmCostTracker;
  model: string;
  now?: () => string;
  runTabularExtractionPlan: RunTabularExtractionPlan;
};

export function createOpenAiTabularExtractionService(
  input: CreateOpenAiTabularExtractionServiceInput,
): TabularExtractionService {
  return {
    async extract({
      body,
      classification,
      document,
      parserArtifact,
    }: TabularExtractionServiceInput) {
      if (!supportsTabularExtraction(classification.suggestedDocumentFamily)) {
        return null;
      }

      const sheets = await parseSupportedTabularSheets(document.fileName, body);
      const extractionPlan = await input.runTabularExtractionPlan({
        input: buildTabularExtractionPrompt({
          documentFamily: classification.suggestedDocumentFamily,
          fileName: document.fileName,
          parserArtifact,
          sheets,
        }),
        instructions: getTabularExtractionInstructions(),
        model: input.model,
        trackingContext: {
          documentId: document.id,
          feature: "extraction",
          operation: "tabular-extraction-plan",
          orgId: document.orgId,
        },
      });

      if (extractionPlan === null) {
        throw new Error("OpenAI extraction returned no structured extraction plan.");
      }

      return materializeTabularExtractionContract({
        createdAt: (input.now ?? (() => new Date().toISOString()))(),
        documentFamily: classification.suggestedDocumentFamily,
        documentId: document.id,
        plan: extractionPlan,
        sheets,
      });
    },
  };
}

export function createOpenAiTabularExtractionServiceFromEnv(
  env: NodeJS.ProcessEnv = process.env,
  input?: Readonly<{
    llmCostTracker?: LlmCostTracker;
  }>,
): TabularExtractionService | null {
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

  return createOpenAiTabularExtractionService({
    llmCostTracker: input?.llmCostTracker,
    model: serverPaths.openAiExtractionModel,
    runTabularExtractionPlan: createOpenAiTabularExtractionRunner(
      client,
      input?.llmCostTracker,
    ),
  });
}

export function createOpenAiTabularExtractionRunner(
  client: OpenAI,
  llmCostTracker?: LlmCostTracker,
): RunTabularExtractionPlan {
  return async ({ input, instructions, model, trackingContext }) => {
    const response = await client.responses.parse({
      instructions,
      input,
      model,
      store: false,
      text: {
        format: zodTextFormat(
          tabularExtractionPlanSchema,
          "bizops_tabular_extraction_plan",
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

async function parseSupportedTabularSheets(
  fileName: string,
  body: Buffer,
): Promise<NormalizedTabularSheet[]> {
  return loadNormalizedTabularSheets(fileName, body);
}
