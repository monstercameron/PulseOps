import {
  calculateTextParserConfidence,
  normalizeParsedText,
} from "@/features/parsing/domain/text-parser-artifact";

export type ParsedPdf = {
  confidenceScore: number;
  pageCount: number;
  text: string;
};

export async function parsePdfBuffer(buffer: Buffer): Promise<ParsedPdf> {
  if (buffer.byteLength === 0) {
    throw new Error("PDF buffer is empty.");
  }

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
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
