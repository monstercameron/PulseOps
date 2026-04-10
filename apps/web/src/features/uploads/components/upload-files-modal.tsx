"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { CatalogModalOverlay } from "@/features/catalog/components/catalog-dialogs";
import {
  CatalogButton,
  ConfidenceMeter,
  StatusBadge,
  cx,
} from "@/features/catalog/components/catalog-primitives";
import { DialogFrame } from "@/features/catalog/components/settings-catalog-blocks";
import { type SupportedDocumentFamilyId } from "@/features/foundation/domain/document-families";
import { useUiI18n } from "@/features/i18n/components/ui-i18n-provider";
import {
  getUiDocumentFamilyDescription,
  getUiDocumentFamilyLabel,
} from "@/features/i18n/lib/data-labels";

type UploadStatus = "error" | "idle" | "success" | "uploading";

type UploadFilesModalProps = Readonly<{
  onClose: () => void;
  onSuccess?: (documentId: string) => void;
  orgId: string;
}>;

type UploadApiResponse = Readonly<{
  classificationConfidenceScore?: number | null;
  detectedFormat?: string;
  documentId?: string;
  error?: string;
  errorCode?: string;
  errorHelp?: string;
  errorTitle?: string;
  ingestionEventId?: string;
  ingestionJobId?: string;
  isDuplicate?: boolean;
  materializedFactCount?: number | null;
  nextAction?: "explorer" | "pipeline" | null;
  parserRoute?: "tabular" | "text" | null;
  processedStatus?: string | null;
  retainSourceFile?: boolean | null;
  reviewState?: "duplicate" | "processing" | "ready" | "received" | null;
  status?: string | null;
  suggestedDocumentFamily?: SupportedDocumentFamilyId | null;
}>;

type UploadOutcome = Readonly<{
  classificationConfidenceScore: number | null;
  detectedFormat: string | null;
  documentId: string | null;
  isDuplicate: boolean;
  materializedFactCount: number | null;
  nextAction: "explorer" | "pipeline" | null;
  parserRoute: "tabular" | "text" | null;
  processedStatus: string | null;
  retainSourceFile: boolean | null;
  reviewState: "duplicate" | "processing" | "ready" | "received" | null;
  status: string | null;
  suggestedDocumentFamily: SupportedDocumentFamilyId | null;
}>;

type UploadProgressStep = Readonly<{
  description: string;
  state: "active" | "complete" | "pending";
  title: string;
}>;

type UploadResultSummary = Readonly<{
  description: string;
  primaryActionLabel: string;
  primaryActionTarget: "explorer" | "pipeline";
  title: string;
  tone: "info" | "success" | "warning";
}>;

type UploadRule = Readonly<{
  extension: "csv" | "xlsx";
  maxBytes: number;
  maxSizeLabel: string;
}>;

type UploadFamilyReadout = Readonly<{
  description: string;
  familyDescription: string | null;
  familyLabel: string | null;
  isRecognized: boolean;
}>;

const uploadRules: readonly UploadRule[] = [
  {
    extension: "csv",
    maxBytes: 5 * 1024 * 1024,
    maxSizeLabel: "5 MB",
  },
  {
    extension: "xlsx",
    maxBytes: 20 * 1024 * 1024,
    maxSizeLabel: "20 MB",
  },
] as const;

const featuredUploadFamilyIds = [
  "customer-invoice",
  "vendor-bill",
  "job-cost-report",
] as const satisfies readonly SupportedDocumentFamilyId[];

