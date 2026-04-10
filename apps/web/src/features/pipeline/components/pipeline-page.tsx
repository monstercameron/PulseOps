"use client";

import { useState } from "react";

import { PlaceholderActionDialog } from "@/features/catalog/components/catalog-dialogs";
import { CatalogCard, cx } from "@/features/catalog/components/catalog-primitives";
import {
  SourceConnectionCard,
  WorkspaceAlertBanner,
  WorkspaceHeader,
  WorkspaceStatStrip,
} from "@/features/catalog/components/workspace-catalog-blocks";
import {
  type PipelinePageData,
  type PipelineRun,
} from "@/features/pipeline/constants/pipeline-page-content";
import { useUiI18n } from "@/features/i18n/components/ui-i18n-provider";
import { UploadFilesModal } from "@/features/uploads/components/upload-files-modal";

type PipelinePageProps = Readonly<{
  initialData: PipelinePageData;
  orgId: string;
}>;

type PlaceholderAction = Readonly<{
  description?: string;
  title: string;
}> | null;

const stageEnabledClasses = "bg-green-50 text-green-700 dark:bg-emerald-500/15 dark:text-emerald-300";
const stageDisabledClasses = "bg-surface-muted text-muted/60";

const outcomeToneClasses = {
  danger: "bg-red-50 text-red-700 dark:bg-rose-500/15 dark:text-rose-300",
  success: "bg-green-50 text-green-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
} as const;

