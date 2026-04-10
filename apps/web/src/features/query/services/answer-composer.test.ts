import { describe, expect, it } from "vitest";

import { createQueryPlan } from "@/features/query/domain/query-plan";
import { composeDatasetAnswer } from "@/features/query/services/answer-composer";
import { createCitation } from "@/features/trust/domain/citation";

describe("composeDatasetAnswer", () => {
  it("builds answers with citations from fact and vector evidence", () => {
    const citation = createCitation({
      confidenceScore: 0.94,
      documentFamily: "customer-invoice",
      documentId: "doc_123",
      locator: { row: 2 },
      locatorType: "row",
      sourceHash: "sha256:invoice-outstanding",
    });

    const answer = composeDatasetAnswer(
      createQueryPlan({
        canonicalFactTypeIds: ["invoice.amount.outstanding"],
        entityTypes: ["invoice"],
        limit: 5,
        needsClarification: false,
        orgId: "org_123",
        question: "Which invoices are overdue?",
        rationale: "Invoice facts requested.",
        retrievalMode: "hybrid",
        vectorSearchText: "overdue invoices",
      }),
      {
        chunks: [
          {
            chunkId: "chunk_123",
            citations: [citation],
            content: "Entity INV-001. invoice amount outstanding: 2100",
            score: 0.91,
          },
        ],
        facts: [
          {
            citations: [citation],
            factId: "fact_123",
            factTypeId: "invoice.amount.outstanding",
            score: 0.94,
            value: 2100,
          },
        ],
      },
    );

    expect(answer.status).toBe("answered");
    expect(answer.answerText).toContain("invoice.amount.outstanding: 2100");
    expect(answer.citations).toHaveLength(2);
  });
});
