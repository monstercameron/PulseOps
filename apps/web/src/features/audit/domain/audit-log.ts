import { z } from "zod";

export const auditLogSchema = z.object({
  action: z.string().min(1),
  actorId: z.string().min(1),
  createdAt: z.string().datetime(),
  entityId: z.string().min(1),
  id: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()),
  orgId: z.string().min(1),
  version: z.literal("audit-log.v1"),
});

export type AuditLog = z.infer<typeof auditLogSchema>;

export function createAuditLog(
  input: Omit<AuditLog, "createdAt" | "version"> & { createdAt?: string },
): AuditLog {
  return auditLogSchema.parse({
    ...input,
    createdAt: input.createdAt ?? new Date().toISOString(),
    version: "audit-log.v1",
  });
}
