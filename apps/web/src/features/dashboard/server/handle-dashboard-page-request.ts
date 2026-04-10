import { z } from "zod";

import {
  type DashboardActivityItem,
  type DashboardMetric,
  type DashboardPageData,
  type DashboardQueueItem,
} from "@/features/dashboard/constants/dashboard-page-content";
import { type DashboardSurfaceRepository } from "@/features/dashboard/repositories/dashboard-surface-repository";
import { type QueueEventRepository } from "@/features/dashboard/repositories/queue-event-repository";
import {
  buildDashboardFilters,
  dashboardDefaultFilterValues,
  filterDashboardDocuments,
  filterDashboardFacts,
  hasActiveDashboardFilters,
  hasScopedDashboardFilters,
  getDashboardDateRangeLabel,
  getDashboardDocumentTypeLabel,
  getDashboardSourceLabel,
  getDashboardStatusLabel,
  readDashboardFilterValues,
  type DashboardFilterValues,
} from "@/features/dashboard/lib/dashboard-filters";
import { getDashboardSeedPageData } from "@/features/dashboard/server/dashboard-surface-record-service";
import {
  type DocumentRepository,
} from "@/features/documents/repositories/document-repository";
import { type DocumentRecord } from "@/features/documents/domain/document";
import { type FactRepository } from "@/features/facts/repositories/fact-repository";
import { DEFAULT_WORKSPACE } from "@/features/foundation/domain/default-workspace";
import { type PackRepository } from "@/features/packs/repositories/pack-repository";
import { listPackRecordsForOrg } from "@/features/packs/server/pack-record-service";
import { type SavedQuestionRepository } from "@/features/query/repositories/saved-question-repository";
import { buildSignalsFromWorkspaceData } from "@/features/signals/server/handle-signals-request";
import { type SettingsRepository } from "@/features/settings/repositories/settings-repository";
import { getSettingsRecord } from "@/features/settings/server/settings-record-service";

const dashboardSearchParamsSchema = z.object({
  locale: z.string().min(2).optional(),
  orgId: z.string().min(1),
});

type DashboardDependencies = Readonly<{
  dashboardSurfaceRepository: DashboardSurfaceRepository;
  documentRepository: DocumentRepository;
  factRepository: FactRepository;
  packRepository?: PackRepository;
  queueEventRepository?: QueueEventRepository;
  savedQuestionRepository: SavedQuestionRepository;
  settingsRepository?: SettingsRepository;
}>;

export async function handleDashboardPageRequest(
  request: Request,
  dependencies: DashboardDependencies,
) {
  const url = new URL(request.url);
  const parsedSearchParams = dashboardSearchParamsSchema.safeParse({
    locale: url.searchParams.get("locale") ?? undefined,
    orgId: url.searchParams.get("orgId"),
  });

  if (!parsedSearchParams.success) {
    return Response.json(
      {
        error: "Missing orgId query parameter.",
      },
      { status: 400 },
    );
  }

  const data = await getDashboardPageData({
    ...dependencies,
    filters: readDashboardFilterValues({
      dateRange: url.searchParams.get("dateRange"),
      documentType: url.searchParams.get("documentType"),
      source: url.searchParams.get("source"),
      status: url.searchParams.get("status"),
    }),
    locale: parsedSearchParams.data.locale,
    orgId: parsedSearchParams.data.orgId,
  });

  return Response.json({
    orgId: parsedSearchParams.data.orgId,
    ...data,
  });
}

type GetDashboardPageDataInput = DashboardDependencies &
  Readonly<{
    filters?: DashboardFilterValues;
    locale?: string;
    now?: Date;
    orgId: string;
  }>;

