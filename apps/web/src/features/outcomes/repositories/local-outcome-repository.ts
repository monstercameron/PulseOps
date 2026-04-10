import path from "node:path";

import {
  outcomeObservationSchema,
  type OutcomeObservation,
} from "@/features/outcomes/domain/outcome-tracking";
import { createLocalJsonCollection } from "@/features/persistence/lib/local-json-collection";
import { type OutcomeRepository } from "@/features/outcomes/repositories/outcome-repository";

type LocalOutcomeRepositoryOptions = {
  rootDirectory: string;
};

export function createLocalOutcomeRepository({
  rootDirectory,
}: LocalOutcomeRepositoryOptions): OutcomeRepository {
  const collection = createLocalJsonCollection({
    filePath: path.join(rootDirectory, "outcomes.json"),
    recordSchema: outcomeObservationSchema,
  });

  return {
    async listByOrgId(orgId) {
      const outcomes = await collection.list();

      return outcomes.filter((outcome) => outcome.orgId === orgId);
    },
    async listByRecommendationId(recommendationId) {
      const outcomes = await collection.list();

      return outcomes.filter(
        (outcome) => outcome.recommendationId === recommendationId,
      );
    },
    async put(outcome) {
      return collection.put(outcomeObservationSchema.parse(outcome));
    },
  };
}

export type { OutcomeObservation };
