import { z } from "zod";

import {
  type DocumentRecord,
  type DocumentStatus,
} from "@/features/documents/domain/document";
import { type DocumentRepository } from "@/features/documents/repositories/document-repository";
import {
  documentStatusListSearchParamSchema,
  matchesDocumentStatusFilter,
} from "@/features/documents/server/document-query-filters";
import {
  buildFactEvidenceSummary,
  buildFactExcerpt,
  formatFactValue,
  getCanonicalFactTypeDefinition,
  resolveFactDescription,
  resolveFactLabel,
} from "@/features/facts/domain/fact-presentation";
import { type FactRepository } from "@/features/facts/repositories/fact-repository";
import {
  type SupportedDocumentFamilyId,
} from "@/features/foundation/domain/document-families";
import { getDefaultUiMessages } from "@/features/i18n/constants/default-ui-translation-bundles";
import {
  getUiDocumentFamilyLabel,
  getUiSourceLabel,
  getUiStatusLabel,
} from "@/features/i18n/lib/data-labels";
import { type ParserArtifact } from "@/features/parsing/domain/parser-artifact";
import { type TextParserArtifact } from "@/features/parsing/domain/text-parser-artifact";
import { type ParserArtifactRepository } from "@/features/parsing/repositories/parser-artifact-repository";
import { type TextParserArtifactRepository } from "@/features/parsing/repositories/text-parser-artifact-repository";

const explorerSearchParamsSchema = z.object({
  documentId: z.string().min(1).optional(),
  orgId: z.string().min(1),
  status: z.preprocess(
    (value) =>
      typeof value === "string" && value.length > 0 ? value : undefined,
    documentStatusListSearchParamSchema.optional(),
  ),
});

type ExplorerRecordDetailField = Readonly<{
  label: string;
  value: string;
}>;

type ExplorerRecordFact = Readonly<{
  canonicalFactTypeId: string;
  confidenceScore: number;
  description: string;
  evidenceLabel: string;
  excerpt?: string;
  key: string;
  sourceFieldKey: string;
  value: string;
}>;

type ExplorerRecordKeyFinding = Readonly<{
  detail: string;
  label: string;
  value: string;
}>;

export type ExplorerRecord = Readonly<{
  confidenceScore: number | null;
  dateLabel: string;
  detailCitations: readonly string[];
  detailDocumentFields: readonly ExplorerRecordDetailField[];
  detailFacts: readonly ExplorerRecordFact[];
  detailKeyFindings: readonly ExplorerRecordKeyFinding[];
  detailParserFields: readonly ExplorerRecordDetailField[];
  downloadAvailable: boolean;
  documentMeta: string;
  documentName: string;
  factsSummary: string;
  id: string;
  sourceLabel: string;
  statusLabel: string;
  statusTone: "danger" | "neutral" | "success" | "warning";
  typeLabel: string;
  typeTone: "info" | "neutral" | "warning";
}>;

export type ExplorerPageData = Readonly<{
  filters: readonly string[];
  records: readonly ExplorerRecord[];
  summary: Readonly<{
    averageConfidence: string;
    needsReviewCount: string;
    totalRecords: string;
  }>;
}>;

type ExplorerDependencies = Readonly<{
  documentRepository: DocumentRepository;
  factRepository: FactRepository;
  parserArtifactRepository: ParserArtifactRepository;
  textParserArtifactRepository: TextParserArtifactRepository;
}>;

type GetExplorerPageDataInput = ExplorerDependencies &
  Readonly<{
    documentId?: string;
    locale?: string;
    orgId: string;
    statuses?: readonly DocumentStatus[];
  }>;

export async function handleExplorerRecordsRequest(
  request: Request,
  dependencies: ExplorerDependencies,
): Promise<Response> {
  const url = new URL(request.url);
  const parsedSearchParams = explorerSearchParamsSchema.safeParse({
    documentId: url.searchParams.get("documentId") ?? undefined,
    orgId: url.searchParams.get("orgId"),
    status: url.searchParams.get("status"),
  });

  if (!parsedSearchParams.success) {
    if (url.searchParams.get("orgId") === null) {
      return Response.json(
        {
          error: "Missing orgId query parameter.",
        },
        { status: 400 },
      );
    }

    return Response.json(
      {
        error: "Invalid explorer query parameters.",
      },
      { status: 400 },
    );
  }

  const data = await getExplorerPageData({
    ...dependencies,
    documentId: parsedSearchParams.data.documentId,
    orgId: parsedSearchParams.data.orgId,
    statuses: parsedSearchParams.data.status,
  });

  return Response.json({
    orgId: parsedSearchParams.data.orgId,
    ...data,
  });
}

