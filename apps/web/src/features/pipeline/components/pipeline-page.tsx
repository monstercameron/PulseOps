"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { PlaceholderActionDialog } from "@/features/catalog/components/catalog-dialogs";
import {
  CatalogButton,
  CatalogCard,
  StatusBadge,
  cx,
} from "@/features/catalog/components/catalog-primitives";
import {
  FilterChip,
  SourceConnectionCard,
  WorkspaceAlertBanner,
  WorkspaceHeader,
  WorkspaceStatStrip,
} from "@/features/catalog/components/workspace-catalog-blocks";
import { useUiI18n } from "@/features/i18n/components/ui-i18n-provider";
import { FileStatusTimeline } from "@/features/pipeline/components/file-status-timeline";
import {
  type PipelineFilter,
  type PipelinePageData,
  type PipelineRule,
} from "@/features/pipeline/constants/pipeline-page-content";
import { UploadFilesModal } from "@/features/uploads/components/upload-files-modal";

type PipelinePageProps = Readonly<{
  initialData: PipelinePageData;
  orgId: string;
}>;

type PlaceholderAction = Readonly<{
  description?: string;
  title: string;
}> | null;

const focusToneClasses = {
  danger: "border-red-200 bg-red-50/70 dark:border-rose-500/20 dark:bg-rose-500/10",
  info: "border-blue-200 bg-blue-50/70 dark:border-sky-500/20 dark:bg-sky-500/10",
  success: "border-green-200 bg-green-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/10",
  warning: "border-amber-200 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/10",
} as const;

const stageToneClasses = {
  danger: "border-red-200 bg-red-50 dark:border-rose-500/20 dark:bg-rose-500/10",
  info: "border-blue-200 bg-blue-50 dark:border-sky-500/20 dark:bg-sky-500/10",
  neutral: "border-border bg-surface-subtle",
  success: "border-green-200 bg-green-50 dark:border-emerald-500/20 dark:bg-emerald-500/10",
  warning: "border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10",
} as const;

const playbookToneClasses = {
  danger: "border-red-200 bg-red-50/70 dark:border-rose-500/20 dark:bg-rose-500/10",
  info: "border-blue-200 bg-blue-50/70 dark:border-sky-500/20 dark:bg-sky-500/10",
  success:
    "border-green-200 bg-green-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/10",
  warning:
    "border-amber-200 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/10",
} as const;

