"use client";

import React, { useState } from "react";
import { z } from "zod";

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
import { supportedDocumentFamilies } from "@/features/foundation/domain/document-families";
import { LocaleSwitcher } from "@/features/i18n/components/locale-switcher";
import {
  type SettingsPageData,
  type SettingsTabId,
} from "@/features/settings/constants/settings-page-content";
import { settingsPreferenceIds } from "@/features/settings/domain/settings-preferences";
import {
  mergeSettingsMutationResponse,
  type SettingsMutationResponse,
} from "@/features/settings/lib/settings-page-state";
import { getSettingsSecurityAuthRowKind } from "@/features/settings/lib/settings-security";
import { useUiI18n } from "@/features/i18n/components/ui-i18n-provider";
import {
  persistAppTheme,
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
type SelectOption = Readonly<{
  label: string;
  value: string;
}>;
type ImportRuleDraft = SettingsPageData["importRules"][number];
type DeliverySettingsDraft = Readonly<{
  confidenceDropAlertEnabled: boolean;
  confidenceDropRecipientEmails: string;
  confidenceDropThreshold: string;
  parseFailureAlertEnabled: boolean;
  parseFailureCountThreshold: string;
  parseFailureRecipientEmails: string;
  queueDigestEnabled: boolean;
  queueDigestRecipientEmails: string;
  queueDigestSendTimeLocal: string;
  sourceDisconnectedAlertEnabled: boolean;
  sourceDisconnectedRecipientEmails: string;
  weeklyBriefEnabled: boolean;
  weeklyBriefRecipientEmails: string;
  weeklyBriefSendDay: SettingsPageData["deliverySettings"]["weeklyBrief"]["sendDay"];
  weeklyBriefSendTimeLocal: string;
}>;
type DataPolicyDraft = Readonly<{
  acceptanceRateDriftThreshold: string;
  apiRetentionDays: string;
  briefHighConfidenceFloor: string;
  classificationConfidenceFloor: string;
  emailRetentionDays: string;
  embeddingsEnabled: boolean;
  extractionEnabled: boolean;
  fieldConfidenceFloor: string;
  humanReviewRequired: boolean;
  outcomeRateDriftThreshold: string;
  parserConfidenceFloor: string;
  uploadRetentionDays: string;
}>;
type SettingsMessages = ReturnType<typeof useUiI18n>["messages"];
type TranslateMessage = ReturnType<typeof useUiI18n>["t"];

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
const DELIVERY_DAY_OPTIONS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
] as const;
const IMPORT_RULE_SOURCE_OPTIONS = ["upload", "email", "api"] as const;
const IMPORT_RULE_STATUS_OPTIONS = ["draft", "active", "archived"] as const;
const PARSER_ROUTE_OPTIONS = ["tabular", "text"] as const;
const INVITE_ROLE_OPTIONS = ["Admin", "Operator", "Analyst", "Viewer"] as const;
const ACCOUNT_STATUS_OPTIONS = ["Active", "Invited"] as const;

function toSelectOptions(
  values: readonly string[],
  labels: readonly string[],
): readonly SelectOption[] {
  return values.map((value, index) => ({
    label: labels[index] ?? value,
    value,
  }));
}

const settingsTabIcons: Record<SettingsTabId, React.ReactNode> = {
  myAccount: <svg fill="currentColor" height="14" viewBox="0 0 18 18" width="14"><path d="M9 2a4 4 0 110 8 4 4 0 010-8zm0 10c3.314 0 6 1.79 6 4v1H3v-1c0-2.21 2.686-4 6-4z" /></svg>,
  workspace: <svg fill="currentColor" height="14" viewBox="0 0 18 18" width="14"><path clipRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" fillRule="evenodd" /></svg>,
  sourcesOperations: <svg fill="currentColor" height="14" viewBox="0 0 18 18" width="14"><path clipRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" fillRule="evenodd" /></svg>,
  peopleAccess: <svg fill="currentColor" height="14" viewBox="0 0 18 18" width="14"><path d="M9 6a3 3 0 100-6 3 3 0 000 6zM17 6a3 3 0 10-6 0 3 3 0 006 0zM12.93 17H4.07c.08-3.08 2.44-5 4.93-5s4.85 1.92 4.93 5zM14.5 11a3 3 0 10-3 2.83A4.97 4.97 0 0114.5 17H17a3 3 0 000-6z" /></svg>,
  billing: <svg fill="currentColor" height="14" viewBox="0 0 18 18" width="14"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path clipRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" fillRule="evenodd" /></svg>,
};

type SettingsRequestError = Readonly<{
  error: string;
}>;

