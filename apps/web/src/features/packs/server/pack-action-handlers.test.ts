import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createLocalAuditLogRepository } from "@/features/audit/repositories/local-audit-log-repository";
import {
  attachDocumentClassification,
  createUploadedDocument,
  documentSchema,
} from "@/features/documents/domain/document";
import { createLocalDocumentRepository } from "@/features/documents/repositories/local-document-repository";
import { createCanonicalFactRecord } from "@/features/facts/domain/canonical-fact-record";
import { createLocalFactRepository } from "@/features/facts/repositories/local-fact-repository";
import { createLocalFeedbackRepository } from "@/features/feedback/repositories/local-feedback-repository";
import { type DecisionRun } from "@/features/packs/domain/decision-run";
import { type RecommendationRecord } from "@/features/packs/domain/recommendation-record";
import { handlePackDetailRequest } from "@/features/packs/server/handle-pack-detail-request";
import { handlePackExportRequest } from "@/features/packs/server/handle-pack-export-request";
import { handlePackGenerateRequest } from "@/features/packs/server/handle-pack-generate-request";
import { handlePackRecommendationFeedbackRequest } from "@/features/packs/server/handle-pack-recommendation-feedback-request";
import { handlePackReviewRequest } from "@/features/packs/server/handle-pack-review-request";
import { createLocalPackRepository } from "@/features/packs/repositories/local-pack-repository";
import { createCitation } from "@/features/trust/domain/citation";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("pack action handlers", () => {
  it("generates and retrieves a persisted pack", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-pack-generate-"),
    );
    temporaryDirectories.push(rootDirectory);

    const documentRepository = createLocalDocumentRepository({ rootDirectory });
    const factRepository = createLocalFactRepository({ rootDirectory });
    const packRepository = createLocalPackRepository({ rootDirectory });
    const persistedDecisionRuns: DecisionRun[] = [];
    const persistedRecommendations: RecommendationRecord[] = [];
    const uploadedDocument = createUploadedDocument(
      {
        fileName: "invoice-001.csv",
        id: "doc_123",
        orgId: "org_123",
      },
      "2026-04-10T01:00:00.000Z",
    );

    await documentRepository.put(
      documentSchema.parse({
        ...attachDocumentClassification(
          uploadedDocument,
          "customer-invoice",
          0.92,
          "2026-04-10T01:05:00.000Z",
        ),
        status: "extracted",
      }),
    );
    await factRepository.put(
      createCanonicalFactRecord({
        canonicalFactTypeId: "invoice.amount.outstanding",
        citations: [
          createCitation({
            confidenceScore: 0.93,
            documentFamily: "customer-invoice",
            documentId: "doc_123",
            locator: { row: 2 },
            locatorType: "row",
            sourceHash: "sha256:invoice-row",
          }),
        ],
        confidenceScore: 0.93,
        documentFamily: "customer-invoice",
        documentId: "doc_123",
        entityId: "entity_invoice_123",
        entityType: "invoice",
        orgId: "org_123",
        sourceFieldKey: "amount_outstanding",
        value: 2100,
      }),
    );

    const generateResponse = await handlePackGenerateRequest(
      new Request("http://localhost/api/packs", {
        body: JSON.stringify({ orgId: "org_123" }),
        method: "POST",
      }),
      {
        decisionRunRepository: {
          async getById() {
            return null;
          },
          async listByOrgId() {
            return persistedDecisionRuns;
          },
          async put(decisionRun) {
            persistedDecisionRuns.push(decisionRun);

            return decisionRun;
          },
        },
        documentRepository,
        factRepository,
        generateId: () => "pack_generated_123",
        now: () => "2026-04-10T03:00:00.000Z",
        packRepository,
        recommendationRepository: {
          async listByDecisionRunId() {
            return persistedRecommendations;
          },
          async listByOrgId() {
            return persistedRecommendations;
          },
          async put(recommendation) {
            persistedRecommendations.push(recommendation);

            return recommendation;
          },
        },
      },
    );

    expect(generateResponse.status).toBe(201);
    await expect(generateResponse.json()).resolves.toMatchObject({
      jobId: "pack_generated_123",
      pack: expect.objectContaining({
        id: "pack_generated_123",
        orgId: "org_123",
      }),
    });
    expect(persistedDecisionRuns).toEqual([
      expect.objectContaining({
        packId: "pack_generated_123",
        recommendationCount: expect.any(Number),
      }),
    ]);
    expect(persistedRecommendations).not.toHaveLength(0);

    const detailResponse = await handlePackDetailRequest(
      new Request("http://localhost/api/packs/pack_generated_123?orgId=org_123"),
      {
        documentRepository,
        factRepository,
        packRepository,
      },
    );

    expect(detailResponse.status).toBe(200);
    await expect(detailResponse.json()).resolves.toMatchObject({
      pack: expect.objectContaining({
        id: "pack_generated_123",
      }),
    });
  });

  it("marks packs reviewed and exports them", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-pack-review-"),
    );
    temporaryDirectories.push(rootDirectory);

    const packRepository = createLocalPackRepository({ rootDirectory });
    const documentRepository = createLocalDocumentRepository({ rootDirectory });
    const factRepository = createLocalFactRepository({ rootDirectory });

    await packRepository.put({
      accent: "accent",
      generatedAtLabel: "Generated Apr 10, 2026 at 3:00 AM",
      id: "pack_123",
      meta: ["Week of Apr 10, 2026"],
      metrics: [],
      orgId: "org_123",
      recommendations: [],
      sourceData: [],
      statusLabel: "Ready",
      statusTone: "success",
      title: "Cash and Margin Brief",
      updatedAt: "2026-04-10T03:00:00.000Z",
      version: "pack-record.v1",
    });

    const reviewResponse = await handlePackReviewRequest(
      new Request("http://localhost/api/packs/pack_123/review", {
        body: JSON.stringify({ orgId: "org_123" }),
        method: "POST",
      }),
      {
        now: () => "2026-04-10T04:00:00.000Z",
        packRepository,
      },
    );

    expect(reviewResponse.status).toBe(200);
    await expect(reviewResponse.json()).resolves.toMatchObject({
      pack: expect.objectContaining({
        reviewedAt: "2026-04-10T04:00:00.000Z",
      }),
    });

    const exportResponse = await handlePackExportRequest(
      new Request("http://localhost/api/packs/pack_123/export?orgId=org_123"),
      {
        documentRepository,
        factRepository,
        packRepository,
      },
    );

    expect(exportResponse.status).toBe(200);
    await expect(exportResponse.text()).resolves.toContain("Cash and Margin Brief");
  });

  it("records pack recommendation feedback", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-pack-feedback-"),
    );
    temporaryDirectories.push(rootDirectory);

    const feedbackRepository = createLocalFeedbackRepository({ rootDirectory });
    const auditLogRepository = createLocalAuditLogRepository({ rootDirectory });

    const response = await handlePackRecommendationFeedbackRequest(
      new Request(
        "http://localhost/api/packs/pack_123/recommendations/pack_rec_1/feedback",
        {
          body: JSON.stringify({
            action: "accept",
            orgId: "org_123",
          }),
          method: "POST",
        },
      ),
      {
        auditLogRepository,
        feedbackRepository,
        generateId: () => "feedback_or_audit_123",
        now: () => "2026-04-10T05:00:00.000Z",
      },
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      feedbackEvent: expect.objectContaining({
        action: "accept",
        recommendationId: "pack_rec_1",
      }),
    });
    await expect(feedbackRepository.listByOrgId("org_123")).resolves.toEqual([
      expect.objectContaining({
        action: "accept",
        recommendationId: "pack_rec_1",
      }),
    ]);
  });
});
