import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import {
  attachDocumentClassification,
  createUploadedDocument,
  documentSchema,
} from "@/features/documents/domain/document";
import { createLocalDashboardSurfaceRepository } from "@/features/dashboard/repositories/local-dashboard-surface-repository";
import { createLocalDocumentRepository } from "@/features/documents/repositories/local-document-repository";
import { createCanonicalFactRecord } from "@/features/facts/domain/canonical-fact-record";
import { createLocalFactRepository } from "@/features/facts/repositories/local-fact-repository";
import { createQueueEvent } from "@/features/dashboard/domain/queue-event";
import { createLocalQueueEventRepository } from "@/features/dashboard/repositories/local-queue-event-repository";
import { createSavedQuestion } from "@/features/query/domain/saved-question";
import { createQueryPlan } from "@/features/query/domain/query-plan";
import { createLocalSavedQuestionRepository } from "@/features/query/repositories/local-saved-question-repository";
import { handleDashboardPageRequest } from "@/features/dashboard/server/handle-dashboard-page-request";
import { createCitation } from "@/features/trust/domain/citation";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("handleDashboardPageRequest", () => {
  it("returns fallback data when the workspace is empty", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-dashboard-empty-"),
    );
    temporaryDirectories.push(rootDirectory);
    const dashboardSurfaceRepository = createLocalDashboardSurfaceRepository({
      rootDirectory,
    });

    const response = await handleDashboardPageRequest(
      new Request("http://localhost/api/dashboard?orgId=org_123"),
      {
        dashboardSurfaceRepository,
        documentRepository: createLocalDocumentRepository({ rootDirectory }),
        factRepository: createLocalFactRepository({ rootDirectory }),
        savedQuestionRepository: createLocalSavedQuestionRepository({ rootDirectory }),
      },
    );

    expect(response.status).toBe(200);
    await expect(dashboardSurfaceRepository.getByOrgId("org_123")).resolves.toMatchObject({
      pageData: expect.objectContaining({
        metrics: expect.arrayContaining([
          expect.objectContaining({ label: "Files received", value: "52" }),
        ]),
      }),
    });
    await expect(response.json()).resolves.toMatchObject({
      filterSummary: expect.objectContaining({
        globalScopeLabel: "KPI strip covers Broward HVAC Co. over the last 7 days.",
      }),
      filters: {
        controls: expect.arrayContaining([
          expect.objectContaining({
            id: "dateRange",
            label: "Last 7 days",
            selectedValue: "7d",
          }),
          expect.objectContaining({
            id: "source",
            label: "All sources",
            selectedValue: "all",
          }),
        ]),
        workspaceLabel: "Broward HVAC Co.",
      },
      labels: expect.objectContaining({
        businessSummaryEyebrow: "Weekly brief",
        queueTitle: "Operator queue",
        signalsTitle: "Business signals",
      }),
      metrics: expect.arrayContaining([
        expect.objectContaining({ label: "Files received", value: "52" }),
      ]),
      orgId: "org_123",
      queueItems: expect.arrayContaining([
        expect.objectContaining({ typeLabel: "Vendor merge" }),
      ]),
      scopedContent: null,
    });
  });

  it("maps repository data into dashboard metrics and queue items", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-dashboard-data-"),
    );
    temporaryDirectories.push(rootDirectory);

    const dashboardSurfaceRepository = createLocalDashboardSurfaceRepository({
      rootDirectory,
    });
    const documentRepository = createLocalDocumentRepository({ rootDirectory });
    const factRepository = createLocalFactRepository({ rootDirectory });
    const savedQuestionRepository = createLocalSavedQuestionRepository({ rootDirectory });

    const uploadedDocument = createUploadedDocument(
      {
        fileName: "invoice-001.csv",
        id: "doc_123",
        orgId: "org_123",
      },
      "2026-04-10T01:00:00.000Z",
    );
    const classifiedDocument = attachDocumentClassification(
      uploadedDocument,
      "customer-invoice",
      0.92,
      "2026-04-10T01:05:00.000Z",
    );

    await documentRepository.put(
      documentSchema.parse({
        ...classifiedDocument,
        sizeBytes: 2048,
        status: "extracted",
      }),
    );
    await documentRepository.put(
      documentSchema.parse({
        ...createUploadedDocument(
          {
            fileName: "bad-invoice.pdf",
            id: "doc_failed",
            orgId: "org_123",
            source: "email",
          },
          "2026-04-10T02:00:00.000Z",
        ),
        status: "failed",
        updatedAt: "2026-04-10T02:05:00.000Z",
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
    await savedQuestionRepository.put(
      createSavedQuestion({
        id: "saved_question_123",
        orgId: "org_123",
        question: "Which invoices are overdue?",
        queryPlan: createQueryPlan({
          canonicalFactTypeIds: ["invoice.amount.outstanding"],
          entityTypes: ["invoice"],
          limit: 5,
          needsClarification: false,
          orgId: "org_123",
          question: "Which invoices are overdue?",
          rationale: "Outstanding invoice amount should surface overdue AR.",
          retrievalMode: "facts",
        }),
      }),
    );

    const response = await handleDashboardPageRequest(
      new Request("http://localhost/api/dashboard?orgId=org_123"),
      {
        dashboardSurfaceRepository,
        documentRepository,
        factRepository,
        savedQuestionRepository,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      filterSummary: expect.objectContaining({
        globalScopeLabel: "KPI strip covers Broward HVAC Co. over the last 7 days.",
        scopedResultsLabel: "Activity, queue, and signals show all document activity in that window.",
      }),
      labels: expect.objectContaining({
        actions: expect.objectContaining({
          primary: "Upload files",
          secondary: "Open weekly brief",
        }),
      }),
      metrics: expect.arrayContaining([
        expect.objectContaining({ label: "Files received", value: "2" }),
        expect.objectContaining({ label: "Critical failures", value: "1" }),
        expect.objectContaining({ label: "In-scope facts", value: "1" }),
      ]),
      queueItems: expect.arrayContaining([
        expect.objectContaining({ typeLabel: "Parse failure" }),
      ]),
      scopedContent: null,
      signals: expect.arrayContaining([
        expect.objectContaining({ label: "Pipeline risk", value: "1" }),
        expect.objectContaining({ label: "Fact coverage", value: "1" }),
      ]),
    });
  });

  it("applies dashboard search filters to live data", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-dashboard-filtered-"),
    );
    temporaryDirectories.push(rootDirectory);

    const dashboardSurfaceRepository = createLocalDashboardSurfaceRepository({
      rootDirectory,
    });
    const documentRepository = createLocalDocumentRepository({ rootDirectory });
    const factRepository = createLocalFactRepository({ rootDirectory });
    const savedQuestionRepository = createLocalSavedQuestionRepository({ rootDirectory });

    await documentRepository.put(
      documentSchema.parse({
        ...attachDocumentClassification(
          createUploadedDocument(
            {
              fileName: "invoice-001.csv",
              id: "doc_invoice",
              orgId: "org_123",
              source: "email",
            },
            "2026-04-08T01:00:00.000Z",
          ),
          "customer-invoice",
          0.92,
          "2026-04-08T01:05:00.000Z",
        ),
        status: "failed",
      }),
    );
    await documentRepository.put(
      documentSchema.parse({
        ...attachDocumentClassification(
          createUploadedDocument(
            {
              fileName: "job-report.csv",
              id: "doc_job",
              orgId: "org_123",
              source: "api",
            },
            "2026-04-08T03:00:00.000Z",
          ),
          "job-cost-report",
          0.88,
          "2026-04-08T03:05:00.000Z",
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
            documentId: "doc_invoice",
            locator: { row: 2 },
            locatorType: "row",
            sourceHash: "sha256:invoice-row",
          }),
        ],
        confidenceScore: 0.93,
        documentFamily: "customer-invoice",
        documentId: "doc_invoice",
        entityId: "entity_invoice_123",
        entityType: "invoice",
        orgId: "org_123",
        sourceFieldKey: "amount_outstanding",
        value: 2100,
      }),
    );

    const response = await handleDashboardPageRequest(
      new Request(
        "http://localhost/api/dashboard?orgId=org_123&dateRange=all&source=email&documentType=customer-invoice&status=failed",
      ),
      {
        dashboardSurfaceRepository,
        documentRepository,
        factRepository,
        savedQuestionRepository,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      businessSummary: expect.objectContaining({
        title: "Broward HVAC Co. filtered dashboard snapshot",
      }),
      filterSummary: expect.objectContaining({
        globalScopeLabel: "KPI strip covers Broward HVAC Co. over all time.",
        scopedResultsLabel:
          "Activity, queue, and signals are narrowed to Gmail / AP inbox, customer invoice, and failed. 1 matching document in scope.",
      }),
      filters: {
        controls: expect.arrayContaining([
          expect.objectContaining({ id: "dateRange", selectedValue: "all" }),
          expect.objectContaining({ id: "source", selectedValue: "email" }),
          expect.objectContaining({
            id: "documentType",
            selectedValue: "customer-invoice",
          }),
          expect.objectContaining({ id: "status", selectedValue: "failed" }),
        ]),
      },
      metrics: expect.arrayContaining([
        expect.objectContaining({ label: "Files received", value: "2" }),
        expect.objectContaining({ label: "Critical failures", value: "1" }),
        expect.objectContaining({ label: "Extracted docs", value: "1" }),
      ]),
      queueItems: expect.arrayContaining([
        expect.objectContaining({ typeLabel: "Parse failure" }),
      ]),
      recentActivity: expect.arrayContaining([
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({ id: "doc_invoice" }),
          ]),
        }),
      ]),
      scopedContent: expect.objectContaining({
        items: [
          expect.objectContaining({
            id: "doc_invoice",
            title: "invoice-001.csv",
          }),
        ],
        title: "Scoped records",
      }),
      signals: expect.arrayContaining([
        expect.objectContaining({ label: "Pipeline risk", value: "1" }),
        expect.objectContaining({ label: "Fact coverage", value: "1" }),
      ]),
    });
  });

  it("keeps KPI cards on the time window while narrowing the lower dashboard surfaces", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-dashboard-time-window-"),
    );
    temporaryDirectories.push(rootDirectory);

    const dashboardSurfaceRepository = createLocalDashboardSurfaceRepository({
      rootDirectory,
    });
    const documentRepository = createLocalDocumentRepository({ rootDirectory });
    const factRepository = createLocalFactRepository({ rootDirectory });
    const savedQuestionRepository = createLocalSavedQuestionRepository({ rootDirectory });

    await documentRepository.put(
      documentSchema.parse({
        ...attachDocumentClassification(
          createUploadedDocument(
            {
              fileName: "invoice-001.csv",
              id: "doc_failed_recent",
              orgId: "org_123",
              source: "email",
            },
            "2026-04-07T01:00:00.000Z",
          ),
          "customer-invoice",
          0.92,
          "2026-04-07T01:05:00.000Z",
        ),
        status: "failed",
      }),
    );
    await documentRepository.put(
      documentSchema.parse({
        ...attachDocumentClassification(
          createUploadedDocument(
            {
              fileName: "job-report.csv",
              id: "doc_extracted_recent",
              orgId: "org_123",
              source: "api",
            },
            "2026-04-08T03:00:00.000Z",
          ),
          "job-cost-report",
          0.88,
          "2026-04-08T03:05:00.000Z",
        ),
        status: "extracted",
      }),
    );

    const response = await handleDashboardPageRequest(
      new Request(
        "http://localhost/api/dashboard?orgId=org_123&dateRange=30d&status=extracted",
      ),
      {
        dashboardSurfaceRepository,
        documentRepository,
        factRepository,
        savedQuestionRepository,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      filterSummary: expect.objectContaining({
        globalScopeLabel: "KPI strip covers Broward HVAC Co. over the last 30 days.",
        scopedResultsLabel:
          "Activity, queue, and signals are narrowed to extracted. 1 matching document in scope.",
      }),
      metrics: expect.arrayContaining([
        expect.objectContaining({ label: "Files received", value: "2" }),
        expect.objectContaining({ label: "Critical failures", value: "1" }),
        expect.objectContaining({ label: "Extracted docs", value: "1" }),
      ]),
      queueItems: [],
      recentActivity: expect.arrayContaining([
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({ id: "doc_extracted_recent" }),
          ]),
        }),
      ]),
      scopedContent: expect.objectContaining({
        items: [
          expect.objectContaining({
            id: "doc_extracted_recent",
            title: "job-report.csv",
          }),
        ],
      }),
      signals: expect.arrayContaining([
        expect.objectContaining({ label: "Pack readiness", value: "1" }),
        expect.objectContaining({ label: "Pipeline risk", value: "Clear" }),
      ]),
    });
  });

  it("filters resolved queue items out of the live dashboard queue", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-dashboard-queue-filter-"),
    );
    temporaryDirectories.push(rootDirectory);

    const dashboardSurfaceRepository = createLocalDashboardSurfaceRepository({
      rootDirectory,
    });
    const documentRepository = createLocalDocumentRepository({ rootDirectory });
    const factRepository = createLocalFactRepository({ rootDirectory });
    const queueEventRepository = createLocalQueueEventRepository({ rootDirectory });
    const savedQuestionRepository = createLocalSavedQuestionRepository({ rootDirectory });

    await documentRepository.put(
      documentSchema.parse({
        ...createUploadedDocument(
          {
            fileName: "bad-invoice.pdf",
            id: "doc_failed",
            orgId: "org_123",
            source: "email",
          },
          "2026-04-10T02:00:00.000Z",
        ),
        status: "failed",
        updatedAt: "2026-04-10T02:05:00.000Z",
      }),
    );
    await queueEventRepository.put(
      createQueueEvent({
        action: "Dismiss",
        actorId: "user_123",
        id: "queue_event_123",
        itemId: "failed-documents",
        orgId: "org_123",
        resolvedAt: "2026-04-10T02:06:00.000Z",
      }),
    );

    const response = await handleDashboardPageRequest(
      new Request("http://localhost/api/dashboard?orgId=org_123"),
      {
        dashboardSurfaceRepository,
        documentRepository,
        factRepository,
        queueEventRepository,
        savedQuestionRepository,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      queueItems: [],
    });
  });

  it("filters resolved seeded queue items out of the empty dashboard state", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-dashboard-seeded-queue-filter-"),
    );
    temporaryDirectories.push(rootDirectory);

    const dashboardSurfaceRepository = createLocalDashboardSurfaceRepository({
      rootDirectory,
    });
    const documentRepository = createLocalDocumentRepository({ rootDirectory });
    const factRepository = createLocalFactRepository({ rootDirectory });
    const queueEventRepository = createLocalQueueEventRepository({ rootDirectory });
    const savedQuestionRepository = createLocalSavedQuestionRepository({ rootDirectory });

    await queueEventRepository.put(
      createQueueEvent({
        action: "Dismiss",
        actorId: "user_123",
        id: "queue_event_seeded_123",
        itemId: "queue_parse_failure",
        orgId: "org_123",
        resolvedAt: "2026-04-10T02:06:00.000Z",
      }),
    );

    const response = await handleDashboardPageRequest(
      new Request("http://localhost/api/dashboard?orgId=org_123"),
      {
        dashboardSurfaceRepository,
        documentRepository,
        factRepository,
        queueEventRepository,
        savedQuestionRepository,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      queueItems: expect.not.arrayContaining([
        expect.objectContaining({ id: "queue_parse_failure" }),
      ]),
    });
  });

  it("returns a live empty state when filters are active without matching data", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-dashboard-filter-empty-"),
    );
    temporaryDirectories.push(rootDirectory);

    const dashboardSurfaceRepository = createLocalDashboardSurfaceRepository({
      rootDirectory,
    });

    const response = await handleDashboardPageRequest(
      new Request("http://localhost/api/dashboard?orgId=org_123&source=email"),
      {
        dashboardSurfaceRepository,
        documentRepository: createLocalDocumentRepository({ rootDirectory }),
        factRepository: createLocalFactRepository({ rootDirectory }),
        savedQuestionRepository: createLocalSavedQuestionRepository({ rootDirectory }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      businessSummary: expect.objectContaining({
        title: "Broward HVAC Co. dashboard is waiting for its first upload",
      }),
      filterSummary: expect.objectContaining({
        scopedResultsLabel:
          "Activity, queue, and signals are narrowed to Gmail / AP inbox. 0 matching documents in scope.",
      }),
      metrics: expect.arrayContaining([
        expect.objectContaining({ label: "Files received", value: "0" }),
        expect.objectContaining({ label: "Critical failures", value: "0" }),
      ]),
      queueItems: [],
      scopedContent: expect.objectContaining({
        description:
          "No matching records are currently driving the filtered activity, queue, and signals below.",
        items: [],
      }),
    });
  });
});
