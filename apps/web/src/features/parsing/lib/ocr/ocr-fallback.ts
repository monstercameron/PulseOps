import {
  calculateTextParserConfidence,
  normalizeParsedText,
} from "@/features/parsing/domain/text-parser-artifact";
import { type OcrEngine } from "@/features/parsing/lib/ocr/ocr-engine";

export type OcrFallbackResult = {
  confidenceScore: number;
  text: string;
  usedOcrFallback: boolean;
};

type PerformOcrFallbackInput = {
  buffer: Buffer;
  minimumPrimaryTextLength?: number;
  ocrEngine: OcrEngine;
  primaryText?: string;
};

export async function performOcrFallback({
  buffer,
  minimumPrimaryTextLength = 24,
  ocrEngine,
  primaryText,
}: PerformOcrFallbackInput): Promise<OcrFallbackResult> {
  const trimmedPrimaryText = primaryText?.trim() ?? "";

  if (trimmedPrimaryText.length >= minimumPrimaryTextLength) {
    const normalizedPrimaryText = normalizeParsedText(trimmedPrimaryText);

    return {
      confidenceScore: calculateTextParserConfidence(normalizedPrimaryText),
      text: normalizedPrimaryText,
      usedOcrFallback: false,
    };
  }

  const ocrResult = await ocrEngine.recognizeImage(buffer);
  const normalizedOcrText = normalizeParsedText(ocrResult.text);

  return {
    confidenceScore: Number(
      Math.min(
        0.99,
        Math.max(
          ocrResult.confidenceScore,
          calculateTextParserConfidence(normalizedOcrText),
        ),
      ).toFixed(2),
    ),
    text: normalizedOcrText,
    usedOcrFallback: true,
  };
}