export function PipelinePage({ initialData, orgId }: PipelinePageProps) {
  const { messages, t } = useUiI18n();
  const labels = messages.pipelinePage.labels;
  const [placeholderAction, setPlaceholderAction] = useState<PlaceholderAction>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  function openPlaceholderAction(title: string, description?: string) {
    console.info(`[PulseOps] ${title}: not implemented yet.`);
    setPlaceholderAction({ description, title });
  }

  return (
    <div className="flex min-h-full flex-col">
      <WorkspaceHeader
        actions={[
          {
            label: labels.actions.secondary,
            onClick: () => setShowUploadModal(true),
            variant: "secondary",
          },
          {
            label: labels.actions.primary,
            onClick: () =>
              openPlaceholderAction(
                labels.actions.primary,
                messages.pipelinePage.testPipelineDescription,
              ),
            variant: "primary",
          },
        ]}
        breadcrumbs={labels.breadcrumbs}
        description={labels.description}
        title={labels.title}
      />

      <div className="flex-1 px-6 py-5">
        {initialData.alert ? (
            <WorkspaceAlertBanner
              actionLabel={initialData.alert.actionLabel}
              description={initialData.alert.description}
              dismissLabel={initialData.alert.dismissLabel}
              onAction={() =>
                openPlaceholderAction(
                  initialData.alert?.actionLabel ?? "View failed records",
                  initialData.alert?.title,
                )
              }
              onDismiss={() =>
                openPlaceholderAction(messages.pipelinePage.dismissAction, initialData.alert?.title)
              }
              title={initialData.alert.title}
              tone={initialData.alert.tone}
            />
        ) : null}

        <div className={initialData.alert ? "mt-5" : ""}>
          <WorkspaceStatStrip items={initialData.stats} />
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {initialData.sources.map((source) => (
              <SourceConnectionCard
                key={source.id}
                actionLabel={source.actionLabel}
                detailRows={source.detailRows}
                documentTypesLabel={t(
                  "pipelinePage.documentTypesLabel",
                  "Document types",
                )}
                healthLabel={source.healthLabel}
                healthTone={source.healthTone}
                onAction={() => openPlaceholderAction(source.actionLabel, source.title)}
                subtitle={source.subtitle}
                title={source.title}
                typeChips={source.typeChips}
              />
            ))}
          </div>
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
          <CatalogCard className="overflow-hidden">
            <div className="grid grid-cols-[120px_160px_minmax(220px,1fr)_52px_52px_52px_52px] gap-3 border-b border-border bg-surface-subtle px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              <span>{messages.pipelinePage.stageHeaders.source}</span>
              <span>{messages.pipelinePage.stageHeaders.documentType}</span>
              <span>{messages.pipelinePage.stageHeaders.depth}</span>
              <span className="text-center">{messages.pipelinePage.stageHeaders.llm}</span>
              <span className="text-center">{messages.pipelinePage.stageHeaders.sql}</span>
              <span className="text-center">{messages.pipelinePage.stageHeaders.vector}</span>
              <span className="text-center">{messages.pipelinePage.stageHeaders.brief}</span>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[760px]">
                {initialData.rules.map((rule) => (
                  <details key={rule.id} className="border-b border-border last:border-b-0">
                    <summary className="grid cursor-pointer grid-cols-[120px_160px_minmax(220px,1fr)_52px_52px_52px_52px] gap-3 px-4 py-3 text-sm hover:bg-surface-subtle dark:hover:bg-surface-muted">
                      <span className="text-muted">{rule.sourceLabel}</span>
                      <span className="font-semibold text-foreground">{rule.documentType}</span>
                      <span className="text-muted">{rule.policyLabel}</span>
                      <StageIndicator enabled={rule.llmEnabled} />
                      <StageIndicator enabled={rule.sqlEnabled} />
                      <StageIndicator enabled={rule.vectorEnabled} />
                      <StageIndicator enabled={rule.briefEnabled} />
                    </summary>
                    <div className="grid gap-4 bg-surface-subtle px-4 py-4 md:grid-cols-2 xl:grid-cols-3">
                      {rule.detailFields.map((field) => (
                        <div key={`${rule.id}-${field.label}`}>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                            {field.label}
                          </p>
                          <p className="mt-1 text-sm text-foreground">{field.value}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </CatalogCard>
        </section>

        <section className="mt-7">
          <div className="mb-3">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-muted">
              {labels.sectionTitles.runs}
            </h2>
            <p className="mt-[3px] text-[12px] text-muted">
              {labels.sectionDescriptions.runs}
            </p>
          </div>
          <CatalogCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-[12.5px]">
                <thead>
                  <tr className="border-b border-border bg-surface-subtle">
                    {messages.pipelinePage.tableHeaders.map((header) => (
                      <th
                        key={header}
                        className="whitespace-nowrap px-[18px] py-[9px] text-left text-[10px] font-bold uppercase tracking-[0.07em] text-muted"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {initialData.runs.map((run) => (
                    <PipelineRunRow key={run.id} run={run} />
                  ))}
                </tbody>
              </table>
            </div>
          </CatalogCard>
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

function StageIndicator({ enabled }: Readonly<{ enabled: boolean }>) {
  const { t } = useUiI18n();

  return (
    <span className="flex justify-center">
      <span
        className={cx(
          "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
          enabled ? stageEnabledClasses : stageDisabledClasses,
        )}
      >
        {enabled ? t("pipelinePage.okLabel", "OK") : "-"}
      </span>
    </span>
  );
}

function PipelineRunRow({ run }: Readonly<{ run: PipelineRun }>) {
  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="px-[18px] py-[10px] text-muted">{run.timeLabel}</td>
      <td className="px-[18px] py-[10px] font-medium text-foreground">{run.sourceLabel}</td>
      <td className="px-[18px] py-[10px] text-foreground">{run.documentType}</td>
      <td className="px-[18px] py-[10px] text-foreground">{run.recordsLabel}</td>
      <td className="px-[18px] py-[10px]">
        <span
          className={cx(
            "inline-flex rounded-[4px] px-2 py-[2px] text-[11px] font-bold",
            outcomeToneClasses[run.outcomeTone],
          )}
        >
          {run.outcomeLabel}
        </span>
      </td>
      <td className="px-[18px] py-[10px] font-mono text-green-700 dark:text-emerald-300">{run.confidenceLabel}</td>
      <td className="px-[18px] py-[10px] text-muted">{run.durationLabel}</td>
    </tr>
  );
}
