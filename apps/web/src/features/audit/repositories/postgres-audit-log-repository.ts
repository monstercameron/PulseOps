import { type Pool } from "pg";

import {
  auditLogSchema,
  type AuditLog,
} from "@/features/audit/domain/audit-log";
import { type AuditLogRepository } from "@/features/audit/repositories/audit-log-repository";
import {
  fromPostgresTimestamp,
  mapPostgresRows,
  toPostgresJson,
} from "@/features/persistence/postgres/postgres-pool";

type CreatePostgresAuditLogRepositoryInput = Readonly<{
  pool: Pool;
}>;

export function createPostgresAuditLogRepository({
  pool,
}: CreatePostgresAuditLogRepositoryInput): AuditLogRepository {
  return {
    async listByOrgId(orgId) {
      const result = await pool.query(
        `
          select *
          from audit_logs
          where org_id = $1
          order by created_at asc
        `,
        [orgId],
      );

      return mapPostgresRows(result.rows, mapAuditLogRow);
    },
    async put(auditLog) {
      const parsedAuditLog = auditLogSchema.parse(auditLog);

      await pool.query(
        `
          insert into audit_logs (
            id,
            org_id,
            actor_id,
            action,
            entity_id,
            metadata,
            created_at,
            version
          ) values (
            $1, $2, $3, $4, $5, $6::jsonb, $7, $8
          )
          on conflict (id) do update set
            org_id = excluded.org_id,
            actor_id = excluded.actor_id,
            action = excluded.action,
            entity_id = excluded.entity_id,
            metadata = excluded.metadata,
            created_at = excluded.created_at,
            version = excluded.version
        `,
        [
          parsedAuditLog.id,
          parsedAuditLog.orgId,
          parsedAuditLog.actorId,
          parsedAuditLog.action,
          parsedAuditLog.entityId,
          toPostgresJson(parsedAuditLog.metadata),
          parsedAuditLog.createdAt,
          parsedAuditLog.version,
        ],
      );

      return parsedAuditLog;
    },
  };
}

function mapAuditLogRow(row: Record<string, unknown>): AuditLog {
  return auditLogSchema.parse({
    action: row.action,
    actorId: row.actor_id,
    createdAt: fromPostgresTimestamp(row.created_at as Date | string),
    entityId: row.entity_id,
    id: row.id,
    metadata: row.metadata,
    orgId: row.org_id,
    version: row.version,
  });
}
