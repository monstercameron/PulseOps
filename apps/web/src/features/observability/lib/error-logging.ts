import { createHash } from "node:crypto";

import { z } from "zod";

import {
  emitStructuredLog,
  type StructuredLogEntry,
} from "@/features/observability/lib/structured-logger";

const errorLikeSchema = z.object({
  digest: z.string().min(1).optional(),
  message: z.string().min(1),
  name: z.string().min(1).optional(),
  stack: z.string().min(1).optional(),
});

type LogServerErrorInput = {
  component?: string;
  data?: Record<string, unknown>;
  dedupeKey?: string;
  error: unknown;
  feature: string;
  message: string;
  requestId?: string;
  route?: string;
  service: string;
};

export function logServerError(
  input: LogServerErrorInput,
): StructuredLogEntry | null {
  const normalizedError = normalizeErrorLike(input.error);
  const fingerprint = buildErrorFingerprint({
    component: input.component,
    feature: input.feature,
    name: normalizedError.type,
    message: normalizedError.message,
    route: input.route,
    stack: normalizedError.stack,
  });

  return emitStructuredLog(
    {
      data: {
        ...input.data,
        ...(input.component === undefined
          ? {}
          : { component: input.component }),
        errorFingerprint: fingerprint,
        ...(input.route === undefined ? {} : { route: input.route }),
      },
      exception: normalizedError,
      feature: input.feature,
      level: "error",
      message: input.message,
      requestId: input.requestId,
      service: input.service,
    },
    {
      dedupeKey:
        input.dedupeKey ??
        `error:${input.requestId ?? "no-request"}:${fingerprint}`,
    },
  );
}

type BuildErrorFingerprintInput = {
  component?: string;
  feature: string;
  message: string;
  name: string;
  route?: string;
  stack?: string;
};

export function buildErrorFingerprint(
  input: BuildErrorFingerprintInput,
): string {
  const rawFingerprint = [
    input.feature,
    input.route ?? "",
    input.component ?? "",
    input.name,
    input.message,
    input.stack?.split("\n")[0] ?? "",
  ].join("|");

  return createHash("sha1").update(rawFingerprint).digest("hex");
}

type NormalizedErrorLike = {
  digest?: string;
  message: string;
  stack?: string;
  type: string;
};

function normalizeErrorLike(error: unknown): NormalizedErrorLike {
  if (error instanceof Error) {
    return {
      digest: readOptionalErrorString(error, "digest"),
      message: error.message || "Unknown error",
      stack: error.stack,
      type: error.name || "Error",
    };
  }

  const parsedError = errorLikeSchema.safeParse(error);

  if (parsedError.success) {
    return {
      digest: parsedError.data.digest,
      message: parsedError.data.message,
      stack: parsedError.data.stack,
      type: parsedError.data.name ?? "Error",
    };
  }

  return {
    message: "Unknown non-error rejection",
    type: "UnknownError",
  };
}

function readOptionalErrorString(
  error: Error,
  propertyName: string,
): string | undefined {
  const propertyValue = Reflect.get(error, propertyName);

  return typeof propertyValue === "string" && propertyValue.length > 0
    ? propertyValue
    : undefined;
}