export async function getExplorerPageData({
  documentId,
  documentRepository,
  factRepository,
  locale = "en-US",
  orgId,
  parserArtifactRepository,
  statuses,
  textParserArtifactRepository,
}: GetExplorerPageDataInput): Promise<ExplorerPageData> {
  const messages = getDefaultUiMessages(locale);
  const [allDocuments, allFacts] = await Promise.all([
    documentRepository.listByOrgId(orgId),
    factRepository.listByOrgId(orgId),
  ]);
  const factsByDocumentId = groupFactsByDocumentId(allFacts);

  const records = await Promise.all(
    allDocuments
      .filter(
        (document) =>
          matchesDocumentStatusFilter(document, statuses) &&
          (documentId === undefined || document.id === documentId),
      )
      .slice()
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map(async (document) => {
        const facts =
          factsByDocumentId.get(document.id)?.slice().sort((left, right) => {
            if (right.confidenceScore !== left.confidenceScore) {
              return right.confidenceScore - left.confidenceScore;
            }

            return left.id.localeCompare(right.id);
          }) ?? [];
        const confidenceScore =
          document.classificationConfidenceScore ??
          (facts.length > 0
            ? facts.reduce((total, fact) => total + fact.confidenceScore, 0) /
              facts.length
            : null);
        const parserContext = await resolveDocumentArtifact(document, {
          parserArtifactRepository,
          textParserArtifactRepository,
        });

        return {
          confidenceScore,
          dateLabel: formatDateLabel(document.updatedAt, locale),
          detailCitations: buildCitationLabels(facts, document.fileName),
          detailDocumentFields: buildDetailDocumentFields({
            confidenceScore,
            document,
            locale,
            messages,
            parserContext,
          }),
          detailFacts: buildDetailFacts(facts, locale).slice(0, 10),
          detailKeyFindings: buildDetailKeyFindings(facts, locale),
          detailParserFields: buildDetailParserFields({
            locale,
            messages,
            parserContext,
          }),
          downloadAvailable: document.rawObject !== undefined,
          documentMeta: `${buildSourceLabel(messages, document.source)} - ${formatFileSize(document.sizeBytes, messages.dataLabels.generic.sizeUnavailable)}`,
          documentName: document.fileName,
          factsSummary: buildFactsSummary(facts),
          id: document.id,
          sourceLabel: buildSourceLabel(messages, document.source),
          statusLabel: buildStatusLabel(messages, document.status),
          statusTone: buildStatusTone(document.status),
          typeLabel: buildDocumentTypeLabel(
            messages,
            document.suggestedDocumentFamily,
          ),
          typeTone: buildDocumentTypeTone(document.suggestedDocumentFamily),
        } satisfies ExplorerRecord;
      }),
  );

  return {
    filters: [messages.explorerPage.allRecords, ...buildTypeFilters(records)],
    records,
    summary: buildExplorerSummary(records),
  };
}

type ExplorerFactRecord = Awaited<ReturnType<FactRepository["listByOrgId"]>>[number];

type ResolvedDocumentArtifact =
  | Readonly<{
      artifact: ParserArtifact;
      kind: "tabular";
    }>
  | Readonly<{
      artifact: TextParserArtifact;
      kind: "text";
    }>
  | null;

function groupFactsByDocumentId(facts: readonly ExplorerFactRecord[]) {
  const factsByDocumentId = new Map<string, ExplorerFactRecord[]>();

  for (const fact of facts) {
    const existingFacts = factsByDocumentId.get(fact.documentId);

    if (existingFacts === undefined) {
      factsByDocumentId.set(fact.documentId, [fact]);
      continue;
    }

    existingFacts.push(fact);
  }

  return factsByDocumentId;
}

