import { type Pool, type QueryResult } from "pg";

import {
  createOrganizationAccount,
  type OrganizationAccountRecord,
} from "@/features/accounts/domain/organization-account";
import { type AccountRepository } from "@/features/accounts/repositories/account-repository";
import { fromPostgresTimestamp } from "@/features/persistence/postgres/postgres-pool";

type CreatePostgresAccountRepositoryInput = Readonly<{
  pool: Pool;
}>;

export function createPostgresAccountRepository({
  pool,
}: CreatePostgresAccountRepositoryInput): AccountRepository {
  return {
    async getByOrgIdAndEmail(orgId, email) {
      const result = await queryMembershipRows(pool, {
        emptyValue: null,
        query: `
          select
            memberships.id,
            memberships.org_id,
            memberships.role,
            memberships.status,
            memberships.setup_access,
            memberships.operations_access,
            memberships.report_access,
            memberships.created_at,
            memberships.updated_at,
            users.id as user_id,
            users.email,
            users.display_name,
            users.password_hash
          from organization_memberships as memberships
          inner join account_users as users
            on users.id = memberships.user_id
          where memberships.org_id = $1
            and lower(users.email) = lower($2)
          limit 1
        `,
        values: [orgId, email],
      });

      if (result === null) {
        return null;
      }

      return result.rows[0] === undefined
        ? null
        : mapOrganizationAccountRow(result.rows[0]);
    },
    async listByOrgId(orgId) {
      const result = await queryMembershipRows(pool, {
        emptyValue: [],
        query: `
          select
            memberships.id,
            memberships.org_id,
            memberships.role,
            memberships.status,
            memberships.setup_access,
            memberships.operations_access,
            memberships.report_access,
            memberships.created_at,
            memberships.updated_at,
            users.id as user_id,
            users.email,
            users.display_name,
            users.password_hash
          from organization_memberships as memberships
          inner join account_users as users
            on users.id = memberships.user_id
          where memberships.org_id = $1
          order by memberships.created_at asc
        `,
        values: [orgId],
      });

      if (Array.isArray(result)) {
        return result;
      }

      return result.rows.map(mapOrganizationAccountRow);
    },
    async put(organizationAccount) {
      const parsedAccount = createOrganizationAccount(organizationAccount);
      const client = await pool.connect();

      try {
        await client.query("begin");

        const existingUser = await client.query<{ id: string }>(
          `
            select id
            from account_users
            where lower(email) = lower($1)
            limit 1
          `,
          [parsedAccount.email],
        );
        const userId = existingUser.rows[0]?.id ?? parsedAccount.userId;

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
              password_hash = coalesce(excluded.password_hash, account_users.password_hash),
              updated_at = excluded.updated_at,
              version = excluded.version
          `,
          [
            userId,
            parsedAccount.email,
            parsedAccount.name,
            parsedAccount.passwordHash,
            parsedAccount.createdAt,
            parsedAccount.updatedAt,
            "account-user.v1",
          ],
        );

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
            parsedAccount.id,
            parsedAccount.orgId,
            userId,
            parsedAccount.role,
            parsedAccount.status,
            parsedAccount.setupAccess,
            parsedAccount.operationsAccess,
            parsedAccount.reportAccess,
            parsedAccount.createdAt,
            parsedAccount.updatedAt,
            "organization-membership.v1",
          ],
        );

        await client.query("commit");

        return createOrganizationAccount({
          ...parsedAccount,
          userId,
        });
      } catch (error) {
        await client.query("rollback");
        throw error;
      } finally {
        client.release();
      }
    },
  };
}

async function queryMembershipRows<TEmptyValue>(
  pool: Pool,
  input: Readonly<{
    emptyValue: TEmptyValue;
    query: string;
    values: readonly unknown[];
  }>,
): Promise<QueryResult<Record<string, unknown>> | TEmptyValue> {
  try {
    return await pool.query<Record<string, unknown>>(input.query, [
      ...input.values,
    ]);
  } catch (error) {
    if (isUndefinedTableError(error)) {
      return input.emptyValue;
    }

    throw error;
  }
}

function isUndefinedTableError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "42P01"
  );
}

function mapOrganizationAccountRow(
  row: Record<string, unknown>,
): OrganizationAccountRecord {
  return createOrganizationAccount({
    createdAt: fromPostgresTimestamp(row.created_at as Date | string),
    email: row.email as string,
    id: row.id as string,
    name: row.display_name as string,
    operationsAccess: row.operations_access as boolean,
    orgId: row.org_id as string,
    passwordHash:
      typeof row.password_hash === "string" ? row.password_hash : undefined,
    reportAccess: row.report_access as boolean,
    role: row.role as OrganizationAccountRecord["role"],
    setupAccess: row.setup_access as boolean,
    status: row.status as OrganizationAccountRecord["status"],
    updatedAt: fromPostgresTimestamp(row.updated_at as Date | string),
    userId: row.user_id as string,
  });
}
