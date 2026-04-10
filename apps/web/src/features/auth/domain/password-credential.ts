import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const PASSWORD_HASH_KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const normalizedPassword = normalizePassword(password);
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(
    normalizedPassword,
    salt,
    PASSWORD_HASH_KEY_LENGTH,
  ).toString("hex");

  return `scrypt$${salt}$${derivedKey}`;
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  const [algorithm, salt, expectedHash] = passwordHash.split("$");

  if (
    algorithm !== "scrypt" ||
    salt === undefined ||
    expectedHash === undefined
  ) {
    throw new Error("Invalid password hash format.");
  }

  const normalizedPassword = normalizePassword(password);
  const candidateHash = scryptSync(
    normalizedPassword,
    salt,
    PASSWORD_HASH_KEY_LENGTH,
  ).toString("hex");

  return timingSafeEqual(
    Buffer.from(candidateHash, "hex"),
    Buffer.from(expectedHash, "hex"),
  );
}

function normalizePassword(password: string) {
  if (password.length === 0) {
    throw new Error("Password cannot be empty.");
  }

  return password.normalize("NFKC");
}
