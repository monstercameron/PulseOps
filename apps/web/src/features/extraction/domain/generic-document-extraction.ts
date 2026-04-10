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
import { type NormalizedTabularSheet } from "@/features/parsing/lib/tabular/normalize-tabular-sheet";
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
      tabularBusinessSummary?: string;
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
      "Extract operator-useful business observations from the source data.",
      "Use a specific supported family only when the evidence is strong; otherwise use generic-business-document.",
      "Prefer known canonical fact types when the source clearly matches them. Otherwise leave canonicalFactTypeId empty and the system will assign a generic document observation type.",
      "If the source exposes a title, heading, statement name, or reporting period, include it.",
      "Prefer document-level totals, margins, balances, date ranges, concentrations, and due-soon signals over row-level trivia.",
      "Prefer facts that answer how much money is involved, what date range is covered, what is overdue or due soon, and what branch, product, region, or customer dominates the result.",
      "Aim for a balanced set: title or period, core totals or margins, one or two rankings, and one risk or timing fact when supported.",
      "Tabular preview:",
      input.tabularPreview,
      ...(input.tabularBusinessSummary === undefined
        ? []
        : ["Computed business summary:", input.tabularBusinessSummary]),
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
    "Return at most 12 observations and prefer fewer when the source does not support that many high-value facts.",
    "Do not hallucinate missing values.",
    "Each observation must include a stable key, a human-readable label, a typed value, a confidence score, and a source locator.",
    "Use ISO 8601 strings for dates or datetimes when possible.",
    "Use locatorType and locator to point back to the evidence.",
    "Use canonicalFactTypeId only when the observation clearly matches a known canonical fact type.",
    "Prioritize title or heading, reporting period, core KPIs, top contributors, and risk or timing facts.",
    "Prefer facts that answer how much money is involved, what date range is covered, what is overdue or due soon, and what branch, product, region, or customer dominates the result.",
    "If the source contains overdue, due-soon, cash-risk, or low-margin facts, include at least one when supported.",
    "Aim for a balanced set: title or period, core totals or margins, one or two rankings, and one risk or timing fact when supported.",
    "Do not spend observation slots on repeated dimension labels, generic labels, or low-signal sample-row facts unless no higher-value fact exists.",
  ].join(" ");
}

