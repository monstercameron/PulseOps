import path from "node:path";

import { z } from "zod";

export const supportedDocumentFormatSchema = z.enum([
  "csv",
  "xlsx",
  "pdf",
  "docx",
  "txt",
  "html",
  "xml",
  "json",
]);

export type SupportedDocumentFormat = z.infer<
  typeof supportedDocumentFormatSchema
>;

export const parserRouteSchema = z.enum(["tabular", "text"]);
export type ParserRoute = z.infer<typeof parserRouteSchema>;

export const uploadRoutingResultSchema = z.object({
  detectedContentType: z.string().min(1),
  format: supportedDocumentFormatSchema,
  maxBytes: z.number().int().positive(),
  parserRoute: parserRouteSchema,
});

export type UploadRoutingResult = z.infer<typeof uploadRoutingResultSchema>;

type DocumentFormatPolicy = UploadRoutingResult & {
  redactionPolicyKey: string;
  requiresHumanReviewBeforeVector: boolean;
  vectorEligibility: "never" | "review" | "after-normalization";
  format: SupportedDocumentFormat;
};

const kibibyte = 1024;
const mebibyte = kibibyte * 1024;

const documentFormatPolicies = {
  csv: {
    detectedContentType: "text/csv",
    format: "csv",
    maxBytes: 5 * mebibyte,
    parserRoute: "tabular",
    redactionPolicyKey: "tabular-financial-export",
    requiresHumanReviewBeforeVector: false,
    vectorEligibility: "never",
  },
  docx: {
    detectedContentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    format: "docx",
    maxBytes: 15 * mebibyte,
    parserRoute: "text",
    redactionPolicyKey: "business-document-text",
    requiresHumanReviewBeforeVector: true,
    vectorEligibility: "review",
  },
  html: {
    detectedContentType: "text/html",
    format: "html",
    maxBytes: 2 * mebibyte,
    parserRoute: "text",
    redactionPolicyKey: "structured-web-export",
    requiresHumanReviewBeforeVector: true,
    vectorEligibility: "review",
  },
  json: {
    detectedContentType: "application/json",
    format: "json",
    maxBytes: 2 * mebibyte,
    parserRoute: "text",
    redactionPolicyKey: "machine-json-payload",
    requiresHumanReviewBeforeVector: false,
    vectorEligibility: "after-normalization",
  },
  pdf: {
    detectedContentType: "application/pdf",
    format: "pdf",
    maxBytes: 20 * mebibyte,
    parserRoute: "text",
    redactionPolicyKey: "business-pdf",
    requiresHumanReviewBeforeVector: true,
    vectorEligibility: "review",
  },
  txt: {
    detectedContentType: "text/plain",
    format: "txt",
    maxBytes: 2 * mebibyte,
    parserRoute: "text",
    redactionPolicyKey: "plain-text-upload",
    requiresHumanReviewBeforeVector: true,
    vectorEligibility: "review",
  },
  xlsx: {
    detectedContentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    format: "xlsx",
    maxBytes: 20 * mebibyte,
    parserRoute: "tabular",
    redactionPolicyKey: "tabular-financial-export",
    requiresHumanReviewBeforeVector: false,
    vectorEligibility: "never",
  },
  xml: {
    detectedContentType: "application/xml",
    format: "xml",
    maxBytes: 3 * mebibyte,
    parserRoute: "text",
    redactionPolicyKey: "structured-xml-payload",
    requiresHumanReviewBeforeVector: false,
    vectorEligibility: "after-normalization",
  },
} satisfies Record<SupportedDocumentFormat, DocumentFormatPolicy>;

export class UnsupportedUploadFormatError extends Error {
  readonly fileName: string;

  constructor(fileName: string) {
    super(
      `Unsupported upload extension: ${getFileExtension(fileName) ?? "unknown"}`,
    );
    this.fileName = fileName;
    this.name = "UnsupportedUploadFormatError";
  }
}

export class UploadFormatMismatchError extends Error {
  readonly expectedFormat: SupportedDocumentFormat;
  readonly fileName: string;
  readonly detectedFormat: SupportedDocumentFormat;

  constructor(input: {
    detectedFormat: SupportedDocumentFormat;
    expectedFormat: SupportedDocumentFormat;
    fileName: string;
  }) {
    super(
      `Upload extension does not match file contents: expected ${input.expectedFormat}, detected ${input.detectedFormat}.`,
    );
    this.detectedFormat = input.detectedFormat;
    this.expectedFormat = input.expectedFormat;
    this.fileName = input.fileName;
    this.name = "UploadFormatMismatchError";
  }
}

export class UploadSizeExceededError extends Error {
  readonly actualBytes: number;
  readonly fileName: string;
  readonly format: SupportedDocumentFormat;
  readonly maxBytes: number;

