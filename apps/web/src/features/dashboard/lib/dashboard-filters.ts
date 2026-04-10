import { z } from "zod";

import {
  type DashboardFilterControl,
  type DashboardFilters,
} from "@/features/dashboard/constants/dashboard-page-content";
import {
  documentSourceSchema,
  type DocumentRecord,
} from "@/features/documents/domain/document";
import {
  supportedDocumentFamilies,
  supportedDocumentFamilyIdSchema,
  type SupportedDocumentFamilyId,
} from "@/features/foundation/domain/document-families";
import { type CanonicalFactRecord } from "@/features/facts/domain/canonical-fact-record";

export const dashboardDateRangeSchema = z.enum(["7d", "30d", "all"]);
export const dashboardStatusFilterSchema = z.enum([
  "all",
  "uploaded",
  "needs-review",
  "extracted",
  "failed",
]);
export const dashboardSourceFilterSchema = z.union([
  z.literal("all"),
  documentSourceSchema,
]);
export const dashboardDocumentTypeFilterSchema = z.union([
  z.literal("all"),
  supportedDocumentFamilyIdSchema,
]);

export type DashboardFilterValues = Readonly<{
  dateRange: z.infer<typeof dashboardDateRangeSchema>;
  documentType: z.infer<typeof dashboardDocumentTypeFilterSchema>;
  source: z.infer<typeof dashboardSourceFilterSchema>;
  status: z.infer<typeof dashboardStatusFilterSchema>;
}>;

export const dashboardDefaultFilterValues: DashboardFilterValues = {
  dateRange: "7d",
  documentType: "all",
  source: "all",
  status: "all",
};

export function readDashboardFilterValues(input?: Readonly<{
  dateRange?: string | null;
  documentType?: string | null;
  source?: string | null;
  status?: string | null;
}>): DashboardFilterValues {
  return {
    dateRange: readDashboardDateRange(input?.dateRange),
    documentType: readDashboardDocumentType(input?.documentType),
    source: readDashboardSource(input?.source),
    status: readDashboardStatus(input?.status),
  };
}

export function hasActiveDashboardFilters(values: DashboardFilterValues) {
  return (
    values.dateRange !== dashboardDefaultFilterValues.dateRange ||
    values.documentType !== dashboardDefaultFilterValues.documentType ||
    values.source !== dashboardDefaultFilterValues.source ||
    values.status !== dashboardDefaultFilterValues.status
  );
}

export function hasScopedDashboardFilters(values: DashboardFilterValues) {
  return (
    values.documentType !== dashboardDefaultFilterValues.documentType ||
    values.source !== dashboardDefaultFilterValues.source ||
    values.status !== dashboardDefaultFilterValues.status
  );
}

export function buildDashboardFilters(input: Readonly<{
  documents: readonly DocumentRecord[];
  organizationName: string;
  values: DashboardFilterValues;
}>): DashboardFilters {
  return {
    controls: [
      {
        id: "dateRange",
        label: getDashboardDateRangeLabel(input.values.dateRange),
        options: [
          { label: "Last 7 days", value: "7d" },
          { label: "Last 30 days", value: "30d" },
          { label: "All time", value: "all" },
        ],
        selectedValue: input.values.dateRange,
      },
      {
        id: "source",
        label: getDashboardSourceLabel(input.values.source),
        options: buildSourceOptions(input.documents, input.values.source),
        selectedValue: input.values.source,
      },
      {
        id: "documentType",
        label: getDashboardDocumentTypeLabel(input.values.documentType),
        options: buildDocumentTypeOptions(input.documents, input.values.documentType),
        selectedValue: input.values.documentType,
      },
      {
        id: "status",
        label: getDashboardStatusLabel(input.values.status),
        options: buildStatusOptions(input.documents, input.values.status),
        selectedValue: input.values.status,
      },
    ] satisfies readonly DashboardFilterControl[],
    workspaceLabel: input.organizationName,
  };
}

export function filterDashboardDocuments(
  documents: readonly DocumentRecord[],
  values: DashboardFilterValues,
  now = new Date(),
) {
  return documents.filter((document) => {
    if (!matchesDateRangeFilter(document, values.dateRange, now)) {
      return false;
    }

    if (values.source !== "all" && document.source !== values.source) {
      return false;
    }

    if (
      values.documentType !== "all" &&
      document.suggestedDocumentFamily !== values.documentType
    ) {
      return false;
    }

    return matchesStatusFilter(document, values.status);
  });
}

export function filterDashboardFacts(
  facts: readonly CanonicalFactRecord[],
  documents: readonly DocumentRecord[],
) {
  const documentIds = new Set(documents.map((document) => document.id));

  return facts.filter((fact) => documentIds.has(fact.documentId));
}

export function getDashboardDateRangeLabel(
  value: DashboardFilterValues["dateRange"],
) {
  if (value === "30d") {
    return "Last 30 days";
  }

  if (value === "all") {
    return "All time";
  }

  return "Last 7 days";
}

