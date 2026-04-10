import { createHash } from "node:crypto";

import { z } from "zod";

import {
  type CanonicalFactTypeId,
} from "@/features/foundation/domain/canonical-facts";
import {
  supportedDocumentFamilyIdSchema,
  type SupportedDocumentFamilyId,
} from "@/features/foundation/domain/document-families";
import {
  createExtractionContract,
  type ExtractionContract,
} from "@/features/extraction/domain/extraction-contract";
import { type ParserArtifact } from "@/features/parsing/domain/parser-artifact";
import { type NormalizedTabularSheet } from "@/features/parsing/lib/tabular/normalize-tabular-sheet";
import { createCitation } from "@/features/trust/domain/citation";

export const tabularSemanticValueTypeSchema = z.enum([
  "string",
  "number",
  "boolean",
  "date",
]);

export type TabularSemanticValueType = z.infer<
  typeof tabularSemanticValueTypeSchema
>;

type TabularSemanticFieldSpec = {
  canonicalFactTypeId?: CanonicalFactTypeId;
  description: string;
  key: string;
  label: string;
  valueType: TabularSemanticValueType;
};

const tabularExtractionSpecs = {
  "generic-business-document": [],
  "accounts-receivable-aging-report": [
    {
      description: "The invoice or receivable identifier.",
      key: "invoice_number",
      label: "Invoice number",
      valueType: "string",
    },
    {
      description: "The customer name attached to the receivable.",
      key: "customer_name",
      label: "Customer name",
      valueType: "string",
    },
    {
      canonicalFactTypeId: "invoice.amount.outstanding",
      description: "The open amount still due on the receivable.",
      key: "amount_outstanding",
      label: "Amount outstanding",
      valueType: "number",
    },
    {
      canonicalFactTypeId: "invoice.due_at",
      description: "The receivable due date.",
      key: "due_date",
      label: "Due date",
      valueType: "date",
    },
    {
      canonicalFactTypeId: "invoice.payment_days_late",
      description: "The number of days the receivable is past due.",
      key: "payment_days_late",
      label: "Payment days late",
      valueType: "number",
    },
  ],
  "bank-transaction-export": [
    {
      description: "The transaction identifier or stable reference.",
      key: "transaction_id",
      label: "Transaction ID",
      valueType: "string",
    },
    {
      description: "The transaction reference or memo.",
      key: "transaction_reference",
      label: "Transaction reference",
      valueType: "string",
    },
    {
      canonicalFactTypeId: "bank_transaction.posted_at",
      description: "The date the transaction posted.",
      key: "posted_at",
      label: "Posted at",
      valueType: "date",
    },
    {
      canonicalFactTypeId: "bank_transaction.amount",
      description: "The signed transaction amount.",
      key: "amount",
      label: "Amount",
      valueType: "number",
    },
    {
      canonicalFactTypeId: "bank_transaction.direction",
      description: "Whether the transaction is cash in or cash out.",
      key: "direction",
      label: "Direction",
      valueType: "string",
    },
  ],
  "chart-of-accounts-export": [],
  "customer-invoice": [
    {
      description: "The invoice identifier.",
      key: "invoice_number",
      label: "Invoice number",
      valueType: "string",
    },
    {
      description: "The customer name attached to the invoice.",
      key: "customer_name",
      label: "Customer name",
      valueType: "string",
    },
    {
      canonicalFactTypeId: "invoice.issued_at",
      description: "The invoice issue date.",
      key: "issued_at",
      label: "Issued at",
      valueType: "date",
    },
    {
      canonicalFactTypeId: "invoice.due_at",
      description: "The invoice due date.",
      key: "due_date",
      label: "Due date",
      valueType: "date",
    },
    {
      canonicalFactTypeId: "invoice.amount.total",
      description: "The total billed amount.",
      key: "invoice_total",
      label: "Invoice total",
      valueType: "number",
    },
    {
      canonicalFactTypeId: "invoice.amount.outstanding",
      description: "The unpaid amount still open.",
      key: "amount_outstanding",
      label: "Amount outstanding",
      valueType: "number",
    },
    {
      canonicalFactTypeId: "payment.received_at",
      description: "The payment received date if present.",
      key: "payment_received_at",
      label: "Payment received at",
      valueType: "date",
    },
  ],
  "estimate-or-quote": [
    {
      description: "The estimate or quote identifier.",
      key: "estimate_number",
      label: "Estimate number",
      valueType: "string",
    },
    {
      description: "The customer name attached to the estimate.",
      key: "customer_name",
      label: "Customer name",
      valueType: "string",
    },
    {
      canonicalFactTypeId: "estimate.amount.total",
      description: "The total quoted amount.",
      key: "estimate_total",
      label: "Estimate total",
      valueType: "number",
    },
  ],
  "job-cost-report": [
    {
      description: "The job identifier.",
      key: "job_number",
      label: "Job number",
      valueType: "string",
    },
    {
      description: "The job name.",
      key: "job_name",
      label: "Job name",
      valueType: "string",
    },
    {
      canonicalFactTypeId: "job.revenue.actual",
      description: "The actual job revenue.",
      key: "actual_revenue",
      label: "Actual revenue",
      valueType: "number",
    },
    {
      canonicalFactTypeId: "job.cost.labor",
      description: "The labor cost tied to the job.",
      key: "labor_cost",
      label: "Labor cost",
      valueType: "number",
    },
    {
      canonicalFactTypeId: "job.cost.material",
      description: "The material cost tied to the job.",
      key: "material_cost",
      label: "Material cost",
      valueType: "number",
    },
    {
      canonicalFactTypeId: "job.cost.subcontractor",
      description: "The subcontractor cost tied to the job.",
      key: "subcontractor_cost",
      label: "Subcontractor cost",
      valueType: "number",
    },
    {
      canonicalFactTypeId: "job.margin.gross",
      description: "The gross margin for the job.",
      key: "gross_margin",
      label: "Gross margin",
      valueType: "number",
    },
    {
      canonicalFactTypeId: "job.status",
      description: "The job status.",
      key: "job_status",
      label: "Job status",
      valueType: "string",
    },
  ],
  "payroll-or-timecard-export": [
    {
      description: "The crew name.",
      key: "crew_name",
      label: "Crew name",
      valueType: "string",
    },
    {
      description: "The employee name on the row.",
      key: "employee_name",
      label: "Employee name",
      valueType: "string",
    },
    {
      canonicalFactTypeId: "crew.labor_hours",
      description: "The labor hours on the row.",
      key: "labor_hours",
      label: "Labor hours",
      valueType: "number",
    },
  ],
  "profit-and-loss-statement": [],
  "schedule-or-work-order-export": [
    {
      description: "The work order identifier.",
      key: "work_order_number",
      label: "Work order number",
      valueType: "string",
    },
    {
      description: "The customer name on the work order.",
      key: "customer_name",
      label: "Customer name",
      valueType: "string",
    },
    {
      canonicalFactTypeId: "work_order.scheduled_at",
      description: "The scheduled date and time.",
      key: "scheduled_at",
      label: "Scheduled at",
      valueType: "date",
    },
  ],
  "vendor-bill": [
    {
      description: "The vendor bill identifier.",
      key: "bill_number",
      label: "Bill number",
      valueType: "string",
    },
    {
      description: "The vendor name.",
      key: "vendor_name",
      label: "Vendor name",
      valueType: "string",
    },
    {
      canonicalFactTypeId: "vendor_bill.amount.total",
      description: "The full bill amount.",
      key: "bill_total",
      label: "Bill total",
      valueType: "number",
    },
    {
      canonicalFactTypeId: "vendor_bill.due_at",
      description: "The bill due date.",
      key: "due_date",
      label: "Due date",
      valueType: "date",
    },
  ],
} as const satisfies Record<
  SupportedDocumentFamilyId,
  readonly TabularSemanticFieldSpec[]
