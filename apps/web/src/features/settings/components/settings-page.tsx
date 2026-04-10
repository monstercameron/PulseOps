"use client";

import React, { useState } from "react";

import { type OrganizationAccountRole } from "@/features/accounts/domain/organization-account";
import {
  CatalogModalOverlay,
  PlaceholderActionDialog,
} from "@/features/catalog/components/catalog-dialogs";
import { CatalogButton, CatalogCard } from "@/features/catalog/components/catalog-primitives";
import {
  ApiKeyRow,
  DialogFrame,
  FieldGroup,
  IntegrationListItem,
  PillGroup,
  PreferencePanel,
  SelectField,
  SessionRow,
  SettingsActionRow,
  SettingsTabButton,
  TeamMemberRow,
  TextField,
  ToggleRow,
} from "@/features/catalog/components/settings-catalog-blocks";
import { WorkspaceHeader } from "@/features/catalog/components/workspace-catalog-blocks";
import {
  settingsPageLabels,
  type SettingsPageData,
  type SettingsTabId,
} from "@/features/settings/constants/settings-page-content";
import {
  mergeSettingsMutationResponse,
  type SettingsMutationResponse,
} from "@/features/settings/lib/settings-page-state";
import { useUiI18n } from "@/features/i18n/components/ui-i18n-provider";
import {
  type AppTheme,
} from "@/features/shell/lib/theme-preference";

type SettingsPageProps = Readonly<{
  initialData: SettingsPageData;
  orgId: string;
}>;

type DialogId = "account" | "invite" | "revoke-key" | "two-factor" | null;
type PlaceholderAction = Readonly<{
  description?: string;
  title: string;
}> | null;
type OrganizationEditableField = Exclude<keyof SettingsPageData["organization"], "goals">;
type WebsiteDetailsEditableField = keyof SettingsPageData["websiteDetails"];
type InviteRoleLabel = "Admin" | "Operator" | "Analyst" | "Viewer";
type AccountStatusLabel = "Active" | "Invited";
type BillingPaymentMethodRecord = SettingsPageData["billing"]["paymentMethods"][number];
type BillingPaymentMethodRole = BillingPaymentMethodRecord["role"];
type BillingUsageMetricId = SettingsPageData["billing"]["usage"][number]["id"];
type BillingUsageRecord = SettingsPageData["billing"]["usage"][number];
type PaymentMethodDraft = Readonly<{
  cardNumber: string;
  cardholderName: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  postalCode: string;
}>;
type TeamMemberRecord = SettingsPageData["team"]["members"][number];
type TeamAccountDraft = Readonly<{
  email: string;
  id: string;
  name: string;
  operationsAccess: boolean;
  password: string;
  reportAccess: boolean;
  roleLabel: InviteRoleLabel;
  setupAccess: boolean;
  statusLabel: AccountStatusLabel;
}>;
type BillingUsageCapProgress = Readonly<{
  barWidthPercent: number;
  caption: string;
  summary: string;
}>;

const INDUSTRY_OPTIONS = [
  "HVAC / Field service",
  "Plumbing",
  "Electrical",
  "Landscaping",
  "Roofing",
  "Other…",
] as const;

const REVENUE_MODEL_OPTIONS = ["Job-based", "Subscription", "Mixed"] as const;

const INVOICE_CYCLE_OPTIONS = ["Weekly", "Bi-weekly", "Monthly", "Per job"] as const;

const TEAM_SIZE_OPTIONS = [
  "1–4 people",
  "5–10 people",
  "11–25 people",
  "26–50 people",
  "51+ people",
] as const;

const ALL_GOALS = [
  "Improve cash flow visibility",
  "Increase job margin",
  "Reduce overhead costs",
  "Cut time spent on reporting",
  "Reduce cost per job",
] as const;
const INVITE_ROLE_OPTIONS = ["Admin", "Operator", "Analyst", "Viewer"] as const;
const ACCOUNT_STATUS_OPTIONS = ["Active", "Invited"] as const;

const settingsTabIcons: Record<SettingsTabId, React.ReactNode> = {
  organization: <svg fill="currentColor" height="14" viewBox="0 0 18 18" width="14"><path clipRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" fillRule="evenodd" /></svg>,
  team: <svg fill="currentColor" height="14" viewBox="0 0 18 18" width="14"><path d="M9 6a3 3 0 100-6 3 3 0 000 6zM17 6a3 3 0 10-6 0 3 3 0 006 0zM12.93 17H4.07c.08-3.08 2.44-5 4.93-5s4.85 1.92 4.93 5zM14.5 11a3 3 0 10-3 2.83A4.97 4.97 0 0114.5 17H17a3 3 0 000-6z" /></svg>,
  integrations: <svg fill="currentColor" height="14" viewBox="0 0 18 18" width="14"><path clipRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" fillRule="evenodd" /></svg>,
  notifications: <svg fill="currentColor" height="14" viewBox="0 0 18 18" width="14"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a2 2 0 01-2-2h4a2 2 0 01-2 2z" /></svg>,
  security: <svg fill="currentColor" height="14" viewBox="0 0 18 18" width="14"><path clipRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fillRule="evenodd" /></svg>,
  billing: <svg fill="currentColor" height="14" viewBox="0 0 18 18" width="14"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path clipRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" fillRule="evenodd" /></svg>,
  preferences: <svg fill="currentColor" height="14" viewBox="0 0 18 18" width="14"><path d="M3 5a1 1 0 011-1h10a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h4a1 1 0 110 2H4a1 1 0 01-1-1z" /></svg>,
};

type SettingsRequestError = Readonly<{
  error: string;
}>;

