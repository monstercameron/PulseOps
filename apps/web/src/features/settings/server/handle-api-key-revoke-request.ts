import { z } from "zod";

import { type SettingsRepository } from "@/features/settings/repositories/settings-repository";
import {
  revokeApiKey,
  updateSettingsRecord,
} from "@/features/settings/server/settings-record-service";

const apiKeyRevokeRequestSchema = z.object({
  name: z.string().min(1),
  orgId: z.string().min(1),
});

type ApiKeyRevokeDependencies = Readonly<{
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
