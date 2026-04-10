import { z } from "zod";

export const billingPaymentMethodRoleSchema = z.enum(["primary", "backup"]);
export const billingPaymentMethodBrandSchema = z.enum([
  "amex",
  "discover",
  "mastercard",
  "other",
  "visa",
]);

export const billingPaymentMethodSchema = z.object({
  brand: billingPaymentMethodBrandSchema,
  cardholderName: z.string().min(1),
  createdAt: z.string().datetime(),
  expMonth: z.number().int().min(1).max(12),
  expYear: z.number().int().min(2000).max(2100),
  id: z.string().min(1),
  last4: z.string().regex(/^\d{4}$/),
  orgId: z.string().min(1),
  postalCode: z.string().min(3).max(16).nullable(),
  role: billingPaymentMethodRoleSchema,
  updatedAt: z.string().datetime(),
  version: z.literal("billing-payment-method.v1"),
});

export const billingPaymentMethodEntrySchema = z.object({
  cardNumber: z.string().min(12).max(32),
  cardholderName: z.string().min(1),
  cvc: z.string().min(3).max(4),
  expMonth: z.number().int().min(1).max(12),
  expYear: z.number().int().min(2000).max(2100),
  postalCode: z.string().trim().min(3).max(16).nullable(),
});

export type BillingPaymentMethod = z.infer<typeof billingPaymentMethodSchema>;
export type BillingPaymentMethodEntry = z.infer<
  typeof billingPaymentMethodEntrySchema
>;
export type BillingPaymentMethodRole = z.infer<
  typeof billingPaymentMethodRoleSchema
>;

type CreateBillingPaymentMethodInput = Omit<
  BillingPaymentMethod,
  "createdAt" | "updatedAt" | "version"
> & {
  createdAt?: string;
  updatedAt?: string;
};

export function createBillingPaymentMethod(
  input: CreateBillingPaymentMethodInput,
): BillingPaymentMethod {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return billingPaymentMethodSchema.parse({
    ...input,
    createdAt,
    updatedAt: input.updatedAt ?? createdAt,
    version: "billing-payment-method.v1",
  });
}

export function createMaskedBillingPaymentMethod(input: Readonly<{
  existingCreatedAt?: string;
  now?: string;
  entry: BillingPaymentMethodEntry;
  orgId: string;
  role: BillingPaymentMethodRole;
}>): BillingPaymentMethod {
  const parsedEntry = billingPaymentMethodEntrySchema.parse(input.entry);
  const nowIso = input.now ?? new Date().toISOString();
  const normalizedCardNumber = normalizeCardDigits(parsedEntry.cardNumber);
  const normalizedCvc = normalizeCardDigits(parsedEntry.cvc);

  if (normalizedCardNumber.length < 12 || normalizedCardNumber.length > 19) {
    throw new Error("Enter a valid card number.");
  }

  if (!passesLuhnCheck(normalizedCardNumber)) {
    throw new Error("Enter a valid card number.");
  }

  if (!/^\d{3,4}$/.test(normalizedCvc)) {
    throw new Error("Enter a valid security code.");
  }

  if (isExpired(parsedEntry.expMonth, parsedEntry.expYear, nowIso)) {
    throw new Error("Enter a card expiration date in the future.");
  }

  return createBillingPaymentMethod({
    brand: resolveBillingPaymentMethodBrand(normalizedCardNumber),
    cardholderName: parsedEntry.cardholderName.trim(),
    createdAt: input.existingCreatedAt ?? nowIso,
    expMonth: parsedEntry.expMonth,
    expYear: parsedEntry.expYear,
    id: buildBillingPaymentMethodId(input.orgId, input.role),
    last4: normalizedCardNumber.slice(-4),
    orgId: input.orgId,
    postalCode: normalizePostalCode(parsedEntry.postalCode),
    role: input.role,
    updatedAt: nowIso,
  });
}

export function buildBillingPaymentMethodId(
  orgId: string,
  role: BillingPaymentMethodRole,
): string {
  return `billing_payment_method_${orgId}_${role}`;
}

export function getBillingPaymentMethodRoleLabel(
  role: BillingPaymentMethodRole,
): string {
  return role === "primary" ? "Business card" : "Backup card";
}

export function getBillingPaymentMethodBrandLabel(
  brand: BillingPaymentMethod["brand"],
): string {
  switch (brand) {
    case "amex":
      return "American Express";
    case "discover":
      return "Discover";
    case "mastercard":
      return "Mastercard";
    case "visa":
      return "Visa";
    case "other":
      return "Card";
  }
}

function normalizeCardDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function normalizePostalCode(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  const normalizedPostalCode = value.trim();

  return normalizedPostalCode.length === 0 ? null : normalizedPostalCode;
}

function isExpired(
  expMonth: number,
  expYear: number,
  nowIso: string,
): boolean {
  const now = new Date(nowIso);
  const currentMonth = now.getUTCMonth() + 1;
  const currentYear = now.getUTCFullYear();

  return (
    expYear < currentYear ||
    (expYear === currentYear && expMonth < currentMonth)
  );
}

function passesLuhnCheck(cardNumber: string): boolean {
  let shouldDouble = false;
  let sum = 0;

  for (let index = cardNumber.length - 1; index >= 0; index -= 1) {
    let digit = Number(cardNumber[index]);

    if (Number.isNaN(digit)) {
      return false;
    }

    if (shouldDouble) {
      digit *= 2;

      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

function resolveBillingPaymentMethodBrand(
  cardNumber: string,
): BillingPaymentMethod["brand"] {
  if (/^4\d{12}(\d{3})?(\d{3})?$/.test(cardNumber)) {
    return "visa";
  }

  if (
    /^(5[1-5]\d{14}|2(2[2-9]\d{12}|[3-6]\d{13}|7([01]\d{12}|20\d{12})))$/.test(
      cardNumber,
    )
  ) {
    return "mastercard";
  }

  if (/^3[47]\d{13}$/.test(cardNumber)) {
    return "amex";
  }

  if (/^(6011\d{12}|65\d{14}|64[4-9]\d{13})$/.test(cardNumber)) {
    return "discover";
  }

  return "other";
}