>;

const semanticFieldSpecs = Object.values(tabularExtractionSpecs).flat();
const semanticFieldKeys = Array.from(
  new Set(semanticFieldSpecs.map((field) => field.key)),
) as [string, ...string[]];

export const tabularSemanticFieldKeySchema = z.enum(semanticFieldKeys);

export type TabularSemanticFieldKey = z.infer<
  typeof tabularSemanticFieldKeySchema
>;

export const tabularExtractionFieldMappingSchema = z.object({
  confidenceScore: z.number().finite().min(0).max(1),
  semanticKey: tabularSemanticFieldKeySchema,
  sheetName: z.string().min(1),
  sourceFieldKey: z.string().min(1),
});

export const tabularExtractionPlanSchema = z.object({
  documentFamily: supportedDocumentFamilyIdSchema,
  fieldMappings: z.array(tabularExtractionFieldMappingSchema),
  rationale: z.string().trim().min(1).max(2_000),
});

export type TabularExtractionPlan = z.infer<typeof tabularExtractionPlanSchema>;

type BuildTabularExtractionPromptInput = {
  documentFamily: SupportedDocumentFamilyId;
  fileName: string;
  parserArtifact: ParserArtifact;
  sheets: readonly NormalizedTabularSheet[];
};

type MaterializeTabularExtractionContractInput = {
  createdAt?: string;
  documentFamily: SupportedDocumentFamilyId;
  documentId: string;
  plan: TabularExtractionPlan;
  sheets: readonly NormalizedTabularSheet[];
};

