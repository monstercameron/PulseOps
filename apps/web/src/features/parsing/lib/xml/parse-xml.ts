import { XMLParser } from "fast-xml-parser";

import {
  calculateTextParserConfidence,
  normalizeParsedText,
} from "@/features/parsing/domain/text-parser-artifact";
import { decodeTextBuffer } from "@/features/parsing/lib/text/decode-text-buffer";

export type ParsedXml = {
  confidenceScore: number;
  flattenedFieldCount: number;
  parsedDocument: unknown;
  text: string;
};

const xmlParser = new XMLParser({
  attributeNamePrefix: "@",
  ignoreAttributes: false,
  parseTagValue: true,
  trimValues: true,
});

export function parseXmlBuffer(buffer: Buffer): ParsedXml {
  const rawXml = decodeTextBuffer(buffer);
  const parsedDocument = xmlParser.parse(rawXml) as unknown;
  const flattenedFields = flattenStructuredValue(parsedDocument);
  const text = normalizeParsedText(flattenedFields.join("\n"));

  return {
    confidenceScore: calculateTextParserConfidence(text),
    flattenedFieldCount: flattenedFields.length,
    parsedDocument,
    text,
  };
}

function flattenStructuredValue(
  value: unknown,
  pathPrefix = "root",
): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      flattenStructuredValue(item, `${pathPrefix}[${index}]`),
    );
  }

  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, nestedValue]) =>
      flattenStructuredValue(nestedValue, `${pathPrefix}.${key}`),
    );
  }

  return [`${pathPrefix}: ${String(value)}`];
}
