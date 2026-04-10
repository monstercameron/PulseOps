import { z } from "zod";

import { type DocumentStatus } from "@/features/documents/domain/document";
import { type DocumentRepository } from "@/features/documents/repositories/document-repository";
import { readDocumentStatusListSearchParam } from "@/features/documents/server/document-query-filters";
import { type FactRepository } from "@/features/facts/repositories/fact-repository";
import { type ParserArtifactRepository } from "@/features/parsing/repositories/parser-artifact-repository";
import { type TextParserArtifactRepository } from "@/features/parsing/repositories/text-parser-artifact-repository";
import { getExplorerPageData } from "@/features/explorer/server/handle-explorer-records-request";

const explorerExportSearchParamsSchema = z.object({
  documentId: z.string().min(1).optional(),
  locale: z.string().trim().min(1).optional(),
  orgId: z.string().min(1),
  query: z.string().trim().optional(),
  status: z.string().min(1).optional(),
  type: z.string().trim().optional(),
});

type ExplorerExportDependencies = Readonly<{
  documentRepository: DocumentRepository;
  factRepository: FactRepository;
  parserArtifactRepository: ParserArtifactRepository;
  textParserArtifactRepository: TextParserArtifactRepository;
}>;

export async function handleExplorerExportRequest(
  request: Request,
  dependencies: ExplorerExportDependencies,
) {
  const url = new URL(request.url);
  const parsedSearchParams = explorerExportSearchParamsSchema.safeParse({
    documentId: url.searchParams.get("documentId") ?? undefined,
    locale: url.searchParams.get("locale") ?? undefined,
    orgId: url.searchParams.get("orgId"),
    query: url.searchParams.get("query") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
  });

  if (!parsedSearchParams.success) {
    return Response.json(
      {
        error: "Invalid explorer export query parameters.",
      },
      { status: 400 },
    );
  }

  const statuses = readDocumentStatusListSearchParam(
    parsedSearchParams.data.status,
  ) as readonly DocumentStatus[] | undefined;
  const data = await getExplorerPageData({
    documentId: parsedSearchParams.data.documentId,
    documentRepository: dependencies.documentRepository,
    factRepository: dependencies.factRepository,
    locale: parsedSearchParams.data.locale,
    orgId: parsedSearchParams.data.orgId,
    parserArtifactRepository: dependencies.parserArtifactRepository,
    statuses,
    textParserArtifactRepository: dependencies.textParserArtifactRepository,
  });
  const filteredRecords = filterExplorerExportRecords(data.records, {
    query: parsedSearchParams.data.query,
    type: parsedSearchParams.data.type,
  });

  return new Response(buildExplorerCsv(filteredRecords), {
    headers: {
      "content-disposition": 'attachment; filename="explorer-records.csv"',
      "content-type": "text/csv; charset=utf-8",
    },
    status: 200,
  });
}

export function filterExplorerExportRecords(
  records: Awaited<ReturnType<typeof getExplorerPageData>>["records"],
  filters: Readonly<{
    query?: string;
    type?: string;
  }>,
) {
  const normalizedQuery = filters.query?.trim().toLowerCase() ?? "";
  const activeType = filters.type?.trim();

  return records.filter((record) => {
    const matchesType =
      activeType === undefined ||
      activeType.length === 0 ||
      activeType === "All records" ||
      record.typeLabel === activeType;

    if (!matchesType) {
      return false;
    }

    if (normalizedQuery.length === 0) {
      return true;
    }

    return `${record.documentName} ${record.documentMeta} ${record.typeLabel} ${record.sourceLabel}`
      .toLowerCase()
      .includes(normalizedQuery);
  });
}

function buildExplorerCsv(
  records: Awaited<ReturnType<typeof getExplorerPageData>>["records"],
) {
  const lines = [
    [
      "id",
      "documentName",
      "documentMeta",
      "sourceLabel",
      "typeLabel",
      "statusLabel",
      "dateLabel",
      "confidenceScore",
      "factsSummary",
    ],
    ...records.map((record) => [
      record.id,
      record.documentName,
      record.documentMeta,
      record.sourceLabel,
      record.typeLabel,
      record.statusLabel,
      record.dateLabel,
      record.confidenceScore === null ? "" : String(record.confidenceScore),
      record.factsSummary,
    ]),
  ];

  return lines.map((line) => line.map(escapeCsvValue).join(",")).join("\n");
}

function escapeCsvValue(value: string) {
  const escapedValue = value.replace(/"/g, '""');

  return `"${escapedValue}"`;
}
