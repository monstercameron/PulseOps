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
    handleDocumentsListRequest: vi.fn(),
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

vi.mock("@/features/documents/server/handle-documents-list-request", () => ({
  handleDocumentsListRequest: mocks.handleDocumentsListRequest,
}));

vi.mock("@/features/runtime/local-ingestion-runtime", () => ({
  localIngestionRuntime: mocks.runtime,
}));

describe("/api/documents route", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.ensureCuratedDocumentsSeeded.mockReset();
    mocks.ensureCuratedDocumentsSeeded.mockResolvedValue(undefined);
    mocks.handleDocumentsListRequest.mockReset();
    mocks.handleDocumentsListRequest.mockResolvedValue(
      Response.json({ documents: [], orgId: "org_123", totalDocuments: 0 }),
    );
  });

  it("seeds curated documents for the default workspace before listing", async () => {
    const { GET } = await import("@/app/api/documents/route");
    const request = new Request("http://localhost/api/documents?orgId=org_123");

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
    expect(mocks.handleDocumentsListRequest).toHaveBeenCalledWith(request, {
      documentRepository: mocks.runtime.documentRepository,
      factRepository: mocks.runtime.factRepository,
    });
  });

  it("skips seeding for non-default org requests", async () => {
    const { GET } = await import("@/app/api/documents/route");
    const request = new Request("http://localhost/api/documents?orgId=org_other");

    await GET(request);

    expect(mocks.ensureCuratedDocumentsSeeded).not.toHaveBeenCalled();
    expect(mocks.handleDocumentsListRequest).toHaveBeenCalledWith(request, {
      documentRepository: mocks.runtime.documentRepository,
      factRepository: mocks.runtime.factRepository,
    });
  });
});
