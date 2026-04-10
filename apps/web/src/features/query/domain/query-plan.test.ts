import { describe, expect, it } from "vitest";

import { createQueryPlan } from "@/features/query/domain/query-plan";

describe("query plan", () => {
  it("creates constrained typed query plans", () => {
    expect(
      createQueryPlan({
        canonicalFactTypeIds: ["invoice.amount.outstanding"],
        entityTypes: ["invoice"],
        limit: 5,
        needsClarification: false,
        orgId: "org_123",
        question: "Which invoices are overdue?",
        rationale: "Invoice keywords imply receivables lookup.",
        retrievalMode: "hybrid",
        vectorSearchText: "overdue invoices",
      }),
    ).toMatchObject({
      retrievalMode: "hybrid",
      version: "query-plan.v1",
    });
  });
});
