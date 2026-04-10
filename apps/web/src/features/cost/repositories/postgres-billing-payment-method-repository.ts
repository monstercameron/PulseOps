import { type Pool } from "pg";

import {
  billingPaymentMethodSchema,
  type BillingPaymentMethod,
} from "@/features/cost/domain/billing-payment-method";
import { type BillingPaymentMethodRepository } from "@/features/cost/repositories/billing-payment-method-repository";
import {
  fromPostgresNumber,
  fromPostgresTimestamp,
} from "@/features/persistence/postgres/postgres-pool";

type CreatePostgresBillingPaymentMethodRepositoryInput = Readonly<{
  pool: Pool;
}>;

export function createPostgresBillingPaymentMethodRepository({
  pool,
}: CreatePostgresBillingPaymentMethodRepositoryInput): BillingPaymentMethodRepository {
  return {
    async deleteByOrgIdAndRole(orgId, role) {
      await deleteBillingPaymentMethodRows(pool, {
        query: `
          delete from billing_payment_methods
          where org_id = $1
            and role = $2
        `,
        values: [orgId, role],
      });
    },
    async getByOrgIdAndRole(orgId, role) {
      const result = await queryBillingPaymentMethodRows(pool, {
        emptyValue: null,
        query: `
          select *
          from billing_payment_methods
          where org_id = $1
            and role = $2
          limit 1
        `,
        values: [orgId, role],
      });

      if (result === null) {
        return null;
      }

      return result.rows[0] === undefined
        ? null
        : mapBillingPaymentMethodRow(result.rows[0]);
    },
    async listByOrgId(orgId) {
      const result = await queryBillingPaymentMethodRows(pool, {
        emptyValue: [],
        query: `
          select *
          from billing_payment_methods
          where org_id = $1
          order by
            case role
              when 'primary' then 0
              when 'backup' then 1
              else 2
            end,
            created_at asc
        `,
        values: [orgId],
      });

      if (Array.isArray(result)) {
        return result;
      }

      return result.rows.map(mapBillingPaymentMethodRow);
    },
    async put(billingPaymentMethod) {
      const parsedBillingPaymentMethod = billingPaymentMethodSchema.parse(
        billingPaymentMethod,
      );

      await pool.query(
        `
          insert into billing_payment_methods (
            id,
            org_id,
            role,
            cardholder_name,
            brand,
            last4,
            exp_month,
            exp_year,
            postal_code,
            created_at,
            updated_at,
            version
          ) values (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
          )
          on conflict (org_id, role) do update set
            id = excluded.id,
            cardholder_name = excluded.cardholder_name,
            brand = excluded.brand,
            last4 = excluded.last4,
            exp_month = excluded.exp_month,
            exp_year = excluded.exp_year,
            postal_code = excluded.postal_code,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at,
            version = excluded.version
        `,
        [
          parsedBillingPaymentMethod.id,
          parsedBillingPaymentMethod.orgId,
          parsedBillingPaymentMethod.role,
          parsedBillingPaymentMethod.cardholderName,
          parsedBillingPaymentMethod.brand,
          parsedBillingPaymentMethod.last4,
          parsedBillingPaymentMethod.expMonth,
          parsedBillingPaymentMethod.expYear,
          parsedBillingPaymentMethod.postalCode,
          parsedBillingPaymentMethod.createdAt,
          parsedBillingPaymentMethod.updatedAt,
          parsedBillingPaymentMethod.version,
        ],
      );

      return parsedBillingPaymentMethod;
    },
  };
}

async function queryBillingPaymentMethodRows<TEmptyValue>(
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

async function deleteBillingPaymentMethodRows(
  pool: Pool,
  input: Readonly<{
    query: string;
    values: readonly unknown[];
  }>,
) {
  try {
    await pool.query(input.query, [...input.values]);
  } catch (error) {
    if (isUndefinedTableError(error)) {
      return;
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

function mapBillingPaymentMethodRow(
  row: Record<string, unknown>,
): BillingPaymentMethod {
  return billingPaymentMethodSchema.parse({
    brand: row.brand,
    cardholderName: row.cardholder_name,
    createdAt: fromPostgresTimestamp(row.created_at as Date | string),
    expMonth: fromPostgresNumber(
      row.exp_month as string | number | null | undefined,
    ),
    expYear: fromPostgresNumber(
      row.exp_year as string | number | null | undefined,
    ),
    id: row.id,
    last4: row.last4,
    orgId: row.org_id,
    postalCode:
      typeof row.postal_code === "string" ? row.postal_code : null,
    role: row.role,
    updatedAt: fromPostgresTimestamp(row.updated_at as Date | string),
    version: row.version,
  });
}
