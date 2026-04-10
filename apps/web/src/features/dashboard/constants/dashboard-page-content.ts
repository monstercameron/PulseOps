export type DashboardMetric = Readonly<{
  detail: string;
  label: string;
  tone: "danger" | "info" | "neutral" | "success" | "warning";
  trend: string;
  value: string;
}>;

export type DashboardActivityItem = Readonly<{
  actionLabel?: string;
  detail: string;
  id: string;
  label: string;
  time: string;
  title: string;
  tone: "accent" | "danger" | "info" | "warning";
}>;

export type DashboardQueueItem = Readonly<{
  actions: readonly string[];
  context: string;
  id: string;
  priority: "danger" | "info" | "warning";
  priorityLabel: string;
  title: string;
  typeLabel: string;
}>;

export type DashboardSignal = Readonly<{
  detail: string;
  label: string;
  tone: "danger" | "info" | "success" | "warning";
  value: string;
}>;

export type DashboardFilterControlId =
  | "dateRange"
  | "documentType"
  | "source"
  | "status";

export type DashboardFilterOption = Readonly<{
  label: string;
  value: string;
}>;

export type DashboardFilterControl = Readonly<{
  id: DashboardFilterControlId;
  label: string;
  options: readonly DashboardFilterOption[];
  selectedValue: string;
}>;

export type DashboardFilters = Readonly<{
  controls: readonly DashboardFilterControl[];
  workspaceLabel: string;
}>;

export type DashboardPageLabels = Readonly<{
  actions: Readonly<{
    primary: string;
    secondary: string;
  }>;
  breadcrumbs: readonly string[];
  businessSummaryEyebrow: string;
  description: string;
  queueCountSuffix: string;
  queueTitle: string;
  signalsTitle: string;
  title: string;
  views: Readonly<{
    business: string;
    operations: string;
  }>;
}>;

export type DashboardPageData = Readonly<{
  businessSummary: Readonly<{
    actionLabel: string;
    description: string;
    title: string;
  }>;
  filterSummary: Readonly<{
    globalScopeLabel: string;
    scopedResultsLabel: string;
  }>;
  filters: DashboardFilters;
  labels: DashboardPageLabels;
  metrics: readonly DashboardMetric[];
  queueItems: readonly DashboardQueueItem[];
  recentActivity: readonly {
    id: string;
    items: readonly DashboardActivityItem[];
    title: string;
  }[];
  scopedContent: Readonly<{
    description: string;
    items: readonly Readonly<{
      id: string;
      meta: string;
      title: string;
    }>[];
    title: string;
  }> | null;
  signals: readonly DashboardSignal[];
}>;
