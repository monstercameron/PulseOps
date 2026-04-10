import { buildDefaultSettingsPreferences } from "@/features/settings/domain/settings-preferences";
import {
  fallbackWebsiteDetails,
  type WebsiteDetails,
} from "@/features/marketing/domain/website-details";

export type SettingsTabId =
  | "organization"
  | "team"
  | "integrations"
  | "notifications"
  | "security"
  | "billing"
  | "preferences";

export type SettingsPageData = Readonly<{
  billing: Readonly<{
    graphMetrics: Readonly<{
      currentTotalCents: number;
      flatFeeCents: number;
      usageThisPeriodCents: number;
    }>;
    paymentMethods: readonly {
      brandLabel: string;
      cardholderName: string;
      expMonth: number;
      expYear: number;
      id: string;
      last4: string;
      postalCode: string | null;
      role: "backup" | "primary";
      roleLabel: string;
    }[];
    planDescription: string;
    planTitle: string;
    usageCapCents: number | null;
    usage: readonly {
      detail: string;
      id: "current_total" | "flat_fee" | "usage_this_period";
      label: string;
      value: string;
    }[];
  }>;
  integrations: readonly {
    actionLabel: string;
    description: string;
    secondaryActionLabel?: string;
    statusLabel: string;
    statusTone: "danger" | "neutral" | "success" | "warning";
    title: string;
  }[];
  currentUser: Readonly<{
    accessSummary: string;
    canInviteMembers: boolean;
    canManageAccounts: boolean;
    email: string;
    isFallbackSession: boolean;
    name: string;
    role: string;
    userId: string;
  }>;
  notifications: readonly {
    id: string;
    items: readonly {
      description: string;
      enabled: boolean;
      title: string;
    }[];
    title: string;
  }[];
  organization: Readonly<{
    goals: readonly string[];
    industry: string;
    invoiceCycle: string;
    location: string;
    name: string;
    revenueModel: string;
    teamSize: string;
  }>;
  preferences: readonly {
    description: string;
    enabled: boolean;
    id: string;
    title: string;
  }[];
  security: Readonly<{
    apiKeys: readonly {
      createdLabel: string;
      keyLabel: string;
      name: string;
    }[];
    authRows: readonly {
      actionLabel: string;
      description: string;
      title: string;
    }[];
    sessions: readonly {
      actionLabel?: string;
      detail: string;
      isCurrent?: boolean;
      title: string;
    }[];
  }>;
  tabs: readonly {
    id: SettingsTabId;
    label: string;
  }[];
  team: Readonly<{
    members: readonly {
      accessSummary: string;
      canEditAuthorization: boolean;
      canEditIdentity: boolean;
      canOpenAccountControls: boolean;
      canResetPassword: boolean;
      email: string;
      id: string;
      isCurrentUser: boolean;
      name: string;
      operationsAccess: boolean;
      reportAccess: boolean;
      role: string;
      setupAccess: boolean;
      status: "active" | "invited";
      statusLabel: string;
      userId: string;
    }[];
    permissions: readonly {
      admin: boolean;
      analyst: boolean;
      operator: boolean;
      permission: string;
      viewer: boolean;
    }[];
  }>;
  websiteDetails: WebsiteDetails;
}>;

export const settingsPageLabels = {
  breadcrumbs: ["Dashboard", "Settings"],
  description: "Manage your organization, team, integrations, and security preferences.",
  dialogs: {
    inviteDescription: "Invite a teammate into the current workspace.",
    inviteTitle: "Invite team member",
    revokeDescription: "Revoking this key immediately blocks programmatic access that depends on it.",
    revokeTitle: "Revoke API key?",
    twoFactorDescription: "Add a second factor before high-risk account actions are allowed.",
    twoFactorTitle: "Set up two-factor authentication",
  },
  title: "Settings",
} as const;

