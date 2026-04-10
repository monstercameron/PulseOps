import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

export const authSessionSchema = z.object({
  expiresAt: z.string().datetime(),
  orgId: z.string().min(1),
  role: z.enum(["owner", "admin", "operator", "analyst", "viewer"]),
  userId: z.string().min(1),
});

export type AuthSession = z.infer<typeof authSessionSchema>;

export function signAuthSession(session: AuthSession, secret: string): string {
  const payload = JSON.stringify(authSessionSchema.parse(session));
  const encodedPayload = Buffer.from(payload, "utf8").toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export function verifyAuthSession(
  token: string,
  secret: string,
  now = new Date().toISOString(),
): AuthSession {
  const [encodedPayload, signature] = token.split(".");

  if (encodedPayload === undefined || signature === undefined) {
    throw new Error("Invalid auth token format.");
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");

  if (
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    throw new Error("Invalid auth token signature.");
  }

  const session = authSessionSchema.parse(
    JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")),
  );

  if (session.expiresAt <= now) {
    throw new Error("Auth session has expired.");
  }

  return session;
}
