import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createUploadedDocument, documentSchema } from "@/features/documents/domain/document";
import { createLocalDocumentRepository } from "@/features/documents/repositories/local-document-repository";
import { createIngestionJob, transitionIngestionJob } from "@/features/ingestion/domain/ingestion-job";
import { createLocalIngestionJobRepository } from "@/features/ingestion/repositories/local-ingestion-job-repository";
import { handlePipelinePageRequest } from "@/features/pipeline/server/handle-pipeline-page-request";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("handlePipelinePageRequest", () => {
  it("returns fallback data when the workspace has no documents", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-pipeline-empty-"),
    );
    temporaryDirectories.push(rootDirectory);

    const response = await handlePipelinePageRequest(
      new Request("http://localhost/api/pipeline?orgId=org_123"),
      {
        documentRepository: createLocalDocumentRepository({ rootDirectory }),
        ingestionJobRepository: createLocalIngestionJobRepository({ rootDirectory }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      focus: expect.objectContaining({
        title: "The pipeline needs a quick operator pass right now.",
      }),
      playbook: expect.objectContaining({
        title: "Pipeline owns intake and readiness.",
      }),
      filters: expect.arrayContaining([
        expect.objectContaining({ id: "all", count: 60, active: true }),
        expect.objectContaining({ id: "attention", count: 3 }),
      ]),
      sources: expect.arrayContaining([
        expect.objectContaining({ title: "Manual uploads" }),
      ]),
      stats: expect.arrayContaining([
        expect.objectContaining({ label: "Blocked now", value: "3" }),
        expect.objectContaining({ label: "Facts ready", value: "52" }),
      ]),
    });
  });

  it("maps document and job data into pipeline stats and runs", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-pipeline-data-"),
    );
    temporaryDirectories.push(rootDirectory);

    const documentRepository = createLocalDocumentRepository({ rootDirectory });
    const ingestionJobRepository = createLocalIngestionJobRepository({ rootDirectory });

    await documentRepository.put(
      documentSchema.parse({
        ...createUploadedDocument(
          {
            fileName: "invoice-001.csv",
            id: "doc_123",
            orgId: "org_123",
            source: "email",
          },
          "2026-04-10T01:00:00.000Z",
        ),
        classificationConfidenceScore: 0.91,
        status: "failed",
        suggestedDocumentFamily: "customer-invoice",
        updatedAt: "2026-04-10T01:05:00.000Z",
      }),
    );
    await ingestionJobRepository.put(
      transitionIngestionJob(
        createIngestionJob(
          {
            documentId: "doc_123",
            id: "job_123",
            orgId: "org_123",
          },
          "2026-04-10T01:00:00.000Z",
        ),
        "failed",
        "2026-04-10T01:05:00.000Z",
        "Layout parse failed",
      ),
    );

    const response = await handlePipelinePageRequest(
      new Request("http://localhost/api/pipeline?orgId=org_123"),
      {
        documentRepository,
        ingestionJobRepository,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      alert: expect.objectContaining({
        title: "1 file needs attention before it can move forward.",
      }),
      runs: expect.arrayContaining([
        expect.objectContaining({
          fileName: "invoice-001.csv",
          detail:
            "The file stopped before facts were prepared. The file structure did not match the import format we expect.",
          outcomeLabel: "Needs attention",
          nextStepLabel:
            "Next: inspect the file in Pipeline, fix the source file, and upload it again if needed.",
        }),
      ]),
      sources: expect.arrayContaining([
        expect.objectContaining({ title: "Gmail / AP inbox" }),
      ]),
      stats: expect.arrayContaining([
        expect.objectContaining({ label: "Files in scope", value: "1" }),
        expect.objectContaining({ label: "Average confidence", value: "0.91" }),
      ]),
    });
  });

  it("filters pipeline records by status when requested", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-pipeline-filtered-"),
    );
    temporaryDirectories.push(rootDirectory);

    const documentRepository = createLocalDocumentRepository({ rootDirectory });
    const ingestionJobRepository = createLocalIngestionJobRepository({ rootDirectory });

    await documentRepository.put(
      documentSchema.parse({
        ...createUploadedDocument(
          {
            fileName: "failed-invoice.csv",
            id: "doc_failed",
            orgId: "org_123",
            source: "email",
          },
          "2026-04-10T01:00:00.000Z",
        ),
        classificationConfidenceScore: 0.91,
        status: "failed",
        suggestedDocumentFamily: "customer-invoice",
        updatedAt: "2026-04-10T01:05:00.000Z",
      }),
    );
    await documentRepository.put(
      documentSchema.parse({
        ...createUploadedDocument(
          {
            fileName: "parsed-invoice.csv",
            id: "doc_parsed",
            orgId: "org_123",
            source: "upload",
          },
          "2026-04-10T01:10:00.000Z",
        ),
        classificationConfidenceScore: 0.88,
        status: "parsed",
        suggestedDocumentFamily: "customer-invoice",
        updatedAt: "2026-04-10T01:15:00.000Z",
      }),
    );
    await ingestionJobRepository.put(
      transitionIngestionJob(
        createIngestionJob(
          {
            documentId: "doc_failed",
            id: "job_failed",
            orgId: "org_123",
          },
          "2026-04-10T01:00:00.000Z",
        ),
        "failed",
        "2026-04-10T01:05:00.000Z",
        "Layout parse failed",
      ),
    );
    await ingestionJobRepository.put(
      transitionIngestionJob(
        createIngestionJob(
          {
            documentId: "doc_parsed",
            id: "job_parsed",
            orgId: "org_123",
          },
          "2026-04-10T01:10:00.000Z",
        ),
        "failed",
        "2026-04-10T01:15:00.000Z",
        "Manual stop after parse",
      ),
    );

    const response = await handlePipelinePageRequest(
      new Request("http://localhost/api/pipeline?orgId=org_123&status=failed"),
      {
        documentRepository,
        ingestionJobRepository,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      alert: expect.objectContaining({
        description: "failed-invoice.csv stopped before facts could be prepared.",
      }),
      filters: expect.arrayContaining([
        expect.objectContaining({ id: "attention", active: true, count: 1 }),
      ]),
      runs: [expect.objectContaining({ id: "doc_failed" })],
      sources: [expect.objectContaining({ title: "Gmail / AP inbox" })],
      stats: expect.arrayContaining([
        expect.objectContaining({ label: "Files in scope", value: "1" }),
        expect.objectContaining({ label: "Blocked now", value: "1" }),
      ]),
    });
  });
});
