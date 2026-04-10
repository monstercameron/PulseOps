import { describe, expect, it } from "vitest";

import { planDatasetQuestion } from "@/features/query/services/query-planner";
import { buildClarificationQuestions } from "@/features/query/services/clarification-questions";

describe("buildClarificationQuestions", () => {
  it("returns follow-up questions for ambiguous plans", () => {
    const plan = planDatasetQuestion("help me with this", "org_123");

    expect(buildClarificationQuestions(plan)).toHaveLength(3);
  });
});
