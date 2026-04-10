import { describe, expect, it } from "vitest";

import {
  createUploadedDocument,
  markDocumentExtracted,
} from "@/features/documents/domain/document";

describe("document domain", () => {
  it("marks parsed documents as extracted", () => {
    const uploadedDocument = createUploadedDocument({
      fileName: "customer-invoice.csv",
      id: "doc_123",
      orgId: "org_123",
    });

    expect(
      markDocumentExtracted(
        {
          ...uploadedDocument,
          parserArtifactId: "artifact_123",
          status: "parsed",
        },
        "2026-04-09T22:25:00.000Z",
      ),
    ).toMatchObject({
      status: "extracted",
      updatedAt: "2026-04-09T22:25:00.000Z",
    });
  });
});
