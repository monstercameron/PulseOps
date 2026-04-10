import { describe, expect, it } from "vitest";

import {
  createIngestionQueueMessage,
  ingestionQueueMessageSchema,
} from "@/features/ingestion/queue/ingestion-queue";
import { createInMemoryIngestionQueue } from "@/features/ingestion/queue/in-memory-ingestion-queue";

describe("createInMemoryIngestionQueue", () => {
  it("preserves FIFO ordering for queued jobs", async () => {
    const queue = createInMemoryIngestionQueue();

    await queue.enqueue(
      createIngestionQueueMessage({
        documentId: "doc_001",
        enqueuedAt: "2026-04-09T17:00:00.000Z",
        jobId: "job_001",
        orgId: "org_001",
      }),
    );
    await queue.enqueue(
      createIngestionQueueMessage({
        documentId: "doc_002",
        enqueuedAt: "2026-04-09T17:00:01.000Z",
        jobId: "job_002",
        orgId: "org_001",
      }),
    );

    expect(await queue.size()).toBe(2);
    expect(await queue.dequeue()).toEqual(
      ingestionQueueMessageSchema.parse({
        documentId: "doc_001",
        enqueuedAt: "2026-04-09T17:00:00.000Z",
        jobId: "job_001",
        orgId: "org_001",
        version: "ingestion-queue-message.v1",
      }),
    );
    expect(await queue.dequeue()).toEqual(
      ingestionQueueMessageSchema.parse({
        documentId: "doc_002",
        enqueuedAt: "2026-04-09T17:00:01.000Z",
        jobId: "job_002",
        orgId: "org_001",
        version: "ingestion-queue-message.v1",
      }),
    );
    expect(await queue.dequeue()).toBeNull();
  });
});