export function UploadFilesModal({
  onClose,
  onSuccess,
  orgId,
}: UploadFilesModalProps) {
  const { locale, messages, t } = useUiI18n();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorHelpMessage, setErrorHelpMessage] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<UploadOutcome | null>(null);

  function acceptFile(nextFile: File) {
    const nextValidationMessage = validateUploadFile(nextFile, t);

    setFile(nextFile);
    setStatus("idle");
    setErrorMessage(null);
    setErrorHelpMessage(null);
    setErrorTitle(null);
    setValidationMessage(nextValidationMessage);
    setResult(null);
  }

  function resetForAnotherUpload() {
    setFile(null);
    setStatus("idle");
    setErrorMessage(null);
    setErrorHelpMessage(null);
    setErrorTitle(null);
    setValidationMessage(null);
    setDragging(false);
    setResult(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleUpload() {
    if (!file || status === "uploading") {
      return;
    }

    setStatus("uploading");
    setErrorMessage(null);
    setErrorHelpMessage(null);
    setErrorTitle(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("orgId", orgId);

      const response = await fetch("/api/ingest/upload", {
        body: formData,
        method: "POST",
      });
      const payload = (await response.json()) as UploadApiResponse;

      if (!response.ok || typeof payload.error === "string") {
        setStatus("error");
        setErrorMessage(
          payload.error ?? t("uploadModal.uploadFailed", "Upload failed."),
        );
        setErrorHelpMessage(payload.errorHelp ?? null);
        setErrorTitle(payload.errorTitle ?? null);
        return;
      }

      const nextResult = {
        classificationConfidenceScore:
          payload.classificationConfidenceScore ?? null,
        detectedFormat: payload.detectedFormat ?? null,
        documentId: payload.documentId ?? null,
        isDuplicate: payload.isDuplicate === true,
        materializedFactCount: payload.materializedFactCount ?? null,
        nextAction: payload.nextAction ?? null,
        parserRoute: payload.parserRoute ?? null,
        processedStatus: payload.processedStatus ?? null,
        retainSourceFile: payload.retainSourceFile ?? null,
        reviewState: payload.reviewState ?? null,
        status: payload.status ?? null,
        suggestedDocumentFamily: payload.suggestedDocumentFamily ?? null,
      } satisfies UploadOutcome;

      setResult(nextResult);
      setStatus("success");

      if (payload.documentId) {
        onSuccess?.(payload.documentId);
      }
    } catch (error) {
      setStatus("error");
      setErrorTitle(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t("uploadModal.uploadFailed", "Upload failed."),
      );
      setErrorHelpMessage(null);
    }
  }

  function handlePrimarySuccessAction() {
    if (result === null) {
      onClose();
      return;
    }

    const summary = buildUploadResultSummary(result, t);

    if (summary.primaryActionTarget === "explorer" && result.documentId) {
      router.push(`/explorer?documentId=${encodeURIComponent(result.documentId)}`);
      onClose();
      return;
    }

    router.push("/pipeline");
    onClose();
  }

  function handleSecondarySuccessAction() {
    router.push("/pipeline");
    onClose();
  }

  const isSuccess = status === "success" && result !== null;
  const isUploading = status === "uploading";
  const selectedUploadRule =
    file === null ? null : getUploadRuleForFileName(file.name);
  const canUpload = file !== null && validationMessage === null && !isUploading;
  const activeMessage = validationMessage ?? errorMessage;
  const activeMessageTitle =
    validationMessage !== null
      ? t("uploadModal.validationTitle", "This file needs attention")
      : (errorTitle ??
        t("uploadModal.errorTitle", "We couldn't finish that upload"));
  const activeHelpMessage =
    validationMessage !== null
      ? t(
          "uploadModal.validationRecoveryHelp",
          "Choose a different file and then try again.",
        )
      : (errorHelpMessage ??
        t(
          "uploadModal.errorHelp",
          "Choose a different file or try again.",
        ));
  const progressSteps = buildUploadProgressSteps({
    isUploading,
    result,
    t,
  });
  const resultSummary =
    result === null ? null : buildUploadResultSummary(result, t);
  const typeReadout =
    result === null
      ? null
      : buildUploadFamilyReadout({
          messages,
          result,
          t,
        });
  const featuredUploadFamilies = featuredUploadFamilyIds.map((familyId) => ({
    description: getUiDocumentFamilyDescription(messages, familyId),
    id: familyId,
    label: getUiDocumentFamilyLabel(messages, familyId),
  }));
  const dialogDescription =
    isSuccess && result !== null
      ? buildUploadDialogDescription(result, t)
      : t(
          "uploadModal.acceptsDescription",
          "Accepts CSV and XLSX files. CSV can be up to 5 MB and XLSX can be up to 20 MB.",
        );

  return (
    <CatalogModalOverlay>
      <DialogFrame
        className="max-w-[52rem]"
        description={dialogDescription}
        footer={
          isSuccess ? (
            <div className="flex w-full flex-wrap items-center justify-end gap-2">
              <CatalogButton onClick={resetForAnotherUpload} variant="ghost">
                {t("uploadModal.uploadAnother", "Upload another")}
              </CatalogButton>
              <CatalogButton
                onClick={handleSecondarySuccessAction}
                variant="secondary"
              >
                {t("uploadModal.openPipeline", "Open Pipeline")}
              </CatalogButton>
              <CatalogButton
                onClick={handlePrimarySuccessAction}
                variant="primary"
              >
                {resultSummary?.primaryActionLabel ??
                  t("uploadModal.done", "Done")}
              </CatalogButton>
            </div>
          ) : (
            <>
              <CatalogButton onClick={onClose} variant="secondary">
                {t("uploadModal.cancel", "Cancel")}
              </CatalogButton>
              <CatalogButton
                disabled={!canUpload}
                onClick={() => void handleUpload()}
                variant="primary"
              >
                {isUploading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0d1b2a]/25 border-t-[#0d1b2a]" />
                    {t("uploadModal.uploading", "Uploading...")}
                  </span>
                ) : (
                  t("uploadModal.upload", "Upload")
                )}
              </CatalogButton>
            </>
          )
        }
        onClose={onClose}
        title={t("uploadModal.title", "Upload files")}
      >
        {isSuccess ? (
          <div aria-live="polite" className="space-y-4 py-1">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(34,197,94,.12)] text-[18px] font-bold text-green-400">
                {t("uploadModal.uploadedBadge", "OK")}
              </span>
              <div className="space-y-2">
                <StatusBadge
                  label={
                    resultSummary?.title ??
                    t("uploadModal.readyToReview", "Ready to review")
                  }
                  tone={resultSummary?.tone ?? "success"}
                />
                <p className="text-[13px] font-semibold text-foreground">
                  {file?.name}
                </p>
              </div>
              {result?.documentId ? (
                <p className="text-[11px] text-muted">
                  {t("uploadModal.documentIdLabel", "Document ID")}:{" "}
                  <code className="rounded bg-surface-muted px-1 font-mono text-[10.5px]">
                    {result.documentId}
                  </code>
                </p>
              ) : null}
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1.12fr)_minmax(18rem,0.88fr)]">
              <div className="rounded-[10px] border border-border bg-surface-subtle px-4 py-3">
                <p className="text-[12.5px] font-semibold text-foreground">
                  {resultSummary?.title}
                </p>
                <p className="mt-1 text-[12px] leading-[1.55] text-muted">
                  {resultSummary?.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {result?.detectedFormat ? (
                    <UploadMetaChip label={result.detectedFormat.toUpperCase()} />
                  ) : null}
                  {result?.parserRoute ? (
                    <UploadMetaChip
                      label={formatParserRouteChipLabel(result.parserRoute, t)}
                      tone="info"
                    />
                  ) : null}
                  {typeof result?.retainSourceFile === "boolean" ? (
                    <UploadMetaChip
                      label={
                        result.retainSourceFile
                          ? t(
                              "uploadModal.sourceRetainedTag",
                              "Stored for download",
                            )
                          : t(
                              "uploadModal.sourceNotRetainedTag",
                              "Metadata only",
                            )
                      }
                      tone={result.retainSourceFile ? "success" : "neutral"}
                    />
                  ) : null}
                  <UploadMetaChip
                    label={`${t("uploadModal.nextStepLabel", "Next step")}: ${
                      resultSummary?.primaryActionLabel ??
                      t("uploadModal.done", "Done")
                    }`}
                    tone="info"
                  />
                  {typeof result?.materializedFactCount === "number" &&
                  result.materializedFactCount > 0 ? (
                    <UploadMetaChip
                      label={t(
                        "uploadModal.factsFoundLabel",
                        "{{count}} facts found",
                        { count: result.materializedFactCount },
                      )}
                      tone="success"
                    />
                  ) : null}
                  {result?.isDuplicate ? (
                    <UploadMetaChip
                      label={t(
                        "uploadModal.duplicateTag",
                        "Existing record reused",
                      )}
                      tone="warning"
                    />
                  ) : null}
                </div>
              </div>

              <div className="rounded-[10px] border border-border bg-card px-4 py-3">
                <p className="text-[12.5px] font-semibold text-foreground">
                  {t("uploadModal.importReadoutHeading", "Import readout")}
                </p>
                <div className="mt-3 space-y-3">
                  <div className="space-y-2">
                    <StatusBadge
                      label={
                        typeReadout?.isRecognized
                          ? (typeReadout.familyLabel ??
                            t(
                              "uploadModal.familyPendingBadge",
                              "Type still settling",
                            ))
                          : t(
                              "uploadModal.familyPendingBadge",
                              "Type still settling",
                            )
                      }
                      tone={typeReadout?.isRecognized ? "info" : "warning"}
                    />
                    <p className="text-[12px] leading-[1.55] text-muted">
                      {typeReadout?.description}
                    </p>
                    {typeReadout?.familyDescription ? (
                      <p className="text-[12px] leading-[1.55] text-foreground">
                        {typeReadout.familyDescription}
                      </p>
                    ) : null}
                  </div>
                  {typeof result?.classificationConfidenceScore === "number" ? (
                    <div className="rounded-[10px] border border-border bg-surface-subtle px-3 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
                        {t(
                          "uploadModal.familyConfidenceLabel",
                          "Recognition confidence",
                        )}
                      </p>
                      <div className="mt-2">
                        <ConfidenceMeter locale={locale} value={result.classificationConfidenceScore} />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-2 rounded-[10px] border border-border bg-card px-4 py-3">
              {progressSteps.map((step) => (
                <div
                  key={step.title}
                  className="flex items-start gap-3"
                >
                  <span
                    className={cx(
                      "mt-[2px] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      step.state === "complete"
                        ? "bg-green-50 text-green-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : step.state === "active"
                          ? "bg-accent/15 text-accent"
                          : "bg-surface-muted text-muted",
                    )}
                  >
                    {step.state === "complete" ? "OK" : step.state === "active" ? "..." : "-"}
                  </span>
                  <div>
                    <p className="text-[12px] font-semibold text-foreground">
                      {step.title}
                    </p>
                    <p className="text-[11.5px] leading-[1.5] text-muted">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              aria-busy={isUploading}
              aria-describedby="upload-files-hint"
              className={cx(
                "flex cursor-pointer flex-col items-center gap-2 rounded-[10px] border-2 border-dashed px-4 py-6 text-center transition-colors",
                dragging
                  ? "border-accent bg-accent/[0.06]"
                  : "border-border hover:border-accent/40 hover:bg-surface-subtle",
                isUploading && "pointer-events-none opacity-80",
              )}
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onDragLeave={() => setDragging(false)}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const droppedFile = event.dataTransfer.files[0];

                if (droppedFile) {
                  acceptFile(droppedFile);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  inputRef.current?.click();
                }
              }}
            >
              <svg
                className="text-muted"
                fill="none"
                height="28"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                width="28"
              >
                <path d="M12 13V4M8 8l4-4 4 4" />
                <path d="M20 17v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2" />
              </svg>
              <p className="text-[13px] font-semibold text-foreground">
                {file?.name ??
                  t(
                    "uploadModal.uploadPrompt",
                    "Drop a file here or click to browse",
                  )}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {file === null ? (
                  <>
                    <UploadMetaChip
                      label={t("uploadModal.csvRule", "CSV up to 5 MB")}
                    />
                    <UploadMetaChip
                      label={t("uploadModal.xlsxRule", "XLSX up to 20 MB")}
                    />
                    <UploadMetaChip
                      label={t("uploadModal.manualQueueTag", "Manual review queue")}
                    />
                  </>
                ) : (
                  <>
                    {selectedUploadRule ? (
                      <UploadMetaChip
                        label={selectedUploadRule.extension.toUpperCase()}
                      />
                    ) : null}
                    <UploadMetaChip label={formatUploadFileSize(file.size)} />
                    <UploadMetaChip
                      label={
                        validationMessage
                          ? t(
                              "uploadModal.needsDifferentFileTag",
                              "Needs a different file",
                            )
                          : t("uploadModal.readyToSendTag", "Ready to upload")
                      }
                      tone={validationMessage ? "warning" : "success"}
                    />
                  </>
                )}
              </div>
              {file ? (
                <div className="space-y-1">
                  <p className="text-[11px] text-muted">
                    {(file.size / 1024).toFixed(0)} KB -{" "}
                    {file.type || t("uploadModal.fileTypeFallback", "unknown type")}
                  </p>
                  <button
                    className="text-[11.5px] font-semibold text-accent transition hover:opacity-80"
                    onClick={(event) => {
                      event.stopPropagation();
                      inputRef.current?.click();
                    }}
                    type="button"
                  >
                    {t("uploadModal.changeFile", "Choose a different file")}
                  </button>
                </div>
              ) : (
                  <p className="text-[11px] text-muted" id="upload-files-hint">
                  {t("uploadModal.uploadTypes", "CSV - XLSX - up to 20 MB")}
                </p>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1.12fr)_minmax(18rem,0.88fr)]">
              <div
                aria-live={file ? "polite" : undefined}
                className="rounded-[10px] border border-border bg-surface-subtle px-4 py-3"
              >
                <p className="text-[12px] font-semibold text-foreground">
                  {isUploading
                    ? t(
                        "uploadModal.uploadingTitle",
                        "Working on your file now",
                      )
                    : file
                      ? t(
                          "uploadModal.beforeUploadTitle",
                          "What happens after you click upload",
                        )
                      : t(
                          "uploadModal.pathOverviewTitle",
                          "What this upload path does",
                        )}
                </p>
                <div className="mt-3 grid gap-2">
                  {progressSteps.map((step, index) => (
                    <div key={step.title} className="flex items-start gap-3">
                      <span
                        className={cx(
                          "mt-[2px] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                          step.state === "complete"
                            ? "bg-green-50 text-green-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                            : step.state === "active"
                              ? "bg-accent/15 text-accent"
                              : "bg-surface-muted text-muted",
                        )}
                      >
                        {step.state === "complete"
                          ? "OK"
                          : step.state === "active"
                            ? "..."
                            : String(index + 1)}
                      </span>
                      <div>
                        <p className="text-[11.5px] font-semibold text-foreground">
                          {step.title}
                        </p>
                        <p className="text-[11px] leading-[1.5] text-muted">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {isUploading ? (
                  <p className="mt-3 text-[11px] leading-[1.5] text-muted">
                    {t(
                      "uploadModal.uploadingHint",
                      "This can take a little longer for larger files. Keep this window open while we finish checking it.",
                    )}
                  </p>
                ) : validationMessage ? (
                  <p className="mt-3 text-[11px] leading-[1.5] text-muted">
                    {t(
                      "uploadModal.validationHint",
                      "Pick a file that matches the rules above, then upload when you're ready.",
                    )}
                  </p>
                ) : (
                  <p className="mt-3 text-[11px] leading-[1.5] text-muted">
                    {t(
                      "uploadModal.pathOverviewDescription",
                      "Files on this path are saved, checked, and then prepared for review in Explorer or Pipeline.",
                    )}
                  </p>
                )}
              </div>

              <div className="rounded-[10px] border border-border bg-card px-4 py-3">
                <p className="text-[12px] font-semibold text-foreground">
                  {t(
                    "uploadModal.recognizedTypesHeading",
                    "Recognized document types",
                  )}
                </p>
                <p className="mt-1 text-[11.5px] leading-[1.5] text-muted">
                  {t(
                    "uploadModal.recognizedTypesDescription",
                    "This importer can recognize clean business exports and route them into the right review experience.",
                  )}
                </p>
                <div className="mt-3 space-y-2.5">
                  {featuredUploadFamilies.map((family) => (
                    <div
                      key={family.id}
                      className="rounded-[10px] border border-border bg-surface-subtle px-3 py-3"
                    >
                      <p className="text-[11.5px] font-semibold text-foreground">
                        {family.label}
                      </p>
                      <p className="mt-1 text-[11px] leading-[1.5] text-muted">
                        {family.description}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-[10px] border border-border bg-surface-subtle px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
                    {t(
                      "uploadModal.bestResultsHeading",
                      "Best results on this path",
                    )}
                  </p>
                  <div className="mt-2 space-y-2 text-[11.5px] leading-[1.5] text-foreground">
                    <p>{t("uploadModal.bestResultsTipOne", "Upload one export per file.")}</p>
                    <p>{t("uploadModal.bestResultsTipTwo", "Keep the header row at the top of the sheet.")}</p>
                    <p>{t("uploadModal.bestResultsTipThree", "Use separate columns for dates, amounts, and IDs.")}</p>
                  </div>
                </div>
              </div>
            </div>

            <label className="sr-only" htmlFor="upload-files-input">
              {t("uploadModal.title", "Upload files")}
            </label>
            <input
              ref={inputRef}
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              id="upload-files-input"
              type="file"
              onChange={(event) => {
                const nextFile = event.target.files?.[0];

                if (nextFile) {
                  acceptFile(nextFile);
                }
              }}
            />

            {activeMessage ? (
              <div
                aria-live="assertive"
                className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-3 text-red-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                role="alert"
              >
                <p className="text-[12px] font-semibold">
                  {activeMessageTitle}
                </p>
                <p className="mt-1 text-[12px] leading-[1.55]">
                  {activeMessage}
                </p>
                <p className="mt-2 text-[11px] leading-[1.5] text-red-600/90 dark:text-rose-200/85">
                  {activeHelpMessage}
                </p>
              </div>
            ) : null}
          </div>
        )}
      </DialogFrame>
    </CatalogModalOverlay>
  );
}

function UploadMetaChip({
  label,
  tone = "neutral",
}: Readonly<{
  label: string;
  tone?: "info" | "neutral" | "success" | "warning";
}>) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.05em]",
        tone === "success"
          ? "bg-green-50 text-green-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          : tone === "warning"
            ? "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
            : tone === "info"
              ? "bg-accent/15 text-accent"
              : "bg-surface-muted text-muted",
      )}
    >
      {label}
    </span>
  );
}

function buildUploadProgressSteps(input: Readonly<{
  isUploading: boolean;
  result: UploadOutcome | null;
  t: (
    key: string,
    fallback: string,
    values?: Readonly<Record<string, boolean | number | string>>,
  ) => string;
}>): UploadProgressStep[] {
  if (input.result !== null) {
    return [
      {
        description: input.t(
          "uploadModal.stepSavedDone",
          "Your file is in the workspace.",
        ),
        state: "complete",
        title: input.t("uploadModal.stepSaved", "Saved your file"),
      },
      {
        description: input.t(
          "uploadModal.stepCheckedDone",
          "We made sure the file opened correctly.",
        ),
        state: "complete",
        title: input.t("uploadModal.stepChecked", "Checked the file"),
      },
      {
        description: buildUploadPreparedStepDescription(input.result, input.t),
        state: "complete",
        title: input.t(
          "uploadModal.stepPrepared",
          "Prepared the file for review",
        ),
      },
    ];
  }

  return [
    {
      description: input.t(
        "uploadModal.stepSavedPending",
        "We save the file to your workspace first.",
      ),
      state: input.isUploading ? "complete" : "pending",
      title: input.t("uploadModal.stepSaved", "Saved your file"),
    },
    {
      description: input.t(
        "uploadModal.stepCheckedPending",
        "We make sure the file opens and matches what you selected.",
      ),
      state: input.isUploading ? "active" : "pending",
      title: input.t("uploadModal.stepChecked", "Checked the file"),
    },
    {
      description: input.t(
        "uploadModal.stepPreparedPending",
        "We organize it so it is easy to review in the app.",
      ),
      state: "pending",
      title: input.t(
        "uploadModal.stepPrepared",
        "Prepared the file for review",
      ),
    },
  ];
}

function buildUploadResultSummary(
  result: UploadOutcome,
  t: (
    key: string,
    fallback: string,
    values?: Readonly<Record<string, boolean | number | string>>,
  ) => string,
): UploadResultSummary {
  const reviewState = getUploadReviewState(result);
  const nextAction = result.nextAction;

  if (reviewState === "duplicate") {
    return {
      description: t(
        "uploadModal.duplicateDescriptionLong",
        "This exact file was already in the workspace, so we kept the existing record instead of creating a second copy.",
      ),
      primaryActionLabel: t("uploadModal.reviewFile", "Review file"),
      primaryActionTarget: nextAction ?? "explorer",
      title: t("uploadModal.duplicateReadyTitle", "Already in workspace"),
      tone: "warning",
    };
  }

  if (reviewState === "ready") {
    return {
      description: t(
        "uploadModal.readyToReviewDescription",
        "The file finished processing and is ready to review in Explorer.",
      ),
      primaryActionLabel: t("uploadModal.reviewFile", "Review file"),
      primaryActionTarget: nextAction ?? "explorer",
      title: t("uploadModal.readyToReview", "Ready to review"),
      tone: "success",
    };
  }

  if (reviewState === "processing") {
    return {
      description: t(
        "uploadModal.stillProcessingDescription",
        "The file is in the workspace and we are still getting it ready for review. Open Pipeline to follow progress.",
      ),
      primaryActionLabel: t("uploadModal.followProgress", "Follow progress"),
      primaryActionTarget: nextAction ?? "pipeline",
      title: t("uploadModal.stillProcessing", "Still getting it ready"),
      tone: "info",
    };
  }

  return {
    description: t(
      "uploadModal.receivedDescription",
      "The file was received successfully. Open Pipeline if you want to follow it right away.",
    ),
    primaryActionLabel: t("uploadModal.followProgress", "Follow progress"),
    primaryActionTarget: nextAction ?? "pipeline",
    title: t("uploadModal.fileReceived", "File received"),
    tone: "info",
  };
}

function buildUploadDialogDescription(
  result: UploadOutcome,
  t: (
    key: string,
    fallback: string,
    values?: Readonly<Record<string, boolean | number | string>>,
  ) => string,
) {
  const reviewState = getUploadReviewState(result);

  if (reviewState === "duplicate") {
    return t(
      "uploadModal.duplicateDialogDescription",
      "Upload complete. We matched this file to the copy already in your workspace.",
    );
  }

  if (reviewState === "ready") {
    return t(
      "uploadModal.readyDialogDescription",
      "Upload complete. Your file is ready to review.",
    );
  }

  if (reviewState === "processing") {
    return t(
      "uploadModal.processingDialogDescription",
      "Upload complete. Your file is in the workspace and still being prepared.",
    );
  }

  return t(
    "uploadModal.fileQueuedDescription",
    "Upload complete. We're checking the file now.",
  );
}

function buildUploadPreparedStepDescription(
  result: UploadOutcome,
  t: (
    key: string,
    fallback: string,
    values?: Readonly<Record<string, boolean | number | string>>,
  ) => string,
) {
  const reviewState = getUploadReviewState(result);

  if (reviewState === "duplicate") {
    return t(
      "uploadModal.stepPreparedDuplicate",
      "We found the existing copy and linked this upload back to it.",
    );
  }

  if (reviewState === "ready") {
    return t(
      "uploadModal.stepPreparedReady",
      "The file is ready to review in Explorer.",
    );
  }

  if (reviewState === "processing") {
    return t(
      "uploadModal.stepPreparedProcessing",
      "The file is in the workspace and will keep moving through Pipeline.",
    );
  }

  return t(
    "uploadModal.stepPreparedReceived",
    "The file is in the workspace and ready for the next step.",
  );
}

function buildUploadFamilyReadout(input: Readonly<{
  messages: Parameters<typeof getUiDocumentFamilyLabel>[0];
  result: UploadOutcome;
  t: (
    key: string,
    fallback: string,
    values?: Readonly<Record<string, boolean | number | string>>,
  ) => string;
}>): UploadFamilyReadout {
  if (input.result.suggestedDocumentFamily !== null) {
    const familyLabel = getUiDocumentFamilyLabel(
      input.messages,
      input.result.suggestedDocumentFamily,
    );

    return {
      description: input.t(
        "uploadModal.familyRecognizedDescription",
        "We recognized this file as {{family}}.",
        {
          family: familyLabel,
        },
      ),
      familyDescription: getUiDocumentFamilyDescription(
        input.messages,
        input.result.suggestedDocumentFamily,
      ),
      familyLabel,
      isRecognized: true,
    };
  }

  const reviewState = getUploadReviewState(input.result);

  return {
    description:
      reviewState === "processing" || reviewState === "received"
        ? input.t(
            "uploadModal.familyPendingDescription",
            "The file is saved, but the document type is not locked in yet. Pipeline will keep moving it forward.",
          )
        : input.t(
            "uploadModal.familyUnrecognizedDescription",
            "The file imported cleanly, but it did not match a named document type yet.",
          ),
    familyDescription: null,
    familyLabel: null,
    isRecognized: false,
  };
}

function getNormalizedUploadStatus(result: UploadOutcome) {
  return (result.status ?? result.processedStatus ?? "").toLowerCase();
}

function getUploadReviewState(result: UploadOutcome) {
  if (result.reviewState !== null) {
    return result.reviewState;
  }

  const normalizedStatus = getNormalizedUploadStatus(result);

  if (
    result.isDuplicate ||
    normalizedStatus === "duplicate"
  ) {
    return "duplicate";
  }

  if (
    normalizedStatus === "completed" ||
    normalizedStatus === "extracted" ||
    (result.materializedFactCount ?? 0) > 0
  ) {
    return "ready";
  }

  if (
    normalizedStatus === "queued" ||
    normalizedStatus === "started" ||
    normalizedStatus === "parsing" ||
    normalizedStatus === "parsed" ||
    normalizedStatus === "classified" ||
    normalizedStatus === "extracting" ||
    normalizedStatus === "processing"
  ) {
    return "processing";
  }

  return "received";
}

function getUploadRuleForFileName(fileName: string): UploadRule | null {
  const extension = fileName.split(".").at(-1)?.toLowerCase();

  return uploadRules.find((rule) => rule.extension === extension) ?? null;
}

function validateUploadFile(
  file: File,
  t: (
    key: string,
    fallback: string,
    values?: Readonly<Record<string, boolean | number | string>>,
  ) => string,
) {
  const uploadRule = getUploadRuleForFileName(file.name);

  if (uploadRule === null) {
    return t(
      "uploadModal.unsupportedFileDescription",
      "Choose a CSV or XLSX file for this upload path.",
    );
  }

  if (file.size > uploadRule.maxBytes) {
    return t(
      "uploadModal.fileTooLargeDescription",
      "{{format}} files can be up to {{maxSize}} on this upload path.",
      {
        format: uploadRule.extension.toUpperCase(),
        maxSize: uploadRule.maxSizeLabel,
      },
    );
  }

  return null;
}

function formatUploadFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatParserRouteChipLabel(
  parserRoute: "tabular" | "text",
  t: (
    key: string,
    fallback: string,
    values?: Readonly<Record<string, boolean | number | string>>,
  ) => string,
) {
  return parserRoute === "tabular"
    ? t("uploadModal.tabularRouteTag", "Tabular review path")
    : t("uploadModal.textRouteTag", "Text review path");
}
