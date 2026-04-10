import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createOrganizationAccount } from "@/features/accounts/domain/organization-account";
import { createLocalAccountRepository } from "@/features/accounts/repositories/local-account-repository";
import { createBillingAccount } from "@/features/cost/domain/billing-account";
import { createBillingPaymentMethod } from "@/features/cost/domain/billing-payment-method";
import { createLlmUsageEvent } from "@/features/cost/domain/llm-usage-event";
import { createLocalBillingAccountRepository } from "@/features/cost/repositories/local-billing-account-repository";
import { createLocalBillingPaymentMethodRepository } from "@/features/cost/repositories/local-billing-payment-method-repository";
import { createLocalLlmUsageEventRepository } from "@/features/cost/repositories/local-llm-usage-event-repository";
import { settingsPreferenceIds } from "@/features/settings/domain/settings-preferences";
import { handleSettingsPageRequest } from "@/features/settings/server/handle-settings-page-request";
import { createLocalSettingsRepository } from "@/features/settings/repositories/local-settings-repository";
import { createDefaultSettingsRecord } from "@/features/settings/domain/settings-record";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("handleSettingsPageRequest", () => {
  it("requires an orgId query parameter", async () => {
    const response = await handleSettingsPageRequest(
      new Request("http://localhost/api/settings"),
    );

    expect(response.status).toBe(400);
  });

  it("returns the settings surface for a valid workspace", async () => {
    const response = await handleSettingsPageRequest(
      new Request("http://localhost/api/settings?orgId=org_123"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      organization: expect.objectContaining({
        name: "Broward HVAC Co.",
      }),
      tabs: expect.arrayContaining([
        expect.objectContaining({ label: "Organization" }),
        expect.objectContaining({ label: "Security" }),
      ]),
    });
  });

  it("returns persisted settings data and account-backed team members when records exist", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-settings-page-"),
    );
    temporaryDirectories.push(rootDirectory);

    const accountRepository = createLocalAccountRepository({ rootDirectory });
    const settingsRepository = createLocalSettingsRepository({ rootDirectory });

    await settingsRepository.put(
      createDefaultSettingsRecord("org_123", "2026-04-10T01:00:00.000Z"),
    );
    await settingsRepository.put({
      ...(await settingsRepository.getByOrgId("org_123"))!,
      organization: {
        ...createDefaultSettingsRecord("org_123").organization,
        name: "Precision Plumbing Co.",
      },
      preferences: [
        {
          description: "Persisted preference.",
          enabled: false,
          id: settingsPreferenceIds.compactDashboardDensity,
          title: "Compact dashboard density",
        },
      ],
      updatedAt: "2026-04-10T02:00:00.000Z",
    });
    await accountRepository.put(
      createOrganizationAccount({
        email: "admin@example.com",
        name: "Admin User",
        orgId: "org_123",
        role: "admin",
        status: "active",
      }),
    );

    const response = await handleSettingsPageRequest(
      new Request("http://localhost/api/settings?orgId=org_123"),
      {
        accountRepository,
        settingsRepository,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      organization: expect.objectContaining({
        name: "Precision Plumbing Co.",
      }),
      preferences: expect.arrayContaining([
        expect.objectContaining({
          enabled: false,
          title: "Compact dashboard density",
        }),
      ]),
      team: {
        members: expect.arrayContaining([
          expect.objectContaining({
            accessSummary: "Setup, Ops, Reports",
            email: "admin@example.com",
            role: "Admin",
          }),
        ]),
      },
    });
  });

  it("returns computed billing data from tracked LLM usage", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-settings-billing-"),
    );
    temporaryDirectories.push(rootDirectory);

    const billingAccountRepository = createLocalBillingAccountRepository({
      rootDirectory,
    });
    const billingPaymentMethodRepository = createLocalBillingPaymentMethodRepository({
      rootDirectory,
    });
    const llmUsageEventRepository = createLocalLlmUsageEventRepository({
      rootDirectory,
    });

    await billingAccountRepository.put(
      createBillingAccount({
        billingAnchorDayOfMonth: 9,
        createdAt: "2026-04-01T00:00:00.000Z",
        id: "org_123",
        monthlyPlatformFeeCents: 14_900,
        orgId: "org_123",
        planName: "Growth",
        profitPremiumBasisPoints: 2_000,
        status: "active",
        updatedAt: "2026-04-01T00:00:00.000Z",
        usageCapCents: 25_000,
      }),
    );
    await billingPaymentMethodRepository.put(
      createBillingPaymentMethod({
        brand: "visa",
        cardholderName: "Broward HVAC Co.",
        createdAt: "2026-04-01T00:00:00.000Z",
        expMonth: 5,
        expYear: 2028,
        id: "billing_payment_method_org_123_primary",
        last4: "4242",
        orgId: "org_123",
        postalCode: "33301",
        role: "primary",
        updatedAt: "2026-04-01T00:00:00.000Z",
      }),
    );
    await billingPaymentMethodRepository.put(
      createBillingPaymentMethod({
        brand: "mastercard",
        cardholderName: "Broward HVAC Backup",
        createdAt: "2026-04-01T00:00:00.000Z",
        expMonth: 6,
        expYear: 2029,
        id: "billing_payment_method_org_123_backup",
        last4: "4444",
        orgId: "org_123",
        postalCode: "33309",
        role: "backup",
        updatedAt: "2026-04-01T00:00:00.000Z",
      }),
    );
    await llmUsageEventRepository.put(
      createLlmUsageEvent({
        billableCostNanoUsd: 4_800_000_000,
        cachedInputTokens: 100,
        createdAt: "2026-04-10T02:00:00.000Z",
        feature: "extraction",
        id: "usage_123",
        inputTokens: 1_100,
        model: "gpt-5-mini",
        operation: "generic-document-extraction",
        orgId: "org_123",
        outputTokens: 2_000,
        pricingAvailable: true,
        pricingSource: "gpt-5-mini",
        pricingVersion: "openai-api-pricing-2026-04-09",
        profitPremiumBasisPoints: 2_000,
        provider: "openai",
        providerInputCostNanoUsd: 275_000_000,
        providerOutputCostNanoUsd: 3_725_000_000,
        providerTotalCostNanoUsd: 4_000_000_000,
        totalTokens: 3_100,
      }),
    );

    const response = await handleSettingsPageRequest(
      new Request("http://localhost/api/settings?orgId=org_123"),
      {
        billingAccountRepository,
        billingPaymentMethodRepository,
        llmUsageEventRepository,
        now: () => "2026-04-11T02:00:00.000Z",
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
            roleLabel: "Business card",
          }),
          expect.objectContaining({
            brandLabel: "Mastercard",
            last4: "4444",
            role: "backup",
            roleLabel: "Backup card",
          }),
        ]),
        planTitle: "Growth plan",
        usageCapCents: 25_000,
        usage: expect.arrayContaining([
          expect.objectContaining({
            label: "Usage this period",
            value: "$4.80",
          }),
          expect.objectContaining({
            label: "Current total",
            value: "$153.80",
          }),
        ]),
      }),
    });
  });
});
