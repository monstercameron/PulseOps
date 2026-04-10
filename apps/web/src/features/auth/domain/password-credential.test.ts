import { describe, expect, it } from "vitest";

import {
  hashPassword,
  verifyPassword,
} from "@/features/auth/domain/password-credential";

describe("password credential", () => {
  it("hashes and verifies a password", () => {
    const passwordHash = hashPassword("password");

    expect(passwordHash).toMatch(/^scrypt\$/);
    expect(verifyPassword("password", passwordHash)).toBe(true);
    expect(verifyPassword("incorrect", passwordHash)).toBe(false);
  });

  it("rejects empty passwords", () => {
    expect(() => hashPassword("")).toThrow("Password cannot be empty.");
  });
});
