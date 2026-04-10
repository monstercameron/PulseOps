import {
  canonicalFactTypeIds,
  isCanonicalFactTypeId,
} from "@/features/foundation/domain/canonical-facts";
import {
  isSupportedDocumentFamilyId,
  supportedDocumentFamilyIds,
} from "@/features/foundation/domain/document-families";
import { weeklyCashMarginBrief } from "@/features/brief/domain/weekly-cash-margin-brief";

export const defaultIcp = {
  id: "field-service-businesses",
  label: "Field-service businesses",
  description:
    "Owner-led and operator-led local service businesses with jobs, crews, receivables, and vendor spend spread across multiple systems.",
} as const;

export const mvpScope = {
  canonicalFactTypeIds,
  defaultIcp,
  firstDecisionPack: weeklyCashMarginBrief,
  supportedDocumentFamilyIds,
  trustStandardVersion: "citation.v1",
} as const;

export function validateMvpScopeReferences() {
  const invalidDocumentFamilyIds =
    weeklyCashMarginBrief.supportedDocumentFamilies.filter(
      (documentFamilyId) => !isSupportedDocumentFamilyId(documentFamilyId),
    );
  const invalidFactTypeIds = weeklyCashMarginBrief.coreFactTypes.filter(
    (factTypeId) => !isCanonicalFactTypeId(factTypeId),
  );

  return {
    invalidDocumentFamilyIds,
    invalidFactTypeIds,
    isValid:
      invalidDocumentFamilyIds.length === 0 && invalidFactTypeIds.length === 0,
  };
}

export function getMvpScopeSummary() {
  return {
    canonicalFactTypeCount: canonicalFactTypeIds.length,
    firstDecisionPackId: weeklyCashMarginBrief.id,
    icpId: defaultIcp.id,
    supportedDocumentFamilyCount: supportedDocumentFamilyIds.length,
    trustStandardVersion: mvpScope.trustStandardVersion,
  };
}
