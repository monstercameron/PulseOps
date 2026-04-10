import path from "node:path";

import {
  llmUsageEventSchema,
  type LlmUsageEvent,
} from "@/features/cost/domain/llm-usage-event";
import { type LlmUsageEventRepository } from "@/features/cost/repositories/llm-usage-event-repository";
import { createLocalJsonCollection } from "@/features/persistence/lib/local-json-collection";

type LocalLlmUsageEventRepositoryOptions = Readonly<{
  rootDirectory: string;
}>;

export function createLocalLlmUsageEventRepository({
  rootDirectory,
}: LocalLlmUsageEventRepositoryOptions): LlmUsageEventRepository {
  const collection = createLocalJsonCollection({
    filePath: path.join(rootDirectory, "llm-usage-events.json"),
    recordSchema: llmUsageEventSchema,
  });

  return {
    async listByOrgIdInPeriod({ endAtExclusive, orgId, startAtInclusive }) {
      const llmUsageEvents = await collection.list();

      return llmUsageEvents
        .filter(
          (llmUsageEvent) =>
            llmUsageEvent.orgId === orgId &&
            llmUsageEvent.createdAt >= startAtInclusive &&
            llmUsageEvent.createdAt < endAtExclusive,
        )
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
    },
    async put(llmUsageEvent) {
      return collection.put(llmUsageEventSchema.parse(llmUsageEvent));
    },
  };
}

export type { LlmUsageEvent };
