/**
 * Rule-based widget selector for the Ask pipeline.
 *
 * Given the query plan and retrieval result, this module picks the most
 * appropriate widget type to display alongside the prose answer. When a
 * generative model replaces the deterministic pipeline this logic can be
 * replaced by parsing the model's `widget` JSON field against the schemas
 * defined in ask-widget-types.ts.
 */

import { type QueryPlan } from "@/features/query/domain/query-plan";
import { type FactVectorRetrievalResult } from "@/features/query/services/fact-vector-retrieval";

import {
  type AlertListWidget,
  type AskWidget,
  type BusinessCardWidget,
  type CardListWidget,
  type DataTableWidget,
  type MetricGridWidget,
  type RankingListWidget,
  type TimelineWidget,
} from "@/features/ask/lib/ask-widget-types";

// ─── Classification sets ──────────────────────────────────────────────────────

const DATE_FACT_IDS = new Set<string>([
  "invoice.due_at",
  "vendor_bill.due_at",
  "bank_transaction.posted_at",
  "work_order.scheduled_at",
  "payment.received_at",
  "invoice.issued_at",
]);

const ALERT_FACT_IDS = new Set<string>([
  "invoice.amount.outstanding",
  "invoice.payment_days_late",
]);

const CURRENCY_FACT_IDS = new Set<string>([
  "invoice.amount.total",
  "invoice.amount.outstanding",
  "vendor_bill.amount.total",
  "bank_transaction.amount",
  "job.revenue.actual",
  "job.cost.labor",
  "job.cost.material",
  "job.cost.subcontractor",
  "estimate.amount.total",
]);

const MARGIN_FACT_IDS = new Set<string>(["job.margin.gross"]);

const DAYS_FACT_IDS = new Set<string>(["invoice.payment_days_late"]);

const RANKING_RE = /\b(?:top|rank|best|worst|highest|lowest|most|least|underpriced|overpriced)\b/i;

// ─── Public selector ──────────────────────────────────────────────────────────

export function selectAskWidget(
  plan: QueryPlan,
  retrieval: FactVectorRetrievalResult,
): AskWidget | null {
  const { facts } = retrieval;
  if (facts.length === 0) return null;

  const isRanking = RANKING_RE.test(plan.question);
  const hasAlertFacts = facts.some((f) => ALERT_FACT_IDS.has(f.factTypeId as string));
  const dateFacts = facts.filter((f) => DATE_FACT_IDS.has(f.factTypeId as string));
  const uniqueFactTypeIds = new Set(facts.map((f) => f.factTypeId as string));

  // Single fact → metric tile
  if (facts.length === 1) {
    return buildMetricGridWidget(facts);
  }

  // Ranking question → ranking list (numeric facts only)
  if (isRanking) {
    const numericFacts = facts.filter((f) => typeof f.value === "number");
    if (numericFacts.length >= 2) return buildRankingListWidget(numericFacts);
  }

  // Alert-type facts (overdue, outstanding) → alert list
  if (hasAlertFacts) {
    return buildAlertListWidget(facts, plan);
  }

  // Mostly date facts (≥ half) → timeline
  if (dateFacts.length >= 2 && dateFacts.length >= Math.ceil(facts.length / 2)) {
    return buildTimelineWidget(dateFacts, plan);
  }

  // Many facts → data table
  if (facts.length >= 4) {
    return buildDataTableWidget(facts, plan);
  }

  // 2–3 facts — if single entity with multiple measure types → business card
  if (facts.length <= 3 && uniqueFactTypeIds.size === facts.length && plan.entityTypes.length === 1) {
    return buildBusinessCardWidget(facts, plan);
  }

  // Multiple heterogeneous KPIs → metric grid
  if (uniqueFactTypeIds.size >= 2) {
    return buildMetricGridWidget(facts);
  }

  // Fallback: card list
  return buildCardListWidget(facts, plan);
}

// ─── Widget builders ──────────────────────────────────────────────────────────

function buildDataTableWidget(
  facts: FactVectorRetrievalResult["facts"],
  plan: QueryPlan,
): DataTableWidget {
  const columns = [
    { key: "metric", label: "Metric", sortable: true },
    { key: "value", label: "Value", numeric: true, sortable: true },
    { key: "source", label: "Source" },
  ] as const;

  const rows = facts.map((fact) => ({
    metric: formatFactLabel(fact.factTypeId as string),
    source: fact.citations[0]?.documentId ?? "—",
    value: formatFactValue(fact.factTypeId as string, fact.value),
  }));

  const entityLabel = labelForEntityType(plan.entityTypes[0]);

  return {
    type: "data-table",
    columns,
    rows,
    title: `${entityLabel} data`,
    totalCount: facts.length,
  };
}

function buildMetricGridWidget(facts: FactVectorRetrievalResult["facts"]): MetricGridWidget {
  return {
    type: "metric-grid",
    metrics: facts.map((fact) => ({
      label: formatFactLabel(fact.factTypeId as string),
      tone: deriveTone(fact.factTypeId as string, fact.value),
      value: formatFactValue(fact.factTypeId as string, fact.value),
    })),
  };
}

function buildCardListWidget(
  facts: FactVectorRetrievalResult["facts"],
  plan: QueryPlan,
): CardListWidget {
  const entityLabel = labelForEntityType(plan.entityTypes[0]);

  return {
    type: "card-list",
    cards: facts.map((fact) => ({
      metadata: [
        { label: "Value", value: formatFactValue(fact.factTypeId as string, fact.value) },
        ...(fact.citations[0] ? [{ label: "Source", value: fact.citations[0].documentId }] : []),
      ],
      title: formatFactLabel(fact.factTypeId as string),
      tone: deriveTone(fact.factTypeId as string, fact.value),
    })),
    title: `${entityLabel} overview`,
  };
}