export function SettingsPage({ initialData, orgId }: SettingsPageProps) {
  const { messages } = useUiI18n();
  const industryOptions = messages.settingsPage.options.industry as readonly string[];
  const revenueModelOptions = messages.settingsPage.options.revenueModel as readonly string[];
  const invoiceCycleOptions = messages.settingsPage.options.invoiceCycle as readonly string[];
  const teamSizeOptions = messages.settingsPage.options.teamSize as readonly string[];
  const goalOptions = messages.settingsPage.options.goals as readonly string[];
  const inviteRoleOptions = messages.settingsPage.options.inviteRoles as readonly InviteRoleLabel[];
  const [activeTab, setActiveTab] = useState<SettingsTabId>("organization");
  const [activeDialog, setActiveDialog] = useState<DialogId>(null);
  const [placeholderAction, setPlaceholderAction] = useState<PlaceholderAction>(null);
  const [theme, setTheme] = useState<AppTheme>(() => {
    if (typeof document === "undefined") {
      return "light";
    }

    return document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light";
  });
  const [pageData, setPageData] = useState(initialData);
  const [billingCapDraft, setBillingCapDraft] = useState(() =>
    formatBillingCapInput(initialData.billing.usageCapCents),
  );
  const [primaryPaymentMethodDraft, setPrimaryPaymentMethodDraft] = useState(() =>
    createPaymentMethodDraft(
      findBillingPaymentMethod(initialData.billing.paymentMethods, "primary"),
    ),
  );
  const [backupPaymentMethodDraft, setBackupPaymentMethodDraft] = useState(() =>
    createPaymentMethodDraft(
      findBillingPaymentMethod(initialData.billing.paymentMethods, "backup"),
    ),
  );
  const [organizationDraft, setOrganizationDraft] = useState(initialData.organization);
  const [websiteDetailsDraft, setWebsiteDetailsDraft] = useState(
    initialData.websiteDetails,
  );
  const [notificationGroups, setNotificationGroups] = useState(initialData.notifications);
  const [preferenceItems, setPreferenceItems] = useState(initialData.preferences);
  const [inviteDraft, setInviteDraft] = useState({
    email: "",
    name: "",
    roleLabel: "Operator" as InviteRoleLabel,
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingWebsiteDetails, setIsSavingWebsiteDetails] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isSavingBilling, setIsSavingBilling] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [pendingApiKeyName, setPendingApiKeyName] = useState<string | null>(null);
  const [revokingApiKeyName, setRevokingApiKeyName] = useState<string | null>(null);
  const [revokingSessionTitle, setRevokingSessionTitle] = useState<string | null>(null);
  const [pendingConnectIntegration, setPendingConnectIntegration] = useState<string | null>(null);
  const [connectApiKeyDraft, setConnectApiKeyDraft] = useState("");
  const [isConnectingIntegration, setIsConnectingIntegration] = useState(false);
  const [accountDraft, setAccountDraft] = useState<TeamAccountDraft | null>(null);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [savingPaymentMethodRole, setSavingPaymentMethodRole] =
    useState<BillingPaymentMethodRole | null>(null);
  const primaryPaymentMethod = findBillingPaymentMethod(
    pageData.billing.paymentMethods,
    "primary",
  );
  const backupPaymentMethod = findBillingPaymentMethod(
    pageData.billing.paymentMethods,
    "backup",
  );
  const flatFeeUsage = getBillingUsageItem(pageData.billing.usage, "flat_fee");
  const usageThisPeriodUsage = getBillingUsageItem(
    pageData.billing.usage,
    "usage_this_period",
  );
  const currentTotalUsage = getBillingUsageItem(
    pageData.billing.usage,
    "current_total",
  );
  const usageGraphCapCents = getBillingGraphUsageCapCents({
    billingCapDraft,
    savedUsageCapCents: pageData.billing.usageCapCents,
  });
  const isPreviewingUsageCap = usageGraphCapCents !== pageData.billing.usageCapCents;
  const usageCapProgress = getBillingUsageCapProgress({
    usageCapCents: usageGraphCapCents,
    usageThisPeriodCents: pageData.billing.graphMetrics.usageThisPeriodCents,
  });
  const selectedTeamMember =
    accountDraft === null
      ? null
      : pageData.team.members.find((member) => member.id === accountDraft.id) ?? null;

  function closeAccountDialog() {
    setAccountDraft(null);
    setActiveDialog(null);
  }

  function openPlaceholderAction(title: string, description?: string) {
    setPlaceholderAction({ description, title });
  }

  function applyMutationResponse(response: SettingsMutationResponse) {
    const nextPageData = mergeSettingsMutationResponse(pageData, response);

    setPageData(nextPageData);

    if ("tabs" in response) {
      setBillingCapDraft(formatBillingCapInput(nextPageData.billing.usageCapCents));
      setPrimaryPaymentMethodDraft(
        createPaymentMethodDraft(
          findBillingPaymentMethod(nextPageData.billing.paymentMethods, "primary"),
        ),
      );
      setBackupPaymentMethodDraft(
        createPaymentMethodDraft(
          findBillingPaymentMethod(nextPageData.billing.paymentMethods, "backup"),
        ),
      );
      setOrganizationDraft(nextPageData.organization);
      setWebsiteDetailsDraft(nextPageData.websiteDetails);
      setNotificationGroups(nextPageData.notifications);
      setPreferenceItems(nextPageData.preferences);
    }
  }

  async function requestSettingsMutation(
    input: Readonly<{
      body: Record<string, unknown>;
      method: "PATCH" | "POST";
      url: string;
    }>,
  ) {
    const response = await fetch(input.url, {
      body: JSON.stringify(input.body),
      headers: {
        "content-type": "application/json",
      },
      method: input.method,
    });
    const payload = (await response.json()) as
      | SettingsMutationResponse
      | SettingsRequestError;

    if (!response.ok || "error" in payload) {
      throw new Error(
        "error" in payload ? payload.error : "The request could not be completed.",
      );
    }

    return payload;
  }

  function updateOrganizationField(field: OrganizationEditableField, value: string) {
    setOrganizationDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateWebsiteDetailsField(
    field: WebsiteDetailsEditableField,
    value: string,
  ) {
    setWebsiteDetailsDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openAccountDialog(member: TeamMemberRecord) {
    if (!member.canOpenAccountControls) {
      return;
    }

    setAccountDraft({
      email: member.email,
      id: member.id,
      name: member.name,
      operationsAccess: member.operationsAccess,
      password: "",
      reportAccess: member.reportAccess,
      roleLabel: member.role as InviteRoleLabel,
      setupAccess: member.setupAccess,
      statusLabel: member.status === "active" ? "Active" : "Invited",
    });
    setActiveDialog("account");
  }

  function updateAccountDraftField(
    field: keyof Omit<TeamAccountDraft, "id">,
    value: string | boolean,
  ) {
    setAccountDraft((current) =>
      current === null
        ? current
        : {
            ...current,
            [field]: value,
          },
    );
  }

  async function handleSaveAccount() {
    if (accountDraft === null || isSavingAccount || selectedTeamMember === null) {
      return;
    }

    setIsSavingAccount(true);

    try {
      const accountPayload: Record<string, unknown> = {
        email: accountDraft.email,
        name: accountDraft.name,
      };

      if (
        selectedTeamMember.canResetPassword &&
        accountDraft.password.trim().length > 0
      ) {
        accountPayload.password = accountDraft.password;
      }

      if (selectedTeamMember.canEditAuthorization) {
        accountPayload.operationsAccess = accountDraft.operationsAccess;
        accountPayload.reportAccess = accountDraft.reportAccess;
        accountPayload.role = normalizeInviteDraftRole(accountDraft.roleLabel);
        accountPayload.setupAccess = accountDraft.setupAccess;
        accountPayload.status = normalizeAccountDraftStatus(accountDraft.statusLabel);
      }

      const payload = await requestSettingsMutation({
        body: {
          account: accountPayload,
          orgId,
        },
        method: "PATCH",
        url: `/api/settings/team/accounts/${accountDraft.id}`,
      });

      applyMutationResponse(payload);
      closeAccountDialog();
    } catch (error) {
      openPlaceholderAction(
        "Could not update account",
        error instanceof Error ? error.message : "The request could not be completed.",
      );
    } finally {
      setIsSavingAccount(false);
    }
  }

  function toggleNotification(groupId: string, itemTitle: string) {
    setNotificationGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id !== groupId
          ? group
          : {
              ...group,
              items: group.items.map((item) =>
                item.title === itemTitle
                  ? { ...item, enabled: !item.enabled }
                  : item,
              ),
            },
      ),
    );
  }

  function togglePreference(preferenceId: string) {
    setPreferenceItems((currentItems) =>
      currentItems.map((item) =>
        item.id === preferenceId ? { ...item, enabled: !item.enabled } : item,
      ),
    );
  }

  async function handleInviteSubmit() {
    if (isSendingInvite) {
      return;
    }

    setIsSendingInvite(true);

    try {
      const payload = await requestSettingsMutation({
        body: {
          invite: {
            email: inviteDraft.email,
            name: inviteDraft.name,
            role: normalizeInviteDraftRole(inviteDraft.roleLabel),
          },
          orgId,
        },
        method: "POST",
        url: "/api/settings/team/invitations",
      });

      applyMutationResponse(payload);
      setActiveDialog(null);
      setInviteDraft({
        email: "",
        name: "",
        roleLabel: "Operator",
      });
    } catch (error) {
      openPlaceholderAction(
        "Could not send invite",
        error instanceof Error ? error.message : "The request could not be completed.",
      );
    } finally {
      setIsSendingInvite(false);
    }
  }

  async function handleSaveProfile() {
    if (isSavingProfile) {
      return;
    }

    setIsSavingProfile(true);

    try {
      const payload = await requestSettingsMutation({
        body: {
          organization: organizationDraft,
          orgId,
        },
        method: "PATCH",
        url: "/api/settings",
      });

      applyMutationResponse(payload);
    } catch (error) {
      openPlaceholderAction(
        "Could not save profile",
        error instanceof Error ? error.message : "The request could not be completed.",
      );
    } finally {
      setIsSavingProfile(false);
    }
  }

  function handleResetProfile() {
    setOrganizationDraft(pageData.organization);
    console.info("[PulseOps] Reset profile: form values restored to the current workspace defaults.");
  }

  async function handleSaveWebsiteDetails() {
    if (isSavingWebsiteDetails) {
      return;
    }

    setIsSavingWebsiteDetails(true);

    try {
      const payload = await requestSettingsMutation({
        body: {
          orgId,
          websiteDetails: websiteDetailsDraft,
        },
        method: "PATCH",
        url: "/api/settings",
      });

      applyMutationResponse(payload);
    } catch (error) {
      openPlaceholderAction(
        "Could not save website details",
        error instanceof Error ? error.message : "The request could not be completed.",
      );
    } finally {
      setIsSavingWebsiteDetails(false);
    }
  }

  function handleResetWebsiteDetails() {
    setWebsiteDetailsDraft(pageData.websiteDetails);
    console.info("[PulseOps] Reset website details: public contact values restored to the current workspace defaults.");
  }

  async function handleSaveNotifications() {
    if (isSavingNotifications) {
      return;
    }

    setIsSavingNotifications(true);

    try {
      const payload = await requestSettingsMutation({
        body: {
          notifications: notificationGroups,
          orgId,
        },
        method: "PATCH",
        url: "/api/settings",
      });

      applyMutationResponse(payload);
    } catch (error) {
      openPlaceholderAction(
        "Could not save notifications",
        error instanceof Error ? error.message : "The request could not be completed.",
      );
    } finally {
      setIsSavingNotifications(false);
    }
  }

  function toggleGoal(goal: string) {
    setOrganizationDraft((current) => ({
      ...current,
      goals: current.goals.includes(goal)
        ? current.goals.filter((g) => g !== goal)
        : [...current.goals, goal],
    }));
  }

  function applyTheme(themeValue: AppTheme) {
    document.documentElement.setAttribute("data-theme", themeValue);
    window.localStorage.setItem("pulseops-theme", themeValue);
    setTheme(themeValue);
  }

  async function handleSavePreferences() {
    if (isSavingPreferences) {
      return;
    }

    setIsSavingPreferences(true);

    try {
      const payload = await requestSettingsMutation({
        body: {
          orgId,
          preferences: preferenceItems,
        },
        method: "PATCH",
        url: "/api/settings",
      });

      applyMutationResponse(payload);
    } catch (error) {
      openPlaceholderAction(
        "Could not save preferences",
        error instanceof Error ? error.message : "The request could not be completed.",
      );
    } finally {
      setIsSavingPreferences(false);
    }
  }

  async function handleSaveBilling() {
    if (isSavingBilling) {
      return;
    }

    let usageCapCents: number | null;

    try {
      usageCapCents = parseBillingCapInput(billingCapDraft);
    } catch (error) {
      openPlaceholderAction(
        "Could not save usage cap",
        error instanceof Error ? error.message : "Enter a valid dollar amount.",
      );
      return;
    }

    setIsSavingBilling(true);

    try {
      const payload = await requestSettingsMutation({
        body: {
          billing: {
            usageCapCents,
          },
          orgId,
        },
        method: "PATCH",
        url: "/api/settings",
      });

      applyMutationResponse(payload);
    } catch (error) {
      openPlaceholderAction(
        "Could not save usage cap",
        error instanceof Error ? error.message : "The request could not be completed.",
      );
    } finally {
      setIsSavingBilling(false);
    }
  }

  function handleResetBilling() {
    setBillingCapDraft(formatBillingCapInput(pageData.billing.usageCapCents));
  }

  function updatePaymentMethodDraft(
    role: BillingPaymentMethodRole,
    field: keyof PaymentMethodDraft,
    value: string,
  ) {
    const updateDraft = (current: PaymentMethodDraft) => ({
      ...current,
      [field]: value,
    });

    if (role === "primary") {
      setPrimaryPaymentMethodDraft((current) => updateDraft(current));
      return;
    }

    setBackupPaymentMethodDraft((current) => updateDraft(current));
  }

  function handleResetPaymentMethod(role: BillingPaymentMethodRole) {
    const currentPaymentMethod = findBillingPaymentMethod(
      pageData.billing.paymentMethods,
      role,
    );
    const nextDraft = createPaymentMethodDraft(currentPaymentMethod);

    if (role === "primary") {
      setPrimaryPaymentMethodDraft(nextDraft);
      return;
    }

    setBackupPaymentMethodDraft(nextDraft);
  }

  async function handleSavePaymentMethod(role: BillingPaymentMethodRole) {
    if (savingPaymentMethodRole !== null) {
      return;
    }

    const draft =
      role === "primary" ? primaryPaymentMethodDraft : backupPaymentMethodDraft;
    let paymentMethodInput: ReturnType<typeof parsePaymentMethodDraft>;

    try {
      paymentMethodInput = parsePaymentMethodDraft(draft);
    } catch (error) {
      openPlaceholderAction(
        `Could not save ${role === "primary" ? "business" : "backup"} card`,
        error instanceof Error ? error.message : "Enter valid card details.",
      );
      return;
    }

    setSavingPaymentMethodRole(role);

    try {
      const payload = await requestSettingsMutation({
        body: {
          billing:
            role === "primary"
              ? { primaryCard: paymentMethodInput }
              : { backupCard: paymentMethodInput },
          orgId,
        },
        method: "PATCH",
        url: "/api/settings",
      });

      applyMutationResponse(payload);
    } catch (error) {
      openPlaceholderAction(
        `Could not save ${role === "primary" ? "business" : "backup"} card`,
        error instanceof Error ? error.message : "The request could not be completed.",
      );
    } finally {
      setSavingPaymentMethodRole(null);
    }
  }

  async function handleRemoveBackupPaymentMethod() {
    if (savingPaymentMethodRole !== null) {
      return;
    }

    setSavingPaymentMethodRole("backup");

    try {
      const payload = await requestSettingsMutation({
        body: {
          billing: {
            backupCard: null,
          },
          orgId,
        },
        method: "PATCH",
        url: "/api/settings",
      });

      applyMutationResponse(payload);
    } catch (error) {
      openPlaceholderAction(
        "Could not remove backup card",
        error instanceof Error ? error.message : "The request could not be completed.",
      );
    } finally {
      setSavingPaymentMethodRole(null);
    }
  }

  async function handleRevokeSession(title: string) {
    if (revokingSessionTitle !== null) {
      return;
    }

    setRevokingSessionTitle(title);

    try {
      const payload = await requestSettingsMutation({
        body: {
          orgId,
          title,
        },
        method: "POST",
        url: "/api/settings/security/sessions/revoke",
      });

      applyMutationResponse(payload);
    } catch (error) {
      openPlaceholderAction(
        "Could not revoke session",
        error instanceof Error ? error.message : "The request could not be completed.",
      );
    } finally {
      setRevokingSessionTitle(null);
    }
  }

  async function handleRevokeApiKey() {
    if (pendingApiKeyName === null || revokingApiKeyName !== null) {
      return;
    }

    setRevokingApiKeyName(pendingApiKeyName);

    try {
      const payload = await requestSettingsMutation({
        body: {
          name: pendingApiKeyName,
          orgId,
        },
        method: "POST",
        url: "/api/settings/security/api-keys/revoke",
      });

      applyMutationResponse(payload);
      setActiveDialog(null);
      setPendingApiKeyName(null);
    } catch (error) {
      openPlaceholderAction(
        "Could not revoke API key",
        error instanceof Error ? error.message : "The request could not be completed.",
      );
    } finally {
      setRevokingApiKeyName(null);
    }
  }

  async function handleIntegrationAction(integration: SettingsPageData["integrations"][number]) {
    const actionLabel = integration.actionLabel.toLowerCase();

    if (actionLabel === "connect" || actionLabel === "reconnect") {
      setConnectApiKeyDraft("");
      setPendingConnectIntegration(integration.title);
      return;
    }

    if (actionLabel === "disconnect") {
      if (isConnectingIntegration) return;
      setIsConnectingIntegration(true);
      try {
        const payload = await requestSettingsMutation({
          body: { action: "disconnect", integrationTitle: integration.title, orgId },
          method: "POST",
          url: "/api/settings/integrations/connect",
        });
        applyMutationResponse(payload);
      } catch (error) {
        openPlaceholderAction(
          "Could not disconnect",
          error instanceof Error ? error.message : "The request could not be completed.",
        );
      } finally {
        setIsConnectingIntegration(false);
      }
      return;
    }

    openPlaceholderAction(integration.actionLabel, integration.title);
  }

  async function handleIntegrationConnect() {
    if (pendingConnectIntegration === null || isConnectingIntegration) return;
    setIsConnectingIntegration(true);
    try {
      const payload = await requestSettingsMutation({
        body: { action: "connect", integrationTitle: pendingConnectIntegration, orgId },
        method: "POST",
        url: "/api/settings/integrations/connect",
      });
      applyMutationResponse(payload);
      setPendingConnectIntegration(null);
      setConnectApiKeyDraft("");
    } catch (error) {
      openPlaceholderAction(
        "Could not connect integration",
        error instanceof Error ? error.message : "The request could not be completed.",
      );
    } finally {
      setIsConnectingIntegration(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <WorkspaceHeader
        actions={[]}
        breadcrumbs={messages.settingsPage.labels.breadcrumbs}
        description={messages.settingsPage.labels.description}
        title={messages.settingsPage.labels.title}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-[22px] py-[18px] pb-10">
        <div className="flex items-start gap-5">
        <aside className="w-[172px] shrink-0 pt-[2px]">
          <div className="sticky top-0 flex flex-col gap-[2px]">
            {pageData.tabs.map((tab) => (
              <SettingsTabButton
                key={tab.id}
                active={activeTab === tab.id}
                icon={settingsTabIcons[tab.id]}
                label={tab.label}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {activeTab === "organization" ? (
            <div className="space-y-5">
            <PreferencePanel
              description={messages.settingsPage.actionDescriptions.businessProfile}
              title={messages.settingsPage.actionTitles.businessProfile}
            >
              <div className="grid gap-[14px] md:grid-cols-2">
                <FieldGroup label={messages.settingsPage.formLabels.businessName}>
                  <TextField
                    onChange={(value) => updateOrganizationField("name", value)}
                    value={organizationDraft.name}
                  />
                </FieldGroup>
                <FieldGroup label={messages.settingsPage.formLabels.primaryLocation}>
                  <TextField
                    onChange={(value) => updateOrganizationField("location", value)}
                    value={organizationDraft.location}
                  />
                </FieldGroup>
                <div className="md:col-span-2">
                  <FieldGroup label={messages.settingsPage.formLabels.industry}>
                    <PillGroup
                      options={industryOptions}
                      selected={organizationDraft.industry}
                      onChange={(value) => updateOrganizationField("industry", value)}
                    />
                  </FieldGroup>
                </div>
                <FieldGroup label={messages.settingsPage.formLabels.revenueModel}>
                  <PillGroup
                    options={revenueModelOptions}
                    selected={organizationDraft.revenueModel}
                    onChange={(value) => updateOrganizationField("revenueModel", value)}
                  />
                </FieldGroup>
                <FieldGroup label={messages.settingsPage.formLabels.invoiceCycle}>
                  <SelectField
                    options={invoiceCycleOptions}
                    onChange={(value) => updateOrganizationField("invoiceCycle", value)}
                    value={organizationDraft.invoiceCycle}
                  />
                </FieldGroup>
                <FieldGroup label={messages.settingsPage.formLabels.teamSize}>
                  <SelectField
                    options={teamSizeOptions}
                    onChange={(value) => updateOrganizationField("teamSize", value)}
                    value={organizationDraft.teamSize}
                  />
                </FieldGroup>
                <div className="md:col-span-2">
                  <FieldGroup label={messages.settingsPage.formLabels.goals}>
                    <div className="mt-1 flex flex-col gap-1">
                      {goalOptions.map((goal) => (
                        <label
                          key={goal}
                          className="flex cursor-pointer items-center gap-[10px] rounded-[6px] py-[5px] text-[13px] text-foreground transition-colors"
                        >
                            <input
                              checked={organizationDraft.goals.includes(goal)}
                              className="h-[14px] w-[14px] shrink-0 cursor-pointer rounded accent-accent"
                              onChange={() => toggleGoal(goal)}
                              type="checkbox"
                            />
                            {goal}
                          </label>
                        ))}
                      </div>
                    </FieldGroup>
                  </div>
                </div>
              <SettingsActionRow
                onPrimaryAction={handleSaveProfile}
                onSecondaryAction={handleResetProfile}
                primaryLabel={
                  isSavingProfile
                    ? messages.settingsPage.actions.saving
                    : messages.settingsPage.actions.saveProfile
                }
                secondaryLabel={messages.settingsPage.actions.reset}
              />
              </PreferencePanel>

              <PreferencePanel
                description="Structured public contact details for the marketing home and contact pages. Update these fields without touching page copy or a WYSIWYG editor."
                title="Website details"
              >
                <div className="grid gap-[14px] md:grid-cols-2">
                  <FieldGroup label="Support email">
                    <TextField
                      onChange={(value) => updateWebsiteDetailsField("supportEmail", value)}
                      type="email"
                      value={websiteDetailsDraft.supportEmail}
                    />
                  </FieldGroup>
                  <FieldGroup label="Sales email">
                    <TextField
                      onChange={(value) => updateWebsiteDetailsField("salesEmail", value)}
                      type="email"
                      value={websiteDetailsDraft.salesEmail}
                    />
                  </FieldGroup>
                  <FieldGroup label="Press email">
                    <TextField
                      onChange={(value) => updateWebsiteDetailsField("pressEmail", value)}
                      type="email"
                      value={websiteDetailsDraft.pressEmail}
                    />
                  </FieldGroup>
                  <FieldGroup label="Partnerships email">
                    <TextField
                      onChange={(value) =>
                        updateWebsiteDetailsField("partnershipsEmail", value)
                      }
                      type="email"
                      value={websiteDetailsDraft.partnershipsEmail}
                    />
                  </FieldGroup>
                  <FieldGroup label="Main phone">
                    <TextField
                      onChange={(value) => updateWebsiteDetailsField("mainPhone", value)}
                      value={websiteDetailsDraft.mainPhone}
                    />
                  </FieldGroup>
                  <FieldGroup label="Support phone">
                    <TextField
                      onChange={(value) => updateWebsiteDetailsField("supportPhone", value)}
                      value={websiteDetailsDraft.supportPhone}
                    />
                  </FieldGroup>
                </div>
                <SettingsActionRow
                  onPrimaryAction={handleSaveWebsiteDetails}
                  onSecondaryAction={handleResetWebsiteDetails}
                  primaryLabel={
                    isSavingWebsiteDetails ? "Saving..." : "Save website details"
                  }
                  secondaryLabel="Reset"
                />
              </PreferencePanel>
            </div>
          ) : null}

          {activeTab === "team" ? (
            <div className="space-y-[16px]">
              <CatalogCard className="overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-border px-[18px] py-[13px]">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[13px] font-semibold tracking-[-0.015em] text-foreground">Team members</h3>
                    <span className="rounded-full bg-white/[0.06] px-2 py-[2px] text-[10.5px] font-bold text-muted">
                      {pageData.team.members.length} members
                    </span>
                  </div>
                  {pageData.currentUser.canInviteMembers ? (
                    <CatalogButton
                      onClick={() => setActiveDialog("invite")}
                      variant="primary"
                    >
                      + Invite member
                    </CatalogButton>
                  ) : null}
                </div>
                <div className="border-b border-border bg-surface-subtle/60 px-[18px] py-[10px] text-[11.5px] text-muted">
                  Signed in as <span className="font-semibold text-foreground">{pageData.currentUser.name}</span> ({pageData.currentUser.role}).{" "}
                  {pageData.currentUser.canManageAccounts
                    ? "You can manage team accounts and access policy."
                    : "You can only adjust your own account profile and password."}
                  {pageData.currentUser.isFallbackSession
                    ? " This local workspace is currently using the fallback development session."
                    : null}
                </div>
                <div>
                  {pageData.team.members.map((member) => (
                    <TeamMemberRow
                      accessSummary={member.accessSummary}
                      actionLabel={
                        member.canOpenAccountControls
                          ? member.isCurrentUser
                            ? "My account"
                            : "Manage"
                          : undefined
                      }
                      key={member.id}
                      email={member.email}
                      isCurrentUser={member.isCurrentUser}
                      name={member.name}
                      onAction={
                        member.canOpenAccountControls
                          ? () => openAccountDialog(member)
                          : undefined
                      }
                      role={member.role}
                      status={member.status}
                      statusLabel={member.statusLabel}
                    />
                  ))}
                </div>
              </CatalogCard>

              <CatalogCard className="overflow-hidden">
                <div className="flex items-start justify-between gap-3 border-b border-border px-[18px] py-[13px]">
                  <div>
                    <h3 className="text-[13px] font-semibold tracking-[-0.015em] text-foreground">Role permissions</h3>
                    <p className="mt-[2px] text-[11.5px] leading-[1.4] text-muted">Defines what each role can see and do in your workspace.</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-[12.5px]">
                    <thead>
                      <tr className="border-b border-border">
                        {["Permission", "Admin", "Operator", "Analyst", "Viewer"].map((header) => (
                          <th
                            key={header}
                            className="px-[14px] py-2 text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-muted"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pageData.team.permissions.map((permission) => (
                        <tr key={permission.permission} className="border-b border-border last:border-b-0 transition-colors hover:bg-white/[0.02]">
                          <td className="px-[14px] py-2 font-medium text-foreground">{permission.permission}</td>
                          {[
                            permission.admin,
                            permission.operator,
                            permission.analyst,
                            permission.viewer,
                          ].map((value, index) => (
                            <td
                              key={`${permission.permission}-${index}`}
                              className="px-[14px] py-2 text-center"
                            >
                              {value ? (
                                <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[rgba(34,197,94,.12)] text-[10px] font-extrabold text-green-400">
                                  ✓
                                </span>
                              ) : (
                                <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white/[0.05] text-[12px] text-muted/30">
                                  —
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CatalogCard>
            </div>
          ) : null}

          {activeTab === "integrations" ? (
            <CatalogCard className="overflow-hidden">
              <div className="border-b border-border px-[18px] py-[13px]">
                <h3 className="text-[13px] font-semibold tracking-[-0.015em] text-foreground">Connected sources</h3>
                <p className="mt-[2px] text-[11.5px] leading-[1.4] text-muted">Connect your business systems to feed the ingestion pipeline.</p>
              </div>
              {pageData.integrations.map((integration) => (
                <IntegrationListItem
                  key={integration.title}
                  actionLabel={integration.actionLabel}
                  description={integration.description}
                  onAction={() => void handleIntegrationAction(integration)}
                  onSecondaryAction={() =>
                    openPlaceholderAction(
                      integration.secondaryActionLabel ?? "Configure",
                      integration.title,
                    )
                  }
                  secondaryActionLabel={integration.secondaryActionLabel}
                  statusLabel={integration.statusLabel}
                  statusTone={integration.statusTone}
                  title={integration.title}
                />
              ))}
            </CatalogCard>
          ) : null}

          {activeTab === "notifications" ? (
            <div className="space-y-5">
              <CatalogCard className="overflow-hidden">
                <div className="border-b border-border px-[18px] py-[13px]">
                  <h3 className="text-[13px] font-semibold tracking-[-0.015em] text-foreground">Notification preferences</h3>
                  <p className="mt-[2px] text-[11.5px] leading-[1.4] text-muted">Choose how and when PulseOps contacts you. Operator role or above required.</p>
                </div>
                <div className="px-[18px] pb-1">
                  {notificationGroups.map((group) => (
                    <div key={group.id}>
                      <p className="pb-[6px] pt-[14px] text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted">
                        {group.title}
                      </p>
                      {group.items.map((item) => (
                        <ToggleRow
                          key={item.title}
                          description={item.description}
                          enabled={item.enabled}
                          onToggle={() => toggleNotification(group.id, item.title)}
                          title={item.title}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <div className="border-t border-border px-[18px] py-3">
                  <CatalogButton
                    onClick={() => {
                      void handleSaveNotifications();
                    }}
                    variant="primary"
                  >
                    {isSavingNotifications ? "Saving..." : "Save preferences"}
                  </CatalogButton>
                </div>
              </CatalogCard>
            </div>
          ) : null}

          {activeTab === "security" ? (
            <div className="space-y-5">
              <PreferencePanel
                description="Authentication and access-control settings for the workspace."
                title="Authentication"
              >
                <div className="space-y-3">
                  {pageData.security.authRows.map((row) => (
                    <div
                      key={row.title}
                      className="flex flex-col gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{row.title}</p>
                        <p className="mt-1 text-xs text-muted">{row.description}</p>
                      </div>
                      <button
                        className="rounded-[7px] border border-border-strong bg-surface-subtle px-4 py-2 text-[12.5px] font-semibold text-foreground transition-[border-color,background] hover:bg-surface-muted hover:border-foreground/20"
                        onClick={() =>
                          row.title === "Two-factor authentication"
                            ? setActiveDialog("two-factor")
                            : openPlaceholderAction(row.actionLabel, row.title)
                        }
                        type="button"
                      >
                        {row.actionLabel}
                      </button>
                    </div>
                  ))}
                </div>
              </PreferencePanel>

              <PreferencePanel
                description="Review active sessions and revoke stale device access."
                title="Active sessions"
              >
                <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
                  {pageData.security.sessions.map((session) => (
                    <SessionRow
                      key={session.title}
                      actionLabel={session.actionLabel}
                      detail={session.detail}
                      isCurrent={session.isCurrent}
                      onAction={() => {
                        if (session.actionLabel === undefined) {
                          return;
                        }

                        void handleRevokeSession(session.title);
                      }}
                      title={session.title}
                    />
                  ))}
                </div>
              </PreferencePanel>

              <PreferencePanel
                description="Programmatic access keys for server-side integrations only."
                title="API keys"
              >
                <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
                  {pageData.security.apiKeys.map((apiKey) => (
                    <ApiKeyRow
                      key={apiKey.name}
                      actionLabel="Revoke"
                      createdLabel={apiKey.createdLabel}
                      keyLabel={apiKey.keyLabel}
                      name={apiKey.name}
                      onAction={() => {
                        setPendingApiKeyName(apiKey.name);
                        setActiveDialog("revoke-key");
                      }}
                    />
                  ))}
                </div>
              </PreferencePanel>
            </div>
          ) : null}

          {activeTab === "billing" ? (
            <div className="space-y-[16px]">
              <div className="rounded-[10px] border border-[rgba(0,201,167,.15)] bg-gradient-to-br from-[#0d1f36] to-[#0a1625] p-[22px]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center rounded-full bg-[rgba(34,197,94,.1)] px-2 py-[2px] text-[10.5px] font-bold uppercase tracking-[0.06em] text-green-400">
                      Active plan
                    </span>
                    <h2 className="mt-[10px] text-[20px] font-extrabold tracking-[-0.03em] text-foreground">
                      {pageData.billing.planTitle}
                    </h2>
                    <p className="mt-[3px] text-[12px] text-muted">{pageData.billing.planDescription}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
                      Billing model
                    </p>
                    <p className="mt-1 text-[13px] font-semibold text-foreground">
                      Platform access + usage
                    </p>
                    <p className="mt-1 text-[11.5px] text-muted">
                      Totals update automatically from tracked AI usage.
                    </p>
                  </div>
                </div>
              </div>
              <CatalogCard className="overflow-hidden">
                <div className="border-b border-border px-[18px] py-[13px]">
                  <h3 className="text-[13px] font-semibold tracking-[-0.015em] text-foreground">Usage this billing period</h3>
                  <p className="mt-[2px] text-[11.5px] leading-[1.4] text-muted">Current cycle across the workspace.</p>
                </div>
                <div className="grid gap-[18px] p-[18px] md:grid-cols-2">
                  <BillingUsageStatCard usage={flatFeeUsage} />
                  <BillingUsageStatCard usage={currentTotalUsage} />
                  <div className="rounded-[10px] border border-border bg-surface-subtle p-[18px] md:col-span-2">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted">
                          {usageThisPeriodUsage.label}
                        </p>
                        <p className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-foreground">
                          {usageThisPeriodUsage.value}
                        </p>
                        <p className="mt-1 text-[11.5px] text-muted">
                          {usageThisPeriodUsage.detail}
                        </p>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted">
                          Monthly cap
                        </p>
                        <p className="mt-1 text-[16px] font-semibold text-foreground">
                          {formatBillingCapSummary(usageGraphCapCents)}
                        </p>
                        <p className="mt-1 text-[11.5px] text-muted">
                          {usageCapProgress.summary}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-muted">
                        <span>{usageCapProgress.caption}</span>
                        {isPreviewingUsageCap ? (
                          <span className="font-medium text-accent">
                            Previewing unsaved cap
                          </span>
                        ) : null}
                      </div>
                      <div className="h-[8px] overflow-hidden rounded-full bg-white/[0.07]">
                        <div
                          className="h-full rounded-full bg-accent transition-[width] duration-150 ease-out"
                          style={{ width: `${usageCapProgress.barWidthPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CatalogCard>
              <CatalogCard className="overflow-hidden">
                <div className="border-b border-border px-[18px] py-[13px]">
                  <h3 className="text-[13px] font-semibold tracking-[-0.015em] text-foreground">Usage cap</h3>
                  <p className="mt-[2px] text-[11.5px] leading-[1.4] text-muted">
                    Optional monthly cap on AI usage. Leave blank for no cap.
                  </p>
                </div>
                <div className="grid gap-4 p-[18px] md:grid-cols-[minmax(0,1fr)_220px] md:items-end">
                  <FieldGroup
                    hint="New AI runs pause once the current billing cycle reaches this amount."
                    label="Monthly cap (USD)"
                  >
                    <TextField
                      onChange={setBillingCapDraft}
                      placeholder="No cap"
                      value={billingCapDraft}
                    />
                  </FieldGroup>
                  <div className="rounded-[10px] border border-border bg-surface-subtle px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted">
                      Current cap
                    </p>
                    <p className="mt-1 text-[16px] font-semibold text-foreground">
                      {formatBillingCapSummary(pageData.billing.usageCapCents)}
                    </p>
                    <p className="mt-1 text-[11.5px] text-muted">
                      Applies to the current workspace billing cycle.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 border-t border-border px-[18px] py-3">
                  <CatalogButton
                    disabled={isSavingBilling}
                    onClick={() => {
                      void handleSaveBilling();
                    }}
                    variant="primary"
                  >
                    {isSavingBilling ? "Saving..." : "Save cap"}
                  </CatalogButton>
                  <CatalogButton
                    disabled={isSavingBilling}
                    onClick={handleResetBilling}
                    variant="secondary"
                  >
                    Reset
                  </CatalogButton>
                </div>
              </CatalogCard>
              <CatalogCard className="overflow-hidden">
                <div className="border-b border-border px-[18px] py-[13px]">
                  <h3 className="text-[13px] font-semibold tracking-[-0.015em] text-foreground">Payment methods</h3>
                  <p className="mt-[2px] text-[11.5px] leading-[1.4] text-muted">
                    Add a business card for the service and an optional backup card. Only masked card details are stored.
                  </p>
                </div>
                <div className="grid gap-4 p-[18px] lg:grid-cols-2">
                  <BillingPaymentMethodEditor
                    currentPaymentMethod={primaryPaymentMethod}
                    draft={primaryPaymentMethodDraft}
                    isSaving={savingPaymentMethodRole === "primary"}
                    onChange={(field, value) =>
                      updatePaymentMethodDraft("primary", field, value)
                    }
                    onReset={() => handleResetPaymentMethod("primary")}
                    onSave={() => {
                      void handleSavePaymentMethod("primary");
                    }}
                    role="primary"
                  />
                  <BillingPaymentMethodEditor
                    currentPaymentMethod={backupPaymentMethod}
                    draft={backupPaymentMethodDraft}
                    isSaving={savingPaymentMethodRole === "backup"}
                    onChange={(field, value) =>
                      updatePaymentMethodDraft("backup", field, value)
                    }
                    onRemove={
                      backupPaymentMethod === null
                        ? undefined
                        : () => {
                            void handleRemoveBackupPaymentMethod();
                          }
                    }
                    onReset={() => handleResetPaymentMethod("backup")}
                    onSave={() => {
                      void handleSavePaymentMethod("backup");
                    }}
                    role="backup"
                  />
                </div>
              </CatalogCard>
            </div>
          ) : null}

          {activeTab === "preferences" ? (
            <div className="space-y-5">
              <PreferencePanel
                description="Workspace-level display and workflow defaults."
                title="Preferences"
              >
                {preferenceItems.map((preference) => (
                  <ToggleRow
                    key={preference.id}
                    description={preference.description}
                    enabled={preference.enabled}
                    onToggle={() => togglePreference(preference.id)}
                    title={preference.title}
                  />
                ))}
              </PreferencePanel>
              <CatalogButton
                onClick={() => {
                  void handleSavePreferences();
                }}
                variant="primary"
              >
                {isSavingPreferences ? "Saving..." : "Save preferences"}
              </CatalogButton>

              <PreferencePanel
                description="Mirror the settings design controls and persist the workspace color mode in local storage."
                title="Appearance"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Color mode</p>
                    <p className="mt-1 text-xs leading-6 text-muted">Persisted across sessions.</p>
                  </div>
                  <div className="inline-flex rounded-lg border border-border bg-surface-subtle p-1">
                    <button
                      className={[
                        "rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
                        theme === "dark"
                          ? "bg-accent-dim text-accent"
                          : "text-muted hover:text-foreground",
                      ].join(" ")}
                      onClick={() => applyTheme("dark")}
                      type="button"
                    >
                      Dark
                    </button>
                    <button
                      className={[
                        "rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
                        theme === "light"
                          ? "bg-accent text-white dark:bg-accent-dim dark:text-accent"
                          : "text-muted hover:text-foreground",
                      ].join(" ")}
                      onClick={() => applyTheme("light")}
                      type="button"
                    >
                      Light
                    </button>
                  </div>
                </div>
              </PreferencePanel>
            </div>
          ) : null}
        </div>
        </div>
      </div>

      {activeDialog === "invite" ? (
        <CatalogModalOverlay>
          <DialogFrame
            description={settingsPageLabels.dialogs.inviteDescription}
            footer={
              <>
                <CatalogButton onClick={handleInviteSubmit} variant="primary">
                  {isSendingInvite ? "Sending..." : "Send invite"}
                </CatalogButton>
                <CatalogButton
                  onClick={() => {
                    setActiveDialog(null);
                    setPendingApiKeyName(null);
                  }}
                  variant="secondary"
                >
                  Cancel
                </CatalogButton>
              </>
            }
            onClose={() => setActiveDialog(null)}
            title={settingsPageLabels.dialogs.inviteTitle}
          >
            <FieldGroup label="Name">
              <TextField
                onChange={(value) =>
                  setInviteDraft((current) => ({ ...current, name: value }))
                }
                placeholder="Jamie Reynolds"
                value={inviteDraft.name}
              />
            </FieldGroup>
            <FieldGroup label="Email">
              <TextField
                onChange={(value) =>
                  setInviteDraft((current) => ({ ...current, email: value }))
                }
                placeholder="jamie@browardhvac.com"
                type="email"
                value={inviteDraft.email}
              />
            </FieldGroup>
            <FieldGroup label="Role">
              <SelectField
                onChange={(value) =>
                  setInviteDraft((current) => ({
                    ...current,
                    roleLabel: value as InviteRoleLabel,
                  }))
                }
                options={INVITE_ROLE_OPTIONS}
                value={inviteDraft.roleLabel}
              />
            </FieldGroup>
          </DialogFrame>
        </CatalogModalOverlay>
      ) : null}

      {activeDialog === "account" && accountDraft !== null && selectedTeamMember !== null ? (
        <CatalogModalOverlay>
          <DialogFrame
            description={
              selectedTeamMember.isCurrentUser
                ? "Update your account email and password. Role and access controls remain admin-governed."
                : "Update account identity, password, and access settings for this team member."
            }
            footer={
              <>
                <CatalogButton
                  disabled={!selectedTeamMember.canOpenAccountControls || isSavingAccount}
                  onClick={handleSaveAccount}
                  variant="primary"
                >
                  {isSavingAccount ? "Saving..." : "Save changes"}
                </CatalogButton>
                <CatalogButton
                  onClick={closeAccountDialog}
                  variant="secondary"
                >
                  Cancel
                </CatalogButton>
              </>
            }
            onClose={closeAccountDialog}
            title={selectedTeamMember.isCurrentUser ? "My account" : "Manage account"}
          >
            <div className="rounded-2xl border border-border bg-surface-subtle/60 px-4 py-3 text-[11.5px] leading-[1.5] text-muted">
              <p>
                Role: <span className="font-semibold text-foreground">{selectedTeamMember.role}</span>
              </p>
              <p className="mt-1">
                Access buckets:{" "}
                <span className="font-semibold text-foreground">
                  {selectedTeamMember.accessSummary}
                </span>
              </p>
              {selectedTeamMember.isCurrentUser ? (
                <p className="mt-1">This is the currently signed-in account.</p>
              ) : null}
            </div>
            <FieldGroup label="Name">
              <TextField
                disabled={!selectedTeamMember.canEditIdentity}
                onChange={(value) => updateAccountDraftField("name", value)}
                value={accountDraft.name}
              />
            </FieldGroup>
            <FieldGroup label="Email">
              <TextField
                disabled={!selectedTeamMember.canEditIdentity}
                onChange={(value) => updateAccountDraftField("email", value)}
                type="email"
                value={accountDraft.email}
              />
            </FieldGroup>
            {selectedTeamMember.canResetPassword ? (
              <FieldGroup
                hint="Leave blank to keep the current password."
                label={selectedTeamMember.isCurrentUser ? "New password" : "Reset password"}
              >
                <TextField
                  onChange={(value) => updateAccountDraftField("password", value)}
                  type="password"
                  value={accountDraft.password}
                />
              </FieldGroup>
            ) : null}
            {selectedTeamMember.canEditAuthorization ? (
              <>
                <FieldGroup label="Role">
                  <SelectField
                    onChange={(value) =>
                      updateAccountDraftField(
                        "roleLabel",
                        value as InviteRoleLabel,
                      )
                    }
                    options={INVITE_ROLE_OPTIONS}
                    value={accountDraft.roleLabel}
                  />
                </FieldGroup>
                <FieldGroup label="Status">
                  <SelectField
                    onChange={(value) =>
                      updateAccountDraftField(
                        "statusLabel",
                        value as AccountStatusLabel,
                      )
                    }
                    options={ACCOUNT_STATUS_OPTIONS}
                    value={accountDraft.statusLabel}
                  />
                </FieldGroup>
                <FieldGroup label="Access policy">
                  <div className="rounded-2xl border border-border px-4 py-2">
                    <ToggleRow
                      description="Can connect approved sources and ingestion scope."
                      disabled={!selectedTeamMember.canEditAuthorization}
                      enabled={accountDraft.setupAccess}
                      onToggle={() =>
                        updateAccountDraftField(
                          "setupAccess",
                          !accountDraft.setupAccess,
                        )
                      }
                      title="Setup access"
                    />
                    <ToggleRow
                      description="Can review ingestion queues, parse issues, and file operations."
                      disabled={!selectedTeamMember.canEditAuthorization}
                      enabled={accountDraft.operationsAccess}
                      onToggle={() =>
                        updateAccountDraftField(
                          "operationsAccess",
                          !accountDraft.operationsAccess,
                        )
                      }
                      title="Operations access"
                    />
                    <ToggleRow
                      description="Can view dashboards, briefs, and approved insight outputs."
                      disabled={!selectedTeamMember.canEditAuthorization}
                      enabled={accountDraft.reportAccess}
                      onToggle={() =>
                        updateAccountDraftField(
                          "reportAccess",
                          !accountDraft.reportAccess,
                        )
                      }
                      title="Report access"
                    />
                  </div>
                </FieldGroup>
              </>
            ) : null}
            {!selectedTeamMember.canEditAuthorization ? (
              <div className="rounded-2xl border border-border bg-surface-subtle/60 px-4 py-3 text-[11.5px] leading-[1.5] text-muted">
                Only another active admin can change role, status, or the setup, data-ops, and report access buckets for this account.
              </div>
            ) : null}
          </DialogFrame>
        </CatalogModalOverlay>
      ) : null}

      {activeDialog === "two-factor" ? (
        <CatalogModalOverlay>
          <DialogFrame
            description={settingsPageLabels.dialogs.twoFactorDescription}
            footer={
              <>
                <CatalogButton
                  onClick={() => {
                    setActiveDialog(null);
                    openPlaceholderAction(
                      "Continue",
                      "Two-factor setup handoff is not implemented yet.",
                    );
                  }}
                  variant="primary"
                >
                  Continue
                </CatalogButton>
                <CatalogButton onClick={() => setActiveDialog(null)} variant="secondary">
                  Cancel
                </CatalogButton>
              </>
            }
            onClose={() => setActiveDialog(null)}
            title={settingsPageLabels.dialogs.twoFactorTitle}
          >
            <p className="text-sm leading-7 text-muted">
              Scan the QR code in your authenticator app, confirm the six-digit code, and store the backup codes securely.
            </p>
            <CatalogCard className="flex h-48 items-center justify-center border-dashed bg-surface-subtle p-4 shadow-none">
              <span className="text-sm font-medium text-muted">Authenticator QR placeholder</span>
            </CatalogCard>
          </DialogFrame>
        </CatalogModalOverlay>
      ) : null}

      {activeDialog === "revoke-key" ? (
        <CatalogModalOverlay>
          <DialogFrame
            description={settingsPageLabels.dialogs.revokeDescription}
            footer={
              <>
                <button
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 dark:bg-rose-500 dark:hover:bg-rose-400"
                  onClick={() => {
                    void handleRevokeApiKey();
                  }}
                  type="button"
                >
                  {revokingApiKeyName === null ? "Revoke key" : "Revoking..."}
                </button>
                <CatalogButton onClick={() => setActiveDialog(null)} variant="secondary">
                  Cancel
                </CatalogButton>
              </>
            }
            onClose={() => {
              setActiveDialog(null);
              setPendingApiKeyName(null);
            }}
            title={settingsPageLabels.dialogs.revokeTitle}
          >
            <p className="text-sm leading-7 text-muted">
              Any service using this key will lose access immediately and will need a replacement key before the integration can recover.
            </p>
          </DialogFrame>
        </CatalogModalOverlay>
      ) : null}

      {placeholderAction ? (
        <PlaceholderActionDialog
          description={placeholderAction.description}
          onClose={() => setPlaceholderAction(null)}
          title={placeholderAction.title}
        />
      ) : null}

      {pendingConnectIntegration ? (
        <CatalogModalOverlay>
          <DialogFrame
            description={`Enter the API key for ${pendingConnectIntegration} to activate the connection.`}
            footer={
              <>
                <CatalogButton
                  onClick={() => {
                    setPendingConnectIntegration(null);
                    setConnectApiKeyDraft("");
                  }}
                  variant="secondary"
                >
                  Cancel
                </CatalogButton>
                <CatalogButton
                  disabled={connectApiKeyDraft.trim().length === 0 || isConnectingIntegration}
                  onClick={() => void handleIntegrationConnect()}
                  variant="primary"
                >
                  {isConnectingIntegration ? "Connecting…" : "Connect"}
                </CatalogButton>
              </>
            }
            onClose={() => {
              setPendingConnectIntegration(null);
              setConnectApiKeyDraft("");
            }}
            title={`Connect ${pendingConnectIntegration}`}
          >
            <FieldGroup label="API key">
              <TextField
                onChange={setConnectApiKeyDraft}
                placeholder="Paste your API key here"
                type="password"
                value={connectApiKeyDraft}
              />
            </FieldGroup>
            <p className="text-[11.5px] leading-[1.5] text-muted">
              The key is sent over HTTPS and stored in your workspace settings. You can
              disconnect at any time.
            </p>
          </DialogFrame>
        </CatalogModalOverlay>
      ) : null}
    </div>
  );
}

type BillingPaymentMethodEditorProps = Readonly<{
  currentPaymentMethod: BillingPaymentMethodRecord | null;
  draft: PaymentMethodDraft;
  isSaving: boolean;
  onChange: (field: keyof PaymentMethodDraft, value: string) => void;
  onRemove?: () => void;
  onReset: () => void;
  onSave: () => void;
  role: BillingPaymentMethodRole;
}>;

type BillingUsageStatCardProps = Readonly<{
  usage: BillingUsageRecord;
}>;

function BillingUsageStatCard({ usage }: BillingUsageStatCardProps) {
  return (
    <div className="rounded-[10px] border border-border bg-surface-subtle p-[18px]">
      <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted">
        {usage.label}
      </p>
      <p className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-foreground">
        {usage.value}
      </p>
      <p className="mt-1 text-[11.5px] text-muted">{usage.detail}</p>
    </div>
  );
}

function BillingPaymentMethodEditor({
  currentPaymentMethod,
  draft,
  isSaving,
  onChange,
  onRemove,
  onReset,
  onSave,
  role,
}: BillingPaymentMethodEditorProps) {
  return (
    <div className="rounded-[10px] border border-border bg-surface-subtle p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold text-foreground">
            {role === "primary" ? "Business card" : "Backup card"}
          </p>
          <p className="mt-1 text-[11.5px] leading-[1.5] text-muted">
            {currentPaymentMethod === null
              ? "No card on file."
              : `${currentPaymentMethod.brandLabel} ending in ${currentPaymentMethod.last4} • Expires ${formatExpiration(currentPaymentMethod.expMonth, currentPaymentMethod.expYear)}`}
          </p>
          {currentPaymentMethod?.postalCode ? (
            <p className="mt-1 text-[11.5px] leading-[1.5] text-muted">
              Billing ZIP {currentPaymentMethod.postalCode}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <FieldGroup label="Cardholder name">
            <TextField
              onChange={(value) => onChange("cardholderName", value)}
              placeholder="Broward HVAC Co."
              value={draft.cardholderName}
            />
          </FieldGroup>
        </div>
        <div className="md:col-span-2">
          <FieldGroup label="Card number">
            <TextField
              onChange={(value) => onChange("cardNumber", value)}
              placeholder="4242 4242 4242 4242"
              value={draft.cardNumber}
            />
          </FieldGroup>
        </div>
        <FieldGroup label="Exp. month">
          <TextField
            onChange={(value) => onChange("expMonth", value)}
            placeholder="05"
            value={draft.expMonth}
          />
        </FieldGroup>
        <FieldGroup label="Exp. year">
          <TextField
            onChange={(value) => onChange("expYear", value)}
            placeholder="2028"
            value={draft.expYear}
          />
        </FieldGroup>
        <FieldGroup label="Security code">
          <TextField
            onChange={(value) => onChange("cvc", value)}
            placeholder="123"
            value={draft.cvc}
          />
        </FieldGroup>
        <FieldGroup label="Billing ZIP">
          <TextField
            onChange={(value) => onChange("postalCode", value)}
            placeholder="33301"
            value={draft.postalCode}
          />
        </FieldGroup>
      </div>
      <p className="mt-3 text-[11.5px] leading-[1.5] text-muted">
        Card number and security code are used only to update the card and are not stored in this local prototype.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <CatalogButton disabled={isSaving} onClick={onSave} variant="primary">
          {isSaving ? "Saving..." : "Save card"}
        </CatalogButton>
        <CatalogButton disabled={isSaving} onClick={onReset} variant="secondary">
          Reset
        </CatalogButton>
        {onRemove ? (
          <CatalogButton disabled={isSaving} onClick={onRemove} variant="secondary">
            Remove
          </CatalogButton>
        ) : null}
      </div>
    </div>
  );
}

function normalizeInviteDraftRole(roleLabel: InviteRoleLabel): OrganizationAccountRole {
  switch (roleLabel) {
    case "Admin":
      return "admin";
    case "Operator":
      return "operator";
    case "Analyst":
      return "analyst";
    case "Viewer":
      return "viewer";
  }
}

function normalizeAccountDraftStatus(statusLabel: AccountStatusLabel) {
  switch (statusLabel) {
    case "Active":
      return "active" as const;
    case "Invited":
      return "invited" as const;
  }
}

function formatBillingCapInput(usageCapCents: number | null): string {
  if (usageCapCents === null) {
    return "";
  }

  return (usageCapCents / 100).toFixed(2);
}

function formatBillingCapSummary(usageCapCents: number | null): string {
  return usageCapCents === null ? "No cap" : formatUsdFromCents(usageCapCents);
}

function getBillingGraphUsageCapCents(input: Readonly<{
  billingCapDraft: string;
  savedUsageCapCents: number | null;
}>): number | null {
  try {
    return parseBillingCapInput(input.billingCapDraft);
  } catch {
    return input.savedUsageCapCents;
  }
}

function getBillingUsageItem(
  usageRecords: SettingsPageData["billing"]["usage"],
  metricId: BillingUsageMetricId,
): BillingUsageRecord {
  return (
    usageRecords.find((usageRecord) => usageRecord.id === metricId) ?? {
      detail: "",
      id: metricId,
      label: getBillingUsageLabel(metricId),
      value: "$0.00",
    }
  );
}

function getBillingUsageCapProgress(input: Readonly<{
  usageCapCents: number | null;
  usageThisPeriodCents: number;
}>): BillingUsageCapProgress {
  if (input.usageCapCents === null) {
    return {
      barWidthPercent: 0,
      caption: "Set a monthly cap to pause new AI runs automatically.",
      summary: "No cap set.",
    };
  }

  if (input.usageCapCents === 0) {
    const isCapReached = input.usageThisPeriodCents > 0;

    return {
      barWidthPercent: isCapReached ? 100 : 0,
      caption: `${formatUsdFromCents(input.usageThisPeriodCents)} used of ${formatUsdFromCents(0)} cap`,
      summary: isCapReached ? "Cap reached." : "No usage allowed at the current cap.",
    };
  }

  const rawPercent =
    (input.usageThisPeriodCents / input.usageCapCents) * 100;
  const clampedPercent = clampPercentage(rawPercent);
  const visiblePercent =
    clampedPercent > 0 ? Math.max(clampedPercent, 1.5) : 0;

  return {
    barWidthPercent: visiblePercent,
    caption: `${formatUsdFromCents(input.usageThisPeriodCents)} used of ${formatUsdFromCents(input.usageCapCents)} cap`,
    summary:
      clampedPercent >= 100
        ? "Cap reached."
        : `${formatBillingUsagePercent(clampedPercent)} of monthly cap used`,
  };
}

function getBillingUsageLabel(metricId: BillingUsageMetricId): string {
  switch (metricId) {
    case "flat_fee":
      return "Platform access";
    case "usage_this_period":
      return "Usage this period";
    case "current_total":
      return "Current total";
  }
}

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

function formatBillingUsagePercent(value: number): string {
  if (value === 0) {
    return "0%";
  }

  if (value < 0.01) {
    return "<0.01%";
  }

  if (value < 0.1) {
    return `${value.toFixed(3)}%`;
  }

  if (value < 1) {
    return `${value.toFixed(2)}%`;
  }

  if (value < 10) {
    return `${value.toFixed(1)}%`;
  }

  return `${value.toFixed(0)}%`;
}

function formatUsdFromCents(value: number): string {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: "currency",
  }).format(value / 100);
}

function parseBillingCapInput(value: string): number | null {
  const normalizedValue = value.replace(/[$,\s]/g, "");

  if (normalizedValue.length === 0) {
    return null;
  }

  if (!/^\d+(\.\d{0,2})?$/.test(normalizedValue)) {
    throw new Error("Enter a valid dollar amount with up to two decimal places.");
  }

  const usageCapCents = Math.round(Number(normalizedValue) * 100);

  if (!Number.isFinite(usageCapCents) || usageCapCents < 0) {
    throw new Error("Enter a valid non-negative dollar amount.");
  }

  return usageCapCents;
}

function createPaymentMethodDraft(
  paymentMethod: BillingPaymentMethodRecord | null,
): PaymentMethodDraft {
  return {
    cardNumber: "",
    cardholderName: paymentMethod?.cardholderName ?? "",
    cvc: "",
    expMonth:
      paymentMethod === null ? "" : paymentMethod.expMonth.toString().padStart(2, "0"),
    expYear: paymentMethod?.expYear.toString() ?? "",
    postalCode: paymentMethod?.postalCode ?? "",
  };
}

function findBillingPaymentMethod(
  paymentMethods: SettingsPageData["billing"]["paymentMethods"],
  role: BillingPaymentMethodRole,
): BillingPaymentMethodRecord | null {
  return paymentMethods.find((paymentMethod) => paymentMethod.role === role) ?? null;
}

function formatExpiration(expMonth: number, expYear: number): string {
  return `${expMonth.toString().padStart(2, "0")}/${expYear}`;
}

function parsePaymentMethodDraft(draft: PaymentMethodDraft) {
  const expMonth = parseIntegerField(draft.expMonth, "expiration month");
  const expYear = parseIntegerField(draft.expYear, "expiration year");
  const cardholderName = draft.cardholderName.trim();

  if (cardholderName.length === 0) {
    throw new Error("Enter the cardholder name.");
  }

  if (draft.cardNumber.trim().length === 0) {
    throw new Error("Enter the card number.");
  }

  if (draft.cvc.trim().length === 0) {
    throw new Error("Enter the security code.");
  }

  return {
    cardNumber: draft.cardNumber,
    cardholderName,
    cvc: draft.cvc,
    expMonth,
    expYear,
    postalCode: draft.postalCode.trim().length === 0 ? null : draft.postalCode.trim(),
  };
}

function parseIntegerField(value: string, label: string): number {
  const normalizedValue = value.trim();

  if (!/^\d+$/.test(normalizedValue)) {
    throw new Error(`Enter a valid ${label}.`);
  }

  return Number(normalizedValue);
}
