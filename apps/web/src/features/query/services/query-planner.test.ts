import { describe, expect, it } from "vitest";

import { planDatasetQuestion } from "@/features/query/services/query-planner";

describe("planDatasetQuestion", () => {
  it("builds hybrid plans for explanatory invoice questions", () => {
    expect(
      planDatasetQuestion("Why are overdue invoices climbing?", "org_123"),
    ).toMatchObject({
      canonicalFactTypeIds: [
        "invoice.amount.outstanding",
        "invoice.due_at",
        "invoice.payment_days_late",
      ],
      entityTypes: ["invoice"],
      needsClarification: false,
      retrievalMode: "hybrid",
    });
  });

  it("requests clarification for ambiguous questions", () => {
    expect(planDatasetQuestion("Help me with this", "org_123")).toMatchObject({
      needsClarification: true,
      retrievalMode: "clarify",
    });
  });

  it("does not block short questions when the business object is clear", () => {
    expect(planDatasetQuestion("cash", "org_123")).toMatchObject({
      canonicalFactTypeIds: [
        "bank_transaction.amount",
        "bank_transaction.posted_at",
      ],
      entityTypes: ["bank_transaction"],
      needsClarification: false,
      retrievalMode: "facts",
    });
  });
});