export function getDashboardSourceLabel(
  value: DashboardFilterValues["source"],
) {
  if (value === "email") {
    return "Gmail / AP inbox";
  }

  if (value === "api") {
    return "Connected API";
  }

  if (value === "upload") {
    return "Manual uploads";
  }

  return "All sources";
}

export function getDashboardDocumentTypeLabel(
  value: DashboardFilterValues["documentType"],
) {
  if (value === "all") {
    return "All document types";
  }

  return (
    supportedDocumentFamilies.find((family) => family.id === value)?.label ??
    "All document types"
  );
}

export function getDashboardStatusLabel(
  value: DashboardFilterValues["status"],
) {
  if (value === "needs-review") {
    return "Needs review";
  }

  if (value === "uploaded") {
    return "Uploaded";
  }

  if (value === "extracted") {
    return "Extracted";
  }

  if (value === "failed") {
    return "Failed";
  }

  return "All statuses";
}

function buildDocumentTypeOptions(
  documents: readonly DocumentRecord[],
  selectedValue: DashboardFilterValues["documentType"],
) {
  const availableFamilies = new Set<SupportedDocumentFamilyId>();

  documents.forEach((document) => {
    if (document.suggestedDocumentFamily !== undefined) {
      availableFamilies.add(document.suggestedDocumentFamily);
    }
  });

  if (selectedValue !== "all") {
    availableFamilies.add(selectedValue);
  }

  return [
    { label: "All document types", value: "all" },
    ...supportedDocumentFamilies
      .filter((family) => availableFamilies.has(family.id))
      .map((family) => ({
        label: family.label,
        value: family.id,
      })),
  ];
}

function buildSourceOptions(
  documents: readonly DocumentRecord[],
  selectedValue: DashboardFilterValues["source"],
) {
  const availableSources = new Set<
    Exclude<DashboardFilterValues["source"], "all">
  >();

  documents.forEach((document) => {
    availableSources.add(document.source);
  });

  if (selectedValue !== "all") {
    availableSources.add(selectedValue);
  }

  const sourceOrder = ["email", "api", "upload"] as const;

  return [
    { label: "All sources", value: "all" },
    ...sourceOrder
      .filter((source) => availableSources.has(source))
      .map((source) => ({
        label: getDashboardSourceLabel(source),
        value: source,
      })),
  ];
}

function buildStatusOptions(
  documents: readonly DocumentRecord[],
  selectedValue: DashboardFilterValues["status"],
) {
  const availableStatuses = new Set<
    Exclude<DashboardFilterValues["status"], "all">
  >();

  documents.forEach((document) => {
    if (document.status === "parsed" || document.status === "classified") {
      availableStatuses.add("needs-review");
      return;
    }

    if (document.status === "uploaded" || document.status === "stored") {
      availableStatuses.add("uploaded");
      return;
    }

    if (document.status === "extracted") {
      availableStatuses.add("extracted");
      return;
    }

    if (document.status === "failed") {
      availableStatuses.add("failed");
    }
  });

  if (selectedValue !== "all") {
    availableStatuses.add(selectedValue);
  }

  const statusOrder = [
    "needs-review",
    "extracted",
    "failed",
    "uploaded",
  ] as const;

  return [
    { label: "All statuses", value: "all" },
    ...statusOrder
      .filter((status) => availableStatuses.has(status))
      .map((status) => ({
        label: getDashboardStatusLabel(status),
        value: status,
      })),
  ];
}

function readDashboardDateRange(value?: string | null) {
  const parsedValue = dashboardDateRangeSchema.safeParse(value);

  return parsedValue.success ? parsedValue.data : dashboardDefaultFilterValues.dateRange;
}

function readDashboardDocumentType(value?: string | null) {
  const parsedValue = dashboardDocumentTypeFilterSchema.safeParse(value);

  return parsedValue.success
    ? parsedValue.data
    : dashboardDefaultFilterValues.documentType;
}

function readDashboardSource(value?: string | null) {
  const parsedValue = dashboardSourceFilterSchema.safeParse(value);

  return parsedValue.success ? parsedValue.data : dashboardDefaultFilterValues.source;
}

function readDashboardStatus(value?: string | null) {
  const parsedValue = dashboardStatusFilterSchema.safeParse(value);

  return parsedValue.success ? parsedValue.data : dashboardDefaultFilterValues.status;
}

function matchesDateRangeFilter(
  document: Pick<DocumentRecord, "updatedAt">,
  dateRange: DashboardFilterValues["dateRange"],
  now: Date,
) {
  if (dateRange === "all") {
    return true;
  }

  const rangeDays = dateRange === "30d" ? 30 : 7;
  const updatedAtTimestamp = new Date(document.updatedAt).getTime();

  return updatedAtTimestamp >= now.getTime() - rangeDays * 24 * 60 * 60 * 1000;
}

function matchesStatusFilter(
  document: Pick<DocumentRecord, "status">,
  status: DashboardFilterValues["status"],
) {
  if (status === "all") {
    return true;
  }

  if (status === "needs-review") {
    return document.status === "parsed" || document.status === "classified";
  }

  if (status === "uploaded") {
    return document.status === "uploaded" || document.status === "stored";
  }

  return document.status === status;
}
