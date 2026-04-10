import { describe, expect, it } from "vitest";

import {
  canEditAccountIdentity,
  canInviteTeamMembers,
  canManageAccountAuthorization,
  canOpenAccountControls,
  canResetAccountPassword,
} from "@/features/accounts/domain/account-authorization";
import { createOrganizationAccount } from "@/features/accounts/domain/organization-account";

describe("account authorization", () => {
  const adminAccount = createOrganizationAccount({
    email: "admin@example.com",
    name: "Admin User",
    orgId: "org_123",
    role: "admin",
    status: "active",
    userId: "user_admin",
  });
  const operatorAccount = createOrganizationAccount({
    email: "support@example.com",
    name: "Support User",
    orgId: "org_123",
    role: "operator",
    status: "active",
    userId: "user_operator",
  });

  it("allows only admins to invite and manage other accounts", () => {
    expect(canInviteTeamMembers(adminAccount)).toBe(true);
    expect(canInviteTeamMembers(operatorAccount)).toBe(false);
    expect(canManageAccountAuthorization(adminAccount, operatorAccount)).toBe(true);
    expect(canManageAccountAuthorization(operatorAccount, adminAccount)).toBe(false);
    expect(canManageAccountAuthorization(adminAccount, adminAccount)).toBe(false);
  });

  it("allows self-service identity and password edits", () => {
    expect(canEditAccountIdentity(adminAccount, adminAccount)).toBe(true);
    expect(canEditAccountIdentity(operatorAccount, operatorAccount)).toBe(true);
    expect(canResetAccountPassword(operatorAccount, operatorAccount)).toBe(true);
    expect(canEditAccountIdentity(operatorAccount, adminAccount)).toBe(false);
  });

  it("opens account controls when either self-service or admin powers apply", () => {
    expect(canOpenAccountControls(adminAccount, operatorAccount)).toBe(true);
    expect(canOpenAccountControls(operatorAccount, operatorAccount)).toBe(true);
    expect(canOpenAccountControls(operatorAccount, adminAccount)).toBe(false);
  });
});
