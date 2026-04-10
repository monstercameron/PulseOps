"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { CatalogModalOverlay } from "@/features/catalog/components/catalog-dialogs";
import {
  CatalogButton,
  StatusBadge,
  cx,
} from "@/features/catalog/components/catalog-primitives";
import { DialogFrame } from "@/features/catalog/components/settings-catalog-blocks";
import { useUiI18n } from "@/features/i18n/components/ui-i18n-provider";

type UploadStatus = "error" | "idle" | "success" | "uploading";

type UploadFilesModalProps = Readonly<{
  onClose: () => void;
  onSuccess?: (documentId: string) => void;
  orgId: string;
}>;

type UploadApiResponse = Readonly<{
  documentId?: string;
  error?: string;
  ingestionEventId?: string;
  ingestionJobId?: string;
  isDuplicate?: boolean;
  materializedFactCount?: number | null;
  processedStatus?: string | null;
  status?: string | null;
}>;

type UploadOutcome = Readonly<{
  documentId: string | null;
  isDuplicate: boolean;
  materializedFactCount: number | null;
  processedStatus: string | null;
  status: string | null;
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

export function UploadFilesModal({
  onClose,
  onSuccess,
  orgId,
}: UploadFilesModalProps) {
  const { t } = useUiI18n();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<UploadOutcome | null>(null);

  function acceptFile(nextFile: File) {
    setFile(nextFile);
    setStatus("idle");
    setErrorMessage(null);
    setResult(null);
  }

  function resetForAnotherUpload() {
    setFile(null);
    setStatus("idle");
    setErrorMessage(null);
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
        throw new Error(
          payload.error ?? t("uploadModal.uploadFailed", "Upload failed."),
        );
      }

      const nextResult = {
        documentId: payload.documentId ?? null,
        isDuplicate: payload.isDuplicate === true,
        materializedFactCount: payload.materializedFactCount ?? null,
        processedStatus: payload.processedStatus ?? null,
        status: payload.status ?? null,
      } satisfies UploadOutcome;

      setResult(nextResult);
      setStatus("success");

      if (payload.documentId) {
        onSuccess?.(payload.documentId);
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t("uploadModal.uploadFailed", "Upload failed."),
      );
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
  const progressSteps = buildUploadProgressSteps({
    isUploading,
    result,
    t,
  });
  const resultSummary =
    result === null ? null : buildUploadResultSummary(result, t);

  return (
    <CatalogModalOverlay>
      <DialogFrame
        description={
          isSuccess
            ? resultSummary?.description ??
              t(
                "uploadModal.fileQueuedDescription",
                "Upload complete. We're checking the file now.",
              )
            : t(
                "uploadModal.acceptsDescription",
                "Accepts CSV, XLSX, and PDF files up to 20 MB.",
              )
        }
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
                disabled={!file || isUploading}
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

            <div className="rounded-[10px] border border-border bg-surface-subtle px-4 py-3">
              <p className="text-[12.5px] font-semibold text-foreground">
                {resultSummary?.title}
              </p>
              <p className="mt-1 text-[12px] leading-[1.55] text-muted">
                {resultSummary?.description}
              </p>
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
                  {t("uploadModal.uploadTypes", "CSV - XLSX - PDF - up to 20 MB")}
                </p>
              )}
            </div>

            {file ? (
              <div
                aria-live="polite"
                className="rounded-[10px] border border-border bg-surface-subtle px-4 py-3"
              >
                <p className="text-[12px] font-semibold text-foreground">
                  {isUploading
                    ? t(
                        "uploadModal.uploadingTitle",
                        "Working on your file now",
                      )
                    : t(
                        "uploadModal.beforeUploadTitle",
                        "What happens after you click upload",
                      )}
                </p>
                <div className="mt-3 grid gap-2">
                  {progressSteps.map((step) => (
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
                            : String(progressSteps.indexOf(step) + 1)}
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
                ) : null}
              </div>
            ) : null}

            <label className="sr-only" htmlFor="upload-files-input">
              {t("uploadModal.title", "Upload files")}
            </label>
            <input
              ref={inputRef}
              accept=".csv,.xlsx,.pdf,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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

            {status === "error" && errorMessage ? (
              <div
                aria-live="assertive"
                className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-3 text-red-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                role="alert"
              >
                <p className="text-[12px] font-semibold">
                  {t(
                    "uploadModal.errorTitle",
                    "We couldn't finish that upload",
                  )}
                </p>
                <p className="mt-1 text-[12px] leading-[1.55]">
                  {errorMessage}
                </p>
                <p className="mt-2 text-[11px] leading-[1.5] text-red-600/90 dark:text-rose-200/85">
                  {t(
                    "uploadModal.errorHelp",
                    "Choose a different file or try again.",
                  )}
                </p>
              </div>
            ) : null}
          </div>
        )}
      </DialogFrame>
    </CatalogModalOverlay>
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
    const resultSummary = buildUploadResultSummary(input.result, input.t);

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
        description: resultSummary.description,
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
  if (result.isDuplicate) {
    return {
      description: t(
        "uploadModal.duplicateDescriptionLong",
        "This exact file was already in the workspace, so we kept the existing record instead of creating a second copy.",
      ),
      primaryActionLabel: t("uploadModal.reviewFile", "Review file"),
      primaryActionTarget: "explorer",
      title: t("uploadModal.duplicateReadyTitle", "Already in workspace"),
      tone: "warning",
    };
  }

  const normalizedStatus = (result.status ?? result.processedStatus ?? "").toLowerCase();
  const isReadyForReview =
    normalizedStatus === "completed" ||
    normalizedStatus === "extracted" ||
    (result.materializedFactCount ?? 0) > 0;

  if (isReadyForReview) {
    return {
      description: t(
        "uploadModal.readyToReviewDescription",
        "The file finished processing and is ready to review in Explorer.",
      ),
      primaryActionLabel: t("uploadModal.reviewFile", "Review file"),
      primaryActionTarget: "explorer",
      title: t("uploadModal.readyToReview", "Ready to review"),
      tone: "success",
    };
  }

  if (
    normalizedStatus === "parsed" ||
    normalizedStatus === "classified" ||
    normalizedStatus === "extracting"
  ) {
    return {
      description: t(
        "uploadModal.stillProcessingDescription",
        "The file is in the workspace and we are still getting it ready for review. Open Pipeline to follow progress.",
      ),
      primaryActionLabel: t("uploadModal.followProgress", "Follow progress"),
      primaryActionTarget: "pipeline",
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
    primaryActionTarget: "pipeline",
    title: t("uploadModal.fileReceived", "File received"),
    tone: "info",
  };
}
