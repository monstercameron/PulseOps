import { type ExplorerRecord } from "@/features/explorer/server/handle-explorer-records-request";

export function resolveSelectedExplorerRecord(
  visibleRecords: readonly ExplorerRecord[],
  selectedRecordId: string | null,
): ExplorerRecord | null {
  if (selectedRecordId === null) {
    return null;
  }

  return (
    visibleRecords.find((record) => record.id === selectedRecordId) ??
    visibleRecords[0] ??
    null
  );
}
