export function redactSensitiveText(text: string): string {
  return text
    .replaceAll(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED_SSN]")
    .replaceAll(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      "[REDACTED_EMAIL]",
    )
    .replaceAll(/\b(?:\d[ -]*?){13,16}\b/g, "[REDACTED_ACCOUNT]")
    .replaceAll(/\b\d{10,}\b/g, "[REDACTED_NUMBER]");
}

export function redactSensitiveObject(
  value: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [
      key,
      typeof entryValue === "string"
        ? redactSensitiveText(entryValue)
        : entryValue,
    ]),
  );
}
