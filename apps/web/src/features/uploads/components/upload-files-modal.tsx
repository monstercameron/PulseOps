"use client";

import { useRef, useState } from "react";

import { CatalogModalOverlay } from "@/features/catalog/components/catalog-dialogs";
import { CatalogButton, cx } from "@/features/catalog/components/catalog-primitives";
import { DialogFrame } from "@/features/catalog/components/settings-catalog-blocks";

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

export function UploadFilesModal({ onClose, onSuccess, orgId }: UploadFilesModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [resultDocumentId, setResultDocumentId] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  function acceptFile(f: File) {
    setFile(f);
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

      const res = await fetch("/api/ingest/upload", {
        body: formData,
        method: "POST",
      });
      const payload = (await res.json()) as UploadApiResponse;

      if (!res.ok || typeof payload.error === "string") {
        throw new Error(payload.error ?? "Upload failed.");
      }

      setResultDocumentId(payload.documentId ?? null);
      setIsDuplicate(payload.isDuplicate === true);
      setStatus("success");
      onSuccess?.(payload.documentId ?? "");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Upload failed.");
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
              ? "This file was already uploaded. The existing record has been refreshed."
              : "File uploaded and queued for processing."
            : "Accepts CSV and XLSX files up to 20 MB."
        }
        footer={
          isSuccess ? (
            <CatalogButton onClick={onClose} variant="primary">
              Done
            </CatalogButton>
          ) : (
            <>
              <CatalogButton onClick={onClose} variant="secondary">
                Cancel
              </CatalogButton>
              <CatalogButton
                disabled={!file || isUploading}
                onClick={() => void handleUpload()}
                variant="primary"
              >
                {isUploading ? "Uploading…" : "Upload"}
              </CatalogButton>
            </>
          )
        }
        onClose={onClose}
        title="Upload files"
      >
        {isSuccess ? (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(34,197,94,.12)] text-[18px] font-bold text-green-400">
              ✓
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
                Duplicate detected — existing document updated.
              </p>
            ) : null}
          </div>
        ) : (
          <>
            <div
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
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files[0];

                if (f) {
                  acceptFile(f);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
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
                {file ? file.name : "Drop a file here or click to browse"}
              </p>
              {file ? (
                <p className="text-[11px] text-muted">
                  {(file.size / 1024).toFixed(0)} KB · {file.type || "unknown type"}
                </p>
              ) : (
                <p className="text-[11px] text-muted">CSV · XLSX · up to 20 MB</p>
              )}
            </div>

            <input
              ref={inputRef}
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              type="file"
              onChange={(e) => {
                const f = e.target.files?.[0];

                if (f) {
                  acceptFile(f);
                }
              }}
            />

            {status === "error" && errorMessage ? (
              <p className="rounded-[8px] bg-red-50 px-3 py-2 text-[12px] text-red-600 dark:bg-rose-500/10 dark:text-rose-300">
                {errorMessage}
              </p>
            ) : null}
          </>
        )}
      </DialogFrame>
    </CatalogModalOverlay>
  );
}
