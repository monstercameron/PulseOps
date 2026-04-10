import path from "node:path";

import { z } from "zod";

import { inferContentTypeFromSupportedFormat } from "@/features/documents/domain/document-format";
import { supportedDocumentFamilyIdSchema } from "@/features/foundation/domain/document-families";
import { storedObjectSchema } from "@/features/storage/lib/object-storage";

export const documentSourceSchema = z.enum(["upload", "email", "api"]);
export type DocumentSource = z.infer<typeof documentSourceSchema>;
export const documentStatusSchema = z.enum([
  "uploaded",
  "stored",
  "parsed",
  "classified",
  "extracted",
  "failed",
]);

export type DocumentStatus = z.infer<typeof documentStatusSchema>;

const allowedDocumentStatusTransitions: Record<
  DocumentStatus,
  readonly DocumentStatus[]
> = {
  classified: ["extracted", "failed", "uploaded"],
  extracted: ["uploaded"],
  failed: ["uploaded"],
  parsed: ["classified", "failed", "uploaded"],
  stored: ["failed", "parsed", "uploaded"],
  uploaded: ["failed", "stored"],
};

export const documentSchema = z.object({
  archiveAfterDays: z.number().int().positive().optional(),
  classificationConfidenceScore: z.number().finite().min(0).max(1).optional(),
  checksumSha256: z.string().min(1).optional(),
  contentType: z.string().min(1).optional(),
  createdAt: z.string().datetime(),
  fileExtension: z.string().min(1).optional(),
  fileName: z.string().min(1),
  id: z.string().min(1),
  orgId: z.string().min(1),
  parserArtifactId: z.string().min(1).optional(),
  rawObject: storedObjectSchema.optional(),
  retentionPolicyKey: z.string().min(1).optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
  source: documentSourceSchema,
  status: documentStatusSchema,
  suggestedDocumentFamily: supportedDocumentFamilyIdSchema.optional(),
  updatedAt: z.string().datetime(),
});

export type DocumentRecord = z.infer<typeof documentSchema>;

type CreateUploadedDocumentInput = {
  archiveAfterDays?: number;
  contentType?: string;
  fileName: string;
  id: string;
  orgId: string;
  retentionPolicyKey?: string;
  source?: z.infer<typeof documentSourceSchema>;
};

export function createUploadedDocument(
  input: CreateUploadedDocumentInput,
  createdAt = new Date().toISOString(),
): DocumentRecord {
  return documentSchema.parse({
    contentType:
      input.contentType ?? inferContentTypeFromFileName(input.fileName),
    createdAt,
    fileExtension: getFileExtension(input.fileName),
    fileName: input.fileName,
    id: input.id,
    orgId: input.orgId,
    archiveAfterDays: input.archiveAfterDays,
    retentionPolicyKey: input.retentionPolicyKey,
    source: input.source ?? "upload",
    status: "uploaded",
    updatedAt: createdAt,
  });
}

export function attachStoredObjectToDocument(
  document: DocumentRecord,
  storedObject: z.infer<typeof storedObjectSchema>,
  updatedAt = new Date().toISOString(),
): DocumentRecord {
  return documentSchema.parse({
    ...document,
    checksumSha256: storedObject.sha256,
    rawObject: storedObject,
    sizeBytes: storedObject.sizeBytes,
    status: "stored",
    updatedAt,
  });
}

export function detachStoredObjectFromDocument(
  document: DocumentRecord,
  updatedAt = new Date().toISOString(),
): DocumentRecord {
  return documentSchema.parse({
    ...document,
    rawObject: undefined,
    updatedAt,
  });
}

export function markDocumentParsed(
  document: DocumentRecord,
  parserArtifactId: string,
  updatedAt = new Date().toISOString(),
): DocumentRecord {
  return documentSchema.parse({
    ...document,
    parserArtifactId,
    status: "parsed",
    updatedAt,
  });
}

export function markDocumentExtracted(
  document: DocumentRecord,
  updatedAt = new Date().toISOString(),
): DocumentRecord {
  return documentSchema.parse({
    ...document,
    status: "extracted",
    updatedAt,
  });
}

export function attachDocumentClassification(
  document: DocumentRecord,
  documentFamilyId: z.infer<typeof supportedDocumentFamilyIdSchema>,
  confidenceScore: number,
  updatedAt = new Date().toISOString(),
): DocumentRecord {
  return documentSchema.parse({
    ...document,
    classificationConfidenceScore: confidenceScore,
    status: "classified",
    suggestedDocumentFamily: documentFamilyId,
    updatedAt,
  });
}

export function markDocumentFailed(
  document: DocumentRecord,
  updatedAt = new Date().toISOString(),
): DocumentRecord {
  return documentSchema.parse({
    ...document,
    status: "failed",
    updatedAt,
  });
}

export function canTransitionDocumentStatus(
  currentStatus: DocumentStatus,
  nextStatus: DocumentStatus,
): boolean {
  return allowedDocumentStatusTransitions[currentStatus].includes(nextStatus);
}

export function transitionDocumentStatus(
  document: DocumentRecord,
  nextStatus: DocumentStatus,
  updatedAt = new Date().toISOString(),
): DocumentRecord {
  if (!canTransitionDocumentStatus(document.status, nextStatus)) {
    throw new Error(`Invalid document transition: ${document.status} -> ${nextStatus}`);
  }

  return documentSchema.parse({
    ...document,
    classificationConfidenceScore:
      nextStatus === "uploaded" || nextStatus === "stored"
        ? undefined
        : document.classificationConfidenceScore,
    parserArtifactId:
      nextStatus === "uploaded" || nextStatus === "stored"
        ? undefined
        : document.parserArtifactId,
    status: nextStatus,
    suggestedDocumentFamily:
      nextStatus === "uploaded" || nextStatus === "stored"
        ? undefined
        : document.suggestedDocumentFamily,
    updatedAt,
  });
}

export function getFileExtension(fileName: string): string | undefined {
  const extension = path.extname(fileName).trim().toLowerCase();

  if (extension.length === 0) {
    return undefined;
  }

  return extension.replace(/^\./, "");
}

export function inferContentTypeFromFileName(
  fileName: string,
): string | undefined {
  const extension = getFileExtension(fileName);

  if (extension === undefined) {
    return undefined;
  }

  try {
    return inferContentTypeFromSupportedFormat(
      extension as Parameters<typeof inferContentTypeFromSupportedFormat>[0],
    );
  } catch {
    return undefined;
  }
}
