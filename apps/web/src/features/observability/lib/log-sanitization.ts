import { createHash } from "node:crypto";

type StructuredExceptionLike = {
  digest?: string;
  message: string;
  stack?: string;
  type: string;
};

const digestKeyNames = new Set(["checksum", "checksumsha256", "digest", "sha256"]);
const fileNameKeyNames = new Set(["filename", "originalfilename"]);
const objectKeyKeyNames = new Set(["objectkey", "storagekey"]);
const responseBodyKeyNames = new Set(["responsebody"]);
const secretKeyNames = new Set([
  "apikey",
  "authorization",
  "cookie",
  "password",
  "secret",
  "setcookie",
  "token",
  "webhooksecret",
]);

const freeTextRedactionPatterns = [
  {
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    replacement: "[REDACTED_EMAIL]",
  },
  {
    pattern:
      /\b(?:\+?1[-.\s]*)?(?:\(?\d{3}\)?[-.\s]*)\d{3}[-.\s]*\d{4}\b/g,
    replacement: "[REDACTED_PHONE]",
  },
  {
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: "[REDACTED_SSN]",
  },
  {
    pattern: /\bBearer\s+[A-Za-z0-9._-]+\b/gi,
    replacement: "Bearer [REDACTED_TOKEN]",
  },
  {
    pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
    replacement: "[REDACTED_JWT]",
  },
  {
    pattern: /\b(?:\d[ -]*?){13,19}\b/g,
    replacement: "[REDACTED_ACCOUNT]",
  },
];

export function buildLogValueHash(value: string): string {
  return createHash("sha1").update(value).digest("hex").slice(0, 12);
}

export function sanitizeLogData(
  data: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (data === undefined) {
    return undefined;
  }

  return sanitizeRecord(data, 0);
}

export function sanitizeStructuredException(
  exception: StructuredExceptionLike | undefined,
): StructuredExceptionLike | undefined {
  if (exception === undefined) {
    return undefined;
  }

  return {
    ...(exception.digest === undefined
      ? {}
      : { digest: sanitizeFreeText(exception.digest, 128) }),
    message: sanitizeFreeText(exception.message, 320),
    ...(exception.stack === undefined
      ? {}
      : { stack: sanitizeStack(exception.stack) }),
    type: sanitizeFreeText(exception.type, 80),
  };
}

export function sanitizeFreeText(value: string, maxLength = 240): string {
  let sanitizedValue = value;

  for (const redactionPattern of freeTextRedactionPatterns) {
    sanitizedValue = sanitizedValue.replace(
      redactionPattern.pattern,
      redactionPattern.replacement,
    );
  }

  if (sanitizedValue.length <= maxLength) {
    return sanitizedValue;
  }

  return `${sanitizedValue.slice(0, maxLength)}... [truncated:${sanitizedValue.length}]`;
}

function sanitizeStack(stack: string): string {
  const sanitizedStack = sanitizeFreeText(stack, 4_000);
  const stackLines = sanitizedStack.split("\n");

  if (stackLines.length <= 12) {
    return sanitizedStack;
  }

  return [
    ...stackLines.slice(0, 12),
    `[truncated_frames:${stackLines.length - 12}]`,
  ].join("\n");
}

function sanitizeRecord(
  record: Record<string, unknown>,
  depth: number,
): Record<string, unknown> {
  const sanitizedEntries = Object.entries(record).slice(0, 20);

  return Object.fromEntries(
    sanitizedEntries.map(([key, value]) => [
      key,
      sanitizeLogValue(value, normalizeKeyName(key), depth + 1),
    ]),
  );
}

