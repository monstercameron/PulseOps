import { randomUUID } from "node:crypto";

import { Client } from "pg";

import {
  TEST_USER_PASSWORD,
  getDefaultOrganizationSeed,
  getTestUserSeedRows,
  getTestUserSeeds,
} from "../apps/web/src/features/accounts/server/test-user-seed";
import { hashPassword } from "../apps/web/src/features/auth/domain/password-credential";
import { DEFAULT_WORKSPACE } from "../apps/web/src/features/foundation/domain/default-workspace";

async function main() {
  const client = new Client({
    connectionString:
      process.env.DATABASE_URL ??
      "postgres://postgres@localhost:5432/bizopsaccelerator",
  });

  try {
    await client.connect();
    await client.query("begin");

    const now = new Date().toISOString();
    const organizationSeed = getDefaultOrganizationSeed(DEFAULT_WORKSPACE.orgId);

    await client.query(
      `
        insert into organizations (
          id,
          name,
          industry,
          location,
          revenue_model,
          invoice_cycle,
          team_size,
          goals,
          status,
          created_at,
          updated_at,
          version
        ) values (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        )
        on conflict (id) do update set
          name = excluded.name,
          industry = excluded.industry,
          location = excluded.location,
          revenue_model = excluded.revenue_model,
          invoice_cycle = excluded.invoice_cycle,
          team_size = excluded.team_size,
          goals = excluded.goals,
          status = excluded.status,
          updated_at = excluded.updated_at,
          version = excluded.version
      `,
      [
        organizationSeed.id,
        organizationSeed.name,
        organizationSeed.industry,
        organizationSeed.location,
        organizationSeed.revenueModel,
        organizationSeed.invoiceCycle,
        organizationSeed.teamSize,
        organizationSeed.goals,
        organizationSeed.status,
        now,
        now,
        "organization-record.v1",
      ],
    );

    const passwordHash = hashPassword(TEST_USER_PASSWORD);
    const seedUsers = getTestUserSeeds(DEFAULT_WORKSPACE.orgId);

    for (const seedUser of seedUsers) {
      const userLookup = await client.query<{ id: string }>(
        `
          select id
          from account_users
          where lower(email) = lower($1)
          limit 1
        `,
        [seedUser.email],
      );
      const userId = userLookup.rows[0]?.id ?? `user_${randomUUID()}`;

      await client.query(
        `
          insert into account_users (
            id,
            email,
            display_name,
            password_hash,
            created_at,
            updated_at,
            version
          ) values (
            $1, $2, $3, $4, $5, $6, $7
          )
          on conflict (id) do update set
            email = excluded.email,
            display_name = excluded.display_name,
            password_hash = excluded.password_hash,
            updated_at = excluded.updated_at,
            version = excluded.version
        `,
        [
          userId,
          seedUser.email,
          seedUser.name,
          passwordHash,
          now,
          now,
          "account-user.v1",
        ],
      );

      const membershipLookup = await client.query<{ id: string }>(
        `
          select id
          from organization_memberships
          where org_id = $1
            and user_id = $2
          limit 1
        `,
        [DEFAULT_WORKSPACE.orgId, userId],
      );
      const membershipId =
        membershipLookup.rows[0]?.id ?? `member_${randomUUID()}`;

      await client.query(
        `
          insert into organization_memberships (
            id,
            org_id,
            user_id,
            role,
            status,
            setup_access,
            operations_access,
            report_access,
            created_at,
            updated_at,
            version
          ) values (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
          )
          on conflict (org_id, user_id) do update set
            role = excluded.role,
            status = excluded.status,
            setup_access = excluded.setup_access,
            operations_access = excluded.operations_access,
            report_access = excluded.report_access,
            updated_at = excluded.updated_at,
            version = excluded.version
        `,
        [
          membershipId,
          DEFAULT_WORKSPACE.orgId,
          userId,
          seedUser.role,
          "active",
          seedUser.setupAccess,
          seedUser.operationsAccess,
          seedUser.reportAccess,
          now,
          now,
          "organization-membership.v1",
        ],
      );
    }

    await client.query("commit");
    console.log(
      JSON.stringify(getTestUserSeedRows(DEFAULT_WORKSPACE.orgId), null, 2),
    );
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
