import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { parseXlsxBuffer } from "@/features/parsing/lib/xlsx/parse-xlsx";

describe("parseXlsxBuffer", () => {
  it("parses workbook sheets into normalized headers and records", async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Invoices");

    worksheet.addRow(["Invoice Number", "Customer Name", "Amount Due"]);
    worksheet.addRow(["INV-001", "Acme Heating", 4200]);
    worksheet.addRow(["INV-002", "Bright Air", 1800]);

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const parsedWorkbook = await parseXlsxBuffer(buffer);

    expect(parsedWorkbook.sheetCount).toBe(1);
    expect(parsedWorkbook.totalRowCount).toBe(2);
    expect(parsedWorkbook.sheets[0]).toMatchObject({
      columnCount: 3,
      headers: ["invoice_number", "customer_name", "amount_due"],
      name: "Invoices",
      rowCount: 2,
    });
  });
});
