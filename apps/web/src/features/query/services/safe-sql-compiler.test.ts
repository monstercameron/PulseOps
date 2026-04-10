import { describe, expect, it } from "vitest";

import { createQueryPlan } from "@/features/query/domain/query-plan";
import { compileSafeFactSql } from "@/features/query/services/safe-sql-compiler";

describe("compileSafeFactSql", () => {
  it("compiles whitelisted fact queries", () => {
    const compiledQuery = compileSafeFactSql(
      createQueryPlan({
        canonicalFactTypeIds: ["invoice.amount.outstanding"],
        entityTypes: ["invoice"],
        limit: 5,
        needsClarification: false,
        orgId: "org_123",
        question: "Which invoices are overdue?",
        rationale: "Invoice facts requested.",
        retrievalMode: "facts",
      }),
    );

    expect(compiledQuery.text).toContain("from canonical_facts");
    expect(compiledQuery.params).toEqual([
      "org_123",
      ["invoice.amount.outstanding"],
      5,
    ]);
  });
});
