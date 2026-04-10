import { describe, expect, it } from "vitest";

import {
  assignPromptVariant,
  createPromptVariant,
} from "@/features/experiments/domain/prompt-variant";

describe("prompt variants", () => {
  it("assigns deterministic active prompt variants", () => {
    const variants = [
      createPromptVariant({
        id: "variant_a",
        isActive: true,
        promptFamily: "query-planner",
        promptText: "Prompt A",
      }),
      createPromptVariant({
        id: "variant_b",
        isActive: true,
        promptFamily: "query-planner",
        promptText: "Prompt B",
      }),
    ];

    expect(assignPromptVariant("org_123:question_1", variants).id).toMatch(
      /^variant_/,
    );
  });
});
