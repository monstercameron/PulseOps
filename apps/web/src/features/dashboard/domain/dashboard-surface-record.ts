import { z } from "zod";

import { type DashboardPageData } from "@/features/dashboard/constants/dashboard-page-content";
import {
  buildDashboardFilters,
  dashboardDefaultFilterValues,
  readDashboardFilterValues,
} from "@/features/dashboard/lib/dashboard-filters";
import { supportedDocumentFamilies } from "@/features/foundation/domain/document-families";
import { DEFAULT_WORKSPACE } from "@/features/foundation/domain/default-workspace";

const dashboardMetricSchema = z.object({
  detail: z.string().min(1),
  label: z.string().min(1),
  tone: z.enum(["danger", "info", "neutral", "success", "warning"]),
  trend: z.string().min(1),
  value: z.string().min(1),
});

const dashboardActivityItemSchema = z.object({
  actionLabel: z.string().min(1).optional(),
  detail: z.string().min(1),
  id: z.string().min(1),
  label: z.string().min(1),
  time: z.string().min(1),
  title: z.string().min(1),
  tone: z.enum(["accent", "danger", "info", "warning"]),
});

const dashboardQueueItemSchema = z.object({
  actions: z.array(z.string().min(1)).readonly(),
  context: z.string().min(1),
  id: z.string().min(1),
  priority: z.enum(["danger", "info", "warning"]),
  priorityLabel: z.string().min(1),
  title: z.string().min(1),
  typeLabel: z.string().min(1),
});

const dashboardSignalSchema = z.object({
  detail: z.string().min(1),
  label: z.string().min(1),
  tone: z.enum(["danger", "info", "success", "warning"]),
  value: z.string().min(1),
});

const dashboardPageLabelsSchema = z.object({
  actions: z.object({
    primary: z.string().min(1),
    secondary: z.string().min(1),
  }),
  breadcrumbs: z.array(z.string().min(1)).readonly(),
  businessSummaryEyebrow: z.string().min(1),
  description: z.string().min(1),
  queueCountSuffix: z.string().min(1),
  queueTitle: z.string().min(1),
  signalsTitle: z.string().min(1),
  title: z.string().min(1),
  views: z.object({
    business: z.string().min(1),
    operations: z.string().min(1),
  }),
});

const dashboardFilterOptionSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

const dashboardFilterControlSchema = z.object({
  id: z.enum(["dateRange", "documentType", "source", "status"]),
  label: z.string().min(1),
  options: z.array(dashboardFilterOptionSchema).readonly(),
  selectedValue: z.string().min(1),
});

const dashboardFiltersSchema = z.object({
  controls: z.array(dashboardFilterControlSchema).readonly(),
  workspaceLabel: z.string().min(1),
});

const legacyDashboardFiltersSchema = z
  .array(z.string().min(1))
  .readonly()
  .transform((legacyFilters) => normalizeLegacyDashboardFilters(legacyFilters));

const dashboardPageDataSchema = z.object({
  businessSummary: z.object({
    actionLabel: z.string().min(1),
    description: z.string().min(1),
    title: z.string().min(1),
  }),
  filterSummary: z
    .object({
      globalScopeLabel: z.string().min(1),
      scopedResultsLabel: z.string().min(1),
    })
    .optional()
    .default({
      globalScopeLabel:
        "KPI strip covers Broward HVAC Co. over the last 7 days.",
      scopedResultsLabel:
        "Activity, queue, and signals show all document activity in that window.",
    }),
  filters: z.union([dashboardFiltersSchema, legacyDashboardFiltersSchema]),
  labels: dashboardPageLabelsSchema,
  metrics: z.array(dashboardMetricSchema).readonly(),
  queueItems: z.array(dashboardQueueItemSchema).readonly(),
  recentActivity: z
    .array(
      z.object({
        id: z.string().min(1),
        items: z.array(dashboardActivityItemSchema).readonly(),
        title: z.string().min(1),
      }),
    )
    .readonly(),
  scopedContent: z
    .object({
      description: z.string().min(1),
      items: z
        .array(
          z.object({
            id: z.string().min(1),
            meta: z.string().min(1),
            title: z.string().min(1),
          }),
        )
        .readonly(),
      title: z.string().min(1),
    })
    .nullable()
    .optional()
    .default(null),
  signals: z.array(dashboardSignalSchema).readonly(),
});

export const dashboardSurfaceRecordSchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  pageData: dashboardPageDataSchema,
  updatedAt: z.string().datetime(),
  version: z.literal("dashboard-surface-record.v1"),
});

export type DashboardSurfaceRecord = z.infer<typeof dashboardSurfaceRecordSchema>;

type CreateDashboardSurfaceRecordInput = Omit<
  DashboardSurfaceRecord,
  "updatedAt" | "version"
> & {
  updatedAt?: string;
};

export function createDashboardSurfaceRecord(
  input: CreateDashboardSurfaceRecordInput,
): DashboardSurfaceRecord {
  return dashboardSurfaceRecordSchema.parse({
    ...input,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    version: "dashboard-surface-record.v1",
  });
}

export function createDefaultDashboardSurfaceRecord(
  orgId: string,
  updatedAt?: string,
): DashboardSurfaceRecord {
  const pageData: DashboardPageData = {
    businessSummary: {
      actionLabel: "Open this week's brief",
      description:
        "Eight recommendations generated. Three flagged high priority. Last run six hours ago.",
      title: "Cash and Margin Brief - week of Apr 14",
    },
    filterSummary: {
      globalScopeLabel: "KPI strip covers Broward HVAC Co. over the last 7 days.",
      scopedResultsLabel:
        "Activity, queue, and signals show all document activity in that window.",
    },
    filters: buildDashboardFilters({
      documents: [],
      organizationName: DEFAULT_WORKSPACE.name,
      values: dashboardDefaultFilterValues,
    }),
    labels: {
      actions: {
        primary: "Upload files",
        secondary: "Open weekly brief",
      },
      breadcrumbs: ["App", "Dashboard"],
      businessSummaryEyebrow: "Weekly brief",
      description:
        "Track document flow, operator review, and the business signals that should shape this week's decisions.",
      queueCountSuffix: "active",
      queueTitle: "Operator queue",
      signalsTitle: "Business signals",
      title: "Dashboard",
      views: {
        business: "Business view",
        operations: "Operations view",
      },
    },
    metrics: [
      {
        detail: "8 versus yesterday",
        label: "Files received",
        tone: "success",
        trend: "Up on recent volume",
        value: "52",
      },
      {
        detail: "1.1 points below target",
        label: "Parse success",
        tone: "warning",
        trend: "Review source quality",
        value: "94.2%",
      },
      {
        detail: "Across recent classifications",
        label: "Average confidence",
        tone: "success",
        trend: "Stable over the week",
        value: "0.87",
      },
      {
        detail: "Needs human follow-up",
        label: "Awaiting review",
        tone: "warning",
        trend: "Three new today",
        value: "7",
      },
      {
        detail: "Pack surfaced this morning",
        label: "Decision packs",
        tone: "info",
        trend: "One live brief",
        value: "1",
      },
      {
        detail: "Needs operator action",
        label: "Critical failures",
        tone: "danger",
        trend: "Two failed PDFs",
        value: "2",
      },
      {
        detail: "Below recent average",
        label: "Estimated AI cost",
        tone: "success",
        trend: "Efficient extraction mix",
        value: "$1.24",
      },
      {
        detail: "Primary system synced recently",
        label: "Last sync",
        tone: "info",
        trend: "ServiceTitan online",
        value: "8m ago",
      },
    ],
    queueItems: [
      {
        id: "queue_vendor_merge",
        actions: ["Merge", "Keep separate"],
        context: "Appears across 14 invoices totaling $33,400.",
        priority: "danger",
        priorityLabel: "High",
        title: "HVAC Parts Ltd and HVAC Parts LLC detected as a possible duplicate vendor.",
        typeLabel: "Vendor merge",
      },
      {
        id: "queue_parse_failure",
        actions: ["Inspect files", "Dismiss"],
        context: "Held in staging and not sent downstream yet.",
        priority: "danger",
        priorityLabel: "High",
        title: "Three invoices from Acme Supply failed before extraction.",
        typeLabel: "Parse failure",
      },
      {
        id: "queue_new_bucket",
        actions: ["Approve", "Rename", "Discard"],
        context: "Detected in six service reports this week.",
        priority: "warning",
        priorityLabel: "Medium",
        title: "Approve a new cost bucket for Equipment Rental.",
        typeLabel: "New bucket",
      },
      {
        id: "queue_date_review",
        actions: ["Service date", "Invoice date"],
        context: "This affects revenue timing for the current margin calculation.",
        priority: "info",
        priorityLabel: "Review",
        title: "Choose the primary event date for one invoice packet.",
        typeLabel: "Date ambiguity",
      },
    ],
    recentActivity: [
      {
        id: "today",
        title: "Today",
        items: [
          {
            id: "activity_import",
            actionLabel: "Review",
            detail: "Parsed, classified, and queued for extraction.",
            label: "Import",
            time: "14m ago",
            title: "47 invoices imported from Gmail and the AP inbox.",
            tone: "info",
          },
          {
            id: "activity_failure",
            actionLabel: "Inspect",
            detail: "Unsupported template may need manual review or a parser update.",
            label: "Failure",
            time: "14m ago",
            title: "Three PDF invoices failed layout parsing.",
            tone: "danger",
          },
          {
            id: "activity_classification",
            actionLabel: "Approve",
            detail: "Equipment Rental and Subcontract Labor are pending approval.",
            label: "AI",
            time: "1h ago",
            title: "Two new vendor categories were detected.",
            tone: "accent",
          },
        ],
      },
      {
        id: "earlier",
        title: "Earlier",
        items: [
          {
            id: "activity_pack",
            actionLabel: "Open brief",
            detail: "Eight recommendations generated and three flagged high priority.",
            label: "Pack",
            time: "6h ago",
            title: "Cash and Margin Brief ran for Broward HVAC Co.",
            tone: "accent",
          },
          {
            id: "activity_warning",
            actionLabel: "Fix",
            detail: "Job #4821 is missing parts and labor cost detail from ServiceTitan.",
            label: "Warning",
            time: "9h ago",
            title: "One job is missing cost data so margin is incomplete.",
            tone: "warning",
          },
        ],
      },
    ],
    scopedContent: null,
    signals: [
      {
        detail: "12 invoices and an average of 38 days overdue",
        label: "Past-due invoices",
        tone: "danger",
        value: "$42,800",
      },
      {
        detail: "Average margin gap of $380 per job",
        label: "Likely underpriced jobs",
        tone: "warning",
        value: "3 jobs",
      },
      {
        detail: "Versus last month and the best three-month run so far",
        label: "Margin trend",
        tone: "success",
        value: "+2.1%",
      },
      {
        detail: "Job #4817 is materially above the typical parts profile",
        label: "Parts cost anomaly",
        tone: "warning",
        value: "$1,200",
      },
      {
        detail: "Recommendation acceptance over the last 30 days",
        label: "Recommendation acceptance",
        tone: "info",
        value: "71%",
      },
    ],
  };

  return createDashboardSurfaceRecord({
    id: `dashboard-surface-${orgId}`,
    orgId,
    pageData,
    updatedAt,
  });
}

