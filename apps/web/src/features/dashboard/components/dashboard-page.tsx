"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

import { PlaceholderActionDialog } from "@/features/catalog/components/catalog-dialogs";
import {
  CatalogButton,
  CatalogCard,
  StatusBadge,
  cx,
} from "@/features/catalog/components/catalog-primitives";
import {
  ActivityFeedItem,
  DecisionQueueCard,
  MetricTile,
  SignalCard,
  WorkspaceHeader,
} from "@/features/catalog/components/workspace-catalog-blocks";
import { DashboardFilterBar } from "@/features/dashboard/components/dashboard-filter-bar";
import {
  type DashboardPageData,
  type DashboardQueueItem,
} from "@/features/dashboard/constants/dashboard-page-content";
import { resolveDashboardQueueAction } from "@/features/dashboard/lib/dashboard-interactions";
import { resolveQueueItemAction } from "@/features/dashboard/server/dashboard-actions";
import { useUiI18n } from "@/features/i18n/components/ui-i18n-provider";
import { UploadFilesModal } from "@/features/uploads/components/upload-files-modal";

type DashboardPageProps = Readonly<{
  initialData: DashboardPageData;
  orgId: string;
}>;

type DashboardSummaryTone = "danger" | "info" | "neutral" | "success" | "warning";

type DashboardView = "business" | "operations";
type PlaceholderAction = Readonly<{
  description?: string;
  title: string;
}> | null;

