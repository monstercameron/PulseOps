import { describe, expect, it } from "vitest";

import { fallbackPacksPageData } from "@/features/packs/constants/packs-page-content";
import { createPackRecord } from "@/features/packs/domain/pack-record";
import {
  mergeUpdatedPackItem,
  packRecordToPackItem,
  resolvePackRecommendationFeedbackAction,
} from "@/features/packs/lib/pack-page-state";

describe("pack-page-state", () => {
  it("maps a pack record into the pack page shape", () => {
    const record = createPackRecord({
      ...fallbackPacksPageData.packs[0],
      orgId: "org_123",
      updatedAt: "2026-04-10T00:00:00.000Z",
    });

    expect(packRecordToPackItem(record)).toMatchObject({
      id: record.id,
      listSummary: expect.any(String),
      previewSummary: expect.any(String),
      statusLabel: record.statusLabel,
      title: record.title,
    });
  });

  it("moves an updated pack to the front of the list", () => {
    const nextPack = {
      ...fallbackPacksPageData.packs[1],
      title: "Updated pack",
    };

    expect(
      mergeUpdatedPackItem(fallbackPacksPageData.packs, nextPack),
    ).toEqual([
      expect.objectContaining({
        id: nextPack.id,
        title: "Updated pack",
      }),
      expect.objectContaining({
        id: fallbackPacksPageData.packs[0].id,
      }),
      expect.objectContaining({
        id: fallbackPacksPageData.packs[2].id,
      }),
    ]);
  });

  it("maps visible recommendation actions to API feedback actions", () => {
    expect(resolvePackRecommendationFeedbackAction("Accept")).toBe("accept");
    expect(resolvePackRecommendationFeedbackAction("Dismiss")).toBe("reject");
    expect(resolvePackRecommendationFeedbackAction("Open")).toBeNull();
  });
});
