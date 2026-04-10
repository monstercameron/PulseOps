/**
 * Structured rich-content widgets the answer pipeline attaches to a response.
 * Each widget is rendered alongside the prose text answer in the Ask surface.
 *
 * When a generative model is connected, include ASK_WIDGET_SYSTEM_PROMPT_ADDON
 * in the system message so the LLM can select the right widget type and emit a
 * typed `widget` field in its JSON output.
 */

// ─── Column / row primitives ──────────────────────────────────────────────────

export type DataTableColumn = Readonly<{
  key: string;
  label: string;
  numeric?: boolean;
  sortable?: boolean;
}>;

export type DataTableRow = Readonly<Record<string, null | number | string>>;

// ─── Widget shapes ────────────────────────────────────────────────────────────

/** Sortable, paginated table. Best for lists of comparable records. */
export type DataTableWidget = Readonly<{
  type: "data-table";
  columns: readonly DataTableColumn[];
  rows: readonly DataTableRow[];
  title?: string;
  /** Original total before any client-side pagination. */
  totalCount?: number;
}>;

/** Grid of KPI metric tiles. Best for 1–6 numeric summary stats. */
export type MetricGridWidget = Readonly<{
  type: "metric-grid";
  metrics: readonly Readonly<{
    label: string;
    tone?: "negative" | "neutral" | "positive" | "warning";
    trendLabel?: string;
    value: string;
  }>[];
  title?: string;
}>;

/** List of entity cards with metadata rows. Best for heterogeneous entities. */
export type CardListWidget = Readonly<{
  type: "card-list";
  cards: readonly Readonly<{
    badge?: string;
    badgeTone?: "negative" | "neutral" | "positive" | "warning";
    description?: string;
    id?: string;
    metadata?: readonly Readonly<{ label: string; value: string }>[];
    subtitle?: string;
    title: string;
    tone?: "negative" | "neutral" | "positive" | "warning";
  }>[];
  title?: string;
}>;

/** Single entity displayed in contact-card style. Best for focused entity answers. */
export type BusinessCardWidget = Readonly<{
  type: "business-card";
  fields: readonly Readonly<{ label: string; value: string }>[];
  name: string;
  subtitle?: string;
  tags?: readonly string[];
}>;

/** Issue/alert list with severity levels. Best for overdue items and risks. */
export type AlertListWidget = Readonly<{
  type: "alert-list";
  alerts: readonly Readonly<{
    description?: string;
    severity: "critical" | "info" | "warning";
    title: string;
    value?: string;
  }>[];
  title?: string;
}>;

/** Ranked items sorted by a metric. Best for top/worst/highest/lowest questions. */
export type RankingListWidget = Readonly<{
  type: "ranking-list";
  items: readonly Readonly<{
    description?: string;
    label: string;
    rank: number;
    tone?: "negative" | "neutral" | "positive" | "warning";
    value: string;
  }>[];
  title?: string;
}>;

/** Date-ordered event list. Best for payment history, due dates, scheduled visits. */
export type TimelineWidget = Readonly<{
  type: "timeline";
  events: readonly Readonly<{
    date: string;
    description?: string;
    label: string;
    tone?: "negative" | "neutral" | "positive" | "warning";
  }>[];
  title?: string;
}>;

export type AskWidget =
  | AlertListWidget
  | BusinessCardWidget
  | CardListWidget
  | DataTableWidget
  | MetricGridWidget
  | RankingListWidget
  | TimelineWidget;

// ─── System prompt addon ──────────────────────────────────────────────────────

/**
 * Include this constant in the LLM system message once a generative model is
 * connected. The model should return a `widget` field in its JSON output that
 * matches one of the schemas above. Omit the field entirely when no widget fits.
 */
export const ASK_WIDGET_SYSTEM_PROMPT_ADDON = `
You may optionally accompany your answer with a structured widget for richer display.

Available widget types and when to use each:

data-table
  Use when presenting multiple records with comparable columns (overdue invoices, job
  margins, bank transactions). Supports client-side sorting and pagination. Include
  columns (key, label, numeric?, sortable?) and rows (key→value records).

metric-grid
  Use when summarizing 1–6 key numeric metrics (total outstanding, average margin, job
  count). Each tile has a label, formatted value string, and optional tone
  (positive | warning | negative | neutral).

card-list
  Use when listing several distinct entities with mixed properties (vendors, estimates,
  recent jobs). Each card has a title, optional badge, optional subtitle, and up to
  6 metadata key–value rows.

business-card
  Use when an answer focuses on a single named entity (one vendor, one client, one job).
  Shows a name, optional subtitle, optional tags, and labeled field rows.

alert-list
  Use when flagging issues, overdue items, or financial risks. Each alert carries a
  severity (critical | warning | info), a title, an optional value, and optional
  description text.

ranking-list
  Use when the question asks for top / worst / best / highest / lowest items ordered by
  a numeric metric. Include rank, label, formatted value, and optional tone.

timeline
  Use when presenting date-ordered events: payment history, scheduled work orders,
  upcoming due dates. Each event has a date string, label, and optional tone.

Rules:
- Omit the widget field entirely when none of the types fits the data.
- Do not invent data. Only include values that appear in the retrieved evidence.
- Keep every string value short enough to display in a compact UI cell.
`.trim();
