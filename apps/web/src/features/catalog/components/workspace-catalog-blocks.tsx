import type { ReactNode } from "react";

import {
  CatalogButton,
  CatalogCard,
  ConfidenceMeter,
  StatusBadge,
  cx,
} from "@/features/catalog/components/catalog-primitives";

type WorkspaceHeaderProps = Readonly<{
  actions?: readonly { label: string; onClick?: () => void; variant?: "primary" | "secondary" }[];
  breadcrumbs: readonly string[];
  description: string;
  title: string;
}>;

export function WorkspaceHeader({
  actions = [],
  breadcrumbs,
  description,
  title,
}: WorkspaceHeaderProps) {
  return (
    <header className="border-b border-border bg-background px-[22px] pb-[14px] pt-[13px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-1 text-[11.5px] text-muted">
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb} className="inline-flex items-center gap-1">
                {index > 0 ? <span>/</span> : null}
                <span className={index === breadcrumbs.length - 1 ? "font-medium text-foreground" : undefined}>
                  {crumb}
                </span>
              </span>
            ))}
          </div>
          <h1 className="mb-[3px] mt-1 text-[18px] font-bold tracking-[-0.02em] text-foreground">
            {title}
          </h1>
          <p className="m-0 max-w-[520px] text-[13px] leading-[1.4] text-muted">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.label}
              className="inline-flex items-center gap-[7px] rounded-[7px] border border-border-strong bg-surface-subtle px-[11px] py-[6px] text-[12px] font-semibold text-muted transition hover:bg-surface-muted hover:text-foreground active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={action.onClick}
              type="button"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

type FilterChipProps = Readonly<{
  active?: boolean;
  label: string;
  onClick?: () => void;
}>;

