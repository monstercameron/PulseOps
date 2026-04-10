import { describe, expect, it } from "vitest";

import {
  createOrganizationAccount,
  getDefaultOrganizationAccountAccess,
  getOrganizationAccountAccessSummary,
} from "@/features/accounts/domain/organization-account";

describe("organization account", () => {
  it("assigns default access by role", () => {
    expect(getDefaultOrganizationAccountAccess("admin")).toEqual({
      operationsAccess: true,
      reportAccess: true,
      setupAccess: true,
    });
    expect(getDefaultOrganizationAccountAccess("operator")).toEqual({
      operationsAccess: true,
      reportAccess: false,
      setupAccess: true,
    });
    expect(getDefaultOrganizationAccountAccess("analyst")).toEqual({
      operationsAccess: false,
      reportAccess: true,
      setupAccess: false,
    });
    expect(getDefaultOrganizationAccountAccess("viewer")).toEqual({
      operationsAccess: false,
      reportAccess: true,
      setupAccess: false,
    });
  });

  it("creates an org-scoped account record with generated ids", () => {
    const account = createOrganizationAccount({
      email: "admin@example.com",
      name: "Admin User",
      orgId: "org_123",
      role: "admin",
      status: "active",
    });

    expect(account.id).toMatch(/^member_/);
    expect(account.userId).toMatch(/^user_/);
    expect(account.reportAccess).toBe(true);
    expect(account.setupAccess).toBe(true);
  });

  it("summarizes access buckets for team surfaces", () => {
    const account = createOrganizationAccount({
      email: "support@example.com",
      name: "Support User",
      orgId: "org_123",
      role: "operator",
      status: "active",
    });

    expect(getOrganizationAccountAccessSummary(account)).toBe("Setup, Ops");
  });
});
