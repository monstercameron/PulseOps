import { z } from "zod";

import { buildErrorFingerprint, logServerError } from "@/features/observability/lib/error-logging";

export const errorBoundaryReportSchema = z.object({
  boundary: z.enum(["app", "global"]),
  digest: z.string().min(1).optional(),
  message: z.string().min(1),
  name: z.string().min(1).optional(),
  pathname: z.string().min(1).optional(),
  stack: z.string().min(1).optional(),
  userAgent: z.string().min(1).optional(),
});

type HandleErrorBoundaryReportInput = {
  requestId?: string;
  route?: string;
};

export async function handleErrorBoundaryReport(
  request: Request,
  input: HandleErrorBoundaryReportInput = {},
): Promise<Response> {
  const payload = errorBoundaryReportSchema.parse(await request.json());
  const fingerprint = buildErrorFingerprint({
    component: `${payload.boundary}-error-boundary`,
    feature: "frontend",
    message: payload.message,
    name: payload.name ?? "Error",
    route: payload.pathname ?? input.route,
    stack: payload.stack,
  });

  logServerError({
    component: `${payload.boundary}-error-boundary`,
    data: {
      boundary: payload.boundary,
      pathname: payload.pathname,
      userAgent: payload.userAgent,
    },
    dedupeKey: `boundary:${fingerprint}`,
    error: {
      digest: payload.digest,
      message: payload.message,
      name: payload.name ?? "Error",
      stack: payload.stack,
    },
    feature: "frontend",
    message: "Next.js error boundary captured a client error.",
    requestId: input.requestId,
    route: payload.pathname ?? input.route,
    service: "web",
  });

  return new Response(null, { status: 202 });
}