  constructor(input: {
    actualBytes: number;
    fileName: string;
    format: SupportedDocumentFormat;
    maxBytes: number;
  }) {
    super(
      `Upload exceeded ${input.format.toUpperCase()} size limit: ${input.actualBytes} bytes > ${input.maxBytes} bytes.`,
    );
    this.actualBytes = input.actualBytes;
    this.fileName = input.fileName;
    this.format = input.format;
    this.maxBytes = input.maxBytes;
    this.name = "UploadSizeExceededError";
  }
}

export class ProtectedUploadError extends Error {
  readonly fileName: string;
  readonly format: SupportedDocumentFormat;

  constructor(input: { fileName: string; format: SupportedDocumentFormat }) {
    super(`Password-protected ${input.format.toUpperCase()} uploads are not supported.`);
    this.fileName = input.fileName;
    this.format = input.format;
    this.name = "ProtectedUploadError";
  }
}

type ResolveUploadRoutingInput = {
  body: Buffer;
  contentType?: string;
  fileName: string;
};

export function resolveUploadRouting(
  input: ResolveUploadRoutingInput,
): UploadRoutingResult {
  const expectedFormat = inferSupportedFormatFromFileName(input.fileName);
  const detectedFormat =
    detectFormatFromSignature(input.body, expectedFormat) ??
    detectFormatFromText(input.body, expectedFormat);
  const resolvedFormat = detectedFormat ?? expectedFormat;

  if (resolvedFormat === undefined) {
    throw new UnsupportedUploadFormatError(input.fileName);
  }

  if (
    expectedFormat !== undefined &&
    detectedFormat !== null &&
    detectedFormat !== expectedFormat
  ) {
    throw new UploadFormatMismatchError({
      detectedFormat,
      expectedFormat,
      fileName: input.fileName,
    });
  }

  if (isPasswordProtectedUpload(resolvedFormat, input.body)) {
    throw new ProtectedUploadError({
      fileName: input.fileName,
      format: resolvedFormat,
    });
  }

  const policy = documentFormatPolicies[resolvedFormat];

  if (input.body.byteLength > policy.maxBytes) {
    throw new UploadSizeExceededError({
      actualBytes: input.body.byteLength,
      fileName: input.fileName,
      format: resolvedFormat,
      maxBytes: policy.maxBytes,
    });
  }

  return uploadRoutingResultSchema.parse({
    detectedContentType: resolveDetectedContentType(
      resolvedFormat,
      input.contentType,
    ),
    format: resolvedFormat,
    maxBytes: policy.maxBytes,
    parserRoute: policy.parserRoute,
  });
}

export function inferContentTypeFromSupportedFormat(
  format: SupportedDocumentFormat,
): string {
  return documentFormatPolicies[format].detectedContentType;
}

export function getDocumentFormatPolicy(
  format: SupportedDocumentFormat,
): DocumentFormatPolicy {
  return documentFormatPolicies[format];
}

export function inferSupportedFormatFromFileName(
  fileName: string,
): SupportedDocumentFormat | undefined {
  const extension = getFileExtension(fileName);
  const parsedExtension = supportedDocumentFormatSchema.safeParse(extension);

  return parsedExtension.success ? parsedExtension.data : undefined;
}

export function listSupportedUploadExtensions(): SupportedDocumentFormat[] {
  return supportedDocumentFormatSchema.options;
}

function resolveDetectedContentType(
  format: SupportedDocumentFormat,
  contentType?: string,
): string {
  if (typeof contentType !== "string" || contentType.trim().length === 0) {
    return inferContentTypeFromSupportedFormat(format);
  }

  return contentType.split(";")[0]?.trim().toLowerCase().length
    ? contentType.split(";")[0]!.trim().toLowerCase()
    : inferContentTypeFromSupportedFormat(format);
}

function detectFormatFromSignature(
  body: Buffer,
  expectedFormat?: SupportedDocumentFormat,
): SupportedDocumentFormat | null {
  if (body.byteLength === 0) {
    return expectedFormat ?? null;
  }

  if (hasPdfSignature(body)) {
    return "pdf";
  }

  if (hasZipSignature(body)) {
    if (expectedFormat === "docx" || expectedFormat === "xlsx") {
      return expectedFormat;
    }
  }

  if (expectedFormat === "pdf" || expectedFormat === "docx" || expectedFormat === "xlsx") {
    return null;
  }

  return null;
}

