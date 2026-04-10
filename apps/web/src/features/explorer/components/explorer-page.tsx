"use client";

import { useDeferredValue, useState } from "react";
import { useRouter } from "next/navigation";

import { PlaceholderActionDialog } from "@/features/catalog/components/catalog-dialogs";
import {
  CatalogButton,
  CatalogTable,
  ConfidenceMeter,
  StatusBadge,
  cx,
} from "@/features/catalog/components/catalog-primitives";
import {
  CitationList,
  FilterChip,
} from "@/features/catalog/components/workspace-catalog-blocks";
import { resolveSelectedExplorerRecord } from "@/features/explorer/lib/explorer-selection";
import {
  type ExplorerPageData,
  type ExplorerRecord,
} from "@/features/explorer/server/handle-explorer-records-request";
import { useUiI18n } from "@/features/i18n/components/ui-i18n-provider";

type ExplorerPageProps = Readonly<{
  initialData: ExplorerPageData;
  orgId: string;
}>;

type ExplorerExportError = Readonly<{
  error: string;
}>;

type ReviewSummary = Readonly<{
  badge: string;
  cta?: Readonly<{
    href: string;
    label: string;
  }>;
  description: string;
  emptyFactsMessage: string;
  meta: string;
  title: string;
  tone: "danger" | "info" | "success" | "warning";
}>;

type ReviewChecklistItem = Readonly<{
  description: string;
  title: string;
}>;

type ReviewStat = Readonly<{
  detail: string;
  label: string;
  value: string;
}>;

type SectionJump = Readonly<{
  label: string;
  targetId: string;
}>;

