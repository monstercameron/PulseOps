import { describe, expect, it } from "vitest";

import { findExpiredRecords } from "@/features/governance/domain/retention-policy";

describe("retention policy", () => {
  it("finds expired records relative to a retention window", () => {
    expect(
      findExpiredRecords(
        [
          {
            createdAt: "2026-01-01T00:00:00.000Z",
            id: "record_1",
            recordKind: "audit",
          },
          {
            createdAt: "2026-04-01T00:00:00.000Z",
            id: "record_2",
            recordKind: "audit",
          },
        ],
        60,
        "2026-04-10T00:00:00.000Z",
      ),
    ).toEqual([
      {
        createdAt: "2026-01-01T00:00:00.000Z",
        id: "record_1",
        recordKind: "audit",
      },
    ]);
  });
});
