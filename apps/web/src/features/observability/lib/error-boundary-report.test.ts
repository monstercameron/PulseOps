import { describe, expect, it } from "vitest";

import { handleErrorBoundaryReport } from "@/features/observability/lib/error-boundary-report";

describe("error boundary report", () => {
  it("accepts client error boundary reports", async () => {
    const response = await handleErrorBoundaryReport(
      new Request("http://localhost/api/observability/error-boundary", {
        body: JSON.stringify({
          boundary: "app",
          message: "Client component crashed.",
          name: "Error",
          pathname: "/dashboard",
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      }),
      {
        requestId: "req_123",
        route: "/api/observability/error-boundary",
      },
    );

    expect(response.status).toBe(202);
  });
});
