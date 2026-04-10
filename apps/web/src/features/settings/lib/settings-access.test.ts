import { describe, expect, it } from "vitest";

import { buildVisibleSettingsTabIds, buildSettingsAccess } from "@/features/settings/lib/settings-access";

describe("settings access", () => {
  it("gives admins access to every settings group", () => {
    expect(
      buildVisibleSettingsTabIds(
        buildSettingsAccess({
          operationsAccess: true,
          role: "admin",
          setupAccess: true,
          status: "active",
        }),
      ),
    ).toEqual([
      "myAccount",
      "workspace",
      "sourcesOperations",
      "peopleAccess",
      "billing",
    ]);
  });

  it("keeps operators out of people and billing controls", () => {
    expect(
      buildVisibleSettingsTabIds(
        buildSettingsAccess({
          operationsAccess: true,
          role: "operator",
          setupAccess: true,
          status: "active",
        }),
      ),
    ).toEqual(["myAccount", "workspace", "sourcesOperations"]);
  });

  it("limits analysts to self-service settings", () => {
    expect(
      buildVisibleSettingsTabIds(
        buildSettingsAccess({
          operationsAccess: false,
          role: "analyst",
          setupAccess: false,
          status: "active",
        }),
      ),
    ).toEqual(["myAccount"]);
  });
});
