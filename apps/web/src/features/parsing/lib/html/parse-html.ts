import { parse } from "node-html-parser";

import {
  calculateTextParserConfidence,
  normalizeParsedText,
} from "@/features/parsing/domain/text-parser-artifact";
import { decodeTextBuffer } from "@/features/parsing/lib/text/decode-text-buffer";

export type ParsedHtml = {
  confidenceScore: number;
  linkCount: number;
  tableCount: number;
  text: string;
  title?: string;
};

export function parseHtmlBuffer(buffer: Buffer): ParsedHtml {
  const html = decodeTextBuffer(buffer);
  const root = parse(html, {
    comment: false,
  });

  root.querySelectorAll("script,style,noscript").forEach((node) => {
    node.remove();
  });

  const title = root.querySelector("title")?.text.trim() || undefined;
  const text = normalizeParsedText(root.textContent);

  return {
    confidenceScore: calculateTextParserConfidence(text),
    linkCount: root.querySelectorAll("a[href]").length,
    tableCount: root.querySelectorAll("table").length,
    text,
    title,
  };
}
