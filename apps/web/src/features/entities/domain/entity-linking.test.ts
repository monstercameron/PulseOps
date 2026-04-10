import { describe, expect, it } from "vitest";

import { createEntitySeedForFact } from "@/features/entities/domain/entity-linking";
import { createExtractionContract } from "@/features/extraction/domain/extraction-contract";
import { createCitation } from "@/features/trust/domain/citation";

describe("entity linking", () => {
  it("links invoice facts to a stable invoice entity using invoice identifiers", () => {
    const contract = createExtractionContract({
      documentFamily: "customer-invoice",
      documentId: "doc_123",
      fields: [
        {
          citations: [
            createCitation({
              confidenceScore: 0.92,
              documentFamily: "customer-invoice",
              documentId: "doc_123",
              locator: { row: 2 },
              locatorType: "row",
              sourceHash: "sha256:invoice-number",
            }),
          ],
          confidenceScore: 0.93,
          key: "invoice_number",
          label: "Invoice number",
          value: "INV-001",
        },
        {
          citations: [
            createCitation({
              confidenceScore: 0.94,
              documentFamily: "customer-invoice",
              documentId: "doc_123",
              locator: { row: 2 },
              locatorType: "row",
              sourceHash: "sha256:invoice-total",
            }),
          ],
          confidenceScore: 0.94,
          key: "invoice_total",
          label: "Invoice total",
          value: 4200,
          canonicalFactTypeId: "invoice.amount.total",
        },
      ],
    });

    expect(
      createEntitySeedForFact({
        contract,
        field: contract.fields[1] as (typeof contract.fields)[number] & {
          canonicalFactTypeId: "invoice.amount.total";
        },
        orgId: "org_123",
      }),
    ).toMatchObject({
      aliases: ["INV-001"],
      canonicalKey: "inv-001",
      displayName: "INV-001",
      entityType: "invoice",
      id: "entity_org_123_invoice_inv-001",
    });
  });

  it("falls back to a document-scoped deterministic key when no identifiers exist", () => {
    const contract = createExtractionContract({
      documentFamily: "job-cost-report",
      documentId: "doc_456",
      fields: [
        {
          citations: [
            createCitation({
              confidenceScore: 0.88,
              documentFamily: "job-cost-report",
              documentId: "doc_456",
              locator: { row: 2 },
              locatorType: "row",
              sourceHash: "sha256:job-margin",
            }),
          ],
          confidenceScore: 0.88,
          key: "gross_margin",
          label: "Gross margin",
          value: 1180,
          canonicalFactTypeId: "job.margin.gross",
        },
      ],
    });

    expect(
      createEntitySeedForFact({
        contract,
        field: contract.fields[0] as (typeof contract.fields)[number] & {
          canonicalFactTypeId: "job.margin.gross";
        },
        orgId: "org_123",
      }),
    ).toMatchObject({
      canonicalKey: "job.margin.gross-doc_456-gross_margin",
      displayName: "job.margin.gross:doc_456:gross_margin",
      entityType: "job",
    });
  });

  it("resolves namespaced row fields against identifiers in the same row scope", () => {
    const contract = createExtractionContract({
      documentFamily: "customer-invoice",
      documentId: "doc_789",
      fields: [
        {
          citations: [
            createCitation({
              confidenceScore: 0.95,
              documentFamily: "customer-invoice",
              documentId: "doc_789",
              locator: { column: "invoice_number", row: 2, sheet: "Sheet1" },
              locatorType: "cell",
              sourceHash: "sha256:sheet1-row2-invoice",
            }),
          ],
          confidenceScore: 0.95,
          key: "sheet1.row_2.invoice_number",
          label: "Invoice number",
          value: "INV-777",
        },
        {
          canonicalFactTypeId: "invoice.amount.outstanding",
          citations: [
            createCitation({
              confidenceScore: 0.96,
              documentFamily: "customer-invoice",
              documentId: "doc_789",
              locator: { column: "amount_due", row: 2, sheet: "Sheet1" },
              locatorType: "cell",
              sourceHash: "sha256:sheet1-row2-amount",
            }),
          ],
          confidenceScore: 0.96,
          key: "sheet1.row_2.amount_outstanding",
          label: "Amount outstanding",
          value: 4200,
        },
      ],
    });

    expect(
      createEntitySeedForFact({
        contract,
        field: contract.fields[1] as (typeof contract.fields)[number] & {
          canonicalFactTypeId: "invoice.amount.outstanding";
        },
        orgId: "org_123",
      }),
    ).toMatchObject({
      aliases: ["INV-777"],
      canonicalKey: "inv-777",
      entityType: "invoice",
    });
  });
});
