import path from "node:path";

import {
  feedbackEventSchema,
  type FeedbackEvent,
} from "@/features/feedback/domain/feedback-event";
import { createLocalJsonCollection } from "@/features/persistence/lib/local-json-collection";
import { type FeedbackRepository } from "@/features/feedback/repositories/feedback-repository";

type LocalFeedbackRepositoryOptions = {
  rootDirectory: string;
};

export function createLocalFeedbackRepository({
  rootDirectory,
}: LocalFeedbackRepositoryOptions): FeedbackRepository {
  const collection = createLocalJsonCollection({
    filePath: path.join(rootDirectory, "feedback-events.json"),
    recordSchema: feedbackEventSchema,
  });

  return {
    async listByOrgId(orgId) {
      const feedbackEvents = await collection.list();

      return feedbackEvents.filter((event) => event.orgId === orgId);
    },
    async listByRecommendationId(recommendationId) {
      const feedbackEvents = await collection.list();

      return feedbackEvents.filter(
        (event) => event.recommendationId === recommendationId,
      );
    },
    async put(event) {
      return collection.put(feedbackEventSchema.parse(event));
    },
  };
}

export type { FeedbackEvent };