const extractionInstructions = [
  "You are extracting structured business facts from a tabular document for the Weekly Cash and Margin Brief.",
  "Return only column-to-semantic mappings for fields that directly exist in the data.",
  "Do not infer missing columns, formulas, or business facts that are not explicitly represented by a source column.",
  "Only use the allowed semantic keys listed for the classified document family.",
  "Choose the exact sheetName and exact normalized sourceFieldKey from the provided tabular input.",
  "Prefer the smallest high-confidence mapping set that supports downstream fact extraction and entity linking.",
].join(" ");

export function getTabularExtractionInstructions(): string {
  return extractionInstructions;
}

export function getTabularExtractionSpecs(
  documentFamily: SupportedDocumentFamilyId,
): readonly TabularSemanticFieldSpec[] {
  return tabularExtractionSpecs[documentFamily];
}

export function supportsTabularExtraction(
  documentFamily: SupportedDocumentFamilyId,
): boolean {
  return getTabularExtractionSpecs(documentFamily).length > 0;
}

export function buildTabularExtractionPrompt({
  documentFamily,
  fileName,
  parserArtifact,
  sheets,
}: BuildTabularExtractionPromptInput): string {
  const fieldSpecs = getTabularExtractionSpecs(documentFamily);
  const allowedMappings =
    fieldSpecs.length === 0
      ? "(none)"
      : fieldSpecs
          .map((field) =>
            [
              `- semanticKey: ${field.key}`,
              `label: ${field.label}`,
              `valueType: ${field.valueType}`,
              `canonicalFactTypeId: ${field.canonicalFactTypeId ?? "none"}`,
              `description: ${field.description}`,
            ].join(" | "),
          )
          .join("\n");
  const renderedSheets = sheets
    .map((sheet) => {
      const sampleRows = JSON.stringify(sheet.records.slice(0, 3), null, 2);

      return [
        `Sheet: ${sheet.name}`,
        `Headers: ${sheet.headers.join(", ")}`,
        `Row count: ${sheet.rowCount}`,
        "Sample rows:",
        sampleRows,
      ].join("\n");
    })
    .join("\n\n");

  return [
    "Classified document family:",
    documentFamily,
    "",
    "Return strict JSON with keys: documentFamily, fieldMappings, rationale.",
    "Each fieldMappings item must contain: sheetName, sourceFieldKey, semanticKey, confidenceScore.",
    "Do not include the same semanticKey more than once per sheet.",
    "Use an empty fieldMappings array if no safe mapping exists.",
    "",
    "Allowed semantic mappings:",
    allowedMappings,
    "",
    `File name: ${fileName}`,
    `Parser kind: ${parserArtifact.parserKind}`,
    `Sheet count: ${parserArtifact.sheetCount}`,
    `Total row count: ${parserArtifact.totalRowCount}`,
    "",
    "Tabular content:",
    renderedSheets,
  ].join("\n");
}

export function validateTabularExtractionPlan(
  plan: TabularExtractionPlan,
  sheets: readonly NormalizedTabularSheet[],
): TabularExtractionPlan {
  const parsedPlan = tabularExtractionPlanSchema.parse(plan);
  const supportedSpecs = getTabularExtractionSpecs(parsedPlan.documentFamily);
  const specKeys = new Set(supportedSpecs.map((field) => field.key));
  const seenMappings = new Set<string>();

  for (const mapping of parsedPlan.fieldMappings) {
    if (!specKeys.has(mapping.semanticKey)) {
      throw new Error(
        `Unsupported semantic key for ${parsedPlan.documentFamily}: ${mapping.semanticKey}`,
      );
    }

    const sheet = sheets.find(
      (candidateSheet) => candidateSheet.name === mapping.sheetName,
    );

    if (sheet === undefined) {
      throw new Error(`Unknown sheet in extraction plan: ${mapping.sheetName}`);
    }

    if (!sheet.headers.includes(mapping.sourceFieldKey)) {
      throw new Error(
        `Unknown source field in extraction plan: ${mapping.sheetName}.${mapping.sourceFieldKey}`,
      );
    }

    const dedupeKey = `${mapping.sheetName}:${mapping.semanticKey}`;

    if (seenMappings.has(dedupeKey)) {
      throw new Error(
        `Duplicate semantic mapping detected for ${mapping.sheetName}.${mapping.semanticKey}`,
      );
    }

    seenMappings.add(dedupeKey);
  }

  return parsedPlan;
}

