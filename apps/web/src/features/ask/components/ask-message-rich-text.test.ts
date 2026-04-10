import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AskMessageRichText } from "@/features/ask/components/ask-message-rich-text";

describe("AskMessageRichText", () => {
  it("renders markdown structure including headings, emphasis, and lists", () => {
    const html = renderToStaticMarkup(
      createElement(AskMessageRichText, {
        content:
          "## Summary\n\n- **Overdue invoices** increased\n- Check `cash` next",
        role: "assistant",
      }),
    );

    expect(html).toContain("<h2");
    expect(html).toContain("<strong>Overdue invoices</strong>");
    expect(html).toContain("<ul");
    expect(html).toContain("<code");
  });

  it("renders safe inline html and strips unsafe script content", () => {
    const html = renderToStaticMarkup(
      createElement(AskMessageRichText, {
        content:
          '<strong>Bold</strong><script>alert("x")</script><a href="https://example.com">safe</a>',
        role: "assistant",
      }),
    );

    expect(html).toContain("<strong>Bold</strong>");
    expect(html).toContain('href="https://example.com"');
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("alert(&quot;x&quot;)");
  });

  it("does not preserve unsafe javascript href values", () => {
    const html = renderToStaticMarkup(
      createElement(AskMessageRichText, {
        content: '<a href="javascript:alert(1)">bad</a>',
        role: "assistant",
      }),
    );

    expect(html).toContain(">bad</a>");
    expect(html).not.toContain("javascript:alert(1)");
  });

  it("treats single newlines as visible line breaks", () => {
    const html = renderToStaticMarkup(
      createElement(AskMessageRichText, {
        content: "line one\nline two",
        role: "user",
      }),
    );

    expect(html).toContain("<br/>");
  });
});
