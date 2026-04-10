import { describe, expect, it } from "vitest";

import {
  attachDocumentClassification,
  createUploadedDocument,
  documentSchema,
} from "@/features/documents/domain/document";
import { createCanonicalFactRecord } from "@/features/facts/domain/canonical-fact-record";
import { createCitation } from "@/features/trust/domain/citation";
import {
  buildDashboardFilters,
  filterDashboardDocuments,
  filterDashboardFacts,
  getDashboardStatusLabel,
  hasActiveDashboardFilters,
  readDashboardFilterValues,
} from "@/features/dashboard/lib/dashboard-filters";

describe("dashboard-filters", () => {
  it("reads defaults when search params are missing or invalid", () => {
    expect(
      readDashboardFilterValues({
        dateRange: "invalid",
        documentType: "unknown",
        source: "wrong",
        status: "bad",
      }),
    ).toEqual({
      dateRange: "7d",
      documentType: "all",
      source: "all",
      status: "all",
    });
  });

  it("filters documents and facts across date, source, document type, and status", () => {
    const recentInvoice = documentSchema.parse({
      ...attachDocumentClassification(
        createUploadedDocument(
          {
            fileName: "invoice.csv",
            id: "doc_invoice",
            orgId: "org_123",
            source: "email",
          },
          "2026-04-07T01:00:00.000Z",
        ),
        "customer-invoice",
        0.92,
        "2026-04-08T01:05:00.000Z",
      ),
      status: "failed",
    });
    const oldJobReport = attachDocumentClassification(
      createUploadedDocument(
        {
          fileName: "job-report.csv",
          id: "doc_job",
          orgId: "org_123",
          source: "api",
        },
        "2026-03-01T01:00:00.000Z",
      ),
      "job-cost-report",
      0.88,
      "2026-03-01T01:05:00.000Z",
    );
    const facts = [
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
    ];
    const values = readDashboardFilterValues({
      dateRange: "7d",
      documentType: "customer-invoice",
      source: "email",
      status: "failed",
    });
    const filteredDocuments = filterDashboardDocuments(
      [recentInvoice, oldJobReport],
      values,
      new Date("2026-04-09T12:00:00.000Z"),
    );

    expect(filteredDocuments).toEqual([
      expect.objectContaining({
        id: "doc_invoice",
      }),
    ]);
    expect(filterDashboardFacts(facts, filteredDocuments)).toEqual([
      expect.objectContaining({
        documentId: "doc_invoice",
      }),
    ]);
    expect(hasActiveDashboardFilters(values)).toBe(true);
    expect(getDashboardStatusLabel(values.status)).toBe("Failed");
  });

  it("builds filter controls with the current workspace and available document types", () => {
    const invoiceDocument = attachDocumentClassification(
      createUploadedDocument(
        {
          fileName: "invoice.csv",
          id: "doc_invoice",
          orgId: "org_123",
        },
        "2026-04-07T01:00:00.000Z",
      ),
      "customer-invoice",
      0.92,
      "2026-04-08T01:05:00.000Z",
    );
    const filters = buildDashboardFilters({
      documents: [invoiceDocument],
      organizationName: "Broward HVAC Co.",
      values: readDashboardFilterValues({
        documentType: "customer-invoice",
      }),
    });

    expect(filters.workspaceLabel).toBe("Broward HVAC Co.");
    expect(filters.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "documentType",
          label: "Customer invoice",
          options: expect.arrayContaining([
            expect.objectContaining({
              label: "Customer invoice",
              value: "customer-invoice",
            }),
          ]),
        }),
      ]),
    );
  });

  it("limits source and status options to relevant choices while preserving the active selection", () => {
    const reviewDocument = documentSchema.parse({
      ...attachDocumentClassification(
        createUploadedDocument(
          {
            fileName: "invoice.csv",
            id: "doc_invoice",
            orgId: "org_123",
            source: "email",
          },
          "2026-04-07T01:00:00.000Z",
        ),
        "customer-invoice",
        0.92,
        "2026-04-08T01:05:00.000Z",
      ),
      status: "classified",
    });

    const filters = buildDashboardFilters({
      documents: [reviewDocument],
      organizationName: "Broward HVAC Co.",
      values: readDashboardFilterValues({
        source: "api",
        status: "failed",
      }),
    });

    expect(filters.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "source",
          options: [
            { label: "All sources", value: "all" },
            { label: "Gmail / AP inbox", value: "email" },
            { label: "Connected API", value: "api" },
          ],
          selectedValue: "api",
        }),
        expect.objectContaining({
          id: "status",
          options: [
            { label: "All statuses", value: "all" },
            { label: "Needs review", value: "needs-review" },
            { label: "Failed", value: "failed" },
          ],
          selectedValue: "failed",
        }),
      ]),
    );
  });
});
