import { z } from "zod";

import {
  buildCanonicalEntityId,
  canonicalEntityTypeSchema,
  type CanonicalEntityType,
} from "@/features/entities/domain/canonical-entity";
import {
  type ExtractionContract,
  type extractedFieldSchema,
} from "@/features/extraction/domain/extraction-contract";
import { type CanonicalFactTypeId } from "@/features/foundation/domain/canonical-facts";

type EntityResolutionRule = {
  aliasKeys: readonly string[];
  displayKeys: readonly string[];
  identifierKeys: readonly string[];
};

const entityResolutionRules = {
  invoice: {
    aliasKeys: ["invoice_number", "invoice_id", "invoice_no"],
    displayKeys: ["invoice_number", "invoice_id", "invoice_no"],
    identifierKeys: ["invoice_number", "invoice_id", "invoice_no"],
  },
  vendor_bill: {
    aliasKeys: ["bill_number", "vendor_bill_number", "bill_id", "vendor_name"],
    displayKeys: ["bill_number", "vendor_bill_number", "bill_id"],
    identifierKeys: ["bill_number", "vendor_bill_number", "bill_id"],
  },
  bank_transaction: {
    aliasKeys: ["transaction_id", "transaction_reference", "reference"],
    displayKeys: ["transaction_reference", "reference", "transaction_id"],
    identifierKeys: ["transaction_id", "transaction_reference", "reference"],
  },
  job: {
    aliasKeys: ["job_number", "job_id", "job_name"],
    displayKeys: ["job_name", "job_number", "job_id"],
    identifierKeys: ["job_number", "job_id", "job_name"],
  },
  estimate: {
    aliasKeys: ["estimate_number", "quote_number", "estimate_id"],
    displayKeys: ["estimate_number", "quote_number", "estimate_id"],
    identifierKeys: ["estimate_number", "quote_number", "estimate_id"],
  },
  work_order: {
    aliasKeys: ["work_order_number", "work_order_id", "service_order"],
    displayKeys: ["work_order_number", "work_order_id", "service_order"],
    identifierKeys: ["work_order_number", "work_order_id", "service_order"],
  },
  crew: {
    aliasKeys: ["crew_name", "employee_name", "timecard_id"],
    displayKeys: ["crew_name", "employee_name", "timecard_id"],
    identifierKeys: ["crew_name", "employee_name", "timecard_id"],
  },
  payment: {
    aliasKeys: ["payment_reference", "payment_id", "invoice_number"],
    displayKeys: ["payment_reference", "payment_id"],
    identifierKeys: ["payment_reference", "payment_id", "invoice_number"],
  },
  document: {
    aliasKeys: [],
    displayKeys: [],
    identifierKeys: [],
  },
} as const satisfies Record<CanonicalEntityType, EntityResolutionRule>;

const factPrefixEntityTypeMap = {
  invoice: "invoice",
  vendor_bill: "vendor_bill",
  bank_transaction: "bank_transaction",
  job: "job",
  estimate: "estimate",
  work_order: "work_order",
  crew: "crew",
  payment: "payment",
} as const satisfies Record<string, CanonicalEntityType>;

export const linkedEntitySeedSchema = z.object({
  aliases: z.array(z.string().min(1)),
  canonicalKey: z.string().min(1),
  displayName: z.string().min(1),
  entityType: canonicalEntityTypeSchema,
  id: z.string().min(1),
  orgId: z.string().min(1),
});

export type LinkedEntitySeed = z.infer<typeof linkedEntitySeedSchema>;

type FactBackedField = z.infer<typeof extractedFieldSchema> & {
  canonicalFactTypeId: CanonicalFactTypeId;
};

type CreateEntitySeedForFactInput = {
  contract: ExtractionContract;
  field: FactBackedField;
  orgId: string;
};

export function createEntitySeedForFact({
  contract,
  field,
  orgId,
}: CreateEntitySeedForFactInput): LinkedEntitySeed {
  const entityType = getCanonicalEntityTypeForFactType(
    field.canonicalFactTypeId,
  );
  const resolutionRule = entityResolutionRules[entityType];
  const namespacePrefix = getFieldNamespacePrefix(field.key);
  const identifierValue =
    findPreferredFieldValue(
      contract,
      resolutionRule.identifierKeys,
      namespacePrefix,
    ) ??
    buildFallbackIdentityValue(contract.documentId, field);
  const canonicalKey = normalizeEntityKey(identifierValue);
  const displayName =
    findPreferredFieldValue(
      contract,
      resolutionRule.displayKeys,
      namespacePrefix,
    ) ??
    identifierValue;
  const aliases = dedupeStringValues([
    identifierValue,
    ...resolutionRule.aliasKeys
      .map((fieldKey) =>
        findFieldValueByKey(contract, fieldKey, namespacePrefix),
      )
      .filter((value): value is string => value !== null),
  ]);

  return linkedEntitySeedSchema.parse({
    aliases,
    canonicalKey,
    displayName,
    entityType,
    id: buildCanonicalEntityId(entityType, orgId, canonicalKey),
    orgId,
  });
}

export function getCanonicalEntityTypeForFactType(
  canonicalFactTypeId: CanonicalFactTypeId,
): CanonicalEntityType {
  const factPrefix = canonicalFactTypeId.split(".")[0] ?? "";

  if (factPrefix in factPrefixEntityTypeMap) {
    return factPrefixEntityTypeMap[
      factPrefix as keyof typeof factPrefixEntityTypeMap
    ];
  }

  return "document";
}

function findPreferredFieldValue(
  contract: ExtractionContract,
  fieldKeys: readonly string[],
  namespacePrefix: string | null,
): string | null {
  for (const fieldKey of fieldKeys) {
    const value = findFieldValueByKey(contract, fieldKey, namespacePrefix);

    if (value !== null) {
      return value;
    }
  }

  return null;
}

function findFieldValueByKey(
  contract: ExtractionContract,
  fieldKey: string,
  namespacePrefix: string | null,
): string | null {
  const namespacedFieldKey =
    namespacePrefix === null ? null : `${namespacePrefix}.${fieldKey}`;
  const field =
    (namespacedFieldKey === null
      ? undefined
      : contract.fields.find(
          (candidateField) => candidateField.key === namespacedFieldKey,
        )) ??
    contract.fields.find((candidateField) => candidateField.key === fieldKey);

  if (field === undefined) {
    return null;
  }

  if (typeof field.value === "string" && field.value.trim().length > 0) {
    return field.value.trim();
  }

  if (typeof field.value === "number" || typeof field.value === "boolean") {
    return String(field.value);
  }

  if (Array.isArray(field.value) && field.value.length > 0) {
    return field.value[0] ?? null;
  }

  return null;
}

function getFieldNamespacePrefix(fieldKey: string): string | null {
  const lastSeparatorIndex = fieldKey.lastIndexOf(".");

  if (lastSeparatorIndex === -1) {
    return null;
  }

  return fieldKey.slice(0, lastSeparatorIndex);
}

function buildFallbackIdentityValue(
  documentId: string,
  field: FactBackedField,
): string {
  return `${field.canonicalFactTypeId}:${documentId}:${field.key}`;
}

function normalizeEntityKey(value: string): string {
  const normalizedValue = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalizedValue.length > 0 ? normalizedValue : "unknown";
}

function dedupeStringValues(values: readonly string[]): string[] {
  return Array.from(
    new Set(
      values.map((value) => value.trim()).filter((value) => value.length > 0),
    ),
  );
}
