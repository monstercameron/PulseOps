import { describe, expect, it } from "vitest";

import { buildTableExtractionPlan } from "@/features/parsing/domain/table-extraction";

describe("table extraction strategy", () => {
  it("prioritizes dense operational sheets", () => {
    const plan = buildTableExtractionPlan([
      {
        columnCount: 4,
        headers: ["invoice_number", "customer_name", "due_date", "amount_due"],
        name: "Invoices",
        rowCount: 24,
      },
      {
        columnCount: 2,
        headers: ["metric", "value"],
        name: "Summary",
        rowCount: 3,
      },
    ]);

    expect(plan.primaryTableName).toBe("Invoices");
    expect(plan.candidates[0]?.name).toBe("Invoices");
    expect(plan.candidates[0]?.score).toBeGreaterThan(
      plan.candidates[1]?.score ?? 0,
    );
  });
});
