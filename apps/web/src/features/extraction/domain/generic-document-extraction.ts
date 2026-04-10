import { createHash } from "node:crypto";

import { z } from "zod";

import { createExtractionContract } from "@/features/extraction/domain/extraction-contract";
import {
  canonicalFactTypeIdSchema,
  type CanonicalFactTypeId,
} from "@/features/foundation/domain/canonical-facts";
import {
  supportedDocumentFamilyIds,
  supportedDocumentFamilyIdSchema,
  type SupportedDocumentFamilyId,
} from "@/features/foundation/domain/document-families";
import {
  citationLocatorTypeSchema,
  createCitation,
} from "@/features/trust/domain/citation";

const genericObservationValueSchema = z.union([
  z.string().min(1),
  z.number().finite(),
  z.boolean(),
  z.array(z.string().min(1)).min(1),
]);

export const genericObservationValueTypeSchema = z.enum([
  "text",
  "number",
  "boolean",
  "datetime",
  "list",
]);

export const genericObservationLocatorSchema = z.object({
  column: z.string().trim().min(1).nullable(),
  fieldPath: z.string().trim().min(1).nullable(),
  lineEnd: z.number().int().positive().nullable(),
  lineStart: z.number().int().positive().nullable(),
  page: z.number().int().positive().nullable(),
  reference: z.string().trim().min(1).nullable(),
  row: z.number().int().positive().nullable(),
  sheet: z.string().trim().min(1).nullable(),
});

export const genericDocumentObservationSchema = z.object({
  canonicalFactTypeId: canonicalFactTypeIdSchema.nullable(),
  confidenceScore: z.number().finite().min(0).max(1),
  excerpt: z.string().trim().min(1).max(400).nullable(),
  key: z.string().trim().min(1),
  label: z.string().trim().min(1).max(160),
  locator: genericObservationLocatorSchema,
  locatorType: citationLocatorTypeSchema,
  value: genericObservationValueSchema,
  valueType: genericObservationValueTypeSchema,
});

export const genericDocumentExtractionPlanSchema = z.object({
  documentFamily: supportedDocumentFamilyIdSchema,
  observations: z.array(genericDocumentObservationSchema).max(40),
});

export type GenericDocumentExtractionPlan = z.infer<
  typeof genericDocumentExtractionPlanSchema
>;

type BuildGenericDocumentExtractionPromptInput =
  | {
      documentFamilyHint?: SupportedDocumentFamilyId;
      fileName: string;
      parserRoute: "tabular";
      tabularPreview: string;
    }
  | {
      documentFamilyHint?: SupportedDocumentFamilyId;
      fileName: string;
      parserRoute: "text";
      textPreview: string;
    };

type MaterializeGenericDocumentExtractionContractInput = {
  createdAt: string;
  documentChecksumSha256?: string;
  documentId: string;
  plan: GenericDocumentExtractionPlan;
};

const genericFactTypeByValueType: Record<
  z.infer<typeof genericObservationValueTypeSchema>,
  CanonicalFactTypeId
> = {
  boolean: "document.observation.boolean",
  datetime: "document.observation.datetime",
  list: "document.observation.list",
  number: "document.observation.number",
  text: "document.observation.text",
};

