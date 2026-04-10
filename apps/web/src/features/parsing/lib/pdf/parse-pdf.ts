import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  calculateTextParserConfidence,
  normalizeParsedText,
} from "@/features/parsing/domain/text-parser-artifact";

export type ParsedPdf = {
  confidenceScore: number;
  pageCount: number;
  text: string;
};

let cachedPdfWorkerSrc: string | null = null;

export async function parsePdfBuffer(buffer: Buffer): Promise<ParsedPdf> {
  if (buffer.byteLength === 0) {
    throw new Error("PDF buffer is empty.");
  }

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = resolvePdfWorkerSrc();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
  });
  const pdfDocument = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (
    let pageNumber = 1;
    pageNumber <= pdfDocument.numPages;
    pageNumber += 1
  ) {
    const page = await pdfDocument.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .trim();

    if (text.length > 0) {
      pageTexts.push(text);
    }
  }

  const fullText = normalizeParsedText(pageTexts.join("\n"));

  return {
    confidenceScore: calculateTextParserConfidence(fullText),
    pageCount: pdfDocument.numPages,
    text: fullText,
  };
}

function resolvePdfWorkerSrc(): string {
  if (cachedPdfWorkerSrc !== null) {
    return cachedPdfWorkerSrc;
  }

  const workerModulePath = resolvePdfWorkerModulePath();
  cachedPdfWorkerSrc = pathToFileURL(workerModulePath).href;
  return cachedPdfWorkerSrc;
}

function resolvePdfWorkerModulePath(): string {
  const workerPathSegments = [
    "node_modules",
    "pdfjs-dist",
    "legacy",
    "build",
    "pdf.worker.mjs",
  ];
  const candidatePaths = [
    path.resolve(process.cwd(), ...workerPathSegments),
    path.resolve(process.cwd(), "..", ...workerPathSegments),
    path.resolve(process.cwd(), "..", "..", ...workerPathSegments),
  ];

  for (const candidatePath of candidatePaths) {
    if (existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  throw new Error("Unable to resolve pdf.worker.mjs from the current workspace.");
}
