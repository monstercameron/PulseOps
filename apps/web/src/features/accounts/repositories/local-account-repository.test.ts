import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createOrganizationAccount } from "@/features/accounts/domain/organization-account";
import { createLocalAccountRepository } from "@/features/accounts/repositories/local-account-repository";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("createLocalAccountRepository", () => {
  it("stores and lists org-scoped accounts", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-local-accounts-"),
    );
    temporaryDirectories.push(rootDirectory);

    const repository = createLocalAccountRepository({ rootDirectory });

    await repository.put(
      createOrganizationAccount({
        email: "admin@example.com",
        name: "Admin User",
        orgId: "org_123",
        role: "admin",
        status: "active",
      }),
    );
    await repository.put(
      createOrganizationAccount({
        email: "support@example.com",
        name: "Support User",
        orgId: "org_999",
        role: "operator",
        status: "active",
      }),
    );

    await expect(repository.listByOrgId("org_123")).resolves.toEqual([
      expect.objectContaining({
        email: "admin@example.com",
        orgId: "org_123",
      }),
    ]);
  });

  it("looks up accounts by email case-insensitively and updates the same id", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-local-account-lookups-"),
    );
    temporaryDirectories.push(rootDirectory);

    const repository = createLocalAccountRepository({ rootDirectory });
    const originalAccount = createOrganizationAccount({
      email: "Admin@Example.com",
      name: "Admin User",
      orgId: "org_123",
      passwordHash: "hash-1",
      role: "admin",
      status: "active",
    });

    await repository.put(originalAccount);
    await repository.put(
      createOrganizationAccount({
        ...originalAccount,
        email: "admin@example.com",
        name: "Updated Admin User",
        passwordHash: "hash-2",
        updatedAt: "2026-04-10T03:00:00.000Z",
      }),
    );

    await expect(
      repository.getByOrgIdAndEmail("org_123", "ADMIN@example.com"),
    ).resolves.toMatchObject({
      email: "admin@example.com",
      id: originalAccount.id,
      name: "Updated Admin User",
      passwordHash: "hash-2",
    });
    await expect(
      repository.getByOrgIdAndUserId("org_123", originalAccount.userId),
    ).resolves.toMatchObject({
      email: "admin@example.com",
      userId: originalAccount.userId,
    });
  });
});
