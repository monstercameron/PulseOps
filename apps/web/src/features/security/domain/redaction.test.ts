import { describe, expect, it } from "vitest";

import {
  redactSensitiveObject,
  redactSensitiveText,
} from "@/features/security/domain/redaction";

describe("redaction", () => {
  it("redacts common pii and financial identifiers", () => {
    expect(
      redactSensitiveText(
        "Email cam@example.com SSN 123-45-6789 account 4111111111111111",
      ),
    ).toContain("[REDACTED_EMAIL]");
    expect(
      redactSensitiveObject({
        note: "Call cam@example.com",
      }),
    ).toEqual({
      note: "Call [REDACTED_EMAIL]",
    });
  });
});