export const fallbackSettingsPageData: SettingsPageData = {
  billing: {
    graphMetrics: {
      currentTotalCents: 14_900,
      flatFeeCents: 14_900,
      usageThisPeriodCents: 0,
    },
    paymentMethods: [],
    planDescription:
      "Platform access plus usage-based billing. Current cycle Apr 9, 2026 to May 9, 2026.",
    planTitle: "Growth plan",
    usageCapCents: null,
    usage: [
      {
        detail: "Monthly recurring",
        id: "flat_fee",
        label: "Platform access",
        value: "$149.00",
      },
      {
        detail: "0 tracked runs",
        id: "usage_this_period",
        label: "Usage this period",
        value: "$0.00",
      },
      {
        detail: "Renews May 9, 2026",
        id: "current_total",
        label: "Current total",
        value: "$149.00",
      },
    ],
  },
  integrations: [
    {
      actionLabel: "Manage",
      description: "Job reports, invoices, and technician logs via API.",
      statusLabel: "Connected",
      statusTone: "success",
      title: "ServiceTitan",
    },
    {
      actionLabel: "Manage",
      description: "P&L, expenses, and chart-of-accounts sync via OAuth.",
      statusLabel: "Connected",
      statusTone: "success",
      title: "QuickBooks Online",
    },
    {
      actionLabel: "Review failures",
      description: "Invoice PDF attachments through the AP inbox forwarder.",
      secondaryActionLabel: "Configure",
      statusLabel: "3 failures",
      statusTone: "warning",
      title: "Gmail / AP inbox",
    },
    {
      actionLabel: "Connect",
      description: "Accounting connector not enabled yet.",
      statusLabel: "Not connected",
      statusTone: "neutral",
      title: "Xero",
    },
  ],
  currentUser: {
    accessSummary: "Setup, Ops, Reports",
    canInviteMembers: true,
    canManageAccounts: true,
    email: "jamie@browardhvac.com",
    isFallbackSession: true,
    name: "Jamie Reynolds",
    role: "Admin",
    userId: "user_jamie_reynolds",
  },
  notifications: [
    {
      id: "briefs",
      title: "Weekly briefs",
      items: [
        {
          title: "Cash and margin brief email",
          description: "Send the weekly brief every Monday morning.",
          enabled: true,
        },
        {
          title: "In-app brief ready alert",
          description: "Notify when a new pack finishes generating.",
          enabled: true,
        },
      ],
    },
    {
      id: "pipeline",
      title: "Pipeline alerts",
      items: [
        {
          title: "Parse failure email alert",
          description: "Notify when more than two files fail in a single sync.",
          enabled: true,
        },
        {
          title: "Confidence drop alert",
          description: "Notify when average extraction confidence drops below threshold.",
          enabled: false,
        },
        {
          title: "Source disconnected",
          description: "Notify immediately if a connected source stops syncing.",
          enabled: true,
        },
      ],
    },
    {
      id: "queue",
      title: "Operator queue",
      items: [
        {
          title: "New high-priority queue item",
          description: "Show an in-app badge and optional email for urgent items.",
          enabled: true,
        },
        {
          title: "Daily queue digest",
          description: "Single summary email of all pending items at 8 AM.",
          enabled: false,
        },
      ],
    },
  ],
  organization: {
    goals: [
      "Improve cash flow visibility",
      "Increase job margin",
      "Reduce cost per job",
    ],
    industry: "HVAC / Field service",
    invoiceCycle: "Weekly",
    location: "Fort Lauderdale, FL",
    name: "Broward HVAC Co.",
    revenueModel: "Job-based",
    teamSize: "5–10 people",
  },
  preferences: buildDefaultSettingsPreferences(),
  security: {
    apiKeys: [
      {
        createdLabel: "Created Jan 14, 2025",
        keyLabel: "pops_live_********************HJKQ",
        name: "Pipeline integration key",
      },
    ],
    authRows: [
      {
        actionLabel: "Change password",
        description: "jamie@browardhvac.com",
        title: "Email and password",
      },
      {
        actionLabel: "Enable 2FA",
        description: "Protect the account with a second verification step.",
        title: "Two-factor authentication",
      },
      {
        actionLabel: "Configure SSO",
        description: "Available on higher plans for larger teams.",
        title: "Single sign-on",
      },
    ],
    sessions: [
      {
        detail: "Fort Lauderdale, FL - active now",
        isCurrent: true,
        title: "Chrome on macOS",
      },
      {
        actionLabel: "Revoke",
        detail: "Fort Lauderdale, FL - 3 hours ago",
        title: "Safari on iPhone",
      },
    ],
  },
  tabs: [
    { id: "organization", label: "Organization" },
    { id: "team", label: "Team" },
    { id: "integrations", label: "Integrations" },
    { id: "notifications", label: "Notifications" },
    { id: "security", label: "Security" },
    { id: "billing", label: "Billing" },
    { id: "preferences", label: "Preferences" },
  ],
  team: {
    members: [
      {
        accessSummary: "Setup, Ops, Reports",
        canEditAuthorization: false,
        canEditIdentity: true,
        canOpenAccountControls: true,
        canResetPassword: true,
        email: "jamie@browardhvac.com",
        id: "member_jamie_reynolds",
        isCurrentUser: true,
        name: "Jamie Reynolds",
        operationsAccess: true,
        reportAccess: true,
        role: "Admin",
        setupAccess: true,
        status: "active",
        statusLabel: "Active",
        userId: "user_jamie_reynolds",
      },
      {
        accessSummary: "Setup, Ops",
        canEditAuthorization: true,
        canEditIdentity: true,
        canOpenAccountControls: true,
        canResetPassword: true,
        email: "tara@browardhvac.com",
        id: "member_tara_nguyen",
        isCurrentUser: false,
        name: "Tara Nguyen",
        operationsAccess: true,
        reportAccess: false,
        role: "Operator",
        setupAccess: true,
        status: "active",
        statusLabel: "Active",
        userId: "user_tara_nguyen",
      },
      {
        accessSummary: "Reports",
        canEditAuthorization: true,
        canEditIdentity: true,
        canOpenAccountControls: true,
        canResetPassword: true,
        email: "maria@browardhvac.com",
        id: "member_maria_patel",
        isCurrentUser: false,
        name: "Maria Patel",
        operationsAccess: false,
        reportAccess: true,
        role: "Analyst",
        setupAccess: false,
        status: "active",
        statusLabel: "Active",
        userId: "user_maria_patel",
      },
      {
        accessSummary: "Reports",
        canEditAuthorization: true,
        canEditIdentity: true,
        canOpenAccountControls: true,
        canResetPassword: true,
        email: "mkim@gmail.com",
        id: "member_marcus_kim",
        isCurrentUser: false,
        name: "Marcus Kim",
        operationsAccess: false,
        reportAccess: true,
        role: "Viewer",
        setupAccess: false,
        status: "invited",
        statusLabel: "Invited",
        userId: "user_marcus_kim",
      },
    ],
    permissions: [
      {
        admin: true,
        analyst: false,
        operator: true,
        permission: "Connect approved sources and uploads",
        viewer: false,
      },
      {
        admin: true,
        analyst: false,
        operator: true,
        permission: "Review parse issues and ingestion queues",
        viewer: false,
      },
      {
        admin: true,
        analyst: true,
        operator: false,
        permission: "Run approved analyses and data exploration",
        viewer: false,
      },
      {
        admin: true,
        analyst: true,
        operator: false,
        permission: "View dashboards and weekly briefs",
        viewer: true,
      },
      {
        admin: true,
        analyst: false,
        operator: false,
        permission: "Expand source scope or AI processing",
        viewer: false,
      },
      {
        admin: true,
        analyst: false,
        operator: false,
        permission: "Manage users and report visibility",
        viewer: false,
      },
    ],
  },
  websiteDetails: fallbackWebsiteDetails,
} as const;
