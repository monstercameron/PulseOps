import { randomUUID } from "node:crypto";

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { createMemoryEmbedding } from "@/features/chunks/domain/memory-embedding";
import { createPostgresMemoryEmbeddingRepository } from "@/features/chunks/repositories/postgres-memory-embedding-repository";
import { resolveServerPaths } from "@/features/config/server-env";
import { createExperimentRecord } from "@/features/experiments/domain/experiment-record";
import { createPostgresExperimentRepository } from "@/features/experiments/repositories/postgres-experiment-repository";
import { createFeedbackEvent } from "@/features/feedback/domain/feedback-event";
import { createPostgresFeedbackRepository } from "@/features/feedback/repositories/postgres-feedback-repository";
import { createProcessingPolicy } from "@/features/governance/domain/processing-policy";
import { createPostgresPolicyRepository } from "@/features/governance/repositories/postgres-policy-repository";
import { createImportBlueprint } from "@/features/ingestion/domain/import-blueprint";
import { createPostgresImportBlueprintRepository } from "@/features/ingestion/repositories/postgres-import-blueprint-repository";
import { createMaterializedMart } from "@/features/marts/domain/materialized-mart";
import { createPostgresMartRepository } from "@/features/marts/repositories/postgres-mart-repository";
import { createOutcomeObservation } from "@/features/outcomes/domain/outcome-tracking";
import { createPostgresOutcomeRepository } from "@/features/outcomes/repositories/postgres-outcome-repository";
import { createDecisionRun } from "@/features/packs/domain/decision-run";
import { createRecommendationRecord } from "@/features/packs/domain/recommendation-record";
import { createPostgresDecisionRunRepository } from "@/features/packs/repositories/postgres-decision-run-repository";
import { createPostgresRecommendationRepository } from "@/features/packs/repositories/postgres-recommendation-repository";
import { getPostgresPool } from "@/features/persistence/postgres/postgres-pool";
import { createSavedQuestion } from "@/features/query/domain/saved-question";
import { createQueryPlan } from "@/features/query/domain/query-plan";
import { createPostgresSavedQuestionRepository } from "@/features/query/repositories/postgres-saved-question-repository";
import { createOrganizationRecord } from "@/features/settings/domain/organization-record";
import { createPostgresOrganizationRepository } from "@/features/settings/repositories/postgres-organization-repository";
import { createAuditLog } from "@/features/audit/domain/audit-log";
import { createPostgresAuditLogRepository } from "@/features/audit/repositories/postgres-audit-log-repository";

const shouldRunPostgresIntegration =
  process.env.BIZOPS_ENABLE_POSTGRES_TESTS === "1";
const cleanupOrgIds: string[] = [];
const serverPaths = resolveServerPaths({
  ...process.env,
  NODE_ENV: "development",
});
const postgresPool = getPostgresPool(serverPaths.databaseUrl);

afterEach(async () => {
  while (cleanupOrgIds.length > 0) {
    const orgId = cleanupOrgIds.pop();

    if (orgId !== undefined) {
      await cleanupFoundationOrg(orgId);
    }
  }
});

const describePostgres = shouldRunPostgresIntegration ? describe : describe.skip;

