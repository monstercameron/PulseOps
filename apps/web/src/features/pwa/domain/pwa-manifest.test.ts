import { describe, expect, it } from "vitest";

import { pulseOpsPwaManifest } from "@/features/pwa/domain/pwa-manifest";

describe("pulseOpsPwaManifest", () => {
  it("defines installable app metadata", () => {
    expect(pulseOpsPwaManifest).toMatchObject({
      display: "standalone",
      name: "PulseOps",
      shortName: "PulseOps",
      startUrl: "/",
    });
    expect(pulseOpsPwaManifest.icons).toContainEqual({
      sizes: "any",
      src: "/favicon.ico",
      type: "image/x-icon",
    });
  });
});