export function ExplorerPage({ initialData, orgId }: ExplorerPageProps) {
  const { messages, t } = useUiI18n();
  const router = useRouter();
  const allRecordsLabel = initialData.filters[0] ?? messages.explorerPage.allRecords;
  const [activeFilter, setActiveFilter] = useState(allRecordsLabel);
  const [placeholderAction, setPlaceholderAction] = useState<{
    description?: string;
    title: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(
    initialData.records[0]?.id ?? null,
  );
  const [isDownloadingSelectedRecord, setIsDownloadingSelectedRecord] =
    useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const visibleRecords = initialData.records.filter((record) => {
    const matchesFilter =
      activeFilter === allRecordsLabel || record.typeLabel === activeFilter;
    const normalizedQuery = deferredSearch.trim().toLowerCase();

    if (normalizedQuery.length === 0) {
      return matchesFilter;
    }

    return (
      matchesFilter &&
      `${record.documentName} ${record.documentMeta} ${record.typeLabel} ${record.sourceLabel}`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  });
  const selectedRecord = resolveSelectedExplorerRecord(
    visibleRecords,
    selectedRecordId,
  );
  const hasVisibleRecords = visibleRecords.length > 0;
  const isDetailPaneOpen = selectedRecord !== null;
  const summary = buildVisibleSummary(visibleRecords);
  const reviewSummary =
    selectedRecord === null ? null : buildReviewSummary(selectedRecord, t);
  const reviewSummaryCta = reviewSummary?.cta;
  const reviewChecklist =
    selectedRecord === null ? [] : buildReviewChecklist(selectedRecord, t);
  const reviewStats =
    selectedRecord === null ? [] : buildReviewStats(selectedRecord, reviewSummary, t);
  const sectionJumps =
    selectedRecord === null ? [] : buildSectionJumps(selectedRecord, t);

  function openActionDialog(title: string, description?: string) {
    setPlaceholderAction({ description, title });
  }

  async function handleExportCsv() {
    if (isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      const searchParams = new URLSearchParams({
        orgId,
      });

      if (activeFilter !== allRecordsLabel) {
        searchParams.set("type", activeFilter);
      }

      if (deferredSearch.trim().length > 0) {
        searchParams.set("query", deferredSearch.trim());
      }

      const response = await fetch(
        `/api/explorer/records/export?${searchParams.toString()}`,
      );

      if (!response.ok) {
        const payload = (await response.json()) as ExplorerExportError;
        throw new Error(payload.error || "Explorer export failed.");
      }

      await downloadResponseAsFile(response);
    } catch (error) {
      openActionDialog(
        t("explorerPage.exportErrorTitle", "Could not export records"),
        error instanceof Error
          ? error.message
          : "The request could not be completed.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDownloadFile(record: ExplorerRecord) {
    if (isDownloadingSelectedRecord) {
      return;
    }

    setIsDownloadingSelectedRecord(true);

    try {
      const response = await fetch(
        `/api/documents/${encodeURIComponent(record.id)}/download?orgId=${encodeURIComponent(orgId)}`,
      );

      if (!response.ok) {
        const payload = (await response.json()) as ExplorerExportError;
        throw new Error(payload.error || "Document download failed.");
      }

      await downloadResponseAsFile(response);
    } catch (error) {
      openActionDialog(
        "Could not download file",
        error instanceof Error
          ? error.message
          : "The request could not be completed.",
      );
    } finally {
      setIsDownloadingSelectedRecord(false);
    }
  }

  const columns = [
    {
      header: messages.explorerPage.tableHeaders.document,
      key: "document",
      render: (row: ExplorerRecord) => (
        <button
          className="w-full text-left"
          onClick={() => setSelectedRecordId(row.id)}
          type="button"
        >
          <div className="font-semibold text-foreground">{row.documentName}</div>
          <div className="mt-1 text-xs text-muted">{row.documentMeta}</div>
        </button>
      ),
    },
    {
      header: messages.explorerPage.tableHeaders.type,
      key: "doc-class",
      render: (row: ExplorerRecord) => (
        <StatusBadge label={row.typeLabel} tone={row.typeTone} />
      ),
    },
    {
      header: messages.explorerPage.tableHeaders.source,
      key: "source",
      render: (row: ExplorerRecord) => (
        <span className="text-muted">{row.sourceLabel}</span>
      ),
    },
    {
      header: messages.explorerPage.tableHeaders.date,
      key: "date",
      render: (row: ExplorerRecord) => (
        <span className="text-muted">{row.dateLabel}</span>
      ),
    },
    {
      header: messages.explorerPage.tableHeaders.confidence,
      key: "confidence",
      render: (row: ExplorerRecord) =>
        row.confidenceScore === null ? (
          <span className="text-muted">-</span>
        ) : (
          <ConfidenceMeter value={row.confidenceScore} />
        ),
    },
    {
      header: messages.explorerPage.tableHeaders.status,
      key: "status",
      render: (row: ExplorerRecord) => (
        <StatusBadge label={row.statusLabel} tone={row.statusTone} />
      ),
    },
    {
      header: messages.explorerPage.tableHeaders.facts,
      key: "facts",
      render: (row: ExplorerRecord) => (
        <span className="text-muted">{row.factsSummary}</span>
      ),
    },
  ] as const;

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-5 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5 text-[11.5px] text-muted">
            <span>{messages.explorerPage.breadcrumbs[0]}</span>
            <span className="text-muted/40">/</span>
            <span className="font-medium text-foreground">
              {messages.explorerPage.title}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-[6px] rounded-[7px] border border-border-strong bg-surface-subtle px-[10px] py-[5px] text-[12px] font-semibold text-muted transition hover:bg-surface-muted hover:text-foreground active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={() => {
              void handleExportCsv();
            }}
            type="button"
          >
            {isExporting
              ? messages.explorerPage.actions.exporting
              : messages.explorerPage.actions.export}
          </button>
          <button
            className="inline-flex items-center gap-[6px] rounded-[7px] bg-accent px-[10px] py-[5px] text-[12px] font-bold text-[#0d1b2a] transition hover:opacity-90 active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={() => router.push("/pipeline")}
            type="button"
          >
            {messages.explorerPage.actions.upload}
          </button>
        </div>
      </div>

      <div className="sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b border-border bg-background/[0.94] px-5 py-2 backdrop-blur-sm">
        {initialData.filters.map((filterLabel) => (
          <FilterChip
            key={filterLabel}
            active={activeFilter === filterLabel}
            label={filterLabel}
            onClick={() => setActiveFilter(filterLabel)}
          />
        ))}

        <div className="mx-2 hidden items-center gap-3 text-[11.5px] text-muted sm:flex">
          <span className="flex items-baseline gap-1">
            <strong className="text-[13px] font-bold text-foreground">
              {summary.totalRecords}
            </strong>
            {` ${messages.explorerPage.summary.totalRecords.toLowerCase()}`}
          </span>
          <span className="text-muted/30">/</span>
          <span className="flex items-baseline gap-1">
            <strong className="text-[13px] font-bold text-foreground">
              {summary.averageConfidence}
            </strong>
            {` ${messages.explorerPage.summary.averageConfidence.toLowerCase()}`}
          </span>
          {Number(summary.needsReviewCount) > 0 ? (
            <>
              <span className="text-muted/30">/</span>
              <span className="flex items-baseline gap-1">
                <strong className="text-[13px] font-bold text-amber-600 dark:text-amber-300">
                  {summary.needsReviewCount}
                </strong>
                {` ${messages.explorerPage.summary.needsReview.toLowerCase()}`}
              </span>
            </>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-[6px] rounded-[7px] border border-border bg-card px-3 py-[5px]">
          <svg
            fill="none"
            height="12"
            stroke="#8898aa"
            strokeLinecap="round"
            strokeWidth="1.5"
            viewBox="0 0 16 16"
            width="12"
          >
            <circle cx="7" cy="7" r="5" />
            <path d="M11 11l2.5 2.5" />
          </svg>
          <input
            className="w-[148px] border-none bg-transparent text-[12.5px] text-foreground outline-none placeholder:text-muted"
            onChange={(event) => setSearch(event.target.value)}
            placeholder={messages.explorerPage.searchPlaceholder}
            value={search}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div
          className={cx(
            isDetailPaneOpen
              ? "hidden w-[272px] shrink-0 flex-col overflow-y-auto border-r border-border bg-card lg:flex"
              : "min-w-0 flex-1 overflow-auto",
          )}
        >
          {isDetailPaneOpen ? (
            visibleRecords.map((record) => {
              const isSelected = selectedRecord?.id === record.id;
              return (
                <button
                  key={record.id}
                  className={cx(
                    "relative flex w-full flex-col items-start gap-2 border-b border-border/60 px-4 py-3.5 text-left transition-colors",
                    isSelected
                      ? "bg-accent/10 dark:bg-accent/[0.08]"
                      : "hover:bg-surface-subtle",
                  )}
                  onClick={() => setSelectedRecordId(record.id)}
                  type="button"
                >
                  {isSelected ? (
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 w-[3px] rounded-r-full bg-accent"
                    />
                  ) : null}
                  <span
                    className={cx(
                      "w-full truncate pr-2 text-[13px] font-semibold leading-snug",
                      isSelected ? "text-foreground" : "text-foreground/80",
                    )}
                  >
                    {record.documentName}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge label={record.typeLabel} tone={record.typeTone} />
                    <StatusBadge label={record.statusLabel} tone={record.statusTone} />
                  </div>
                  <p className="text-[12px] leading-[1.5] text-muted">
                    {buildReviewFocusLabel(record, t)}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <ExplorerMetaChip
                      label={buildReviewEvidenceLabel(record, t)}
                      tone={
                        record.reviewHealth.uncitedFactCount === 0 &&
                        record.detailFacts.length > 0
                          ? "success"
                          : "neutral"
                      }
                    />
                    <ExplorerMetaChip
                      label={buildReviewConfidenceLabel(record, t)}
                      tone={
                        record.reviewHealth.highConfidenceFactCount > 0
                          ? "info"
                          : "neutral"
                      }
                    />
                  </div>
                  {record.confidenceScore !== null ? (
                    <ConfidenceMeter value={record.confidenceScore} />
                  ) : null}
                </button>
              );
            })
          ) : (
            hasVisibleRecords ? (
              <CatalogTable
                ariaLabel={messages.explorerPage.title}
                columns={columns}
                rowClassName={(row) =>
                  selectedRecordId !== null && row.id === selectedRecordId
                    ? "bg-accent/10"
                    : undefined
                }
                rows={visibleRecords}
              />
            ) : (
              <div className="flex min-h-[280px] items-center justify-center p-6">
                <div className="max-w-md rounded-[14px] border border-border bg-card px-6 py-6 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-muted">
                    {t("explorerPage.emptyStateEyebrow", "Nothing in this view")}
                  </p>
                  <h2 className="mt-3 text-[18px] font-bold text-foreground">
                    {t(
                      "explorerPage.emptyStateTitle",
                      "No records match the current search",
                    )}
                  </h2>
                  <p className="mt-2 text-[13px] leading-[1.6] text-muted">
                    {t(
                      "explorerPage.emptyStateDescription",
                      "Clear the search or change the filter to bring records back into view.",
                    )}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    <CatalogButton
                      onClick={() => setSearch("")}
                      variant="secondary"
                    >
                      {t("explorerPage.emptyStateClearSearch", "Clear search")}
                    </CatalogButton>
                    {activeFilter !== allRecordsLabel ? (
                      <CatalogButton
                        onClick={() => setActiveFilter(allRecordsLabel)}
                        variant="ghost"
                      >
                        {t("explorerPage.emptyStateShowAll", "Show all records")}
                      </CatalogButton>
                    ) : null}
                    <CatalogButton
                      onClick={() => router.push("/pipeline")}
                      variant="ghost"
                    >
                      {t("explorerPage.emptyStateOpenPipeline", "Open Pipeline")}
                    </CatalogButton>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {selectedRecord !== null ? (
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex items-center border-b border-border/60 px-5 py-2 lg:hidden">
              <button
                className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted transition-colors hover:text-foreground"
                onClick={() => setSelectedRecordId(null)}
                type="button"
              >
                <svg
                  fill="none"
                  height="11"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 16 16"
                  width="11"
                >
                  <path d="M10 4L6 8l4 4" />
                </svg>
                {messages.explorerPage.backToList}
              </button>
            </div>

            <div className="shrink-0 border-b border-border bg-card">
              <div className="flex items-start gap-4 px-6 py-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge
                      label={selectedRecord.typeLabel}
                      tone={selectedRecord.typeTone}
                    />
                    <StatusBadge
                      label={selectedRecord.statusLabel}
                      tone={selectedRecord.statusTone}
                    />
                  </div>
                  <h2 className="mt-2.5 text-[18px] font-bold leading-snug tracking-tight text-foreground">
                    {selectedRecord.documentName}
                  </h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] text-muted">
                    <span>{selectedRecord.documentMeta}</span>
                    <span className="text-muted/40">/</span>
                    <span>{selectedRecord.sourceLabel}</span>
                    <span className="text-muted/40">/</span>
                    <span>{selectedRecord.dateLabel}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 pt-0.5">
                  {selectedRecord.confidenceScore !== null ? (
                    <ConfidenceMeter value={selectedRecord.confidenceScore} />
                  ) : null}
                  <CatalogButton
                    disabled={
                      !selectedRecord.downloadAvailable ||
                      isDownloadingSelectedRecord
                    }
                    onClick={() => {
                      void handleDownloadFile(selectedRecord);
                    }}
                    variant="secondary"
                  >
                    {isDownloadingSelectedRecord
                      ? "Downloading..."
                      : t("explorerPage.actions.download", "Download file")}
                  </CatalogButton>
                  <CatalogButton
                    onClick={() => setSelectedRecordId(null)}
                    variant="ghost"
                  >
                    {messages.explorerPage.close}
                  </CatalogButton>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-[96rem] divide-y divide-border px-6 pb-12 2xl:px-8">
                {reviewSummary ? (
                  <section className="py-6">
                    <div className="rounded-[12px] border border-border bg-surface-subtle px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge
                              label={reviewSummary.badge}
                              tone={reviewSummary.tone}
                            />
                            <span className="text-[11px] font-medium text-muted">
                              {reviewSummary.meta}
                            </span>
                          </div>
                          <p className="mt-3 text-[14px] font-semibold text-foreground">
                            {reviewSummary.title}
                          </p>
                          <p className="mt-1 text-[12.5px] leading-[1.6] text-muted">
                            {reviewSummary.description}
                          </p>
                        </div>
                        {reviewSummaryCta ? (
                          <CatalogButton
                            onClick={() => router.push(reviewSummaryCta.href)}
                            variant="secondary"
                          >
                            {reviewSummaryCta.label}
                          </CatalogButton>
                        ) : null}
                      </div>
                    </div>
                  </section>
                ) : null}

                {selectedRecord !== null ? (
                  <section className="py-6 pt-0">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {reviewStats.map((stat) => (
                        <article
                          key={`${selectedRecord.id}-${stat.label}`}
                          className="rounded-[12px] border border-border bg-card px-4 py-3.5"
                        >
                          <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">
                            {stat.label}
                          </p>
                          <p className="mt-2 text-[18px] font-semibold text-foreground">
                            {stat.value}
                          </p>
                          <p className="mt-1 text-[12px] leading-[1.55] text-muted">
                            {stat.detail}
                          </p>
                        </article>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.95fr)] 2xl:grid-cols-[minmax(0,1.55fr)_minmax(24rem,0.9fr)]">
                      <div className="rounded-[12px] border border-border bg-card px-4 py-4">
                        <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">
                          {t(
                            "explorerPage.reviewChecklistHeading",
                            "Recommended review order",
                          )}
                        </p>
                        <div className="mt-3 space-y-3">
                          {reviewChecklist.map((item, index) => (
                            <div
                              key={`${selectedRecord.id}-checklist-${index + 1}`}
                              className="flex items-start gap-3"
                            >
                              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[11px] font-bold text-accent">
                                {index + 1}
                              </span>
                              <div>
                                <p className="text-[12.5px] font-semibold text-foreground">
                                  {item.title}
                                </p>
                                <p className="mt-1 text-[12px] leading-[1.55] text-muted">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-4">
                        <div className="rounded-[12px] border border-border bg-card px-4 py-4">
                          <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">
                            {t("explorerPage.reviewHealthHeading", "Review health")}
                          </p>
                          <div className="mt-3 space-y-3">
                            <ReviewHealthRow
                              detail={buildReviewEvidenceLabel(selectedRecord, t)}
                              label={t("explorerPage.reviewHealthEvidence", "Evidence")}
                            />
                            <ReviewHealthRow
                              detail={buildReviewConfidenceLabel(selectedRecord, t)}
                              label={t("explorerPage.reviewHealthConfidence", "Confidence")}
                            />
                            <ReviewHealthRow
                              detail={buildReviewParserLabel(selectedRecord, t)}
                              label={t("explorerPage.reviewHealthParser", "Parser")}
                            />
                          </div>
                        </div>

                        {sectionJumps.length > 0 ? (
                          <div className="rounded-[12px] border border-border bg-card px-4 py-4">
                            <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">
                              {t("explorerPage.jumpToHeading", "Jump to")}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {sectionJumps.map((jump) => (
                                <CatalogButton
                                  key={`${selectedRecord.id}-${jump.targetId}`}
                                  onClick={() =>
                                    document
                                      .getElementById(jump.targetId)
                                      ?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "start",
                                      })
                                  }
                                  variant="secondary"
                                >
                                  {jump.label}
                                </CatalogButton>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </section>
                ) : null}

                {selectedRecord !== null ? (
                  <>
                    {selectedRecord.detailDocumentFields.length > 0 ? (
                      <section className="py-6">
                        <h3 className="mb-4 text-[10.5px] font-bold uppercase tracking-[0.09em] text-muted">
                          {messages.explorerPage.documentMetadataHeading}
                        </h3>
                        <div className="overflow-hidden rounded-[10px] border border-border">
                          {selectedRecord.detailDocumentFields.map((field, index) => (
                            <div
                              key={`${selectedRecord.id}-document-${field.label}`}
                              className={cx(
                                "flex items-start justify-between gap-6 px-4 py-3",
                                index !==
                                  selectedRecord.detailDocumentFields.length - 1
                                  ? "border-b border-border/50"
                                  : "",
                              )}
                            >
                              <span className="text-[13px] text-muted">
                                {field.label}
                              </span>
                              <span className="text-right text-[13px] font-semibold text-foreground">
                                {field.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </section>
                    ) : null}

                    {selectedRecord.detailParserFields.length > 0 ? (
                      <section className="py-6">
                        <h3 className="mb-4 text-[10.5px] font-bold uppercase tracking-[0.09em] text-muted">
                          {messages.explorerPage.parserMetadataHeading}
                        </h3>
                        <div className="overflow-hidden rounded-[10px] border border-border">
                          {selectedRecord.detailParserFields.map((field, index) => (
                            <div
                              key={`${selectedRecord.id}-parser-${field.label}`}
                              className={cx(
                                "flex items-start justify-between gap-6 px-4 py-3",
                                index !== selectedRecord.detailParserFields.length - 1
                                  ? "border-b border-border/50"
                                  : "",
                              )}
                            >
                              <span className="text-[13px] text-muted">
                                {field.label}
                              </span>
                              <span className="text-right text-[13px] font-semibold text-foreground">
                                {field.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </section>
                    ) : null}

                    <section className="py-6" id="explorer-key-findings">
                      <h3 className="mb-4 flex items-baseline gap-2 text-[10.5px] font-bold uppercase tracking-[0.09em] text-muted">
                        {t("explorerPage.keyFindingsHeading", "Key findings")}
                        <span className="text-[11px] font-normal normal-case tracking-normal text-muted/60">
                          {selectedRecord.detailKeyFindings.length}{" "}
                          {selectedRecord.detailKeyFindings.length === 1
                            ? t("explorerPage.findingSingular", "finding")
                            : t("explorerPage.findingPlural", "findings")}
                        </span>
                      </h3>
                      {selectedRecord.detailKeyFindings.length === 0 ? (
                        <p className="text-[13px] text-muted">
                          {t(
                            "explorerPage.noKeyFindings",
                            "No high-signal facts are available yet.",
                          )}
                        </p>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {selectedRecord.detailKeyFindings.map((finding, index) => (
                            <article
                              key={`${selectedRecord.id}-finding-${index + 1}-${finding.label}`}
                              className="rounded-[12px] border border-border bg-card px-4 py-3.5"
                            >
                              <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">
                                {finding.label}
                              </p>
                              <p className="mt-2 text-[17px] font-semibold leading-snug text-foreground">
                                {finding.value}
                              </p>
                              <p className="mt-2 text-[12px] leading-relaxed text-muted">
                                {finding.detail}
                              </p>
                            </article>
                          ))}
                        </div>
                      )}
                    </section>

                    <section className="py-6" id="explorer-extracted-facts">
                      <h3 className="mb-4 flex items-baseline gap-2 text-[10.5px] font-bold uppercase tracking-[0.09em] text-muted">
                        {messages.explorerPage.extractedFactsHeading}
                        <span className="text-[11px] font-normal normal-case tracking-normal text-muted/60">
                          {selectedRecord.detailFacts.length}{" "}
                          {selectedRecord.detailFacts.length === 1
                            ? t("explorerPage.factSingular", "fact")
                            : t("explorerPage.factPlural", "facts")}
                        </span>
                      </h3>
                      {selectedRecord.detailFacts.length === 0 ? (
                        <p className="text-[13px] text-muted">
                          {reviewSummary?.emptyFactsMessage ??
                            messages.explorerPage.noFacts}
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {selectedRecord.detailFacts.map((fact, index) => (
                            <article
                              key={`${selectedRecord.id}-${fact.canonicalFactTypeId}-${fact.sourceFieldKey}-${index + 1}`}
                              className="rounded-[12px] border border-border bg-card px-4 py-4"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">
                                    {fact.key}
                                  </p>
                                  <p className="mt-2 text-[18px] font-semibold leading-snug text-foreground">
                                    {fact.value}
                                  </p>
                                  <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                                    {fact.description}
                                  </p>
                                </div>
                                <div className="shrink-0 pt-0.5">
                                  <ConfidenceMeter value={fact.confidenceScore} />
                                </div>
                              </div>

                              <dl className="mt-4 space-y-2 text-[12px] leading-relaxed text-muted">
                                <div>
                                  <dt className="font-semibold text-foreground">
                                    {t("explorerPage.factEvidenceLabel", "Evidence")}
                                  </dt>
                                  <dd>{fact.evidenceLabel}</dd>
                                </div>
                                <div>
                                  <dt className="font-semibold text-foreground">
                                    {t(
                                      "explorerPage.factSourceFieldLabel",
                                      "Source field",
                                    )}
                                  </dt>
                                  <dd className="font-mono text-[11.5px]">
                                    {fact.sourceFieldKey}
                                  </dd>
                                </div>
                                {fact.excerpt ? (
                                  <div>
                                    <dt className="font-semibold text-foreground">
                                      {t(
                                        "explorerPage.factExcerptLabel",
                                        "Source excerpt",
                                      )}
                                    </dt>
                                    <dd>{fact.excerpt}</dd>
                                  </div>
                                ) : null}
                              </dl>
                            </article>
                          ))}
                        </div>
                      )}
                    </section>

                    <section className="py-6" id="explorer-citations">
                      <h3 className="mb-4 flex items-baseline gap-2 text-[10.5px] font-bold uppercase tracking-[0.09em] text-muted">
                        {t("explorerPage.citationsHeading", "Citations")}
                        <span className="text-[11px] font-normal normal-case tracking-normal text-muted/60">
                          {selectedRecord.detailCitations.length}{" "}
                          {selectedRecord.detailCitations.length === 1
                            ? t("explorerPage.sourceSingular", "source")
                            : t("explorerPage.sourcePlural", "sources")}
                        </span>
                      </h3>
                      {selectedRecord.detailCitations.length === 0 ? (
                        <p className="text-[13px] text-muted">
                          {messages.explorerPage.noCitations}
                        </p>
                      ) : (
                        <CitationList items={selectedRecord.detailCitations} />
                      )}
                    </section>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
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

function ExplorerMetaChip({
  label,
  tone = "neutral",
}: Readonly<{
  label: string;
  tone?: "info" | "neutral" | "success";
}>) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.05em]",
        tone === "success"
          ? "bg-green-50 text-green-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          : tone === "info"
            ? "bg-accent/15 text-accent"
            : "bg-surface-muted text-muted",
      )}
    >
      {label}
    </span>
  );
}

function ReviewHealthRow({
  detail,
  label,
}: Readonly<{
  detail: string;
  label: string;
}>) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
        {label}
      </p>
      <p className="mt-1 text-[12.5px] leading-[1.55] text-foreground">
        {detail}
      </p>
    </div>
  );
}

function buildVisibleSummary(records: readonly ExplorerRecord[]) {
  const confidenceScores = records
    .map((record) => record.confidenceScore)
    .filter((score): score is number => score !== null);
  const averageConfidence =
    confidenceScores.length === 0
      ? "--"
      : (
          confidenceScores.reduce((total, score) => total + score, 0) /
          confidenceScores.length
        ).toFixed(2);

  return {
    averageConfidence,
    needsReviewCount: String(
      records.filter((record) => record.statusTone === "warning").length,
    ),
    totalRecords: String(records.length),
  };
}

async function downloadResponseAsFile(response: Response) {
  const fileBlob = await response.blob();
  const objectUrl = URL.createObjectURL(fileBlob);
  const link = document.createElement("a");
  const contentDisposition = response.headers.get("content-disposition");
  const fileNameMatch = contentDisposition?.match(/filename=\"([^\"]+)\"/);

  link.href = objectUrl;
  link.download = fileNameMatch?.[1] ?? "explorer-records.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

function buildReviewSummary(
  record: ExplorerRecord,
  t: (
    key: string,
    fallback: string,
    values?: Readonly<Record<string, boolean | number | string>>,
  ) => string,
): ReviewSummary {
  const findingsCount = record.detailKeyFindings.length;
  const factsCount = record.detailFacts.length;
  const citationsCount = record.detailCitations.length;
  const meta = t(
    "explorerPage.reviewSummaryMeta",
    "{{findings}} findings / {{facts}} facts / {{citations}} citations",
    {
      citations: citationsCount,
      facts: factsCount,
      findings: findingsCount,
    },
  );

  if (record.statusTone === "danger") {
    return {
      badge: t("explorerPage.reviewStateFailed", "Needs attention"),
      cta: {
        href: "/pipeline",
        label: t("explorerPage.reviewStateCtaPipeline", "Open Pipeline"),
      },
      description: t(
        "explorerPage.reviewStateFailedDescription",
        "This file hit a problem earlier in the workflow. Check Pipeline before trusting the details here.",
      ),
      emptyFactsMessage: t(
        "explorerPage.reviewStateFailedEmptyFacts",
        "No facts are ready yet because this file needs attention in Pipeline.",
      ),
      meta,
      title: t(
        "explorerPage.reviewStateFailedTitle",
        "This record is not ready for review yet.",
      ),
      tone: "danger",
    };
  }

  if (record.statusTone === "warning" || factsCount === 0) {
    return {
      badge: t("explorerPage.reviewStateProcessing", "Still getting it ready"),
      cta: {
        href: "/pipeline",
        label: t("explorerPage.reviewStateCtaPipeline", "Open Pipeline"),
      },
      description: t(
        "explorerPage.reviewStateProcessingDescription",
        "The file is in the workspace, but some details may still be filling in. Use Pipeline if you want to follow the latest progress.",
      ),
      emptyFactsMessage: t(
        "explorerPage.reviewStateProcessingEmptyFacts",
        "We do not have review-ready facts for this file yet. Open Pipeline to follow progress.",
      ),
      meta,
      title: t(
        "explorerPage.reviewStateProcessingTitle",
        "Use the metadata below to confirm the file while the review details are still settling.",
      ),
      tone: "warning",
    };
  }

  return {
    badge: t("explorerPage.reviewStateReady", "Ready to review"),
    description: t(
      "explorerPage.reviewStateReadyDescription",
      "Start with the key findings, then verify the evidence on the fact cards below.",
    ),
    emptyFactsMessage: t(
      "explorerPage.reviewStateReadyEmptyFacts",
      "The file is ready, but there are no extracted facts to review yet.",
    ),
    meta,
    title: t(
      "explorerPage.reviewStateReadyTitle",
      "This record has enough detail to review confidently.",
    ),
    tone: "success",
  };
}

function buildReviewStats(
  record: ExplorerRecord,
  reviewSummary: ReviewSummary | null,
  t: (
    key: string,
    fallback: string,
    values?: Readonly<Record<string, boolean | number | string>>,
  ) => string,
): readonly ReviewStat[] {
  return [
    {
      detail: buildReviewFocusLabel(record, t),
      label: t("explorerPage.reviewStatsState", "Review state"),
      value: reviewSummary?.badge ?? record.statusLabel,
    },
    {
      detail: t(
        "explorerPage.reviewStatsFindingsDetail",
        "High-signal takeaways to scan first",
      ),
      label: t("explorerPage.reviewStatsFindings", "Key findings"),
      value: String(record.detailKeyFindings.length),
    },
    {
      detail: buildReviewConfidenceLabel(record, t),
      label: t("explorerPage.reviewStatsFacts", "Facts ready"),
      value: String(record.detailFacts.length),
    },
    {
      detail: buildReviewEvidenceLabel(record, t),
      label: t("explorerPage.reviewStatsCitations", "Citations"),
      value: String(record.reviewHealth.citedFactCount),
    },
  ];
}

function buildReviewChecklist(
  record: ExplorerRecord,
  t: (
    key: string,
    fallback: string,
    values?: Readonly<Record<string, boolean | number | string>>,
  ) => string,
): readonly ReviewChecklistItem[] {
  if (record.statusTone === "danger") {
    return [
      {
        description: t(
          "explorerPage.reviewChecklistFailedOneDetail",
          "Confirm the document metadata first so you know you are looking at the right file.",
        ),
        title: t(
          "explorerPage.reviewChecklistFailedOne",
          "Check the file identity",
        ),
      },
      {
        description: t(
          "explorerPage.reviewChecklistFailedTwoDetail",
          "Open Pipeline to see what failed before relying on anything in this record.",
        ),
        title: t(
          "explorerPage.reviewChecklistFailedTwo",
          "Review the pipeline issue",
        ),
      },
      {
        description: t(
          "explorerPage.reviewChecklistFailedThreeDetail",
          "Come back here after the file is reprocessed and the facts are available again.",
        ),
        title: t(
          "explorerPage.reviewChecklistFailedThree",
          "Return once the file is stable",
        ),
      },
    ];
  }

  if (record.statusTone === "warning" || record.detailFacts.length === 0) {
    return [
      {
        description: t(
          "explorerPage.reviewChecklistProcessingOneDetail",
          "Use the metadata and parser details to confirm the upload landed correctly.",
        ),
        title: t(
          "explorerPage.reviewChecklistProcessingOne",
          "Verify the file basics",
        ),
      },
      {
        description: t(
          "explorerPage.reviewChecklistProcessingTwoDetail",
          "Open Pipeline if you need the most current status while the review details keep filling in.",
        ),
        title: t(
          "explorerPage.reviewChecklistProcessingTwo",
          "Track the latest progress",
        ),
      },
      {
        description: t(
          "explorerPage.reviewChecklistProcessingThreeDetail",
          "Revisit the fact cards once extraction finishes and source evidence is attached.",
        ),
        title: t(
          "explorerPage.reviewChecklistProcessingThree",
          "Return for evidence review",
        ),
      },
    ];
  }

  return [
    {
      description: t(
        "explorerPage.reviewChecklistReadyOneDetail",
        "Start with the short list of findings to understand what matters most in this document.",
      ),
      title: t(
        "explorerPage.reviewChecklistReadyOne",
        "Scan the key findings first",
      ),
    },
    {
      description: t(
        "explorerPage.reviewChecklistReadyTwoDetail",
        "Open the fact cards and confirm the value, the evidence label, and the source field all line up.",
      ),
      title: t(
        "explorerPage.reviewChecklistReadyTwo",
        "Verify the fact cards",
      ),
    },
    {
      description: t(
        "explorerPage.reviewChecklistReadyThreeDetail",
        "Finish with the citations so you know exactly which source references support the review.",
      ),
      title: t(
        "explorerPage.reviewChecklistReadyThree",
        "Close with the citations",
      ),
    },
  ];
}

function buildSectionJumps(
  record: ExplorerRecord,
  t: (
    key: string,
    fallback: string,
    values?: Readonly<Record<string, boolean | number | string>>,
  ) => string,
): readonly SectionJump[] {
  const jumps: SectionJump[] = [];

  if (record.detailKeyFindings.length > 0) {
    jumps.push({
      label: t("explorerPage.jumpToFindings", "Key findings"),
      targetId: "explorer-key-findings",
    });
  }

  if (record.detailFacts.length > 0) {
    jumps.push({
      label: t("explorerPage.jumpToFacts", "Extracted facts"),
      targetId: "explorer-extracted-facts",
    });
  }

  if (record.detailCitations.length > 0) {
    jumps.push({
      label: t("explorerPage.jumpToCitations", "Citations"),
      targetId: "explorer-citations",
    });
  }

  return jumps;
}

function buildReviewFocusLabel(
  record: ExplorerRecord,
  t: (
    key: string,
    fallback: string,
    values?: Readonly<Record<string, boolean | number | string>>,
  ) => string,
) {
  if (record.statusTone === "danger") {
    return t(
      "explorerPage.reviewHealthFocusFailed",
      "Resolve the pipeline issue before trusting the review details here.",
    );
  }

  if (record.reviewHealth.primaryFindingLabel) {
    return t(
      "explorerPage.reviewHealthFocusPrimary",
      "Start with {{label}}.",
      { label: record.reviewHealth.primaryFindingLabel },
    );
  }

  if (record.detailFacts.length === 0) {
    return t(
      "explorerPage.reviewHealthFocusWaiting",
      "Wait for review-ready facts before doing a full check.",
    );
  }

  return t(
    "explorerPage.reviewHealthFocusFallback",
    "Review the fact cards and citations together.",
  );
}

function buildReviewEvidenceLabel(
  record: ExplorerRecord,
  t: (
    key: string,
    fallback: string,
    values?: Readonly<Record<string, boolean | number | string>>,
  ) => string,
) {
  if (record.detailFacts.length === 0) {
    return t(
      "explorerPage.reviewHealthEvidenceEmpty",
      "No fact evidence is attached yet.",
    );
  }

  if (record.reviewHealth.uncitedFactCount === 0) {
    return t(
      "explorerPage.reviewHealthEvidenceComplete",
      "Every visible fact includes source evidence.",
    );
  }

  return t(
    "explorerPage.reviewHealthEvidencePartial",
    "{{count}} visible facts still need citations.",
    {
      count: record.reviewHealth.uncitedFactCount,
    },
  );
}

function buildReviewConfidenceLabel(
  record: ExplorerRecord,
  t: (
    key: string,
    fallback: string,
    values?: Readonly<Record<string, boolean | number | string>>,
  ) => string,
) {
  if (record.detailFacts.length === 0) {
    return t(
      "explorerPage.reviewHealthConfidenceEmpty",
      "Confidence will show up after facts are extracted.",
    );
  }

  if (record.reviewHealth.highConfidenceFactCount === record.detailFacts.length) {
    return t(
      "explorerPage.reviewHealthConfidenceHigh",
      "The visible facts are all high confidence.",
    );
  }

  if (record.reviewHealth.highConfidenceFactCount === 0) {
    return t(
      "explorerPage.reviewHealthConfidenceLow",
      "Treat these facts as low confidence until more evidence arrives.",
    );
  }

  return t(
    "explorerPage.reviewHealthConfidenceMixed",
    "{{count}} visible facts are high confidence.",
    {
      count: record.reviewHealth.highConfidenceFactCount,
    },
  );
}

function buildReviewParserLabel(
  record: ExplorerRecord,
  t: (
    key: string,
    fallback: string,
    values?: Readonly<Record<string, boolean | number | string>>,
  ) => string,
) {
  return record.reviewHealth.hasParserArtifact
    ? t(
        "explorerPage.reviewHealthParserReady",
        "Parser details are available below if you need to confirm headings, rows, or sections.",
      )
    : t(
        "explorerPage.reviewHealthParserMissing",
        "Parser details are not available yet, so use the document metadata and workflow status first.",
      );
}