export function SettingsPage({ initialData, orgId }: SettingsPageProps) {
  const { locale, messages, t } = useUiI18n();
  const industryOptions = toSelectOptions(
    INDUSTRY_OPTIONS,
    messages.settingsPage.options.industry as readonly string[],
  );
  const revenueModelOptions = toSelectOptions(
    REVENUE_MODEL_OPTIONS,
    messages.settingsPage.options.revenueModel as readonly string[],
  );
  const invoiceCycleOptions = toSelectOptions(
    INVOICE_CYCLE_OPTIONS,
    messages.settingsPage.options.invoiceCycle as readonly string[],
  );
  const inviteRoleOptions = toSelectOptions(
    INVITE_ROLE_OPTIONS,
    messages.settingsPage.options.inviteRoles as readonly string[],
  );
  const accountStatusOptions = toSelectOptions(
    ACCOUNT_STATUS_OPTIONS,
    [
      messages.settingsPage.accountDialog.statusActive,
      messages.settingsPage.accountDialog.statusInvited,
    ],
  );
  const teamSizeOptions = toSelectOptions(
    TEAM_SIZE_OPTIONS,
    messages.settingsPage.options.teamSize as readonly string[],
  );
  const goalOptions = toSelectOptions(
    ALL_GOALS,
    messages.settingsPage.options.goals as readonly string[],
  );
  const deliveryDayOptions = DELIVERY_DAY_OPTIONS.map((day) => ({
    label: translateDeliveryDayLabel(day, t),
    value: day,
  }));
  const importRuleSourceOptions = IMPORT_RULE_SOURCE_OPTIONS.map((sourceKind) => ({
    label: translateImportRuleSourceLabel(sourceKind, t),
    value: sourceKind,
  }));
  const importRuleStatusOptions = IMPORT_RULE_STATUS_OPTIONS.map((status) => ({
    label: translateImportRuleStatusLabel(status, t),
    value: status,
  }));
  const parserRouteOptions = PARSER_ROUTE_OPTIONS.map((parserRoute) => ({
    label: translateParserRouteLabel(parserRoute, t),
    value: parserRoute,
  }));
  const documentFamilyOptions = supportedDocumentFamilies.map((family) => ({
    label: family.label,
    value: family.id,
  }));
  const [activeTab, setActiveTab] = useState<SettingsTabId>(
    initialData.tabs[0]?.id ?? "myAccount",
  );
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
  const [deliverySettingsDraft, setDeliverySettingsDraft] = useState(() =>
    createDeliverySettingsDraft(initialData.deliverySettings),
  );
  const [dataPolicyDraft, setDataPolicyDraft] = useState(() =>
    createDataPolicyDraft(initialData.dataPolicy),
  );
  const [importRuleDrafts, setImportRuleDrafts] = useState<readonly ImportRuleDraft[]>(
    initialData.importRules,
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
  const [isSavingDeliverySettings, setIsSavingDeliverySettings] = useState(false);
  const [isSavingDataPolicy, setIsSavingDataPolicy] = useState(false);
  const [isSavingImportRules, setIsSavingImportRules] = useState(false);
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
  const flatFeeUsage = localizeBillingUsageRecord(
    getBillingUsageItem(pageData.billing.usage, "flat_fee", messages),
    messages,
    t,
  );
  const usageThisPeriodUsage = localizeBillingUsageRecord(
    getBillingUsageItem(pageData.billing.usage, "usage_this_period", messages),
    messages,
    t,
  );
  const currentTotalUsage = localizeBillingUsageRecord(
    getBillingUsageItem(pageData.billing.usage, "current_total", messages),
    messages,
    t,
  );
  const usageGraphCapCents = getBillingGraphUsageCapCents({
    billingCapDraft,
    messages,
    savedUsageCapCents: pageData.billing.usageCapCents,
  });
  const isPreviewingUsageCap = usageGraphCapCents !== pageData.billing.usageCapCents;
  const usageCapProgress = getBillingUsageCapProgress({
    locale,
    messages,
    usageCapCents: usageGraphCapCents,
    usageThisPeriodCents: pageData.billing.graphMetrics.usageThisPeriodCents,
  });
  const selectedTeamMember =
    accountDraft === null
      ? null
      : pageData.team.members.find((member) => member.id === accountDraft.id) ?? null;
  const currentTeamMember =
    pageData.team.members.find((member) => member.isCurrentUser) ?? null;
  const selfServiceSecurityRows = pageData.security.authRows.filter((row) => {
    const rowKind = getSettingsSecurityAuthRowKind(row.title);

    return rowKind === "emailPassword" || rowKind === "twoFactor";
  });
  const workspaceSecurityRows = pageData.security.authRows.filter(
    (row) => getSettingsSecurityAuthRowKind(row.title) === "singleSignOn",
  );

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
      setActiveTab((currentTab) =>
        nextPageData.tabs.some((tab) => tab.id === currentTab)
          ? currentTab
          : (nextPageData.tabs[0]?.id ?? currentTab),
      );
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
      setDeliverySettingsDraft(
        createDeliverySettingsDraft(nextPageData.deliverySettings),
      );
      setDataPolicyDraft(createDataPolicyDraft(nextPageData.dataPolicy));
      setImportRuleDrafts(nextPageData.importRules);
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
        "error" in payload
          ? payload.error
          : messages.settingsPage.errors.requestFailed,
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
        messages.settingsPage.errors.accountUpdateFailed,
        getSettingsErrorMessage(error, messages.settingsPage.errors.requestFailed),
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
        messages.settingsPage.errors.inviteFailed,
        getSettingsErrorMessage(error, messages.settingsPage.errors.requestFailed),
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
        messages.settingsPage.errors.profileSaveFailed,
        getSettingsErrorMessage(error, messages.settingsPage.errors.requestFailed),
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
        messages.settingsPage.errors.websiteDetailsSaveFailed,
        getSettingsErrorMessage(error, messages.settingsPage.errors.requestFailed),
      );
    } finally {
      setIsSavingWebsiteDetails(false);
    }
  }

  function handleResetWebsiteDetails() {
    setWebsiteDetailsDraft(pageData.websiteDetails);
    console.info("[PulseOps] Reset website details: public contact values restored to the current workspace defaults.");
  }

  function updateDeliverySettingsDraftField(
    field: keyof DeliverySettingsDraft,
    value: boolean | string,
  ) {
    setDeliverySettingsDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSaveDeliverySettings() {
    if (isSavingDeliverySettings) {
      return;
    }

    let parsedDeliverySettings: SettingsPageData["deliverySettings"];

    try {
      parsedDeliverySettings = parseDeliverySettingsDraft(
        deliverySettingsDraft,
        messages,
      );
    } catch (error) {
      openPlaceholderAction(
        t("settingsPage.errors.deliverySettingsSaveFailed", "Could not save delivery rules"),
        getSettingsErrorMessage(error, messages.settingsPage.errors.requestFailed),
      );
      return;
    }

    setIsSavingDeliverySettings(true);

    try {
      const payload = await requestSettingsMutation({
        body: {
          deliverySettings: parsedDeliverySettings,
          orgId,
        },
        method: "PATCH",
        url: "/api/settings",
      });

      applyMutationResponse(payload);
    } catch (error) {
      openPlaceholderAction(
        t("settingsPage.errors.deliverySettingsSaveFailed", "Could not save delivery rules"),
        getSettingsErrorMessage(error, messages.settingsPage.errors.requestFailed),
      );
    } finally {
      setIsSavingDeliverySettings(false);
    }
  }

  function handleResetDeliverySettings() {
    setDeliverySettingsDraft(createDeliverySettingsDraft(pageData.deliverySettings));
  }

  function updateDataPolicyDraftField(
    field: keyof DataPolicyDraft,
    value: boolean | string,
  ) {
    setDataPolicyDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSaveDataPolicy() {
    if (isSavingDataPolicy) {
      return;
    }

    let parsedDataPolicy: SettingsPageData["dataPolicy"];

    try {
      parsedDataPolicy = parseDataPolicyDraft(dataPolicyDraft);
    } catch (error) {
      openPlaceholderAction(
        t("settingsPage.errors.dataPolicySaveFailed", "Could not save data policy"),
        getSettingsErrorMessage(error, messages.settingsPage.errors.requestFailed),
      );
      return;
    }

    setIsSavingDataPolicy(true);

    try {
      const payload = await requestSettingsMutation({
        body: {
          dataPolicy: parsedDataPolicy,
          orgId,
        },
        method: "PATCH",
        url: "/api/settings",
      });

      applyMutationResponse(payload);
    } catch (error) {
      openPlaceholderAction(
        t("settingsPage.errors.dataPolicySaveFailed", "Could not save data policy"),
        getSettingsErrorMessage(error, messages.settingsPage.errors.requestFailed),
      );
    } finally {
      setIsSavingDataPolicy(false);
    }
  }

  function handleResetDataPolicy() {
    setDataPolicyDraft(createDataPolicyDraft(pageData.dataPolicy));
  }

  function updateImportRuleDraftField(
    ruleId: string,
    field: keyof ImportRuleDraft,
    value: string,
  ) {
    setImportRuleDrafts((currentRules) =>
      currentRules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              [field]: value,
            }
          : rule,
      ),
    );
  }

  async function handleSaveImportRules() {
    if (isSavingImportRules) {
      return;
    }

    setIsSavingImportRules(true);

    try {
      const payload = await requestSettingsMutation({
        body: {
          importRules: importRuleDrafts,
          orgId,
        },
        method: "PATCH",
        url: "/api/settings",
      });

      applyMutationResponse(payload);
    } catch (error) {
      openPlaceholderAction(
        t("settingsPage.errors.importRulesSaveFailed", "Could not save import rules"),
        getSettingsErrorMessage(error, messages.settingsPage.errors.requestFailed),
      );
    } finally {
      setIsSavingImportRules(false);
    }
  }

  function handleResetImportRules() {
    setImportRuleDrafts(pageData.importRules);
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
        messages.settingsPage.errors.notificationsSaveFailed,
        getSettingsErrorMessage(error, messages.settingsPage.errors.requestFailed),
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
    persistAppTheme(themeValue);
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
        messages.settingsPage.errors.preferencesSaveFailed,
        getSettingsErrorMessage(error, messages.settingsPage.errors.requestFailed),
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
      usageCapCents = parseBillingCapInput(billingCapDraft, messages);
    } catch (error) {
      openPlaceholderAction(
        messages.settingsPage.errors.usageCapSaveFailed,
        getSettingsErrorMessage(error, messages.settingsPage.errors.validDollarAmount),
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
        messages.settingsPage.errors.usageCapSaveFailed,
        getSettingsErrorMessage(error, messages.settingsPage.errors.requestFailed),
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
      paymentMethodInput = parsePaymentMethodDraft(draft, messages);
    } catch (error) {
      openPlaceholderAction(
        role === "primary"
          ? messages.settingsPage.errors.paymentMethodPrimaryFailed
          : messages.settingsPage.errors.paymentMethodBackupFailed,
        getSettingsErrorMessage(error, messages.settingsPage.errors.requestFailed),
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
        role === "primary"
          ? messages.settingsPage.errors.paymentMethodPrimaryFailed
          : messages.settingsPage.errors.paymentMethodBackupFailed,
        getSettingsErrorMessage(error, messages.settingsPage.errors.requestFailed),
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
        messages.settingsPage.errors.backupCardRemoveFailed,
        getSettingsErrorMessage(error, messages.settingsPage.errors.requestFailed),
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
        messages.settingsPage.errors.sessionRevokeFailed,
        getSettingsErrorMessage(error, messages.settingsPage.errors.requestFailed),
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
        messages.settingsPage.errors.apiKeyRevokeFailed,
        getSettingsErrorMessage(error, messages.settingsPage.errors.requestFailed),
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
          messages.settingsPage.errors.integrationDisconnectFailed,
          getSettingsErrorMessage(error, messages.settingsPage.errors.requestFailed),
        );
      } finally {
        setIsConnectingIntegration(false);
      }
      return;
    }

    openPlaceholderAction(
      translateIntegrationActionLabel(integration.actionLabel, messages),
      integration.title,
    );
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
        messages.settingsPage.errors.integrationConnectFailed,
        getSettingsErrorMessage(error, messages.settingsPage.errors.requestFailed),
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
        <aside className="sticky top-0 w-[172px] shrink-0 pt-[2px]">
          <div className="flex flex-col gap-[2px]">
            {pageData.tabs.map((tab) => (
              <SettingsTabButton
                key={tab.id}
                active={activeTab === tab.id}
                icon={settingsTabIcons[tab.id]}
                label={getSettingsTabLabel(tab.id, messages)}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {activeTab === "workspace" ? (
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
                          key={goal.value}
                          className="flex cursor-pointer items-center gap-[10px] rounded-[6px] py-[5px] text-[13px] text-foreground transition-colors"
                        >
                            <input
                              checked={organizationDraft.goals.includes(goal.value)}
                              className="h-[14px] w-[14px] shrink-0 cursor-pointer rounded accent-accent"
                              onChange={() => toggleGoal(goal.value)}
                              type="checkbox"
                            />
                            {goal.label}
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
                description={messages.settingsPage.actionDescriptions.websiteDetails}
                title={messages.settingsPage.actionTitles.websiteDetails}
              >
                <div className="grid gap-[14px] md:grid-cols-2">
                  <FieldGroup label={messages.settingsPage.websiteDetails.fields.supportEmail}>
                    <TextField
                      onChange={(value) => updateWebsiteDetailsField("supportEmail", value)}
                      type="email"
                      value={websiteDetailsDraft.supportEmail}
                    />
                  </FieldGroup>
                  <FieldGroup label={messages.settingsPage.websiteDetails.fields.salesEmail}>
                    <TextField
                      onChange={(value) => updateWebsiteDetailsField("salesEmail", value)}
                      type="email"
                      value={websiteDetailsDraft.salesEmail}
                    />
                  </FieldGroup>
                  <FieldGroup label={messages.settingsPage.websiteDetails.fields.pressEmail}>
                    <TextField
                      onChange={(value) => updateWebsiteDetailsField("pressEmail", value)}
                      type="email"
                      value={websiteDetailsDraft.pressEmail}
                    />
                  </FieldGroup>
                  <FieldGroup
                    label={messages.settingsPage.websiteDetails.fields.partnershipsEmail}
                  >
                    <TextField
                      onChange={(value) =>
                        updateWebsiteDetailsField("partnershipsEmail", value)
                      }
                      type="email"
                      value={websiteDetailsDraft.partnershipsEmail}
                    />
                  </FieldGroup>
                  <FieldGroup label={messages.settingsPage.websiteDetails.fields.mainPhone}>
                    <TextField
                      onChange={(value) => updateWebsiteDetailsField("mainPhone", value)}
                      value={websiteDetailsDraft.mainPhone}
                    />
                  </FieldGroup>
                  <FieldGroup label={messages.settingsPage.websiteDetails.fields.supportPhone}>
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
                    isSavingWebsiteDetails
                      ? messages.settingsPage.actions.saving
                      : messages.settingsPage.actions.saveWebsiteDetails
                  }
                  secondaryLabel={messages.settingsPage.actions.reset}
                />
              </PreferencePanel>

              <PreferencePanel
                description={messages.settingsPage.actionDescriptions.preferences}
                title={messages.settingsPage.actionTitles.preferences}
              >
                {preferenceItems.map((preference) => (
                  <ToggleRow
                    key={preference.id}
                    description={translatePreferenceDescription(
                      preference.id,
                      preference.description,
                      messages,
                    )}
                    enabled={preference.enabled}
                    onToggle={() => togglePreference(preference.id)}
                    title={translatePreferenceTitle(
                      preference.id,
                      preference.title,
                      messages,
                    )}
                  />
                ))}
                <div className="pt-4">
                  <CatalogButton
                    onClick={() => {
                      void handleSavePreferences();
                    }}
                    variant="primary"
                  >
                    {isSavingPreferences
                      ? messages.settingsPage.actions.saving
                      : messages.settingsPage.actions.savePreferences}
                  </CatalogButton>
                </div>
              </PreferencePanel>
            </div>
          ) : null}

          {activeTab === "peopleAccess" ? (
            <div className="space-y-[16px]">
              <CatalogCard className="overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-border px-[18px] py-[13px]">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[13px] font-semibold tracking-[-0.015em] text-foreground">
                      {messages.settingsPage.actionTitles.teamMembers}
                    </h3>
                    <span className="rounded-full bg-white/[0.06] px-2 py-[2px] text-[10.5px] font-bold text-muted">
                      {t("settingsPage.team.membersCount", "{{count}} members", {
                        count: pageData.team.members.length,
                      })}
                    </span>
                  </div>
                  {pageData.currentUser.canInviteMembers ? (
                    <CatalogButton
                      onClick={() => setActiveDialog("invite")}
                      variant="primary"
                    >
                      + {messages.settingsPage.actions.inviteMember}
                    </CatalogButton>
                  ) : null}
                </div>
                <div className="border-b border-border bg-surface-subtle/60 px-[18px] py-[10px] text-[11.5px] text-muted">
                  {t("settingsPage.team.signedInSummary", "Signed in as {{name}} ({{role}}).", {
                    name: pageData.currentUser.name,
                    role: translateRoleLabel(pageData.currentUser.role, messages),
                  })}{" "}
                  {messages.settingsPage.actionDescriptions.manageAccounts}
                  {pageData.currentUser.isFallbackSession
                    ? ` ${messages.settingsPage.actionDescriptions.fallbackSessionNotice}`
                    : null}
                </div>
                <div>
                  {pageData.team.members.map((member) => (
                    <TeamMemberRow
                      accessSummary={translateAccessSummary(member.accessSummary, messages)}
                      actionLabel={
                        member.canOpenAccountControls
                          ? member.isCurrentUser
                            ? messages.settingsPage.team.myAccount
                            : messages.settingsPage.team.manage
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
                      role={translateRoleLabel(member.role, messages)}
                      status={member.status}
                      statusLabel={translateAccountStatus(member.status, messages)}
                    />
                  ))}
                </div>
              </CatalogCard>

              <CatalogCard className="overflow-hidden">
                <div className="flex items-start justify-between gap-3 border-b border-border px-[18px] py-[13px]">
                  <div>
                    <h3 className="text-[13px] font-semibold tracking-[-0.015em] text-foreground">
                      {messages.settingsPage.actionTitles.rolePermissions}
                    </h3>
                    <p className="mt-[2px] text-[11.5px] leading-[1.4] text-muted">
                      {messages.settingsPage.actionDescriptions.rolePermissions}
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-[12.5px]">
                    <thead>
                      <tr className="border-b border-border">
                        {[
                          messages.settingsPage.team.permissionHeaders.permission,
                          messages.settingsPage.team.permissionHeaders.admin,
                          messages.settingsPage.team.permissionHeaders.operator,
                          messages.settingsPage.team.permissionHeaders.analyst,
                          messages.settingsPage.team.permissionHeaders.viewer,
                        ].map((header) => (
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
                          <td className="px-[14px] py-2 font-medium text-foreground">
                            {translatePermissionLabel(permission.permission, messages)}
                          </td>
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

          {activeTab === "sourcesOperations" ? (
            <div className="space-y-5">
              {pageData.currentUser.canManageWorkspaceSettings ? (
                <CatalogCard className="overflow-hidden">
                  <div className="border-b border-border px-[18px] py-[13px]">
                    <h3 className="text-[13px] font-semibold tracking-[-0.015em] text-foreground">
                      {messages.settingsPage.actionTitles.connectedSources}
                    </h3>
                    <p className="mt-[2px] text-[11.5px] leading-[1.4] text-muted">
                      {messages.settingsPage.actionDescriptions.connectedSources}
                    </p>
                  </div>
                  {pageData.integrations.map((integration) => (
                    <IntegrationListItem
                      key={integration.title}
                      actionLabel={translateIntegrationActionLabel(
                        integration.actionLabel,
                        messages,
                      )}
                      description={translateIntegrationDescription(
                        integration.title,
                        integration.description,
                        messages,
                      )}
                      onAction={() => void handleIntegrationAction(integration)}
                      onSecondaryAction={() =>
                        openPlaceholderAction(
                          translateIntegrationActionLabel(
                            integration.secondaryActionLabel ??
                              messages.settingsPage.actions.configure,
                            messages,
                          ),
                          integration.title,
                        )
                      }
                      secondaryActionLabel={
                        integration.secondaryActionLabel
                          ? translateIntegrationActionLabel(
                              integration.secondaryActionLabel,
                              messages,
                            )
                          : undefined
                      }
                      statusLabel={translateIntegrationStatusLabel(
                        integration.statusLabel,
                        messages,
                        t,
                      )}
                      statusTone={integration.statusTone}
                      title={integration.title}
                    />
                  ))}
                </CatalogCard>
              ) : null}

              {pageData.currentUser.canManageWorkspaceSettings ? (
                <PreferencePanel
                  description={t(
                    "settingsPage.actionDescriptions.dataPolicy",
                    "Set the review, retention, and processing rules that govern how files move through the workspace.",
                  )}
                  title={t(
                    "settingsPage.actionTitles.dataPolicy",
                    "Data policy",
                  )}
                >
                  <div className="grid gap-4 lg:grid-cols-3">
                    <ToggleRow
                      description={t(
                        "settingsPage.dataPolicy.extractionEnabledDescription",
                        "Allow canonical fact extraction during ingestion.",
                      )}
                      enabled={dataPolicyDraft.extractionEnabled}
                      onToggle={() =>
                        updateDataPolicyDraftField(
                          "extractionEnabled",
                          !dataPolicyDraft.extractionEnabled,
                        )
                      }
                      title={t(
                        "settingsPage.dataPolicy.extractionEnabledTitle",
                        "Extraction enabled",
                      )}
                    />
                    <ToggleRow
                      description={t(
                        "settingsPage.dataPolicy.embeddingsEnabledDescription",
                        "Allow retrieval chunks and embeddings after normalization completes.",
                      )}
                      enabled={dataPolicyDraft.embeddingsEnabled}
                      onToggle={() =>
                        updateDataPolicyDraftField(
                          "embeddingsEnabled",
                          !dataPolicyDraft.embeddingsEnabled,
                        )
                      }
                      title={t(
                        "settingsPage.dataPolicy.embeddingsEnabledTitle",
                        "Embeddings enabled",
                      )}
                    />
                    <ToggleRow
                      description={t(
                        "settingsPage.dataPolicy.humanReviewRequiredDescription",
                        "Require an operator review handoff before files are treated as ready downstream.",
                      )}
                      enabled={dataPolicyDraft.humanReviewRequired}
                      onToggle={() =>
                        updateDataPolicyDraftField(
                          "humanReviewRequired",
                          !dataPolicyDraft.humanReviewRequired,
                        )
                      }
                      title={t(
                        "settingsPage.dataPolicy.humanReviewRequiredTitle",
                        "Human review required",
                      )}
                    />
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <FieldGroup
                      hint={t(
                        "settingsPage.dataPolicy.uploadRetentionHint",
                        "Applied to files added through manual upload.",
                      )}
                      label={t(
                        "settingsPage.dataPolicy.uploadRetentionLabel",
                        "Manual upload retention (days)",
                      )}
                    >
                      <TextField
                        onChange={(value) =>
                          updateDataPolicyDraftField("uploadRetentionDays", value)
                        }
                        value={dataPolicyDraft.uploadRetentionDays}
                      />
                    </FieldGroup>
                    <FieldGroup
                      hint={t(
                        "settingsPage.dataPolicy.emailRetentionHint",
                        "Applied to files accepted from email forwarding.",
                      )}
                      label={t(
                        "settingsPage.dataPolicy.emailRetentionLabel",
                        "Email retention (days)",
                      )}
                    >
                      <TextField
                        onChange={(value) =>
                          updateDataPolicyDraftField("emailRetentionDays", value)
                        }
                        value={dataPolicyDraft.emailRetentionDays}
                      />
                    </FieldGroup>
                    <FieldGroup
                      hint={t(
                        "settingsPage.dataPolicy.apiRetentionHint",
                        "Applied to files accepted from API and connected sources.",
                      )}
                      label={t(
                        "settingsPage.dataPolicy.apiRetentionLabel",
                        "API retention (days)",
                      )}
                    >
                      <TextField
                        onChange={(value) =>
                          updateDataPolicyDraftField("apiRetentionDays", value)
                        }
                        value={dataPolicyDraft.apiRetentionDays}
                      />
                    </FieldGroup>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <FieldGroup
                      label={t(
                        "settingsPage.dataPolicy.parserConfidenceLabel",
                        "Parser confidence floor",
                      )}
                    >
                      <TextField
                        onChange={(value) =>
                          updateDataPolicyDraftField("parserConfidenceFloor", value)
                        }
                        value={dataPolicyDraft.parserConfidenceFloor}
                      />
                    </FieldGroup>
                    <FieldGroup
                      label={t(
                        "settingsPage.dataPolicy.classificationConfidenceLabel",
                        "Classification confidence floor",
                      )}
                    >
                      <TextField
                        onChange={(value) =>
                          updateDataPolicyDraftField(
                            "classificationConfidenceFloor",
                            value,
                          )
                        }
                        value={dataPolicyDraft.classificationConfidenceFloor}
                      />
                    </FieldGroup>
                    <FieldGroup
                      label={t(
                        "settingsPage.dataPolicy.fieldConfidenceLabel",
                        "Field confidence floor",
                      )}
                    >
                      <TextField
                        onChange={(value) =>
                          updateDataPolicyDraftField("fieldConfidenceFloor", value)
                        }
                        value={dataPolicyDraft.fieldConfidenceFloor}
                      />
                    </FieldGroup>
                    <FieldGroup
                      label={t(
                        "settingsPage.dataPolicy.briefConfidenceLabel",
                        "Brief high-confidence floor",
                      )}
                    >
                      <TextField
                        onChange={(value) =>
                          updateDataPolicyDraftField("briefHighConfidenceFloor", value)
                        }
                        value={dataPolicyDraft.briefHighConfidenceFloor}
                      />
                    </FieldGroup>
                    <FieldGroup
                      label={t(
                        "settingsPage.dataPolicy.acceptanceDriftLabel",
                        "Acceptance-rate drift alert",
                      )}
                    >
                      <TextField
                        onChange={(value) =>
                          updateDataPolicyDraftField(
                            "acceptanceRateDriftThreshold",
                            value,
                          )
                        }
                        value={dataPolicyDraft.acceptanceRateDriftThreshold}
                      />
                    </FieldGroup>
                    <FieldGroup
                      label={t(
                        "settingsPage.dataPolicy.outcomeDriftLabel",
                        "Outcome-rate drift alert",
                      )}
                    >
                      <TextField
                        onChange={(value) =>
                          updateDataPolicyDraftField(
                            "outcomeRateDriftThreshold",
                            value,
                          )
                        }
                        value={dataPolicyDraft.outcomeRateDriftThreshold}
                      />
                    </FieldGroup>
                  </div>

                  <div className="mt-5">
                    <SettingsActionRow
                      onPrimaryAction={() => {
                        void handleSaveDataPolicy();
                      }}
                      onSecondaryAction={handleResetDataPolicy}
                      primaryLabel={
                        isSavingDataPolicy
                          ? messages.settingsPage.actions.saving
                          : t(
                              "settingsPage.actions.saveDataPolicy",
                              "Save data policy",
                            )
                      }
                      secondaryLabel={messages.settingsPage.actions.reset}
                    />
                  </div>
                </PreferencePanel>
              ) : null}

              {pageData.currentUser.canManageOperationalSettings ? (
                <PreferencePanel
                  description={t(
                    "settingsPage.actionDescriptions.deliveryRules",
                    "Define who gets the weekly brief and operational alerts, and when those notices go out.",
                  )}
                  title={t(
                    "settingsPage.actionTitles.deliveryRules",
                    "Delivery rules",
                  )}
                >
                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="rounded-[10px] border border-border bg-surface-subtle p-4">
                      <ToggleRow
                        description={t(
                          "settingsPage.delivery.weeklyBriefDescription",
                          "Email the weekly cash and margin brief on a regular schedule.",
                        )}
                        enabled={deliverySettingsDraft.weeklyBriefEnabled}
                        onToggle={() =>
                          updateDeliverySettingsDraftField(
                            "weeklyBriefEnabled",
                            !deliverySettingsDraft.weeklyBriefEnabled,
                          )
                        }
                        title={t(
                          "settingsPage.delivery.weeklyBriefTitle",
                          "Weekly brief email",
                        )}
                      />
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <FieldGroup
                          label={t(
                            "settingsPage.delivery.weeklyBriefDayLabel",
                            "Send day",
                          )}
                        >
                          <SelectField
                            onChange={(value) =>
                              updateDeliverySettingsDraftField(
                                "weeklyBriefSendDay",
                                value,
                              )
                            }
                            options={deliveryDayOptions}
                            value={deliverySettingsDraft.weeklyBriefSendDay}
                          />
                        </FieldGroup>
                        <FieldGroup
                          label={t(
                            "settingsPage.delivery.weeklyBriefTimeLabel",
                            "Send time",
                          )}
                        >
                          <TextField
                            onChange={(value) =>
                              updateDeliverySettingsDraftField(
                                "weeklyBriefSendTimeLocal",
                                value,
                              )
                            }
                            value={deliverySettingsDraft.weeklyBriefSendTimeLocal}
                          />
                        </FieldGroup>
                      </div>
                      <div className="mt-4">
                        <FieldGroup
                          hint={t(
                            "settingsPage.delivery.recipientHint",
                            "Enter one or more email addresses, separated by commas.",
                          )}
                          label={t(
                            "settingsPage.delivery.weeklyBriefRecipientsLabel",
                            "Recipients",
                          )}
                        >
                          <TextField
                            onChange={(value) =>
                              updateDeliverySettingsDraftField(
                                "weeklyBriefRecipientEmails",
                                value,
                              )
                            }
                            value={deliverySettingsDraft.weeklyBriefRecipientEmails}
                          />
                        </FieldGroup>
                      </div>
                    </div>

                    <div className="rounded-[10px] border border-border bg-surface-subtle p-4">
                      <ToggleRow
                        description={t(
                          "settingsPage.delivery.queueDigestDescription",
                          "Send a digest of queue work that still needs attention.",
                        )}
                        enabled={deliverySettingsDraft.queueDigestEnabled}
                        onToggle={() =>
                          updateDeliverySettingsDraftField(
                            "queueDigestEnabled",
                            !deliverySettingsDraft.queueDigestEnabled,
                          )
                        }
                        title={t(
                          "settingsPage.delivery.queueDigestTitle",
                          "Daily queue digest",
                        )}
                      />
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <FieldGroup
                          label={t(
                            "settingsPage.delivery.queueDigestTimeLabel",
                            "Send time",
                          )}
                        >
                          <TextField
                            onChange={(value) =>
                              updateDeliverySettingsDraftField(
                                "queueDigestSendTimeLocal",
                                value,
                              )
                            }
                            value={deliverySettingsDraft.queueDigestSendTimeLocal}
                          />
                        </FieldGroup>
                        <FieldGroup
                          label={t(
                            "settingsPage.delivery.queueDigestRecipientsLabel",
                            "Recipients",
                          )}
                        >
                          <TextField
                            onChange={(value) =>
                              updateDeliverySettingsDraftField(
                                "queueDigestRecipientEmails",
                                value,
                              )
                            }
                            value={deliverySettingsDraft.queueDigestRecipientEmails}
                          />
                        </FieldGroup>
                      </div>
                    </div>

                    <div className="rounded-[10px] border border-border bg-surface-subtle p-4">
                      <ToggleRow
                        description={t(
                          "settingsPage.delivery.parseFailureDescription",
                          "Escalate when enough files fail in one sync to need operator attention.",
                        )}
                        enabled={deliverySettingsDraft.parseFailureAlertEnabled}
                        onToggle={() =>
                          updateDeliverySettingsDraftField(
                            "parseFailureAlertEnabled",
                            !deliverySettingsDraft.parseFailureAlertEnabled,
                          )
                        }
                        title={t(
                          "settingsPage.delivery.parseFailureTitle",
                          "Parse failure alert",
                        )}
                      />
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <FieldGroup
                          label={t(
                            "settingsPage.delivery.parseFailureThresholdLabel",
                            "Failure count threshold",
                          )}
                        >
                          <TextField
                            onChange={(value) =>
                              updateDeliverySettingsDraftField(
                                "parseFailureCountThreshold",
                                value,
                              )
                            }
                            value={deliverySettingsDraft.parseFailureCountThreshold}
                          />
                        </FieldGroup>
                        <FieldGroup
                          label={t(
                            "settingsPage.delivery.parseFailureRecipientsLabel",
                            "Recipients",
                          )}
                        >
                          <TextField
                            onChange={(value) =>
                              updateDeliverySettingsDraftField(
                                "parseFailureRecipientEmails",
                                value,
                              )
                            }
                            value={deliverySettingsDraft.parseFailureRecipientEmails}
                          />
                        </FieldGroup>
                      </div>
                    </div>

                    <div className="rounded-[10px] border border-border bg-surface-subtle p-4">
                      <ToggleRow
                        description={t(
                          "settingsPage.delivery.confidenceDropDescription",
                          "Alert the team when extraction confidence slips below the workspace floor.",
                        )}
                        enabled={deliverySettingsDraft.confidenceDropAlertEnabled}
                        onToggle={() =>
                          updateDeliverySettingsDraftField(
                            "confidenceDropAlertEnabled",
                            !deliverySettingsDraft.confidenceDropAlertEnabled,
                          )
                        }
                        title={t(
                          "settingsPage.delivery.confidenceDropTitle",
                          "Confidence drop alert",
                        )}
                      />
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <FieldGroup
                          label={t(
                            "settingsPage.delivery.confidenceDropThresholdLabel",
                            "Confidence threshold",
                          )}
                        >
                          <TextField
                            onChange={(value) =>
                              updateDeliverySettingsDraftField(
                                "confidenceDropThreshold",
                                value,
                              )
                            }
                            value={deliverySettingsDraft.confidenceDropThreshold}
                          />
                        </FieldGroup>
                        <FieldGroup
                          label={t(
                            "settingsPage.delivery.confidenceDropRecipientsLabel",
                            "Recipients",
                          )}
                        >
                          <TextField
                            onChange={(value) =>
                              updateDeliverySettingsDraftField(
                                "confidenceDropRecipientEmails",
                                value,
                              )
                            }
                            value={deliverySettingsDraft.confidenceDropRecipientEmails}
                          />
                        </FieldGroup>
                      </div>
                    </div>

                    <div className="rounded-[10px] border border-border bg-surface-subtle p-4 xl:col-span-2">
                      <ToggleRow
                        description={t(
                          "settingsPage.delivery.sourceDisconnectedDescription",
                          "Send an immediate alert when a connected source stops syncing.",
                        )}
                        enabled={deliverySettingsDraft.sourceDisconnectedAlertEnabled}
                        onToggle={() =>
                          updateDeliverySettingsDraftField(
                            "sourceDisconnectedAlertEnabled",
                            !deliverySettingsDraft.sourceDisconnectedAlertEnabled,
                          )
                        }
                        title={t(
                          "settingsPage.delivery.sourceDisconnectedTitle",
                          "Source disconnected alert",
                        )}
                      />
                      <div className="mt-4">
                        <FieldGroup
                          label={t(
                            "settingsPage.delivery.sourceDisconnectedRecipientsLabel",
                            "Recipients",
                          )}
                        >
                          <TextField
                            onChange={(value) =>
                              updateDeliverySettingsDraftField(
                                "sourceDisconnectedRecipientEmails",
                                value,
                              )
                            }
                            value={
                              deliverySettingsDraft.sourceDisconnectedRecipientEmails
                            }
                          />
                        </FieldGroup>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <SettingsActionRow
                      onPrimaryAction={() => {
                        void handleSaveDeliverySettings();
                      }}
                      onSecondaryAction={handleResetDeliverySettings}
                      primaryLabel={
                        isSavingDeliverySettings
                          ? messages.settingsPage.actions.saving
                          : t(
                              "settingsPage.actions.saveDeliveryRules",
                              "Save delivery rules",
                            )
                      }
                      secondaryLabel={messages.settingsPage.actions.reset}
                    />
                  </div>
                </PreferencePanel>
              ) : null}

              {pageData.currentUser.canManageWorkspaceSettings ? (
                <PreferencePanel
                  description={t(
                    "settingsPage.actionDescriptions.importRules",
                    "Control which source patterns should route into which document families on this workspace.",
                  )}
                  title={t(
                    "settingsPage.actionTitles.importRules",
                    "Import rules",
                  )}
                >
                  <div className="space-y-4">
                    {importRuleDrafts.map((rule) => (
                      <div
                        key={rule.id}
                        className="rounded-[10px] border border-border bg-surface-subtle p-4"
                      >
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,0.8fr))]">
                          <FieldGroup
                            label={t(
                              "settingsPage.importRules.ruleNameLabel",
                              "Rule name",
                            )}
                          >
                            <TextField
                              onChange={(value) =>
                                updateImportRuleDraftField(rule.id, "name", value)
                              }
                              value={rule.name}
                            />
                          </FieldGroup>
                          <FieldGroup
                            label={t(
                              "settingsPage.importRules.sourceLabel",
                              "Source",
                            )}
                          >
                            <SelectField
                              onChange={(value) =>
                                updateImportRuleDraftField(
                                  rule.id,
                                  "sourceKind",
                                  value,
                                )
                              }
                              options={importRuleSourceOptions}
                              value={rule.sourceKind}
                            />
                          </FieldGroup>
                          <FieldGroup
                            label={t(
                              "settingsPage.importRules.parserRouteLabel",
                              "Parser route",
                            )}
                          >
                            <SelectField
                              onChange={(value) =>
                                updateImportRuleDraftField(
                                  rule.id,
                                  "parserRoute",
                                  value,
                                )
                              }
                              options={parserRouteOptions}
                              value={rule.parserRoute}
                            />
                          </FieldGroup>
                          <FieldGroup
                            label={t(
                              "settingsPage.importRules.familyLabel",
                              "Target family",
                            )}
                          >
                            <SelectField
                              onChange={(value) =>
                                updateImportRuleDraftField(
                                  rule.id,
                                  "targetDocumentFamily",
                                  value,
                                )
                              }
                              options={documentFamilyOptions}
                              value={rule.targetDocumentFamily}
                            />
                          </FieldGroup>
                          <FieldGroup
                            label={t(
                              "settingsPage.importRules.statusLabel",
                              "Status",
                            )}
                          >
                            <SelectField
                              onChange={(value) =>
                                updateImportRuleDraftField(rule.id, "status", value)
                              }
                              options={importRuleStatusOptions}
                              value={rule.status}
                            />
                          </FieldGroup>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5">
                    <SettingsActionRow
                      onPrimaryAction={() => {
                        void handleSaveImportRules();
                      }}
                      onSecondaryAction={handleResetImportRules}
                      primaryLabel={
                        isSavingImportRules
                          ? messages.settingsPage.actions.saving
                          : t(
                              "settingsPage.actions.saveImportRules",
                              "Save import rules",
                            )
                      }
                      secondaryLabel={messages.settingsPage.actions.reset}
                    />
                  </div>
                </PreferencePanel>
              ) : null}

              <CatalogCard className="overflow-hidden">
                <div className="border-b border-border px-[18px] py-[13px]">
                  <h3 className="text-[13px] font-semibold tracking-[-0.015em] text-foreground">
                    {messages.settingsPage.actionTitles.notificationPreferences}
                  </h3>
                  <p className="mt-[2px] text-[11.5px] leading-[1.4] text-muted">
                    {messages.settingsPage.actionDescriptions.notificationPreferences}
                  </p>
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
                    {isSavingNotifications
                      ? messages.settingsPage.actions.saving
                      : messages.settingsPage.actions.saveChanges}
                  </CatalogButton>
                </div>
              </CatalogCard>
            </div>
          ) : null}

          {activeTab === "peopleAccess" ? (
            <div className="space-y-5">
              {workspaceSecurityRows.length > 0 ? (
                <PreferencePanel
                  description={messages.settingsPage.actionDescriptions.authentication}
                  title={messages.settingsPage.actionTitles.authentication}
                >
                  <div className="space-y-3">
                    {workspaceSecurityRows.map((row) => {
                      const translatedRow = translateSecurityAuthRow(row, messages);

                      return (
                        <div
                          key={row.title}
                          className="flex flex-col gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0 md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {translatedRow.title}
                            </p>
                            <p className="mt-1 text-xs text-muted">
                              {translatedRow.description}
                            </p>
                          </div>
                          <button
                            className="rounded-[7px] border border-border-strong bg-surface-subtle px-4 py-2 text-[12.5px] font-semibold text-foreground transition-[border-color,background] hover:bg-surface-muted hover:border-foreground/20"
                            onClick={() =>
                              openPlaceholderAction(
                                translatedRow.actionLabel,
                                translatedRow.title,
                              )
                            }
                            type="button"
                          >
                            {translatedRow.actionLabel}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </PreferencePanel>
              ) : null}

              <PreferencePanel
                description={messages.settingsPage.actionDescriptions.activeSessions}
                title={messages.settingsPage.actionTitles.activeSessions}
              >
                <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
                  {pageData.security.sessions.map((session) => (
                    <SessionRow
                      key={session.title}
                      actionLabel={
                        session.actionLabel === undefined
                          ? undefined
                          : messages.settingsPage.actions.revoke
                      }
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
                description={messages.settingsPage.actionDescriptions.apiKeys}
                title={messages.settingsPage.actionTitles.apiKeys}
              >
                <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
                  {pageData.security.apiKeys.map((apiKey) => (
                    <ApiKeyRow
                      key={apiKey.name}
                      actionLabel={messages.settingsPage.actions.revokeKey}
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
                      {messages.settingsPage.billing.activePlanBadge}
                    </span>
                    <h2 className="mt-[10px] text-[20px] font-extrabold tracking-[-0.03em] text-foreground">
                      {pageData.billing.planTitle}
                    </h2>
                    <p className="mt-[3px] text-[12px] text-muted">{pageData.billing.planDescription}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
                      {messages.settingsPage.actionTitles.billingModel}
                    </p>
                    <p className="mt-1 text-[13px] font-semibold text-foreground">
                      {messages.settingsPage.billing.billingModelValue}
                    </p>
                    <p className="mt-1 text-[11.5px] text-muted">
                      {messages.settingsPage.actionDescriptions.billingModel}
                    </p>
                  </div>
                </div>
              </div>
              <CatalogCard className="overflow-hidden">
                <div className="border-b border-border px-[18px] py-[13px]">
                  <h3 className="text-[13px] font-semibold tracking-[-0.015em] text-foreground">
                    {messages.settingsPage.actionTitles.currentUsage}
                  </h3>
                  <p className="mt-[2px] text-[11.5px] leading-[1.4] text-muted">
                    {messages.settingsPage.actionDescriptions.currentCycle}
                  </p>
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
                          {messages.settingsPage.billing.monthlyCapLabel}
                        </p>
                        <p className="mt-1 text-[16px] font-semibold text-foreground">
                          {formatBillingCapSummary(usageGraphCapCents, locale, messages)}
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
                            {messages.settingsPage.billing.previewingUnsavedCap}
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
                  <h3 className="text-[13px] font-semibold tracking-[-0.015em] text-foreground">
                    {messages.settingsPage.actionTitles.usageCap}
                  </h3>
                  <p className="mt-[2px] text-[11.5px] leading-[1.4] text-muted">
                    {messages.settingsPage.actionDescriptions.usageCap}
                  </p>
                </div>
                <div className="grid gap-4 p-[18px] md:grid-cols-[minmax(0,1fr)_220px] md:items-end">
                  <FieldGroup
                    hint={messages.settingsPage.billing.usageCapHint}
                    label={messages.settingsPage.billing.usageCapFieldLabel}
                  >
                    <TextField
                      onChange={setBillingCapDraft}
                      placeholder={messages.settingsPage.billing.noCap}
                      value={billingCapDraft}
                    />
                  </FieldGroup>
                  <div className="rounded-[10px] border border-border bg-surface-subtle px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted">
                      {messages.settingsPage.billing.currentCapLabel}
                    </p>
                    <p className="mt-1 text-[16px] font-semibold text-foreground">
                      {formatBillingCapSummary(
                        pageData.billing.usageCapCents,
                        locale,
                        messages,
                      )}
                    </p>
                    <p className="mt-1 text-[11.5px] text-muted">
                      {messages.settingsPage.actionDescriptions.currentCap}
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
                    {isSavingBilling
                      ? messages.settingsPage.actions.saving
                      : messages.settingsPage.actions.saveCap}
                  </CatalogButton>
                  <CatalogButton
                    disabled={isSavingBilling}
                    onClick={handleResetBilling}
                    variant="secondary"
                  >
                    {messages.settingsPage.actions.reset}
                  </CatalogButton>
                </div>
              </CatalogCard>
              <CatalogCard className="overflow-hidden">
                <div className="border-b border-border px-[18px] py-[13px]">
                  <h3 className="text-[13px] font-semibold tracking-[-0.015em] text-foreground">
                    {messages.settingsPage.actionTitles.paymentMethods}
                  </h3>
                  <p className="mt-[2px] text-[11.5px] leading-[1.4] text-muted">
                    {messages.settingsPage.actionDescriptions.paymentMethods}
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

          {activeTab === "myAccount" ? (
            <div className="space-y-5">
              <PreferencePanel
                description={messages.settingsPage.accountDialog.currentDescription}
                title={messages.settingsPage.team.manageAccount}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {pageData.currentUser.name}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {pageData.currentUser.email}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-[11px] font-semibold text-foreground">
                        {translateRoleLabel(pageData.currentUser.role, messages)}
                      </span>
                      <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-[11px] font-semibold text-muted">
                        {translateAccessSummary(pageData.currentUser.accessSummary, messages)}
                      </span>
                    </div>
                    {pageData.currentUser.isFallbackSession ? (
                      <p className="mt-3 text-xs leading-6 text-muted">
                        {messages.settingsPage.actionDescriptions.fallbackSessionNotice}
                      </p>
                    ) : null}
                  </div>
                  {currentTeamMember?.canOpenAccountControls ? (
                    <CatalogButton
                      onClick={() => openAccountDialog(currentTeamMember)}
                      variant="primary"
                    >
                      {messages.settingsPage.team.manageAccount}
                    </CatalogButton>
                  ) : null}
                </div>
              </PreferencePanel>

              {selfServiceSecurityRows.length > 0 ? (
                <PreferencePanel
                  description={messages.settingsPage.actionDescriptions.authentication}
                  title={messages.settingsPage.actionTitles.authentication}
                >
                  <div className="space-y-3">
                    {selfServiceSecurityRows.map((row) => {
                      const translatedRow = translateSecurityAuthRow(row, messages);
                      const rowKind = getSettingsSecurityAuthRowKind(row.title);

                      return (
                        <div
                          key={row.title}
                          className="flex flex-col gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0 md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {translatedRow.title}
                            </p>
                            <p className="mt-1 text-xs text-muted">
                              {translatedRow.description}
                            </p>
                          </div>
                          <button
                            className="rounded-[7px] border border-border-strong bg-surface-subtle px-4 py-2 text-[12.5px] font-semibold text-foreground transition-[border-color,background] hover:bg-surface-muted hover:border-foreground/20"
                            onClick={() => {
                              if (rowKind === "twoFactor") {
                                setActiveDialog("two-factor");
                                return;
                              }

                              if (
                                rowKind === "emailPassword" &&
                                currentTeamMember !== null
                              ) {
                                openAccountDialog(currentTeamMember);
                                return;
                              }

                              openPlaceholderAction(
                                translatedRow.actionLabel,
                                translatedRow.title,
                              );
                            }}
                            type="button"
                          >
                            {translatedRow.actionLabel}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </PreferencePanel>
              ) : null}

              <PreferencePanel
                description={t(
                  "settingsPage.actionDescriptions.localePreference",
                  "Choose the language used across the app for this signed-in session.",
                )}
                title={t(
                  "settingsPage.actionTitles.localePreference",
                  "Language and locale",
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t("settingsPage.locale.label", "Interface language")}
                    </p>
                    <p className="mt-1 text-xs leading-6 text-muted">
                      {t(
                        "settingsPage.locale.description",
                        "Changing this updates navigation, workflows, and supporting UI copy.",
                      )}
                    </p>
                  </div>
                  <LocaleSwitcher />
                </div>
              </PreferencePanel>

              <PreferencePanel
                description={messages.settingsPage.actionDescriptions.appearance}
                title={messages.settingsPage.actionTitles.appearance}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {messages.settingsPage.appearance.colorMode}
                    </p>
                    <p className="mt-1 text-xs leading-6 text-muted">
                      {messages.settingsPage.actionDescriptions.colorModePersisted}
                    </p>
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
                      {messages.settingsPage.appearance.dark}
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
                      {messages.settingsPage.appearance.light}
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
            description={messages.settingsPage.labels.dialogs.inviteDescription}
            footer={
              <>
                <CatalogButton onClick={handleInviteSubmit} variant="primary">
                  {isSendingInvite
                    ? messages.settingsPage.actions.sendingInvite
                    : messages.settingsPage.actions.inviteMember}
                </CatalogButton>
                <CatalogButton
                  onClick={() => {
                    setActiveDialog(null);
                    setPendingApiKeyName(null);
                  }}
                  variant="secondary"
                >
                  {messages.settingsPage.actions.cancel}
                </CatalogButton>
              </>
            }
            onClose={() => setActiveDialog(null)}
            title={messages.settingsPage.labels.dialogs.inviteTitle}
          >
            <FieldGroup label={messages.settingsPage.dialogs.invite.name}>
              <TextField
                onChange={(value) =>
                  setInviteDraft((current) => ({ ...current, name: value }))
                }
                placeholder={messages.settingsPage.placeholders.name}
                value={inviteDraft.name}
              />
            </FieldGroup>
            <FieldGroup label={messages.settingsPage.dialogs.invite.email}>
              <TextField
                onChange={(value) =>
                  setInviteDraft((current) => ({ ...current, email: value }))
                }
                placeholder={messages.settingsPage.placeholders.email}
                type="email"
                value={inviteDraft.email}
              />
            </FieldGroup>
            <FieldGroup label={messages.settingsPage.dialogs.invite.role}>
              <SelectField
                onChange={(value) =>
                  setInviteDraft((current) => ({
                    ...current,
                    roleLabel: value as InviteRoleLabel,
                  }))
                }
                options={inviteRoleOptions}
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
                ? messages.settingsPage.accountDialog.currentDescription
                : messages.settingsPage.accountDialog.manageDescription
            }
            footer={
              <>
                <CatalogButton
                  disabled={!selectedTeamMember.canOpenAccountControls || isSavingAccount}
                  onClick={handleSaveAccount}
                  variant="primary"
                >
                  {isSavingAccount
                    ? messages.settingsPage.actions.saving
                    : messages.settingsPage.actions.saveChanges}
                </CatalogButton>
                <CatalogButton
                  onClick={closeAccountDialog}
                  variant="secondary"
                >
                  {messages.settingsPage.actions.cancel}
                </CatalogButton>
              </>
            }
            onClose={closeAccountDialog}
            title={
              selectedTeamMember.isCurrentUser
                ? messages.settingsPage.team.myAccount
                : messages.settingsPage.team.manageAccount
            }
          >
            <div className="rounded-2xl border border-border bg-surface-subtle/60 px-4 py-3 text-[11.5px] leading-[1.5] text-muted">
              <p>
                {messages.settingsPage.dialogs.invite.role}:{" "}
                <span className="font-semibold text-foreground">{selectedTeamMember.role}</span>
              </p>
              <p className="mt-1">
                {messages.settingsPage.team.accessBucketsLabel}:{" "}
                <span className="font-semibold text-foreground">
                  {selectedTeamMember.accessSummary}
                </span>
              </p>
              {selectedTeamMember.isCurrentUser ? (
                <p className="mt-1">
                  {messages.settingsPage.accountDialog.currentAccountNotice}
                </p>
              ) : null}
            </div>
            <FieldGroup label={messages.settingsPage.accountDialog.name}>
              <TextField
                disabled={!selectedTeamMember.canEditIdentity}
                onChange={(value) => updateAccountDraftField("name", value)}
                value={accountDraft.name}
              />
            </FieldGroup>
            <FieldGroup label={messages.settingsPage.accountDialog.email}>
              <TextField
                disabled={!selectedTeamMember.canEditIdentity}
                onChange={(value) => updateAccountDraftField("email", value)}
                type="email"
                value={accountDraft.email}
              />
            </FieldGroup>
            {selectedTeamMember.canResetPassword ? (
              <FieldGroup
                hint={messages.settingsPage.accountDialog.passwordHint}
                label={
                  selectedTeamMember.isCurrentUser
                    ? messages.settingsPage.accountDialog.newPassword
                    : messages.settingsPage.accountDialog.resetPassword
                }
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
                <FieldGroup label={messages.settingsPage.dialogs.invite.role}>
                  <SelectField
                    onChange={(value) =>
                      updateAccountDraftField(
                        "roleLabel",
                        value as InviteRoleLabel,
                      )
                    }
                    options={inviteRoleOptions}
                    value={accountDraft.roleLabel}
                  />
                </FieldGroup>
                <FieldGroup label={messages.settingsPage.accountDialog.status}>
                  <SelectField
                    onChange={(value) =>
                      updateAccountDraftField(
                        "statusLabel",
                        value as AccountStatusLabel,
                      )
                    }
                    options={accountStatusOptions}
                    value={accountDraft.statusLabel}
                  />
                </FieldGroup>
                <FieldGroup label={messages.settingsPage.accountDialog.accessPolicy}>
                  <div className="rounded-2xl border border-border px-4 py-2">
                    <ToggleRow
                      description={messages.settingsPage.accessPolicy.setupDescription}
                      disabled={!selectedTeamMember.canEditAuthorization}
                      enabled={accountDraft.setupAccess}
                      onToggle={() =>
                        updateAccountDraftField(
                          "setupAccess",
                          !accountDraft.setupAccess,
                        )
                      }
                      title={messages.settingsPage.accessPolicy.setupTitle}
                    />
                    <ToggleRow
                      description={messages.settingsPage.accessPolicy.operationsDescription}
                      disabled={!selectedTeamMember.canEditAuthorization}
                      enabled={accountDraft.operationsAccess}
                      onToggle={() =>
                        updateAccountDraftField(
                          "operationsAccess",
                          !accountDraft.operationsAccess,
                        )
                      }
                      title={messages.settingsPage.accessPolicy.operationsTitle}
                    />
                    <ToggleRow
                      description={messages.settingsPage.accessPolicy.reportDescription}
                      disabled={!selectedTeamMember.canEditAuthorization}
                      enabled={accountDraft.reportAccess}
                      onToggle={() =>
                        updateAccountDraftField(
                          "reportAccess",
                          !accountDraft.reportAccess,
                        )
                      }
                      title={messages.settingsPage.accessPolicy.reportTitle}
                    />
                  </div>
                </FieldGroup>
              </>
            ) : null}
            {!selectedTeamMember.canEditAuthorization ? (
              <div className="rounded-2xl border border-border bg-surface-subtle/60 px-4 py-3 text-[11.5px] leading-[1.5] text-muted">
                {messages.settingsPage.accountDialog.lockedNotice}
              </div>
            ) : null}
          </DialogFrame>
        </CatalogModalOverlay>
      ) : null}

      {activeDialog === "two-factor" ? (
        <CatalogModalOverlay>
          <DialogFrame
            description={messages.settingsPage.labels.dialogs.twoFactorDescription}
            footer={
              <>
                <CatalogButton
                  onClick={() => {
                    setActiveDialog(null);
                    openPlaceholderAction(
                      messages.settingsPage.actions.continue,
                      messages.settingsPage.securityRows.twoFactor.setupUnavailable,
                    );
                  }}
                  variant="primary"
                >
                  {messages.settingsPage.actions.continue}
                </CatalogButton>
                <CatalogButton onClick={() => setActiveDialog(null)} variant="secondary">
                  {messages.settingsPage.actions.cancel}
                </CatalogButton>
              </>
            }
            onClose={() => setActiveDialog(null)}
            title={messages.settingsPage.labels.dialogs.twoFactorTitle}
          >
            <p className="text-sm leading-7 text-muted">
              {messages.settingsPage.dialogs.twoFactorDescription}
            </p>
            <CatalogCard className="flex h-48 items-center justify-center border-dashed bg-surface-subtle p-4 shadow-none">
              <span className="text-sm font-medium text-muted">
                {messages.settingsPage.dialogs.twoFactorQrPlaceholder}
              </span>
            </CatalogCard>
          </DialogFrame>
        </CatalogModalOverlay>
      ) : null}

      {activeDialog === "revoke-key" ? (
        <CatalogModalOverlay>
          <DialogFrame
            description={messages.settingsPage.labels.dialogs.revokeDescription}
            footer={
              <>
                <button
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 dark:bg-rose-500 dark:hover:bg-rose-400"
                  onClick={() => {
                    void handleRevokeApiKey();
                  }}
                  type="button"
                >
                  {revokingApiKeyName === null
                    ? messages.settingsPage.actions.revokeKey
                    : messages.settingsPage.actions.revoking}
                </button>
                <CatalogButton onClick={() => setActiveDialog(null)} variant="secondary">
                  {messages.settingsPage.actions.cancel}
                </CatalogButton>
              </>
            }
            onClose={() => {
              setActiveDialog(null);
              setPendingApiKeyName(null);
            }}
            title={messages.settingsPage.labels.dialogs.revokeTitle}
          >
            <p className="text-sm leading-7 text-muted">
              {messages.settingsPage.dialogs.revokeKeyWarning}
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
            description={messages.settingsPage.dialogs.connect.description}
            footer={
              <>
                <CatalogButton
                  onClick={() => {
                    setPendingConnectIntegration(null);
                    setConnectApiKeyDraft("");
                  }}
                  variant="secondary"
                >
                  {messages.settingsPage.actions.cancel}
                </CatalogButton>
                <CatalogButton
                  disabled={connectApiKeyDraft.trim().length === 0 || isConnectingIntegration}
                  onClick={() => void handleIntegrationConnect()}
                  variant="primary"
                >
                  {isConnectingIntegration
                    ? messages.settingsPage.actions.connecting
                    : messages.settingsPage.actions.connect}
                </CatalogButton>
              </>
            }
            onClose={() => {
              setPendingConnectIntegration(null);
              setConnectApiKeyDraft("");
            }}
            title={t("settingsPage.dialogs.connect.title", "Connect {{integration}}", {
              integration: pendingConnectIntegration,
            })}
          >
            <FieldGroup label={messages.settingsPage.dialogs.connect.apiKeyLabel}>
              <TextField
                onChange={setConnectApiKeyDraft}
                placeholder={messages.settingsPage.placeholders.apiKey}
                type="password"
                value={connectApiKeyDraft}
              />
            </FieldGroup>
            <p className="text-[11.5px] leading-[1.5] text-muted">
              {messages.settingsPage.dialogs.connect.description}
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
  const { messages, t } = useUiI18n();

  return (
    <div className="rounded-[10px] border border-border bg-surface-subtle p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold text-foreground">
            {role === "primary"
              ? messages.settingsPage.billing.businessCard
              : messages.settingsPage.billing.backupCard}
          </p>
          <p className="mt-1 text-[11.5px] leading-[1.5] text-muted">
            {currentPaymentMethod === null
              ? messages.settingsPage.billing.noCardOnFile
              : t(
                  "settingsPage.billing.paymentMethodDescription",
                  "{{brand}} ending in {{last4}} • Expires {{expiration}}",
                  {
                    brand: currentPaymentMethod.brandLabel,
                    expiration: formatExpiration(
                      currentPaymentMethod.expMonth,
                      currentPaymentMethod.expYear,
                    ),
                    last4: currentPaymentMethod.last4,
                  },
                )}
          </p>
          {currentPaymentMethod?.postalCode ? (
            <p className="mt-1 text-[11.5px] leading-[1.5] text-muted">
              {t("settingsPage.billing.billingZipValue", "Billing ZIP {{postalCode}}", {
                postalCode: currentPaymentMethod.postalCode,
              })}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <FieldGroup label={messages.settingsPage.billing.cardholderName}>
            <TextField
              onChange={(value) => onChange("cardholderName", value)}
              placeholder={messages.settingsPage.placeholders.cardholderName}
              value={draft.cardholderName}
            />
          </FieldGroup>
        </div>
        <div className="md:col-span-2">
          <FieldGroup label={messages.settingsPage.billing.cardNumber}>
            <TextField
              onChange={(value) => onChange("cardNumber", value)}
              placeholder="4242 4242 4242 4242"
              value={draft.cardNumber}
            />
          </FieldGroup>
        </div>
        <FieldGroup label={messages.settingsPage.billing.expMonth}>
          <TextField
            onChange={(value) => onChange("expMonth", value)}
            placeholder="05"
            value={draft.expMonth}
          />
        </FieldGroup>
        <FieldGroup label={messages.settingsPage.billing.expYear}>
          <TextField
            onChange={(value) => onChange("expYear", value)}
            placeholder="2028"
            value={draft.expYear}
          />
        </FieldGroup>
        <FieldGroup label={messages.settingsPage.billing.securityCode}>
          <TextField
            onChange={(value) => onChange("cvc", value)}
            placeholder="123"
            value={draft.cvc}
          />
        </FieldGroup>
        <FieldGroup label={messages.settingsPage.billing.billingZip}>
          <TextField
            onChange={(value) => onChange("postalCode", value)}
            placeholder="33301"
            value={draft.postalCode}
          />
        </FieldGroup>
      </div>
      <p className="mt-3 text-[11.5px] leading-[1.5] text-muted">
        {messages.settingsPage.billing.cardHelp}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <CatalogButton disabled={isSaving} onClick={onSave} variant="primary">
          {isSaving
            ? messages.settingsPage.actions.saving
            : messages.settingsPage.actions.saveCard}
        </CatalogButton>
        <CatalogButton disabled={isSaving} onClick={onReset} variant="secondary">
          {messages.settingsPage.actions.reset}
        </CatalogButton>
        {onRemove ? (
          <CatalogButton disabled={isSaving} onClick={onRemove} variant="secondary">
            {messages.settingsPage.actions.remove}
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

function formatBillingCapSummary(
  usageCapCents: number | null,
  locale: string,
  messages: ReturnType<typeof useUiI18n>["messages"],
): string {
  return usageCapCents === null
    ? messages.settingsPage.billing.noCap
    : formatUsdFromCents(usageCapCents, locale);
}

function getBillingGraphUsageCapCents(input: Readonly<{
  billingCapDraft: string;
  messages: SettingsMessages;
  savedUsageCapCents: number | null;
}>): number | null {
  try {
    return parseBillingCapInput(input.billingCapDraft, input.messages);
  } catch {
    return input.savedUsageCapCents;
  }
}

function getBillingUsageItem(
  usageRecords: SettingsPageData["billing"]["usage"],
  metricId: BillingUsageMetricId,
  messages: SettingsMessages,
): BillingUsageRecord {
  return (
    usageRecords.find((usageRecord) => usageRecord.id === metricId) ?? {
      detail: "",
      id: metricId,
      label: getBillingUsageLabel(metricId, messages),
      value: "$0.00",
    }
  );
}

function localizeBillingUsageRecord(
  usage: BillingUsageRecord,
  messages: SettingsMessages,
  t: TranslateMessage,
): BillingUsageRecord {
  switch (usage.id) {
    case "flat_fee":
      return {
        ...usage,
        detail: messages.settingsPage.billing.usageDetails.monthlyRecurring,
        label: messages.settingsPage.billing.usageLabels.platformAccess,
      };
    case "usage_this_period":
      return {
        ...usage,
        detail: translateTrackedRunsDetail(usage.detail, t),
        label: messages.settingsPage.billing.usageLabels.usageThisPeriod,
      };
    case "current_total":
      return {
        ...usage,
        detail: translateRenewsDetail(usage.detail, t),
        label: messages.settingsPage.billing.usageLabels.currentTotal,
      };
  }
}

function getBillingUsageCapProgress(input: Readonly<{
  locale: string;
  messages: ReturnType<typeof useUiI18n>["messages"];
  usageCapCents: number | null;
  usageThisPeriodCents: number;
}>): BillingUsageCapProgress {
  if (input.usageCapCents === null) {
    return {
      barWidthPercent: 0,
      caption: input.messages.settingsPage.billing.setMonthlyCapCaption,
      summary: input.messages.settingsPage.billing.noCapSet,
    };
  }

  if (input.usageCapCents === 0) {
    const isCapReached = input.usageThisPeriodCents > 0;

    return {
      barWidthPercent: isCapReached ? 100 : 0,
      caption: translateSettingTemplate(
        input.messages.settingsPage.billing.usedOfCap,
        {
          cap: formatUsdFromCents(0, input.locale),
          used: formatUsdFromCents(input.usageThisPeriodCents, input.locale),
        },
      ),
      summary: isCapReached
        ? input.messages.settingsPage.billing.capReached
        : input.messages.settingsPage.billing.noUsageAllowed,
    };
  }

  const rawPercent =
    (input.usageThisPeriodCents / input.usageCapCents) * 100;
  const clampedPercent = clampPercentage(rawPercent);
  const visiblePercent =
    clampedPercent > 0 ? Math.max(clampedPercent, 1.5) : 0;

  return {
    barWidthPercent: visiblePercent,
    caption: translateSettingTemplate(
      input.messages.settingsPage.billing.usedOfCap,
      {
        cap: formatUsdFromCents(input.usageCapCents, input.locale),
        used: formatUsdFromCents(input.usageThisPeriodCents, input.locale),
      },
    ),
    summary:
      clampedPercent >= 100
        ? input.messages.settingsPage.billing.capReached
        : translateSettingTemplate(
            input.messages.settingsPage.billing.ofMonthlyCapUsed,
            {
              percent: formatBillingUsagePercent(clampedPercent),
            },
          ),
  };
}

function getBillingUsageLabel(
  metricId: BillingUsageMetricId,
  messages: SettingsMessages,
): string {
  switch (metricId) {
    case "flat_fee":
      return messages.settingsPage.billing.usageLabels.platformAccess;
    case "usage_this_period":
      return messages.settingsPage.billing.usageLabels.usageThisPeriod;
    case "current_total":
      return messages.settingsPage.billing.usageLabels.currentTotal;
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

function formatUsdFromCents(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: "currency",
  }).format(value / 100);
}

function translateSettingTemplate(
  template: string,
  values: Readonly<Record<string, string>>,
) {
  return template.replaceAll(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? "");
}

function translateDeliveryDayLabel(
  day: DeliverySettingsDraft["weeklyBriefSendDay"],
  t: TranslateMessage,
) {
  switch (day) {
    case "monday":
      return t("settingsPage.days.monday", "Monday");
    case "tuesday":
      return t("settingsPage.days.tuesday", "Tuesday");
    case "wednesday":
      return t("settingsPage.days.wednesday", "Wednesday");
    case "thursday":
      return t("settingsPage.days.thursday", "Thursday");
    case "friday":
      return t("settingsPage.days.friday", "Friday");
    default:
      return day;
  }
}

function translateImportRuleSourceLabel(
  sourceKind: ImportRuleDraft["sourceKind"],
  t: TranslateMessage,
) {
  switch (sourceKind) {
    case "upload":
      return t("settingsPage.importRules.sources.upload", "Manual upload");
    case "email":
      return t("settingsPage.importRules.sources.email", "Forwarded email");
    case "api":
      return t("settingsPage.importRules.sources.api", "Connected source");
    default:
      return sourceKind;
  }
}

function translateImportRuleStatusLabel(
  status: ImportRuleDraft["status"],
  t: TranslateMessage,
) {
  switch (status) {
    case "draft":
      return t("settingsPage.importRules.statuses.draft", "Draft");
    case "active":
      return t("settingsPage.importRules.statuses.active", "Active");
    case "archived":
      return t("settingsPage.importRules.statuses.archived", "Archived");
    default:
      return status;
  }
}

function translateParserRouteLabel(
  parserRoute: ImportRuleDraft["parserRoute"],
  t: TranslateMessage,
) {
  switch (parserRoute) {
    case "tabular":
      return t("settingsPage.importRules.parserRoutes.tabular", "Tabular");
    case "text":
      return t("settingsPage.importRules.parserRoutes.text", "Text");
    default:
      return parserRoute;
  }
}

function parseBillingCapInput(
  value: string,
  messages: SettingsMessages,
): number | null {
  const normalizedValue = value.replace(/[$,\s]/g, "");

  if (normalizedValue.length === 0) {
    return null;
  }

  if (!/^\d+(\.\d{0,2})?$/.test(normalizedValue)) {
    throw new Error(messages.settingsPage.errors.validDollarAmountPrecision);
  }

  const usageCapCents = Math.round(Number(normalizedValue) * 100);

  if (!Number.isFinite(usageCapCents) || usageCapCents < 0) {
    throw new Error(messages.settingsPage.errors.validDollarAmountNonNegative);
  }

  return usageCapCents;
}

function createDeliverySettingsDraft(
  deliverySettings: SettingsPageData["deliverySettings"],
): DeliverySettingsDraft {
  return {
    confidenceDropAlertEnabled: deliverySettings.confidenceDropAlert.enabled,
    confidenceDropRecipientEmails: deliverySettings.confidenceDropAlert.recipientEmails.join(
      ", ",
    ),
    confidenceDropThreshold: deliverySettings.confidenceDropAlert.threshold.toString(),
    parseFailureAlertEnabled: deliverySettings.parseFailureAlert.enabled,
    parseFailureCountThreshold:
      deliverySettings.parseFailureAlert.failureCountThreshold.toString(),
    parseFailureRecipientEmails: deliverySettings.parseFailureAlert.recipientEmails.join(
      ", ",
    ),
    queueDigestEnabled: deliverySettings.queueDigest.enabled,
    queueDigestRecipientEmails: deliverySettings.queueDigest.recipientEmails.join(", "),
    queueDigestSendTimeLocal: deliverySettings.queueDigest.sendTimeLocal,
    sourceDisconnectedAlertEnabled:
      deliverySettings.sourceDisconnectedAlert.enabled,
    sourceDisconnectedRecipientEmails:
      deliverySettings.sourceDisconnectedAlert.recipientEmails.join(", "),
    weeklyBriefEnabled: deliverySettings.weeklyBrief.enabled,
    weeklyBriefRecipientEmails: deliverySettings.weeklyBrief.recipientEmails.join(", "),
    weeklyBriefSendDay: deliverySettings.weeklyBrief.sendDay,
    weeklyBriefSendTimeLocal: deliverySettings.weeklyBrief.sendTimeLocal,
  };
}

function parseDeliverySettingsDraft(
  draft: DeliverySettingsDraft,
  messages: SettingsMessages,
): SettingsPageData["deliverySettings"] {
  return {
    confidenceDropAlert: {
      enabled: draft.confidenceDropAlertEnabled,
      recipientEmails: parseRecipientEmails(
        draft.confidenceDropRecipientEmails,
        messages,
      ),
      threshold: parseUnitIntervalField(
        draft.confidenceDropThreshold,
        tSetting("delivery confidence threshold"),
      ),
    },
    parseFailureAlert: {
      enabled: draft.parseFailureAlertEnabled,
      failureCountThreshold: parsePositiveIntegerField(
        draft.parseFailureCountThreshold,
        tSetting("parse failure threshold"),
      ),
      recipientEmails: parseRecipientEmails(
        draft.parseFailureRecipientEmails,
        messages,
      ),
    },
    queueDigest: {
      enabled: draft.queueDigestEnabled,
      recipientEmails: parseRecipientEmails(
        draft.queueDigestRecipientEmails,
        messages,
      ),
      sendTimeLocal: parseTimeField(
        draft.queueDigestSendTimeLocal,
        tSetting("queue digest send time"),
      ),
    },
    sourceDisconnectedAlert: {
      enabled: draft.sourceDisconnectedAlertEnabled,
      recipientEmails: parseRecipientEmails(
        draft.sourceDisconnectedRecipientEmails,
        messages,
      ),
    },
    weeklyBrief: {
      enabled: draft.weeklyBriefEnabled,
      recipientEmails: parseRecipientEmails(
        draft.weeklyBriefRecipientEmails,
        messages,
      ),
      sendDay: draft.weeklyBriefSendDay,
      sendTimeLocal: parseTimeField(
        draft.weeklyBriefSendTimeLocal,
        tSetting("weekly brief send time"),
      ),
    },
  };
}

function createDataPolicyDraft(
  dataPolicy: SettingsPageData["dataPolicy"],
): DataPolicyDraft {
  return {
    acceptanceRateDriftThreshold:
      dataPolicy.reviewThresholds.acceptanceRateDriftThreshold.toString(),
    apiRetentionDays: dataPolicy.sourceRetentionDays.api.toString(),
    briefHighConfidenceFloor:
      dataPolicy.reviewThresholds.briefHighConfidenceFloor.toString(),
    classificationConfidenceFloor:
      dataPolicy.reviewThresholds.classificationConfidenceFloor.toString(),
    emailRetentionDays: dataPolicy.sourceRetentionDays.email.toString(),
    embeddingsEnabled: dataPolicy.embeddingsEnabled,
    extractionEnabled: dataPolicy.extractionEnabled,
    fieldConfidenceFloor:
      dataPolicy.reviewThresholds.fieldConfidenceFloor.toString(),
    humanReviewRequired: dataPolicy.humanReviewRequired,
    outcomeRateDriftThreshold:
      dataPolicy.reviewThresholds.outcomeRateDriftThreshold.toString(),
    parserConfidenceFloor:
      dataPolicy.reviewThresholds.parserConfidenceFloor.toString(),
    uploadRetentionDays: dataPolicy.sourceRetentionDays.upload.toString(),
  };
}

function parseDataPolicyDraft(
  draft: DataPolicyDraft,
): SettingsPageData["dataPolicy"] {
  return {
    embeddingsEnabled: draft.embeddingsEnabled,
    extractionEnabled: draft.extractionEnabled,
    humanReviewRequired: draft.humanReviewRequired,
    reviewThresholds: {
      acceptanceRateDriftThreshold: parseUnitIntervalField(
        draft.acceptanceRateDriftThreshold,
        tSetting("acceptance drift threshold"),
      ),
      briefHighConfidenceFloor: parseUnitIntervalField(
        draft.briefHighConfidenceFloor,
        tSetting("brief confidence floor"),
      ),
      classificationConfidenceFloor: parseUnitIntervalField(
        draft.classificationConfidenceFloor,
        tSetting("classification confidence floor"),
      ),
      fieldConfidenceFloor: parseUnitIntervalField(
        draft.fieldConfidenceFloor,
        tSetting("field confidence floor"),
      ),
      outcomeRateDriftThreshold: parseUnitIntervalField(
        draft.outcomeRateDriftThreshold,
        tSetting("outcome drift threshold"),
      ),
      parserConfidenceFloor: parseUnitIntervalField(
        draft.parserConfidenceFloor,
        tSetting("parser confidence floor"),
      ),
    },
    sourceRetentionDays: {
      api: parsePositiveIntegerField(
        draft.apiRetentionDays,
        tSetting("API retention days"),
      ),
      email: parsePositiveIntegerField(
        draft.emailRetentionDays,
        tSetting("email retention days"),
      ),
      upload: parsePositiveIntegerField(
        draft.uploadRetentionDays,
        tSetting("manual upload retention days"),
      ),
    },
  };
}

function parseRecipientEmails(
  value: string,
  messages: SettingsMessages,
): readonly string[] {
  const recipients = value
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (recipients.length === 0) {
    throw new Error(
      tSettingWithFallback(
        messages,
        "Enter at least one recipient email address.",
      ),
    );
  }

  const emailSchema = z.string().email();

  return recipients.map((recipient) => {
    const parsedRecipient = emailSchema.safeParse(recipient);

    if (!parsedRecipient.success) {
      throw new Error(
        tSettingWithFallback(
          messages,
          "Enter valid email addresses separated by commas.",
        ),
      );
    }

    return parsedRecipient.data;
  });
}

function parseTimeField(value: string, label: string): string {
  const normalizedValue = value.trim();

  if (!/^\d{2}:\d{2}$/.test(normalizedValue)) {
    throw new Error(`Enter ${label} in HH:MM format.`);
  }

  const [hours, minutes] = normalizedValue.split(":").map(Number);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(`Enter a valid ${label}.`);
  }

  return normalizedValue;
}

function parsePositiveIntegerField(value: string, label: string): number {
  const parsedValue = parseIntegerField(value, `Enter ${label}.`);

  if (parsedValue <= 0) {
    throw new Error(`Enter ${label} greater than zero.`);
  }

  return parsedValue;
}

function parseUnitIntervalField(value: string, label: string): number {
  const normalizedValue = value.trim();

  if (!/^\d+(\.\d+)?$/.test(normalizedValue)) {
    throw new Error(`Enter ${label} as a number between 0 and 1.`);
  }

  const parsedValue = Number(normalizedValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0 || parsedValue > 1) {
    throw new Error(`Enter ${label} as a number between 0 and 1.`);
  }

  return Number(parsedValue.toFixed(4));
}

function tSetting(label: string) {
  return label;
}

function tSettingWithFallback(
  _messages: SettingsMessages,
  message: string,
) {
  return message;
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

function parsePaymentMethodDraft(
  draft: PaymentMethodDraft,
  messages: SettingsMessages,
) {
  const expMonth = parseIntegerField(
    draft.expMonth,
    messages.settingsPage.errors.validExpirationMonth,
  );
  const expYear = parseIntegerField(
    draft.expYear,
    messages.settingsPage.errors.validExpirationYear,
  );
  const cardholderName = draft.cardholderName.trim();

  if (cardholderName.length === 0) {
    throw new Error(messages.settingsPage.errors.validCardholderName);
  }

  if (draft.cardNumber.trim().length === 0) {
    throw new Error(messages.settingsPage.errors.validCardNumber);
  }

  if (draft.cvc.trim().length === 0) {
    throw new Error(messages.settingsPage.errors.validSecurityCode);
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

function parseIntegerField(value: string, errorMessage: string): number {
  const normalizedValue = value.trim();

  if (!/^\d+$/.test(normalizedValue)) {
    throw new Error(errorMessage);
  }

  return Number(normalizedValue);
}

function getSettingsErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

function getSettingsTabLabel(tabId: SettingsTabId, messages: SettingsMessages) {
  return messages.settingsPage.tabs[tabId];
}

function translateRoleLabel(roleLabel: string, messages: SettingsMessages) {
  switch (roleLabel.trim().toLowerCase()) {
    case "admin":
      return messages.settingsPage.roles.admin;
    case "operator":
      return messages.settingsPage.roles.operator;
    case "analyst":
      return messages.settingsPage.roles.analyst;
    case "viewer":
      return messages.settingsPage.roles.viewer;
    default:
      return roleLabel;
  }
}

function translateAccountStatus(
  status: TeamMemberRecord["status"],
  messages: SettingsMessages,
) {
  return status === "active"
    ? messages.settingsPage.accountDialog.statusActive
    : messages.settingsPage.accountDialog.statusInvited;
}

function translateAccessSummary(
  accessSummary: string,
  messages: SettingsMessages,
) {
  switch (accessSummary.trim().toLowerCase()) {
    case "setup, ops, reports":
      return messages.settingsPage.team.accessSummaries.setupOpsReports;
    case "setup, ops":
      return messages.settingsPage.team.accessSummaries.setupOps;
    case "reports":
      return messages.settingsPage.team.accessSummaries.reports;
    case "access pending":
      return messages.settingsPage.team.accessSummaries.pending;
    default:
      return accessSummary;
  }
}

function translatePermissionLabel(
  permissionLabel: string,
  messages: SettingsMessages,
) {
  switch (permissionLabel) {
    case "Connect approved sources and uploads":
      return messages.settingsPage.permissions.connectSources;
    case "Review parse issues and ingestion queues":
      return messages.settingsPage.permissions.reviewParseIssues;
    case "Run approved analyses and data exploration":
      return messages.settingsPage.permissions.runAnalyses;
    case "View dashboards and weekly briefs":
      return messages.settingsPage.permissions.viewDashboards;
    case "Expand source scope or AI processing":
      return messages.settingsPage.permissions.expandScope;
    case "Manage users and report visibility":
      return messages.settingsPage.permissions.manageUsers;
    default:
      return permissionLabel;
  }
}

function translatePreferenceTitle(
  preferenceId: string,
  title: string,
  messages: SettingsMessages,
) {
  switch (preferenceId) {
    case settingsPreferenceIds.compactDashboardDensity:
      return messages.settingsPage.preferenceItems.compactDashboardDensity.title;
    case settingsPreferenceIds.evidenceFirstRecommendationView:
      return messages.settingsPage.preferenceItems.evidenceFirstRecommendationView.title;
    case settingsPreferenceIds.experimentalPackDrafts:
      return messages.settingsPage.preferenceItems.experimentalPackDrafts.title;
    case settingsPreferenceIds.retainUploadedSourceFiles:
      return messages.settingsPage.preferenceItems.retainUploadedSourceFiles.title;
    default:
      return title;
  }
}

function translatePreferenceDescription(
  preferenceId: string,
  description: string,
  messages: SettingsMessages,
) {
  switch (preferenceId) {
    case settingsPreferenceIds.compactDashboardDensity:
      return messages.settingsPage.preferenceItems.compactDashboardDensity.description;
    case settingsPreferenceIds.evidenceFirstRecommendationView:
      return messages.settingsPage.preferenceItems.evidenceFirstRecommendationView.description;
    case settingsPreferenceIds.experimentalPackDrafts:
      return messages.settingsPage.preferenceItems.experimentalPackDrafts.description;
    case settingsPreferenceIds.retainUploadedSourceFiles:
      return messages.settingsPage.preferenceItems.retainUploadedSourceFiles.description;
    default:
      return description;
  }
}

function translateSecurityAuthRow(
  row: SettingsPageData["security"]["authRows"][number],
  messages: SettingsMessages,
) {
  const rowKind = getSettingsSecurityAuthRowKind(row.title);

  switch (rowKind) {
    case "emailPassword":
      return {
        actionLabel: messages.settingsPage.securityRows.changePassword.actionLabel,
        description: row.description,
        title: messages.settingsPage.securityRows.changePassword.title,
      };
    case "twoFactor":
      return {
        actionLabel: messages.settingsPage.securityRows.twoFactor.actionLabel,
        description: messages.settingsPage.securityRows.twoFactor.description,
        title: messages.settingsPage.securityRows.twoFactor.title,
      };
    case "singleSignOn":
      return {
        actionLabel: messages.settingsPage.securityRows.singleSignOn.actionLabel,
        description: messages.settingsPage.securityRows.singleSignOn.description,
        title: messages.settingsPage.securityRows.singleSignOn.title,
      };
    default:
      return row;
  }
}

function translateIntegrationActionLabel(
  actionLabel: string,
  messages: SettingsMessages,
) {
  switch (actionLabel.trim().toLowerCase()) {
    case "connect":
      return messages.settingsPage.actions.connect;
    case "configure":
      return messages.settingsPage.actions.configure;
    case "disconnect":
      return messages.settingsPage.actions.disconnect;
    case "manage":
      return messages.settingsPage.actions.manage;
    case "reconnect":
      return messages.settingsPage.actions.reconnect;
    case "review failures":
      return messages.settingsPage.actions.reviewFailures;
    case "sync now":
      return messages.settingsPage.actions.syncNow;
    default:
      return actionLabel;
  }
}

function translateIntegrationDescription(
  title: string,
  description: string,
  messages: SettingsMessages,
) {
  switch (title) {
    case "ServiceTitan":
      return messages.settingsPage.integrations.descriptions.serviceTitan;
    case "QuickBooks Online":
      return messages.settingsPage.integrations.descriptions.quickBooksOnline;
    case "Gmail / AP inbox":
      return messages.settingsPage.integrations.descriptions.gmailApInbox;
    case "Xero":
      return messages.settingsPage.integrations.descriptions.xero;
    default:
      return description;
  }
}

function translateIntegrationStatusLabel(
  statusLabel: string,
  messages: SettingsMessages,
  t: TranslateMessage,
) {
  const normalizedLabel = statusLabel.trim().toLowerCase();
  const failuresMatch = statusLabel.match(/^(\d+)\s+failures$/i);

  if (failuresMatch) {
    return t("settingsPage.integrations.status.failures", "{{count}} failures", {
      count: failuresMatch[1] ?? "0",
    });
  }

  switch (normalizedLabel) {
    case "available":
      return messages.settingsPage.integrations.status.available;
    case "connected":
      return messages.settingsPage.integrations.status.connected;
    case "not connected":
      return messages.settingsPage.integrations.status.notConnected;
    default:
      return statusLabel;
  }
}

function translateTrackedRunsDetail(
  detail: string,
  t: TranslateMessage,
) {
  const settlingMatch = detail.match(
    /^(\d+)\s+tracked runs,\s+(\d+)\s+settling$/i,
  );

  if (settlingMatch) {
    return t(
      "settingsPage.billing.usageDetails.trackedRunsSettling",
      "{{count}} tracked runs, {{settlingCount}} settling",
      {
        count: settlingMatch[1] ?? "0",
        settlingCount: settlingMatch[2] ?? "0",
      },
    );
  }

  const trackedMatch = detail.match(/^(\d+)\s+tracked runs$/i);

  if (trackedMatch) {
    return t("settingsPage.billing.usageDetails.trackedRuns", "{{count}} tracked runs", {
      count: trackedMatch[1] ?? "0",
    });
  }

  return detail;
}

function translateRenewsDetail(
  detail: string,
  t: TranslateMessage,
) {
  const renewsMatch = detail.match(/^Renews\s+(.+)$/i);

  if (!renewsMatch) {
    return detail;
  }

  return t("settingsPage.billing.usageDetails.renews", "Renews {{date}}", {
    date: renewsMatch[1] ?? "",
  });
}
