"use client";

import { useState } from "react";

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

// ─── Shared design tokens ─────────────────────────────────────────────────────

type Tone = "negative" | "neutral" | "positive" | "warning";

const TONE: Record<Tone, { badge: string; bar: string; border: string; dot: string; text: string }> = {
  negative: {
    badge: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
    bar: "bg-red-400",
    border: "border-red-200 dark:border-red-500/20",
    dot: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
  },
  neutral: {
    badge: "bg-surface-muted text-muted",
    bar: "bg-accent",
    border: "border-border",
    dot: "bg-muted/40",
    text: "text-foreground",
  },
  positive: {
    badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    bar: "bg-emerald-400",
    border: "border-emerald-200 dark:border-emerald-500/20",
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    badge: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    bar: "bg-amber-400",
    border: "border-amber-200 dark:border-amber-500/20",
    dot: "bg-amber-400",
    text: "text-amber-600 dark:text-amber-400",
  },
};

const SEVERITY_TONE: Record<AlertListWidget["alerts"][number]["severity"], Tone> = {
  critical: "negative",
  info: "neutral",
  warning: "warning",
};

function t(tone: Tone | undefined) {
  return TONE[tone ?? "neutral"];
}

// ─── Page size ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

// ─── Root dispatcher ──────────────────────────────────────────────────────────

export function AskWidgetRenderer({ widget }: { widget: AskWidget }) {
  switch (widget.type) {
    case "data-table":
      return <DataTable widget={widget} />;
    case "metric-grid":
      return <MetricGrid widget={widget} />;
    case "card-list":
      return <CardList widget={widget} />;
    case "business-card":
      return <BusinessCard widget={widget} />;
    case "alert-list":
      return <AlertList widget={widget} />;
    case "ranking-list":
      return <RankingList widget={widget} />;
    case "timeline":
      return <Timeline widget={widget} />;
    default:
      return null;
  }
}

// ─── Data Table ───────────────────────────────────────────────────────────────

