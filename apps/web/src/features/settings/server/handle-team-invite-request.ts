import { z } from "zod";

import { createOrganizationAccount } from "@/features/accounts/domain/organization-account";
import { type AccountRepository } from "@/features/accounts/repositories/account-repository";
import { createOrganizationRecordFromSettingsRecord } from "@/features/settings/domain/organization-record";
import { type OrganizationRepository } from "@/features/settings/repositories/organization-repository";
import { type SettingsRepository } from "@/features/settings/repositories/settings-repository";
import {
  getSettingsPageDataFromRepository,
  getSettingsRecord,
  settingsInviteInputSchema,
  updateSettingsRecord,
  upsertInvitedTeamMember,
} from "@/features/settings/server/settings-record-service";

const teamInviteRequestSchema = z.object({
  invite: settingsInviteInputSchema,
  orgId: z.string().min(1),
});

type TeamInviteDependencies = Readonly<{
  accountRepository?: AccountRepository;
  now?: () => string;
  organizationRepository?: OrganizationRepository;
  settingsRepository?: SettingsRepository;
}>;

export async function handleTeamInviteRequest(
  request: Request,
  dependencies: TeamInviteDependencies,
) {
  const parsedBody = teamInviteRequestSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return Response.json(
      {
        error: "Invalid invite payload.",
      },
      { status: 400 },
    );
  }

  if (dependencies.accountRepository !== undefined) {
    await ensureOrganizationExists(parsedBody.data.orgId, dependencies);

    const existingAccount =
      await dependencies.accountRepository.getByOrgIdAndEmail(
        parsedBody.data.orgId,
        parsedBody.data.invite.email,
      );

    await dependencies.accountRepository.put(
      createOrganizationAccount({
        createdAt: existingAccount?.createdAt,
        email: parsedBody.data.invite.email,
        id: existingAccount?.id,
        name: parsedBody.data.invite.name,
        orgId: parsedBody.data.orgId,
        passwordHash: existingAccount?.passwordHash,
        role: parsedBody.data.invite.role,
        status: existingAccount?.status === "active" ? "active" : "invited",
        updatedAt: dependencies.now?.() ?? new Date().toISOString(),
        userId: existingAccount?.userId,
      }),
    );
  } else if (dependencies.settingsRepository !== undefined) {
    await updateSettingsRecord({
      now: dependencies.now,
      orgId: parsedBody.data.orgId,
      settingsRepository: dependencies.settingsRepository,
      updater: (settingsRecord) => upsertInvitedTeamMember(
        settingsRecord,
        parsedBody.data.invite,
      ),
    });
  } else {
    return Response.json(
      {
        error: "Team member persistence is not configured.",
      },
      { status: 500 },
    );
  }

  const data = await getSettingsPageDataFromRepository({
    accountRepository: dependencies.accountRepository,
    orgId: parsedBody.data.orgId,
    organizationRepository: dependencies.organizationRepository,
    settingsRepository: dependencies.settingsRepository,
  });

  return Response.json(
    {
      member: data.team.members.find(
        (member) => member.email === parsedBody.data.invite.email,
      ),
      orgId: parsedBody.data.orgId,
      team: data.team,
    },
    { status: 201 },
  );
}

async function ensureOrganizationExists(
  orgId: string,
  dependencies: TeamInviteDependencies,
) {
  if (dependencies.organizationRepository === undefined) {
    return;
  }

  const existingOrganization = await dependencies.organizationRepository.getById(orgId);

  if (existingOrganization !== null) {
    return;
  }

  const settingsRecord = await getSettingsRecord(
    dependencies.settingsRepository,
    orgId,
  );

  await dependencies.organizationRepository.put(
    createOrganizationRecordFromSettingsRecord(settingsRecord, {
      updatedAt: dependencies.now?.() ?? settingsRecord.updatedAt,
    }),
  );
}
