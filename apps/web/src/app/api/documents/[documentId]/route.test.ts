import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const runtime = {
    documentRepository: { name: "documents" },
    entityRepository: { name: "entities" },
    factRepository: { name: "facts" },
    parserArtifactRepository: { name: "parser-artifacts" },
    storage: { name: "storage" },
  };

  return {
    ensureCuratedDocumentsSeeded: vi.fn(),
    handleDocumentDetailRequest: vi.fn(),
    runtime,
  };
});

vi.mock("@/features/foundation/domain/default-workspace", () => ({
  DEFAULT_WORKSPACE: {
    name: "Broward HVAC Co.",
    orgId: "org_123",
  },
}));

vi.mock("@/features/observability/lib/route-logging", () => ({
  createLoggedRouteHandler: ({
    handler,
  }: {
    handler: (request: Request) => Promise<Response>;
  }) => handler,
}));

vi.mock("@/features/documents/server/seed-curated-documents", () => ({
  ensureCuratedDocumentsSeeded: mocks.ensureCuratedDocumentsSeeded,
}));

vi.mock("@/features/documents/server/handle-document-detail-request", () => ({
  handleDocumentDetailRequest: mocks.handleDocumentDetailRequest,
}));

vi.mock("@/features/runtime/local-ingestion-runtime", () => ({
  localIngestionRuntime: mocks.runtime,
}));

describe("/api/documents/[documentId] route", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.ensureCuratedDocumentsSeeded.mockReset();
    mocks.ensureCuratedDocumentsSeeded.mockResolvedValue(undefined);
    mocks.handleDocumentDetailRequest.mockReset();
    mocks.handleDocumentDetailRequest.mockResolvedValue(
      Response.json({ document: { id: "doc_123" }, facts: [], orgId: "org_123" }),
    );
  });

  it("seeds curated documents for the default workspace before fetching a detail record", async () => {
    const { GET } = await import("@/app/api/documents/[documentId]/route");
    const request = new Request(
      "http://localhost/api/documents/doc_123?orgId=org_123",
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mocks.ensureCuratedDocumentsSeeded).toHaveBeenCalledWith({
      documentRepository: mocks.runtime.documentRepository,
      entityRepository: mocks.runtime.entityRepository,
      factRepository: mocks.runtime.factRepository,
      orgId: "org_123",
      parserArtifactRepository: mocks.runtime.parserArtifactRepository,
      storage: mocks.runtime.storage,
    });
    expect(mocks.handleDocumentDetailRequest).toHaveBeenCalledWith(request, {
      documentRepository: mocks.runtime.documentRepository,
      factRepository: mocks.runtime.factRepository,
    });
  });

  it("skips seeding for non-default org detail requests", async () => {
    const { GET } = await import("@/app/api/documents/[documentId]/route");
    const request = new Request(
      "http://localhost/api/documents/doc_123?orgId=org_other",
    );

    await GET(request);

    expect(mocks.ensureCuratedDocumentsSeeded).not.toHaveBeenCalled();
    expect(mocks.handleDocumentDetailRequest).toHaveBeenCalledWith(request, {
      documentRepository: mocks.runtime.documentRepository,
      factRepository: mocks.runtime.factRepository,
    });
  });
});
