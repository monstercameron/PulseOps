import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  DeleteThreadLoadingIcon,
  resolveAskComposerHeight,
} from "@/features/ask/components/ask-page";

describe("ask-page", () => {
  it("keeps the composer compact until the draft needs more room", () => {
    expect(resolveAskComposerHeight(18)).toBe(36);
    expect(resolveAskComposerHeight(76)).toBe(76);
    expect(resolveAskComposerHeight(220)).toBe(120);
  });

  it("renders an inert spinning icon for pending thread deletes", () => {
    const html = renderToStaticMarkup(createElement(DeleteThreadLoadingIcon));

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("animate-spin");
    expect(html).toContain("<circle");
    expect(html).toContain("<path");
  });
});
