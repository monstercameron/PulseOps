import { z } from "zod";

import {
  supportedDocumentFamilyIdSchema,
  type SupportedDocumentFamilyId,
} from "@/features/foundation/domain/document-families";

const familySignals = {
  "generic-business-document": [],
  "accounts-receivable-aging-report": [
    "current",
    "31-60",
    "61-90",
    "91+",
    "customer_name",
    "amount_due",
  ],
  "bank-transaction-export": [
    "transaction_date",
    "posted_at",
    "description",
    "amount",
    "balance",
  ],
  "chart-of-accounts-export": [
    "account_number",
    "account_name",
    "account_type",
  ],
  "customer-invoice": [
    "invoice_id",
    "invoice_number",
    "customer_name",
    "due_date",
    "amount_due",
  ],
  "estimate-or-quote": [
    "estimate_id",
    "quote_id",
    "proposal",
    "quoted_amount",
    "customer_name",
  ],
  "job-cost-report": [
    "job_id",
    "job_number",
    "labor_cost",
    "material_cost",
    "actual_revenue",
  ],
  "payroll-or-timecard-export": [
    "employee_name",
    "crew",
    "hours",
    "hourly_rate",
    "labor_cost",
  ],
  "profit-and-loss-statement": [
    "revenue",
    "cost_of_goods_sold",
    "gross_profit",
    "operating_expense",
  ],
  "schedule-or-work-order-export": [
    "work_order_id",
    "scheduled_at",
    "technician",
    "job_type",
    "customer_name",
  ],
  "vendor-bill": [
    "vendor_name",
    "bill_number",
    "bill_date",
    "due_date",
    "amount_due",
  ],
} satisfies Record<SupportedDocumentFamilyId, readonly string[]>;

export const documentFamilyClassificationSchema = z.object({
  confidenceScore: z.number().finite().min(0).max(1),
  matchedSignals: z.array(z.string().min(1)),
  suggestedDocumentFamily: supportedDocumentFamilyIdSchema,
});

export type DocumentFamilyClassification = z.infer<
  typeof documentFamilyClassificationSchema
>;

type ClassifyDocumentFamilyInput = {
  fileName: string;
  headers: readonly string[];
};

export function classifyDocumentFamily({
  fileName,
  headers,
}: ClassifyDocumentFamilyInput): DocumentFamilyClassification | null {
  const normalizedHeaderSet = new Set(headers.map(normalizeSignal));
  const normalizedFileName = fileName
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
  let bestMatch: DocumentFamilyClassification | null = null;

  for (const [familyId, signals] of Object.entries(familySignals)) {
    if (signals.length === 0) {
      continue;
    }

    const matchedSignals = signals.filter((signal) =>
      normalizedHeaderSet.has(normalizeSignal(signal)),
    );
    const headerScore = matchedSignals.length / signals.length;
    const fileNameBonus = normalizedFileName.includes(
      fileNameTokenForFamily(familyId),
    )
      ? 0.12
      : 0;
    const confidenceScore = Number(
      Math.min(0.45 + headerScore * 0.45 + fileNameBonus, 0.98).toFixed(2),
    );

    if (headerScore < 0.4) {
      continue;
    }

    const candidate = documentFamilyClassificationSchema.parse({
      confidenceScore,
      matchedSignals,
      suggestedDocumentFamily: familyId,
    });

    if (
      bestMatch === null ||
      candidate.confidenceScore > bestMatch.confidenceScore
    ) {
      bestMatch = candidate;
    }
  }

  return bestMatch;
}

function normalizeSignal(signal: string): string {
  return signal.trim().toLowerCase().replace(/\s+/g, "_");
}

function fileNameTokenForFamily(documentFamilyId: string): string {
  return documentFamilyId.replace(/-/g, " ");
}