function sanitizeLogValue(
  value: unknown,
  normalizedKeyName: string | undefined,
  depth: number,
): unknown {
  if (depth > 4) {
    return "[TRUNCATED_DEPTH]";
  }

  if (typeof value === "string") {
    return sanitizeStringValue(value, normalizedKeyName);
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null ||
    value === undefined
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    const sanitizedItems = value
      .slice(0, 10)
      .map((item) => sanitizeLogValue(item, normalizedKeyName, depth + 1));

    if (value.length > 10) {
      sanitizedItems.push(`[TRUNCATED_ITEMS:${value.length - 10}]`);
    }

    return sanitizedItems;
  }

  if (value instanceof Error) {
    return sanitizeStructuredException({
      message: value.message || "Unknown error",
      stack: value.stack,
      type: value.name || "Error",
    });
  }

  if (isPlainObject(value)) {
    const sanitizedRecord = sanitizeRecord(value, depth);

    if (Object.keys(value).length > 20) {
      sanitizedRecord._truncatedKeys = Object.keys(value).length - 20;
    }

    return sanitizedRecord;
  }

  return sanitizeFreeText(String(value), 240);
}

function sanitizeStringValue(
  value: string,
  normalizedKeyName: string | undefined,
): unknown {
  if (normalizedKeyName !== undefined && secretKeyNames.has(normalizedKeyName)) {
    return "[REDACTED_SECRET]";
  }

  if (normalizedKeyName !== undefined && fileNameKeyNames.has(normalizedKeyName)) {
    return summarizeFileName(value);
  }

  if (normalizedKeyName !== undefined && objectKeyKeyNames.has(normalizedKeyName)) {
    return summarizeObjectKey(value);
  }

  if (normalizedKeyName !== undefined && digestKeyNames.has(normalizedKeyName)) {
    return summarizeDigest(value);
  }

  if (
    normalizedKeyName !== undefined &&
    responseBodyKeyNames.has(normalizedKeyName)
  ) {
    return summarizeResponseBody(value);
  }

  return sanitizeFreeText(value, 240);
}

function summarizeFileName(fileName: string) {
  return {
    extension: getFileExtension(fileName),
    hash: buildLogValueHash(fileName),
    kind: "file_name",
    length: fileName.length,
  };
}

function summarizeObjectKey(objectKey: string) {
  const segments = objectKey.split("/").filter((segment) => segment.length > 0);

  return {
    extension: getFileExtension(segments[segments.length - 1] ?? objectKey),
    hash: buildLogValueHash(objectKey),
    kind: "object_key",
    segmentCount: segments.length,
  };
}

function summarizeDigest(digest: string) {
  const [maybeAlgorithm, maybeValue] = digest.includes(":")
    ? digest.split(":", 2)
    : [undefined, digest];
  const digestValue = maybeValue ?? digest;

  return {
    algorithm: maybeAlgorithm,
    kind: "digest",
    length: digestValue.length,
    prefix: digestValue.slice(0, 12),
  };
}

function summarizeResponseBody(responseBody: string) {
  const summaryHash = buildLogValueHash(responseBody);

  try {
    const parsedBody = JSON.parse(responseBody) as unknown;

    if (Array.isArray(parsedBody)) {
      return {
        format: "json",
        hash: summaryHash,
        itemCount: parsedBody.length,
        kind: "response_body",
      };
    }

    if (isPlainObject(parsedBody)) {
      const keys = Object.keys(parsedBody);

      return {
        code:
          typeof parsedBody.code === "string"
            ? sanitizeFreeText(parsedBody.code, 80)
            : undefined,
        error:
          typeof parsedBody.error === "string"
            ? sanitizeFreeText(parsedBody.error, 200)
            : undefined,
        format: "json",
        hash: summaryHash,
        issueCount:
          Array.isArray(parsedBody.issues) ? parsedBody.issues.length : undefined,
        keyCount: keys.length,
        keys: keys.slice(0, 10),
        kind: "response_body",
        requestId:
          typeof parsedBody.requestId === "string" ? parsedBody.requestId : undefined,
        status:
          typeof parsedBody.status === "number" ? parsedBody.status : undefined,
      };
    }
  } catch {
    return {
      format: "text",
      hash: summaryHash,
      kind: "response_body",
      length: responseBody.length,
      preview: sanitizeFreeText(responseBody, 160),
    };
  }

  return {
    format: "json",
    hash: summaryHash,
    kind: "response_body",
    preview: sanitizeFreeText(String(responseBody), 160),
  };
}

function getFileExtension(fileName: string): string | undefined {
  return fileName.split(".").pop()?.trim().toLowerCase();
}

function normalizeKeyName(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
