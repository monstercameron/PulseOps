import { context, trace } from "@opentelemetry/api";
import { z } from "zod";

import {
  sanitizeFreeText,
  sanitizeLogData,
  sanitizeStructuredException,
} from "@/features/observability/lib/log-sanitization";

export const logLevelSchema = z.enum(["debug", "info", "warn", "error"]);

const structuredExceptionSchema = z.object({
  digest: z.string().min(1).optional(),
  message: z.string().min(1),
  stack: z.string().min(1).optional(),
  type: z.string().min(1),
});

export const structuredLogEntrySchema = z.object({
  attributes: z.record(z.string(), z.unknown()).optional(),
  body: z.string().min(1),
  data: z.record(z.string(), z.unknown()).optional(),
  documentId: z.string().min(1).optional(),
  exception: structuredExceptionSchema.optional(),
  feature: z.string().min(1),
  jobId: z.string().min(1).optional(),
  level: logLevelSchema,
  message: z.string().min(1),
  orgId: z.string().min(1).optional(),
  requestId: z.string().min(1).optional(),
  resource: z.record(z.string(), z.string()).optional(),
  service: z.string().min(1),
  severityNumber: z.number().int().positive(),
  severityText: z.string().min(1),
  spanId: z.string().length(16).optional(),
  timestamp: z.string().datetime(),
  traceId: z.string().length(32).optional(),
});

export type StructuredLogEntry = z.infer<typeof structuredLogEntrySchema>;

type BuildStructuredLogEntryInput = Omit<
  StructuredLogEntry,
  | "attributes"
  | "body"
  | "resource"
  | "severityNumber"
  | "severityText"
  | "spanId"
  | "timestamp"
  | "traceId"
> & {
  now?: string;
};

const severityNumberByLevel = {
  debug: 5,
  error: 17,
  info: 9,
  warn: 13,
} as const;

const recentDedupeKeys = new Map<string, number>();

export function buildStructuredLogEntry(
  input: BuildStructuredLogEntryInput,
): StructuredLogEntry {
  const activeSpanContext = trace.getSpan(context.active())?.spanContext();
  const severityText = input.level.toUpperCase();
  const sanitizedMessage = sanitizeFreeText(input.message, 160);
  const sanitizedData = sanitizeLogData(input.data);
  const sanitizedException = sanitizeStructuredException(input.exception);

  return structuredLogEntrySchema.parse({
    ...input,
    attributes: buildLogAttributes(input),
    body: sanitizedMessage,
    data: sanitizedData,
    exception: sanitizedException,
    message: sanitizedMessage,
    resource: {
      "service.name": input.service,
    },
    severityNumber: severityNumberByLevel[input.level],
    severityText,
    spanId: activeSpanContext?.spanId,
    timestamp: input.now ?? new Date().toISOString(),
    traceId: activeSpanContext?.traceId,
  });
}

export function serializeStructuredLogEntry(
  input: BuildStructuredLogEntryInput,
): string {
  return JSON.stringify(buildStructuredLogEntry(input));
}

type EmitStructuredLogOptions = {
  dedupeKey?: string;
  dedupeWindowMs?: number;
  sink?: (serializedEntry: string, entry: StructuredLogEntry) => void;
};

export function emitStructuredLog(
  input: BuildStructuredLogEntryInput,
  options: EmitStructuredLogOptions = {},
): StructuredLogEntry | null {
  const entry = buildStructuredLogEntry(input);

  if (
    options.dedupeKey !== undefined &&
    shouldSkipDuplicateLog(
      options.dedupeKey,
      Date.parse(entry.timestamp),
      options.dedupeWindowMs ?? 5_000,
    )
  ) {
    return null;
  }

  const serializedEntry = JSON.stringify(entry);
  const sink = options.sink ?? writeStructuredLogEntry;

  sink(serializedEntry, entry);

  return entry;
}

export function writeStructuredLogEntry(
  serializedEntry: string,
  entry: Pick<StructuredLogEntry, "level">,
) {
  const sink =
    entry.level === "error"
      ? console.error
      : entry.level === "warn"
        ? console.warn
        : entry.level === "debug"
          ? console.debug
          : console.info;

  sink(serializedEntry);
}

export function emitSerializedStructuredLog(serializedEntry: string) {
  try {
    const entry = structuredLogEntrySchema.parse(JSON.parse(serializedEntry));

    writeStructuredLogEntry(serializedEntry, entry);
  } catch {
    console.info(serializedEntry);
  }
}

function buildLogAttributes(
  input: BuildStructuredLogEntryInput,
): Record<string, unknown> {
  return {
    "bizops.feature": input.feature,
    ...(input.documentId === undefined
      ? {}
      : { "bizops.document_id": input.documentId }),
    ...(input.jobId === undefined ? {} : { "bizops.job_id": input.jobId }),
    ...(input.orgId === undefined ? {} : { "bizops.org_id": input.orgId }),
    ...(input.requestId === undefined
      ? {}
      : { "bizops.request_id": input.requestId }),
  };
}

function shouldSkipDuplicateLog(
  dedupeKey: string,
  nowMs: number,
  dedupeWindowMs: number,
): boolean {
  pruneExpiredDedupeKeys(nowMs);
  const previousExpiry = recentDedupeKeys.get(dedupeKey);

  if (previousExpiry !== undefined && previousExpiry > nowMs) {
    return true;
  }

  recentDedupeKeys.set(dedupeKey, nowMs + dedupeWindowMs);

  return false;
}

function pruneExpiredDedupeKeys(nowMs: number) {
  for (const [dedupeKey, expiresAt] of recentDedupeKeys.entries()) {
    if (expiresAt <= nowMs) {
      recentDedupeKeys.delete(dedupeKey);
    }
  }
}
