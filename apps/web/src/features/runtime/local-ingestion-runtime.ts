import { createLocalAuditLogRepository } from "@/features/audit/repositories/local-audit-log-repository";
import { createPostgresAuditLogRepository } from "@/features/audit/repositories/postgres-audit-log-repository";
import { createLocalAccountRepository } from "@/features/accounts/repositories/local-account-repository";
import { createPostgresAccountRepository } from "@/features/accounts/repositories/postgres-account-repository";
import { createLocalBillingAccountRepository } from "@/features/cost/repositories/local-billing-account-repository";
import { createLocalLlmUsageEventRepository } from "@/features/cost/repositories/local-llm-usage-event-repository";
import { createPostgresBillingAccountRepository } from "@/features/cost/repositories/postgres-billing-account-repository";
import { createPostgresLlmUsageEventRepository } from "@/features/cost/repositories/postgres-llm-usage-event-repository";
import { createLlmCostTracker } from "@/features/cost/server/llm-cost-tracker";
import { createDeterministicTextEmbedder } from "@/features/chunks/lib/deterministic-embedder";
import { createLocalChunkRepository } from "@/features/chunks/repositories/local-chunk-repository";
import { createPostgresMemoryEmbeddingRepository } from "@/features/chunks/repositories/postgres-memory-embedding-repository";
import { createPostgresChunkRepository } from "@/features/chunks/repositories/postgres-chunk-repository";
import { createLocalDashboardSurfaceRepository } from "@/features/dashboard/repositories/local-dashboard-surface-repository";
import { createLocalQueueEventRepository } from "@/features/dashboard/repositories/local-queue-event-repository";
import { createLocalDocumentRepository } from "@/features/documents/repositories/local-document-repository";
import { createPostgresDocumentRepository } from "@/features/documents/repositories/postgres-document-repository";
import { createLocalEntityRepository } from "@/features/entities/repositories/local-entity-repository";
import { createPostgresEntityRepository } from "@/features/entities/repositories/postgres-entity-repository";
import { createOpenAiDocumentExtractionServiceFromEnv } from "@/features/extraction/services/openai-document-extraction-service";
import { createLocalFactRepository } from "@/features/facts/repositories/local-fact-repository";
import { createPostgresFactRepository } from "@/features/facts/repositories/postgres-fact-repository";
import { createLocalFeedbackRepository } from "@/features/feedback/repositories/local-feedback-repository";
import { createPostgresFeedbackRepository } from "@/features/feedback/repositories/postgres-feedback-repository";
import { createPostgresPolicyRepository } from "@/features/governance/repositories/postgres-policy-repository";
import { createInMemoryIngestionQueue } from "@/features/ingestion/queue/in-memory-ingestion-queue";
import { createLocalIngestionEventRepository } from "@/features/ingestion/repositories/local-ingestion-event-repository";
import { createPostgresIngestionEventRepository } from "@/features/ingestion/repositories/postgres-ingestion-event-repository";
import { createLocalIngestionJobRepository } from "@/features/ingestion/repositories/local-ingestion-job-repository";
import { createPostgresImportBlueprintRepository } from "@/features/ingestion/repositories/postgres-import-blueprint-repository";
import { createPostgresIngestionJobRepository } from "@/features/ingestion/repositories/postgres-ingestion-job-repository";
import { createPostgresMartRepository } from "@/features/marts/repositories/postgres-mart-repository";
import { createPostgresOutcomeRepository } from "@/features/outcomes/repositories/postgres-outcome-repository";
import { createPostgresDecisionRunRepository } from "@/features/packs/repositories/postgres-decision-run-repository";
import { createLocalPackRepository } from "@/features/packs/repositories/local-pack-repository";
import { createPostgresRecommendationRepository } from "@/features/packs/repositories/postgres-recommendation-repository";
import { createLocalParserArtifactRepository } from "@/features/parsing/repositories/local-parser-artifact-repository";
import { createPostgresParserArtifactRepository } from "@/features/parsing/repositories/postgres-parser-artifact-repository";
import { createLocalTextParserArtifactRepository } from "@/features/parsing/repositories/local-text-parser-artifact-repository";
import { createPostgresTextParserArtifactRepository } from "@/features/parsing/repositories/postgres-text-parser-artifact-repository";
import { getPostgresPool } from "@/features/persistence/postgres/postgres-pool";
import { createLocalSavedQuestionRepository } from "@/features/query/repositories/local-saved-question-repository";
import { createPostgresSavedQuestionRepository } from "@/features/query/repositories/postgres-saved-question-repository";
import { createLocalSettingsRepository } from "@/features/settings/repositories/local-settings-repository";
import { createPostgresOrganizationRepository } from "@/features/settings/repositories/postgres-organization-repository";
import { createLocalObjectStorage } from "@/features/storage/lib/local-object-storage";
import { resolveServerPaths } from "@/features/config/server-env";
import { createPostgresExperimentRepository } from "@/features/experiments/repositories/postgres-experiment-repository";

const serverPaths = resolveServerPaths();
const postgresPool =
  serverPaths.runtimeStorage === "postgres"
    ? getPostgresPool(serverPaths.databaseUrl)
    : null;
const billingAccountRepository =
  postgresPool === null
    ? createLocalBillingAccountRepository({
        rootDirectory: serverPaths.recordsRoot,
      })
    : createPostgresBillingAccountRepository({
        pool: postgresPool,
      });
