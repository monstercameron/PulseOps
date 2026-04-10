import { z } from "zod";

export const textParserKindSchema = z.enum([
  "docx",
  "html",
  "json",
  "pdf",
  "ocr-image",
  "ocr-pdf",
  "txt",
  "xml",
]);

export type TextParserKind = z.infer<typeof textParserKindSchema>;

export const textParserArtifactSchema = z.object({
  confidenceScore: z.number().finite().min(0).max(1),
  createdAt: z.string().datetime(),
  documentId: z.string().min(1),
  id: z.string().min(1),
  parserKind: textParserKindSchema,
  sectionCount: z.number().int().positive(),
  text: z.string().min(1),
  textLength: z.number().int().positive(),
  usedOcrFallback: z.boolean(),
});

export type TextParserArtifact = z.infer<typeof textParserArtifactSchema>;

type CreateTextParserArtifactInput = {
  confidenceScore: number;
  createdAt?: string;
  documentId: string;
  id: string;
  parserKind: TextParserKind;
  text: string;
  usedOcrFallback?: boolean;
};

export function createTextParserArtifact(
  input: CreateTextParserArtifactInput,
): TextParserArtifact {
  const normalizedText = normalizeParsedText(input.text);

  return textParserArtifactSchema.parse({
    confidenceScore: input.confidenceScore,
    createdAt: input.createdAt ?? new Date().toISOString(),
    documentId: input.documentId,
    id: input.id,
    parserKind: input.parserKind,
    sectionCount: countTextSections(normalizedText),
    text: normalizedText,
    textLength: normalizedText.length,
    usedOcrFallback: input.usedOcrFallback ?? false,
  });
}

export function normalizeParsedText(text: string): string {
  const normalizedText = text
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  if (normalizedText.length === 0) {
    throw new Error("Parsed text document is empty.");
  }

  return normalizedText;
}

export function calculateTextParserConfidence(text: string): number {
  const normalizedText = normalizeParsedText(text);
  const wordCount = normalizedText.split(/\s+/).length;

  let confidenceScore = 0.58;

  if (normalizedText.length >= 40) {
    confidenceScore += 0.16;
  }

  if (wordCount >= 8) {
    confidenceScore += 0.14;
  }

  if (!/\ufffd/.test(normalizedText)) {
    confidenceScore += 0.08;
  }

  return Number(Math.min(confidenceScore, 0.96).toFixed(2));
}

function countTextSections(text: string): number {
  return text.split(/\n+/).filter((section) => section.trim().length > 0)
    .length;
}
