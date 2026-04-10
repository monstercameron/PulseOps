type CatalogAction = Readonly<{
  label: string;
  variant?: "primary" | "secondary";
}>;

type CatalogMetric = Readonly<{
  detail: string;
  label: string;
  tone: "danger" | "info" | "neutral" | "success" | "warning";
  trend: string;
  value: string;
}>;

type CatalogLink = Readonly<{
  href: string;
  label: string;
}>;

type CatalogSectionCopy = Readonly<{
  description: string;
  eyebrow: string;
  title: string;
}>;

type CatalogActivityItem = Readonly<{
  action?: string;
  detail: string;
  label: string;
  time: string;
  title: string;
  tone: "accent" | "danger" | "info" | "warning";
}>;

type CatalogDecisionQueueItem = Readonly<{
  actions: readonly string[];
  context: string;
  priority: "danger" | "info" | "warning";
  priorityLabel: string;
  title: string;
  typeLabel: string;
}>;

type CatalogSignal = Readonly<{
  detail: string;
  label: string;
  tone: "danger" | "info" | "success" | "warning";
  value: string;
}>;

type CatalogPackItem = Readonly<{
  accent: "accent" | "info" | "warning";
  meta: string;
  periodLabel: string;
  status: "draft" | "ready";
  statusLabel: string;
  title: string;
}>;

type CatalogRecommendation = Readonly<{
  actions: readonly string[];
  citations: readonly string[];
  confidence: number;
  priority: "danger" | "warning";
  priorityLabel: string;
  summary: string;
  title: string;
}>;

type CatalogTeamMember = Readonly<{
  accessSummary: string;
  email: string;
  name: string;
  role: string;
  status: "active" | "invited";
  statusLabel: string;
}>;

type CatalogToggle = Readonly<{
  description: string;
  enabled?: boolean;
  title: string;
}>;

type CatalogOverdueItem = Readonly<{
  label: string;
  name: string;
  tone: "danger" | "warning";
}>;

export type CatalogInventoryRow = Readonly<{
  family: string;
  id: string;
  name: string;
  notes: string;
  sourcePages: readonly string[];
}>;

export type CatalogRecordRow = Readonly<{
  confidence: number | null;
  id: string;
  name: string;
  source: string;
  statusLabel: string;
  statusTone: "danger" | "success" | "warning";
  typeLabel: string;
  typeTone: "info" | "neutral";
}>;

export type CatalogContent = Readonly<{
  header: Readonly<{
    actions: readonly CatalogAction[];
    breadcrumbs: readonly string[];
    description: string;
    title: string;
  }>;
  inventory: Readonly<{
    rows: readonly CatalogInventoryRow[];
    section: CatalogSectionCopy;
    table: Readonly<{
      ariaLabel: string;
      componentHeader: string;
      intentHeader: string;
      sourceHeader: string;
    }>;
  }>;
  marketing: Readonly<{
    cta: Readonly<{
      description: string;
      primaryAction: string;
      secondaryAction: string;
      title: string;
    }>;
    hero: Readonly<{
      actions: readonly CatalogAction[];
      description: string;
      eyebrow: string;
      footerNote: string;
      stats: readonly Readonly<{ detail: string; value: string }>[];
      titleLines: readonly [string, string];
    }>;
    pricingCards: readonly Readonly<{
      ctaLabel: string;
      description: string;
      featured?: boolean;
      featuredLabel?: string;
      name: string;
      points: readonly string[];
      price: string;
      priceSuffix: string;
    }>[];
    problemCards: readonly Readonly<{
      description: string;
      icon: string;
      title: string;
    }>[];
    questions: Readonly<{
      badgeLabel: string;
      description: string;
      items: readonly Readonly<{
        description: string;
        icon: string;
        title: string;
      }>[];
      title: string;
    }>;
    section: CatalogSectionCopy;
    testimonials: readonly Readonly<{
      company: string;
      initials: string;
      name: string;
      quote: string;
    }>[];
    workflowSteps: readonly Readonly<{
      description: string;
      step: string;
      title: string;
    }>[];
  }>;
  pageSummary: Readonly<{
    badgeLabel: string;
    description: string;
    metrics: readonly CatalogMetric[];
    sectionLinks: readonly CatalogLink[];
    title: string;
  }>;
  settings: Readonly<{
    dialog: Readonly<{
      actions: Readonly<{
        cancel: string;
        continue: string;
      }>;
      description: string;
      manualCodeLabel: string;
      manualCodeValue: string;
      qrLabel: string;
      recoveryCodes: readonly string[];
      recoveryCodesLabel: string;
      stepLabel: string;
      title: string;
      verificationCodeHint: string;
      verificationCodeLabel: string;
      verificationCodeValue: string;
    }>;
    panel: Readonly<{
      actions: Readonly<{
        primaryLabel: string;
        secondaryLabel: string;
      }>;
      description: string;
      organizationField: Readonly<{
        hint?: string;
        label: string;
        value: string;
      }>;
      team: Readonly<{
        badgeLabel: string;
        description: string;
        members: readonly CatalogTeamMember[];
        title: string;
      }>;
      themeField: Readonly<{
        label: string;
        options: readonly string[];
      }>;
      title: string;
      toggles: readonly CatalogToggle[];
      verticalField: Readonly<{
        label: string;
        value: string;
      }>;
    }>;
    section: CatalogSectionCopy;
  }>;
  workspace: Readonly<{
    activity: Readonly<{
      badgeLabel: string;
      items: readonly CatalogActivityItem[];
      title: string;
    }>;
    filterKit: Readonly<{
      chips: readonly string[];
      description: string;
      eyebrow: string;
    }>;
    metrics: readonly CatalogMetric[];
    packs: Readonly<{
      badgeLabel: string;
      items: readonly CatalogPackItem[];
      title: string;
    }>;
    queue: Readonly<{
      badgeLabel: string;
      items: readonly CatalogDecisionQueueItem[];
      title: string;
    }>;
    recommendations: readonly CatalogRecommendation[];
    section: CatalogSectionCopy;
    signals: readonly CatalogSignal[];
  }>;
  data: Readonly<{
    ask: Readonly<{
      assistantAvatarLabel: string;
      assistantLeadLabel: string;
      assistantMessage: string;
      citations: readonly string[];
      filters: readonly string[];
      overdueItems: readonly CatalogOverdueItem[];
      title: string;
      totalOutstanding: string;
      userAvatarLabel: string;
      userQuestion: string;
    }>;
    records: readonly CatalogRecordRow[];
    section: CatalogSectionCopy;
    table: Readonly<{
      ariaLabel: string;
      classHeader: string;
      confidenceHeader: string;
      description: string;
      documentHeader: string;
      statusHeader: string;
      title: string;
    }>;
  }>;
}>;