export function buildTabularBusinessSummary(
  sheets: readonly NormalizedTabularSheet[],
): string {
  return sheets
    .map((sheet) => {
      const sections = [
        `Sheet summary: ${sheet.name}`,
        `Row count: ${sheet.rowCount}`,
        `Column count: ${sheet.columnCount}`,
      ];
      const numericProfiles = inferNumericProfiles(sheet);
      const dateProfiles = inferDateProfiles(sheet);
      const rankingProfiles = inferRankingProfiles(sheet, numericProfiles);

      if (numericProfiles.length > 0) {
        sections.push("Numeric columns:");
        sections.push(
          ...numericProfiles.map(
            (profile) =>
              `- ${profile.header}: sum=${profile.sum} | avg=${profile.avg} | min=${profile.min} | max=${profile.max}`,
          ),
        );
      }

      if (dateProfiles.length > 0) {
        sections.push("Date columns:");
        sections.push(
          ...dateProfiles.map(
            (profile) =>
              `- ${profile.header}: start=${profile.start} | end=${profile.end}`,
          ),
        );
      }

      if (rankingProfiles.length > 0) {
        sections.push("Top contributors:");
        sections.push(
          ...rankingProfiles.map(
            (profile) =>
              `- ${profile.dimension} by ${profile.metric}: ${profile.values
                .map((value) => `${value.key}=${value.value}`)
                .join("; ")}`,
          ),
        );
      }

      return sections.join("\n");
    })
    .join("\n\n");
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

function inferNumericProfiles(sheet: NormalizedTabularSheet) {
  return sheet.headers
    .map((header) => {
      const values = sheet.records
        .map((record) => parseLooseNumber(record[header]))
        .filter((value): value is number => value !== null);

      if (values.length < Math.max(5, Math.floor(sheet.rowCount * 0.6))) {
        return null;
      }

      return {
        avg: roundToTwoDecimals(average(values)),
        header,
        max: roundToTwoDecimals(Math.max(...values)),
        min: roundToTwoDecimals(Math.min(...values)),
        sum: roundToTwoDecimals(values.reduce((total, value) => total + value, 0)),
      };
    })
    .filter(
      (
        profile,
      ): profile is {
        avg: number;
        header: string;
        max: number;
        min: number;
        sum: number;
      } => profile !== null,
    )
    .sort((left, right) => Math.abs(right.sum) - Math.abs(left.sum))
    .slice(0, 6);
}

function inferDateProfiles(sheet: NormalizedTabularSheet) {
  return sheet.headers
    .map((header) => {
      const values = sheet.records
        .map((record) => normalizeLooseDate(record[header]))
        .filter((value): value is string => value !== null)
        .sort();

      if (values.length < Math.max(5, Math.floor(sheet.rowCount * 0.6))) {
        return null;
      }

      return {
        end: values.at(-1)!,
        header,
        start: values[0]!,
      };
    })
    .filter(
      (
        profile,
      ): profile is {
        end: string;
        header: string;
        start: string;
      } => profile !== null,
    )
    .slice(0, 3);
}

function inferRankingProfiles(
  sheet: NormalizedTabularSheet,
  numericProfiles: readonly Readonly<{
    avg: number;
    header: string;
    max: number;
    min: number;
    sum: number;
  }>[],
) {
  const dimensionHeaders = sheet.headers.filter((header) => {
    const distinctValues = new Set(
      sheet.records.map((record) => record[header]).filter(Boolean),
    );

    return distinctValues.size >= 2 && distinctValues.size <= 12;
  });
  const rankingProfiles: {
    dimension: string;
    metric: string;
    values: {
      key: string;
      value: number;
    }[];
  }[] = [];

  for (const dimensionHeader of dimensionHeaders) {
    for (const numericProfile of numericProfiles.slice(0, 3)) {
      const totals = new Map<string, number>();

      for (const record of sheet.records) {
        const dimensionValue = record[dimensionHeader];
        const numericValue = parseLooseNumber(record[numericProfile.header]);

        if (dimensionValue.length === 0 || numericValue === null) {
          continue;
        }

        totals.set(dimensionValue, (totals.get(dimensionValue) ?? 0) + numericValue);
      }

      const values = Array.from(totals.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, 3)
        .map(([key, value]) => ({
          key,
          value: roundToTwoDecimals(value),
        }));

      if (values.length >= 2) {
        rankingProfiles.push({
          dimension: dimensionHeader,
          metric: numericProfile.header,
          values,
        });
      }
    }
  }

  return rankingProfiles.slice(0, 4);
}

function parseLooseNumber(value: string | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value
    .replace(/[,$%]/g, "")
    .replace(/^\((.*)\)$/, "-$1")
    .trim();
  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function normalizeLooseDate(value: string | undefined) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const trimmedValue = value.trim();
  const slashDateMatch = trimmedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (slashDateMatch !== null) {
    return `${slashDateMatch[3]}-${slashDateMatch[1]!.padStart(2, "0")}-${slashDateMatch[2]!.padStart(2, "0")}`;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmedValue)) {
    return trimmedValue.slice(0, 10);
  }

  const parsedDate = new Date(trimmedValue);

  return Number.isNaN(parsedDate.getTime())
    ? null
    : parsedDate.toISOString().slice(0, 10);
}

function average(values: readonly number[]) {
  return values.length === 0
    ? 0
    : values.reduce((total, value) => total + value, 0) / values.length;
}

function roundToTwoDecimals(value: number) {
  return Number(value.toFixed(2));
}
