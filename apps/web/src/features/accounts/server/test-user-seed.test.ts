import { describe, expect, it } from "vitest";

import {
  TEST_USER_PASSWORD,
  getDefaultOrganizationSeed,
  getTestUserSeedRows,
  getTestUserSeeds,
} from "@/features/accounts/server/test-user-seed";

describe("test user seed", () => {
  it("defines the default organization seed for the workspace", () => {
    expect(getDefaultOrganizationSeed("org_seed")).toMatchObject({
      id: "org_seed",
      name: "Broward HVAC Co.",
      status: "active",
    });
  });

  it("defines the requested admin and support seed users", () => {
    expect(TEST_USER_PASSWORD).toBe("password");
    expect(getTestUserSeeds("org_seed")).toEqual([
      expect.objectContaining({
        email: "admin@example.com",
        orgId: "org_seed",
        reportAccess: true,
        role: "admin",
      }),
      expect.objectContaining({
        email: "support@example.com",
        orgId: "org_seed",
        reportAccess: false,
        role: "operator",
      }),
    ]);
    expect(getTestUserSeedRows("org_seed")).toEqual([
      {
        email: "admin@example.com",
        orgId: "org_seed",
        role: "admin",
        status: "active",
      },
      {
        email: "support@example.com",
        orgId: "org_seed",
        role: "operator",
        status: "active",
      },
    ]);
  });
});
