import { z } from "zod";

import { canonicalFactTypeIdSchema } from "@/features/foundation/domain/canonical-facts";
import { bucketDimensionIdSchema } from "@/features/foundation/domain/bucket-registry";

export const metricUnitSchema = z.enum([
  "count",
  "currency_cents",
  "ratio_bps",
  "hours",
  "days",
]);

export const metricDefinitionSchema = z.object({
  description: z.string().min(1),
  dimensionIds: z.array(bucketDimensionIdSchema),
  id: z.string().min(1),
  inputFactTypeIds: z.array(canonicalFactTypeIdSchema).min(1),
  label: z.string().min(1),
  unit: metricUnitSchema,
});

export type MetricDefinition = z.infer<typeof metricDefinitionSchema>;

export const metricRegistry = [
  {
    id: "overdue_receivables_cents",
    label: "Overdue receivables",
    description: "Total unpaid receivables currently past due.",
    unit: "currency_cents",
    inputFactTypeIds: [
      "invoice.amount.outstanding",
      "invoice.due_at",
      "invoice.payment_days_late",
    ],
    dimensionIds: ["customer_segment", "aging_band", "payment_status"],
  },
  {
    id: "overdue_invoice_count",
    label: "Overdue invoice count",
    description: "Count of receivable invoices currently past due.",
    unit: "count",
    inputFactTypeIds: ["invoice.due_at", "invoice.payment_days_late"],
    dimensionIds: ["customer_segment", "aging_band", "payment_status"],
  },
  {
    id: "gross_margin_bps",
    label: "Gross margin",
    description: "Gross margin across jobs expressed in basis points.",
    unit: "ratio_bps",
    inputFactTypeIds: [
      "job.revenue.actual",
      "job.cost.labor",
      "job.cost.material",
      "job.cost.subcontractor",
      "job.margin.gross",
    ],
    dimensionIds: ["location", "crew", "job_type", "margin_band"],
  },
  {
    id: "underpriced_job_count",
    label: "Underpriced job count",
    description:
      "Count of jobs where actual margin materially underperformed quote expectations.",
    unit: "count",
    inputFactTypeIds: [
      "estimate.amount.total",
      "job.revenue.actual",
      "job.margin.gross",
    ],
    dimensionIds: ["crew", "job_type", "margin_band"],
  },
  {
    id: "labor_cost_cents",
    label: "Labor cost",
    description: "Direct labor cost attributed to jobs or periods.",
    unit: "currency_cents",
    inputFactTypeIds: ["job.cost.labor", "crew.labor_hours"],
    dimensionIds: ["crew", "job_type", "department"],
  },
  {
    id: "material_cost_cents",
    label: "Material cost",
    description: "Direct material cost attributed to jobs or services.",
    unit: "currency_cents",
    inputFactTypeIds: ["job.cost.material"],
    dimensionIds: ["job_type", "product_service_line", "vendor"],
  },
  {
    id: "vendor_payables_due_7d_cents",
    label: "Vendor payables due in 7 days",
    description: "Total supplier bills coming due within the next week.",
    unit: "currency_cents",
    inputFactTypeIds: ["vendor_bill.amount.total", "vendor_bill.due_at"],
    dimensionIds: ["vendor", "payment_status"],
  },
  {
    id: "scheduled_work_order_count",
    label: "Scheduled work orders",
    description: "Count of upcoming scheduled visits or jobs.",
    unit: "count",
    inputFactTypeIds: ["work_order.scheduled_at", "job.status"],
    dimensionIds: ["location", "crew", "job_type"],
  },
  {
    id: "deposit_recommendation_value_cents",
    label: "Deposit recommendation value",
    description: "Cash protected by requiring deposits on selected jobs.",
    unit: "currency_cents",
    inputFactTypeIds: ["estimate.amount.total", "invoice.payment_days_late"],
    dimensionIds: ["customer_segment", "job_type"],
  },
  {
    id: "cash_inflow_days_late",
    label: "Cash inflow days late",
    description:
      "Average lateness between invoice due dates and received payment dates.",
    unit: "days",
    inputFactTypeIds: [
      "invoice.due_at",
      "invoice.payment_days_late",
      "payment.received_at",
    ],
    dimensionIds: ["customer_segment", "aging_band", "payment_status"],
  },
] as const satisfies readonly MetricDefinition[];

export function getMetricDefinition(metricId: string) {
  return metricRegistry.find((metric) => metric.id === metricId);
}

export function getMetricRegistrySummary() {
  return {
    ids: metricRegistry.map((metric) => metric.id),
    metricCount: metricRegistry.length,
  };
}
