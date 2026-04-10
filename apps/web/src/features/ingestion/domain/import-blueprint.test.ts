import { describe, expect, it } from "vitest";

import { createImportBlueprint } from "@/features/ingestion/domain/import-blueprint";

describe("import blueprint", () => {
  it("captures the routing contract for a repeat import shape", () => {
    const blueprint = createImportBlueprint({
      exampleFileNames: ["weekly-cash.csv"],
      id: "blueprint_123",
      name: "Weekly cash export",
      orgId: "org_123",
      parserRoute: "tabular",
      policyId: "policy_123",
      sourceKind: "upload",
      status: "active",
      targetDocumentFamily: "sales_export",
    });

    expect(blueprint).toMatchObject({
      id: "blueprint_123",
      sourceKind: "upload",
      version: "import-blueprint.v1",
    });
  });
});
