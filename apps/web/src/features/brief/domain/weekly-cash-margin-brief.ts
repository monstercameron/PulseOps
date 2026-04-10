import type { CanonicalFactTypeId } from "@/features/foundation/domain/canonical-facts";
import type { SupportedDocumentFamilyId } from "@/features/foundation/domain/document-families";

export const weeklyCashMarginBriefQuestionIds = [
  "which-jobs-are-underpriced",
  "where-is-margin-leaking",
  "which-invoices-to-chase-today",
  "which-customers-need-deposits",
  "what-bills-are-timing-sensitive",
  "what-deserves-attention-most",
] as const;

export type WeeklyCashMarginBriefQuestionId =
  (typeof weeklyCashMarginBriefQuestionIds)[number];

export const weeklyCashMarginBrief = {
  id: "weekly-cash-margin-brief",
  label: "Weekly Cash and Margin Brief",
  objective:
    "Turn raw service-business data into a short cited operating brief that ranks cash and margin actions for the coming week.",
  supportedDocumentFamilies: [
    "customer-invoice",
    "vendor-bill",
    "bank-transaction-export",
    "accounts-receivable-aging-report",
    "job-cost-report",
    "estimate-or-quote",
    "schedule-or-work-order-export",
    "payroll-or-timecard-export",
  ] as const satisfies readonly SupportedDocumentFamilyId[],
  coreFactTypes: [
    "invoice.amount.total",
    "invoice.amount.outstanding",
    "invoice.due_at",
    "invoice.payment_days_late",
    "vendor_bill.amount.total",
    "vendor_bill.due_at",
    "bank_transaction.amount",
    "bank_transaction.posted_at",
    "job.revenue.actual",
    "job.cost.labor",
    "job.cost.material",
    "job.margin.gross",
    "estimate.amount.total",
    "crew.labor_hours",
    "payment.received_at",
  ] as const satisfies readonly CanonicalFactTypeId[],
  primaryQuestions: weeklyCashMarginBriefQuestionIds,
} as const;

export function getWeeklyCashMarginBriefCoverage() {
  return {
    coreFactTypeCount: weeklyCashMarginBrief.coreFactTypes.length,
    questionCount: weeklyCashMarginBrief.primaryQuestions.length,
    supportedDocumentFamilyCount:
      weeklyCashMarginBrief.supportedDocumentFamilies.length,
  };
}
