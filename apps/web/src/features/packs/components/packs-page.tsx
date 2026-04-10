"use client";

import { useDeferredValue, useState } from "react";

import { PlaceholderActionDialog } from "@/features/catalog/components/catalog-dialogs";
import {
  CatalogButton,
  CatalogCard,
  StatusBadge,
  cx,
} from "@/features/catalog/components/catalog-primitives";
import {
  FilterChip,
  PackSidebarItem,
  RecommendationCard,
  SignalCard,
  WorkspaceHeader,
} from "@/features/catalog/components/workspace-catalog-blocks";
import { useUiI18n } from "@/features/i18n/components/ui-i18n-provider";
import {
  type PackItem,
  type PackMetric,
  type PackSourceRecord,
  type PacksPageData,
} from "@/features/packs/constants/packs-page-content";
import { type PackRecord } from "@/features/packs/domain/pack-record";
import { type PackConcept } from "@/features/packs/lib/pack-preview";
import {
  mergeUpdatedPackItem,
  packRecordToPackItem,
  resolvePackRecommendationFeedbackAction,
} from "@/features/packs/lib/pack-page-state";

type PacksPageProps = Readonly<{
  initialData: PacksPageData;
  orgId: string;
}>;

type PackMutationError = Readonly<{
  error: string;
}>;

type PackMutationResponse = Readonly<{
  jobId?: string;
  orgId: string;
  pack: PackRecord;
  status?: string;
}>;

type RecommendationFeedbackResponse = Readonly<{
  feedbackEvent: Readonly<{
    action: "accept" | "edit" | "reject";
    recommendationId: string;
  }>;
  orgId: string;
}>;

type FeedbackState = Readonly<{
  label: string;
  tone: "info" | "success" | "warning";
}>;

type ActionNotice = Readonly<{
  description: string;
  title: string;
  tone: "info" | "success";
}>;

const noticeToneClasses = {
  info: "border-blue-200 bg-blue-50/80 text-blue-800 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200",
  success:
    "border-green-200 bg-green-50/80 text-green-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200",
} as const;

const conceptToneClasses = {
  danger:
    "border-red-200 bg-red-50/70 dark:border-rose-500/20 dark:bg-rose-500/10",
  info: "border-blue-200 bg-blue-50/70 dark:border-sky-500/20 dark:bg-sky-500/10",
  success:
    "border-green-200 bg-green-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/10",
  warning:
    "border-amber-200 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/10",
} as const;

const metricToneClasses = {
  danger:
    "border-red-200 bg-red-50/70 text-red-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200",
  info: "border-blue-200 bg-blue-50/70 text-blue-800 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200",
  success:
    "border-green-200 bg-green-50/70 text-green-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200",
  warning:
    "border-amber-200 bg-amber-50/70 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200",
} as const;

