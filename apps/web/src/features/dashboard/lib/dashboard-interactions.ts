import type {
  DashboardActivityItem,
  DashboardPageData,
  DashboardQueueItem,
} from "@/features/dashboard/constants/dashboard-page-content";

type DashboardActivitySection = DashboardPageData["recentActivity"][number];

type DashboardQueueActionResult = Readonly<{
  nextQueueItems: readonly DashboardQueueItem[];
  nextRecentActivity: readonly DashboardActivitySection[];
}> | null;

type QueueActionConfig = Readonly<{
  detail: (item: DashboardQueueItem) => string;
  label: string;
  title: (item: DashboardQueueItem) => string;
  tone: DashboardActivityItem["tone"];
}>;

const queueResolutionConfigs: Readonly<Record<string, QueueActionConfig>> = {
  Approve: {
    detail: (item) => `Resolved from ${item.typeLabel.toLowerCase()} in the operator queue.`,
    label: "Queue",
    title: (item) => `${item.typeLabel} approved.`,
    tone: "accent",
  },
  Dismiss: {
    detail: (item) => `Dismissed from ${item.typeLabel.toLowerCase()} in the operator queue.`,
    label: "Queue",
    title: (item) => `${item.typeLabel} dismissed.`,
    tone: "info",
  },
  Discard: {
    detail: (item) => `Discarded from ${item.typeLabel.toLowerCase()} in the operator queue.`,
    label: "Queue",
    title: (item) => `${item.typeLabel} discarded.`,
    tone: "warning",
  },
  "Invoice date": {
    detail: () => "Revenue timing will use invoice date going forward for this packet.",
    label: "Queue",
    title: () => "Primary event date set to invoice date.",
    tone: "accent",
  },
  "Keep separate": {
    detail: () => "The vendor records will remain separate in the canonical model.",
    label: "Queue",
    title: () => "Possible duplicate vendor kept separate.",
    tone: "info",
  },
  Merge: {
    detail: () => "The duplicate vendor records will be merged in the canonical model.",
    label: "Queue",
    title: () => "Possible duplicate vendor approved for merge.",
    tone: "accent",
  },
  Skip: {
    detail: (item) => `Skipped from ${item.typeLabel.toLowerCase()} in the operator queue.`,
    label: "Queue",
    title: (item) => `${item.typeLabel} skipped.`,
    tone: "info",
  },
  "Service date": {
    detail: () => "Revenue timing will use service date going forward for this packet.",
    label: "Queue",
    title: () => "Primary event date set to service date.",
    tone: "accent",
  },
};

export function canResolveDashboardQueueAction(action: string) {
  return action in queueResolutionConfigs;
}

export function resolveDashboardQueueAction(input: Readonly<{
  action: string;
  item: DashboardQueueItem;
  queueItems: readonly DashboardQueueItem[];
  recentActivity: readonly DashboardActivitySection[];
}>): DashboardQueueActionResult {
  const config = queueResolutionConfigs[input.action];

  if (config === undefined) {
    return null;
  }

  const nextQueueItems = input.queueItems.filter((queueItem) => queueItem.id !== input.item.id);
  const resolutionActivity: DashboardActivityItem = {
    detail: config.detail(input.item),
    id: `dashboard-action-${input.item.id}-${normalizeActionId(input.action)}`,
    label: config.label,
    time: "Just now",
    title: config.title(input.item),
    tone: config.tone,
  };

  return {
    nextQueueItems,
    nextRecentActivity: prependDashboardActivity(input.recentActivity, resolutionActivity),
  };
}

function prependDashboardActivity(
  recentActivity: readonly DashboardActivitySection[],
  item: DashboardActivityItem,
): readonly DashboardActivitySection[] {
  const todaySectionIndex = recentActivity.findIndex((section) => section.id === "today");

  if (todaySectionIndex === -1) {
    return [
      {
        id: "today",
        items: [item],
        title: "Today",
      },
      ...recentActivity,
    ];
  }

  return recentActivity.map((section, index) =>
    index === todaySectionIndex
      ? {
          ...section,
          items: [item, ...section.items],
        }
      : section,
  );
}

function normalizeActionId(action: string) {
  return action.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
