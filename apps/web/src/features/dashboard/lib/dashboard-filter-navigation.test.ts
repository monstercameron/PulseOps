import { describe, expect, it } from "vitest";

import {
  applyDashboardFilterControlChange,
  buildDashboardFilterUrl,
} from "@/features/dashboard/lib/dashboard-filter-navigation";
import { dashboardDefaultFilterValues } from "@/features/dashboard/lib/dashboard-filters";

describe("dashboard-filter-navigation", () => {
  it("builds a filter URL with only non-default dashboard params while preserving unrelated params", () => {
    expect(
      buildDashboardFilterUrl({
        nextValues: {
          ...dashboardDefaultFilterValues,
          source: "email",
          status: "failed",
        },
        pathname: "/dashboard",
        searchParams: "tab=operations&source=all",
      }),
    ).toBe("/dashboard?tab=operations&source=email&status=failed");
  });

  it("removes dashboard query params when filters are reset to defaults", () => {
    expect(
      buildDashboardFilterUrl({
        nextValues: dashboardDefaultFilterValues,
        pathname: "/dashboard",
        searchParams:
          "dateRange=30d&source=email&documentType=customer-invoice&status=failed&tab=business",
      }),
    ).toBe("/dashboard?tab=business");
  });

  it("updates only the selected control value", () => {
    const selectedValues = {
      dateRange: "30d",
      documentType: "all",
      source: "email",
      status: "all",
    } as const;

    expect(
      applyDashboardFilterControlChange({
        controlId: "documentType",
        selectedValues,
        value: "customer-invoice",
      }),
    ).toEqual({
      dateRange: "30d",
      documentType: "customer-invoice",
      source: "email",
      status: "all",
    });
  });
});
