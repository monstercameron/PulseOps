import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createOrganizationAccount } from "@/features/accounts/domain/organization-account";
import { createLocalAccountRepository } from "@/features/accounts/repositories/local-account-repository";
import { buildAuthSessionFromAccount } from "@/features/auth/server/current-app-actor";
import { createLocalBillingAccountRepository } from "@/features/cost/repositories/local-billing-account-repository";
import { createLocalBillingPaymentMethodRepository } from "@/features/cost/repositories/local-billing-payment-method-repository";
import { type OrganizationRecord } from "@/features/settings/domain/organization-record";
import { createLocalSettingsRepository } from "@/features/settings/repositories/local-settings-repository";
import { handleApiKeyRevokeRequest } from "@/features/settings/server/handle-api-key-revoke-request";
import { handleSessionRevokeRequest } from "@/features/settings/server/handle-session-revoke-request";
import { handleSettingsUpdateRequest } from "@/features/settings/server/handle-settings-update-request";
import { handleTeamInviteRequest } from "@/features/settings/server/handle-team-invite-request";

const temporaryDirectories: string[] = [];

function createCurrentActor(
  input: Readonly<{
    email?: string;
    name?: string;
    operationsAccess?: boolean;
    orgId?: string;
    reportAccess?: boolean;
    role?: "admin" | "analyst" | "operator" | "viewer";
    setupAccess?: boolean;
    userId?: string;
  }> = {},
) {
  const account = createOrganizationAccount({
    email: input.email ?? "admin@example.com",
    name: input.name ?? "Admin User",
    operationsAccess: input.operationsAccess,
    orgId: input.orgId ?? "org_123",
    reportAccess: input.reportAccess,
    role: input.role ?? "admin",
    setupAccess: input.setupAccess,
    status: "active",
    userId: input.userId ?? `user_${input.role ?? "admin"}`,
  });

  return {
    account,
    session: buildAuthSessionFromAccount(account, "2026-04-10T00:00:00.000Z"),
    source: "token" as const,
  };
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("settings mutation handlers", () => {
  it("persists organization and notification updates", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-settings-update-"),
    );
    temporaryDirectories.push(rootDirectory);

    const settingsRepository = createLocalSettingsRepository({ rootDirectory });
    const persistedOrganizations: OrganizationRecord[] = [];
    const response = await handleSettingsUpdateRequest(
      new Request("http://localhost/api/settings", {
        body: JSON.stringify({
          notifications: [
            {
              id: "briefs",
              items: [
                {
                  description: "Send the weekly brief every Monday morning.",
                  enabled: false,
                  title: "Cash and margin brief email",
                },
              ],
              title: "Weekly briefs",
            },
          ],
          orgId: "org_123",
          organization: {
            industry: "Plumbing / Field service",
            invoiceCycle: "Bi-weekly",
            location: "Miami, FL",
            name: "Precision Plumbing Co.",
            revenueModel: "Project-based",
            teamSize: "11-25 people",
          },
        }),
        method: "PATCH",
      }),
      {
        currentActor: createCurrentActor(),
        now: () => "2026-04-10T02:00:00.000Z",
        organizationRepository: {
          async getById() {
            return null;
          },
          async list() {
            return persistedOrganizations;
          },
          async put(organizationRecord) {
            persistedOrganizations.push(organizationRecord);

            return organizationRecord;
          },
        },
        settingsRepository,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      notifications: [
        expect.objectContaining({
          items: [expect.objectContaining({ enabled: false })],
        }),
      ],
      organization: expect.objectContaining({
        name: "Precision Plumbing Co.",
      }),
    });
    expect(persistedOrganizations).toEqual([
      expect.objectContaining({
        id: "org_123",
        name: "Precision Plumbing Co.",
      }),
    ]);
  });

  it("persists a monthly usage cap without requiring other settings changes", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-settings-billing-cap-"),
    );
    temporaryDirectories.push(rootDirectory);

    const billingAccountRepository = createLocalBillingAccountRepository({
      rootDirectory,
    });
    const settingsRepository = createLocalSettingsRepository({ rootDirectory });
    const response = await handleSettingsUpdateRequest(
      new Request("http://localhost/api/settings", {
        body: JSON.stringify({
          billing: {
            usageCapCents: 35_000,
          },
          orgId: "org_123",
        }),
        method: "PATCH",
      }),
      {
        billingAccountRepository,
        currentActor: createCurrentActor(),
        now: () => "2026-04-10T02:00:00.000Z",
        settingsRepository,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      billing: expect.objectContaining({
        usageCapCents: 35_000,
      }),
    });
    await expect(
      billingAccountRepository.getByOrgId("org_123"),
    ).resolves.toMatchObject({
      usageCapCents: 35_000,
    });
  });

  it("persists website details without requiring unrelated settings changes", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-settings-website-details-"),
    );
    temporaryDirectories.push(rootDirectory);

    const settingsRepository = createLocalSettingsRepository({ rootDirectory });
    const response = await handleSettingsUpdateRequest(
      new Request("http://localhost/api/settings", {
        body: JSON.stringify({
          orgId: "org_123",
          websiteDetails: {
            mainPhone: "(561) 555-0110",
            partnershipsEmail: "alliances@precisionplumbing.com",
            pressEmail: "media@precisionplumbing.com",
            salesEmail: "sales@precisionplumbing.com",
            supportEmail: "support@precisionplumbing.com",
            supportPhone: "(561) 555-0198",
          },
        }),
        method: "PATCH",
      }),
      {
        currentActor: createCurrentActor(),
        now: () => "2026-04-10T02:00:00.000Z",
        settingsRepository,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      websiteDetails: {
        mainPhone: "(561) 555-0110",
        partnershipsEmail: "alliances@precisionplumbing.com",
        pressEmail: "media@precisionplumbing.com",
        salesEmail: "sales@precisionplumbing.com",
        supportEmail: "support@precisionplumbing.com",
        supportPhone: "(561) 555-0198",
      },
    });
    await expect(settingsRepository.getByOrgId("org_123")).resolves.toMatchObject({
      websiteDetails: {
        mainPhone: "(561) 555-0110",
        partnershipsEmail: "alliances@precisionplumbing.com",
        pressEmail: "media@precisionplumbing.com",
        salesEmail: "sales@precisionplumbing.com",
        supportEmail: "support@precisionplumbing.com",
        supportPhone: "(561) 555-0198",
      },
    });
  });

  it("lets an operator update notification settings", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-settings-operator-notifications-"),
    );
    temporaryDirectories.push(rootDirectory);

    const settingsRepository = createLocalSettingsRepository({ rootDirectory });
    const response = await handleSettingsUpdateRequest(
      new Request("http://localhost/api/settings", {
        body: JSON.stringify({
          notifications: [
            {
              id: "pipeline",
              items: [
                {
                  description: "Notify when more than two files fail in a single sync.",
                  enabled: false,
                  title: "Parse failure email alert",
                },
              ],
              title: "Pipeline alerts",
            },
          ],
          orgId: "org_123",
        }),
        method: "PATCH",
      }),
      {
        currentActor: createCurrentActor({
          email: "ops@example.com",
          name: "Ops User",
          operationsAccess: true,
          reportAccess: false,
          role: "operator",
          setupAccess: true,
          userId: "user_ops",
        }),
        now: () => "2026-04-10T02:00:00.000Z",
        settingsRepository,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      notifications: [
        expect.objectContaining({
          items: [expect.objectContaining({ enabled: false })],
        }),
      ],
    });
  });

  it("persists operational delivery, data policy, and import rule settings", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-settings-operational-config-"),
    );
    temporaryDirectories.push(rootDirectory);

    const settingsRepository = createLocalSettingsRepository({ rootDirectory });
    const response = await handleSettingsUpdateRequest(
      new Request("http://localhost/api/settings", {
        body: JSON.stringify({
          dataPolicy: {
            embeddingsEnabled: false,
            extractionEnabled: true,
            humanReviewRequired: true,
            reviewThresholds: {
              acceptanceRateDriftThreshold: 0.15,
              briefHighConfidenceFloor: 0.9,
              classificationConfidenceFloor: 0.8,
              fieldConfidenceFloor: 0.72,
              outcomeRateDriftThreshold: 0.2,
              parserConfidenceFloor: 0.82,
            },
            sourceRetentionDays: {
              api: 120,
              email: 21,
              upload: 14,
            },
          },
          deliverySettings: {
            confidenceDropAlert: {
              enabled: true,
              recipientEmails: ["ops@example.com"],
              threshold: 0.78,
            },
            parseFailureAlert: {
              enabled: true,
              failureCountThreshold: 3,
              recipientEmails: ["ops@example.com", "owner@example.com"],
            },
            queueDigest: {
              enabled: true,
              recipientEmails: ["queue@example.com"],
              sendTimeLocal: "08:30",
            },
            sourceDisconnectedAlert: {
              enabled: true,
              recipientEmails: ["owner@example.com"],
            },
            weeklyBrief: {
              enabled: true,
              recipientEmails: ["briefs@example.com"],
              sendDay: "wednesday",
              sendTimeLocal: "06:45",
            },
          },
          importRules: [
            {
              id: "rule_upload_invoice",
              name: "Manual upload -> customer invoice",
              parserRoute: "tabular",
              sourceKind: "upload",
              status: "active",
              targetDocumentFamily: "customer-invoice",
            },
            {
              id: "rule_email_vendor_bill",
              name: "AP inbox -> vendor bill",
              parserRoute: "text",
              sourceKind: "email",
              status: "draft",
              targetDocumentFamily: "vendor-bill",
            },
          ],
          orgId: "org_123",
        }),
        method: "PATCH",
      }),
      {
        currentActor: createCurrentActor(),
        now: () => "2026-04-10T02:30:00.000Z",
        settingsRepository,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      dataPolicy: {
        embeddingsEnabled: false,
        humanReviewRequired: true,
        reviewThresholds: expect.objectContaining({
          parserConfidenceFloor: 0.82,
        }),
        sourceRetentionDays: {
          api: 120,
          email: 21,
          upload: 14,
        },
      },
      deliverySettings: {
        parseFailureAlert: expect.objectContaining({
          failureCountThreshold: 3,
          recipientEmails: ["ops@example.com", "owner@example.com"],
        }),
        weeklyBrief: expect.objectContaining({
          sendDay: "wednesday",
          sendTimeLocal: "06:45",
        }),
      },
      importRules: [
        expect.objectContaining({
          id: "rule_upload_invoice",
          targetDocumentFamily: "customer-invoice",
        }),
        expect.objectContaining({
          id: "rule_email_vendor_bill",
          status: "draft",
        }),
      ],
    });
    await expect(settingsRepository.getByOrgId("org_123")).resolves.toMatchObject({
      dataPolicy: {
        sourceRetentionDays: {
          api: 120,
          email: 21,
          upload: 14,
        },
      },
      deliverySettings: {
        queueDigest: expect.objectContaining({
          enabled: true,
          sendTimeLocal: "08:30",
        }),
      },
      importRules: [
        expect.objectContaining({
          id: "rule_upload_invoice",
        }),
        expect.objectContaining({
          id: "rule_email_vendor_bill",
        }),
      ],
    });
  });

  it("blocks analyst workspace edits and operator billing edits", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-settings-forbidden-"),
    );
    temporaryDirectories.push(rootDirectory);

    const billingAccountRepository = createLocalBillingAccountRepository({
      rootDirectory,
    });
    const settingsRepository = createLocalSettingsRepository({ rootDirectory });

    const analystWorkspaceResponse = await handleSettingsUpdateRequest(
      new Request("http://localhost/api/settings", {
        body: JSON.stringify({
          orgId: "org_123",
          websiteDetails: {
            mainPhone: "(561) 555-0110",
            partnershipsEmail: "alliances@precisionplumbing.com",
            pressEmail: "media@precisionplumbing.com",
            salesEmail: "sales@precisionplumbing.com",
            supportEmail: "support@precisionplumbing.com",
            supportPhone: "(561) 555-0198",
          },
        }),
        method: "PATCH",
      }),
      {
        currentActor: createCurrentActor({
          email: "analyst@example.com",
          name: "Analyst User",
          operationsAccess: false,
          reportAccess: true,
          role: "analyst",
          setupAccess: false,
          userId: "user_analyst",
        }),
        settingsRepository,
      },
    );

    expect(analystWorkspaceResponse.status).toBe(403);
    await expect(analystWorkspaceResponse.json()).resolves.toMatchObject({
      error: "Only users with setup access can update workspace settings.",
    });

    const operatorBillingResponse = await handleSettingsUpdateRequest(
      new Request("http://localhost/api/settings", {
        body: JSON.stringify({
          billing: {
            usageCapCents: 20_000,
          },
          orgId: "org_123",
        }),
        method: "PATCH",
      }),
      {
        billingAccountRepository,
        currentActor: createCurrentActor({
          email: "ops@example.com",
          name: "Ops User",
          operationsAccess: true,
          reportAccess: false,
          role: "operator",
          setupAccess: true,
          userId: "user_ops",
        }),
        settingsRepository,
      },
    );

    expect(operatorBillingResponse.status).toBe(403);
    await expect(operatorBillingResponse.json()).resolves.toMatchObject({
      error: "Only admins can update billing settings.",
    });
  });

  it("stores masked primary and backup billing cards", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-settings-payment-methods-"),
    );
    temporaryDirectories.push(rootDirectory);

    const billingAccountRepository = createLocalBillingAccountRepository({
      rootDirectory,
    });
    const billingPaymentMethodRepository = createLocalBillingPaymentMethodRepository({
      rootDirectory,
    });
    const settingsRepository = createLocalSettingsRepository({ rootDirectory });
    const response = await handleSettingsUpdateRequest(
      new Request("http://localhost/api/settings", {
        body: JSON.stringify({
          billing: {
            backupCard: {
              cardNumber: "5555 5555 5555 4444",
              cardholderName: "Backup Ops Card",
              cvc: "456",
              expMonth: 6,
              expYear: 2029,
              postalCode: "33309",
            },
            primaryCard: {
              cardNumber: "4242 4242 4242 4242",
              cardholderName: "Broward HVAC Co.",
              cvc: "123",
              expMonth: 5,
              expYear: 2028,
              postalCode: "33301",
            },
          },
          orgId: "org_123",
        }),
        method: "PATCH",
      }),
      {
        billingAccountRepository,
        billingPaymentMethodRepository,
        currentActor: createCurrentActor(),
        now: () => "2026-04-10T02:00:00.000Z",
        settingsRepository,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      billing: expect.objectContaining({
        paymentMethods: expect.arrayContaining([
          expect.objectContaining({
            brandLabel: "Visa",
            last4: "4242",
            role: "primary",
          }),
          expect.objectContaining({
            brandLabel: "Mastercard",
            last4: "4444",
            role: "backup",
          }),
        ]),
      }),
    });
    await expect(
      billingPaymentMethodRepository.getByOrgIdAndRole("org_123", "primary"),
    ).resolves.toMatchObject({
      brand: "visa",
      cardholderName: "Broward HVAC Co.",
      last4: "4242",
    });
    await expect(
      billingPaymentMethodRepository.getByOrgIdAndRole("org_123", "backup"),
    ).resolves.toMatchObject({
      brand: "mastercard",
      cardholderName: "Backup Ops Card",
      last4: "4444",
    });
  });

  it("adds invited team members and revokes sessions and api keys", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-settings-actions-"),
    );
    temporaryDirectories.push(rootDirectory);

    const accountRepository = createLocalAccountRepository({ rootDirectory });
    const settingsRepository = createLocalSettingsRepository({ rootDirectory });

    const inviteResponse = await handleTeamInviteRequest(
      new Request("http://localhost/api/settings/team/invitations", {
        body: JSON.stringify({
          invite: {
            email: "ops2@browardhvac.com",
            name: "Ops User",
            role: "operator",
          },
          orgId: "org_123",
        }),
        method: "POST",
      }),
      {
        accountRepository,
        currentActor: createCurrentActor(),
        settingsRepository,
      },
    );

    expect(inviteResponse.status).toBe(201);
    await expect(inviteResponse.json()).resolves.toMatchObject({
      member: expect.objectContaining({
        accessSummary: "Setup, Ops",
        email: "ops2@browardhvac.com",
        role: "Operator",
        status: "invited",
      }),
    });

    const sessionResponse = await handleSessionRevokeRequest(
      new Request("http://localhost/api/settings/security/sessions/revoke", {
        body: JSON.stringify({
          orgId: "org_123",
          title: "Safari on iPhone",
        }),
        method: "POST",
      }),
      {
        currentActor: createCurrentActor(),
        settingsRepository,
      },
    );

    expect(sessionResponse.status).toBe(200);
    await expect(sessionResponse.json()).resolves.toMatchObject({
      sessions: [expect.objectContaining({ title: "Chrome on macOS" })],
    });

    const apiKeyResponse = await handleApiKeyRevokeRequest(
      new Request("http://localhost/api/settings/security/api-keys/revoke", {
        body: JSON.stringify({
          name: "Pipeline integration key",
          orgId: "org_123",
        }),
        method: "POST",
      }),
      {
        currentActor: createCurrentActor(),
        settingsRepository,
      },
    );

    expect(apiKeyResponse.status).toBe(200);
    await expect(apiKeyResponse.json()).resolves.toMatchObject({
      apiKeys: [],
    });
  });

  it("creates an organization record before inviting the first account-backed member", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-settings-org-bootstrap-"),
    );
    temporaryDirectories.push(rootDirectory);

    const accountRepository = createLocalAccountRepository({ rootDirectory });
    const settingsRepository = createLocalSettingsRepository({ rootDirectory });
    const persistedOrganizations: OrganizationRecord[] = [];

    const response = await handleTeamInviteRequest(
      new Request("http://localhost/api/settings/team/invitations", {
        body: JSON.stringify({
          invite: {
            email: "admin@example.com",
            name: "Admin User",
            role: "admin",
          },
          orgId: "org_123",
        }),
        method: "POST",
      }),
      {
        accountRepository,
        currentActor: createCurrentActor(),
        now: () => "2026-04-10T03:00:00.000Z",
        organizationRepository: {
          async getById() {
            return null;
          },
          async list() {
            return persistedOrganizations;
          },
          async put(organizationRecord) {
            persistedOrganizations.push(organizationRecord);

            return organizationRecord;
          },
        },
        settingsRepository,
      },
    );

    expect(response.status).toBe(201);
    expect(persistedOrganizations).toEqual([
      expect.objectContaining({
        id: "org_123",
        name: "Broward HVAC Co.",
      }),
    ]);
  });

  it("keeps existing active account members active when re-invited", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-settings-reinvite-"),
    );
    temporaryDirectories.push(rootDirectory);

    const accountRepository = createLocalAccountRepository({ rootDirectory });
    const settingsRepository = createLocalSettingsRepository({ rootDirectory });

    await accountRepository.put(
      createOrganizationAccount({
        email: "support@example.com",
        name: "Support User",
        orgId: "org_123",
        passwordHash: "existing-hash",
        role: "operator",
        status: "active",
      }),
    );

    const response = await handleTeamInviteRequest(
      new Request("http://localhost/api/settings/team/invitations", {
        body: JSON.stringify({
          invite: {
            email: "support@example.com",
            name: "Updated Support User",
            role: "operator",
          },
          orgId: "org_123",
        }),
        method: "POST",
      }),
      {
        accountRepository,
        currentActor: createCurrentActor(),
        settingsRepository,
      },
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      member: expect.objectContaining({
        email: "support@example.com",
        name: "Updated Support User",
        status: "active",
        statusLabel: "Active",
      }),
    });
    await expect(
      accountRepository.getByOrgIdAndEmail("org_123", "support@example.com"),
    ).resolves.toMatchObject({
      name: "Updated Support User",
      passwordHash: "existing-hash",
      status: "active",
    });
  });
});
