import { cookies } from "next/headers";
import { AppShell } from "@/features/shell/components/app-shell";
import { APP_AUTH_COOKIE_NAME, resolveCurrentAppActor } from "@/features/auth/server/current-app-actor";
import { resolveServerPaths } from "@/features/config/server-env";
import { DEFAULT_WORKSPACE } from "@/features/foundation/domain/default-workspace";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";
import type { ReactNode } from "react";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const actor = await resolveCurrentAppActor({
    accountRepository: localIngestionRuntime.accountRepository,
    authSecret: resolveServerPaths().authSecret,
    cookieValue: cookieStore.get(APP_AUTH_COOKIE_NAME)?.value,
    orgId: DEFAULT_WORKSPACE.orgId,
  });
  const currentUser =
    actor === null
      ? null
      : {
          initials: actor.account.name
            .split(" ")
            .map((part) => part.charAt(0))
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          name: actor.account.name,
          role:
            actor.account.role.charAt(0).toUpperCase() +
            actor.account.role.slice(1),
        };

  return <AppShell currentUser={currentUser}>{children}</AppShell>;
}