const llmUsageEventRepository =
  postgresPool === null
    ? createLocalLlmUsageEventRepository({
        rootDirectory: serverPaths.recordsRoot,
      })
    : createPostgresLlmUsageEventRepository({
        pool: postgresPool,
      });
const llmCostTracker = createLlmCostTracker({
  billingAccountRepository,
  llmUsageEventRepository,
});

export const localIngestionRuntime = {
  accountRepository:
    postgresPool === null
      ? createLocalAccountRepository({
          rootDirectory: serverPaths.recordsRoot,
        })
      : createPostgresAccountRepository({
          pool: postgresPool,
        }),
  auditLogRepository:
    postgresPool === null
      ? createLocalAuditLogRepository({
          rootDirectory: serverPaths.recordsRoot,
        })
      : createPostgresAuditLogRepository({
          pool: postgresPool,
        }),
  billingAccountRepository,
  chunkRepository:
    postgresPool === null
      ? createLocalChunkRepository({
          rootDirectory: serverPaths.recordsRoot,
        })
      : createPostgresChunkRepository({
          pool: postgresPool,
        }),
  dashboardSurfaceRepository: createLocalDashboardSurfaceRepository({
    rootDirectory: serverPaths.recordsRoot,
  }),
  decisionRunRepository:
    postgresPool === null
      ? undefined
      : createPostgresDecisionRunRepository({
          pool: postgresPool,
        }),
  documentRepository:
    postgresPool === null
      ? createLocalDocumentRepository({
          rootDirectory: serverPaths.recordsRoot,
        })
      : createPostgresDocumentRepository({
          pool: postgresPool,
        }),
  embedder: createDeterministicTextEmbedder(),
  entityRepository:
    postgresPool === null
      ? createLocalEntityRepository({
          rootDirectory: serverPaths.recordsRoot,
        })
      : createPostgresEntityRepository({
          pool: postgresPool,
        }),
  factRepository:
    postgresPool === null
      ? createLocalFactRepository({
          rootDirectory: serverPaths.recordsRoot,
        })
      : createPostgresFactRepository({
          pool: postgresPool,
        }),
  feedbackRepository:
    postgresPool === null
      ? createLocalFeedbackRepository({
          rootDirectory: serverPaths.recordsRoot,
        })
      : createPostgresFeedbackRepository({
          pool: postgresPool,
        }),
  ingestionEventRepository:
    postgresPool === null
      ? createLocalIngestionEventRepository({
          rootDirectory: serverPaths.recordsRoot,
        })
      : createPostgresIngestionEventRepository({
          pool: postgresPool,
        }),
  ingestionJobRepository:
    postgresPool === null
      ? createLocalIngestionJobRepository({
          rootDirectory: serverPaths.recordsRoot,
        })
      : createPostgresIngestionJobRepository({
          pool: postgresPool,
        }),
  packRepository: createLocalPackRepository({
    rootDirectory: serverPaths.recordsRoot,
  }),
  experimentRepository:
    postgresPool === null
      ? undefined
      : createPostgresExperimentRepository({
          pool: postgresPool,
        }),
  importBlueprintRepository:
    postgresPool === null
      ? undefined
      : createPostgresImportBlueprintRepository({
          pool: postgresPool,
        }),
  martRepository:
    postgresPool === null
      ? undefined
      : createPostgresMartRepository({
          pool: postgresPool,
        }),
  memoryEmbeddingRepository:
    postgresPool === null
      ? undefined
      : createPostgresMemoryEmbeddingRepository({
          pool: postgresPool,
        }),
  llmUsageEventRepository,
  organizationRepository:
    postgresPool === null
      ? undefined
      : createPostgresOrganizationRepository({
          pool: postgresPool,
        }),
  outcomeRepository:
    postgresPool === null
      ? undefined
      : createPostgresOutcomeRepository({
          pool: postgresPool,
        }),
  parserArtifactRepository:
    postgresPool === null
      ? createLocalParserArtifactRepository({
          rootDirectory: serverPaths.recordsRoot,
        })
      : createPostgresParserArtifactRepository({
          pool: postgresPool,
        }),
  queue: createInMemoryIngestionQueue(),
  queueEventRepository: createLocalQueueEventRepository({
    rootDirectory: serverPaths.recordsRoot,
  }),
  policyRepository:
    postgresPool === null
      ? undefined
      : createPostgresPolicyRepository({
          pool: postgresPool,
        }),
  recommendationRepository:
    postgresPool === null
      ? undefined
      : createPostgresRecommendationRepository({
          pool: postgresPool,
        }),
  savedQuestionRepository:
    postgresPool === null
      ? createLocalSavedQuestionRepository({
          rootDirectory: serverPaths.recordsRoot,
        })
      : createPostgresSavedQuestionRepository({
          pool: postgresPool,
        }),
  settingsRepository: createLocalSettingsRepository({
    rootDirectory: serverPaths.recordsRoot,
  }),
  storage: createLocalObjectStorage({
    rootDirectory: serverPaths.storageRoot,
  }),
  documentExtractionService:
    createOpenAiDocumentExtractionServiceFromEnv(process.env, {
      llmCostTracker,
    }) ?? undefined,
  textParserArtifactRepository:
    postgresPool === null
      ? createLocalTextParserArtifactRepository({
          rootDirectory: serverPaths.recordsRoot,
        })
      : createPostgresTextParserArtifactRepository({
          pool: postgresPool,
        }),
};
