"use client";

import { useDeferredValue, useState } from "react";

import { PlaceholderActionDialog } from "@/features/catalog/components/catalog-dialogs";
import { CatalogCard } from "@/features/catalog/components/catalog-primitives";
import {
  FilterChip,
  MetricTile,
  PackSidebarItem,
  RecommendationCard,
  SourceDataRow,
  WorkspaceHeader,
} from "@/features/catalog/components/workspace-catalog-blocks";
import { useUiI18n } from "@/features/i18n/components/ui-i18n-provider";
import { type PackItem, type PacksPageData } from "@/features/packs/constants/packs-page-content";
import { type PackRecord } from "@/features/packs/domain/pack-record";
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

export function PacksPage({ initialData, orgId }: PacksPageProps) {
  const { messages, t } = useUiI18n();
  const [packs, setPacks] = useState(initialData.packs);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof initialData.filters)[number]["id"]>("all");
  const [selectedPackId, setSelectedPackId] = useState(
    initialData.latestPackId ?? initialData.packs[0]?.id ?? "",
  );
  const [placeholderAction, setPlaceholderAction] = useState<{
    description?: string;
    title: string;
  } | null>(null);
  const [isGeneratingPack, setIsGeneratingPack] = useState(false);
  const [reviewingPackId, setReviewingPackId] = useState<string | null>(null);
  const [exportingPackId, setExportingPackId] = useState<string | null>(null);
  const [submittingRecommendationId, setSubmittingRecommendationId] = useState<string | null>(null);
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
    visiblePacks.find((pack) => pack.id === selectedPackId) ?? visiblePacks[0] ?? null;

  function openActionDialog(title: string, description?: string) {
    setPlaceholderAction({ description, title });
  }

  async function handleGeneratePack() {
    if (isGeneratingPack) {
      return;
    }

    setIsGeneratingPack(true);

    try {
      const response = await fetch("/api/packs", {
        body: JSON.stringify({ orgId }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as PackMutationError | PackMutationResponse;

      if (!response.ok || "error" in payload) {
        throw new Error(
          "error" in payload ? payload.error : messages.packsPage.errors.generationFailed,
        );
      }

      const nextPack = packRecordToPackItem(payload.pack);

      setPacks((currentPacks) => mergeUpdatedPackItem(currentPacks, nextPack));
      setSelectedPackId(nextPack.id);
      setActiveFilter("all");
    } catch (error) {
      openActionDialog(
        messages.packsPage.errors.generateTitle,
        error instanceof Error ? error.message : messages.packsPage.errors.requestFailed,
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

    try {
      const response = await fetch(`/api/packs/${encodeURIComponent(packId)}/review`, {
        body: JSON.stringify({ orgId }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as PackMutationError | PackMutationResponse;

      if (!response.ok || "error" in payload) {
        throw new Error(
          "error" in payload ? payload.error : messages.packsPage.errors.reviewFailed,
        );
      }

      setPacks((currentPacks) =>
        mergeUpdatedPackItem(currentPacks, packRecordToPackItem(payload.pack)),
      );
    } catch (error) {
      openActionDialog(
        messages.packsPage.errors.reviewTitle,
        error instanceof Error ? error.message : messages.packsPage.errors.requestFailed,
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

    try {
      const response = await fetch(
        `/api/packs/${encodeURIComponent(packId)}/export?orgId=${encodeURIComponent(orgId)}`,
      );

      if (!response.ok) {
        const payload = (await response.json()) as PackMutationError;
        throw new Error(payload.error || messages.packsPage.errors.exportFailed);
      }

      await downloadResponseAsFile(response);
    } catch (error) {
      openActionDialog(
        messages.packsPage.errors.exportTitle,
        error instanceof Error ? error.message : messages.packsPage.errors.requestFailed,
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
          "error" in payload ? payload.error : messages.packsPage.errors.feedbackFailed,
        );
      }

      setFeedbackByRecommendationId((currentState) => ({
        ...currentState,
        [recommendationId]:
          payload.feedbackEvent.action === "accept"
            ? { label: messages.packsPage.feedbackAccepted, tone: "success" }
            : { label: messages.packsPage.feedbackDismissed, tone: "warning" },
      }));
    } catch (error) {
      openActionDialog(
        messages.packsPage.errors.feedbackTitle,
        error instanceof Error ? error.message : messages.packsPage.errors.requestFailed,
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
              ? messages.packsPage.actions.generating
              : messages.packsPage.actions.generate,
            onClick: () => {
              void handleGeneratePack();
            },
            variant: "primary",
          },
        ]}
        breadcrumbs={messages.packsPage.labels.breadcrumbs}
        description={messages.packsPage.labels.description}
        title={messages.packsPage.labels.title}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex w-[300px] shrink-0 flex-col border-r border-border bg-card">
          <div className="border-b border-border px-4 py-4">
            <input
              className="w-full rounded-[8px] border border-border bg-surface-subtle px-3 py-2 text-[12.5px] text-foreground outline-none placeholder:text-muted"
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

          <div className="flex-1 overflow-y-auto">
            {visiblePacks.map((pack) => (
              <PackSidebarItem
                key={pack.id}
                accent={pack.accent}
                active={selectedPack?.id === pack.id}
                meta={pack.meta}
                onClick={() => setSelectedPackId(pack.id)}
                statusLabel={pack.statusLabel}
                statusTone={pack.statusTone}
                title={pack.title}
              />
            ))}
          </div>
        </aside>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {selectedPack === null ? (
            <CatalogCard className="p-6">
              <p className="text-lg font-semibold text-foreground">
                {messages.packsPage.emptyPackList}
              </p>
            </CatalogCard>
          ) : (
            <PackDetail
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
  exportingPackId,
  feedbackByRecommendationId,
  onExportPack,
  onRecommendationAction,
  onReviewPack,
  pack,
  reviewingPackId,
  submittingRecommendationId,
}: Readonly<{
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

  return (
    <div className="space-y-6">
      <CatalogCard className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              {messages.packsPage.detailEyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {pack.title}
            </h2>
            <p className="mt-2 text-sm text-muted">{pack.generatedAtLabel}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {pack.meta.map((item) => (
                <span
                  key={item}
                  className="rounded-[4px] border border-[rgba(20,34,53,.07)] bg-surface-subtle px-[7px] py-[2px] text-[11px] font-semibold text-muted dark:border-border"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-[8px] border border-[rgba(20,34,53,.12)] px-[18px] py-[9px] text-[13px] font-semibold text-foreground dark:border-border"
              onClick={() => {
                void onExportPack(pack.id);
              }}
              type="button"
            >
              {exportingPackId === pack.id
                ? messages.packsPage.actions.exporting
                : messages.packsPage.actions.export}
            </button>
            <button
              className="rounded-[9px] bg-accent px-[18px] py-[9px] text-[13px] font-bold text-[#0d1b2a]"
              onClick={() => {
                void onReviewPack(pack.id);
              }}
              type="button"
            >
              {reviewingPackId === pack.id
                ? messages.packsPage.actions.markingReviewed
                : messages.packsPage.actions.markReviewed}
            </button>
          </div>
        </div>
      </CatalogCard>

      {pack.metrics.length > 0 ? (
        <div className="grid gap-[14px] md:grid-cols-2 xl:grid-cols-4">
          {pack.metrics.map((metric) => (
            <MetricTile
              key={metric.label}
              detail={metric.detail}
              label={metric.label}
              tone={metric.tone}
              trend={metric.detail}
              value={metric.value}
            />
          ))}
        </div>
      ) : null}

      <section>
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">
          {messages.packsPage.recommendationsHeading}
        </h3>
        <div className="mt-4 space-y-4">
          {pack.recommendations.length === 0 ? (
            <CatalogCard className="p-6">
              <p className="text-sm text-muted">
                {messages.packsPage.emptyDraftRecommendations}
              </p>
            </CatalogCard>
          ) : (
            pack.recommendations.map((recommendation) => {
              const feedbackState = feedbackByRecommendationId[recommendation.id];
              const isSubmitting = submittingRecommendationId === recommendation.id;

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
                        action,
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
                      className={[
                        "text-sm font-medium",
                        feedbackState.tone === "success"
                          ? "text-green-700 dark:text-emerald-300"
                          : feedbackState.tone === "warning"
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-blue-700 dark:text-sky-300",
                      ].join(" ")}
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
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">
          {messages.packsPage.sourceDataHeading}
        </h3>
        <CatalogCard className="mt-4 overflow-hidden">
          <div className="grid gap-3 border-b border-border bg-surface-subtle px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted md:grid-cols-[2fr_1fr_1fr_1fr]">
            <span>{messages.packsPage.dataHeaders.sourceFile}</span>
            <span>{messages.packsPage.dataHeaders.class}</span>
            <span>{messages.packsPage.dataHeaders.confidence}</span>
            <span>{messages.packsPage.dataHeaders.contribution}</span>
          </div>
          {pack.sourceData.length === 0 ? (
            <div className="px-4 py-5 text-sm text-muted">
              {messages.packsPage.sourceDataEmpty}
            </div>
          ) : (
            pack.sourceData.map((record) => (
              <SourceDataRow
                key={record.id}
                classLabel={record.classLabel}
                confidenceLabel={record.confidenceLabel}
                contributionLabel={record.contributionLabel}
                name={record.name}
              />
            ))
          )}
        </CatalogCard>
      </section>
    </div>
  );
}

function matchesSearch(pack: PackItem, normalizedSearch: string) {
  if (normalizedSearch.length === 0) {
    return true;
  }

  return `${pack.title} ${pack.generatedAtLabel} ${pack.meta.join(" ")}`
    .toLowerCase()
    .includes(normalizedSearch);
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