async function resolveDocumentArtifact(
  document: DocumentRecord,
  input: Readonly<{
    parserArtifactRepository: ParserArtifactRepository;
    textParserArtifactRepository: TextParserArtifactRepository;
  }>,
): Promise<ResolvedDocumentArtifact> {
  if (document.parserArtifactId !== undefined) {
    const parserArtifact = await input.parserArtifactRepository.getById(
      document.parserArtifactId,
    );

    if (parserArtifact !== null) {
      return {
        artifact: parserArtifact,
        kind: "tabular",
      };
    }

    const textParserArtifact =
      await input.textParserArtifactRepository.getById(document.parserArtifactId);

    if (textParserArtifact !== null) {
      return {
        artifact: textParserArtifact,
        kind: "text",
      };
    }
  }

  const [parserArtifacts, textParserArtifacts] = await Promise.all([
    input.parserArtifactRepository.listByDocumentId(document.id),
    input.textParserArtifactRepository.listByDocumentId(document.id),
  ]);
  const latestParserArtifact = parserArtifacts.at(-1);

  if (latestParserArtifact !== undefined) {
    return {
      artifact: latestParserArtifact,
      kind: "tabular",
    };
  }

  const latestTextParserArtifact = textParserArtifacts.at(-1);

  if (latestTextParserArtifact !== undefined) {
    return {
      artifact: latestTextParserArtifact,
      kind: "text",
    };
  }

  return null;
}

function buildTypeFilters(records: readonly ExplorerRecord[]) {
  return Array.from(new Set(records.map((record) => record.typeLabel)));
}

function buildDetailDocumentFields(input: Readonly<{
  confidenceScore: number | null;
  document: DocumentRecord;
  locale: string;
  messages: ReturnType<typeof getDefaultUiMessages>;
  parserContext: ResolvedDocumentArtifact;
}>): ExplorerRecordDetailField[] {
  const detailFields: ExplorerRecordDetailField[] = [
    {
      label: "Title",
      value: input.document.fileName,
    },
    {
      label: "Heading",
      value: resolveDocumentHeading(input.document, input.parserContext),
    },
    {
      label: "Document ID",
      value: input.document.id,
    },
    {
      label: "Source",
      value: buildSourceLabel(input.messages, input.document.source),
    },
    {
      label: "Document class",
      value: buildDocumentTypeLabel(
        input.messages,
        input.document.suggestedDocumentFamily,
      ),
    },
    {
      label: "Status",
      value: buildStatusLabel(input.messages, input.document.status),
    },
    {
      label: "Confidence",
      value: formatConfidenceScore(
        input.confidenceScore,
        input.messages.dataLabels.generic.unavailable,
      ),
    },
    {
      label: "Created",
      value: formatDateTimeLabel(input.document.createdAt, input.locale),
    },
    {
      label: "Updated",
      value: formatDateTimeLabel(input.document.updatedAt, input.locale),
    },
    {
      label: "File size",
      value: formatFileSize(
        input.document.sizeBytes,
        input.messages.dataLabels.generic.sizeUnavailable,
      ),
    },
    {
      label: "Original file",
      value:
        input.document.rawObject === undefined
          ? "Not retained for download"
          : "Available for download",
    },
  ];

  if (input.document.contentType !== undefined) {
    detailFields.push({
      label: "Content type",
      value: input.document.contentType,
    });
  }

  if (input.document.checksumSha256 !== undefined) {
    detailFields.push({
      label: "Checksum",
      value: abbreviateHash(input.document.checksumSha256),
    });
  }

  if (input.document.rawObject?.key !== undefined) {
    detailFields.push({
      label: "Storage key",
      value: input.document.rawObject.key,
    });
  }

  return detailFields;
}

