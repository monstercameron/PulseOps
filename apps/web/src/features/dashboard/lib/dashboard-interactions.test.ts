import { describe, expect, it } from "vitest";

import { createDefaultDashboardSurfaceRecord } from "@/features/dashboard/domain/dashboard-surface-record";
import { resolveDashboardQueueAction } from "@/features/dashboard/lib/dashboard-interactions";

const fallbackDashboardPageData =
  createDefaultDashboardSurfaceRecord("org_123").pageData;

describe("resolveDashboardQueueAction", () => {
  it("dismisses the matching queue item and prepends a queue activity entry", () => {
    const item = fallbackDashboardPageData.queueItems[1];

    const result = resolveDashboardQueueAction({
      action: "Dismiss",
      item,
      queueItems: fallbackDashboardPageData.queueItems,
      recentActivity: fallbackDashboardPageData.recentActivity,
    });

    expect(result).not.toBeNull();
    expect(result?.nextQueueItems).toHaveLength(
      fallbackDashboardPageData.queueItems.length - 1,
    );
    expect(
      result?.nextQueueItems.find((queueItem) => queueItem.id === item.id),
    ).toBeUndefined();
    expect(result?.nextRecentActivity[0]?.id).toBe("today");
    expect(result?.nextRecentActivity[0]?.items[0]).toMatchObject({
      detail: "Dismissed from blocked import in the operator queue.",
      label: "Queue",
      time: "Just now",
      title: "Blocked import dismissed.",
      tone: "info",
    });
  });

  it("creates a today section when one does not exist", () => {
    const item = fallbackDashboardPageData.queueItems[0];

    const result = resolveDashboardQueueAction({
      action: "Merge",
      item,
      queueItems: fallbackDashboardPageData.queueItems,
      recentActivity: fallbackDashboardPageData.recentActivity.filter(
        (section) => section.id !== "today",
      ),
    });

    expect(result).not.toBeNull();
    expect(result?.nextRecentActivity[0]).toMatchObject({
      id: "today",
      title: "Today",
    });
    expect(result?.nextRecentActivity[0]?.items[0]).toMatchObject({
      title: "Possible duplicate vendor approved for merge.",
      tone: "accent",
    });
  });

  it("returns null for non-resolvable actions", () => {
    const item = fallbackDashboardPageData.queueItems[1];

    expect(
      resolveDashboardQueueAction({
        action: "Inspect files",
        item,
        queueItems: fallbackDashboardPageData.queueItems,
        recentActivity: fallbackDashboardPageData.recentActivity,
      }),
    ).toBeNull();
  });
});
