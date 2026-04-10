import { randomUUID } from "node:crypto";

import {
  emitSerializedStructuredLog,
  emitStructuredLog,
} from "@/features/observability/lib/structured-logger";
import { logServerError } from "@/features/observability/lib/error-logging";
import { buildLogValueHash } from "@/features/observability/lib/log-sanitization";
import { runTracedOperation } from "@/features/observability/lib/traced-operation";

type LoggedRouteContext = {
  emitStructuredLogLine: (serializedEntry: string) => void;
  requestId: string;
};

type CreateLoggedRouteHandlerInput = {
  feature: string;
  handler: (request: Request, context: LoggedRouteContext) => Promise<Response>;
  route: string;
  service?: string;
};

export function createLoggedRouteHandler({
  feature,
  handler,
  route,
  service = "web",
}: CreateLoggedRouteHandlerInput) {
  return async function loggedRouteHandler(request: Request): Promise<Response> {
    const requestId = request.headers.get("x-request-id") ?? randomUUID();
    const context: LoggedRouteContext = {
      emitStructuredLogLine: emitSerializedStructuredLog,
      requestId,
    };

    try {
      const response = await runTracedOperation(
        `${request.method} ${route}`,
        async () => handler(request, context),
      );

      await logErrorResponseIfNeeded({
        feature,
        request,
        requestId,
        response,
        route,
        service,
      });

      response.headers.set("x-request-id", requestId);

      return response;
    } catch (error) {
      logServerError({
        data: {
          method: request.method,
          pathname: safePathnameFromRequest(request),
        },
        error,
        feature,
        message: "Route handler failed.",
        requestId,
        route,
        service,
      });

      return Response.json(
        {
          error: "Unexpected server error.",
          requestId,
        },
        {
          headers: {
            "x-request-id": requestId,
          },
          status: 500,
        },
      );
    }
  };
}

type LogErrorResponseIfNeededInput = {
  feature: string;
  request: Request;
  requestId: string;
  response: Response;
  route: string;
  service: string;
};

async function logErrorResponseIfNeeded({
  feature,
  request,
  requestId,
  response,
  route,
  service,
}: LogErrorResponseIfNeededInput) {
  if (response.status < 400) {
    return;
  }

  const responseText = await safeReadResponseBody(response);

  emitStructuredLog(
    {
      data: {
        method: request.method,
        pathname: safePathnameFromRequest(request),
        responseBody: responseText,
        route,
        statusCode: response.status,
      },
      feature,
      level: response.status >= 500 ? "error" : "warn",
      message:
        response.status >= 500
          ? "Route returned a server error response."
          : "Route returned a client error response.",
      requestId,
      service,
    },
    {
      dedupeKey: `route:${requestId}:${response.status}:${responseText === null ? "empty" : buildLogValueHash(responseText)}`,
    },
  );
}

async function safeReadResponseBody(response: Response): Promise<string | null> {
  try {
    const responseText = await response.clone().text();

    if (responseText.length === 0) {
      return null;
    }

    return responseText.length > 500
      ? `${responseText.slice(0, 500)}...`
      : responseText;
  } catch {
    return null;
  }
}

function safePathnameFromRequest(request: Request): string {
  try {
    return new URL(request.url).pathname;
  } catch {
    return request.url;
  }
}