export async function getDashboardPageData({
  dashboardSurfaceRepository,
  documentRepository,
  factRepository,
  filters = dashboardDefaultFilterValues,
  locale = "en-US",
  now = new Date(),
  orgId,
  packRepository,
  queueEventRepository,
  savedQuestionRepository,
  settingsRepository,
}: GetDashboardPageDataInput): Promise<DashboardPageData> {
  const [
    documents,
    facts,
    savedQuestions,
    queueEvents,
    settingsRecord,
    packRecords,
    seedPageData,
  ] = await Promise.all([
    documentRepository.listByOrgId(orgId),
    factRepository.listByOrgId(orgId),
    savedQuestionRepository.listByOrgId(orgId),
    queueEventRepository?.listByOrgId(orgId) ?? Promise.resolve([]),
    getSettingsRecord(settingsRepository, orgId),
    listPackRecordsForOrg({
      documentRepository,
      factRepository,
      orgId,
      packRepository,
    }),
    getDashboardSeedPageData(dashboardSurfaceRepository, orgId),
  ]);

  const organizationName = settingsRecord.organization.name || DEFAULT_WORKSPACE.name;
  const resolvedQueueItemIds = new Set(queueEvents.map((queueEvent) => queueEvent.itemId));
  const dashboardFilters = buildDashboardFilters({
    documents,
    locale,
    organizationName,
    values: filters,
  });

  if (documents.length === 0 && !hasActiveDashboardFilters(filters)) {
    return {
      ...seedPageData,
      filterSummary: seedPageData.filterSummary,
      filters: dashboardFilters,
      queueItems: filterResolvedQueueItems(seedPageData.queueItems, resolvedQueueItemIds),
    };
  }

  const timeframeDocuments = filterDashboardDocuments(
    documents,
    {
      ...dashboardDefaultFilterValues,
      dateRange: filters.dateRange,
    },
    now,
  );
  const timeframeFacts = filterDashboardFacts(facts, timeframeDocuments);
  const filteredDocuments = filterDashboardDocuments(documents, filters, now);
  const filteredFacts = filterDashboardFacts(facts, filteredDocuments);
  const metrics = buildDashboardMetrics({
    documents: timeframeDocuments,
    facts: timeframeFacts,
  });
  const queueItems = filterResolvedQueueItems(
    buildQueueItems(filteredDocuments),
    resolvedQueueItemIds,
  );
  const recentActivity = buildRecentActivity({
    documents: filteredDocuments,
    hasActiveFilters: hasActiveDashboardFilters(filters),
    savedQuestions,
  });
  const extractedCount = filteredDocuments.filter(
    (document) => document.status === "extracted",
  ).length;
  const reviewCount = filteredDocuments.filter(
    (document) =>
      document.status === "parsed" || document.status === "classified",
  ).length;
  const latestPack = hasScopedDashboardFilters(filters) ? undefined : packRecords[0];

  return {
    businessSummary: buildBusinessSummary({
      extractedCount,
      factsCount: filteredFacts.length,
      hasScopedFilters: hasScopedDashboardFilters(filters),
      latestPack,
      organizationName,
      reviewCount,
      seedPageData,
      totalDocumentCount: documents.length,
      visibleDocumentCount: filteredDocuments.length,
    }),
    filterSummary: buildFilterSummary({
      filters,
      locale,
      organizationName,
      visibleDocumentCount: filteredDocuments.length,
    }),
    filters: dashboardFilters,
    labels: seedPageData.labels,
    metrics,
    queueItems,
    recentActivity,
    scopedContent: buildScopedContentPreview({
      documents: filteredDocuments,
      filters,
      locale,
    }),
    signals: buildSignalsFromWorkspaceData({
      documents: filteredDocuments,
      facts: filteredFacts,
    }),
  };
}

function filterResolvedQueueItems(
  queueItems: readonly DashboardQueueItem[],
  resolvedQueueItemIds: ReadonlySet<string>,
) {
  return queueItems.filter((queueItem) => !resolvedQueueItemIds.has(queueItem.id));
}

