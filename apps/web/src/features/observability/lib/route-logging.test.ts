import { afterEach, describe, expect, it, vi } from "vitest";

import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("route logging", () => {
  it("attaches request ids to successful responses", async () => {
    const handler = createLoggedRouteHandler({
      feature: "uploads",
      handler: async () => Response.json({ ok: true }),
      route: "/api/ingest/upload",
    });

    const response = await handler(
      new Request("http://localhost/api/ingest/upload", {
        headers: {
          "x-request-id": "req_123",
        },
        method: "POST",
      }),
    );

    expect(response.headers.get("x-request-id")).toBe("req_123");
  });

  it("returns stable 500 envelopes when handlers throw", async () => {
    const handler = createLoggedRouteHandler({
      feature: "query",
      handler: async () => {
        throw new Error("Unexpected failure");
      },
      route: "/api/ask",
    });

    const response = await handler(
      new Request("http://localhost/api/ask", {
        headers: {
          "x-request-id": "req_456",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Unexpected server error.",
      requestId: "req_456",
    });
  });

  it("logs sanitized error response summaries instead of raw bodies", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const handler = createLoggedRouteHandler({
      feature: "uploads",
      handler: async () =>
        Response.json(
          {
            error: "Attachment for jane.doe@example.com was rejected",
            requestId: "req_777",
            token: "secret-token",
          },
          { status: 422 },
        ),
      route: "/api/ingest/upload",
    });

    await handler(
      new Request("http://localhost/api/ingest/upload", {
        headers: {
          "x-request-id": "req_777",
        },
        method: "POST",
      }),
    );

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const serializedEntry = String(warnSpy.mock.calls[0]?.[0] ?? "");

    expect(serializedEntry).not.toContain("jane.doe@example.com");
    expect(serializedEntry).not.toContain("secret-token");
    expect(serializedEntry).toContain("\"kind\":\"response_body\"");
    expect(serializedEntry).toContain("[REDACTED_EMAIL]");
  });
});
