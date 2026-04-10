import { z } from "zod";

import { type DocumentStatus } from "@/features/documents/domain/document";
import { type DocumentRepository } from "@/features/documents/repositories/document-repository";
import {
  documentStatusListSearchParamSchema,
  matchesDocumentStatusFilter,
} from "@/features/documents/server/document-query-filters";
import { type FactRepository } from "@/features/facts/repositories/fact-repository";
import {
  supportedDocumentFamilies,
  type SupportedDocumentFamilyId,
} from "@/features/foundation/domain/document-families";

const explorerSearchParamsSchema = z.object({
  documentId: z.string().min(1).optional(),
  orgId: z.string().min(1),
  status: z.preprocess(
    (value) =>
      typeof value === "string" && value.length > 0 ? value : undefined,
    documentStatusListSearchParamSchema.optional(),
  ),
});

const documentFamilyLabels = new Map(
  supportedDocumentFamilies.map((family) => [family.id, family.label]),
);

type ExplorerRecordFact = Readonly<{
  confidenceScore: number;
  key: string;
  value: string;
}>;

export type ExplorerRecord = Readonly<{
  confidenceScore: number | null;
  dateLabel: string;
  detailCitations: readonly string[];
  detailFacts: readonly ExplorerRecordFact[];
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
}>;

type GetExplorerPageDataInput = ExplorerDependencies &
  Readonly<{
    documentId?: string;
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
  orgId,
  statuses,
}: GetExplorerPageDataInput): Promise<ExplorerPageData> {
  const [allDocuments, allFacts] = await Promise.all([
    documentRepository.listByOrgId(orgId),
    factRepository.listByOrgId(orgId),
  ]);

  const records = allDocuments
    .filter(
      (document) =>
        matchesDocumentStatusFilter(document, statuses) &&
        (documentId === undefined || document.id === documentId),
    )
    .slice()
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map((document) => {
      const facts = allFacts
        .filter((fact) => fact.documentId === document.id)
        .sort((left, right) => right.confidenceScore - left.confidenceScore);
      const confidenceScore =
        document.classificationConfidenceScore ??
        (facts.length > 0
          ? facts.reduce((total, fact) => total + fact.confidenceScore, 0) /
            facts.length
          : null);

      return {
        confidenceScore,
        dateLabel: formatDateLabel(document.updatedAt),
        detailCitations: buildCitationLabels(facts, document.fileName),
        detailFacts: facts.slice(0, 6).map((fact) => ({
          confidenceScore: fact.confidenceScore,
          key: fact.label ?? fact.canonicalFactTypeId,
          value: formatFactValue(fact.value),
        })),
        documentMeta: `${buildSourceLabel(document.source)} - ${formatFileSize(document.sizeBytes)}`,
        documentName: document.fileName,
        factsSummary:
          facts.length === 0
            ? "No extracted facts yet"
            : `${facts.length} extracted fact${facts.length === 1 ? "" : "s"}`,
        id: document.id,
        sourceLabel: buildSourceLabel(document.source),
        statusLabel: buildStatusLabel(document.status),
        statusTone: buildStatusTone(document.status),
        typeLabel: buildDocumentTypeLabel(document.suggestedDocumentFamily),
        typeTone: buildDocumentTypeTone(document.suggestedDocumentFamily),
      } satisfies ExplorerRecord;
    });

  return {
    filters: ["All records", ...buildTypeFilters(records)],
    records,
    summary: buildExplorerSummary(records),
  };
}

function buildTypeFilters(records: readonly ExplorerRecord[]) {
  return Array.from(new Set(records.map((record) => record.typeLabel)));
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

function buildSourceLabel(source: "upload" | "email" | "api") {
  if (source === "email") {
    return "Gmail / AP inbox";
  }

  if (source === "api") {
    return "Connected API";
  }

  return "Manual upload";
}

function buildStatusLabel(status: string) {
  if (status === "failed") {
    return "Failed";
  }

  if (status === "extracted") {
    return "Extracted";
  }

  if (status === "uploaded" || status === "stored") {
    return "Uploaded";
  }

  if (status === "parsed") {
    return "Parsed";
  }

  return "Needs review";
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

function buildDocumentTypeLabel(documentFamily?: SupportedDocumentFamilyId) {
  if (documentFamily !== undefined) {
    return documentFamilyLabels.get(documentFamily) ?? "Document";
  }

  return "Document";
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

function formatDateLabel(isoTimestamp: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(isoTimestamp));
}

function formatFileSize(sizeBytes?: number) {
  if (sizeBytes === undefined) {
    return "size unavailable";
  }

  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(0)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatFactValue(value: string | number | boolean | null | string[]) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value === null) {
    return "null";
  }

  return String(value);
}
