import { describe, expect, it } from "vitest";

import { resolveSelectedExplorerRecord } from "@/features/explorer/lib/explorer-selection";
import { type ExplorerRecord } from "@/features/explorer/server/handle-explorer-records-request";

const baseRecord: ExplorerRecord = {
  confidenceScore: 0.9,
  dateLabel: "Apr 10, 2026",
  detailCitations: [],
  detailFacts: [],
  documentMeta: "Manual upload - 1 KB",
  documentName: "example.csv",
  factsSummary: "1 extracted fact",
  id: "record_1",
  sourceLabel: "Manual upload",
  statusLabel: "Extracted",
  statusTone: "success",
  typeLabel: "Document",
  typeTone: "neutral",
};

describe("resolveSelectedExplorerRecord", () => {
  it("returns null when the detail pane is explicitly closed", () => {
    expect(resolveSelectedExplorerRecord([baseRecord], null)).toBeNull();
  });

  it("returns the requested record when it is visible", () => {
    const secondRecord = {
      ...baseRecord,
      documentName: "second.csv",
      id: "record_2",
    };

    expect(
      resolveSelectedExplorerRecord([baseRecord, secondRecord], "record_2"),
    ).toMatchObject({
      id: "record_2",
    });
  });

  it("falls back to the first visible record when the prior selection is no longer visible", () => {
    const secondRecord = {
      ...baseRecord,
      documentName: "second.csv",
      id: "record_2",
    };

    expect(
      resolveSelectedExplorerRecord([secondRecord], "record_1"),
    ).toMatchObject({
      id: "record_2",
    });
  });
});
