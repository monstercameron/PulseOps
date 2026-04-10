import { type AuditLog } from "@/features/audit/domain/audit-log";

export interface AuditLogRepository {
  listByOrgId(orgId: string): Promise<AuditLog[]>;
  put(auditLog: AuditLog): Promise<AuditLog>;
}