export function materializeTabularExtractionContract({
  createdAt,
  documentFamily,
  documentId,
  plan,
  sheets,
}: MaterializeTabularExtractionContractInput): ExtractionContract {
  const validatedPlan = validateTabularExtractionPlan(plan, sheets);
  const specByKey = new Map(
    getTabularExtractionSpecs(documentFamily).map((field) => [field.key, field]),
  );
  const fields = validatedPlan.fieldMappings.flatMap((mapping) => {
    const sheet = sheets.find(
      (candidateSheet) => candidateSheet.name === mapping.sheetName,
    );
    const spec = specByKey.get(mapping.semanticKey);

    if (sheet === undefined || spec === undefined) {
      return [];
    }

    return sheet.records.flatMap((record, rowIndex) => {
      const rawValue = record[mapping.sourceFieldKey];

      if (typeof rawValue !== "string" || rawValue.trim().length === 0) {
        return [];
      }

      const value = coerceTabularValue(rawValue, spec.valueType);

      if (value === null) {
        return [];
      }

      const sourceRowNumber = rowIndex + 2;
      const fieldKey = buildTabularFieldKey({
        rowNumber: sourceRowNumber,
        semanticKey: spec.key,
        sheetName: sheet.name,
      });

      return [
        {
          canonicalFactTypeId: spec.canonicalFactTypeId,
          citations: [
            createCitation({
              confidenceScore: mapping.confidenceScore,
              documentFamily,
              documentId,
              excerpt:
                rawValue.trim().length > 0 ? rawValue.trim().slice(0, 180) : undefined,
              locator: {
                column: mapping.sourceFieldKey,
                row: sourceRowNumber,
                sheet: sheet.name,
              },
              locatorType: "cell",
              sourceHash: buildTabularSourceHash({
                documentId,
                rowNumber: sourceRowNumber,
                semanticKey: spec.key,
                sheetName: sheet.name,
                value: rawValue,
              }),
            }),
          ],
          confidenceScore: mapping.confidenceScore,
          key: fieldKey,
          label: spec.label,
          value,
        },
      ];
    });
  });

  return createExtractionContract({
    createdAt,
    documentFamily,
    documentId,
    fields,
  });
}

function buildTabularFieldKey(input: {
  rowNumber: number;
  semanticKey: string;
  sheetName: string;
}): string {
  return `${sanitizeSheetName(input.sheetName)}.row_${input.rowNumber}.${input.semanticKey}`;
}

function buildTabularSourceHash(input: {
  documentId: string;
  rowNumber: number;
  semanticKey: string;
  sheetName: string;
  value: string;
}): string {
  const digest = createHash("sha256")
    .update(
      [
        input.documentId,
        input.sheetName,
        String(input.rowNumber),
        input.semanticKey,
        input.value,
      ].join("|"),
    )
    .digest("hex");

  return `sha256:${digest}`;
}

function sanitizeSheetName(sheetName: string): string {
  const sanitizedSheetName = sheetName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return sanitizedSheetName.length > 0 ? sanitizedSheetName : "sheet";
}

function coerceTabularValue(
  rawValue: string,
  valueType: TabularSemanticValueType,
): string | number | boolean | null {
  const trimmedValue = rawValue.trim();

  if (trimmedValue.length === 0) {
    return null;
  }

  if (valueType === "string") {
    return trimmedValue;
  }

  if (valueType === "boolean") {
    const normalizedValue = trimmedValue.toLowerCase();

    if (["true", "yes", "y", "1"].includes(normalizedValue)) {
      return true;
    }

    if (["false", "no", "n", "0"].includes(normalizedValue)) {
      return false;
    }

    return null;
  }

  if (valueType === "number") {
    const isNegative = /^\(.*\)$/.test(trimmedValue);
    const normalizedValue = trimmedValue
      .replace(/[,$%]/g, "")
      .replace(/^\((.*)\)$/, "$1");
    const parsedValue = Number(normalizedValue);

    if (!Number.isFinite(parsedValue)) {
      return null;
    }

    return isNegative ? parsedValue * -1 : parsedValue;
  }

  const normalizedDateValue = normalizeDateValue(trimmedValue);

  return normalizedDateValue;
}

function normalizeDateValue(value: string): string | null {
  const slashDateMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (slashDateMatch !== null) {
    const month = slashDateMatch[1]!.padStart(2, "0");
    const day = slashDateMatch[2]!.padStart(2, "0");
    const year = slashDateMatch[3]!;

    return `${year}-${month}-${day}`;
  }

  const isoDateMatch = value.match(/^\d{4}-\d{2}-\d{2}(?:[tT ].*)?$/);

  if (isoDateMatch !== null) {
    return value.slice(0, 10);
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString().slice(0, 10);
}
