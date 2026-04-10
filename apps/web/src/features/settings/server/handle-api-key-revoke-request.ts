import { z } from "zod";

import { type CurrentAppActor } from "@/features/auth/server/current-app-actor";
import { type SettingsRepository } from "@/features/settings/repositories/settings-repository";
import {
  canManagePeopleAccessSettings,
  requireSettingsActor,
} from "@/features/settings/server/settings-authorization";
import {
  revokeApiKey,
  updateSettingsRecord,
} from "@/features/settings/server/settings-record-service";

const apiKeyRevokeRequestSchema = z.object({
  name: z.string().min(1),
  orgId: z.string().min(1),
});

type ApiKeyRevokeDependencies = Readonly<{
  currentActor: CurrentAppActor | null;
  now?: () => string;
  settingsRepository: SettingsRepository;
}>;

export async function handleApiKeyRevokeRequest(
  request: Request,
  dependencies: ApiKeyRevokeDependencies,
) {
  const parsedBody = apiKeyRevokeRequestSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return Response.json(
      {
        error: "Invalid API key revoke payload.",
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
        error: "Only admins can manage API keys.",
      },
      { status: 403 },
    );
  }

  const updatedSettings = await updateSettingsRecord({
    now: dependencies.now,
    orgId: parsedBody.data.orgId,
    settingsRepository: dependencies.settingsRepository,
    updater: (settingsRecord) => revokeApiKey(settingsRecord, parsedBody.data.name),
  });

  return Response.json(
    {
      apiKeys: updatedSettings.securityApiKeys,
      orgId: parsedBody.data.orgId,
    },
    { status: 200 },
  );
}
