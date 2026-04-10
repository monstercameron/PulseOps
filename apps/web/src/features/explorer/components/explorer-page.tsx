"use client";

import { useDeferredValue, useState } from "react";
import { useRouter } from "next/navigation";

import { PlaceholderActionDialog } from "@/features/catalog/components/catalog-dialogs";
import {
  CatalogTable,
  ConfidenceMeter,
  StatusBadge,
} from "@/features/catalog/components/catalog-primitives";
import {
  CitationList,
  FilterChip,
  WorkspaceHeader,
} from "@/features/catalog/components/workspace-catalog-blocks";
import {
  type ExplorerPageData,
  type ExplorerRecord,
} from "@/features/explorer/server/handle-explorer-records-request";

type ExplorerPageProps = Readonly<{
  initialData: ExplorerPageData;
  orgId: string;
}>;

type ExplorerExportError = Readonly<{
  error: string;
}>;

export function ExplorerPage({ initialData, orgId }: ExplorerPageProps) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState(initialData.filters[0] ?? "All records");
  const [placeholderAction, setPlaceholderAction] = useState<{
    description?: string;
    title: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [selectedRecordId, setSelectedRecordId] = useState(
    initialData.records[0]?.id ?? null,
  );
  const [isExporting, setIsExporting] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const visibleRecords = initialData.records.filter((record) => {
    const matchesFilter =
      activeFilter === "All records" || record.typeLabel === activeFilter;
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
  const selectedRecord =
    visibleRecords.find((record) => record.id === selectedRecordId) ??
    visibleRecords[0] ??
    null;
  const summary = buildVisibleSummary(visibleRecords);

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

      if (activeFilter !== "All records") {
        searchParams.set("type", activeFilter);
      }

      if (deferredSearch.trim().length > 0) {
        searchParams.set("query", deferredSearch.trim());
      }

      const response = await fetch(`/api/explorer/records/export?${searchParams.toString()}`);

      if (!response.ok) {
        const payload = (await response.json()) as ExplorerExportError;
        throw new Error(payload.error || "Explorer export failed.");
      }

      await downloadResponseAsFile(response);
    } catch (error) {
      openActionDialog(
        "Could not export records",
        error instanceof Error ? error.message : "The request could not be completed.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  const columns = [
    {
      header: "Document",
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
      header: "Doc class",
      key: "doc-class",
      render: (row: ExplorerRecord) => (
        <StatusBadge label={row.typeLabel} tone={row.typeTone} />
      ),
    },
    {
      header: "Source",
      key: "source",
      render: (row: ExplorerRecord) => (
        <span className="text-muted">{row.sourceLabel}</span>
      ),
    },
    {
      header: "Date",
      key: "date",
      render: (row: ExplorerRecord) => (
        <span className="text-muted">{row.dateLabel}</span>
      ),
    },
    {
      header: "Confidence",
      key: "confidence",
      render: (row: ExplorerRecord) =>
        row.confidenceScore === null ? (
          <span className="text-muted">-</span>
        ) : (
          <ConfidenceMeter value={row.confidenceScore} />
        ),
    },
    {
      header: "Status",
      key: "status",
      render: (row: ExplorerRecord) => (
        <StatusBadge label={row.statusLabel} tone={row.statusTone} />
      ),
    },
    {
      header: "Facts extracted",
      key: "facts",
      render: (row: ExplorerRecord) => (
        <span className="text-muted">{row.factsSummary}</span>
      ),
    },
  ] as const;

  return (
    <div className="flex min-h-full flex-col">
      <WorkspaceHeader
        actions={[
          {
            label: isExporting ? "Exporting..." : "Export CSV",
            onClick: () => {
              void handleExportCsv();
            },
            variant: "secondary",
          },
          {
            label: "Upload file",
            onClick: () => router.push("/pipeline"),
            variant: "primary",
          },
        ]}
        breadcrumbs={["Dashboard", "Explorer"]}
        description="Browse parsed artifacts, extracted facts, and review-state records in one workspace table."
        title="Data explorer"
      />

      <div className="sticky top-0 z-10 flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-background/[0.92] px-6 py-[10px] backdrop-blur-sm">
        {initialData.filters.map((filterLabel) => (
          <FilterChip
            key={filterLabel}
            active={activeFilter === filterLabel}
            label={filterLabel}
            onClick={() => setActiveFilter(filterLabel)}
          />
        ))}
        <div className="ml-auto flex items-center gap-[6px] rounded-[8px] border border-border bg-card px-3 py-[6px]">
          <svg fill="none" height="13" stroke="#8898aa" strokeLinecap="round" strokeWidth="1.5" viewBox="0 0 16 16" width="13"><circle cx="7" cy="7" r="5" /><path d="M11 11l2.5 2.5" /></svg>
          <input
            className="w-[160px] border-none bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search records…"
            value={search}
          />
        </div>
      </div>

      <div className="flex shrink-0 border-b border-border bg-card">
        <div className="flex-1 border-r border-border px-6 py-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-muted">Total records</p>
          <p className="mt-[3px] text-[20px] font-extrabold tracking-[-0.02em] text-foreground">{summary.totalRecords}</p>
          <p className="mt-[2px] text-[11px] text-muted">across all sources and types</p>
        </div>
        <div className="flex-1 border-r border-border px-6 py-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-muted">Avg confidence</p>
          <p className="mt-[3px] text-[20px] font-extrabold tracking-[-0.02em] text-foreground">{summary.averageConfidence}</p>
          <p className="mt-[2px] text-[11px] text-muted">above 0.85 brief threshold</p>
        </div>
        <div className="flex-1 px-6 py-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-muted">Needs review</p>
          <p className="mt-[3px] text-[20px] font-extrabold tracking-[-0.02em] text-amber-600 dark:text-amber-300">{summary.needsReviewCount}</p>
          <p className="mt-[2px] text-[11px] text-muted">held — not yet downstream</p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="min-w-0 flex-1 overflow-auto">
          <CatalogTable
            ariaLabel="Explorer records"
            columns={columns}
            rowClassName={(row) =>
              selectedRecord !== null && row.id === selectedRecord.id
                ? "bg-accent/6"
                : undefined
            }
            rows={visibleRecords}
          />
        </div>

        <div className="w-[320px] shrink-0 overflow-y-auto border-l border-border bg-card p-5">
          {selectedRecord === null ? (
            <div>
              <h2 className="text-base font-semibold text-foreground">No record selected</h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                Adjust the current filters or search query to bring a record into view.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge label={selectedRecord.typeLabel} tone={selectedRecord.typeTone} />
                  <StatusBadge label={selectedRecord.statusLabel} tone={selectedRecord.statusTone} />
                </div>
                <h2 className="mt-3 text-[15px] font-semibold tracking-tight text-foreground">
                  {selectedRecord.documentName}
                </h2>
                <p className="mt-2 text-[13px] leading-[1.6] text-muted">{selectedRecord.documentMeta}</p>
                <p className="text-[13px] leading-[1.6] text-muted">{selectedRecord.dateLabel}</p>
              </div>

              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">Facts preview</p>
                <div className="mt-3 space-y-2">
                  {selectedRecord.detailFacts.length === 0 ? (
                    <p className="text-[13px] text-muted">No extracted facts attached yet.</p>
                  ) : (
                    selectedRecord.detailFacts.map((fact) => (
                      <div
                        key={`${selectedRecord.id}-${fact.key}`}
                        className="rounded-[10px] border border-border bg-surface-subtle p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted">{fact.key}</span>
                          <ConfidenceMeter value={fact.confidenceScore} />
                        </div>
                        <p className="mt-2 text-[13px] font-medium text-foreground">{fact.value}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">Citations</p>
                <div className="mt-3">
                  {selectedRecord.detailCitations.length === 0 ? (
                    <p className="text-[13px] text-muted">No citations attached yet.</p>
                  ) : (
                    <CitationList items={selectedRecord.detailCitations} />
                  )}
                </div>
              </div>
            </div>
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
  const fileNameMatch = contentDisposition?.match(/filename="([^"]+)"/);

  link.href = objectUrl;
  link.download = fileNameMatch?.[1] ?? "explorer-records.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