function buildDetailParserFields(input: Readonly<{
  locale: string;
  messages: ReturnType<typeof getDefaultUiMessages>;
  parserContext: ResolvedDocumentArtifact;
}>): ExplorerRecordDetailField[] {
  if (input.parserContext === null) {
    return [
      {
        label: "Parser metadata",
        value: input.messages.dataLabels.generic.noParserArtifact,
      },
    ];
  }

  if (input.parserContext.kind === "text") {
    return [
      {
        label: "Parser kind",
        value: input.parserContext.artifact.parserKind.toUpperCase(),
      },
      {
        label: "Parser artifact ID",
        value: input.parserContext.artifact.id,
      },
      {
        label: "Title / heading",
        value:
          extractTextHeading(input.parserContext.artifact.text) ??
          input.messages.dataLabels.generic.unavailable,
      },
      {
        label: "Section count",
        value: formatInteger(
          input.parserContext.artifact.sectionCount,
          input.locale,
        ),
      },
      {
        label: "Text length",
        value: formatInteger(
          input.parserContext.artifact.textLength,
          input.locale,
        ),
      },
      {
        label: "OCR fallback",
        value: input.parserContext.artifact.usedOcrFallback
          ? input.messages.dataLabels.generic.used
          : input.messages.dataLabels.generic.notUsed,
      },
    ];
  }

  const primarySheet = input.parserContext.artifact.sheets[0];
  const otherSheetNames = input.parserContext.artifact.sheets
    .slice(1)
    .map((sheet) => sheet.name);
  const detailFields: ExplorerRecordDetailField[] = [
    {
      label: "Parser kind",
      value: input.parserContext.artifact.parserKind.toUpperCase(),
    },
    {
      label: "Parser artifact ID",
      value: input.parserContext.artifact.id,
    },
    {
      label: "Primary heading",
      value: primarySheet?.name ?? input.messages.dataLabels.generic.unavailable,
    },
    {
      label: "Sheet count",
      value: formatInteger(input.parserContext.artifact.sheetCount, input.locale),
    },
    {
      label: "Total rows",
      value: formatInteger(
        input.parserContext.artifact.totalRowCount,
        input.locale,
      ),
    },
  ];

  if (primarySheet !== undefined) {
    detailFields.push(
      {
        label: "Primary column count",
        value: formatInteger(primarySheet.columnCount, input.locale),
      },
      {
        label: "Column headings",
        value: primarySheet.headers.join(", "),
      },
    );
  }

  if (otherSheetNames.length > 0) {
    detailFields.push({
      label: "Other sheet headings",
      value: otherSheetNames.join(", "),
    });
  }

  return detailFields;
}

function buildExplorerSummary(records: readonly ExplorerRecord[]) {
  const confidenceScores = records
    .map((record) => record.confidenceScore)
    .filter((score): score is number => score !== null);
  const averageConfidence =
    confidenceScores.length === 0
      ? "--"
      : (
          confidenceScores.reduce((total, score) => total + score, 0) /
          confidenceScores.length
        ).toFixed(2);

  return {
    averageConfidence,
    needsReviewCount: String(
      records.filter((record) => record.statusTone === "warning").length,
    ),
    totalRecords: String(records.length),
  };
}

function buildSourceLabel(
  messages: ReturnType<typeof getDefaultUiMessages>,
  source: "upload" | "email" | "api",
) {
  return getUiSourceLabel(messages, source);
}

function buildStatusLabel(
  messages: ReturnType<typeof getDefaultUiMessages>,
  status: string,
) {
  if (status === "failed") {
    return getUiStatusLabel(messages, "failed");
  }

  if (status === "extracted") {
    return getUiStatusLabel(messages, "extracted");
  }

  if (status === "uploaded" || status === "stored") {
    return getUiStatusLabel(messages, "uploaded");
  }

  if (status === "parsed") {
    return getUiStatusLabel(messages, "needs-review");
  }

  return getUiStatusLabel(messages, "needs-review");
}

function buildStatusTone(status: string): ExplorerRecord["statusTone"] {
  if (status === "failed") {
    return "danger";
  }

  if (status === "extracted") {
    return "success";
  }

  if (status === "parsed" || status === "classified") {
    return "warning";
  }

  return "neutral";
}

function buildDocumentTypeLabel(
  messages: ReturnType<typeof getDefaultUiMessages>,
  documentFamily?: SupportedDocumentFamilyId,
) {
  return getUiDocumentFamilyLabel(messages, documentFamily);
}

function buildDocumentTypeTone(
  documentFamily?: SupportedDocumentFamilyId,
): ExplorerRecord["typeTone"] {
  if (
    documentFamily === "customer-invoice" ||
    documentFamily === "job-cost-report"
  ) {
    return "info";
  }

  if (documentFamily === "vendor-bill") {
    return "warning";
  }

  return "neutral";
}

