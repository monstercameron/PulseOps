import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createOrganizationAccount } from "@/features/accounts/domain/organization-account";
import { createLocalAccountRepository } from "@/features/accounts/repositories/local-account-repository";
import { verifyPassword } from "@/features/auth/domain/password-credential";
import { buildAuthSessionFromAccount } from "@/features/auth/server/current-app-actor";
import { handleTeamAccountUpdateRequest } from "@/features/settings/server/handle-team-account-update-request";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("handleTeamAccountUpdateRequest", () => {
  it("lets an admin update another account's identity, password, role, and access", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-account-update-admin-"),
    );
    temporaryDirectories.push(rootDirectory);

    const accountRepository = createLocalAccountRepository({ rootDirectory });
    const adminAccount = await accountRepository.put(
      createOrganizationAccount({
        createdAt: "2026-04-10T00:00:00.000Z",
        email: "admin@example.com",
        name: "Admin User",
        orgId: "org_123",
        role: "admin",
        status: "active",
        userId: "user_admin",
      }),
    );
    const supportAccount = await accountRepository.put(
      createOrganizationAccount({
        createdAt: "2026-04-10T00:30:00.000Z",
        email: "support@example.com",
        name: "Support User",
        orgId: "org_123",
        passwordHash: "scrypt$legacy$hash",
        role: "operator",
        status: "invited",
        userId: "user_support",
      }),
    );

    const response = await handleTeamAccountUpdateRequest(
      new Request("http://localhost/api/settings/team/accounts/member_support", {
        body: JSON.stringify({
          account: {
            email: "support.updated@example.com",
            name: "Support Lead",
            operationsAccess: false,
            password: "new-password",
            reportAccess: true,
            role: "analyst",
            setupAccess: false,
            status: "active",
          },
          orgId: "org_123",
        }),
        method: "PATCH",
      }),
      {
        accountRepository,
        currentActor: {
          account: adminAccount,
          session: buildAuthSessionFromAccount(adminAccount),
          source: "token",
        },
        memberId: supportAccount.id,
        now: () => "2026-04-10T03:00:00.000Z",
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      currentUser: expect.objectContaining({
        email: "admin@example.com",
      }),
      team: {
        members: expect.arrayContaining([
          expect.objectContaining({
            accessSummary: "Reports",
            email: "support.updated@example.com",
            role: "Analyst",
            status: "active",
          }),
        ]),
      },
    });

    const updatedAccount = await accountRepository.getByOrgIdAndEmail(
      "org_123",
      "support.updated@example.com",
    );

    expect(updatedAccount).toMatchObject({
      email: "support.updated@example.com",
      name: "Support Lead",
      operationsAccess: false,
      reportAccess: true,
      role: "analyst",
      setupAccess: false,
      status: "active",
      userId: "user_support",
    });
    expect(updatedAccount?.passwordHash).toBeDefined();
    expect(
      verifyPassword("new-password", updatedAccount?.passwordHash ?? ""),
    ).toBe(true);
    await expect(
      accountRepository.getByOrgIdAndEmail("org_123", "support@example.com"),
    ).resolves.toBeNull();
  });

  it("allows self-service email and password updates without authorization changes", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-account-update-self-"),
    );
    temporaryDirectories.push(rootDirectory);

    const accountRepository = createLocalAccountRepository({ rootDirectory });
    const operatorAccount = await accountRepository.put(
      createOrganizationAccount({
        email: "support@example.com",
        name: "Support User",
        operationsAccess: true,
        orgId: "org_123",
        passwordHash: "scrypt$legacy$hash",
        reportAccess: false,
        role: "operator",
        setupAccess: true,
        status: "active",
        userId: "user_support",
      }),
    );

    const response = await handleTeamAccountUpdateRequest(
      new Request("http://localhost/api/settings/team/accounts/member_support", {
        body: JSON.stringify({
          account: {
            email: "support.lead@example.com",
            name: "Support Lead",
            password: "password2",
          },
          orgId: "org_123",
        }),
        method: "PATCH",
      }),
      {
        accountRepository,
        currentActor: {
          account: operatorAccount,
          session: buildAuthSessionFromAccount(operatorAccount),
          source: "token",
        },
        memberId: operatorAccount.id,
        now: () => "2026-04-10T04:00:00.000Z",
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      currentUser: expect.objectContaining({
        email: "support.lead@example.com",
        role: "Operator",
      }),
      team: {
        members: expect.arrayContaining([
          expect.objectContaining({
            canEditAuthorization: false,
            email: "support.lead@example.com",
            isCurrentUser: true,
            role: "Operator",
          }),
        ]),
      },
    });

    const updatedAccount = await accountRepository.getByOrgIdAndEmail(
      "org_123",
      "support.lead@example.com",
    );

    expect(updatedAccount).toMatchObject({
      email: "support.lead@example.com",
      name: "Support Lead",
      operationsAccess: true,
      reportAccess: false,
      role: "operator",
      setupAccess: true,
      status: "active",
      userId: "user_support",
    });
    expect(
      verifyPassword("password2", updatedAccount?.passwordHash ?? ""),
    ).toBe(true);
  });

  it("rejects self-service role or access changes", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-account-update-self-authz-"),
    );
    temporaryDirectories.push(rootDirectory);

    const accountRepository = createLocalAccountRepository({ rootDirectory });
    const adminAccount = await accountRepository.put(
      createOrganizationAccount({
        email: "admin@example.com",
        name: "Admin User",
        orgId: "org_123",
        role: "admin",
        status: "active",
        userId: "user_admin",
      }),
    );

    const response = await handleTeamAccountUpdateRequest(
      new Request("http://localhost/api/settings/team/accounts/member_admin", {
        body: JSON.stringify({
          account: {
            email: "admin@example.com",
            name: "Admin User",
            role: "viewer",
          },
          orgId: "org_123",
        }),
        method: "PATCH",
      }),
      {
        accountRepository,
        currentActor: {
          account: adminAccount,
          session: buildAuthSessionFromAccount(adminAccount),
          source: "token",
        },
        memberId: adminAccount.id,
      },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: "Use another admin account to change your own role or access.",
    });
    await expect(
      accountRepository.getByOrgIdAndEmail("org_123", "admin@example.com"),
    ).resolves.toMatchObject({
      role: "admin",
    });
  });

  it("rejects account edits from non-admin actors targeting other users", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-account-update-forbidden-"),
    );
    temporaryDirectories.push(rootDirectory);

    const accountRepository = createLocalAccountRepository({ rootDirectory });
    const adminAccount = await accountRepository.put(
      createOrganizationAccount({
        email: "admin@example.com",
        name: "Admin User",
        orgId: "org_123",
        role: "admin",
        status: "active",
        userId: "user_admin",
      }),
    );
    const operatorAccount = await accountRepository.put(
      createOrganizationAccount({
        email: "support@example.com",
        name: "Support User",
        orgId: "org_123",
        role: "operator",
        status: "active",
        userId: "user_support",
      }),
    );

    const response = await handleTeamAccountUpdateRequest(
      new Request("http://localhost/api/settings/team/accounts/member_admin", {
        body: JSON.stringify({
          account: {
            email: "admin.updated@example.com",
            name: "Admin Updated",
          },
          orgId: "org_123",
        }),
        method: "PATCH",
      }),
      {
        accountRepository,
        currentActor: {
          account: operatorAccount,
          session: buildAuthSessionFromAccount(operatorAccount),
          source: "token",
        },
        memberId: adminAccount.id,
      },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: "You do not have access to update this account.",
    });
  });
});
