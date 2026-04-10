import { z } from "zod";

import {
  canEditAccountIdentity,
  canManageAccountAuthorization,
  canResetAccountPassword,
} from "@/features/accounts/domain/account-authorization";
import {
  createOrganizationAccount,
  organizationAccountRoleSchema,
  organizationAccountStatusSchema,
} from "@/features/accounts/domain/organization-account";
import { type AccountRepository } from "@/features/accounts/repositories/account-repository";
import { type CurrentAppActor } from "@/features/auth/server/current-app-actor";
import { hashPassword } from "@/features/auth/domain/password-credential";
import { type BillingAccountRepository } from "@/features/cost/repositories/billing-account-repository";
import { type LlmUsageEventRepository } from "@/features/cost/repositories/llm-usage-event-repository";
import { getSettingsBillingData } from "@/features/cost/server/settings-billing-data";
import { type OrganizationRepository } from "@/features/settings/repositories/organization-repository";
import { type SettingsRepository } from "@/features/settings/repositories/settings-repository";
import { getSettingsPageDataFromRepository } from "@/features/settings/server/settings-record-service";

const accountUpdateRequestSchema = z.object({
  account: z.object({
    email: z.string().email(),
    name: z.string().trim().min(1),
    operationsAccess: z.boolean().optional(),
    password: z.string().trim().min(8).max(128).optional(),
    reportAccess: z.boolean().optional(),
    role: organizationAccountRoleSchema.optional(),
    setupAccess: z.boolean().optional(),
    status: organizationAccountStatusSchema.exclude(["disabled"]).optional(),
  }),
  orgId: z.string().min(1),
});

type TeamAccountUpdateDependencies = Readonly<{
  accountRepository: AccountRepository;
  billingAccountRepository?: BillingAccountRepository;
  currentActor?: CurrentAppActor | null;
  llmUsageEventRepository?: LlmUsageEventRepository;
  memberId: string;
  now?: () => string;
  organizationRepository?: OrganizationRepository;
  settingsRepository?: SettingsRepository;
}>;

export async function handleTeamAccountUpdateRequest(
  request: Request,
  dependencies: TeamAccountUpdateDependencies,
) {
  const parsedBody = accountUpdateRequestSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return Response.json(
      {
        error: "Invalid account update payload.",
      },
      { status: 400 },
    );
  }

  if (dependencies.currentActor === null) {
    return Response.json(
      {
        error: "You must be signed in to update accounts.",
      },
      { status: 401 },
    );
  }

  const actor = dependencies.currentActor?.account;

  if (actor === undefined) {
    return Response.json(
      {
        error: "Current actor context is required.",
      },
      { status: 500 },
    );
  }

  const accounts = await dependencies.accountRepository.listByOrgId(
    parsedBody.data.orgId,
  );
  const targetAccount = accounts.find(
    (account) => account.id === dependencies.memberId,
  );

  if (targetAccount === undefined) {
    return Response.json(
      {
        error: "Account not found for this organization.",
      },
      { status: 404 },
    );
  }

  if (!canEditAccountIdentity(actor, targetAccount)) {
    return Response.json(
      {
        error: "You do not have access to update this account.",
      },
      { status: 403 },
    );
  }

  const hasAuthorizationChanges =
    parsedBody.data.account.role !== undefined ||
    parsedBody.data.account.status !== undefined ||
    parsedBody.data.account.setupAccess !== undefined ||
    parsedBody.data.account.operationsAccess !== undefined ||
    parsedBody.data.account.reportAccess !== undefined;

  if (hasAuthorizationChanges) {
    if (!canManageAccountAuthorization(actor, targetAccount)) {
      return Response.json(
        {
          error:
            actor.userId === targetAccount.userId
              ? "Use another admin account to change your own role or access."
              : "Only admins can change account role or access settings.",
        },
        { status: 403 },
      );
    }
  }

  if (
    parsedBody.data.account.password !== undefined &&
    !canResetAccountPassword(actor, targetAccount)
  ) {
    return Response.json(
      {
        error: "You do not have access to reset this password.",
      },
      { status: 403 },
    );
  }

  const existingEmailAccount =
    await dependencies.accountRepository.getByOrgIdAndEmail(
      parsedBody.data.orgId,
      parsedBody.data.account.email,
    );

  if (
    existingEmailAccount !== null &&
    existingEmailAccount.id !== targetAccount.id
  ) {
    return Response.json(
      {
        error: "Another team account already uses that email address.",
      },
      { status: 409 },
    );
  }

  const updatedAccount = createOrganizationAccount({
    ...targetAccount,
    email: parsedBody.data.account.email,
    name: parsedBody.data.account.name,
    operationsAccess:
      parsedBody.data.account.operationsAccess ?? targetAccount.operationsAccess,
    passwordHash:
      parsedBody.data.account.password !== undefined
        ? hashPassword(parsedBody.data.account.password)
        : targetAccount.passwordHash,
    reportAccess:
      parsedBody.data.account.reportAccess ?? targetAccount.reportAccess,
    role: parsedBody.data.account.role ?? targetAccount.role,
    setupAccess:
      parsedBody.data.account.setupAccess ?? targetAccount.setupAccess,
    status: parsedBody.data.account.status ?? targetAccount.status,
    updatedAt: dependencies.now?.() ?? new Date().toISOString(),
  });

  await dependencies.accountRepository.put(updatedAccount);

  const billing = await getSettingsBillingData({
    billingAccountRepository: dependencies.billingAccountRepository,
    llmUsageEventRepository: dependencies.llmUsageEventRepository,
    now: dependencies.now,
    orgId: parsedBody.data.orgId,
  });
  const data = await getSettingsPageDataFromRepository({
    accountRepository: dependencies.accountRepository,
    billing,
    currentActorUserId: actor.userId,
    currentActorWasFallback: dependencies.currentActor?.source === "fallback",
    orgId: parsedBody.data.orgId,
    organizationRepository: dependencies.organizationRepository,
    settingsRepository: dependencies.settingsRepository,
  });

  return Response.json(
    {
      orgId: parsedBody.data.orgId,
      ...data,
    },
    { status: 200 },
  );
}