function detectFormatFromText(
  body: Buffer,
  expectedFormat?: SupportedDocumentFormat,
): SupportedDocumentFormat | null {
  if (!looksLikeTextBuffer(body)) {
    return null;
  }

  const previewText = decodePreviewText(body);
  const trimmedPreviewText = previewText.trimStart();

  if (trimmedPreviewText.length === 0) {
    return expectedFormat ?? "txt";
  }

  if (expectedFormat === "csv") {
    return detectCsvLikeText(trimmedPreviewText) ? "csv" : null;
  }

  if (expectedFormat === "txt") {
    return "txt";
  }

  if (isLikelyJson(trimmedPreviewText)) {
    return "json";
  }

  if (isLikelyHtml(trimmedPreviewText)) {
    return "html";
  }

  if (isLikelyXml(trimmedPreviewText)) {
    return "xml";
  }

  return expectedFormat === undefined ? "txt" : null;
}

function detectCsvLikeText(text: string): boolean {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 2);

  if (lines.length < 2) {
    return false;
  }

  const delimiters = [",", ";", "\t"];

  return delimiters.some((delimiter) => {
    const firstColumnCount = lines[0]!.split(delimiter).length;
    const secondColumnCount = lines[1]!.split(delimiter).length;

    return firstColumnCount >= 2 && firstColumnCount === secondColumnCount;
  });
}

function isLikelyHtml(text: string): boolean {
  const normalizedText = text.toLowerCase();

  return (
    normalizedText.startsWith("<!doctype html") ||
    normalizedText.startsWith("<html") ||
    normalizedText.includes("<body") ||
    normalizedText.includes("<table")
  );
}

function isLikelyJson(text: string): boolean {
  if (!(text.startsWith("{") || text.startsWith("["))) {
    return false;
  }

  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

function isLikelyXml(text: string): boolean {
  const normalizedText = text.toLowerCase();

  if (normalizedText.startsWith("<?xml")) {
    return true;
  }

  return /^<([a-z_][\w.-]*)(\s|>)/i.test(normalizedText) && !isLikelyHtml(text);
}

function hasPdfSignature(body: Buffer): boolean {
  return body.subarray(0, 5).toString("ascii") === "%PDF-";
}

function hasZipSignature(body: Buffer): boolean {
  return (
    body.byteLength >= 4 &&
    body[0] === 0x50 &&
    body[1] === 0x4b &&
    (body[2] === 0x03 || body[2] === 0x05 || body[2] === 0x07) &&
    (body[3] === 0x04 || body[3] === 0x06 || body[3] === 0x08)
  );
}

function isPasswordProtectedUpload(
  format: SupportedDocumentFormat,
  body: Buffer,
): boolean {
  if (format === "pdf") {
    return body.toString("latin1").includes("/Encrypt");
  }

  if (format === "docx" || format === "xlsx") {
    const archiveIndex = body.indexOf("EncryptedPackage", 0, "latin1");
    const encryptionInfoIndex = body.indexOf("EncryptionInfo", 0, "latin1");

    return archiveIndex >= 0 || encryptionInfoIndex >= 0;
  }

  return false;
}

function looksLikeTextBuffer(body: Buffer): boolean {
  if (body.byteLength === 0) {
    return true;
  }

  const sample = body.subarray(0, Math.min(body.byteLength, 512));

  for (let index = 0; index < sample.length; index += 1) {
    if (sample[index] === 0x00) {
      return false;
    }
  }

  return true;
}

function decodePreviewText(body: Buffer): string {
  const previewBuffer = body.subarray(0, Math.min(body.byteLength, 4_096));

  if (
    previewBuffer.length >= 2 &&
    previewBuffer[0] === 0xff &&
    previewBuffer[1] === 0xfe
  ) {
    return previewBuffer.subarray(2).toString("utf16le");
  }

  if (
    previewBuffer.length >= 2 &&
    previewBuffer[0] === 0xfe &&
    previewBuffer[1] === 0xff
  ) {
    const swappedBuffer = Buffer.alloc(previewBuffer.length - 2);

    for (let index = 2; index < previewBuffer.length; index += 2) {
      const targetIndex = index - 2;

      swappedBuffer[targetIndex] = previewBuffer[index + 1] ?? 0;
      swappedBuffer[targetIndex + 1] = previewBuffer[index] ?? 0;
    }

    return swappedBuffer.toString("utf16le");
  }

  if (
    previewBuffer.length >= 3 &&
    previewBuffer[0] === 0xef &&
    previewBuffer[1] === 0xbb &&
    previewBuffer[2] === 0xbf
  ) {
    return previewBuffer.subarray(3).toString("utf8");
  }

  return previewBuffer.toString("utf8");
}

function getFileExtension(fileName: string): string | undefined {
  const extension = path.extname(fileName).trim().toLowerCase();

  return extension.length === 0 ? undefined : extension.replace(/^\./, "");
}