export function DashboardPage({ initialData, orgId }: DashboardPageProps) {
  const { messages, t } = useUiI18n();
  const router = useRouter();
  const labels = messages.dashboardPage.labels;
  const actionLabels = messages.dashboardPage.actionLabels;
  const [activeView, setActiveView] = useState<DashboardView>("operations");
  const [queueItems, setQueueItems] = useState(initialData.queueItems);
  const [recentActivity, setRecentActivity] = useState(initialData.recentActivity);
  const [placeholderAction, setPlaceholderAction] = useState<PlaceholderAction>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    setQueueItems(initialData.queueItems);
  }, [initialData.queueItems]);

  useEffect(() => {
    setRecentActivity(initialData.recentActivity);
  }, [initialData.recentActivity]);

  function openPlaceholderAction(title: string, description?: string) {
    console.info(`[PulseOps] ${title}: not implemented yet.`);
    setPlaceholderAction({ description, title });
  }

  function resolveCanonicalActionLabel(actionLabel: string) {
    const localizedActionMap = new Map<string, string>([
      [actionLabels.approve, "Approve"],
      [actionLabels.dismiss, "Dismiss"],
      [actionLabels.discard, "Discard"],
      [actionLabels.fix, "Fix"],
      [actionLabels.inspect, "Inspect"],
      [actionLabels.inspectFiles, "Inspect files"],
      [actionLabels.invoiceDate, "Invoice date"],
      [actionLabels.keepSeparate, "Keep separate"],
      [actionLabels.merge, "Merge"],
      [actionLabels.openAsk, "Open Ask"],
      [actionLabels.openBrief, "Open brief"],
      [actionLabels.openExplorer, "Open explorer"],
      [actionLabels.review, "Review"],
      [actionLabels.serviceDate, "Service date"],
      [actionLabels.skip, "Skip"],
    ]);

    return localizedActionMap.get(actionLabel) ?? actionLabel;
  }

  function localizeActionLabel(actionLabel: string) {
    switch (actionLabel) {
      case "Approve":
        return actionLabels.approve;
      case "Dismiss":
        return actionLabels.dismiss;
      case "Discard":
        return actionLabels.discard;
      case "Fix":
        return actionLabels.fix;
      case "Inspect":
        return actionLabels.inspect;
      case "Inspect files":
        return actionLabels.inspectFiles;
      case "Invoice date":
        return actionLabels.invoiceDate;
      case "Keep separate":
        return actionLabels.keepSeparate;
      case "Merge":
        return actionLabels.merge;
      case "Open Ask":
        return actionLabels.openAsk;
      case "Open brief":
      case "Open this week's brief":
        return actionLabels.openBrief;
      case "Open explorer":
        return actionLabels.openExplorer;
      case "Review":
        return actionLabels.review;
      case "Service date":
        return actionLabels.serviceDate;
      case "Skip":
        return actionLabels.skip;
      default:
        return actionLabel;
    }
  }

  function navigateForActionLabel(actionLabel: string) {
    switch (resolveCanonicalActionLabel(actionLabel)) {
      case labels.actions.primary:
        setShowUploadModal(true);
        return true;
      case "Fix":
      case "Inspect":
      case "Inspect files": {
        router.push("/pipeline");
        return true;
      }
      case labels.actions.secondary:
      case "Open brief":
      case "Open this week's brief": {
        router.push("/packs");
        return true;
      }
      case "Approve":
      case "Open explorer":
      case "Review": {
        router.push("/explorer");
        return true;
      }
      case "Open Ask": {
        router.push("/ask");
        return true;
      }
      default: {
        return false;
      }
    }
  }

  function handleQueueAction(action: string, item: DashboardQueueItem) {
    const canonicalAction = resolveCanonicalActionLabel(action);
    const resolvedAction = resolveDashboardQueueAction({
      action: canonicalAction,
      item,
      queueItems,
      recentActivity,
    });

    if (resolvedAction !== null) {
      setQueueItems(resolvedAction.nextQueueItems);
      setRecentActivity(resolvedAction.nextRecentActivity);
      startTransition(() => {
        void resolveQueueItemAction(item.id, canonicalAction);
      });
      return;
    }

    if (navigateForActionLabel(canonicalAction)) {
      return;
    }

    openPlaceholderAction(action, item.title);
  }

  function handleActivityAction(actionLabel: string, title: string) {
    if (navigateForActionLabel(actionLabel)) {
      return;
    }

    openPlaceholderAction(actionLabel, title);
  }

  const [
    ,
    parseSuccessMetric,
    ,
    awaitingReviewMetric,
    extractedDocsMetric,
    criticalFailuresMetric,
    inScopeFactsMetric,
  ] = initialData.metrics;
  const primaryQueueItem = queueItems[0];
  const focusTitle =
    activeView === "operations"
      ? primaryQueueItem?.title ??
        t("dashboardPage.focus.clearTitle", "The current scope is clear")
      : initialData.businessSummary.title;
  const focusDescription =
    activeView === "operations"
      ? primaryQueueItem?.context ??
        t(
          "dashboardPage.focus.clearDescription",
          "Nothing is blocking document review right now. You can upload another file or move into Explorer and the weekly brief.",
        )
      : initialData.businessSummary.description;
  const focusStats: readonly {
    detail: string;
    label: string;
    tone: DashboardSummaryTone;
    value: string;
  }[] =
    activeView === "operations"
      ? [
          {
            detail:
              queueItems.length === 0
                ? t(
                    "dashboardPage.focus.queueClear",
                    "No queue blockers are open in this scope.",
                  )
                : t(
                    "dashboardPage.focus.queueOpen",
                    "{{count}} item still needs attention first.",
                    { count: queueItems.length },
                  ),
            label: t("dashboardPage.focus.queueLabel", "Open queue"),
            tone:
              queueItems.length > 0 && primaryQueueItem !== undefined
                ? mapPriorityToSummaryTone(primaryQueueItem.priority)
                : "success",
            value: String(queueItems.length),
          },
          {
            detail: awaitingReviewMetric.detail,
            label: awaitingReviewMetric.label,
            tone: awaitingReviewMetric.tone,
            value: awaitingReviewMetric.value,
          },
          {
            detail: criticalFailuresMetric.detail,
            label: criticalFailuresMetric.label,
            tone: criticalFailuresMetric.tone,
            value: criticalFailuresMetric.value,
          },
        ]
      : [
          {
            detail: extractedDocsMetric.detail,
            label: extractedDocsMetric.label,
            tone: extractedDocsMetric.tone,
            value: extractedDocsMetric.value,
          },
          {
            detail: inScopeFactsMetric.detail,
            label: inScopeFactsMetric.label,
            tone: inScopeFactsMetric.tone,
            value: inScopeFactsMetric.value,
          },
          {
            detail: parseSuccessMetric.detail,
            label: parseSuccessMetric.label,
            tone: parseSuccessMetric.tone,
            value: parseSuccessMetric.value,
          },
        ];

  return (
    <div className="flex min-h-full flex-col">
      <WorkspaceHeader
        actions={[
          {
            label: labels.actions.secondary,
            onClick: () => {
              navigateForActionLabel(labels.actions.secondary);
            },
            variant: "secondary",
          },
          {
            label: labels.actions.primary,
            onClick: () => {
              if (labels.actions.primary.toLowerCase().includes("upload")) {
                setShowUploadModal(true);
              } else {
                navigateForActionLabel(labels.actions.primary);
              }
            },
            variant: "primary",
          },
        ]}
        breadcrumbs={labels.breadcrumbs}
        description={labels.description}
        title={labels.title}
      />

      <div className="sticky top-0 z-10 border-b border-border bg-background/[0.96] px-6 py-3 backdrop-blur-sm">
        <DashboardFilterBar filters={initialData.filters} />
        <div className="mt-3 grid gap-2 lg:grid-cols-2">
          <DashboardScopeSummaryCard
            description={initialData.filterSummary.globalScopeLabel}
            label={t("dashboardPage.scope.kpiLabel", "Top metrics")}
          />
          <DashboardScopeSummaryCard
            description={initialData.filterSummary.scopedResultsLabel}
            label={t("dashboardPage.scope.resultsLabel", "Below on this page")}
          />
        </div>
      </div>

      <div className="flex-1 px-6 py-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.9fr)]">
          <CatalogCard className="overflow-hidden px-5 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
                  {activeView === "operations"
                    ? t("dashboardPage.focus.heading", "What needs attention now")
                    : initialData.labels.businessSummaryEyebrow}
                </p>
                <h2 className="mt-2 text-[26px] font-bold leading-[1.1] tracking-[-0.03em] text-foreground">
                  {focusTitle}
                </h2>
                <p className="mt-3 max-w-3xl text-[14px] leading-7 text-muted">
                  {focusDescription}
                </p>
              </div>
              {activeView === "operations" && queueItems.length > 0 ? (
                <StatusBadge
                  label={primaryQueueItem.priorityLabel}
                  tone={mapPriorityToBadgeTone(primaryQueueItem.priority)}
                  withDot
                />
              ) : null}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {focusStats.map((stat) => (
                <DashboardSummaryStat
                  key={stat.label}
                  detail={stat.detail}
                  label={stat.label}
                  tone={stat.tone}
                  value={stat.value}
                />
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {activeView === "operations" ? (
                <>
                  <CatalogButton onClick={() => setShowUploadModal(true)} variant="primary">
                    {labels.actions.primary}
                  </CatalogButton>
                  <CatalogButton
                    onClick={() => navigateForActionLabel(actionLabels.openExplorer)}
                    variant="secondary"
                  >
                    {messages.dashboardPage.openExplorer}
                  </CatalogButton>
                </>
              ) : (
                <>
                  <CatalogButton
                    onClick={() =>
                      handleActivityAction(
                        localizeActionLabel(initialData.businessSummary.actionLabel),
                        initialData.businessSummary.title,
                      )
                    }
                    variant="primary"
                  >
                    {localizeActionLabel(initialData.businessSummary.actionLabel)}
                  </CatalogButton>
                  <CatalogButton
                    onClick={() => navigateForActionLabel(actionLabels.openExplorer)}
                    variant="secondary"
                  >
                    {messages.dashboardPage.openExplorer}
                  </CatalogButton>
                </>
              )}
            </div>
          </CatalogCard>

          <CatalogCard className="px-5 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
              {t("dashboardPage.scope.heading", "Current scope")}
            </p>
            <div className="mt-4 space-y-3">
              <DashboardScopeDetail
                label={t("dashboardPage.scope.metricsLabel", "What the KPI strip covers")}
                value={initialData.filterSummary.globalScopeLabel}
              />
              <DashboardScopeDetail
                label={t("dashboardPage.scope.sectionsLabel", "What the lower sections show")}
                value={initialData.filterSummary.scopedResultsLabel}
              />
              <DashboardScopeDetail
                label={t("dashboardPage.scope.nextLabel", "Recommended next stop")}
                value={
                  queueItems.length > 0
                    ? t(
                        "dashboardPage.scope.nextQueue",
                        "Start with the operator queue so blocked files do not hide downstream insight.",
                      )
                    : activeView === "operations"
                      ? t(
                          "dashboardPage.scope.nextExplorer",
                          "Open Explorer to confirm extracted details and supporting evidence.",
                        )
                      : t(
                          "dashboardPage.scope.nextBrief",
                          "Open the weekly brief to move from signal review into action.",
                        )
                }
              />
            </div>
          </CatalogCard>
        </div>

        {initialData.scopedContent ? (
          <CatalogCard className="mb-5 mt-5 px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-3xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                  {initialData.scopedContent.title}
                </p>
                <p className="mt-1 text-[12.5px] leading-[1.6] text-muted">
                  {initialData.scopedContent.description}
                </p>
              </div>
              <CatalogButton
                onClick={() => router.push("/explorer")}
                variant="secondary"
              >
                {messages.dashboardPage.openExplorer}
              </CatalogButton>
            </div>
            {initialData.scopedContent.items.length > 0 ? (
              <div className="mt-4 grid gap-2 md:grid-cols-3">
                {initialData.scopedContent.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[10px] border border-border bg-surface-subtle px-3 py-3"
                  >
                    <p className="text-[12.5px] font-semibold text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[11.5px] leading-[1.6] text-muted">
                      {item.meta}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </CatalogCard>
        ) : null}

        <div className="mb-5 mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {initialData.metrics.map((metric) => (
            <MetricTile
              key={metric.label}
              detail={metric.detail}
              label={metric.label}
              tone={metric.tone}
              trend={metric.trend}
              value={metric.value}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-muted">
              {activeView === "operations"
                ? labels.views.operations
                : labels.views.business}
            </h2>
            <p className="mt-1 text-[12.5px] text-muted">
              {activeView === "operations"
                ? t(
                    "dashboardPage.operations.description",
                    "Use this view to clear blocked files, confirm review work, and keep the brief fed with reliable inputs.",
                  )
                : t(
                    "dashboardPage.business.description",
                    "Use this view to scan the business signals that should shape this week's cash and margin decisions.",
                  )}
            </p>
          </div>
          <div className="inline-flex gap-[2px] rounded-[8px] bg-[rgba(20,34,53,.07)] p-[2px] dark:bg-white/[0.06]">
            {(["operations", "business"] as const).map((view) => (
              <button
                key={view}
                className={[
                  "cursor-pointer rounded-[6px] px-4 py-[6px] text-[12.5px] font-semibold transition-colors",
                  activeView === view
                    ? "bg-white text-[#142235] shadow-[0_1px_3px_rgba(20,34,53,.1)] dark:bg-card dark:text-foreground"
                    : "text-[#8898aa] hover:text-foreground dark:text-muted",
                ].join(" ")}
                onClick={() => setActiveView(view)}
                type="button"
              >
                {view === "operations"
                  ? labels.views.operations
                  : labels.views.business}
              </button>
            ))}
          </div>
        </div>

        {activeView === "operations" ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.45fr)]">
            <CatalogCard className="overflow-hidden p-0">
              <div className="border-b border-border px-5 py-[14px]">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[13px] font-semibold text-foreground">
                    {labels.queueTitle}
                  </h2>
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600 dark:bg-rose-500/15 dark:text-rose-300">
                    {t("dashboardPage.queueItemsLabel", "{{count}} items", {
                      count: queueItems.length,
                    })}
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] leading-[1.6] text-muted">
                  {t(
                    "dashboardPage.queue.description",
                    "Work through the highest-friction items first so downstream facts and recommendations stay trustworthy.",
                  )}
                </p>
              </div>
              <div className="space-y-2 p-[10px]">
                {queueItems.length === 0 ? (
                  <div className="px-2 py-6 text-center">
                    <p className="text-[12.5px] font-semibold text-foreground">
                      {messages.dashboardPage.emptyQueueTitle}
                    </p>
                    <p className="mt-1 text-[11.5px] leading-[1.5] text-muted">
                      {messages.dashboardPage.emptyQueueDescription}
                    </p>
                  </div>
                ) : (
                  queueItems.map((item) => (
                    <DecisionQueueCard
                      key={item.id}
                      actions={item.actions.map(localizeActionLabel)}
                      context={item.context}
                      onAction={(action) => handleQueueAction(action, item)}
                      priority={item.priority}
                      priorityLabel={item.priorityLabel}
                      title={item.title}
                      typeLabel={item.typeLabel}
                    />
                  ))
                )}
              </div>
            </CatalogCard>

            <CatalogCard className="overflow-hidden p-0">
              <div className="border-b border-border px-5 py-[14px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] font-semibold text-foreground">
                    {messages.dashboardPage.activityTitle}
                  </span>
                  <span className="text-[11px] font-medium text-muted">
                    {messages.dashboardPage.activityLiveLabel}
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] leading-[1.6] text-muted">
                  {t(
                    "dashboardPage.activity.description",
                    "Document movement and operator actions appear here as the workspace changes.",
                  )}
                </p>
              </div>
              <div className="px-5 pb-0 pt-1">
                {recentActivity.map((section) => (
                  <div key={section.id}>
                    <p className="pb-1 pt-3 text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted first:pt-2">
                      {section.title}
                    </p>
                    <div>
                      {section.items.map((item) => (
                        <ActivityFeedItem
                          key={item.id}
                          action={
                            item.actionLabel === undefined
                              ? undefined
                              : localizeActionLabel(item.actionLabel)
                          }
                          detail={item.detail}
                          label={item.label}
                          onAction={() =>
                            handleActivityAction(
                              item.actionLabel === undefined
                                ? "Activity action"
                                : localizeActionLabel(item.actionLabel),
                              item.title,
                            )
                          }
                          time={item.time}
                          title={item.title}
                          tone={item.tone}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 border-t border-border px-5 py-3">
                <CatalogButton
                  onClick={() => navigateForActionLabel(actionLabels.openExplorer)}
                  variant="secondary"
                >
                  {messages.dashboardPage.openExplorer}
                </CatalogButton>
                <CatalogButton
                  onClick={() => setShowUploadModal(true)}
                  variant="primary"
                >
                  {labels.actions.primary}
                </CatalogButton>
              </div>
            </CatalogCard>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.8fr)]">
            <div>
              <h2 className="mb-3 text-[12px] font-bold uppercase tracking-[0.1em] text-muted">
                {labels.signalsTitle}
              </h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {initialData.signals.map((signal) => (
                  <SignalCard
                    key={signal.label}
                    detail={signal.detail}
                    label={signal.label}
                    tone={signal.tone}
                    value={signal.value}
                  />
                ))}
              </div>
            </div>

            <CatalogCard className="px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                {t("dashboardPage.watchlist.heading", "Operational watchlist")}
              </p>
              <p className="mt-2 text-[12.5px] leading-[1.6] text-muted">
                {t(
                  "dashboardPage.watchlist.description",
                  "Business signals are only as useful as the document work behind them. Keep an eye on these open items.",
                )}
              </p>
              <div className="mt-4 space-y-3">
                {queueItems.length === 0 ? (
                  <div className="rounded-[10px] border border-border bg-surface-subtle px-4 py-4">
                    <p className="text-[12.5px] font-semibold text-foreground">
                      {t("dashboardPage.watchlist.clearTitle", "No open watchlist items")}
                    </p>
                    <p className="mt-1 text-[11.5px] leading-[1.6] text-muted">
                      {t(
                        "dashboardPage.watchlist.clearDescription",
                        "The current dashboard scope is clear enough to move straight into the weekly brief or Explorer.",
                      )}
                    </p>
                  </div>
                ) : (
                  queueItems.map((item) => (
                    <DashboardWatchListItem key={item.id} item={item} />
                  ))
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <CatalogButton
                  onClick={() =>
                    handleActivityAction(
                      localizeActionLabel(initialData.businessSummary.actionLabel),
                      initialData.businessSummary.title,
                    )
                  }
                  variant="primary"
                >
                  {localizeActionLabel(initialData.businessSummary.actionLabel)}
                </CatalogButton>
                <CatalogButton
                  onClick={() => navigateForActionLabel(actionLabels.openExplorer)}
                  variant="secondary"
                >
                  {messages.dashboardPage.openExplorer}
                </CatalogButton>
              </div>
            </CatalogCard>
          </div>
        )}
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

type DashboardSummaryStatProps = Readonly<{
  detail: string;
  label: string;
  tone: "danger" | "info" | "neutral" | "success" | "warning";
  value: string;
}>;

const summaryStatToneClasses = {
  danger: "border-red-200 bg-red-50 dark:border-rose-500/20 dark:bg-rose-500/10",
  info: "border-blue-200 bg-blue-50 dark:border-sky-500/20 dark:bg-sky-500/10",
  neutral: "border-border bg-surface-subtle dark:bg-surface-muted",
  success: "border-green-200 bg-green-50 dark:border-emerald-500/20 dark:bg-emerald-500/10",
  warning: "border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10",
} as const;

function DashboardSummaryStat({
  detail,
  label,
  tone,
  value,
}: DashboardSummaryStatProps) {
  return (
    <div className={cx("rounded-[10px] border px-4 py-3", summaryStatToneClasses[tone])}>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </p>
      <p className="mt-2 text-[22px] font-bold leading-none tracking-[-0.03em] text-foreground">
        {value}
      </p>
      <p className="mt-2 text-[11.5px] leading-[1.5] text-muted">{detail}</p>
    </div>
  );
}

type DashboardScopeSummaryCardProps = Readonly<{
  description: string;
  label: string;
}>;

function DashboardScopeSummaryCard({
  description,
  label,
}: DashboardScopeSummaryCardProps) {
  return (
    <div className="rounded-[10px] border border-border bg-card px-3 py-2.5">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </p>
      <p className="mt-1 text-[11.5px] leading-[1.6] text-foreground">{description}</p>
    </div>
  );
}

type DashboardScopeDetailProps = Readonly<{
  label: string;
  value: string;
}>;

function DashboardScopeDetail({ label, value }: DashboardScopeDetailProps) {
  return (
    <div className="rounded-[10px] border border-border bg-surface-subtle px-4 py-3">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </p>
      <p className="mt-1 text-[12px] leading-[1.6] text-foreground">{value}</p>
    </div>
  );
}

type DashboardWatchListItemProps = Readonly<{
  item: DashboardQueueItem;
}>;

function DashboardWatchListItem({ item }: DashboardWatchListItemProps) {
  return (
    <div className="rounded-[10px] border border-border bg-surface-subtle px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge
          label={item.priorityLabel}
          tone={mapPriorityToBadgeTone(item.priority)}
          withDot
        />
        <span className="text-[11px] font-medium text-muted">{item.typeLabel}</span>
      </div>
      <p className="mt-2 text-[13px] font-semibold leading-[1.45] text-foreground">
        {item.title}
      </p>
      <p className="mt-1 text-[11.5px] leading-[1.6] text-muted">{item.context}</p>
    </div>
  );
}

function mapPriorityToBadgeTone(priority: DashboardQueueItem["priority"]) {
  if (priority === "danger") {
    return "danger";
  }

  if (priority === "warning") {
    return "warning";
  }

  return "info";
}

function mapPriorityToSummaryTone(priority: DashboardQueueItem["priority"]): DashboardSummaryTone {
  if (priority === "danger") {
    return "danger";
  }

  if (priority === "warning") {
    return "warning";
  }

  return "info";
}
