import { z } from "zod";

import { type SettingsRepository } from "@/features/settings/repositories/settings-repository";
import {
  connectIntegration,
  disconnectIntegration,
  updateSettingsRecord,
} from "@/features/settings/server/settings-record-service";

const requestSchema = z.object({
  action: z.enum(["connect", "disconnect"]),
  integrationTitle: z.string().min(1),
  orgId: z.string().min(1),
});

type Deps = Readonly<{
  now?: () => string;
  settingsRepository: SettingsRepository;
}>;

export async function handleIntegrationConnectRequest(
  request: Request,
  dependencies: Deps,
) {
  const parsedBody = requestSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return Response.json(
      { error: "Invalid payload. Expected orgId, integrationTitle, and action." },
      { status: 400 },
    );
  }

  const { action, integrationTitle, orgId } = parsedBody.data;

  const updatedSettings = await updateSettingsRecord({
    now: dependencies.now,
    orgId,
    settingsRepository: dependencies.settingsRepository,
    updater: (record) =>
      action === "connect"
        ? connectIntegration(record, integrationTitle)
        : disconnectIntegration(record, integrationTitle),
  });

  return Response.json(
    {
      integrations: updatedSettings.integrations,
      orgId,
    },
    { status: 200 },
  );
}
