import { describe, expect, it, vi } from "vitest";
import { type Pool } from "pg";

import { createOrganizationAccount } from "@/features/accounts/domain/organization-account";
import { createPostgresAccountRepository } from "@/features/accounts/repositories/postgres-account-repository";

describe("createPostgresAccountRepository", () => {
  it("returns empty reads when the membership table is missing", async () => {
    const query = vi.fn().mockRejectedValue({ code: "42P01" });
    const repository = createPostgresAccountRepository({
      pool: { query } as unknown as Pool,
    });

    await expect(repository.listByOrgId("org_123")).resolves.toEqual([]);
    await expect(
      repository.getByOrgIdAndEmail("org_123", "owner@example.com"),
    ).resolves.toBeNull();
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("rethrows unexpected database errors", async () => {
    const query = vi.fn().mockRejectedValue(new Error("connection dropped"));
    const repository = createPostgresAccountRepository({
      pool: { query } as unknown as Pool,
    });

    await expect(repository.listByOrgId("org_123")).rejects.toThrow(
      "connection dropped",
    );
  });

  it("maps membership rows into organization account records", async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [
        {
          created_at: "2026-04-10T00:00:00.000Z",
          display_name: "Admin User",
          email: "admin@example.com",
          id: "member_123",
          operations_access: true,
          org_id: "org_123",
          password_hash: "hash-123",
          report_access: true,
          role: "admin",
          setup_access: true,
          status: "active",
          updated_at: "2026-04-10T00:00:00.000Z",
          user_id: "user_123",
        },
      ],
    });
    const repository = createPostgresAccountRepository({
      pool: { query } as unknown as Pool,
    });

    await expect(repository.listByOrgId("org_123")).resolves.toEqual([
      expect.objectContaining({
        email: "admin@example.com",
        passwordHash: "hash-123",
        role: "admin",
        userId: "user_123",
      }),
    ]);
  });

  it("upserts users and memberships in a transaction", async () => {
    const client = {
      query: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ id: "user_existing" }] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined),
      release: vi.fn(),
    };
    const pool = {
      connect: vi.fn().mockResolvedValue(client),
    } as unknown as Pool;
    const repository = createPostgresAccountRepository({ pool });

    const result = await repository.put(
      createOrganizationAccount({
        createdAt: "2026-04-10T00:00:00.000Z",
        email: "admin@example.com",
        name: "Admin User",
        orgId: "org_123",
        role: "admin",
        status: "active",
        updatedAt: "2026-04-10T01:00:00.000Z",
        userId: "user_new",
      }),
    );

    expect(client.query).toHaveBeenNthCalledWith(1, "begin");
    expect(client.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("select id"),
      ["admin@example.com"],
    );
    expect(client.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("insert into account_users"),
      expect.arrayContaining(["user_existing", "admin@example.com"]),
    );
    expect(client.query).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining("insert into organization_memberships"),
      expect.arrayContaining(["org_123", "user_existing", "admin"]),
    );
    expect(client.query).toHaveBeenNthCalledWith(5, "commit");
    expect(client.release).toHaveBeenCalledTimes(1);
    expect(result.userId).toBe("user_existing");
  });
});
