import { z } from "zod";

import { type DocumentRepository } from "@/features/documents/repositories/document-repository";
import { type FactRepository } from "@/features/facts/repositories/fact-repository";

const documentDetailSearchParamsSchema = z.object({
  orgId: z.string().min(1),
});

type DocumentDetailDependencies = Readonly<{
  documentRepository: DocumentRepository;
  factRepository: FactRepository;
}>;

export async function handleDocumentDetailRequest(
  request: Request,
  dependencies: DocumentDetailDependencies,
) {
  const url = new URL(request.url);
  const parsedSearchParams = documentDetailSearchParamsSchema.safeParse({
    orgId: url.searchParams.get("orgId"),
  });

  if (!parsedSearchParams.success) {
    return Response.json(
      {
        error: "Missing orgId query parameter.",
      },
      { status: 400 },
    );
  }

  const documentId = extractDocumentIdFromPath(url.pathname);

  if (documentId === null) {
    return Response.json(
      {
        error: "Missing documentId path parameter.",
      },
      { status: 400 },
    );
  }

  const document = await dependencies.documentRepository.getById(documentId);

  if (document === null) {
    return Response.json(
      {
        error: "Document not found.",
      },
      { status: 404 },
    );
  }

  if (document.orgId !== parsedSearchParams.data.orgId) {
    return Response.json(
      {
        error: "Document does not belong to the provided orgId.",
      },
      { status: 403 },
    );
  }

  const facts = (await dependencies.factRepository.listByDocumentId(document.id))
    .slice()
    .sort((left, right) => right.confidenceScore - left.confidenceScore)
    .map((fact) => ({
      canonicalFactTypeId: fact.canonicalFactTypeId,
      citations: fact.citations,
      confidenceScore: fact.confidenceScore,
      id: fact.id,
      label: fact.label ?? fact.canonicalFactTypeId,
      sourceFieldKey: fact.sourceFieldKey,
      value: fact.value,
    }));

  return Response.json(
    {
      document,
      facts,
      orgId: parsedSearchParams.data.orgId,
    },
    { status: 200 },
  );
}

function extractDocumentIdFromPath(pathname: string) {
  const pathSegments = pathname.split("/").filter(Boolean);
  const documentId = pathSegments.at(-1);
  const documentsSegment = pathSegments.at(-2);
  const apiSegment = pathSegments.at(-3);

  if (
    apiSegment !== "api" ||
    documentsSegment !== "documents" ||
    documentId === undefined
  ) {
    return null;
  }

  return documentId;
}