function buildBusinessCardWidget(
  facts: FactVectorRetrievalResult["facts"],
  plan: QueryPlan,
): BusinessCardWidget {
  const entityLabel = labelForEntityType(plan.entityTypes[0]);
  const sourceDoc = facts[0]?.citations[0]?.documentId;

  return {
    type: "business-card",
    fields: facts.map((fact) => ({
      label: formatFactLabel(fact.factTypeId as string),
      value: formatFactValue(fact.factTypeId as string, fact.value),
    })),
    name: sourceDoc ?? entityLabel,
    subtitle: entityLabel,
  };
}

function buildAlertListWidget(
  facts: FactVectorRetrievalResult["facts"],
  plan: QueryPlan,
): AlertListWidget {
  const entityLabel = labelForEntityType(plan.entityTypes[0]);

  return {
    type: "alert-list",
    alerts: facts.map((fact) => ({
      description: fact.citations[0]?.documentId
        ? `Source: ${fact.citations[0].documentId}`
        : undefined,
      severity: deriveAlertSeverity(fact.factTypeId as string, fact.value),
      title: formatFactLabel(fact.factTypeId as string),
      value: formatFactValue(fact.factTypeId as string, fact.value),
    })),
    title: `${entityLabel} alerts`,
  };
}

function buildRankingListWidget(
  facts: FactVectorRetrievalResult["facts"],
): RankingListWidget {
  const sorted = [...facts]
    .filter((f) => typeof f.value === "number")
    .sort((a, b) => (b.value as number) - (a.value as number));

  return {
    type: "ranking-list",
    items: sorted.map((fact, index) => ({
      description: fact.citations[0]?.documentId,
      label: formatFactLabel(fact.factTypeId as string),
      rank: index + 1,
      tone: deriveTone(fact.factTypeId as string, fact.value),
      value: formatFactValue(fact.factTypeId as string, fact.value),
    })),
  };
}

function buildTimelineWidget(
  facts: FactVectorRetrievalResult["facts"],
  plan: QueryPlan,
): TimelineWidget {
  const entityLabel = labelForEntityType(plan.entityTypes[0]);

  const events = [...facts]
    .map((fact) => ({
      date: formatDate(String(fact.value)),
      description: fact.citations[0]?.documentId
        ? `Source: ${fact.citations[0].documentId}`
        : undefined,
      label: formatFactLabel(fact.factTypeId as string),
      rawDate: new Date(String(fact.value)),
      tone: deriveDateTone(String(fact.value)),
    }))
    .sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime())
    .map(({ date, description, label, tone }) => ({
      date,
      description,
      label,
      tone,
    }));

  return {
    type: "timeline",
    events,
    title: `${entityLabel} timeline`,
  };
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatFactLabel(factTypeId: string): string {
  // "invoice.amount.outstanding" → "Invoice Amount Outstanding"
  return factTypeId
    .replace(/\./g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatFactValue(
  factTypeId: string,
  value: FactVectorRetrievalResult["facts"][number]["value"],
): string {
  if (value === null) return "—";
  if (Array.isArray(value)) return value.join(", ");

  if (CURRENCY_FACT_IDS.has(factTypeId) && typeof value === "number") {
    return new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format(value);
  }

  if (MARGIN_FACT_IDS.has(factTypeId) && typeof value === "number") {
    return `${value.toFixed(1)}%`;
  }

  if (DAYS_FACT_IDS.has(factTypeId) && typeof value === "number") {
    return `${value}d`;
  }

  if (DATE_FACT_IDS.has(factTypeId)) {
    return formatDate(String(value));
  }

  return String(value);
}

function formatDate(raw: string): string {
  const date = new Date(raw);
  if (isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function labelForEntityType(entityType: string | undefined): string {
  if (!entityType) return "Results";
  return entityType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Tone + severity derivation ───────────────────────────────────────────────

function deriveTone(
  factTypeId: string,
  value: FactVectorRetrievalResult["facts"][number]["value"],
): "negative" | "neutral" | "positive" | "warning" {
  if (DAYS_FACT_IDS.has(factTypeId) && typeof value === "number") {
    if (value > 30) return "negative";
    if (value > 0) return "warning";
    return "positive";
  }

  if (factTypeId === "invoice.amount.outstanding" && typeof value === "number") {
    if (value > 10_000) return "negative";
    if (value > 1_000) return "warning";
    return "positive";
  }

  if (MARGIN_FACT_IDS.has(factTypeId) && typeof value === "number") {
    if (value < 10) return "negative";
    if (value < 20) return "warning";
    return "positive";
  }

  return "neutral";
}

function deriveAlertSeverity(
  factTypeId: string,
  value: FactVectorRetrievalResult["facts"][number]["value"],
): "critical" | "info" | "warning" {
  if (DAYS_FACT_IDS.has(factTypeId) && typeof value === "number") {
    if (value > 30) return "critical";
    if (value > 0) return "warning";
  }

  if (factTypeId === "invoice.amount.outstanding" && typeof value === "number") {
    if (value > 10_000) return "critical";
    if (value > 0) return "warning";
  }

  return "info";
}

function deriveDateTone(raw: string): "negative" | "neutral" | "positive" | "warning" {
  const date = new Date(raw);
  if (isNaN(date.getTime())) return "neutral";

  const daysUntil = (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysUntil < 0) return "negative"; // overdue
  if (daysUntil <= 7) return "warning"; // due soon
  return "neutral";
}
