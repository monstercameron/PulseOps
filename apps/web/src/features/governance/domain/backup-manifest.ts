import { z } from "zod";

export const backupManifestSchema = z.object({
  createdAt: z.string().datetime(),
  id: z.string().min(1),
  includedPaths: z.array(z.string().min(1)).min(1),
  orgId: z.string().min(1),
  version: z.literal("backup-manifest.v1"),
});

export type BackupManifest = z.infer<typeof backupManifestSchema>;

export function buildBackupManifest(input: {
  createdAt?: string;
  id: string;
  includedPaths: string[];
  orgId: string;
}): BackupManifest {
  return backupManifestSchema.parse({
    ...input,
    createdAt: input.createdAt ?? new Date().toISOString(),
    version: "backup-manifest.v1",
  });
}
