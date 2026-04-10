import { describe, expect, it } from "vitest";

import { canAccessOrgResource } from "@/features/security/domain/access-control";

describe("access control", () => {
  it("enforces org boundaries and role permissions", () => {
    expect(
      canAccessOrgResource({
        actorOrgId: "org_123",
        actorRole: "operator",
        permission: "approve",
        resourceOrgId: "org_123",
      }),
    ).toBe(true);
    expect(
      canAccessOrgResource({
        actorOrgId: "org_123",
        actorRole: "viewer",
        permission: "write",
        resourceOrgId: "org_123",
      }),
    ).toBe(false);
    expect(
      canAccessOrgResource({
        actorOrgId: "org_123",
        actorRole: "owner",
        permission: "read",
        resourceOrgId: "org_999",
      }),
    ).toBe(false);
  });
});
