import { describe, expect, it } from "vitest";

import { runTracedOperation } from "@/features/observability/lib/traced-operation";

describe("runTracedOperation", () => {
  it("runs wrapped async operations transparently", async () => {
    await expect(runTracedOperation("demo", async () => "ok")).resolves.toBe(
      "ok",
    );
  });
});