function buildCitationLabels(
  facts: Awaited<ReturnType<FactRepository["listByOrgId"]>>,
  documentName: string,
) {
  return Array.from(
    new Set(
      facts
        .flatMap((fact) => fact.citations)
        .slice(0, 6)
        .map((citation) => {
          const firstLocatorEntry = Object.entries(citation.locator)[0];

          if (firstLocatorEntry === undefined) {
            return `${documentName} - ${citation.locatorType}`;
          }

          return `${documentName} - ${firstLocatorEntry[0]} ${firstLocatorEntry[1]}`;
        }),
    ),
  );
}

function buildDetailFacts(
  facts: readonly ExplorerFactRecord[],
  locale: string,
): ExplorerRecordFact[] {
  return facts
    .slice()
    .sort((left, right) => compareFactsForDisplay(left, right))
    .map((fact) => ({
      canonicalFactTypeId: fact.canonicalFactTypeId,
      confidenceScore: fact.confidenceScore,
      description: resolveFactDescription(fact.canonicalFactTypeId),
      evidenceLabel: buildFactEvidenceSummary(fact.citations),
      excerpt: buildFactExcerpt(fact.citations),
      key: resolveFactLabel({
        canonicalFactTypeId: fact.canonicalFactTypeId,
        label: fact.label,
        sourceFieldKey: fact.sourceFieldKey,
      }),
      sourceFieldKey: fact.sourceFieldKey,
      value: formatFactValue({
        canonicalFactTypeId: fact.canonicalFactTypeId,
        label: fact.label,
        locale,
        sourceFieldKey: fact.sourceFieldKey,
        value: fact.value,
      }),
    }));
}

function buildDetailKeyFindings(
  facts: readonly ExplorerFactRecord[],
  locale: string,
): ExplorerRecordKeyFinding[] {
  const groupedFacts = new Map<string, ExplorerFactRecord[]>();

  for (const fact of facts) {
    const label = resolveFactLabel({
      canonicalFactTypeId: fact.canonicalFactTypeId,
      label: fact.label,
      sourceFieldKey: fact.sourceFieldKey,
    });
    const groupKey = `${fact.canonicalFactTypeId}:${label}`;
    const existingGroup = groupedFacts.get(groupKey);

    if (existingGroup === undefined) {
      groupedFacts.set(groupKey, [fact]);
      continue;
    }

    existingGroup.push(fact);
  }

  return Array.from(groupedFacts.values())
    .map((group) => summarizeFactGroup(group, locale))
    .sort((left, right) => right.priority - left.priority)
    .slice(0, 4)
    .map(({ detail, label, value }) => ({
      detail,
      label,
      value,
    }));
}

function summarizeFactGroup(
  group: readonly ExplorerFactRecord[],
  locale: string,
): ExplorerRecordKeyFinding & Readonly<{ priority: number }> {
  const sampleFact = group[0]!;
  const resolvedLabel = resolveFactLabel({
    canonicalFactTypeId: sampleFact.canonicalFactTypeId,
    label: sampleFact.label,
    sourceFieldKey: sampleFact.sourceFieldKey,
  });
  const formattedValues = group.map((fact) =>
    formatFactValue({
      canonicalFactTypeId: fact.canonicalFactTypeId,
      label: fact.label,
      locale,
      sourceFieldKey: fact.sourceFieldKey,
      value: fact.value,
    }),
  );
  const numericValues = group
    .map((fact) => (typeof fact.value === "number" ? fact.value : null))
    .filter((value): value is number => value !== null);
  const stringValues = group
    .map((fact) => (typeof fact.value === "string" ? fact.value : null))
    .filter((value): value is string => value !== null);
  const averageConfidence = average(
    group.map((fact) => fact.confidenceScore),
  ).toFixed(2);
  const evidenceLabel = buildFactEvidenceSummary(sampleFact.citations);
  const firstDefinition = getCanonicalFactTypeDefinition(
    sampleFact.canonicalFactTypeId,
  );
  const priority = scoreFactGroup(sampleFact, resolvedLabel);

  if (numericValues.length === group.length && numericValues.length > 1) {
    return {
      detail: `${group.length} values / avg confidence ${averageConfidence}`,
      label: resolvedLabel,
      priority,
      value: summarizeNumericFinding(sampleFact, resolvedLabel, numericValues, locale),
    };
  }

  if (stringValues.length === group.length && looksLikeDateGroup(stringValues)) {
    return {
      detail:
        stringValues.length === 1
          ? `${firstDefinition?.description ?? "Document timing detail"} / ${evidenceLabel}`
          : `${stringValues.length} dates found / avg confidence ${averageConfidence}`,
      label: resolvedLabel,
      priority,
      value: summarizeDateFinding(stringValues, locale),
    };
  }

  return {
    detail:
      group.length === 1
        ? `${firstDefinition?.description ?? "Document fact"} / ${evidenceLabel}`
        : `${group.length} values found / avg confidence ${averageConfidence}`,
    label: resolvedLabel,
    priority,
    value:
      group.length === 1
        ? formattedValues[0]!
        : summarizeTextFinding(formattedValues),
  };
}

