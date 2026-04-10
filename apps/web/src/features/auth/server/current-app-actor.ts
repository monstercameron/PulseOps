import { type AuthSession } from "@/features/auth/domain/auth-session";
import { verifyAuthSession } from "@/features/auth/domain/auth-session";
import { type AccountRepository } from "@/features/accounts/repositories/account-repository";
import { type OrganizationAccountRecord } from "@/features/accounts/domain/organization-account";

export const APP_AUTH_COOKIE_NAME = "bizops_auth_session";

export type CurrentAppActor = Readonly<{
  account: OrganizationAccountRecord;
  session: AuthSession;
  source: "fallback" | "token";
}>;

export async function resolveCurrentAppActor(input: Readonly<{
  accountRepository: AccountRepository;
  authSecret: string;
  cookieValue?: string;
  now?: string;
  orgId: string;
  request?: Request;
}>): Promise<CurrentAppActor | null> {
  const now = input.now ?? new Date().toISOString();
  const token = readAuthToken(input);

  if (token !== null) {
    try {
      const session = verifyAuthSession(token, input.authSecret, now);

      if (session.orgId === input.orgId) {
        const account = await input.accountRepository.getByOrgIdAndUserId(
          input.orgId,
          session.userId,
        );

        if (account !== null && account.status === "active") {
          return {
            account,
            session,
            source: "token",
          };
        }
      }
    } catch {
      // Fall back to the local-dev actor if the token is missing or invalid.
    }
  }

  const activeAccounts = (await input.accountRepository.listByOrgId(input.orgId))
    .filter((account) => account.status === "active")
    .sort(compareAccountsForFallback);

  if (activeAccounts[0] === undefined) {
    return null;
  }

  const account = activeAccounts[0];

  return {
    account,
    session: buildAuthSessionFromAccount(account, now),
    source: "fallback",
  };
}

export function buildAuthSessionFromAccount(
  account: OrganizationAccountRecord,
  now = new Date().toISOString(),
): AuthSession {
  const expiresAt = new Date(Date.parse(now) + 12 * 60 * 60 * 1000).toISOString();

  return {
    expiresAt,
    orgId: account.orgId,
    role: account.role,
    userId: account.userId,
  };
}

function readAuthToken(input: Readonly<{
  cookieValue?: string;
  request?: Request;
}>) {
  const authHeader = input.request?.headers.get("authorization");

  if (authHeader !== null && authHeader !== undefined && authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length);
  }

  if (input.cookieValue !== undefined) {
    return input.cookieValue;
  }

  const cookieHeader = input.request?.headers.get("cookie");

  if (cookieHeader === null || cookieHeader === undefined) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((entry) => entry.trim());

  for (const cookie of cookies) {
    if (cookie.startsWith(`${APP_AUTH_COOKIE_NAME}=`)) {
      return decodeURIComponent(cookie.slice(`${APP_AUTH_COOKIE_NAME}=`.length));
    }
  }

  return null;
}

function compareAccountsForFallback(
  left: OrganizationAccountRecord,
  right: OrganizationAccountRecord,
) {
  return (
    getRoleRank(left.role) - getRoleRank(right.role) ||
    left.createdAt.localeCompare(right.createdAt) ||
    left.email.localeCompare(right.email)
  );
}

function getRoleRank(role: OrganizationAccountRecord["role"]) {
  switch (role) {
    case "admin":
      return 0;
    case "operator":
      return 1;
    case "analyst":
      return 2;
    case "viewer":
      return 3;
  }
}
