import { describe, expect, it, vi } from "vitest";

import {
  buildClarificationFallbackReply,
  createOpenAiAskConversationService,
} from "@/features/query/services/openai-ask-conversation-service";
import { createQueryPlan } from "@/features/query/domain/query-plan";

describe("openai ask conversation service", () => {
  it("returns the model reply when one is available", async () => {
    const runAskConversation = vi.fn(async () => "Hi. Ask me about overdue invoices or cash movement.");
    const service = createOpenAiAskConversationService({
      model: "gpt-5-mini",
      runAskConversation,
    });

    await expect(
      service.replyToClarifyingQuestion({
        orgId: "org_123",
        plan: createQueryPlan({
          canonicalFactTypeIds: [],
          entityTypes: [],
          limit: 5,
          needsClarification: true,
          orgId: "org_123",
          question: "hi",
          rationale:
            "The question does not identify a clear business object or metric family.",
          retrievalMode: "clarify",
        }),
        question: "hi",
      }),
    ).resolves.toBe(
      "Hi. Ask me about overdue invoices or cash movement.",
    );

    expect(runAskConversation).toHaveBeenCalledOnce();
  });

  it("falls back to deterministic guidance when the model returns no text", async () => {
    const service = createOpenAiAskConversationService({
      model: "gpt-5-mini",
      runAskConversation: async () => "   ",
    });

    await expect(
      service.replyToClarifyingQuestion({
        orgId: "org_123",
        plan: createQueryPlan({
          canonicalFactTypeIds: [],
          entityTypes: [],
          limit: 5,
          needsClarification: true,
          orgId: "org_123",
          question: "help",
          rationale:
            "The question does not identify a clear business object or metric family.",
          retrievalMode: "clarify",
        }),
        question: "help",
      }),
    ).resolves.toContain("I can help");
  });
});

describe("buildClarificationFallbackReply", () => {
  it("greets the user and nudges toward a business question", () => {
    const reply = buildClarificationFallbackReply("hi");

    expect(reply).toContain("Hi.");
    expect(reply).toContain("Which invoices are overdue?");
  });

  it("explains capability prompts in business terms", () => {
    const reply = buildClarificationFallbackReply("what can you do?");

    expect(reply).toContain("uploaded business data");
    expect(reply).toContain("Where is cash getting tight?");
  });
});
