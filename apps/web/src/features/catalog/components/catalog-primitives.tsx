import type { ReactNode } from "react";

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type ButtonVariant = "danger" | "ghost" | "primary" | "secondary";

type CatalogButtonProps = Readonly<{
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "reset" | "submit";
  variant?: ButtonVariant;
}>;

const buttonClasses: Record<ButtonVariant, string> = {
  danger:
    "border border-transparent bg-red-600 px-4 py-2 text-[12.5px] font-bold text-white hover:bg-red-700 active:scale-[.97] dark:bg-rose-600 dark:hover:bg-rose-500",
  primary:
    "border border-transparent bg-accent px-4 py-2 text-[12.5px] font-bold text-[#0d1b2a] hover:bg-accent-strong hover:shadow-[0_0_0_3px_var(--accent-glow)] active:scale-[.97] dark:border-[rgba(0,201,167,0.2)] dark:bg-accent-dim dark:text-accent dark:hover:border-[rgba(0,201,167,0.35)] dark:hover:bg-[rgba(0,201,167,0.18)]",
  secondary:
    "border border-border-strong bg-surface-subtle px-4 py-2 text-[12.5px] font-semibold text-foreground hover:bg-surface-muted active:scale-[.97]",
  ghost: "px-1 py-1 text-[12.5px] font-semibold text-accent hover:opacity-70 active:scale-[.97]",
};

export function CatalogButton({
  children,
  className,
  disabled = false,
  onClick,
  type = "button",
  variant = "secondary",
}: CatalogButtonProps) {
  return (
    <button
      className={cx(
        "inline-flex cursor-pointer items-center justify-center rounded-[7px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
        buttonClasses[variant],
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}

type CatalogCardProps = Readonly<{
  children: ReactNode;
  className?: string;
  tone?: "default" | "shell" | "subtle";
}>;

const cardToneClasses: Record<NonNullable<CatalogCardProps["tone"]>, string> = {
  default:
    "border border-border bg-card shadow-[0_1px_4px_rgba(20,34,53,0.06)]",
  shell:
    "border border-white/[0.06] bg-[#0d1b2a] text-white shadow-[0_24px_70px_rgba(13,27,42,0.28)]",
  subtle:
    "border border-border bg-card/80 shadow-[0_1px_4px_rgba(20,34,53,0.05)] dark:bg-white/[0.04]",
};

export function CatalogCard({
  children,
  className,
  tone = "default",
}: CatalogCardProps) {
  return (
    <article className={cx("rounded-[10px]", cardToneClasses[tone], className)}>
      {children}
    </article>
  );
}

type BadgeTone = "accent" | "neutral" | "success" | "warning" | "danger" | "info";

type StatusBadgeProps = Readonly<{
  label: string;
  tone?: BadgeTone;
  withDot?: boolean;
}>;

const badgeToneClasses: Record<BadgeTone, string> = {
  accent: "bg-accent/12 text-accent",
  neutral: "bg-surface-muted text-muted",
  success: "bg-green-50 text-green-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  danger: "bg-red-50 text-red-700 dark:bg-rose-500/15 dark:text-rose-300",
  info: "bg-blue-50 text-blue-700 dark:bg-sky-500/15 dark:text-sky-300",
};

const badgeDotClasses: Record<BadgeTone, string> = {
  accent: "bg-accent",
  neutral: "bg-muted",
  success: "bg-green-600",
  warning: "bg-amber-600",
  danger: "bg-red-600",
  info: "bg-blue-600",
};

export function StatusBadge({
  label,
  tone = "neutral",
  withDot = false,
}: StatusBadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em]",
        badgeToneClasses[tone],
      )}
    >
      {withDot ? (
        <span className={cx("h-1.5 w-1.5 rounded-full", badgeDotClasses[tone])} />
      ) : null}
      {label}
    </span>
  );
}

type CatalogSectionProps = Readonly<{
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}>;

export function CatalogSection({
  id,
  eyebrow,
  title,
  description,
  children,
}: CatalogSectionProps) {
  return (
    <section id={id} className="scroll-mt-8 space-y-5">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

type ConfidenceMeterProps = Readonly<{
  locale?: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
  value: number;
}>;

function getConfidenceTone(value: number) {
  if (value >= 0.9) {
    return {
      fill: "bg-green-600 dark:bg-emerald-400",
      text: "text-green-700 dark:text-emerald-300",
    };
  }

  if (value >= 0.8) {
    return {
      fill: "bg-amber-500 dark:bg-amber-400",
      text: "text-amber-700 dark:text-amber-300",
    };
  }

  return {
    fill: "bg-red-600 dark:bg-rose-400",
    text: "text-red-700 dark:text-rose-300",
  };
}

export function ConfidenceMeter({
  locale = "en-US",
  maximumFractionDigits = 2,
  minimumFractionDigits = 2,
  value,
}: ConfidenceMeterProps) {
  const tone = getConfidenceTone(value);
  const width = Math.max(0, Math.min(100, Math.round(value * 100)));
  const formattedValue = new Intl.NumberFormat(locale, {
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(value);

  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-muted">
        <span className={cx("block h-full rounded-full", tone.fill)} style={{ width: `${width}%` }} />
      </span>
      <span className={cx("text-xs font-semibold", tone.text)}>{formattedValue}</span>
    </span>
  );
}

type CatalogTableColumn<Row> = Readonly<{
  align?: "left" | "center" | "right";
  header: string;
  key: string;
  render: (row: Row) => ReactNode;
}>;

type CatalogTableProps<Row extends { id: string }> = Readonly<{
  ariaLabel: string;
  columns: readonly CatalogTableColumn<Row>[];
  rowClassName?: (row: Row) => string | undefined;
  rows: readonly Row[];
}>;

const tableAlignmentClasses = {
  center: "text-center",
  left: "text-start",
  right: "text-end",
} as const;

export function CatalogTable<Row extends { id: string }>({
  ariaLabel,
  columns,
  rowClassName,
  rows,
}: CatalogTableProps<Row>) {
  return (
    <div className="overflow-x-auto">
      <table aria-label={ariaLabel} className="min-w-full border-collapse text-sm">
        <caption className="sr-only">{ariaLabel}</caption>
        <thead>
          <tr className="border-b border-border bg-surface-subtle">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cx(
                  "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted",
                  tableAlignmentClasses[column.align ?? "left"],
                )}
                scope="col"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={cx(
                "border-b border-border last:border-b-0",
                rowClassName?.(row),
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cx(
                    "px-4 py-3 align-top text-[13px] text-foreground",
                    tableAlignmentClasses[column.align ?? "left"],
                  )}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
