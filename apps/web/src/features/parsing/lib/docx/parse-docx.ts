import mammoth from "mammoth";

import {
  calculateTextParserConfidence,
  normalizeParsedText,
} from "@/features/parsing/domain/text-parser-artifact";

export type ParsedDocx = {
  confidenceScore: number;
  text: string;
  warningCount: number;
};

export async function parseDocxBuffer(buffer: Buffer): Promise<ParsedDocx> {
  if (buffer.byteLength === 0) {
    throw new Error("DOCX buffer is empty.");
  }

  const result = await mammoth.extractRawText({
    buffer,
  });
  const text = normalizeParsedText(result.value);

  return {
    confidenceScore: calculateTextParserConfidence(text),
    text,
    warningCount: result.messages.length,
  };
}