export function buildGenericDocumentExtractionPrompt(
  input: BuildGenericDocumentExtractionPromptInput,
): string {
  const supportedFamiliesBlock = supportedDocumentFamilyIds.join(", ");
  const familyHintBlock =
    input.documentFamilyHint === undefined
      ? "No prior family hint was available."
      : `Prior family hint: ${input.documentFamilyHint}.`;

  if (input.parserRoute === "tabular") {
    return [
      `File name: ${input.fileName}`,
      familyHintBlock,
      `Allowed document families: ${supportedFamiliesBlock}`,
      "Source kind: tabular business export.",
      "Extract explicit business observations from the visible rows only.",
      "Use a specific supported family only when the evidence is strong; otherwise use generic-business-document.",
      "Prefer known canonical fact types when the source clearly matches them. Otherwise leave canonicalFactTypeId empty and the system will assign a generic document observation type.",
      "Tabular preview:",
      input.tabularPreview,
    ].join("\n\n");
  }

  return [
    `File name: ${input.fileName}`,
    familyHintBlock,
    `Allowed document families: ${supportedFamiliesBlock}`,
    "Source kind: parsed business document text.",
    "Extract only explicit business facts present in the text.",
    "Use a specific supported family only when the evidence is strong; otherwise use generic-business-document.",
    "Prefer known canonical fact types when the source clearly matches them. Otherwise leave canonicalFactTypeId empty and the system will assign a generic document observation type.",
    "Text preview with line numbers:",
    input.textPreview,
  ].join("\n\n");
}

export function getGenericDocumentExtractionInstructions(): string {
  return [
    "You extract structured observations from business documents for a decision-support system.",
    "Return at most 40 observations.",
    "Do not hallucinate missing values.",
    "Each observation must include a stable key, a human-readable label, a typed value, a confidence score, and a source locator.",
    "Use ISO 8601 strings for dates or datetimes when possible.",
    "Use locatorType and locator to point back to the evidence.",
    "Use canonicalFactTypeId only when the observation clearly matches a known canonical fact type.",
  ].join(" ");
}

export function materializeGenericDocumentExtractionContract({
  createdAt,
  documentChecksumSha256,
  documentId,
  plan,
}: MaterializeGenericDocumentExtractionContractInput) {
  return createExtractionContract({
    createdAt,
    documentFamily: plan.documentFamily,
    documentId,
    fields: plan.observations.map((observation, observationIndex) => ({
      canonicalFactTypeId:
        observation.canonicalFactTypeId ??
        genericFactTypeByValueType[observation.valueType],
      citations: [
        createCitation({
          confidenceScore: observation.confidenceScore,
          documentFamily: plan.documentFamily,
          documentId,
          excerpt: observation.excerpt ?? undefined,
          locator: materializeLocator(observation.locator),
          locatorType: observation.locatorType,
          sourceHash: buildObservationSourceHash({
            documentChecksumSha256,
            documentId,
            locator: materializeLocator(observation.locator),
            observationIndex,
          }),
        }),
      ],
      confidenceScore: observation.confidenceScore,
      key: sanitizeObservationKey(observation.key, observationIndex),
      label: observation.label,
      value: normalizeObservationValue(observation.value, observation.valueType),
    })),
  });
}

function normalizeObservationValue(
  value: z.infer<typeof genericObservationValueSchema>,
  valueType: z.infer<typeof genericObservationValueTypeSchema>,
) {
  if (Array.isArray(value)) {
    return value;
  }

  if (valueType === "datetime" && typeof value === "string") {
    return value.trim();
  }

  return value;
}

function sanitizeObservationKey(key: string, observationIndex: number): string {
  const normalizedKey = key
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalizedKey.length > 0
    ? normalizedKey
    : `document_observation_${observationIndex + 1}`;
}

function buildObservationSourceHash(input: {
  documentChecksumSha256?: string;
  documentId: string;
  locator: Record<string, number | string>;
  observationIndex: number;
}) {
  return createHash("sha256")
    .update(
      JSON.stringify([
        input.documentChecksumSha256 ?? input.documentId,
        input.locator,
        input.observationIndex,
      ]),
    )
    .digest("hex");
}

function materializeLocator(
  locator: z.infer<typeof genericObservationLocatorSchema>,
): Record<string, number | string> {
  const materializedLocator = Object.fromEntries(
    Object.entries(locator).filter(
      (entry): entry is [string, number | string] => entry[1] !== null,
    ),
  );

  if (Object.keys(materializedLocator).length > 0) {
    return materializedLocator;
  }

  return {
    reference: "source",
  };
}