function normalizeLegacyDashboardFilters(legacyFilters: readonly string[]) {
  const workspaceLabel = legacyFilters[0] ?? DEFAULT_WORKSPACE.name;

  return buildDashboardFilters({
    documents: [],
    organizationName: workspaceLabel,
    values: readDashboardFilterValues({
      dateRange: readLegacyDateRangeValue(legacyFilters[1]),
      documentType: readLegacyDocumentTypeValue(legacyFilters[3]),
      source: readLegacySourceValue(legacyFilters[2]),
      status: readLegacyStatusValue(legacyFilters[4]),
    }),
  });
}

function readLegacyDateRangeValue(label?: string) {
  if (label === "All time") {
    return "all";
  }

  if (label === "Last 30 days") {
    return "30d";
  }

  return dashboardDefaultFilterValues.dateRange;
}

function readLegacySourceValue(label?: string) {
  if (label === "Gmail / AP inbox") {
    return "email";
  }

  if (label === "Connected API") {
    return "api";
  }

  if (label === "Manual uploads" || label === "Manual upload") {
    return "upload";
  }

  return dashboardDefaultFilterValues.source;
}

function readLegacyDocumentTypeValue(label?: string) {
  if (label === undefined || label === "All document types") {
    return dashboardDefaultFilterValues.documentType;
  }

  return (
    supportedDocumentFamilies.find((family) => family.label === label)?.id ??
    dashboardDefaultFilterValues.documentType
  );
}

function readLegacyStatusValue(label?: string) {
  if (label === "Needs review") {
    return "needs-review";
  }

  if (label === "Uploaded") {
    return "uploaded";
  }

  if (label === "Extracted") {
    return "extracted";
  }

  if (label === "Failed") {
    return "failed";
  }

  return dashboardDefaultFilterValues.status;
}
