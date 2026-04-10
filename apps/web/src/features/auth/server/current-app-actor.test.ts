import { describe, expect, it } from "vitest";

import { createOrganizationAccount } from "@/features/accounts/domain/organization-account";
import { signAuthSession } from "@/features/auth/domain/auth-session";
import {
  APP_AUTH_COOKIE_NAME,
  buildAuthSessionFromAccount,
  resolveCurrentAppActor,
} from "@/features/auth/server/current-app-actor";

describe("current app actor", () => {
  it("resolves the cookie-backed actor when the signed session is valid", async () => {
    const account = createOrganizationAccount({
      email: "support@example.com",
      name: "Support User",
      orgId: "org_123",
      role: "operator",
      status: "active",
      userId: "user_support",
    });
    const token = signAuthSession(
      {
        expiresAt: "2026-04-10T12:00:00.000Z",
        orgId: "org_123",
        role: "operator",
        userId: "user_support",
      },
      "auth-secret-1234",
    );

    const actor = await resolveCurrentAppActor({
      accountRepository: {
        async getByOrgIdAndEmail() {
          return null;
        },
        async getByOrgIdAndUserId() {
          return account;
        },
        async listByOrgId() {
          return [account];
        },
        async put(nextAccount) {
          return nextAccount;
        },
      },
      authSecret: "auth-secret-1234",
      now: "2026-04-10T11:00:00.000Z",
      orgId: "org_123",
      request: new Request("http://localhost/settings", {
        headers: {
          cookie: `${APP_AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
        },
      }),
    });

    expect(actor).toMatchObject({
      account: expect.objectContaining({
        email: "support@example.com",
      }),
      source: "token",
    });
  });

  it("falls back to the highest-priority active account when no cookie exists", async () => {
    const adminAccount = createOrganizationAccount({
      createdAt: "2026-04-10T00:00:00.000Z",
      email: "admin@example.com",
      name: "Admin User",
      orgId: "org_123",
      role: "admin",
      status: "active",
    });
    const viewerAccount = createOrganizationAccount({
      createdAt: "2026-04-10T01:00:00.000Z",
      email: "viewer@example.com",
      name: "Viewer User",
      orgId: "org_123",
      role: "viewer",
      status: "active",
    });

    const actor = await resolveCurrentAppActor({
      accountRepository: {
        async getByOrgIdAndEmail() {
          return null;
        },
        async getByOrgIdAndUserId() {
          return null;
        },
        async listByOrgId() {
          return [viewerAccount, adminAccount];
        },
        async put(nextAccount) {
          return nextAccount;
        },
      },
      authSecret: "auth-secret-1234",
      now: "2026-04-10T00:00:00.000Z",
      orgId: "org_123",
    });

    expect(actor).toMatchObject({
      account: expect.objectContaining({
        email: "admin@example.com",
      }),
      source: "fallback",
    });
  });

  it("builds auth sessions from organization accounts", () => {
    const account = createOrganizationAccount({
      email: "admin@example.com",
      name: "Admin User",
      orgId: "org_123",
      role: "admin",
      status: "active",
      userId: "user_admin",
    });

    expect(
      buildAuthSessionFromAccount(account, "2026-04-10T00:00:00.000Z"),
    ).toMatchObject({
      orgId: "org_123",
      role: "admin",
      userId: "user_admin",
    });
  });
});