export function PipelinePage({ initialData, orgId }: PipelinePageProps) {
  const { messages, t } = useUiI18n();
  const labels = messages.pipelinePage.labels;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFiltering, startFiltering] = useTransition();
  const [placeholderAction, setPlaceholderAction] = useState<PlaceholderAction>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const activeFilter =
    initialData.filters.find((filter) => filter.active) ?? initialData.filters[0];
  const alertAction =
    initialData.alert === null
      ? null
      : activeFilter.id === "attention"
        ? {
            label: t("pipelinePage.showAllFiles", "Show all files"),
            onClick: () => applyStatusFilter(undefined),
          }
        : {
            label:
              initialData.alert.actionLabel ??
              t("pipelinePage.showBlockedFiles", "Show blocked files"),
            onClick: () => applyStatusFilter("failed"),
          };
  const primaryFocusAction = resolvePrimaryFocusAction({
    activeFilter,
    alertPresent: initialData.alert !== null,
    filters: initialData.filters,
    t,
  });

  function openPlaceholderAction(title: string, description?: string) {
    console.info(`[PulseOps] ${title}: not implemented yet.`);
    setPlaceholderAction({ description, title });
  }

  function applyStatusFilter(queryValue?: string) {
    const nextSearchParams = new URLSearchParams(searchParams.toString());

    if (queryValue === undefined || queryValue.length === 0) {
      nextSearchParams.delete("status");
    } else {
      nextSearchParams.set("status", queryValue);
    }

    const nextUrl = nextSearchParams.toString();

    startFiltering(() => {
      router.replace(nextUrl.length > 0 ? `${pathname}?${nextUrl}` : pathname, {
        scroll: false,
      });
    });
  }

  function handleSourceAction(source: PipelinePageData["sources"][number]) {
    if (source.id === "source_upload") {
      setShowUploadModal(true);
      return;
    }

    if (source.healthTone === "warning") {
      applyStatusFilter("failed");
      return;
    }

    openPlaceholderAction(source.actionLabel, source.title);
  }

  return (
    <div className="flex min-h-full flex-col">
      <WorkspaceHeader
        actions={[
          {
            label: labels.actions.secondary,
            onClick: () => applyStatusFilter("failed"),
            variant: "secondary",
          },
          {
            label: labels.actions.primary,
            onClick: () => setShowUploadModal(true),
            variant: "primary",
          },
        ]}
        breadcrumbs={labels.breadcrumbs}
        description={labels.description}
        title={labels.title}
      />

      <div className="flex-1 px-6 py-6" aria-busy={isFiltering}>
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
          <div className="space-y-5">
            <CatalogCard
              className={cx(
                "overflow-hidden px-5 py-5 shadow-[0_10px_28px_rgba(20,34,53,0.06)]",
                focusToneClasses[initialData.focus.tone],
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
                    {t("pipelinePage.focusHeading", "What needs attention now")}
                  </p>
                  <h2 className="mt-2 text-[26px] font-bold leading-[1.1] tracking-[-0.03em] text-foreground">
                    {initialData.focus.title}
                  </h2>
                  <p className="mt-3 text-[14px] leading-7 text-muted">
                    {initialData.focus.description}
                  </p>
                </div>

                {initialData.alert ? (
                  <StatusBadge
                    label={t("pipelinePage.attentionBadge", "Needs attention")}
                    tone="warning"
                    withDot
                  />
                ) : null}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-4">
                {initialData.stages.map((stage) => (
                  <PipelineStageCard
                    key={stage.id}
                    count={stage.count}
                    description={stage.description}
                    label={stage.label}
                    tone={stage.tone}
                  />
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <CatalogButton
                  onClick={() => {
                    if (primaryFocusAction.type === "filter") {
                      applyStatusFilter(primaryFocusAction.queryValue);
                      return;
                    }

                    setShowUploadModal(true);
                  }}
                  variant="primary"
                >
                  {primaryFocusAction.label}
                </CatalogButton>
                <CatalogButton onClick={() => setShowUploadModal(true)} variant="secondary">
                  {labels.actions.primary}
                </CatalogButton>
              </div>
            </CatalogCard>

            {initialData.alert ? (
              <WorkspaceAlertBanner
                actionLabel={alertAction?.label}
                description={initialData.alert.description}
                onAction={alertAction?.onClick}
                title={initialData.alert.title}
                tone={initialData.alert.tone}
              />
            ) : null}
          </div>

          <CatalogCard className="px-5 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
              {t("pipelinePage.currentViewHeading", "Current view")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {initialData.filters.map((filter) => (
                <FilterChip
                  key={filter.id}
                  active={filter.active}
                  label={`${filter.label} (${filter.count})`}
                  onClick={() => applyStatusFilter(filter.queryValue)}
                />
              ))}
            </div>
            <div
              aria-live="polite"
              className={cx(
                "mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium",
                isFiltering
                  ? "border-accent/25 bg-accent/10 text-accent"
                  : "border-border bg-card text-muted",
              )}
            >
              <span
                className={cx(
                  "h-1.5 w-1.5 rounded-full",
                  isFiltering ? "animate-pulse bg-accent" : "bg-green-500",
                )}
              />
              <span>
                {isFiltering
                  ? t("pipelinePage.filteringLabel", "Refreshing this pipeline view...")
                  : t("pipelinePage.liveLabel", "Live view ready")}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              <ScopeDetailCard
                label={t("pipelinePage.scopeLabel", "Showing")}
                value={buildScopeDescription(activeFilter)}
              />
              <ScopeDetailCard
                label={t("pipelinePage.scopeNext", "Best next move")}
                value={buildScopeNextStep(activeFilter, t)}
              />
            </div>

            <div className="mt-5 border-t border-border pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                {initialData.playbook.title}
              </p>
              <p className="mt-2 text-[12px] leading-[1.6] text-muted">
                {initialData.playbook.description}
              </p>
              <div className="mt-4 space-y-3">
                {initialData.playbook.steps.map((step) => (
                  <PipelinePlaybookStepCard
                    key={step.id}
                    description={step.description}
                    label={step.label}
                    tone={step.tone}
                  />
                ))}
              </div>
            </div>
          </CatalogCard>
        </div>

        <div className="mt-5">
          <WorkspaceStatStrip items={initialData.stats} />
        </div>

        <div className="mt-7">
          <FileStatusTimeline
            description={labels.sectionDescriptions.runs}
            emptyDescription={t(
              "pipelinePage.emptyRunsDescription",
              "Upload a file or clear the filter to bring recent file progress back into view.",
            )}
            emptyTitle={t(
              "pipelinePage.emptyRunsTitle",
              "No recent file progress is visible in this scope.",
            )}
            items={initialData.runs}
            title={labels.sectionTitles.runs}
          />
        </div>

        <section className="mt-7">
          <div className="mb-3">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-muted">
              {labels.sectionTitles.sources}
            </h2>
            <p className="mt-[3px] text-[12px] text-muted">
              {labels.sectionDescriptions.sources}
            </p>
          </div>
          {initialData.sources.length === 0 ? (
            <CatalogCard className="px-5 py-6">
              <p className="text-[13px] font-semibold text-foreground">
                {t("pipelinePage.emptySourcesTitle", "No intake paths match this filter")}
              </p>
              <p className="mt-1 text-[12px] leading-[1.6] text-muted">
                {t(
                  "pipelinePage.emptySourcesDescription",
                  "Clear the filter to see the active intake paths for this workspace.",
                )}
              </p>
            </CatalogCard>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {initialData.sources.map((source) => (
                <SourceConnectionCard
                  key={source.id}
                  actionLabel={source.actionLabel}
                  detailRows={source.detailRows}
                  documentTypesLabel={t(
                    "pipelinePage.documentTypesLabel",
                    "Accepted document types",
                  )}
                  healthLabel={source.healthLabel}
                  healthTone={source.healthTone}
                  onAction={() => handleSourceAction(source)}
                  subtitle={source.subtitle}
                  title={source.title}
                  typeChips={source.typeChips}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-7">
          <div className="mb-3">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-muted">
              {labels.sectionTitles.rules}
            </h2>
            <p className="mt-[3px] text-[12px] text-muted">
              {labels.sectionDescriptions.rules}
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {initialData.rules.map((rule) => (
              <PipelineRuleCard key={rule.id} rule={rule} />
            ))}
          </div>
        </section>
      </div>

      {placeholderAction ? (
        <PlaceholderActionDialog
          description={placeholderAction.description}
          onClose={() => setPlaceholderAction(null)}
          title={placeholderAction.title}
        />
      ) : null}

      {showUploadModal ? (
        <UploadFilesModal
          orgId={orgId}
          onClose={() => setShowUploadModal(false)}
        />
      ) : null}
    </div>
  );
}

type PipelineStageCardProps = Readonly<{
  count: string;
  description: string;
  label: string;
  tone: "danger" | "info" | "neutral" | "success" | "warning";
}>;

function PipelineStageCard({
  count,
  description,
  label,
  tone,
}: PipelineStageCardProps) {
  return (
    <div className={cx("rounded-[10px] border px-4 py-3", stageToneClasses[tone])}>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </p>
      <p className="mt-2 text-[24px] font-bold leading-none tracking-[-0.03em] text-foreground">
        {count}
      </p>
      <p className="mt-2 text-[11.5px] leading-[1.5] text-muted">{description}</p>
    </div>
  );
}

type ScopeDetailCardProps = Readonly<{
  label: string;
  value: string;
}>;

function ScopeDetailCard({ label, value }: ScopeDetailCardProps) {
  return (
    <div className="rounded-[10px] border border-border bg-surface-subtle px-4 py-3">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </p>
      <p className="mt-1 text-[12px] leading-[1.6] text-foreground">{value}</p>
    </div>
  );
}

function buildScopeDescription(filter: PipelineFilter) {
  if (filter.id === "all") {
    return "All pipeline files in this workspace are visible.";
  }

  return `${filter.label} only. ${filter.count} file${filter.count === 1 ? "" : "s"} in scope.`;
}

function buildScopeNextStep(
  filter: PipelineFilter,
  t: ReturnType<typeof useUiI18n>["t"],
) {
  if (filter.id === "attention") {
    return t(
      "pipelinePage.scopeAttention",
      "Start with the blocked files so they do not hide downstream insight.",
    );
  }

  if (filter.id === "review") {
    return t(
      "pipelinePage.scopeReview",
      "These files have finished intake. The pipeline work is to confirm they are ready for handoff, not to review the facts here.",
    );
  }

  if (filter.id === "ready") {
    return t(
      "pipelinePage.scopeReady",
      "These files are already clear on the pipeline side and can now support downstream review and weekly brief work.",
    );
  }

  if (filter.id === "intake") {
    return t(
      "pipelinePage.scopeIntake",
      "Wait for intake checks to finish, then review the file details if needed.",
    );
  }

  return t(
    "pipelinePage.scopeAll",
    "Use the stage counts and recent file progress to decide where to jump in first.",
  );
}

function resolvePrimaryFocusAction(input: Readonly<{
  activeFilter: PipelineFilter;
  alertPresent: boolean;
  filters: readonly PipelineFilter[];
  t: ReturnType<typeof useUiI18n>["t"];
}>) {
  if (input.activeFilter.id !== "all") {
    return {
      label: input.t("pipelinePage.showAllFiles", "Show all files"),
      queryValue: undefined,
      type: "filter" as const,
    };
  }

  if (input.alertPresent) {
    return {
      label: input.t("pipelinePage.showBlockedFiles", "Show blocked files"),
      queryValue: "failed",
      type: "filter" as const,
    };
  }

  if (input.filters.some((filter) => filter.id === "review" && filter.count > 0)) {
    return {
      label: input.t(
        "pipelinePage.showReviewFiles",
        "Show files ready for review",
      ),
      queryValue: "parsed,classified",
      type: "filter" as const,
    };
  }

  if (input.filters.some((filter) => filter.id === "ready" && filter.count > 0)) {
    return {
      label: input.t("pipelinePage.showReadyFiles", "Show facts-ready files"),
      queryValue: "extracted",
      type: "filter" as const,
    };
  }

  return {
    label: input.t("pipelinePage.uploadAction", "Upload another file"),
    type: "upload" as const,
  };
}

function PipelinePlaybookStepCard({
  description,
  label,
  tone,
}: Readonly<{
  description: string;
  label: string;
  tone: "danger" | "info" | "success" | "warning";
}>) {
  return (
    <div
      className={cx("rounded-[10px] border px-4 py-3", playbookToneClasses[tone])}
    >
      <p className="text-[12px] font-semibold text-foreground">
        {label}
      </p>
      <p className="mt-1 text-[12px] leading-[1.6] text-foreground">
        {description}
      </p>
    </div>
  );
}

function PipelineRuleCard({ rule }: Readonly<{ rule: PipelineRule }>) {
  return (
    <CatalogCard className="px-5 py-5 shadow-[0_10px_28px_rgba(20,34,53,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            {rule.sourceLabel}
          </p>
          <h3 className="mt-1 text-[15px] font-semibold text-foreground">
            {rule.documentType}
          </h3>
        </div>
        <StatusBadge
          label={rule.briefEnabled ? "Feeds weekly brief" : "Review only"}
          tone={rule.briefEnabled ? "success" : "info"}
          withDot
        />
      </div>

      <p className="mt-3 text-[12.5px] leading-[1.6] text-muted">{rule.policyLabel}</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <RuleStageFlag enabled={rule.llmEnabled} label="LLM review" />
        <RuleStageFlag enabled={rule.sqlEnabled} label="Canonical storage" />
        <RuleStageFlag enabled={rule.vectorEnabled} label="Retriever ready" />
        <RuleStageFlag enabled={rule.briefEnabled} label="Brief eligible" />
      </div>

      <div className="mt-4 grid gap-3">
        {rule.detailFields.map((field) => (
          <div key={`${rule.id}-${field.label}`} className="rounded-[10px] border border-border bg-surface-subtle px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
              {field.label}
            </p>
            <p className="mt-1 text-[11.5px] leading-[1.5] text-foreground">
              {field.value}
            </p>
          </div>
        ))}
      </div>
    </CatalogCard>
  );
}

function RuleStageFlag({
  enabled,
  label,
}: Readonly<{ enabled: boolean; label: string }>) {
  return (
    <div
      className={cx(
        "rounded-[10px] border px-3 py-2",
        enabled
          ? "border-green-200 bg-green-50 dark:border-emerald-500/20 dark:bg-emerald-500/10"
          : "border-border bg-surface-subtle",
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </p>
      <p className="mt-1 text-[11.5px] font-semibold text-foreground">
        {enabled ? "Enabled" : "Not used"}
      </p>
    </div>
  );
}
