import { z } from "zod";

import {
  documentStatusSchema,
  type DocumentRecord,
  type DocumentStatus,
} from "@/features/documents/domain/document";

export const documentStatusListSearchParamSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value, context) => {
    const parsedStatuses: DocumentStatus[] = [];

    for (const rawStatus of value.split(",")) {
      const candidateStatus = rawStatus.trim();

      if (candidateStatus.length === 0) {
        continue;
      }

      const parsedStatus = documentStatusSchema.safeParse(candidateStatus);

      if (!parsedStatus.success) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Unsupported document status filter: ${candidateStatus}`,
        });
        return z.NEVER;
      }

      if (!parsedStatuses.includes(parsedStatus.data)) {
        parsedStatuses.push(parsedStatus.data);
      }
    }

    if (parsedStatuses.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one document status must be provided.",
      });
      return z.NEVER;
    }

    return parsedStatuses as readonly DocumentStatus[];
  });

export function readDocumentStatusListSearchParam(
  value: string | null | undefined,
): readonly DocumentStatus[] | undefined {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }

  const parsedStatuses = documentStatusListSearchParamSchema.safeParse(value);

  return parsedStatuses.success ? parsedStatuses.data : undefined;
}

export function matchesDocumentStatusFilter(
  document: Pick<DocumentRecord, "status">,
  statuses?: readonly DocumentStatus[],
) {
  if (statuses === undefined) {
    return true;
  }

  return statuses.includes(document.status);
}
