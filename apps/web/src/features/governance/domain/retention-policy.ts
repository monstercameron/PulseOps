import { z } from "zod";

export const retainedRecordSchema = z.object({
  createdAt: z.string().datetime(),
  id: z.string().min(1),
  recordKind: z.string().min(1),
});

export type RetainedRecord = z.infer<typeof retainedRecordSchema>;

export function findExpiredRecords(
  records: readonly RetainedRecord[],
  retentionDays: number,
  now: string,
): RetainedRecord[] {
  const retentionCutoff = Date.parse(now) - retentionDays * 24 * 60 * 60 * 1000;

  return records.filter(
    (record) => Date.parse(record.createdAt) < retentionCutoff,
  );
}
