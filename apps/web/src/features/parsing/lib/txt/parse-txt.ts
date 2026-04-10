import {
  calculateTextParserConfidence,
  normalizeParsedText,
} from "@/features/parsing/domain/text-parser-artifact";
import { decodeTextBuffer } from "@/features/parsing/lib/text/decode-text-buffer";

export type ParsedTxt = {
  confidenceScore: number;
  text: string;
};

export function parseTxtBuffer(buffer: Buffer): ParsedTxt {
  const text = normalizeParsedText(decodeTextBuffer(buffer));

  return {
    confidenceScore: calculateTextParserConfidence(text),
    text,
  };
}