function buildDashboardMetrics(input: Readonly<{
  documents: readonly DocumentRecord[];
  facts: Awaited<ReturnType<FactRepository["listByOrgId"]>>;
}>): readonly DashboardMetric[] {
  const { documents, facts } = input;
  const failedCount = documents.filter((document) => document.status === "failed").length;
  const extractedCount = documents.filter(
    (document) => document.status === "extracted",
  ).length;
  const reviewCount = documents.filter(
    (document) =>
      document.status === "parsed" || document.status === "classified",
  ).length;
  const averageConfidenceScore = getAverageConfidenceScore(documents, facts);
  const latestDocumentTimestamp = documents
    .slice()
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]?.updatedAt;
  const parseSuccessRate =
    documents.length === 0
      ? "--"
      : `${Math.round(((documents.length - failedCount) / documents.length) * 100)}%`;

  return [
    {
      detail:
        documents.length === 0
          ? "No matching documents in the current dashboard scope."
          : `${documents.filter((document) => document.source === "email").length} email, ${documents.filter((document) => document.source === "api").length} API, ${documents.filter((document) => document.source === "upload").length} manual uploads.`,
      label: "Files received",
      tone: documents.length === 0 ? "neutral" : "info",
      trend: "Documents in current scope",
      value: String(documents.length),
    },
    {
      detail:
        failedCount === 0
          ? "No failed documents in the current scope."
          : `${failedCount} failed document${failedCount === 1 ? "" : "s"} need follow-up.`,
      label: "Parse success",
      tone:
        documents.length === 0
          ? "neutral"
          : failedCount > 0
            ? "warning"
            : "success",
      trend: "Across the current filter set",
      value: parseSuccessRate,
    },
    {
      detail:
        facts.length === 0
          ? "No extracted facts are attached to matching documents yet."
          : `${facts.length} cited fact${facts.length === 1 ? "" : "s"} support the visible records.`,
      label: "Average confidence",
      tone:
        documents.length === 0 && facts.length === 0
          ? "neutral"
          : averageConfidenceScore >= 0.85
            ? "success"
            : "warning",
      trend: "Classification and extraction confidence",
      value:
        documents.length === 0 && facts.length === 0
          ? "--"
          : averageConfidenceScore.toFixed(2),
    },
    {
      detail:
        reviewCount === 0
          ? "Nothing is waiting on operator review in this scope."
          : "Parsed or classified documents are waiting on human follow-up.",
      label: "Awaiting review",
      tone: reviewCount > 0 ? "warning" : "success",
      trend: "Operator queue volume",
      value: String(reviewCount),
    },
    {
      detail:
        extractedCount === 0
          ? "No pack-ready documents in the current filter set."
          : "Documents are ready for explorer, packs, and downstream use.",
      label: "Extracted docs",
      tone: extractedCount > 0 ? "success" : "neutral",
      trend: "Ready for downstream use",
      value: String(extractedCount),
    },
    {
      detail:
        failedCount === 0
          ? "The current scope is clear of blocking parse failures."
          : "These failures are blocking downstream extraction and review.",
      label: "Critical failures",
      tone: failedCount > 0 ? "danger" : "success",
      trend: "Blocked documents in scope",
      value: String(failedCount),
    },
    {
      detail:
        facts.length === 0
          ? "Ask and recommendations do not have cited facts in this scope yet."
          : "Canonical facts are available for Ask and recommendation workflows.",
      label: "In-scope facts",
      tone: facts.length > 0 ? "info" : "neutral",
      trend: "Cited facts available",
      value: String(facts.length),
    },
    {
      detail: latestDocumentTimestamp
        ? formatTimestampLabel(latestDocumentTimestamp)
        : "No matching document activity yet.",
      label: "Last update",
      tone: latestDocumentTimestamp ? "info" : "neutral",
      trend: "Most recent document activity",
      value: latestDocumentTimestamp ? "Live" : "--",
    },
  ];
}

function getAverageConfidenceScore(
  documents: readonly DocumentRecord[],
  facts: Awaited<ReturnType<FactRepository["listByOrgId"]>>,
) {
  const confidenceScores = [
    ...documents
      .map((document) => document.classificationConfidenceScore)
      .filter((score): score is number => score !== undefined),
    ...facts.map((fact) => fact.confidenceScore),
  ];

  if (confidenceScores.length === 0) {
    return 0;
  }

  return (
    confidenceScores.reduce((total, score) => total + score, 0) /
    confidenceScores.length
  );
}

function buildQueueItems(documents: readonly DocumentRecord[]) {
  const failedDocuments = documents
    .filter((document) => document.status === "failed")
    .slice(0, 2);
  const reviewDocuments = documents
    .filter(
      (document) =>
        document.status === "parsed" || document.status === "classified",
    )
    .slice(0, 2);

  const items: DashboardQueueItem[] = [];

  if (failedDocuments.length > 0) {
    items.push({
      id: "failed-documents",
      actions: ["Inspect files", "Dismiss"],
      context: `${failedDocuments.map((document) => document.fileName).join(", ")} are blocked before downstream use.`,
      priority: "danger",
      priorityLabel: "High",
      title: `${failedDocuments.length} document${failedDocuments.length === 1 ? "" : "s"} failed during the current dashboard scope.`,
      typeLabel: "Parse failure",
    });
  }

  if (reviewDocuments.length > 0) {
    items.push({
      id: "review-documents",
      actions: ["Open explorer", "Skip"],
      context: `${reviewDocuments.map((document) => document.fileName).join(", ")} need approval before extraction or broader use.`,
      priority: "warning",
      priorityLabel: "Review",
      title: `${reviewDocuments.length} document${reviewDocuments.length === 1 ? "" : "s"} ${reviewDocuments.length === 1 ? "is" : "are"} waiting for human review.`,
      typeLabel: "Operator queue",
    });
  }

  return items;
}

