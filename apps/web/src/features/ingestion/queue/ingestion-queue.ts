import { z } from "zod";

export const ingestionQueueMessageSchema = z.object({
  documentId: z.string().min(1),
  enqueuedAt: z.string().datetime(),
  jobId: z.string().min(1),
  orgId: z.string().min(1),
  version: z.literal("ingestion-queue-message.v1"),
});

export type IngestionQueueMessage = z.infer<typeof ingestionQueueMessageSchema>;

type CreateIngestionQueueMessageInput = Omit<IngestionQueueMessage, "version">;

export function createIngestionQueueMessage(
  input: CreateIngestionQueueMessageInput,
): IngestionQueueMessage {
  return ingestionQueueMessageSchema.parse({
    ...input,
    version: "ingestion-queue-message.v1",
  });
}

export interface IngestionQueue {
  dequeue(): Promise<IngestionQueueMessage | null>;
  enqueue(message: IngestionQueueMessage): Promise<void>;
  size(): Promise<number>;
}
