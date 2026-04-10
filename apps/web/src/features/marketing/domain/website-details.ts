import { z } from "zod";

export const websiteDetailsSchema = z.object({
  mainPhone: z.string().min(1),
  partnershipsEmail: z.string().email(),
  pressEmail: z.string().email(),
  salesEmail: z.string().email(),
  supportEmail: z.string().email(),
  supportPhone: z.string().min(1),
});

export type WebsiteDetails = Readonly<z.infer<typeof websiteDetailsSchema>>;

export type WebsiteFooterContact = Readonly<{
  href: string;
  label: string;
  value: string;
}>;

export type WebsiteContactRoute = Readonly<{
  email: string;
  phone: string;
}>;

export const fallbackWebsiteDetails: WebsiteDetails = {
  mainPhone: "(954) 555-0142",
  partnershipsEmail: "partners@pulseops.io",
  pressEmail: "press@pulseops.io",
  salesEmail: "sales@pulseops.io",
  supportEmail: "support@pulseops.io",
  supportPhone: "(954) 555-0199",
};

export function buildWebsiteFooterContacts(
  details: WebsiteDetails,
): readonly WebsiteFooterContact[] {
  return [
    {
      href: `mailto:${details.supportEmail}`,
      label: "Support",
      value: details.supportEmail,
    },
    {
      href: `tel:${normalizeTelephoneHref(details.mainPhone)}`,
      label: "Main line",
      value: details.mainPhone,
    },
  ];
}

export function buildWebsiteContactRoutes(
  details: WebsiteDetails,
): readonly WebsiteContactRoute[] {
  return [
    {
      email: details.supportEmail,
      phone: details.supportPhone,
    },
    {
      email: details.salesEmail,
      phone: details.mainPhone,
    },
    {
      email: details.pressEmail,
      phone: details.mainPhone,
    },
    {
      email: details.partnershipsEmail,
      phone: details.mainPhone,
    },
  ];
}

export function normalizeTelephoneHref(phoneNumber: string) {
  return phoneNumber.replaceAll(/[^+\d]/g, "");
}
