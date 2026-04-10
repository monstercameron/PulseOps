import { describe, expect, it } from "vitest";

import { createOrganizationRecordFromSettingsRecord } from "@/features/settings/domain/organization-record";
import { createDefaultSettingsRecord } from "@/features/settings/domain/settings-record";

describe("organization record", () => {
  it("maps the persisted settings profile into a first-class organization record", () => {
    const settingsRecord = createDefaultSettingsRecord(
      "org_123",
      "2026-04-09T18:00:00.000Z",
    );

    const organizationRecord = createOrganizationRecordFromSettingsRecord(
      settingsRecord,
      {
        status: "active",
      },
    );

    expect(organizationRecord).toMatchObject({
      id: "org_123",
      name: settingsRecord.organization.name,
      status: "active",
      updatedAt: "2026-04-09T18:00:00.000Z",
    });
  });
});
