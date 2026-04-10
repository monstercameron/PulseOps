import { z } from "zod";

export const canonicalFactTypeIds = [
  "document.observation.text",
  "document.observation.number",
  "document.observation.boolean",
  "document.observation.datetime",
  "document.observation.list",
  "invoice.amount.total",
  "invoice.amount.outstanding",
  "invoice.issued_at",
  "invoice.due_at",
  "invoice.payment_days_late",
  "vendor_bill.amount.total",
  "vendor_bill.due_at",
  "bank_transaction.amount",
  "bank_transaction.posted_at",
  "bank_transaction.direction",
  "job.revenue.actual",
  "job.cost.labor",
  "job.cost.material",
  "job.cost.subcontractor",
  "job.margin.gross",
  "job.status",
  "estimate.amount.total",
  "work_order.scheduled_at",
  "crew.labor_hours",
  "payment.received_at",
] as const;

export const canonicalFactTypeIdSchema = z.enum(canonicalFactTypeIds);

export type CanonicalFactTypeId = z.infer<typeof canonicalFactTypeIdSchema>;

export const canonicalFactTypes = [
  {
    id: "document.observation.text",
    label: "Document text observation",
    description:
      "A generic text fact extracted from a business document when no narrower canonical fact type applies.",
  },
  {
    id: "document.observation.number",
    label: "Document numeric observation",
    description:
      "A generic numeric fact extracted from a business document when no narrower canonical fact type applies.",
  },
  {
    id: "document.observation.boolean",
    label: "Document boolean observation",
    description:
      "A generic boolean fact extracted from a business document when no narrower canonical fact type applies.",
  },
  {
    id: "document.observation.datetime",
    label: "Document datetime observation",
    description:
      "A generic date or datetime fact extracted from a business document when no narrower canonical fact type applies.",
  },
  {
    id: "document.observation.list",
    label: "Document list observation",
    description:
      "A generic multi-value fact extracted from a business document when no narrower canonical fact type applies.",
  },
  {
    id: "invoice.amount.total",
    label: "Invoice total amount",
    description: "The full billed amount for a customer invoice.",
  },
  {
    id: "invoice.amount.outstanding",
    label: "Invoice outstanding amount",
    description: "The unpaid amount still open on a customer invoice.",
  },
  {
    id: "invoice.issued_at",
    label: "Invoice issue date",
    description: "The date a customer invoice was created or sent.",
  },
  {
    id: "invoice.due_at",
    label: "Invoice due date",
    description: "The contractual due date for payment on an invoice.",
  },
  {
    id: "invoice.payment_days_late",
    label: "Invoice days late",
    description:
      "The count of days between due date and current or received payment date.",
  },
  {
    id: "vendor_bill.amount.total",
    label: "Vendor bill total amount",
    description: "The full amount owed on a vendor or supplier bill.",
  },
  {
    id: "vendor_bill.due_at",
    label: "Vendor bill due date",
    description: "The date by which a vendor bill should be paid.",
  },
  {
    id: "bank_transaction.amount",
    label: "Bank transaction amount",
    description: "The signed amount of a bank transaction.",
  },
  {
    id: "bank_transaction.posted_at",
    label: "Bank transaction posted date",
    description: "The date a bank transaction posted to the account.",
  },
  {
    id: "bank_transaction.direction",
    label: "Bank transaction direction",
    description: "Whether a bank transaction is cash in or cash out.",
  },
  {
    id: "job.revenue.actual",
    label: "Job actual revenue",
    description: "Revenue recognized for a completed or in-progress job.",
  },
  {
    id: "job.cost.labor",
    label: "Job labor cost",
    description: "Direct labor cost associated with a job.",
  },
  {
    id: "job.cost.material",
    label: "Job material cost",
    description: "Direct material cost associated with a job.",
  },
  {
    id: "job.cost.subcontractor",
    label: "Job subcontractor cost",
    description: "External labor or subcontractor cost associated with a job.",
  },
  {
    id: "job.margin.gross",
    label: "Job gross margin",
    description: "Gross margin for a job after direct costs.",
  },
  {
    id: "job.status",
    label: "Job status",
    description: "The current lifecycle status of a job or work order.",
  },
  {
    id: "estimate.amount.total",
    label: "Estimate total amount",
    description: "The quoted amount for an estimate or proposal.",
  },
  {
    id: "work_order.scheduled_at",
    label: "Work order scheduled date",
    description: "The date and time a service visit is scheduled.",
  },
  {
    id: "crew.labor_hours",
    label: "Crew labor hours",
    description: "Hours worked by a crew on a job or time period.",
  },
  {
    id: "payment.received_at",
    label: "Payment received date",
    description: "The date a customer payment was received.",
  },
] as const satisfies readonly {
  id: CanonicalFactTypeId;
  label: string;
  description: string;
}[];

export function isCanonicalFactTypeId(
  value: string,
): value is CanonicalFactTypeId {
  return canonicalFactTypeIdSchema.safeParse(value).success;
}
