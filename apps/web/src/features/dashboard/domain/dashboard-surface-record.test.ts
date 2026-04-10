import { describe, expect, it } from "vitest";

import {
  createDefaultDashboardSurfaceRecord,
  dashboardSurfaceRecordSchema,
} from "@/features/dashboard/domain/dashboard-surface-record";

describe("dashboard-surface-record", () => {
  it("creates default dashboard seed data with typed filter controls", () => {
    const record = createDefaultDashboardSurfaceRecord("org_123");

    expect(record.pageData.filterSummary).toEqual({
      globalScopeLabel:
        "Top metrics cover Broward HVAC Co. over the last 7 days.",
      scopedResultsLabel:
        "The sections below include all document work in that window.",
    });
    expect(record.pageData.filters).toMatchObject({
      controls: expect.arrayContaining([
        expect.objectContaining({
          id: "dateRange",
          label: "Last 7 days",
          selectedValue: "7d",
        }),
        expect.objectContaining({
          id: "source",
          label: "All sources",
          selectedValue: "all",
        }),
      ]),
      workspaceLabel: "Broward HVAC Co.",
    });
  });

  it("normalizes legacy string filter arrays into dashboard filter controls", () => {
    const parsedRecord = dashboardSurfaceRecordSchema.parse({
      id: "dashboard-surface-org_123",
      orgId: "org_123",
      pageData: {
        businessSummary: {
          actionLabel: "Open this week's brief",
          description: "Legacy seeded summary.",
          title: "Legacy brief",
        },
        filters: [
          "Broward HVAC Co.",
          "All time",
          "Connected API",
          "Customer invoice",
          "Failed",
        ],
        labels: {
          actions: {
            primary: "Upload files",
            secondary: "Open weekly brief",
          },
          breadcrumbs: ["App", "Dashboard"],
          businessSummaryEyebrow: "Weekly brief",
          description: "Legacy dashboard description.",
          queueCountSuffix: "active",
          queueTitle: "Operator queue",
          signalsTitle: "Business signals",
          title: "Dashboard",
          views: {
            business: "Business view",
            operations: "Operations view",
          },
        },
        metrics: [],
        queueItems: [],
        recentActivity: [],
        signals: [],
      },
      updatedAt: "2026-04-09T12:00:00.000Z",
      version: "dashboard-surface-record.v1",
    });

    expect(parsedRecord.pageData.filterSummary).toEqual({
      globalScopeLabel:
        "Top metrics cover Broward HVAC Co. over the last 7 days.",
      scopedResultsLabel:
        "The sections below include all document work in that window.",
    });
    expect(parsedRecord.pageData.filters).toMatchObject({
      controls: expect.arrayContaining([
        expect.objectContaining({
          id: "dateRange",
          label: "All time",
          selectedValue: "all",
        }),
        expect.objectContaining({
          id: "source",
          label: "Connected API",
          selectedValue: "api",
        }),
        expect.objectContaining({
          id: "documentType",
          label: "Customer invoice",
          selectedValue: "customer-invoice",
        }),
        expect.objectContaining({
          id: "status",
          label: "Failed",
          selectedValue: "failed",
        }),
      ]),
      workspaceLabel: "Broward HVAC Co.",
    });
  });
});
