import { describe, expect, it } from "vitest";

import {
  signAuthSession,
  verifyAuthSession,
} from "@/features/auth/domain/auth-session";

describe("auth session", () => {
  it("signs and verifies org-scoped auth sessions", () => {
    const token = signAuthSession(
      {
        expiresAt: "2026-04-11T00:00:00.000Z",
        orgId: "org_123",
        role: "owner",
        userId: "user_123",
      },
      "secret-1234",
    );

    expect(
      verifyAuthSession(token, "secret-1234", "2026-04-10T00:00:00.000Z"),
    ).toMatchObject({
      orgId: "org_123",
      role: "owner",
    });
  });
});
