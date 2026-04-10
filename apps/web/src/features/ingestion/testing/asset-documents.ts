import path from "node:path";
import { readFile } from "node:fs/promises";

export const curatedAssetDocumentNames = [
  "10020Records.csv",
  "field-service-customer-invoice.csv",
  "field-service-job-cost-report.csv",
  "field-service-vendor-bill.csv",
  "supermarket_sales - Sheet1.csv",
] as const;

export type CuratedAssetDocumentName =
  (typeof curatedAssetDocumentNames)[number];

export async function readCuratedAssetDocument(
  fileName: CuratedAssetDocumentName,
): Promise<Buffer> {
  return readFile(resolveCuratedAssetDocumentPath(fileName));
}

function resolveCuratedAssetDocumentPath(fileName: CuratedAssetDocumentName) {
  return path.resolve(process.cwd(), "..", "..", "assets", "docs", fileName);
}
