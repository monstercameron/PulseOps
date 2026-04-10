import {
  ingestionQueueMessageSchema,
  type IngestionQueue,
  type IngestionQueueMessage,
} from "@/features/ingestion/queue/ingestion-queue";

export function createInMemoryIngestionQueue(
  initialMessages: readonly IngestionQueueMessage[] = [],
): IngestionQueue {
  const queue = initialMessages.map((message) =>
    ingestionQueueMessageSchema.parse(message),
  );

  return {
    async dequeue() {
      return queue.shift() ?? null;
    },
    async enqueue(message) {
      queue.push(ingestionQueueMessageSchema.parse(message));
    },
    async size() {
      return queue.length;
    },
  };
}