describePostgres("foundation records postgres integration", () => {
  beforeAll(async () => {
    await postgresPool.query("select 1");
  });

  it("persists the missing foundation records and memory vectors", async () => {
    const orgId = `org_pg_foundation_${randomUUID().replace(/-/g, "")}`;
    cleanupOrgIds.push(orgId);

    const organizationRepository = createPostgresOrganizationRepository({
      pool: postgresPool,
    });
    const policyRepository = createPostgresPolicyRepository({
      pool: postgresPool,
    });
    const importBlueprintRepository = createPostgresImportBlueprintRepository({
      pool: postgresPool,
    });
    const savedQuestionRepository = createPostgresSavedQuestionRepository({
      pool: postgresPool,
    });
    const decisionRunRepository = createPostgresDecisionRunRepository({
      pool: postgresPool,
    });
    const recommendationRepository = createPostgresRecommendationRepository({
      pool: postgresPool,
    });
    const feedbackRepository = createPostgresFeedbackRepository({
      pool: postgresPool,
    });
    const outcomeRepository = createPostgresOutcomeRepository({
      pool: postgresPool,
    });
    const auditLogRepository = createPostgresAuditLogRepository({
      pool: postgresPool,
    });
    const martRepository = createPostgresMartRepository({
      pool: postgresPool,
    });
    const experimentRepository = createPostgresExperimentRepository({
      pool: postgresPool,
    });
    const memoryEmbeddingRepository = createPostgresMemoryEmbeddingRepository({
      pool: postgresPool,
    });

    await organizationRepository.put(
      createOrganizationRecord({
        goals: ["Protect margin"],
        id: orgId,
        industry: "Field services",
        invoiceCycle: "Weekly",
        location: "Tampa, FL",
        name: "Foundation Test HVAC",
        revenueModel: "Project based",
        status: "active",
        teamSize: "11-25",
      }),
    );

    await policyRepository.put(
      createProcessingPolicy({
        embeddingsEnabled: true,
        extractionEnabled: true,
        humanReviewRequired: false,
        id: `policy_${orgId}`,
        name: "Upload default",
        orgId,
        parserRoute: "tabular",
        redactionPolicyKey: "tabular-financial-export",
        retentionPolicyKey: "manual-upload-hot-30d",
        scopeKey: "upload",
        scopeKind: "source",
      }),
    );

    await importBlueprintRepository.put(
      createImportBlueprint({
        exampleFileNames: ["weekly-cash.csv"],
        id: `blueprint_${orgId}`,
        name: "Weekly cash export",
        orgId,
        parserRoute: "tabular",
        policyId: `policy_${orgId}`,
        sourceKind: "upload",
        status: "active",
        targetDocumentFamily: "sales_export",
      }),
    );

    await savedQuestionRepository.put(
      createSavedQuestion({
        id: `question_${orgId}`,
        orgId,
        queryPlan: createQueryPlan({
          canonicalFactTypeIds: ["document.observation.number"],
          entityTypes: ["document"],
          limit: 10,
          needsClarification: false,
          orgId,
          question: "What changed this week?",
          rationale: "Need a fast weekly summary.",
          retrievalMode: "hybrid",
          vectorSearchText: "weekly cash and margin change",
        }),
        question: "What changed this week?",
      }),
    );

    await decisionRunRepository.put(
      createDecisionRun({
        completedAt: "2026-04-09T20:05:00.000Z",
        createdAt: "2026-04-09T20:00:00.000Z",
        id: `decision_${orgId}`,
        orgId,
        packId: `pack_${orgId}`,
        packKey: "weekly-cash-margin-brief",
        recommendationCount: 1,
        sourceDocumentIds: ["doc_123"],
        startedAt: "2026-04-09T20:00:00.000Z",
        status: "completed",
        summary: "Collections risk increased this week.",
        supportingFactIds: ["fact_123"],
        updatedAt: "2026-04-09T20:05:00.000Z",
      }),
    );

    await recommendationRepository.put(
      createRecommendationRecord({
        actions: ["Call top overdue customer"],
        citations: ["doc_123 row 2"],
        confidenceScore: 0.91,
        createdAt: "2026-04-09T20:05:00.000Z",
        decisionRunId: `decision_${orgId}`,
        id: `rec_${orgId}`,
        kind: "collect-overdue-invoice",
        orgId,
        priorityScore: 4,
        status: "open",
        summary: "Call the largest overdue customer today.",
        supportingFactIds: ["fact_123"],
        title: "Collect overdue invoice",
        updatedAt: "2026-04-09T20:05:00.000Z",
      }),
    );

    await feedbackRepository.put(
      createFeedbackEvent({
        action: "accept",
        actorId: "owner_123",
        createdAt: "2026-04-09T21:00:00.000Z",
        id: `feedback_${orgId}`,
        orgId,
        recommendationId: `rec_${orgId}`,
      }),
    );

    await outcomeRepository.put(
      createOutcomeObservation({
        createdAt: "2026-04-09T21:30:00.000Z",
        id: `outcome_${orgId}`,
        observedAt: "2026-04-09T21:25:00.000Z",
        orgId,
        outcomeStatus: "positive",
        recommendationId: `rec_${orgId}`,
        valueChangeCents: 125000,
        windowDays: 7,
      }),
    );

    await auditLogRepository.put(
      createAuditLog({
        action: "recommendation.accept",
        actorId: "owner_123",
        createdAt: "2026-04-09T21:00:00.000Z",
        entityId: `rec_${orgId}`,
        id: `audit_${orgId}`,
        metadata: {
          route: "/api/packs",
        },
        orgId,
      }),
    );

    await martRepository.put(
      createMaterializedMart({
        asOfDate: "2026-04-09",
        dimensionValues: {
          location: "Tampa, FL",
        },
        metricId: "cash_on_hand",
        orgId,
        supportingFactIds: ["fact_123"],
        value: 1245.55,
      }),
    );

    await experimentRepository.put(
      createExperimentRecord({
        createdAt: "2026-04-09T22:00:00.000Z",
        hypothesis: "More explicit urgency language improves acceptance.",
        id: `experiment_${orgId}`,
        orgId,
        primaryMetric: "acceptance_rate",
        promptFamily: "weekly-brief-recommendations",
        startedAt: "2026-04-09T22:00:00.000Z",
        status: "running",
        updatedAt: "2026-04-09T22:00:00.000Z",
        variantId: "variant_a",
      }),
    );

    await memoryEmbeddingRepository.put(
      createMemoryEmbedding({
        content: "Accepted collections recommendation for overdue invoice.",
        createdAt: "2026-04-09T22:05:00.000Z",
        embedding: [0.9, 0.1, 0.3, 0.4],
        embeddingModel: "deterministic-embedder.v1",
        id: `memory_${orgId}`,
        memoryKind: "feedback",
        metadata: {
          recommendationId: `rec_${orgId}`,
        },
        orgId,
        sourceId: `feedback_${orgId}`,
        updatedAt: "2026-04-09T22:05:00.000Z",
      }),
    );

    expect(await organizationRepository.getById(orgId)).toMatchObject({
      id: orgId,
      name: "Foundation Test HVAC",
    });
    await expect(policyRepository.listByOrgId(orgId)).resolves.toHaveLength(1);
    await expect(importBlueprintRepository.listByOrgId(orgId)).resolves.toHaveLength(1);
    await expect(savedQuestionRepository.listByOrgId(orgId)).resolves.toHaveLength(1);
    await expect(decisionRunRepository.listByOrgId(orgId)).resolves.toHaveLength(1);
    await expect(recommendationRepository.listByDecisionRunId(`decision_${orgId}`)).resolves.toHaveLength(1);
    await expect(feedbackRepository.listByRecommendationId(`rec_${orgId}`)).resolves.toHaveLength(1);
    await expect(outcomeRepository.listByRecommendationId(`rec_${orgId}`)).resolves.toHaveLength(1);
    await expect(auditLogRepository.listByOrgId(orgId)).resolves.toHaveLength(1);
    await expect(martRepository.listByOrgId(orgId)).resolves.toHaveLength(1);
    await expect(experimentRepository.listByOrgId(orgId)).resolves.toHaveLength(1);
    await expect(memoryEmbeddingRepository.listBySourceId(`feedback_${orgId}`)).resolves.toHaveLength(1);

    const vectorCheck = await postgresPool.query<{ dims: number }>(
      `
        select vector_dims(embedding_vector) as dims
        from memory_embeddings
        where id = $1
      `,
      [`memory_${orgId}`],
    );

    expect(vectorCheck.rows).toEqual([{ dims: 4 }]);
  });
});

async function cleanupFoundationOrg(orgId: string) {
  await postgresPool.query("delete from memory_embeddings where org_id = $1", [
    orgId,
  ]);
  await postgresPool.query("delete from experiments where org_id = $1", [orgId]);
  await postgresPool.query("delete from recommendations where org_id = $1", [
    orgId,
  ]);
  await postgresPool.query("delete from decision_runs where org_id = $1", [orgId]);
  await postgresPool.query("delete from import_blueprints where org_id = $1", [
    orgId,
  ]);
  await postgresPool.query(
    "delete from processing_policies where org_id = $1",
    [orgId],
  );
  await postgresPool.query("delete from materialized_marts where org_id = $1", [
    orgId,
  ]);
  await postgresPool.query("delete from audit_logs where org_id = $1", [orgId]);
  await postgresPool.query(
    "delete from outcome_observations where org_id = $1",
    [orgId],
  );
  await postgresPool.query("delete from feedback_events where org_id = $1", [
    orgId,
  ]);
  await postgresPool.query("delete from saved_questions where org_id = $1", [
    orgId,
  ]);
  await postgresPool.query("delete from organizations where id = $1", [orgId]);
}
