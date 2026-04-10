import { z } from "zod";

import { type CurrentAppActor } from "@/features/auth/server/current-app-actor";
import { type SettingsRepository } from "@/features/settings/repositories/settings-repository";
import {
  canManagePeopleAccessSettings,
  requireSettingsActor,
} from "@/features/settings/server/settings-authorization";
import {
  revokeSession,
  updateSettingsRecord,
} from "@/features/settings/server/settings-record-service";

const sessionRevokeRequestSchema = z.object({
  orgId: z.string().min(1),
  title: z.string().min(1),
});

type SessionRevokeDependencies = Readonly<{
  currentActor: CurrentAppActor | null;
  now?: () => string;
  settingsRepository: SettingsRepository;
}>;

export async function handleSessionRevokeRequest(
  request: Request,
  dependencies: SessionRevokeDependencies,
) {
  const parsedBody = sessionRevokeRequestSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return Response.json(
      {
        error: "Invalid session revoke payload.",
      },
      { status: 400 },
    );
  }

  const actorResult = requireSettingsActor(dependencies.currentActor);

  if (actorResult.response !== null) {
    return actorResult.response;
  }

  if (!canManagePeopleAccessSettings(dependencies.currentActor)) {
    return Response.json(
      {
        error: "Only admins can manage active sessions.",
      },
      { status: 403 },
    );
  }

  const updatedSettings = await updateSettingsRecord({
    now: dependencies.now,
    orgId: parsedBody.data.orgId,
    settingsRepository: dependencies.settingsRepository,
    updater: (settingsRecord) => revokeSession(settingsRecord, parsedBody.data.title),
  });

  return Response.json(
    {
      orgId: parsedBody.data.orgId,
      sessions: updatedSettings.securitySessions,
    },
    { status: 200 },
  );
}
