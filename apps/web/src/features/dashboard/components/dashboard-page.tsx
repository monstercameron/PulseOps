"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

import { PlaceholderActionDialog } from "@/features/catalog/components/catalog-dialogs";
import { CatalogCard } from "@/features/catalog/components/catalog-primitives";
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

      <div className="sticky top-0 z-10 border-b border-border bg-background/[0.94] px-6 py-2 backdrop-blur-sm">
        <DashboardFilterBar filters={initialData.filters} />
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted">
          <span>{initialData.filterSummary.globalScopeLabel}</span>
          <span className="hidden h-1 w-1 rounded-full bg-border md:inline-block" />
          <span>{initialData.filterSummary.scopedResultsLabel}</span>
        </div>
      </div>

      <div className="flex-1 px-6 py-5">
        {initialData.scopedContent ? (
          <CatalogCard className="mb-5 px-4 py-[14px]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
                  {initialData.scopedContent.title}
                </p>
                <p className="mt-1 text-[12.5px] leading-[1.5] text-muted">
                  {initialData.scopedContent.description}
                </p>
              </div>
              <button
                className="cursor-pointer rounded-[7px] border border-border-strong bg-surface-subtle px-3 py-[6px] text-[12px] font-semibold text-foreground transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                onClick={() => router.push("/explorer")}
                type="button"
              >
                {messages.dashboardPage.openExplorer}
              </button>
            </div>
            {initialData.scopedContent.items.length > 0 ? (
              <div className="mt-4 grid gap-2 md:grid-cols-3">
                {initialData.scopedContent.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[8px] border border-border bg-surface-subtle px-3 py-3"
                  >
                    <p className="text-[12.5px] font-semibold text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[11.5px] leading-[1.5] text-muted">
                      {item.meta}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </CatalogCard>
        ) : null}

        <div className="mb-5 grid grid-cols-2 gap-[10px] md:grid-cols-3 xl:grid-cols-5">
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

        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-muted">
            {activeView === "operations"
              ? labels.views.operations
              : labels.views.business}
          </h2>
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
          <div className="mt-[14px] grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_320px]">
            <CatalogCard className="overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-border px-5 py-[14px]">
                <span className="text-[13px] font-semibold text-foreground">{messages.dashboardPage.activityTitle}</span>
                <span className="text-[11px] font-medium text-muted">{messages.dashboardPage.activityLiveLabel}</span>
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
              <div className="border-t border-border px-5 py-3">
                <button
                  className="cursor-pointer text-[12px] font-bold text-accent transition hover:text-accent/70"
                  onClick={() =>
                    openPlaceholderAction(
                      messages.dashboardPage.viewFullActivityLog,
                      "A dedicated full activity log surface is not implemented yet.",
                    )
                  }
                  type="button"
                >
                  {messages.dashboardPage.viewFullActivityLog}
                </button>
              </div>
            </CatalogCard>

            <CatalogCard className="overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-border px-4 py-[14px]">
                <h2 className="text-[13px] font-semibold text-foreground">
                  {labels.queueTitle}
                </h2>
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600 dark:bg-rose-500/15 dark:text-rose-300">
                  {t("dashboardPage.queueItemsLabel", "{{count}} items", {
                    count: queueItems.length,
                  })}
                </span>
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
          </div>
        ) : (
          <div>
            <CatalogCard className="mt-4 flex flex-wrap items-center justify-between gap-4 px-[22px] py-4">
              <div>
                <p className="text-[14px] font-bold tracking-[-0.01em] text-foreground">
                  {initialData.businessSummary.title}
                </p>
                <p className="mt-[3px] text-[12.5px] leading-[1.6] text-muted">
                  {initialData.businessSummary.description}
                </p>
              </div>
              <button
                className="cursor-pointer shrink-0 rounded-[9px] bg-accent px-[18px] py-[9px] text-[13px] font-bold text-[#0d1b2a] transition hover:opacity-90 active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                onClick={() =>
                  handleActivityAction(
                    localizeActionLabel(initialData.businessSummary.actionLabel),
                    initialData.businessSummary.title,
                  )
                }
                type="button"
              >
                {localizeActionLabel(initialData.businessSummary.actionLabel)}
              </button>
            </CatalogCard>

            <h2 className="mb-3 mt-5 text-[12px] font-bold uppercase tracking-[0.1em] text-muted">
              {labels.signalsTitle}
            </h2>
            <div className="grid gap-[10px] md:grid-cols-2 xl:grid-cols-5">
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
