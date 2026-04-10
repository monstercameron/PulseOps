import { type SupportedDocumentFormat } from "@/features/documents/domain/document-format";
import { resolveUploadRouting } from "@/features/documents/domain/document-format";
import {
  createTextParserArtifact,
  type TextParserArtifact,
} from "@/features/parsing/domain/text-parser-artifact";
import { parseDocxBuffer } from "@/features/parsing/lib/docx/parse-docx";
import { parseHtmlBuffer } from "@/features/parsing/lib/html/parse-html";
import { parseJsonBuffer } from "@/features/parsing/lib/json/parse-json";
import { parsePdfBuffer } from "@/features/parsing/lib/pdf/parse-pdf";
import { parseTxtBuffer } from "@/features/parsing/lib/txt/parse-txt";
import { parseXmlBuffer } from "@/features/parsing/lib/xml/parse-xml";

export type ParsedTextDocumentResult = {
  format: SupportedDocumentFormat;
  metadata: Record<string, number | string | boolean | undefined>;
  textParserArtifact: TextParserArtifact;
};

type ParseTextDocumentInput = {
  body: Buffer;
  contentType?: string;
  createdAt?: string;
  documentId: string;
  fileName: string;
  parserArtifactId: string;
};

export async function parseTextDocumentWithService(
  input: ParseTextDocumentInput,
): Promise<ParsedTextDocumentResult> {
  const routing = resolveUploadRouting({
    body: input.body,
    contentType: input.contentType,
    fileName: input.fileName,
  });

  if (routing.parserRoute !== "text") {
    throw new Error(`Unsupported text parser route: ${routing.format}`);
  }

  const parsedDocument = await parseTextDocumentByFormat(routing.format, input.body);

  return {
    format: routing.format,
    metadata: parsedDocument.metadata,
    textParserArtifact: createTextParserArtifact({
      confidenceScore: parsedDocument.confidenceScore,
      createdAt: input.createdAt,
      documentId: input.documentId,
      id: input.parserArtifactId,
      parserKind: parsedDocument.parserKind,
      text: parsedDocument.text,
      usedOcrFallback: parsedDocument.usedOcrFallback,
    }),
  };
}

type ParsedTextArtifactInput = {
  confidenceScore: number;
  metadata: Record<string, number | string | boolean | undefined>;
  parserKind: TextParserArtifact["parserKind"];
  text: string;
  usedOcrFallback?: boolean;
};

async function parseTextDocumentByFormat(
  format: SupportedDocumentFormat,
  body: Buffer,
): Promise<ParsedTextArtifactInput> {
  if (format === "pdf") {
    const parsedPdf = await parsePdfBuffer(body);

    return {
      confidenceScore: parsedPdf.confidenceScore,
      metadata: {
        pageCount: parsedPdf.pageCount,
      },
      parserKind: "pdf",
      text: parsedPdf.text,
      usedOcrFallback: false,
    };
  }

  if (format === "docx") {
    const parsedDocx = await parseDocxBuffer(body);

    return {
      confidenceScore: parsedDocx.confidenceScore,
      metadata: {
        warningCount: parsedDocx.warningCount,
      },
      parserKind: "docx",
      text: parsedDocx.text,
      usedOcrFallback: false,
    };
  }

  if (format === "txt") {
    const parsedTxt = parseTxtBuffer(body);

    return {
      confidenceScore: parsedTxt.confidenceScore,
      metadata: {},
      parserKind: "txt",
      text: parsedTxt.text,
      usedOcrFallback: false,
    };
  }

  if (format === "html") {
    const parsedHtml = parseHtmlBuffer(body);

    return {
      confidenceScore: parsedHtml.confidenceScore,
      metadata: {
        linkCount: parsedHtml.linkCount,
        tableCount: parsedHtml.tableCount,
        title: parsedHtml.title,
      },
      parserKind: "html",
      text: parsedHtml.text,
      usedOcrFallback: false,
    };
  }

  if (format === "xml") {
    const parsedXml = parseXmlBuffer(body);

    return {
      confidenceScore: parsedXml.confidenceScore,
      metadata: {
        flattenedFieldCount: parsedXml.flattenedFieldCount,
      },
      parserKind: "xml",
      text: parsedXml.text,
      usedOcrFallback: false,
    };
  }

  if (format === "json") {
    const parsedJson = parseJsonBuffer(body);

    return {
      confidenceScore: parsedJson.confidenceScore,
      metadata: {
        flattenedFieldCount: parsedJson.flattenedFieldCount,
      },
      parserKind: "json",
      text: parsedJson.text,
      usedOcrFallback: false,
    };
  }

  throw new Error(`Unsupported text parser format: ${format}`);
}
