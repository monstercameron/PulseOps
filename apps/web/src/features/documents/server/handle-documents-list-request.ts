import { z } from "zod";

import { type DocumentStatus } from "@/features/documents/domain/document";
import { type DocumentRepository } from "@/features/documents/repositories/document-repository";
import {
  documentStatusListSearchParamSchema,
  matchesDocumentStatusFilter,
} from "@/features/documents/server/document-query-filters";
import { type FactRepository } from "@/features/facts/repositories/fact-repository";

const documentsListSearchParamsSchema = z.object({
  orgId: z.string().min(1),
  status: z.preprocess(
    (value) => (typeof value === "string" && value.length > 0 ? value : undefined),
    documentStatusListSearchParamSchema.optional(),
  ),
});

export type DocumentListItem = Readonly<{
  classificationConfidenceScore: number | null;
  contentType: string | null;
  factCount: number;
  fileName: string;
  id: string;
  sizeBytes: number | null;
  source: string;
  status: string;
  suggestedDocumentFamily: string | null;
  updatedAt: string;
}>;

type DocumentsListDependencies = Readonly<{
  documentRepository: DocumentRepository;
  factRepository: FactRepository;
}>;

export async function handleDocumentsListRequest(
  request: Request,
  dependencies: DocumentsListDependencies,
) {
  const url = new URL(request.url);
  const parsedSearchParams = documentsListSearchParamsSchema.safeParse({
    orgId: url.searchParams.get("orgId"),
    status: url.searchParams.get("status"),
  });

  if (!parsedSearchParams.success) {
    return Response.json(
      {
        error: "Invalid documents query parameters.",
      },
      { status: 400 },
    );
  }

  const documents = await listDocumentsForOrg({
    documentRepository: dependencies.documentRepository,
    factRepository: dependencies.factRepository,
    orgId: parsedSearchParams.data.orgId,
    statuses: parsedSearchParams.data.status,
  });

  return Response.json(
    {
      documents,
      orgId: parsedSearchParams.data.orgId,
      totalDocuments: documents.length,
    },
    { status: 200 },
  );
}

export async function listDocumentsForOrg(input: Readonly<{
  documentRepository: DocumentRepository;
  factRepository: FactRepository;
  orgId: string;
  statuses?: readonly DocumentStatus[];
}>): Promise<DocumentListItem[]> {
  const [documents, facts] = await Promise.all([
    input.documentRepository.listByOrgId(input.orgId),
    input.factRepository.listByOrgId(input.orgId),
  ]);

  return documents
    .filter((document) => matchesDocumentStatusFilter(document, input.statuses))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map((document) => ({
      classificationConfidenceScore:
        document.classificationConfidenceScore ?? null,
      contentType: document.contentType ?? null,
      factCount: facts.filter((fact) => fact.documentId === document.id).length,
      fileName: document.fileName,
      id: document.id,
      sizeBytes: document.sizeBytes ?? null,
      source: document.source,
      status: document.status,
      suggestedDocumentFamily: document.suggestedDocumentFamily ?? null,
      updatedAt: document.updatedAt,
    }));
}
