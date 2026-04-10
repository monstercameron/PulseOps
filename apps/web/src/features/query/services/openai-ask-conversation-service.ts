import OpenAI from "openai";

import { resolveServerPaths } from "@/features/config/server-env";
import {
  type LlmCostTracker,
  type LlmUsageTrackingContext,
} from "@/features/cost/server/llm-cost-tracker";
import { emitStructuredLog } from "@/features/observability/lib/structured-logger";
import { type QueryPlan } from "@/features/query/domain/query-plan";

export interface AskConversationService {
  replyToClarifyingQuestion(input: Readonly<{
    orgId: string;
    plan: QueryPlan;
    question: string;
  }>): Promise<string>;
}

type RunAskConversationInput = Readonly<{
  input: string;
  instructions: string;
  model: string;
  trackingContext?: LlmUsageTrackingContext;
}>;

type RunAskConversation = (
  input: RunAskConversationInput,
) => Promise<string | null>;

type CreateOpenAiAskConversationServiceInput = Readonly<{
  llmCostTracker?: LlmCostTracker;
  model: string;
  runAskConversation: RunAskConversation;
}>;

const greetingPattern =
  /^(?:hi|hello|hey|yo|sup|hola|good\s+(?:morning|afternoon|evening))\b/i;

const capabilityPattern =
  /\b(?:help|what can you do|what do you do|how can you help)\b/i;

export function createOpenAiAskConversationService(
  input: CreateOpenAiAskConversationServiceInput,
): AskConversationService {
  return {
    async replyToClarifyingQuestion({ orgId, plan, question }) {
      const fallbackReply = buildClarificationFallbackReply(question);

      try {
        const reply = await input.runAskConversation({
          input: buildAskConversationPrompt({
            plan,
            question,
          }),
          instructions: getAskConversationInstructions(),
          model: input.model,
          trackingContext: {
            feature: "query",
            operation: "clarification-conversation",
            orgId,
          },
        });

        if (reply === null || reply.trim().length === 0) {
          return fallbackReply;
        }

        return reply.trim();
      } catch (error) {
        emitStructuredLog({
          data: {
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
            model: input.model,
            retrievalMode: plan.retrievalMode,
          },
          feature: "query",
          level: "warn",
          message:
            "Fell back to the deterministic clarification reply after the Ask conversation model failed.",
          orgId,
          service: "web",
        });

        return fallbackReply;
      }
    },
  };
}

export function createOpenAiAskConversationServiceFromEnv(
  env: NodeJS.ProcessEnv = process.env,
  input?: Readonly<{
    llmCostTracker?: LlmCostTracker;
  }>,
): AskConversationService | null {
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

  return createOpenAiAskConversationService({
    llmCostTracker: input?.llmCostTracker,
    model: serverPaths.openAiAskModel,
    runAskConversation: createOpenAiAskConversationRunner(
      client,
      input?.llmCostTracker,
    ),
  });
}

export function buildClarificationFallbackReply(question: string): string {
  const trimmedQuestion = question.trim();

  if (greetingPattern.test(trimmedQuestion)) {
    return [
      "Hi. I can help with invoices, vendor bills, cash movement, job margins, and weekly business risk in the uploaded workspace data.",
      "Try a specific question like 'Which invoices are overdue?', 'What deserves attention this week?', or 'Which jobs are underpriced?'",
    ].join(" ");
  }

  if (capabilityPattern.test(trimmedQuestion)) {
    return [
      "I can help analyze uploaded business data for overdue invoices, cash movement, vendor bills, job performance, and margin pressure.",
      "Try asking something concrete like 'What deserves attention this week?', 'Where is cash getting tight?', or 'Which jobs are losing margin?'",
    ].join(" ");
  }

  return [
    "I can help once the question is aimed at a business topic in the workspace, like invoices, bills, cash, jobs, or margins.",
    "Try asking 'Which invoices are overdue?', 'What changed in cash this week?', or 'Where is margin slipping?'",
  ].join(" ");
}

function getAskConversationInstructions(): string {
  return [
    "You are the Ask assistant for a business operations workspace.",
    "This path is used when the user greets you, makes small talk, or asks a vague question that is not specific enough for grounded evidence retrieval.",
    "Reply naturally and briefly in 2 or 3 sentences, under 90 words.",
    "Do not claim you checked data, found evidence, or know business facts yet.",
    "Gently steer the user toward a specific business question about invoices, vendor bills, cash movement, jobs, schedules, or margins.",
    "Include 2 or 3 concrete example questions the user can ask next.",
    "Do not use markdown bullets unless absolutely necessary.",
  ].join("\n");
}

function buildAskConversationPrompt(input: Readonly<{
  plan: QueryPlan;
  question: string;
}>): string {
  return [
    `User message: ${input.question}`,
    `Planner rationale: ${input.plan.rationale}`,
    "Supported business topics:",
    "- invoices and receivables",
    "- vendor bills and payables",
    "- jobs, work orders, and schedules",
    "- cash movement and bank transactions",
    "- revenue, cost, and margin performance",
    "Return a short conversational reply that keeps the user moving toward a specific business question.",
  ].join("\n");
}

function createOpenAiAskConversationRunner(
  client: OpenAI,
  llmCostTracker?: LlmCostTracker,
): RunAskConversation {
  return async ({ input, instructions, model, trackingContext }) => {
    if (trackingContext !== undefined) {
      await llmCostTracker?.assertWithinUsageCap({
        context: trackingContext,
      });
    }

    const response = await client.responses.create({
      input,
      instructions,
      model,
      store: false,
    });

    if (trackingContext !== undefined) {
      await llmCostTracker?.recordOpenAiResponse({
        context: trackingContext,
        model,
        response,
      });
    }

    return response.output_text.trim().length === 0 ? null : response.output_text;
  };
}
