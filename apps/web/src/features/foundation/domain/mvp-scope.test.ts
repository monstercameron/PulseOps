import { describe, expect, it } from "vitest";

import { canonicalFactTypeIds } from "@/features/foundation/domain/canonical-facts";
import { supportedDocumentFamilyIds } from "@/features/foundation/domain/document-families";
import {
  getMvpScopeSummary,
  validateMvpScopeReferences,
} from "@/features/foundation/domain/mvp-scope";

describe("mvp scope", () => {
  it("defines the current supported document families", () => {
    expect(supportedDocumentFamilyIds).toHaveLength(11);
    expect(new Set(supportedDocumentFamilyIds).size).toBe(11);
  });

  it("defines the current canonical fact types", () => {
    expect(canonicalFactTypeIds).toHaveLength(25);
    expect(new Set(canonicalFactTypeIds).size).toBe(25);
  });

  it("keeps the first decision pack references valid", () => {
    expect(validateMvpScopeReferences()).toEqual({
      invalidDocumentFamilyIds: [],
      invalidFactTypeIds: [],
      isValid: true,
    });
  });

  it("summarizes the selected MVP scope", () => {
    expect(getMvpScopeSummary()).toEqual({
      canonicalFactTypeCount: 25,
      firstDecisionPackId: "weekly-cash-margin-brief",
      icpId: "field-service-businesses",
      supportedDocumentFamilyCount: 11,
      trustStandardVersion: "citation.v1",
    });
  });
});
