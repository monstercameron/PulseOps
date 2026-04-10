import {
  canonicalFactTypes,
  type CanonicalFactTypeId,
} from "@/features/foundation/domain/canonical-facts";
import type { Citation } from "@/features/trust/domain/citation";

type FormatFactValueInput = Readonly<{
  canonicalFactTypeId: CanonicalFactTypeId;
  label?: string;
  locale?: string;
  sourceFieldKey?: string;
  value: string | number | boolean | null | string[];
}>;

type ResolveFactLabelInput = Readonly<{
  canonicalFactTypeId: CanonicalFactTypeId;
  label?: string;
  sourceFieldKey?: string;
}>;

const canonicalFactTypeDefinitionById = new Map(
  canonicalFactTypes.map((factType) => [factType.id, factType]),
);

const currencyFactTypeIds = new Set<CanonicalFactTypeId>([
  "invoice.amount.total",
  "invoice.amount.outstanding",
  "vendor_bill.amount.total",
  "bank_transaction.amount",
  "job.revenue.actual",
  "job.cost.labor",
  "job.cost.material",
  "job.cost.subcontractor",
  "job.margin.gross",
  "estimate.amount.total",
]);

const dateFactTypeIds = new Set<CanonicalFactTypeId>([
  "document.observation.datetime",
  "invoice.issued_at",
  "invoice.due_at",
  "vendor_bill.due_at",
  "bank_transaction.posted_at",
  "work_order.scheduled_at",
  "payment.received_at",
]);

const countLikeFactTypeIds = new Set<CanonicalFactTypeId>([
  "invoice.payment_days_late",
  "crew.labor_hours",
]);

export function getCanonicalFactTypeDefinition(
  canonicalFactTypeId: CanonicalFactTypeId,
) {
  return canonicalFactTypeDefinitionById.get(canonicalFactTypeId) ?? null;
}

export function resolveFactLabel({
  canonicalFactTypeId,
  label,
  sourceFieldKey,
}: ResolveFactLabelInput) {
  const explicitLabel = label?.trim();

  if (explicitLabel !== undefined && explicitLabel.length > 0) {
    return explicitLabel;
  }

  if (isGenericObservationFactType(canonicalFactTypeId)) {
    const sourceFieldLabel = humanizeSourceFieldKey(sourceFieldKey);

    if (sourceFieldLabel !== null) {
      return sourceFieldLabel;
    }
  }

  return (
    getCanonicalFactTypeDefinition(canonicalFactTypeId)?.label ??
    canonicalFactTypeId
  );
}

export function resolveFactDescription(
  canonicalFactTypeId: CanonicalFactTypeId,
) {
  return (
    getCanonicalFactTypeDefinition(canonicalFactTypeId)?.description ??
    "A document-backed business fact extracted from the source."
  );
}

export function formatFactValue({
  canonicalFactTypeId,
  label,
  locale = "en-US",
  sourceFieldKey,
  value,
}: FormatFactValueInput) {
  if (value === null) {
    return "Not available";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    if (currencyFactTypeIds.has(canonicalFactTypeId)) {
      return new Intl.NumberFormat(locale, {
        currency: "USD",
        maximumFractionDigits: 2,
        style: "currency",
      }).format(value);
    }

    if (countLikeFactTypeIds.has(canonicalFactTypeId)) {
      return formatNumber(value, locale, shouldShowDecimals(value));
    }

    if (
      canonicalFactTypeId === "document.observation.number" &&
      inferGenericNumericPresentation(label, sourceFieldKey) === "currency"
    ) {
      return new Intl.NumberFormat(locale, {
        currency: "USD",
        maximumFractionDigits: 2,
        style: "currency",
      }).format(value);
    }

    if (
      canonicalFactTypeId === "document.observation.number" &&
      inferGenericNumericPresentation(label, sourceFieldKey) === "percentage"
    ) {
      return `${formatNumber(value, locale, shouldShowDecimals(value))}%`;
    }

    return formatNumber(value, locale, shouldShowDecimals(value));
  }

  if (dateFactTypeIds.has(canonicalFactTypeId)) {
    return formatDateLikeValue(value, locale);
  }

  if (
    canonicalFactTypeId === "document.observation.datetime" &&
    looksLikeDateValue(value)
  ) {
    return formatDateLikeValue(value, locale);
  }

  return value;
}

export function buildFactEvidenceSummary(citations: readonly Citation[]) {
  const primaryCitation = citations[0];

  if (primaryCitation === undefined) {
    return "Source location unavailable";
  }

  const locatorEntries = Object.entries(primaryCitation.locator);

  if (locatorEntries.length === 0) {
    return humanizeLocatorType(primaryCitation.locatorType);
  }

  return locatorEntries
    .map(([key, locatorValue]) => {
      if (typeof locatorValue === "boolean") {
        return `${humanizeLocatorKey(key)} ${locatorValue ? "yes" : "no"}`;
      }

      return `${humanizeLocatorKey(key)} ${formatLocatorValue(key, locatorValue)}`;
    })
    .join(" / ");
}

export function buildFactExcerpt(citations: readonly Citation[]) {
  return citations.find((citation) => citation.excerpt !== undefined)?.excerpt;
}

function inferGenericNumericPresentation(label?: string, sourceFieldKey?: string) {
  const combinedText = `${label ?? ""} ${sourceFieldKey ?? ""}`.toLowerCase();

  if (
    /\b(percent|percentage|pct|margin %|margin_pct|margin_pctg)\b/.test(
      combinedText,
    )
  ) {
    return "percentage";
  }

  if (
    /\b(amount|total|balance|revenue|sales|profit|income|cost|expense|margin|payable|receivable|cash)\b/.test(
      combinedText,
    )
  ) {
    return "currency";
  }

  return "number";
}

function formatNumber(value: number, locale: string, showDecimals: boolean) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  }).format(value);
}

function shouldShowDecimals(value: number) {
  return !Number.isInteger(value);
}

function looksLikeDateValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}/.test(value) || !Number.isNaN(Date.parse(value));
}

function formatDateLikeValue(value: string, locale: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function isGenericObservationFactType(canonicalFactTypeId: CanonicalFactTypeId) {
  return canonicalFactTypeId.startsWith("document.observation.");
}

function humanizeSourceFieldKey(sourceFieldKey?: string) {
  if (sourceFieldKey === undefined) {
    return null;
  }

  const normalizedSourceFieldKey = sourceFieldKey.trim();

  if (normalizedSourceFieldKey.length === 0) {
    return null;
  }

  const segments = normalizedSourceFieldKey
    .split(".")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
  const lastSemanticSegment = segments
    .slice()
    .reverse()
    .find((segment) => !/^row_\d+$/i.test(segment));

  if (lastSemanticSegment === undefined) {
    return null;
  }

  return capitalizeLabel(
    lastSemanticSegment
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function formatLocatorValue(key: string, locatorValue: number | string) {
  if (key === "column" || key === "fieldPath" || key === "reference") {
    return locatorValue
      .toString()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  return locatorValue.toString();
}

function humanizeLocatorKey(key: string) {
  return capitalizeLabel(key.replace(/_/g, " "));
}

function humanizeLocatorType(locatorType: Citation["locatorType"]) {
  return capitalizeLabel(locatorType.replace(/-/g, " "));
}

function capitalizeLabel(value: string) {
  if (value.length === 0) {
    return value;
  }

  return `${value[0]!.toUpperCase()}${value.slice(1)}`;
}
