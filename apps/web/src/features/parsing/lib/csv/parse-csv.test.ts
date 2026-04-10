import { describe, expect, it } from "vitest";

import {
  normalizeCsvHeader,
  parseCsvText,
} from "@/features/parsing/lib/csv/parse-csv";

describe("parseCsvText", () => {
  it("normalizes headers and trims values", () => {
    const csv =
      "\uFEFFInvoice Id, Amount Due \n INV-001 , 4200 \n INV-002, 1700 ";
    const parsed = parseCsvText(csv);

    expect(parsed.headers).toEqual(["invoice_id", "amount_due"]);
    expect(parsed.rowCount).toBe(2);
    expect(parsed.records[0]).toEqual({
      amount_due: "4200",
      invoice_id: "INV-001",
    });
  });

  it("rejects duplicate headers after normalization", () => {
    expect(() =>
      parseCsvText("Invoice Id, invoice_id\nINV-001, INV-001"),
    ).toThrow("CSV headers must be unique after normalization.");
  });

  it("normalizes individual headers consistently", () => {
    expect(normalizeCsvHeader(" Labor Hours ")).toBe("labor_hours");
  });
});
