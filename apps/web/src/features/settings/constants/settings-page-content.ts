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
    planDescription: string;
    planTitle: string;
    usage: readonly {
      detail: string;
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
      email: string;
      name: string;
      role: string;
      status: "active" | "invited";
      statusLabel: string;
    }[];
    permissions: readonly {
      admin: boolean;
      analyst: boolean;
      operator: boolean;
      permission: string;
      viewer: boolean;
    }[];
  }>;
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
    planDescription:
      "$149.00 platform access fee • AI usage billed at provider cost + 20% premium • Period Apr 9, 2026 to May 9, 2026",
    planTitle: "Growth plan",
    usage: [
      { label: "Platform access fee", value: "$149.00", detail: "Monthly recurring" },
      { label: "Prompt tokens", value: "0", detail: "0 cached" },
      { label: "Generated tokens", value: "0", detail: "0 total" },
      { label: "Provider AI cost", value: "$0.00", detail: "0 tracked runs" },
      { label: "Billable AI usage", value: "$0.00", detail: "Cost + 20% premium" },
      { label: "Estimated current total", value: "$149.00", detail: "Renews May 9, 2026" },
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
  preferences: [
    {
      title: "Compact dashboard density",
      description: "Fit more queue and signal cards on a single desktop screen.",
      enabled: true,
    },
    {
      title: "Evidence-first recommendation view",
      description: "Open recommendation cards with citations expanded by default.",
      enabled: true,
    },
    {
      title: "Experimental pack drafts",
      description: "Show draft decision-pack types before they are fully productionized.",
      enabled: false,
    },
  ],
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
        email: "jamie@browardhvac.com",
        name: "Jamie Reynolds",
        role: "Admin",
        status: "active",
        statusLabel: "Active",
      },
      {
        accessSummary: "Setup, Ops",
        email: "tara@browardhvac.com",
        name: "Tara Nguyen",
        role: "Operator",
        status: "active",
        statusLabel: "Active",
      },
      {
        accessSummary: "Reports",
        email: "maria@browardhvac.com",
        name: "Maria Patel",
        role: "Analyst",
        status: "active",
        statusLabel: "Active",
      },
      {
        accessSummary: "Reports",
        email: "mkim@gmail.com",
        name: "Marcus Kim",
        role: "Viewer",
        status: "invited",
        statusLabel: "Invited",
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
} as const;
