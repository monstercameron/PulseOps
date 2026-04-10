import { CatalogCard, StatusBadge, cx } from "@/features/catalog/components/catalog-primitives";
import { type PipelineRun } from "@/features/pipeline/constants/pipeline-page-content";

type FileStatusTimelineProps = Readonly<{
  description: string;
  emptyDescription: string;
  emptyTitle: string;
  items: readonly PipelineRun[];
  title: string;
}>;

const outcomeBadgeTones = {
  danger: "danger",
  info: "info",
  success: "success",
  warning: "warning",
} as const;

const stepStateClasses = {
  complete: "border-green-200 bg-green-50 text-green-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  current: "border-accent/25 bg-accent/10 text-accent",
  upcoming: "border-border bg-surface-subtle text-muted",
} as const;

const stepDotClasses = {
  complete: "bg-green-600 dark:bg-emerald-400",
  current: "bg-accent",
  upcoming: "bg-border",
} as const;

const nextActionClasses = {
  danger: "border-red-200 bg-red-50/70 dark:border-rose-500/20 dark:bg-rose-500/10",
  info: "border-blue-200 bg-blue-50/70 dark:border-sky-500/20 dark:bg-sky-500/10",
  success:
    "border-green-200 bg-green-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/10",
  warning:
    "border-amber-200 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/10",
} as const;

export function FileStatusTimeline({
  description,
  emptyDescription,
  emptyTitle,
  items,
  title,
}: FileStatusTimelineProps) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-muted">
          {title}
        </h2>
        <p className="mt-[3px] text-[12px] text-muted">{description}</p>
      </div>

      {items.length === 0 ? (
        <CatalogCard className="px-5 py-6">
          <p className="text-[13px] font-semibold text-foreground">{emptyTitle}</p>
          <p className="mt-1 text-[12px] leading-[1.6] text-muted">{emptyDescription}</p>
        </CatalogCard>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <CatalogCard
              key={item.id}
              className="overflow-hidden px-5 py-4 shadow-[0_10px_28px_rgba(20,34,53,0.06)]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-semibold leading-[1.4] text-foreground">
                        {item.fileName}
                      </p>
                      <StatusBadge
                        label={item.outcomeLabel}
                        tone={outcomeBadgeTones[item.outcomeTone]}
                        withDot
                      />
                    </div>
                    <p className="mt-1 text-[12px] text-muted">
                      {item.sourceLabel} | {item.documentType} | {item.recordsLabel}
                    </p>
                  </div>
                  <div className="grid min-w-[220px] gap-2 sm:grid-cols-3">
                    <RunMetaCard label="Confidence" value={item.confidenceLabel} />
                    <RunMetaCard label="Duration" value={item.durationLabel} />
                    <RunMetaCard label="Updated" value={item.timeLabel} />
                  </div>
                </div>

                <p className="mt-3 max-w-4xl text-[12.5px] leading-[1.6] text-muted">
                  {item.detail}
                </p>

                <div
                  className={cx(
                    "mt-4 rounded-[12px] border px-4 py-3",
                    nextActionClasses[item.outcomeTone],
                  )}
                >
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
                    Next move
                  </p>
                  <p className="mt-1 text-[12px] leading-[1.6] text-foreground">
                    {item.nextStepLabel}
                  </p>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto pb-1">
                <div className="flex min-w-[520px] gap-2">
                  {item.steps.map((step) => (
                    <div
                      key={`${item.id}-${step.label}`}
                      className={cx(
                        "flex min-w-[120px] items-center gap-2 rounded-[10px] border px-3 py-2",
                        stepStateClasses[step.state],
                      )}
                    >
                      <span
                        className={cx(
                          "h-2.5 w-2.5 shrink-0 rounded-full",
                          stepDotClasses[step.state],
                        )}
                      />
                      <span className="text-[11.5px] font-semibold">{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CatalogCard>
          ))}
        </div>
      )}
    </section>
  );
}

type RunMetaCardProps = Readonly<{
  label: string;
  value: string;
}>;

function RunMetaCard({ label, value }: RunMetaCardProps) {
  return (
    <div className="rounded-[10px] border border-border bg-surface-subtle px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </p>
      <p className="mt-1 text-[11.5px] leading-[1.5] text-foreground">{value}</p>
    </div>
  );
}
