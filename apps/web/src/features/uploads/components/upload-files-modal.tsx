"use client";

import { useRef, useState } from "react";

import { CatalogModalOverlay } from "@/features/catalog/components/catalog-dialogs";
import { CatalogButton, cx } from "@/features/catalog/components/catalog-primitives";
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
  isDuplicate?: boolean;
}>;

export function UploadFilesModal({
  onClose,
  onSuccess,
  orgId,
}: UploadFilesModalProps) {
  const { t } = useUiI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [resultDocumentId, setResultDocumentId] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  function acceptFile(nextFile: File) {
    setFile(nextFile);
    setStatus("idle");
    setErrorMessage(null);
    setResultDocumentId(null);
    setIsDuplicate(false);
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
        throw new Error(payload.error ?? t("uploadModal.uploadFailed", "Upload failed."));
      }

      setResultDocumentId(payload.documentId ?? null);
      setIsDuplicate(payload.isDuplicate === true);
      setStatus("success");
      onSuccess?.(payload.documentId ?? "");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t("uploadModal.uploadFailed", "Upload failed."),
      );
    }
  }

  const isSuccess = status === "success";
  const isUploading = status === "uploading";

  return (
    <CatalogModalOverlay>
      <DialogFrame
        description={
          isSuccess
            ? isDuplicate
              ? t(
                  "uploadModal.duplicateDescription",
                  "This file was already uploaded. The existing record has been refreshed.",
                )
              : t(
                  "uploadModal.fileQueuedDescription",
                  "File uploaded and queued for processing.",
                )
            : t(
                "uploadModal.acceptsDescription",
                "Accepts CSV and XLSX files up to 20 MB.",
              )
        }
        footer={
          isSuccess ? (
            <CatalogButton onClick={onClose} variant="primary">
              {t("uploadModal.done", "Done")}
            </CatalogButton>
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
                {isUploading
                  ? t("uploadModal.uploading", "Uploading...")
                  : t("uploadModal.upload", "Upload")}
              </CatalogButton>
            </>
          )
        }
        onClose={onClose}
        title={t("uploadModal.title", "Upload files")}
      >
        {isSuccess ? (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(34,197,94,.12)] text-[18px] font-bold text-green-400">
              OK
            </span>
            <p className="text-[13px] font-semibold text-foreground">{file?.name}</p>
            {resultDocumentId ? (
              <p className="text-[11px] text-muted">
                Document ID:{" "}
                <code className="rounded bg-surface-muted px-1 font-mono text-[10.5px]">
                  {resultDocumentId}
                </code>
              </p>
            ) : null}
            {isDuplicate ? (
              <p className="text-[11.5px] text-amber-600 dark:text-amber-300">
                {t(
                  "uploadModal.duplicateNotice",
                  "Duplicate detected - existing document updated.",
                )}
              </p>
            ) : null}
          </div>
        ) : (
          <>
            <div
              aria-describedby="upload-files-hint"
              className={cx(
                "flex cursor-pointer flex-col items-center gap-2 rounded-[10px] border-2 border-dashed px-4 py-6 text-center transition-colors",
                dragging
                  ? "border-accent bg-accent/[0.06]"
                  : "border-border hover:border-accent/40 hover:bg-surface-subtle",
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
                {file?.name ?? t("uploadModal.uploadPrompt", "Drop a file here or click to browse")}
              </p>
              {file ? (
                <p className="text-[11px] text-muted">
                  {(file.size / 1024).toFixed(0)} KB -{" "}
                  {file.type || t("uploadModal.fileTypeFallback", "unknown type")}
                </p>
              ) : (
                <p className="text-[11px] text-muted" id="upload-files-hint">
                  {t("uploadModal.uploadTypes", "CSV - XLSX - up to 20 MB")}
                </p>
              )}
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

            {status === "error" && errorMessage ? (
              <p
                aria-live="polite"
                className="rounded-[8px] bg-red-50 px-3 py-2 text-[12px] text-red-600 dark:bg-rose-500/10 dark:text-rose-300"
              >
                {errorMessage}
              </p>
            ) : null}
          </>
        )}
      </DialogFrame>
    </CatalogModalOverlay>
  );
}
