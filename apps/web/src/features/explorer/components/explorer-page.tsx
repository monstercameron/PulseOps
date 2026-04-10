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
  const isDetailPaneOpen = selectedRecord !== null;
  const summary = buildVisibleSummary(visibleRecords);
  const reviewSummary =
    selectedRecord === null ? null : buildReviewSummary(selectedRecord, t);
  const reviewSummaryCta = reviewSummary?.cta;

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
                  {record.confidenceScore !== null ? (
                    <ConfidenceMeter value={record.confidenceScore} />
                  ) : null}
                </button>
              );
            })
          ) : (
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
              <div className="mx-auto max-w-2xl divide-y divide-border px-6 pb-12">
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
                            index !== selectedRecord.detailDocumentFields.length - 1
                              ? "border-b border-border/50"
                              : "",
                          )}
                        >
                          <span className="text-[13px] text-muted">{field.label}</span>
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
                          <span className="text-[13px] text-muted">{field.label}</span>
                          <span className="text-right text-[13px] font-semibold text-foreground">
                            {field.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="py-6">
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

                <section className="py-6">
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
                      {reviewSummary?.emptyFactsMessage ?? messages.explorerPage.noFacts}
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
                                {t("explorerPage.factSourceFieldLabel", "Source field")}
                              </dt>
                              <dd className="font-mono text-[11.5px]">
                                {fact.sourceFieldKey}
                              </dd>
                            </div>
                            {fact.excerpt ? (
                              <div>
                                <dt className="font-semibold text-foreground">
                                  {t("explorerPage.factExcerptLabel", "Source excerpt")}
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

                <section className="py-6">
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
