import path from "node:path";

import {
  queueEventSchema,
  type QueueEvent,
} from "@/features/dashboard/domain/queue-event";
import { type QueueEventRepository } from "@/features/dashboard/repositories/queue-event-repository";
import { createLocalJsonCollection } from "@/features/persistence/lib/local-json-collection";

type LocalQueueEventRepositoryOptions = Readonly<{
  rootDirectory: string;
}>;

export function createLocalQueueEventRepository({
  rootDirectory,
}: LocalQueueEventRepositoryOptions): QueueEventRepository {
  const collection = createLocalJsonCollection({
    filePath: path.join(rootDirectory, "queue-events.json"),
    recordSchema: queueEventSchema,
  });

  return {
    async listByOrgId(orgId) {
      const queueEvents = await collection.list();

      return queueEvents.filter((queueEvent) => queueEvent.orgId === orgId);
    },
    async put(queueEvent) {
      return collection.put(queueEventSchema.parse(queueEvent));
    },
  };
}

export type { QueueEvent };
