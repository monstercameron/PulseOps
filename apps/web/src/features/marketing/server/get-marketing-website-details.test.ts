import { describe, expect, it } from "vitest";

import { fallbackWebsiteDetails } from "@/features/marketing/domain/website-details";
import { createDefaultSettingsRecord } from "@/features/settings/domain/settings-record";
import { getMarketingWebsiteDetails } from "@/features/marketing/server/get-marketing-website-details";

describe("getMarketingWebsiteDetails", () => {
  it("falls back when no settings repository is available", async () => {
    await expect(
      getMarketingWebsiteDetails({
        orgId: "org_123",
      }),
    ).resolves.toEqual(fallbackWebsiteDetails);
  });

  it("returns persisted website details for the workspace", async () => {
    await expect(
      getMarketingWebsiteDetails({
        orgId: "org_123",
        settingsRepository: {
          async getByOrgId() {
            return {
              ...createDefaultSettingsRecord("org_123"),
              websiteDetails: {
                mainPhone: "(561) 555-0110",
                partnershipsEmail: "alliances@precisionplumbing.com",
                pressEmail: "media@precisionplumbing.com",
                salesEmail: "sales@precisionplumbing.com",
                supportEmail: "support@precisionplumbing.com",
                supportPhone: "(561) 555-0198",
              },
            };
          },
          async put(settingsRecord) {
            return settingsRecord;
          },
        },
      }),
    ).resolves.toEqual({
      mainPhone: "(561) 555-0110",
      partnershipsEmail: "alliances@precisionplumbing.com",
      pressEmail: "media@precisionplumbing.com",
      salesEmail: "sales@precisionplumbing.com",
      supportEmail: "support@precisionplumbing.com",
      supportPhone: "(561) 555-0198",
    });
  });
});