export function FilterChip({
  active = false,
  label,
  onClick,
}: FilterChipProps) {
  return (
    <button
      className={cx(
        "inline-flex items-center gap-1.5 rounded-[8px] border px-3 py-1.5 text-[12.5px] font-medium transition active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-border bg-card text-muted hover:border-foreground/15 hover:bg-surface-subtle hover:text-foreground dark:hover:bg-surface-muted",
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

type MetricTileProps = Readonly<{
  detail: string;
  label: string;
  trend: string;
  tone?: "danger" | "info" | "neutral" | "success" | "warning";
  value: string;
}>;

const metricTrendClasses = {
  danger: "text-red-600 dark:text-rose-300",
  info: "text-blue-700 dark:text-sky-300",
  neutral: "text-muted",
  success: "text-green-700 dark:text-emerald-300",
  warning: "text-amber-700 dark:text-amber-300",
} as const;

export function MetricTile({
  detail,
  label,
  tone = "neutral",
  trend,
  value,
}: MetricTileProps) {
  return (
    <CatalogCard className="px-4 py-[14px] shadow-[0_10px_28px_rgba(20,34,53,0.06)]">
      <p className="mb-[6px] text-[10.5px] font-semibold uppercase tracking-[0.07em] text-muted">
        {label}
      </p>
      <div className="text-[22px] font-bold tracking-[-0.03em] leading-none text-foreground mb-1">
        {value}
      </div>
      <div className={cx("text-[11px] font-medium", metricTrendClasses[tone])}>
        {trend}
      </div>
      {detail ? <div className="mt-2 text-[11px] leading-[1.4] text-muted">{detail}</div> : null}
    </CatalogCard>
  );
}

type WorkspaceStatStripProps = Readonly<{
  items: readonly {
    detail: string;
    label: string;
    value: string;
  }[];
}>;

export function WorkspaceStatStrip({ items }: WorkspaceStatStripProps) {
  return (
    <CatalogCard className="overflow-hidden shadow-[0_10px_28px_rgba(20,34,53,0.06)]">
      <div className="grid divide-y divide-border md:grid-cols-2 md:divide-y-0 md:divide-x xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="bg-card px-[18px] py-[14px]">
            <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted">
              {item.label}
            </p>
            <p className="mt-[5px] text-[20px] font-extrabold tracking-[-0.03em] leading-none text-foreground">
              {item.value}
            </p>
            <p className="mt-1 text-[11px] leading-[1.4] text-muted">{item.detail}</p>
          </div>
        ))}
      </div>
    </CatalogCard>
  );
}

type WorkspaceAlertBannerProps = Readonly<{
  actionLabel?: string;
  description: string;
  dismissLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  title: string;
  tone: "danger" | "warning";
}>;

const alertBannerClasses = {
  danger: "border-red-200 bg-red-50 text-red-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200",
  warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200",
} as const;

const alertActionClasses = {
  danger: "text-red-700 hover:text-red-900 dark:text-rose-200 dark:hover:text-white",
  warning: "text-amber-700 hover:text-amber-900 dark:text-amber-200 dark:hover:text-white",
} as const;

export function WorkspaceAlertBanner({
  actionLabel,
  description,
  dismissLabel,
  onAction,
  onDismiss,
  title,
  tone,
}: WorkspaceAlertBannerProps) {
  return (
    <div
      className={cx(
        "flex flex-col gap-4 rounded-2xl border px-5 py-4 shadow-[0_10px_30px_rgba(20,34,53,0.05)] lg:flex-row lg:items-start lg:justify-between",
        alertBannerClasses[tone],
      )}
    >
      <div className="max-w-4xl">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-sm leading-7 text-current/80">{description}</p>
        {actionLabel ? (
          <button
            className={cx("mt-3 rounded text-sm font-semibold transition hover:opacity-80 active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current", alertActionClasses[tone])}
            onClick={onAction}
            type="button"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
      {dismissLabel ? (
        <CatalogButton onClick={onDismiss} variant="secondary">
          {dismissLabel}
        </CatalogButton>
      ) : null}
    </div>
  );
}

type ActivityFeedItemProps = Readonly<{
  action?: string;
  detail: string;
  label: string;
  onAction?: () => void;
  time: string;
  title: string;
  tone: "accent" | "danger" | "info" | "warning";
}>;

const activityToneConfig = {
  accent: { badgeClasses: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300", dot: "bg-accent" },
  danger: { badgeClasses: "bg-red-50 text-red-700 dark:bg-rose-500/10 dark:text-rose-300", dot: "bg-red-600" },
  info: { badgeClasses: "bg-blue-50 text-blue-700 dark:bg-sky-500/10 dark:text-sky-300", dot: "bg-blue-600" },
  warning: { badgeClasses: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300", dot: "bg-amber-600" },
} as const;

export function ActivityFeedItem({
  action,
  detail,
  label,
  onAction,
  time,
  title,
  tone,
}: ActivityFeedItemProps) {
  const config = activityToneConfig[tone];

  return (
    <div className="flex gap-3 border-b border-border py-3 last:border-b-0">
      <span className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", config.dot)} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start gap-2">
          <p className="flex-1 text-[13.5px] font-medium leading-[1.4] text-foreground">{title}</p>
          <span className={cx("shrink-0 rounded-[4px] px-[7px] py-[2px] text-[10px] font-bold uppercase", config.badgeClasses)}>
            {label}
          </span>
        </div>
        <p className="mt-1 text-xs leading-6 text-muted">{detail}</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-[11px] text-muted/75">{time}</span>
          {action ? (
            <button className="rounded-[5px] px-1 text-[11px] font-bold text-accent transition hover:text-accent/70 active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" onClick={onAction} type="button">
              {action}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type DecisionQueueCardProps = Readonly<{
  actions: readonly string[];
  context: string;
  onAction?: (action: string) => void;
  priority: "danger" | "info" | "warning";
  priorityLabel: string;
  title: string;
  typeLabel: string;
}>;

const queuePriorityBorderClasses = {
  danger: "border-l-red-600",
  info: "border-l-blue-600",
  warning: "border-l-amber-500",
} as const;

const queuePriorityBadgeTones = {
  danger: "danger",
  info: "info",
  warning: "warning",
} as const;

export function DecisionQueueCard({
  actions,
  context,
  onAction,
  priority,
  priorityLabel,
  title,
  typeLabel,
}: DecisionQueueCardProps) {
  return (
    <CatalogCard
      className={cx("border-l-[3px] p-[14px] shadow-none", queuePriorityBorderClasses[priority])}
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge
          label={priorityLabel}
          tone={queuePriorityBadgeTones[priority]}
        />
        <span className="text-[11px] font-medium text-muted">{typeLabel}</span>
      </div>
      <h3 className="mt-[6px] text-[13px] font-semibold leading-[1.35] text-foreground">{title}</h3>
      <p className="mb-[10px] mt-1 text-[11.5px] leading-[1.5] text-muted">{context}</p>
      <div className="flex flex-wrap gap-[6px]">
        {actions.map((action, index) => (
          <button
            key={action}
            className={cx(
              "rounded-[7px] px-3 py-[6px] text-[12px] font-semibold transition active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              index === 0
                ? "bg-[#142235] text-white dark:bg-surface-muted dark:text-foreground"
                : "border border-[rgba(20,34,53,.12)] bg-white text-[#142235] dark:border-border-strong dark:bg-surface-subtle dark:text-foreground",
            )}
            onClick={() => onAction?.(action)}
            type="button"
          >
            {action}
          </button>
        ))}
      </div>
    </CatalogCard>
  );
}

type SourceConnectionCardProps = Readonly<{
  actionLabel: string;
  detailRows: readonly {
    label: string;
    value: string;
  }[];
  healthLabel: string;
  healthTone: "danger" | "success" | "warning";
  onAction?: () => void;
  subtitle: string;
  title: string;
  typeChips: readonly string[];
}>;

export function SourceConnectionCard({
  actionLabel,
  detailRows,
  healthLabel,
  healthTone,
  onAction,
  subtitle,
  title,
  typeChips,
}: SourceConnectionCardProps) {
  return (
    <CatalogCard className="overflow-hidden shadow-[0_10px_28px_rgba(20,34,53,0.06)]">
      <div className="flex items-start gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <StatusBadge label={healthLabel} tone={healthTone} withDot />
          </div>
          <p className="mt-1 text-xs text-muted">{subtitle}</p>
        </div>
        <CatalogButton onClick={onAction} variant="secondary">
          {actionLabel}
        </CatalogButton>
      </div>
      <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
        {detailRows.map((row) => (
          <div key={row.label}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              {row.label}
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">{row.value}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Document types
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {typeChips.map((typeChip) => (
            <span
              key={typeChip}
              className="rounded-lg border border-border bg-surface-subtle px-2.5 py-1 text-[11px] font-medium text-muted"
            >
              {typeChip}
            </span>
          ))}
        </div>
      </div>
    </CatalogCard>
  );
}

type SignalCardProps = Readonly<{
  detail: string;
  label: string;
  tone: "danger" | "info" | "success" | "warning";
  value: string;
}>;

const signalCardClasses = {
  danger: "border-red-200 bg-red-50 text-red-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200",
  info: "border-blue-200 bg-blue-50 text-blue-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200",
  success: "border-green-200 bg-green-50 text-green-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200",
  warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200",
} as const;

const signalDotClasses = {
  danger: "bg-red-500",
  info: "bg-blue-500",
  success: "bg-green-500",
  warning: "bg-amber-400",
} as const;

export function SignalCard({ detail, label, tone, value }: SignalCardProps) {
  return (
    <CatalogCard className={cx("border p-[14px] shadow-none", signalCardClasses[tone])}>
      <div className="mb-[6px] flex items-center gap-[6px]">
        <span className={cx("h-2 w-2 shrink-0 rounded-full", signalDotClasses[tone])} />
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-current/70">
          {label}
        </p>
      </div>
      <div className="text-[22px] font-bold tracking-[-0.03em] leading-none mb-1">{value}</div>
      <p className="text-[11.5px] leading-[1.4] text-current/70">{detail}</p>
    </CatalogCard>
  );
}

type PackListItemProps = Readonly<{
  accent: "accent" | "info" | "warning";
  meta: string;
  periodLabel: string;
  status: "draft" | "ready";
  statusLabel: string;
  title: string;
}>;

const packAccentClasses = {
  accent: "bg-green-50 text-green-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  info: "bg-blue-50 text-blue-700 dark:bg-sky-500/15 dark:text-sky-300",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
} as const;

export function PackListItem({
  accent,
  meta,
  periodLabel,
  status,
  statusLabel,
  title,
}: PackListItemProps) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-border px-4 py-4 transition-colors hover:bg-surface-subtle dark:hover:bg-surface-muted">
      <div
        className={cx(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold",
          packAccentClasses[accent],
        )}
      >
        {title.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <StatusBadge
            label={statusLabel}
            tone={status === "ready" ? "success" : "warning"}
          />
        </div>
        <p className="mt-1 text-xs text-muted">
          {periodLabel} - {meta}
        </p>
      </div>
    </div>
  );
}

type PackSidebarItemProps = Readonly<{
  accent: "accent" | "info" | "warning";
  active?: boolean;
  meta: readonly string[];
  onClick?: () => void;
  statusLabel: string;
  statusTone: "success" | "warning";
  title: string;
}>;

export function PackSidebarItem({
  accent,
  active = false,
  meta,
  onClick,
  statusLabel,
  statusTone,
  title,
}: PackSidebarItemProps) {
  return (
    <button
      className={cx(
        "flex w-full items-start gap-4 border-b border-[rgba(20,34,53,.05)] px-5 py-[18px] text-left transition-colors last:border-b-0 dark:border-border",
        active
          ? "border-l-[3px] border-l-accent bg-[rgba(0,201,167,.05)] pl-[17px] dark:bg-accent-dim"
          : "hover:bg-[rgba(20,34,53,.015)] dark:hover:bg-surface-muted",
      )}
      onClick={onClick}
      type="button"
    >
      <div
        className={cx(
          "flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] text-sm font-bold",
          packAccentClasses[accent],
        )}
      >
        {title.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
          <span
            className={cx(
              "inline-flex items-center rounded-full px-[7px] py-[2px] text-[10px] font-bold",
              statusTone === "success"
                ? "bg-green-50 text-green-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
            )}
          >
            {statusLabel}
          </span>
        </div>
        <div className="mt-1">
          {meta.map((row) => (
            <p key={row} className="text-[11.5px] text-muted">
              {row}
            </p>
          ))}
        </div>
      </div>
    </button>
  );
}

type CitationListProps = Readonly<{
  items: readonly string[];
}>;

export function CitationList({ items }: CitationListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-lg border border-border bg-surface-subtle px-2.5 py-1 text-[11px] font-medium text-muted"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

type RecommendationCardProps = Readonly<{
  actions?: readonly string[];
  citations: readonly string[];
  confidence: number;
  locale?: string;
  onAction?: (action: string) => void;
  priority: "danger" | "info" | "success" | "warning";
  priorityLabel: string;
  summary: string;
  title: string;
}>;

const recommendationBorderClasses = {
  danger: "border-l-red-600",
  info: "border-l-blue-600",
  success: "border-l-green-600",
  warning: "border-l-amber-500",
} as const;

const recommendationBadgeTones = {
  danger: "danger",
  info: "info",
  success: "success",
  warning: "warning",
} as const;

export function RecommendationCard({
  actions = [],
  citations,
  confidence,
  locale = "en-US",
  onAction,
  priority,
  priorityLabel,
  summary,
  title,
}: RecommendationCardProps) {
  return (
    <CatalogCard className={cx("border-l-[3px] p-5", recommendationBorderClasses[priority])}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              {title}
            </h3>
            <StatusBadge
              label={priorityLabel}
              tone={recommendationBadgeTones[priority]}
              withDot
            />
            <ConfidenceMeter locale={locale} value={confidence} />
          </div>
          <p className="mt-3 text-sm leading-7 text-muted">{summary}</p>
          <div className="mt-4">
            <CitationList items={citations} />
          </div>
        </div>

        {actions.length > 0 ? (
          <div className="flex flex-col gap-2">
            {actions.map((action, index) => (
              <CatalogButton
                key={action}
                onClick={() => onAction?.(action)}
                variant={index === 0 ? "primary" : "secondary"}
              >
                {action}
              </CatalogButton>
            ))}
          </div>
        ) : null}
      </div>
    </CatalogCard>
  );
}

type ConversationBubbleProps = Readonly<{
  avatarLabel: string;
  footer?: ReactNode;
  role: "assistant" | "user";
  children: ReactNode;
}>;

export function ConversationBubble({
  avatarLabel,
  children,
  footer,
  role,
}: ConversationBubbleProps) {
  const isAssistant = role === "assistant";

  return (
    <div className={cx("flex gap-3", isAssistant ? "" : "justify-end")}>
      {isAssistant ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent font-bold text-slate-950">
          {avatarLabel}
        </div>
      ) : null}
      <div
        className={cx(
          "max-w-3xl rounded-[12px] px-4 py-[14px] text-sm leading-7",
          isAssistant
            ? "rounded-tl-none border border-border border-l-[3px] border-l-accent bg-card shadow-[0_1px_4px_rgba(20,34,53,0.05)] dark:shadow-[0_16px_40px_rgba(2,6,23,0.35)]"
            : "rounded-tr-none bg-[#0d1b2a] text-white shadow-[0_16px_40px_rgba(13,27,42,0.25)] dark:bg-[#18304a]",
        )}
      >
        {children}
        {footer ? (
          <div className="mt-4 border-t border-border pt-3">{footer}</div>
        ) : null}
      </div>
      {!isAssistant ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1d4166] font-bold text-white">
          {avatarLabel}
        </div>
      ) : null}
    </div>
  );
}

type SourceDataRowProps = Readonly<{
  classLabel: string;
  confidenceLabel: string;
  contributionLabel: string;
  name: string;
}>;

export function SourceDataRow({
  classLabel,
  confidenceLabel,
  contributionLabel,
  name,
}: SourceDataRowProps) {
  return (
    <div className="grid gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0 md:grid-cols-[2fr_1fr_1fr_1fr]">
      <span className="font-medium text-foreground">{name}</span>
      <span className="text-muted">{classLabel}</span>
      <span className="font-medium text-green-700 dark:text-emerald-300">{confidenceLabel}</span>
      <span className="text-muted">{contributionLabel}</span>
    </div>
  );
}