function DataTable({ widget }: { widget: DataTableWidget }) {
  const [sortKey, setSortKey] = useState<null | string>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(0);

  const sorted = [...widget.rows].sort((a, b) => {
    if (!sortKey) return 0;
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    const cmp =
      typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
    return sortAsc ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSort(key: string, sortable?: boolean) {
    if (!sortable) return;
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
    setPage(0);
  }

  return (
    <WidgetShell title={widget.title}>
      <div className="overflow-x-auto rounded-[8px] border border-border">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-border bg-surface-muted">
              {widget.columns.map((col) => (
                <th
                  key={col.key}
                  className={[
                    "px-3 py-2.5 text-left font-semibold text-muted",
                    col.numeric ? "text-right" : "",
                    col.sortable ? "cursor-pointer select-none hover:text-foreground" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => handleSort(col.key, col.sortable)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable ? (
                      <span className="text-[10px] text-muted/50">
                        {sortKey === col.key ? (sortAsc ? "↑" : "↓") : "↕"}
                      </span>
                    ) : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td
                  className="px-3 py-5 text-center text-[12px] text-muted"
                  colSpan={widget.columns.length}
                >
                  No data
                </td>
              </tr>
            ) : null}
            {pageRows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-border/40 transition-colors last:border-b-0 hover:bg-surface-subtle"
              >
                {widget.columns.map((col) => (
                  <td
                    key={col.key}
                    className={[
                      "px-3 py-2.5 text-foreground",
                      col.numeric ? "text-right tabular-nums" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {row[col.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-2.5 flex items-center justify-between text-[11.5px] text-muted">
          <span>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of{" "}
            {widget.totalCount ?? sorted.length}
          </span>
          <div className="flex gap-1">
            <PaginationBtn
              disabled={page === 0}
              label="← Prev"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            />
            <PaginationBtn
              disabled={page >= totalPages - 1}
              label="Next →"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            />
          </div>
        </div>
      ) : null}
    </WidgetShell>
  );
}

// ─── Metric Grid ──────────────────────────────────────────────────────────────

function MetricGrid({ widget }: { widget: MetricGridWidget }) {
  return (
    <WidgetShell title={widget.title}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {widget.metrics.map((metric, index) => {
          const ts = t(metric.tone);
          return (
            <div key={index} className={["rounded-[8px] border p-3", ts.border].join(" ")}>
              <p className="text-[11px] font-medium text-muted">{metric.label}</p>
              <p
                className={[
                  "mt-1 text-[20px] font-bold leading-none tabular-nums",
                  ts.text,
                ].join(" ")}
              >
                {metric.value}
              </p>
              {metric.trendLabel ? (
                <p className="mt-1 text-[11px] text-muted">{metric.trendLabel}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </WidgetShell>
  );
}

// ─── Card List ────────────────────────────────────────────────────────────────

function CardList({ widget }: { widget: CardListWidget }) {
  return (
    <WidgetShell title={widget.title}>
      <div className="space-y-2">
        {widget.cards.map((card, index) => {
          const ts = t(card.tone);
          return (
            <div
              key={card.id ?? index}
              className={["rounded-[8px] border bg-card p-3", ts.border].join(" ")}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-foreground">
                    {card.title}
                  </p>
                  {card.subtitle ? (
                    <p className="mt-0.5 text-[11.5px] text-muted">{card.subtitle}</p>
                  ) : null}
                </div>
                {card.badge ? (
                  <span
                    className={[
                      "shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
                      t(card.badgeTone).badge,
                    ].join(" ")}
                  >
                    {card.badge}
                  </span>
                ) : null}
              </div>
              {card.description ? (
                <p className="mt-1.5 text-[12px] leading-[1.5] text-muted">{card.description}</p>
              ) : null}
              {card.metadata && card.metadata.length > 0 ? (
                <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {card.metadata.map((entry) => (
                    <div key={entry.label} className="flex gap-1 text-[11.5px]">
                      <dt className="text-muted">{entry.label}:</dt>
                      <dd className="font-medium text-foreground">{entry.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          );
        })}
      </div>
    </WidgetShell>
  );
}

// ─── Business Card ────────────────────────────────────────────────────────────

function BusinessCard({ widget }: { widget: BusinessCardWidget }) {
  return (
    <WidgetShell>
      <div className="rounded-[10px] border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[14px] font-bold text-accent">
            {widget.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[14px] font-bold text-foreground">{widget.name}</p>
            {widget.subtitle ? (
              <p className="text-[12px] text-muted">{widget.subtitle}</p>
            ) : null}
          </div>
        </div>
        {widget.tags && widget.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {widget.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        {widget.fields.length > 0 ? (
          <dl className="mt-3 space-y-2 border-t border-border pt-3">
            {widget.fields.map((field) => (
              <div key={field.label} className="flex justify-between gap-4 text-[12.5px]">
                <dt className="text-muted">{field.label}</dt>
                <dd className="font-medium text-foreground">{field.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </WidgetShell>
  );
}

// ─── Alert List ───────────────────────────────────────────────────────────────

const SEVERITY_ICON: Record<AlertListWidget["alerts"][number]["severity"], string> = {
  critical: "⊗",
  info: "ⓘ",
  warning: "⚠",
};

function AlertList({ widget }: { widget: AlertListWidget }) {
  return (
    <WidgetShell title={widget.title}>
      <div className="space-y-2">
        {widget.alerts.map((alert, index) => {
          const tone = SEVERITY_TONE[alert.severity];
          const ts = t(tone);
          return (
            <div
              key={index}
              className={["flex gap-3 rounded-[8px] border p-3", ts.border].join(" ")}
            >
              <span className={["mt-0.5 shrink-0 text-[13px]", ts.text].join(" ")}>
                {SEVERITY_ICON[alert.severity]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={["text-[13px] font-semibold", ts.text].join(" ")}>
                    {alert.title}
                  </p>
                  {alert.value ? (
                    <span
                      className={[
                        "shrink-0 text-[12.5px] font-bold tabular-nums",
                        ts.text,
                      ].join(" ")}
                    >
                      {alert.value}
                    </span>
                  ) : null}
                </div>
                {alert.description ? (
                  <p className="mt-0.5 text-[11.5px] text-muted">{alert.description}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </WidgetShell>
  );
}

// ─── Ranking List ─────────────────────────────────────────────────────────────

function RankingList({ widget }: { widget: RankingListWidget }) {
  const count = widget.items.length;

  return (
    <WidgetShell title={widget.title}>
      <div className="overflow-hidden rounded-[8px] border border-border">
        {widget.items.map((item, index) => {
          const ts = t(item.tone);
          // Bar width decreases from full → narrow as rank increases
          const barPct = count > 1 ? ((count - index) / count) * 100 : 100;

          return (
            <div
              key={index}
              className="group relative border-b border-border/40 px-3 py-2.5 last:border-b-0"
            >
              {/* Background bar indicating relative magnitude */}
              <div
                aria-hidden
                className="absolute inset-y-0 left-0 rounded-l-[7px] bg-accent opacity-[0.07] transition-opacity group-hover:opacity-[0.14]"
                style={{ width: `${barPct}%` }}
              />

              <div className="relative flex items-center gap-3">
                <span className="w-5 shrink-0 text-center text-[11px] font-bold text-muted">
                  {item.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-foreground">
                    {item.label}
                  </p>
                  {item.description ? (
                    <p className="text-[11px] text-muted">{item.description}</p>
                  ) : null}
                </div>
                <span
                  className={[
                    "shrink-0 text-[13px] font-bold tabular-nums",
                    ts.text,
                  ].join(" ")}
                >
                  {item.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </WidgetShell>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function Timeline({ widget }: { widget: TimelineWidget }) {
  return (
    <WidgetShell title={widget.title}>
      <div className="space-y-0">
        {widget.events.map((event, index) => {
          const ts = t(event.tone);
          const isLast = index === widget.events.length - 1;
          return (
            <div key={index} className="flex gap-3">
              <div className="flex flex-col items-center gap-0">
                <div className={["mt-1.5 h-2 w-2 shrink-0 rounded-full", ts.dot].join(" ")} />
                {!isLast ? <div className="mt-1 w-px flex-1 bg-border" /> : null}
              </div>
              <div className="pb-3">
                <p className={["text-[12.5px] font-semibold", ts.text].join(" ")}>
                  {event.label}
                </p>
                <p className="text-[11px] text-muted">{event.date}</p>
                {event.description ? (
                  <p className="mt-0.5 text-[11.5px] text-muted">{event.description}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </WidgetShell>
  );
}

// ─── Shared shell ─────────────────────────────────────────────────────────────

function WidgetShell({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="mt-3 rounded-[10px] border border-border bg-surface-subtle p-3">
      {title ? (
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          {title}
        </p>
      ) : null}
      {children}
    </div>
  );
}

function PaginationBtn({
  disabled,
  label,
  onClick,
}: {
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="rounded-md px-2 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