function buildFactsSummary(facts: readonly ExplorerFactRecord[]) {
  if (facts.length === 0) {
    return "No facts extracted yet";
  }

  const topLabels = buildDetailKeyFindings(facts, "en-US")
    .slice(0, 2)
    .map((finding) => finding.label);

  if (topLabels.length === 0) {
    return `${facts.length} fact${facts.length === 1 ? "" : "s"}`;
  }

  return `${facts.length} fact${facts.length === 1 ? "" : "s"}: ${topLabels.join(", ")}`;
}

function formatDateLabel(isoTimestamp: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(isoTimestamp));
}

function formatDateTimeLabel(isoTimestamp: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(isoTimestamp));
}

function formatFileSize(sizeBytes: number | undefined, unavailableLabel: string) {
  if (sizeBytes === undefined) {
    return unavailableLabel;
  }

  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(0)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatInteger(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}

function formatConfidenceScore(
  value: number | null,
  unavailableLabel = "Unavailable",
) {
  if (value === null) {
    return unavailableLabel;
  }

  return value.toFixed(2);
}

function compareFactsForDisplay(
  left: ExplorerFactRecord,
  right: ExplorerFactRecord,
) {
  const priorityDifference =
    scoreFactGroup(
      left,
      resolveFactLabel({
        canonicalFactTypeId: left.canonicalFactTypeId,
        label: left.label,
        sourceFieldKey: left.sourceFieldKey,
      }),
    ) -
    scoreFactGroup(
      right,
      resolveFactLabel({
        canonicalFactTypeId: right.canonicalFactTypeId,
        label: right.label,
        sourceFieldKey: right.sourceFieldKey,
      }),
    );

  if (priorityDifference !== 0) {
    return priorityDifference * -1;
  }

  if (right.confidenceScore !== left.confidenceScore) {
    return right.confidenceScore - left.confidenceScore;
  }

  return left.id.localeCompare(right.id);
}

function scoreFactGroup(
  fact: ExplorerFactRecord,
  resolvedLabel: string,
) {
  switch (fact.canonicalFactTypeId) {
    case "invoice.amount.outstanding":
    case "invoice.payment_days_late":
    case "vendor_bill.amount.total":
    case "vendor_bill.due_at":
      return 100;
    case "invoice.amount.total":
    case "bank_transaction.amount":
    case "job.revenue.actual":
    case "job.margin.gross":
    case "estimate.amount.total":
      return 92;
    case "invoice.due_at":
    case "invoice.issued_at":
    case "bank_transaction.posted_at":
    case "work_order.scheduled_at":
    case "payment.received_at":
      return 84;
    case "job.cost.labor":
    case "job.cost.material":
    case "job.cost.subcontractor":
    case "crew.labor_hours":
      return 76;
    default:
      return /\b(total|revenue|profit|balance|outstanding|due|late|margin|cost|cash)\b/i.test(
        resolvedLabel,
      )
        ? 68
        : 54;
  }
}

function summarizeNumericFinding(
  fact: ExplorerFactRecord,
  resolvedLabel: string,
  values: readonly number[],
  locale: string,
) {
  const sum = values.reduce((total, value) => total + value, 0);

  if (values.length === 1) {
    return formatFactValue({
      canonicalFactTypeId: fact.canonicalFactTypeId,
      label: fact.label,
      locale,
      sourceFieldKey: fact.sourceFieldKey,
      value: values[0]!,
    });
  }

  if (fact.canonicalFactTypeId === "invoice.payment_days_late") {
    return `${new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
    }).format(Math.max(...values))} days late max`;
  }

  if (fact.canonicalFactTypeId === "crew.labor_hours") {
    return `${new Intl.NumberFormat(locale, {
      maximumFractionDigits: Number.isInteger(sum) ? 0 : 2,
    }).format(sum)} total hours`;
  }

  if (isCurrencyLikeFact(fact, resolvedLabel)) {
    return `${new Intl.NumberFormat(locale, {
      currency: "USD",
      maximumFractionDigits: 2,
      style: "currency",
    }).format(sum)} total`;
  }

  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: Number.isInteger(sum) ? 0 : 2,
  }).format(sum)} total`;
}

function summarizeDateFinding(values: readonly string[], locale: string) {
  const parsedDates = values
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((left, right) => left.getTime() - right.getTime());

  if (parsedDates.length === 0) {
    return values[0]!;
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (parsedDates.length === 1) {
    return formatter.format(parsedDates[0]!);
  }

  return `${formatter.format(parsedDates[0]!)} to ${formatter.format(parsedDates.at(-1)!)}`;
}

function summarizeTextFinding(values: readonly string[]) {
  const uniqueValues = Array.from(new Set(values.filter((value) => value.length > 0)));

  if (uniqueValues.length === 0) {
    return "No value captured";
  }

  if (uniqueValues.length === 1) {
    return uniqueValues[0]!;
  }

  return uniqueValues.slice(0, 3).join(", ");
}

function looksLikeDateGroup(values: readonly string[]) {
  return values.every((value) => !Number.isNaN(new Date(value).getTime()));
}

function isCurrencyLikeFact(
  fact: ExplorerFactRecord,
  resolvedLabel: string,
) {
  return (
    fact.canonicalFactTypeId === "invoice.amount.total" ||
    fact.canonicalFactTypeId === "invoice.amount.outstanding" ||
    fact.canonicalFactTypeId === "vendor_bill.amount.total" ||
    fact.canonicalFactTypeId === "bank_transaction.amount" ||
    fact.canonicalFactTypeId === "job.revenue.actual" ||
    fact.canonicalFactTypeId === "job.cost.labor" ||
    fact.canonicalFactTypeId === "job.cost.material" ||
    fact.canonicalFactTypeId === "job.cost.subcontractor" ||
    fact.canonicalFactTypeId === "job.margin.gross" ||
    fact.canonicalFactTypeId === "estimate.amount.total" ||
    (fact.canonicalFactTypeId === "document.observation.number" &&
      /\b(total|revenue|profit|balance|outstanding|margin|cost|cash)\b/i.test(
        resolvedLabel,
      ))
  );
}

function average(values: readonly number[]) {
  return values.length === 0
    ? 0
    : values.reduce((total, value) => total + value, 0) / values.length;
}

function resolveDocumentHeading(
  document: DocumentRecord,
  parserContext: ResolvedDocumentArtifact,
) {
  if (parserContext?.kind === "tabular") {
    return (
      parserContext.artifact.sheets[0]?.name ??
      stripFileExtension(document.fileName)
    );
  }

  if (parserContext?.kind === "text") {
    return (
      extractTextHeading(parserContext.artifact.text) ??
      stripFileExtension(document.fileName)
    );
  }

  return stripFileExtension(document.fileName);
}

function stripFileExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex <= 0) {
    return fileName;
  }

  return fileName.slice(0, lastDotIndex);
}

function extractTextHeading(text: string) {
  const heading = text
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (heading === undefined) {
    return null;
  }

  return heading.length <= 120 ? heading : `${heading.slice(0, 117)}...`;
}

function abbreviateHash(hash: string) {
  if (hash.length <= 24) {
    return hash;
  }

  return `${hash.slice(0, 12)}...${hash.slice(-8)}`;
}
