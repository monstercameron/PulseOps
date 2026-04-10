import { describe, expect, it } from "vitest";

import {
  buildWebsiteContactRoutes,
  buildWebsiteFooterContacts,
  fallbackWebsiteDetails,
  normalizeTelephoneHref,
} from "@/features/marketing/domain/website-details";

describe("website details", () => {
  it("builds footer contact links from the structured website details", () => {
    expect(buildWebsiteFooterContacts(fallbackWebsiteDetails)).toEqual([
      {
        href: "mailto:support@pulseops.io",
        label: "Support",
        value: "support@pulseops.io",
      },
      {
        href: "tel:9545550142",
        label: "Main line",
        value: "(954) 555-0142",
      },
    ]);
  });

  it("maps the website details into the contact page routes", () => {
    expect(buildWebsiteContactRoutes(fallbackWebsiteDetails)).toEqual([
      {
        email: "support@pulseops.io",
        phone: "(954) 555-0199",
      },
      {
        email: "sales@pulseops.io",
        phone: "(954) 555-0142",
      },
      {
        email: "press@pulseops.io",
        phone: "(954) 555-0142",
      },
      {
        email: "partners@pulseops.io",
        phone: "(954) 555-0142",
      },
    ]);
  });

  it("normalizes phone numbers for tel links", () => {
    expect(normalizeTelephoneHref("+1 (954) 555-0199")).toBe("+19545550199");
  });
});
