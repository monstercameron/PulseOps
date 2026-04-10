import { randomUUID } from "node:crypto";

import { z } from "zod";

import { createAuditLog, type AuditLog } from "@/features/audit/domain/audit-log";
import { type AuditLogRepository } from "@/features/audit/repositories/audit-log-repository";
import {
  documentStatusSchema,
  transitionDocumentStatus,
} from "@/features/documents/domain/document";
import { type DocumentRepository } from "@/features/documents/repositories/document-repository";

const documentStatusUpdateRequestSchema = z.object({
  actorId: z.string().min(1).optional(),
  orgId: z.string().min(1),
  reason: z.string().trim().min(1).optional(),
  status: documentStatusSchema,
});

type DocumentStatusUpdateDependencies = Readonly<{
  auditLogRepository: AuditLogRepository;
  documentRepository: DocumentRepository;
  generateId?: () => string;
  now?: () => string;
  revalidatePaths?: (paths: readonly string[]) => void | Promise<void>;
}>;

export async function handleDocumentStatusUpdateRequest(
  request: Request,
  dependencies: DocumentStatusUpdateDependencies,
): Promise<Response> {
  const parsedBody = documentStatusUpdateRequestSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return Response.json(
      {
        error: "Invalid document status update payload.",
      },
      { status: 400 },
    );
  }

  const documentId = extractDocumentIdFromRequest(request.url);

  if (documentId === null) {
    return Response.json(
      {
        error: "Missing documentId path parameter.",
      },
      { status: 400 },
    );
  }

  const existingDocument = await dependencies.documentRepository.getById(documentId);

  if (existingDocument === null) {
    return Response.json(
      {
        error: "Document not found.",
      },
      { status: 404 },
    );
  }

  if (existingDocument.orgId !== parsedBody.data.orgId) {
    return Response.json(
      {
        error: "Document does not belong to the provided orgId.",
      },
      { status: 403 },
    );
  }

  const updatedAt = dependencies.now?.() ?? new Date().toISOString();
  let updatedDocument;

  try {
    updatedDocument = transitionDocumentStatus(
      existingDocument,
      parsedBody.data.status,
      updatedAt,
    );
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Invalid document transition.",
      },
      { status: 409 },
    );
  }

  const persistedDocument = await dependencies.documentRepository.put(updatedDocument);
  const auditLog = await persistAuditLog({
    action: "document.status.updated",
    actorId: parsedBody.data.actorId ?? "local-ui",
    auditLogRepository: dependencies.auditLogRepository,
    entityId: persistedDocument.id,
    fromStatus: existingDocument.status,
    generateId: dependencies.generateId,
    orgId: parsedBody.data.orgId,
    reason: parsedBody.data.reason,
    status: persistedDocument.status,
    timestamp: updatedAt,
  });

  await dependencies.revalidatePaths?.(["/pipeline", "/dashboard"]);

  return Response.json(
    {
      auditLogId: auditLog.id,
      document: persistedDocument,
    },
    { status: 200 },
  );
}

function extractDocumentIdFromRequest(urlString: string) {
  const pathname = new URL(urlString).pathname;
  const pathSegments = pathname.split("/").filter(Boolean);

  if (pathSegments.length < 4) {
    return null;
  }

  const statusSegment = pathSegments.at(-1);
  const documentId = pathSegments.at(-2);
  const pipelineSegment = pathSegments.at(-3);
  const apiSegment = pathSegments.at(-4);

  if (
    statusSegment !== "status" ||
    pipelineSegment !== "pipeline" ||
    apiSegment !== "api" ||
    documentId === undefined
  ) {
    return null;
  }

  return documentId;
}

async function persistAuditLog(input: Readonly<{
  action: string;
  actorId: string;
  auditLogRepository: AuditLogRepository;
  entityId: string;
  fromStatus: string;
  generateId?: () => string;
  orgId: string;
  reason?: string;
  status: string;
  timestamp: string;
}>): Promise<AuditLog> {
  const auditLog = createAuditLog({
    action: input.action,
    actorId: input.actorId,
    createdAt: input.timestamp,
    entityId: input.entityId,
    id: input.generateId?.() ?? randomUUID(),
    metadata: {
      fromStatus: input.fromStatus,
      reason: input.reason ?? null,
      status: input.status,
    },
    orgId: input.orgId,
  });

  return input.auditLogRepository.put(auditLog);
}
