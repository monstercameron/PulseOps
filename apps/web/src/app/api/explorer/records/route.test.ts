import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const runtime = {
    documentRepository: { name: "documents" },
    entityRepository: { name: "entities" },
    factRepository: { name: "facts" },
    parserArtifactRepository: { name: "parser-artifacts" },
    textParserArtifactRepository: { name: "text-parser-artifacts" },
    storage: { name: "storage" },
  };

  return {
    ensureCuratedDocumentsSeeded: vi.fn(),
    handleExplorerRecordsRequest: vi.fn(),
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

vi.mock("@/features/explorer/server/handle-explorer-records-request", () => ({
  handleExplorerRecordsRequest: mocks.handleExplorerRecordsRequest,
}));

vi.mock("@/features/runtime/local-ingestion-runtime", () => ({
  localIngestionRuntime: mocks.runtime,
}));

describe("/api/explorer/records route", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.ensureCuratedDocumentsSeeded.mockReset();
    mocks.ensureCuratedDocumentsSeeded.mockResolvedValue(undefined);
    mocks.handleExplorerRecordsRequest.mockReset();
    mocks.handleExplorerRecordsRequest.mockResolvedValue(
      Response.json({ filters: ["All records"], orgId: "org_123", records: [] }),
    );
  });

  it("seeds curated documents for the default workspace before serving explorer records", async () => {
    const { GET } = await import("@/app/api/explorer/records/route");
    const request = new Request(
      "http://localhost/api/explorer/records?orgId=org_123",
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
    expect(mocks.handleExplorerRecordsRequest).toHaveBeenCalledWith(request, {
      documentRepository: mocks.runtime.documentRepository,
      factRepository: mocks.runtime.factRepository,
      parserArtifactRepository: mocks.runtime.parserArtifactRepository,
      textParserArtifactRepository:
        mocks.runtime.textParserArtifactRepository,
    });
  });

  it("skips seeding for non-default org explorer requests", async () => {
    const { GET } = await import("@/app/api/explorer/records/route");
    const request = new Request(
      "http://localhost/api/explorer/records?orgId=org_other",
    );

    await GET(request);

    expect(mocks.ensureCuratedDocumentsSeeded).not.toHaveBeenCalled();
    expect(mocks.handleExplorerRecordsRequest).toHaveBeenCalledWith(request, {
      documentRepository: mocks.runtime.documentRepository,
      factRepository: mocks.runtime.factRepository,
      parserArtifactRepository: mocks.runtime.parserArtifactRepository,
      textParserArtifactRepository:
        mocks.runtime.textParserArtifactRepository,
    });
  });
});
