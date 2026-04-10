import { type Pool } from "pg";

import {
  llmUsageEventSchema,
  type LlmUsageEvent,
} from "@/features/cost/domain/llm-usage-event";
import { type LlmUsageEventRepository } from "@/features/cost/repositories/llm-usage-event-repository";
import {
  fromPostgresNumber,
  fromPostgresTimestamp,
} from "@/features/persistence/postgres/postgres-pool";

type CreatePostgresLlmUsageEventRepositoryInput = Readonly<{
  pool: Pool;
}>;

export function createPostgresLlmUsageEventRepository({
  pool,
}: CreatePostgresLlmUsageEventRepositoryInput): LlmUsageEventRepository {
  return {
    async listByOrgIdInPeriod({ endAtExclusive, orgId, startAtInclusive }) {
      const result = await queryLlmUsageEventRows(pool, {
        emptyValue: [],
        query: `
          select *
          from llm_usage_events
          where org_id = $1
            and created_at >= $2
            and created_at < $3
          order by created_at asc
        `,
        values: [orgId, startAtInclusive, endAtExclusive],
      });

      if (Array.isArray(result)) {
        return result;
      }

      return result.rows.map(mapLlmUsageEventRow);
    },
    async put(llmUsageEvent) {
      const parsedLlmUsageEvent = llmUsageEventSchema.parse(llmUsageEvent);

      await pool.query(
        `
          insert into llm_usage_events (
            id,
            org_id,
            provider,
            model,
            feature,
            operation,
            document_id,
            input_tokens,
            cached_input_tokens,
            output_tokens,
            total_tokens,
            pricing_available,
            pricing_source,
            pricing_version,
            provider_input_cost_nano_usd,
            provider_output_cost_nano_usd,
            provider_total_cost_nano_usd,
            profit_premium_basis_points,
            billable_cost_nano_usd,
            created_at,
            version
          ) values (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
            $16, $17, $18, $19, $20, $21
          )
          on conflict (id) do update set
            org_id = excluded.org_id,
            provider = excluded.provider,
            model = excluded.model,
            feature = excluded.feature,
            operation = excluded.operation,
            document_id = excluded.document_id,
            input_tokens = excluded.input_tokens,
            cached_input_tokens = excluded.cached_input_tokens,
            output_tokens = excluded.output_tokens,
            total_tokens = excluded.total_tokens,
            pricing_available = excluded.pricing_available,
            pricing_source = excluded.pricing_source,
            pricing_version = excluded.pricing_version,
            provider_input_cost_nano_usd = excluded.provider_input_cost_nano_usd,
            provider_output_cost_nano_usd = excluded.provider_output_cost_nano_usd,
            provider_total_cost_nano_usd = excluded.provider_total_cost_nano_usd,
            profit_premium_basis_points = excluded.profit_premium_basis_points,
            billable_cost_nano_usd = excluded.billable_cost_nano_usd,
            created_at = excluded.created_at,
            version = excluded.version
        `,
        [
          parsedLlmUsageEvent.id,
          parsedLlmUsageEvent.orgId,
          parsedLlmUsageEvent.provider,
          parsedLlmUsageEvent.model,
          parsedLlmUsageEvent.feature,
          parsedLlmUsageEvent.operation,
          parsedLlmUsageEvent.documentId ?? null,
          parsedLlmUsageEvent.inputTokens,
          parsedLlmUsageEvent.cachedInputTokens,
          parsedLlmUsageEvent.outputTokens,
          parsedLlmUsageEvent.totalTokens,
          parsedLlmUsageEvent.pricingAvailable,
          parsedLlmUsageEvent.pricingSource ?? null,
          parsedLlmUsageEvent.pricingVersion ?? null,
          parsedLlmUsageEvent.providerInputCostNanoUsd,
          parsedLlmUsageEvent.providerOutputCostNanoUsd,
          parsedLlmUsageEvent.providerTotalCostNanoUsd,
          parsedLlmUsageEvent.profitPremiumBasisPoints,
          parsedLlmUsageEvent.billableCostNanoUsd,
          parsedLlmUsageEvent.createdAt,
          parsedLlmUsageEvent.version,
        ],
      );

      return parsedLlmUsageEvent;
    },
  };
}

async function queryLlmUsageEventRows<TEmptyValue>(
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

function mapLlmUsageEventRow(row: Record<string, unknown>): LlmUsageEvent {
  return llmUsageEventSchema.parse({
    billableCostNanoUsd: fromPostgresNumber(
      row.billable_cost_nano_usd as string | number | null | undefined,
    ),
    cachedInputTokens: fromPostgresNumber(
      row.cached_input_tokens as string | number | null | undefined,
    ),
    createdAt: fromPostgresTimestamp(row.created_at as Date | string),
    documentId: row.document_id,
    feature: row.feature,
    id: row.id,
    inputTokens: fromPostgresNumber(
      row.input_tokens as string | number | null | undefined,
    ),
    model: row.model,
    operation: row.operation,
    orgId: row.org_id,
    outputTokens: fromPostgresNumber(
      row.output_tokens as string | number | null | undefined,
    ),
    pricingAvailable: Boolean(row.pricing_available),
    pricingSource: row.pricing_source ?? undefined,
    pricingVersion: row.pricing_version ?? undefined,
    profitPremiumBasisPoints: fromPostgresNumber(
      row.profit_premium_basis_points as string | number | null | undefined,
    ),
    provider: row.provider,
    providerInputCostNanoUsd: fromPostgresNumber(
      row.provider_input_cost_nano_usd as string | number | null | undefined,
    ),
    providerOutputCostNanoUsd: fromPostgresNumber(
      row.provider_output_cost_nano_usd as string | number | null | undefined,
    ),
    providerTotalCostNanoUsd: fromPostgresNumber(
      row.provider_total_cost_nano_usd as string | number | null | undefined,
    ),
    totalTokens: fromPostgresNumber(
      row.total_tokens as string | number | null | undefined,
    ),
    version: row.version,
  });
}