export function PacksPage({ initialData, orgId }: PacksPageProps) {
  const { messages } = useUiI18n();
  const [packs, setPacks] = useState(initialData.packs);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    (typeof initialData.filters)[number]["id"]
  >("all");
  const [selectedPackId, setSelectedPackId] = useState(
    initialData.latestPackId ?? initialData.packs[0]?.id ?? "",
  );
  const [placeholderAction, setPlaceholderAction] = useState<{
    description?: string;
    title: string;
  } | null>(null);
  const [actionNotice, setActionNotice] = useState<ActionNotice | null>(null);
  const [isGeneratingPack, setIsGeneratingPack] = useState(false);
  const [reviewingPackId, setReviewingPackId] = useState<string | null>(null);
  const [exportingPackId, setExportingPackId] = useState<string | null>(null);
  const [submittingRecommendationId, setSubmittingRecommendationId] =
    useState<string | null>(null);
  const [feedbackByRecommendationId, setFeedbackByRecommendationId] = useState<
    Readonly<Record<string, FeedbackState>>
  >({});
  const deferredSearch = useDeferredValue(search);

  const visiblePacks = packs.filter((pack) => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();
    if (activeFilter === "all") {
      return matchesSearch(pack, normalizedSearch);
    }

    const matchesStatus =
      activeFilter === "ready"
        ? pack.statusTone === "success"
        : pack.statusTone === "warning";

    return matchesStatus && matchesSearch(pack, normalizedSearch);
  });
  const selectedPack =
    visiblePacks.find((pack) => pack.id === selectedPackId) ??
    visiblePacks[0] ??
    null;

  function openActionDialog(title: string, description?: string) {
    setPlaceholderAction({ description, title });
  }

  async function handleGeneratePack() {
    if (isGeneratingPack) {
      return;
    }

    setIsGeneratingPack(true);
    setActionNotice({
      description: messages.packsPage.success.generatingDescription,
      title: messages.packsPage.success.generatingTitle,
      tone: "info",
    });

    try {
      const response = await fetch("/api/packs", {
        body: JSON.stringify({ orgId }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as
        | PackMutationError
        | PackMutationResponse;

      if (!response.ok || "error" in payload) {
        throw new Error(
          "error" in payload
            ? payload.error
            : messages.packsPage.errors.generationFailed,
        );
      }

      const nextPack = packRecordToPackItem(payload.pack);

      setPacks((currentPacks) => mergeUpdatedPackItem(currentPacks, nextPack));
      setSelectedPackId(nextPack.id);
      setActiveFilter("all");
      setSearch("");
      setActionNotice({
        description: messages.packsPage.success.generateDescription,
        title: messages.packsPage.success.generateTitle,
        tone: "success",
      });
    } catch (error) {
      setActionNotice(null);
      openActionDialog(
        messages.packsPage.errors.generateTitle,
        error instanceof Error
          ? error.message
          : messages.packsPage.errors.requestFailed,
      );
    } finally {
      setIsGeneratingPack(false);
    }
  }

  async function handleReviewPack(packId: string) {
    if (reviewingPackId !== null) {
      return;
    }

    setReviewingPackId(packId);
    setActionNotice({
      description: messages.packsPage.success.reviewingDescription,
      title: messages.packsPage.success.reviewingTitle,
      tone: "info",
    });

    try {
      const response = await fetch(
        `/api/packs/${encodeURIComponent(packId)}/review`,
        {
          body: JSON.stringify({ orgId }),
          headers: {
            "content-type": "application/json",
          },
          method: "POST",
        },
      );
      const payload = (await response.json()) as
        | PackMutationError
        | PackMutationResponse;

      if (!response.ok || "error" in payload) {
        throw new Error(
          "error" in payload
            ? payload.error
            : messages.packsPage.errors.reviewFailed,
        );
      }

      setPacks((currentPacks) =>
        mergeUpdatedPackItem(currentPacks, packRecordToPackItem(payload.pack)),
      );
      setActionNotice({
        description: messages.packsPage.success.reviewDescription,
        title: messages.packsPage.success.reviewTitle,
        tone: "success",
      });
    } catch (error) {
      setActionNotice(null);
      openActionDialog(
        messages.packsPage.errors.reviewTitle,
        error instanceof Error
          ? error.message
          : messages.packsPage.errors.requestFailed,
      );
    } finally {
      setReviewingPackId(null);
    }
  }

  async function handleExportPack(packId: string) {
    if (exportingPackId !== null) {
      return;
    }

    setExportingPackId(packId);
    setActionNotice({
      description: messages.packsPage.success.exportingDescription,
      title: messages.packsPage.success.exportingTitle,
      tone: "info",
    });

    try {
      const response = await fetch(
        `/api/packs/${encodeURIComponent(packId)}/export?orgId=${encodeURIComponent(orgId)}`,
      );

      if (!response.ok) {
        const payload = (await response.json()) as PackMutationError;
        throw new Error(
          payload.error || messages.packsPage.errors.exportFailed,
        );
      }

      await downloadResponseAsFile(response);
      setActionNotice({
        description: messages.packsPage.success.exportDescription,
        title: messages.packsPage.success.exportTitle,
        tone: "success",
      });
    } catch (error) {
      setActionNotice(null);
      openActionDialog(
        messages.packsPage.errors.exportTitle,
        error instanceof Error
          ? error.message
          : messages.packsPage.errors.requestFailed,
      );
    } finally {
      setExportingPackId(null);
    }
  }

  async function handleRecommendationAction(
    action: string,
    packId: string,
    recommendationId: string,
    recommendationTitle: string,
  ) {
    const feedbackAction = resolvePackRecommendationFeedbackAction(action);

    if (feedbackAction === null) {
      openActionDialog(action, recommendationTitle);
      return;
    }

    if (submittingRecommendationId !== null) {
      return;
    }

    setSubmittingRecommendationId(recommendationId);

    try {
      const response = await fetch(
        `/api/packs/${encodeURIComponent(packId)}/recommendations/${encodeURIComponent(recommendationId)}/feedback`,
        {
          body: JSON.stringify({
            action: feedbackAction,
            orgId,
          }),
          headers: {
            "content-type": "application/json",
          },
          method: "POST",
        },
      );
      const payload = (await response.json()) as
        | PackMutationError
        | RecommendationFeedbackResponse;

      if (!response.ok || "error" in payload) {
        throw new Error(
          "error" in payload
            ? payload.error
            : messages.packsPage.errors.feedbackFailed,
        );
      }

      setFeedbackByRecommendationId((currentState) => ({
        ...currentState,
        [recommendationId]:
          payload.feedbackEvent.action === "accept"
            ? {
                label: messages.packsPage.feedbackAccepted,
                tone: "success",
              }
            : {
                label: messages.packsPage.feedbackDismissed,
                tone: "warning",
              },
      }));
    } catch (error) {
      openActionDialog(
        messages.packsPage.errors.feedbackTitle,
        error instanceof Error
          ? error.message
          : messages.packsPage.errors.requestFailed,
      );
    } finally {
      setSubmittingRecommendationId(null);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <WorkspaceHeader
        actions={[
          {
            label: isGeneratingPack
              ? messages.packsPage.actions.generatingPreview
              : messages.packsPage.actions.generatePreview,
            onClick: () => {
              void handleGeneratePack();
            },
            variant: "primary",
          },
        ]}
        breadcrumbs={messages.packsPage.labels.breadcrumbs}
        description={messages.packsPage.headerDescription}
        title={messages.packsPage.labels.title}
      />

      <div className="flex flex-1 flex-col xl:min-h-0 xl:flex-row xl:overflow-hidden">
        <aside className="shrink-0 border-b border-border bg-card xl:flex xl:w-[360px] xl:flex-col xl:border-b-0 xl:border-r">
          <div className="border-b border-border px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
              {messages.packsPage.selectorEyebrow}
            </p>
            <h2 className="mt-1 text-[15px] font-semibold text-foreground">
              {messages.packsPage.selectorTitle}
            </h2>
            <p className="mt-1 text-[12px] leading-[1.6] text-muted">
              {messages.packsPage.selectorDescription}
            </p>
            <input
              className="mt-4 w-full rounded-[8px] border border-border bg-surface-subtle px-3 py-2 text-[12.5px] text-foreground outline-none placeholder:text-muted"
              onChange={(event) => setSearch(event.target.value)}
              placeholder={messages.packsPage.searchPlaceholder}
              type="text"
              value={search}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {initialData.filters.map((filter) => (
                <FilterChip
                  key={filter.id}
                  active={activeFilter === filter.id}
                  label={resolvePackFilterLabel(filter.id, messages)}
                  onClick={() => setActiveFilter(filter.id)}
                />
              ))}
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto xl:max-h-none xl:flex-1">
            {visiblePacks.map((pack) => (
              <PackSidebarItem
                key={pack.id}
                accent={pack.accent}
                active={selectedPack?.id === pack.id}
                meta={pack.meta}
                onClick={() => setSelectedPackId(pack.id)}
                statusLabel={pack.statusLabel}
                statusTone={pack.statusTone}
                summary={pack.listSummary}
                title={pack.title}
              />
            ))}
          </div>
        </aside>

        <div className="flex-1 px-4 py-5 sm:px-6 xl:min-h-0 xl:overflow-y-auto">
          {selectedPack === null ? (
            <CatalogCard className="p-6">
              <p className="text-lg font-semibold text-foreground">
                {messages.packsPage.emptyPackList}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                {messages.packsPage.emptyPackDescription}
              </p>
              <div className="mt-4">
                <CatalogButton
                  onClick={() => {
                    setActiveFilter("all");
                    setSearch("");
                  }}
                  variant="secondary"
                >
                  {messages.packsPage.emptyPackAction}
                </CatalogButton>
              </div>
            </CatalogCard>
          ) : (
            <PackDetail
              actionNotice={actionNotice}
              exportingPackId={exportingPackId}
              feedbackByRecommendationId={feedbackByRecommendationId}
              onExportPack={handleExportPack}
              onRecommendationAction={handleRecommendationAction}
              onReviewPack={handleReviewPack}
              pack={selectedPack}
              reviewingPackId={reviewingPackId}
              submittingRecommendationId={submittingRecommendationId}
            />
          )}
        </div>
      </div>

      {placeholderAction ? (
        <PlaceholderActionDialog
          description={placeholderAction.description}
          onClose={() => setPlaceholderAction(null)}
          title={placeholderAction.title}
        />
      ) : null}
    </div>
  );
}

function PackDetail({
  actionNotice,
  exportingPackId,
  feedbackByRecommendationId,
  onExportPack,
  onRecommendationAction,
  onReviewPack,
  pack,
  reviewingPackId,
  submittingRecommendationId,
}: Readonly<{
  actionNotice: ActionNotice | null;
  exportingPackId: string | null;
  feedbackByRecommendationId: Readonly<Record<string, FeedbackState>>;
  onExportPack: (packId: string) => Promise<void>;
  onRecommendationAction: (
    action: string,
    packId: string,
    recommendationId: string,
    recommendationTitle: string,
  ) => Promise<void>;
  onReviewPack: (packId: string) => Promise<void>;
  pack: PackItem;
  reviewingPackId: string | null;
  submittingRecommendationId: string | null;
}>) {
  const { messages } = useUiI18n();
  const canMarkReady =
    pack.statusTone === "success" ||
    (pack.recommendations.length > 0 && pack.sourceData.length > 0);

  return (
    <div className="space-y-6">
      {actionNotice ? <PackActionNotice notice={actionNotice} /> : null}

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.85fr)]">
        <CatalogCard className="p-6 shadow-[0_10px_28px_rgba(20,34,53,0.06)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {messages.packsPage.previewEyebrow}
                </p>
                <StatusBadge
                  label={pack.statusLabel}
                  tone={pack.statusTone === "success" ? "success" : "warning"}
                  withDot
                />
              </div>
              <h2 className="mt-2 text-[30px] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground">
                {pack.title}
              </h2>
              <p className="mt-2 text-[13px] text-muted">
                {pack.generatedAtLabel}
              </p>
              <p className="mt-4 max-w-3xl text-[15px] leading-7 text-muted">
                {pack.previewSummary}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {pack.meta.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-border bg-surface-subtle px-3 py-1 text-[11px] font-semibold text-muted"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <CatalogButton
                disabled={exportingPackId !== null}
                onClick={() => {
                  void onExportPack(pack.id);
                }}
                variant="secondary"
              >
                {exportingPackId === pack.id
                  ? messages.packsPage.actions.exportingPreview
                  : messages.packsPage.actions.exportPreview}
              </CatalogButton>
              <CatalogButton
                disabled={!canMarkReady || reviewingPackId !== null}
                onClick={() => {
                  void onReviewPack(pack.id);
                }}
                variant="primary"
              >
                {!canMarkReady
                  ? messages.packsPage.actions.stillDrafting
                  : reviewingPackId === pack.id
                  ? messages.packsPage.actions.markingReady
                  : messages.packsPage.actions.markReady}
              </CatalogButton>
            </div>
          </div>

          <div className="mt-5 rounded-[14px] border border-border bg-surface-subtle px-4 py-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
              {messages.packsPage.bestNextMoveHeading}
            </p>
            <p className="mt-2 text-[13px] leading-[1.7] text-foreground">
              {pack.nextStepLabel}
            </p>
          </div>
        </CatalogCard>

        <CatalogCard className="p-5 shadow-[0_10px_28px_rgba(20,34,53,0.06)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
            {messages.packsPage.conceptsHeading}
          </p>
          <p className="mt-2 text-[12px] leading-[1.6] text-muted">
            {messages.packsPage.conceptsDescription}
          </p>
          <div className="mt-4 space-y-3">
            {pack.concepts.map((concept) => (
              <PackConceptCard key={concept.id} concept={concept} />
            ))}
          </div>
        </CatalogCard>
      </div>

      <section>
        <div className="mb-3">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">
            {messages.packsPage.previewHealthHeading}
          </h3>
          <p className="mt-1 text-[12px] leading-[1.6] text-muted">
            {messages.packsPage.previewHealthDescription}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pack.overviewStats.map((stat) => (
            <SignalCard
              key={stat.label}
              detail={stat.detail}
              label={stat.label}
              tone={stat.tone}
              value={stat.value}
            />
          ))}
        </div>
      </section>

      {pack.metrics.length > 0 ? (
        <section>
          <div className="mb-3">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">
              {messages.packsPage.businessSignalsHeading}
            </h3>
            <p className="mt-1 text-[12px] leading-[1.6] text-muted">
              {messages.packsPage.businessSignalsDescription}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {pack.metrics.map((metric) => (
              <PackMetricCard key={metric.label} metric={metric} />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-3">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">
            {messages.packsPage.recommendationsHeading}
          </h3>
          <p className="mt-1 text-[12px] leading-[1.6] text-muted">
            {messages.packsPage.recommendationsDescription}
          </p>
        </div>
        <div className="space-y-4">
          {pack.recommendations.length === 0 ? (
            <CatalogCard className="p-6">
              <p className="text-sm text-muted">
                {messages.packsPage.emptyDraftRecommendations}
              </p>
            </CatalogCard>
          ) : (
            pack.recommendations.map((recommendation) => {
              const feedbackState = feedbackByRecommendationId[recommendation.id];
              const isSubmitting =
                submittingRecommendationId === recommendation.id;

              return (
                <div key={recommendation.id} className="space-y-2">
                  <RecommendationCard
                    actions={
                      feedbackState !== undefined || isSubmitting
                        ? []
                        : recommendation.actions.map((action) =>
                            localizeRecommendationAction(action, messages),
                          )
                    }
                    citations={recommendation.citations}
                    confidence={recommendation.confidence}
                    onAction={(action) => {
                      void onRecommendationAction(
                        resolveCanonicalRecommendationAction(action, messages),
                        pack.id,
                        recommendation.id,
                        recommendation.title,
                      );
                    }}
                    priority={recommendation.priority}
                    priorityLabel={recommendation.priorityLabel}
                    summary={recommendation.summary}
                    title={recommendation.title}
                  />
                  {feedbackState !== undefined ? (
                    <p
                      className={cx(
                        "text-sm font-medium",
                        feedbackState.tone === "success"
                          ? "text-green-700 dark:text-emerald-300"
                          : feedbackState.tone === "warning"
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-blue-700 dark:text-sky-300",
                      )}
                    >
                      {feedbackState.label}
                    </p>
                  ) : isSubmitting ? (
                    <p className="text-sm font-medium text-blue-700 dark:text-sky-300">
                      {messages.packsPage.feedbackSaving}
                    </p>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">
            {messages.packsPage.evidenceHeading}
          </h3>
          <p className="mt-1 text-[12px] leading-[1.6] text-muted">
            {messages.packsPage.sourceDataDescription}
          </p>
        </div>
        {pack.sourceData.length === 0 ? (
          <CatalogCard className="p-6">
            <p className="text-sm text-muted">
              {messages.packsPage.sourceDataEmpty}
            </p>
          </CatalogCard>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {pack.sourceData.map((record) => (
              <PackSourceRecordCard
                key={record.id}
                confidenceLabel={messages.packsPage.dataHeaders.confidence}
                contributionLabel={messages.packsPage.dataHeaders.contribution}
                record={record}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PackActionNotice({ notice }: Readonly<{ notice: ActionNotice }>) {
  return (
    <div
      aria-live="polite"
      className={cx(
        "rounded-[14px] border px-4 py-4",
        noticeToneClasses[notice.tone],
      )}
    >
      <p className="text-sm font-semibold">{notice.title}</p>
      <p className="mt-1 text-sm leading-6 text-current/80">
        {notice.description}
      </p>
    </div>
  );
}

function PackConceptCard({
  concept,
}: Readonly<{ concept: PackConcept }>) {
  return (
    <div
      className={cx(
        "rounded-[12px] border px-4 py-3",
        conceptToneClasses[concept.tone],
      )}
    >
      <p className="text-[12px] font-semibold text-foreground">{concept.label}</p>
      <p className="mt-1 text-[12px] leading-[1.6] text-foreground">
        {concept.description}
      </p>
    </div>
  );
}

function PackMetricCard({
  metric,
}: Readonly<{ metric: PackMetric }>) {
  return (
    <CatalogCard
      className={cx(
        "border p-4 shadow-[0_10px_24px_rgba(20,34,53,0.04)]",
        metricToneClasses[metric.tone],
      )}
    >
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-current/70">
        {metric.label}
      </p>
      <p className="mt-2 text-[28px] font-bold leading-none tracking-[-0.03em] text-foreground">
        {metric.value}
      </p>
      <p className="mt-2 text-[12px] leading-[1.6] text-current/80">
        {metric.detail}
      </p>
    </CatalogCard>
  );
}

function PackSourceRecordCard({
  confidenceLabel,
  contributionLabel,
  record,
}: Readonly<{
  confidenceLabel: string;
  contributionLabel: string;
  record: PackSourceRecord;
}>) {
  const confidenceValue = Number.parseFloat(record.confidenceLabel);
  const confidenceTone =
    Number.isFinite(confidenceValue) && confidenceValue >= 0.9
      ? "success"
      : Number.isFinite(confidenceValue) && confidenceValue >= 0.8
        ? "info"
        : "warning";

  return (
    <CatalogCard className="p-5 shadow-[0_10px_24px_rgba(20,34,53,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-foreground">
            {record.name}
          </p>
          <p className="mt-1 text-[12px] text-muted">{record.classLabel}</p>
        </div>
        <StatusBadge
          label={record.confidenceLabel}
          tone={confidenceTone}
          withDot
        />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <PackSourceMeta
          label={contributionLabel}
          value={record.contributionLabel}
        />
        <PackSourceMeta label={confidenceLabel} value={record.confidenceLabel} />
      </div>
    </CatalogCard>
  );
}

function PackSourceMeta({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="rounded-[10px] border border-border bg-surface-subtle px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </p>
      <p className="mt-1 text-[12px] leading-[1.6] text-foreground">
        {value}
      </p>
    </div>
  );
}

function matchesSearch(pack: PackItem, normalizedSearch: string) {
  if (normalizedSearch.length === 0) {
    return true;
  }

  return [
    pack.title,
    pack.generatedAtLabel,
    pack.listSummary,
    pack.previewSummary,
    ...pack.meta,
    ...pack.concepts.map((concept) => concept.label),
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalizedSearch);
}

function resolvePackFilterLabel(
  filterId: PacksPageData["filters"][number]["id"],
  messages: ReturnType<typeof useUiI18n>["messages"],
) {
  return messages.packsPage.filterLabels[filterId];
}

function localizeRecommendationAction(
  action: string,
  messages: ReturnType<typeof useUiI18n>["messages"],
) {
  if (action === "Accept") {
    return messages.packsPage.recommendationActions.accept;
  }

  if (action === "Dismiss") {
    return messages.packsPage.recommendationActions.dismiss;
  }

  return action;
}

function resolveCanonicalRecommendationAction(
  action: string,
  messages: ReturnType<typeof useUiI18n>["messages"],
) {
  if (action === messages.packsPage.recommendationActions.accept) {
    return "Accept";
  }

  if (action === messages.packsPage.recommendationActions.dismiss) {
    return "Dismiss";
  }

  return action;
}

async function downloadResponseAsFile(response: Response) {
  const fileBlob = await response.blob();
  const objectUrl = URL.createObjectURL(fileBlob);
  const link = document.createElement("a");
  const contentDisposition = response.headers.get("content-disposition");
  const fileNameMatch = contentDisposition?.match(/filename="([^"]+)"/);

  link.href = objectUrl;
  link.download = fileNameMatch?.[1] ?? "export.txt";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
