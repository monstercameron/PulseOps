import path from "node:path";

import {
  auditLogSchema,
  type AuditLog,
} from "@/features/audit/domain/audit-log";
import { createLocalJsonCollection } from "@/features/persistence/lib/local-json-collection";
import { type AuditLogRepository } from "@/features/audit/repositories/audit-log-repository";

type LocalAuditLogRepositoryOptions = {
  rootDirectory: string;
};

export function createLocalAuditLogRepository({
  rootDirectory,
}: LocalAuditLogRepositoryOptions): AuditLogRepository {
  const collection = createLocalJsonCollection({
    filePath: path.join(rootDirectory, "audit-logs.json"),
    recordSchema: auditLogSchema,
  });

  return {
    async listByOrgId(orgId) {
      const auditLogs = await collection.list();

      return auditLogs.filter((auditLog) => auditLog.orgId === orgId);
    },
    async put(auditLog) {
      return collection.put(auditLogSchema.parse(auditLog));
    },
  };
}

export type { AuditLog };
