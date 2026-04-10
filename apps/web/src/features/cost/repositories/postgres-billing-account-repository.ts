import { type Pool } from "pg";

import {
  billingAccountSchema,
  type BillingAccount,
} from "@/features/cost/domain/billing-account";
import { type BillingAccountRepository } from "@/features/cost/repositories/billing-account-repository";
import {
  fromPostgresNumber,
  fromPostgresTimestamp,
} from "@/features/persistence/postgres/postgres-pool";

type CreatePostgresBillingAccountRepositoryInput = Readonly<{
  pool: Pool;
}>;

export function createPostgresBillingAccountRepository({
  pool,
}: CreatePostgresBillingAccountRepositoryInput): BillingAccountRepository {
  return {
    async getByOrgId(orgId) {
      const result = await queryBillingAccountRows(pool, {
        emptyValue: null,
        query: `
          select *
          from billing_accounts
          where org_id = $1
        `,
        values: [orgId],
      });

      if (result === null) {
        return null;
      }

      return result.rows[0] === undefined
        ? null
        : mapBillingAccountRow(result.rows[0]);
    },
    async put(billingAccount) {
      const parsedBillingAccount = billingAccountSchema.parse(billingAccount);

      await pool.query(
        `
          insert into billing_accounts (
            id,
            org_id,
            plan_name,
            status,
            currency,
            monthly_platform_fee_cents,
            profit_premium_basis_points,
            billing_anchor_day_of_month,
            created_at,
            updated_at,
            version
          ) values (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
          )
          on conflict (id) do update set
            org_id = excluded.org_id,
            plan_name = excluded.plan_name,
            status = excluded.status,
            currency = excluded.currency,
            monthly_platform_fee_cents = excluded.monthly_platform_fee_cents,
            profit_premium_basis_points = excluded.profit_premium_basis_points,
            billing_anchor_day_of_month = excluded.billing_anchor_day_of_month,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at,
            version = excluded.version
        `,
        [
          parsedBillingAccount.id,
          parsedBillingAccount.orgId,
          parsedBillingAccount.planName,
          parsedBillingAccount.status,
          parsedBillingAccount.currency,
          parsedBillingAccount.monthlyPlatformFeeCents,
          parsedBillingAccount.profitPremiumBasisPoints,
          parsedBillingAccount.billingAnchorDayOfMonth,
          parsedBillingAccount.createdAt,
          parsedBillingAccount.updatedAt,
          parsedBillingAccount.version,
        ],
      );

      return parsedBillingAccount;
    },
  };
}

async function queryBillingAccountRows<TEmptyValue>(
  pool: Pool,
  input: Readonly<{
    emptyValue: TEmptyValue;
    query: string;
    values: readonly unknown[];
  }>,
) {
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

function mapBillingAccountRow(row: Record<string, unknown>): BillingAccount {
  return billingAccountSchema.parse({
    billingAnchorDayOfMonth: fromPostgresNumber(
      row.billing_anchor_day_of_month as string | number | null | undefined,
    ),
    createdAt: fromPostgresTimestamp(row.created_at as Date | string),
    currency: row.currency,
    id: row.id,
    monthlyPlatformFeeCents: fromPostgresNumber(
      row.monthly_platform_fee_cents as string | number | null | undefined,
    ),
    orgId: row.org_id,
    planName: row.plan_name,
    profitPremiumBasisPoints: fromPostgresNumber(
      row.profit_premium_basis_points as string | number | null | undefined,
    ),
    status: row.status,
    updatedAt: fromPostgresTimestamp(row.updated_at as Date | string),
    version: row.version,
  });
}
