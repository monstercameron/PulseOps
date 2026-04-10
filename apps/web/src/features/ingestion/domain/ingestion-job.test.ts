import { describe, expect, it } from "vitest";

import {
  canTransitionIngestionJobStatus,
  createIngestionJob,
  transitionIngestionJob,
} from "@/features/ingestion/domain/ingestion-job";

describe("ingestion job", () => {
  it("creates queued jobs with stable metadata", () => {
    const createdAt = "2026-04-09T16:00:00.000Z";
    const job = createIngestionJob(
      {
        documentId: "doc_123",
        id: "job_123",
        orgId: "org_123",
      },
      createdAt,
    );

    expect(job.status).toBe("queued");
    expect(job.attemptCount).toBe(1);
    expect(job.createdAt).toBe(createdAt);
    expect(job.lastUpdatedAt).toBe(createdAt);
  });

  it("allows valid forward transitions and stamps terminal states", () => {
    const job = createIngestionJob(
      {
        documentId: "doc_123",
        id: "job_123",
        orgId: "org_123",
      },
      "2026-04-09T16:00:00.000Z",
    );

    const parsingJob = transitionIngestionJob(
      job,
      "parsing",
      "2026-04-09T16:01:00.000Z",
    );
    const classifyingJob = transitionIngestionJob(
      parsingJob,
      "classifying",
      "2026-04-09T16:02:00.000Z",
    );
    const extractingJob = transitionIngestionJob(
      classifyingJob,
      "extracting",
      "2026-04-09T16:03:00.000Z",
    );
    const normalizingJob = transitionIngestionJob(
      extractingJob,
      "normalizing",
      "2026-04-09T16:04:00.000Z",
    );
    const completedJob = transitionIngestionJob(
      normalizingJob,
      "completed",
      "2026-04-09T16:05:00.000Z",
    );

    expect(completedJob.startedAt).toBe("2026-04-09T16:01:00.000Z");
    expect(completedJob.completedAt).toBe("2026-04-09T16:05:00.000Z");
  });

  it("rejects invalid transitions", () => {
    const job = createIngestionJob({
      documentId: "doc_123",
      id: "job_123",
      orgId: "org_123",
    });

    expect(canTransitionIngestionJobStatus("queued", "completed")).toBe(false);
    expect(() => transitionIngestionJob(job, "completed")).toThrow(
      "Invalid ingestion job transition: queued -> completed",
    );
  });
});
