import { z } from "zod";

import { type DocumentRepository } from "@/features/documents/repositories/document-repository";
import { type ObjectStorage } from "@/features/storage/lib/object-storage";

const documentDownloadSearchParamsSchema = z.object({
  orgId: z.string().min(1),
});

type DocumentDownloadDependencies = Readonly<{
  documentRepository: DocumentRepository;
  storage: ObjectStorage;
}>;

export async function handleDocumentDownloadRequest(
  request: Request,
  dependencies: DocumentDownloadDependencies,
) {
  const url = new URL(request.url);
  const parsedSearchParams = documentDownloadSearchParamsSchema.safeParse({
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

  const documentId = extractDocumentIdFromDownloadPath(url.pathname);

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

  if (document.rawObject === undefined) {
    return Response.json(
      {
        error:
          "The original file was not retained for download. Enable uploaded source-file retention in Settings before future uploads.",
      },
      { status: 404 },
    );
  }

  try {
    const body = await dependencies.storage.getObject(document.rawObject.key);

    return new Response(new Uint8Array(body), {
      headers: {
        "cache-control": "no-store",
        "content-disposition": buildAttachmentHeaderValue(document.fileName),
        "content-length": String(body.byteLength),
        "content-type":
          document.rawObject.contentType ??
          document.contentType ??
          "application/octet-stream",
      },
      status: 200,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return Response.json(
        {
          error: "The stored file could not be found.",
        },
        { status: 404 },
      );
    }

    throw error;
  }
}

function extractDocumentIdFromDownloadPath(pathname: string) {
  const pathSegments = pathname.split("/").filter(Boolean);
  const downloadSegment = pathSegments.at(-1);
  const documentId = pathSegments.at(-2);
  const documentsSegment = pathSegments.at(-3);
  const apiSegment = pathSegments.at(-4);

  if (
    apiSegment !== "api" ||
    documentsSegment !== "documents" ||
    downloadSegment !== "download" ||
    documentId === undefined
  ) {
    return null;
  }

  return documentId;
}

function buildAttachmentHeaderValue(fileName: string) {
  const sanitizedFileName = fileName.replace(/["\r\n]/g, "_");

  return `attachment; filename="${sanitizedFileName}"`;
}
