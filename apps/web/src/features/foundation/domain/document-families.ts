import { z } from "zod";

export const supportedDocumentFamilyIds = [
  "generic-business-document",
  "customer-invoice",
  "vendor-bill",
  "bank-transaction-export",
  "chart-of-accounts-export",
  "profit-and-loss-statement",
  "accounts-receivable-aging-report",
  "job-cost-report",
  "estimate-or-quote",
  "schedule-or-work-order-export",
  "payroll-or-timecard-export",
] as const;

export const supportedDocumentFamilyIdSchema = z.enum(
  supportedDocumentFamilyIds,
);

export type SupportedDocumentFamilyId = z.infer<
  typeof supportedDocumentFamilyIdSchema
>;

export const supportedDocumentFamilies = [
  {
    id: "generic-business-document",
    label: "Generic business document",
    description:
      "A fallback family for parseable business files that do not cleanly map to a narrower supported document family.",
  },
  {
    id: "customer-invoice",
    label: "Customer invoice",
    description:
      "Issued invoices used for receivables, payment timing, and collection recommendations.",
  },
  {
    id: "vendor-bill",
    label: "Vendor bill",
    description:
      "Payables documents used for cash timing and margin leakage analysis.",
  },
  {
    id: "bank-transaction-export",
    label: "Bank transaction export",
    description:
      "Transaction-level cash movement used to reconcile inflows, outflows, and anomalies.",
  },
  {
    id: "chart-of-accounts-export",
    label: "Chart of accounts export",
    description:
      "Ledger account reference data used for financial normalization and rollups.",
  },
  {
    id: "profit-and-loss-statement",
    label: "Profit and loss statement",
    description:
      "Period financial summary used to validate margin and operating trend calculations.",
  },
  {
    id: "accounts-receivable-aging-report",
    label: "Accounts receivable aging report",
    description:
      "Aging snapshots used to prioritize collection actions and identify slow-paying customers.",
  },
  {
    id: "job-cost-report",
    label: "Job cost report",
    description:
      "Job-level revenue and cost breakdown used for underpricing and margin analysis.",
  },
  {
    id: "estimate-or-quote",
    label: "Estimate or quote",
    description:
      "Quoted pricing used to compare promised job value against realized cost and margin.",
  },
  {
    id: "schedule-or-work-order-export",
    label: "Schedule or work order export",
    description:
      "Operational schedule data used for workload timing and service-delivery context.",
  },
  {
    id: "payroll-or-timecard-export",
    label: "Payroll or timecard export",
    description:
      "Labor hour and labor cost data used for crew-level cost and utilization analysis.",
  },
] as const satisfies readonly {
  id: SupportedDocumentFamilyId;
  label: string;
  description: string;
}[];

export function isSupportedDocumentFamilyId(
  value: string,
): value is SupportedDocumentFamilyId {
  return supportedDocumentFamilyIdSchema.safeParse(value).success;
}
