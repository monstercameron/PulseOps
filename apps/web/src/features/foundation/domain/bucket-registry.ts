import { z } from "zod";

export const bucketDimensionIds = [
  "location",
  "department",
  "crew",
  "job_type",
  "customer_segment",
  "product_service_line",
  "vendor",
  "payment_status",
  "aging_band",
  "margin_band",
] as const;

export const bucketDimensionIdSchema = z.enum(bucketDimensionIds);

export type BucketDimensionId = z.infer<typeof bucketDimensionIdSchema>;

export const bucketDimensions = [
  {
    id: "location",
    label: "Location",
    description: "Physical branch, territory, or operating area.",
    valueExamples: ["north-shop", "south-service-area"],
  },
  {
    id: "department",
    label: "Department",
    description: "Top-level operating department or functional unit.",
    valueExamples: ["install", "service"],
  },
  {
    id: "crew",
    label: "Crew",
    description:
      "Named crew or technician grouping attached to jobs and labor.",
    valueExamples: ["crew-a", "crew-b"],
  },
  {
    id: "job_type",
    label: "Job type",
    description:
      "Normalized service category used for pricing and margin analysis.",
    valueExamples: ["maintenance", "replacement"],
  },
  {
    id: "customer_segment",
    label: "Customer segment",
    description:
      "Commercial or residential grouping used for recommendation targeting.",
    valueExamples: ["residential", "commercial"],
  },
  {
    id: "product_service_line",
    label: "Product or service line",
    description: "Named revenue line or offering family.",
    valueExamples: ["hvac-service", "plumbing-repair"],
  },
  {
    id: "vendor",
    label: "Vendor",
    description:
      "Supplier or payee dimension used for payable timing and cost analysis.",
    valueExamples: ["carrier", "ferguson"],
  },
  {
    id: "payment_status",
    label: "Payment status",
    description: "Normalized receivable or payable payment state.",
    valueExamples: ["current", "overdue"],
  },
  {
    id: "aging_band",
    label: "Aging band",
    description:
      "Receivable or payable aging bucket used for priority decisions.",
    valueExamples: ["0-30", "31-60"],
  },
  {
    id: "margin_band",
    label: "Margin band",
    description:
      "Margin grouping used to surface underperforming jobs and services.",
    valueExamples: ["negative", "healthy"],
  },
] as const satisfies readonly {
  id: BucketDimensionId;
  label: string;
  description: string;
  valueExamples: readonly string[];
}[];

export function isBucketDimensionId(value: string): value is BucketDimensionId {
  return bucketDimensionIdSchema.safeParse(value).success;
}

export function getBucketDimension(bucketDimensionId: BucketDimensionId) {
  return bucketDimensions.find((bucket) => bucket.id === bucketDimensionId);
}

export function getBucketRegistrySummary() {
  return {
    bucketDimensionCount: bucketDimensions.length,
    ids: bucketDimensionIds,
  };
}
