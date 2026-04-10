import { describe, expect, it, vi } from "vitest";
import { type Pool } from "pg";

import { createPostgresLlmUsageEventRepository } from "@/features/cost/repositories/postgres-llm-usage-event-repository";

describe("createPostgresLlmUsageEventRepository", () => {
  it("maps nullable document ids from Postgres rows", async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [
        {
          billable_cost_nano_usd: "4800000000",
          cached_input_tokens: "100",
          created_at: "2026-04-10T02:00:00.000Z",
          document_id: null,
          feature: "extraction",
          id: "usage_123",
          input_tokens: "1100",
          model: "gpt-5-mini",
          operation: "generic-document-extraction",
          org_id: "org_123",
          output_tokens: "2000",
          pricing_available: true,
          pricing_source: "gpt-5-mini",
          pricing_version: "openai-api-pricing-2026-04-09",
          profit_premium_basis_points: "2000",
          provider: "openai",
          provider_input_cost_nano_usd: "275000000",
          provider_output_cost_nano_usd: "3725000000",
          provider_total_cost_nano_usd: "4000000000",
          total_tokens: "3100",
          version: "llm-usage-event.v1",
        },
      ],
    });
    const repository = createPostgresLlmUsageEventRepository({
      pool: { query } as unknown as Pool,
    });

    await expect(
      repository.listByOrgIdInPeriod({
        endAtExclusive: "2026-05-09T00:00:00.000Z",
        orgId: "org_123",
        startAtInclusive: "2026-04-09T00:00:00.000Z",
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        documentId: undefined,
        feature: "extraction",
        id: "usage_123",
        orgId: "org_123",
      }),
    ]);
  });
});
