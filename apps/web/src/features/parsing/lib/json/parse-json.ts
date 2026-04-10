import {
  calculateTextParserConfidence,
  normalizeParsedText,
} from "@/features/parsing/domain/text-parser-artifact";
import { decodeTextBuffer } from "@/features/parsing/lib/text/decode-text-buffer";

export type ParsedJson = {
  confidenceScore: number;
  flattenedFieldCount: number;
  normalizedObject: unknown;
  text: string;
};

export function parseJsonBuffer(buffer: Buffer): ParsedJson {
  const rawJson = decodeTextBuffer(buffer);
  const parsedJson = JSON.parse(rawJson) as unknown;
  const normalizedObject = normalizeJsonValue(parsedJson);
  const flattenedFields = flattenStructuredValue(normalizedObject);
  const text = normalizeParsedText(flattenedFields.join("\n"));

  return {
    confidenceScore: calculateTextParserConfidence(text),
    flattenedFieldCount: flattenedFields.length,
    normalizedObject,
    text,
  };
}

function normalizeJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeJsonValue);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, nestedValue]) => [key, normalizeJsonValue(nestedValue)]),
    );
  }

  return value;
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