function buildRecentActivity(input: Readonly<{
  documents: readonly DocumentRecord[];
  hasActiveFilters: boolean;
  savedQuestions: Awaited<ReturnType<SavedQuestionRepository["listByOrgId"]>>;
}>): DashboardPageData["recentActivity"] {
  const recentDocuments = input.documents
    .slice()
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 5);

  const recentItems =
    recentDocuments.length > 0
      ? recentDocuments.map((document) => buildActivityItem(document))
      : [buildEmptyActivityItem(input.hasActiveFilters)];

  return [
    {
      id: "recent",
      title: "Recent activity",
      items: recentItems,
    },
    {
      id: "workspace",
      title: "Workspace context",
      items: [
        {
          id: "saved-questions",
          actionLabel:
            input.savedQuestions.length > 0 ? "Open Ask" : undefined,
          detail: `${input.savedQuestions.length} saved question${input.savedQuestions.length === 1 ? "" : "s"} in this workspace.`,
          label: "Ask",
          time: "Live",
          title: "Saved question history is available for replay.",
          tone: "accent",
        },
      ],
    },
  ];
}

function buildEmptyActivityItem(
  hasActiveFilters: boolean,
): DashboardActivityItem {
  return {
    detail: hasActiveFilters
      ? "No documents matched the current date, source, document type, and status filters."
      : "Upload CSV or XLSX files to start the dashboard feed.",
    id: "dashboard-activity-empty",
    label: "Dashboard",
    time: hasActiveFilters ? "Filtered" : "Waiting",
    title: hasActiveFilters
      ? "No activity is currently in scope."
      : "No document activity yet.",
    tone: "info",
  };
}

function buildBusinessSummary(input: Readonly<{
  extractedCount: number;
  factsCount: number;
  hasScopedFilters: boolean;
  latestPack:
    | Awaited<ReturnType<typeof listPackRecordsForOrg>>[number]
    | undefined;
  organizationName: string;
  reviewCount: number;
  seedPageData: DashboardPageData;
  totalDocumentCount: number;
  visibleDocumentCount: number;
}>): DashboardPageData["businessSummary"] {
  if (input.latestPack !== undefined) {
    return {
      actionLabel: input.seedPageData.businessSummary.actionLabel,
      description: `${input.latestPack.meta.join(" | ")}.`,
      title: input.latestPack.title,
    };
  }

  if (input.hasScopedFilters && input.visibleDocumentCount === 0) {
    return {
      actionLabel:
        input.totalDocumentCount > 0
          ? "Open explorer"
          : input.seedPageData.labels.actions.primary,
      description:
        input.totalDocumentCount > 0
          ? "No documents matched the current date, source, document type, and status filters."
          : "Upload CSV or XLSX files to populate the dashboard and start generating operator and business signals.",
      title:
        input.totalDocumentCount > 0
          ? "No matching dashboard records"
          : `${input.organizationName} dashboard is waiting for its first upload`,
    };
  }

  if (input.hasScopedFilters) {
    return {
      actionLabel: "Open explorer",
      description: `${input.visibleDocumentCount} document${input.visibleDocumentCount === 1 ? "" : "s"}, ${input.factsCount} fact${input.factsCount === 1 ? "" : "s"}, and ${input.reviewCount} review item${input.reviewCount === 1 ? "" : "s"} are currently in scope.`,
      title: `${input.organizationName} filtered dashboard snapshot`,
    };
  }

  return {
    actionLabel: input.seedPageData.labels.actions.secondary,
    description: `${input.extractedCount} extracted documents and ${input.factsCount} facts are available for this workspace.`,
    title: `${input.organizationName} weekly cash and margin summary`,
  };
}

function buildFilterSummary(input: Readonly<{
  filters: DashboardFilterValues;
  locale: string;
  organizationName: string;
  visibleDocumentCount: number;
}>): DashboardPageData["filterSummary"] {
  const globalScopeLabel = `KPI strip covers ${input.organizationName} over ${getDashboardDateRangeScopeLabel(input.filters.dateRange, input.locale)}.`;

  if (!hasScopedDashboardFilters(input.filters)) {
    return {
      globalScopeLabel,
      scopedResultsLabel:
        "Activity, queue, and signals show all document activity in that window.",
    };
  }

  return {
    globalScopeLabel,
    scopedResultsLabel: `Activity, queue, and signals are narrowed to ${buildScopedFilterLabel(input.filters, input.locale)}. ${input.visibleDocumentCount} matching document${input.visibleDocumentCount === 1 ? "" : "s"} in scope.`,
  };
}

function buildScopedFilterLabel(filters: DashboardFilterValues, locale: string) {
  const scopeLabels = [
    filters.source !== dashboardDefaultFilterValues.source
      ? getDashboardSourceLabel(filters.source, locale)
      : null,
    filters.documentType !== dashboardDefaultFilterValues.documentType
      ? getDashboardDocumentTypeLabel(filters.documentType, locale).toLowerCase()
      : null,
    filters.status !== dashboardDefaultFilterValues.status
      ? getDashboardStatusLabel(filters.status, locale).toLowerCase()
      : null,
  ].filter((value): value is string => value !== null);

  if (scopeLabels.length === 0) {
    return "all documents";
  }

  if (scopeLabels.length === 1) {
    return scopeLabels[0];
  }

  if (scopeLabels.length === 2) {
    return `${scopeLabels[0]} and ${scopeLabels[1]}`;
  }

  return `${scopeLabels[0]}, ${scopeLabels[1]}, and ${scopeLabels[2]}`;
}

function buildScopedContentPreview(input: Readonly<{
  documents: readonly DocumentRecord[];
  filters: DashboardFilterValues;
  locale: string;
}>): DashboardPageData["scopedContent"] {
  if (!hasScopedDashboardFilters(input.filters)) {
    return null;
  }

  if (input.documents.length === 0) {
    return {
      description:
        "No matching records are currently driving the filtered activity, queue, and signals below.",
      items: [],
      title: "Scoped records",
    };
  }

  return {
    description:
      "These matching records are driving the filtered activity, queue, and signal sections below.",
    items: input.documents
      .slice()
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, 3)
      .map((document) => ({
        id: document.id,
        meta: [
          getDashboardSourceLabel(document.source, input.locale),
          getDocumentTypeDisplayLabel(document, input.locale),
          getDashboardStatusLabel(
            mapDocumentStatusToDashboardStatus(document.status),
            input.locale,
          ),
          formatTimestampLabel(document.updatedAt),
        ].join(" | "),
        title: document.fileName,
      })),
    title: "Scoped records",
  };
}

function mapDocumentStatusToDashboardStatus(
  status: DocumentRecord["status"],
): DashboardFilterValues["status"] {
  if (status === "parsed" || status === "classified") {
    return "needs-review";
  }

  if (status === "uploaded" || status === "stored") {
    return "uploaded";
  }

  return status;
}

function getDocumentTypeDisplayLabel(document: DocumentRecord, locale: string) {
  if (document.suggestedDocumentFamily === undefined) {
    return "Document";
  }

  return getDashboardDocumentTypeLabel(document.suggestedDocumentFamily, locale);
}

function getDashboardDateRangeScopeLabel(
  dateRange: DashboardFilterValues["dateRange"],
  locale: string,
) {
  if (dateRange === "all") {
    return "all time";
  }

  return `the ${getDashboardDateRangeLabel(dateRange, locale).toLowerCase()}`;
}

function buildActivityItem(document: DocumentRecord): DashboardActivityItem {
  const documentFamilyLabel = document.suggestedDocumentFamily ?? "document";
  const tone =
    document.status === "failed"
      ? "danger"
      : document.status === "extracted"
        ? "accent"
        : document.status === "parsed" || document.status === "classified"
          ? "warning"
          : "info";

  return {
    id: document.id,
    actionLabel:
      document.status === "failed"
        ? "Inspect"
        : document.status === "extracted"
          ? "Open explorer"
          : "Review",
    detail: `${document.fileName} from ${document.source} is currently ${document.status}.`,
    label:
      document.status === "failed"
        ? "Failure"
        : document.status === "extracted"
          ? "Ready"
          : "In progress",
    time: formatTimestampLabel(document.updatedAt),
    title: `${documentFamilyLabel} moved to ${document.status}.`,
    tone,
  };
}

function formatTimestampLabel(isoTimestamp: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(new Date(isoTimestamp));
}
