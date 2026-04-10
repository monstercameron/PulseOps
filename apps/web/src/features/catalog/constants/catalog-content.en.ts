import type { CatalogContent } from "@/features/catalog/constants/catalog-content.shared";

export const catalogContentEnUs: CatalogContent = {
  header: {
    actions: [
      { label: "Catalog route", variant: "secondary" },
      { label: "Programmable blocks", variant: "primary" },
    ],
    breadcrumbs: ["App", "Component Catalog"],
    description:
      "A reusable component inventory extracted from the current design mocks. This route hosts prop-driven building blocks rather than assembled pages.",
    title: "PulseOps component catalog",
  },
  inventory: {
    rows: [
      { family: "Marketing", id: "inventory-hero", name: "MarketingHero", notes: "Hero block with CTA stack and stat strip.", sourcePages: ["design/index.html"] },
      { family: "Marketing", id: "inventory-problem", name: "ProblemCard", notes: "Pain, vertical, and trust cards share this structure.", sourcePages: ["design/index.html"] },
      { family: "Marketing", id: "inventory-workflow", name: "WorkflowStepCard", notes: "Used for how-it-works flows and onboarding sequences.", sourcePages: ["design/index.html"] },
      { family: "Marketing", id: "inventory-question", name: "QuestionCard", notes: "Decision-pack question grid and outcome prompts.", sourcePages: ["design/index.html"] },
      { family: "Marketing", id: "inventory-pricing", name: "PricingCard", notes: "Tier card for public pricing and plan comparisons.", sourcePages: ["design/index.html"] },
      { family: "Marketing", id: "inventory-testimonial", name: "TestimonialCard", notes: "Social proof block for quotes and case studies.", sourcePages: ["design/index.html", "design/blog.html"] },
      { family: "Marketing", id: "inventory-cta", name: "CallToActionBanner", notes: "Final conversion block for landing and announcement pages.", sourcePages: ["design/index.html"] },
      { family: "Workspace", id: "inventory-header", name: "WorkspaceHeader", notes: "Route header with breadcrumbs and actions.", sourcePages: ["design/app-dashboard.html", "design/app-explorer.html", "design/app-pipeline.html"] },
      { family: "Workspace", id: "inventory-filter", name: "FilterChip", notes: "Scope pills for dashboard, explorer, ask, and pack views.", sourcePages: ["design/app-dashboard.html", "design/app-explorer.html", "design/app-ask.html"] },
      { family: "Workspace", id: "inventory-metric", name: "MetricTile", notes: "KPI tile for dashboards and decision-pack summaries.", sourcePages: ["design/app-dashboard.html", "design/app-decision-packs.html", "design/app-pipeline.html"] },
      { family: "Workspace", id: "inventory-activity", name: "ActivityFeedItem", notes: "Operational event stream item with label, time, and action.", sourcePages: ["design/app-dashboard.html", "design/app-pipeline.html"] },
      { family: "Workspace", id: "inventory-queue", name: "DecisionQueueCard", notes: "Operator-review card for merges, parse failures, and approvals.", sourcePages: ["design/app-dashboard.html"] },
      { family: "Workspace", id: "inventory-signal", name: "SignalCard", notes: "Business health and impact indicator tile.", sourcePages: ["design/app-dashboard.html", "design/app-decision-packs.html"] },
      { family: "Workspace", id: "inventory-pack", name: "PackListItem", notes: "Pack list row with status, counts, and accent marker.", sourcePages: ["design/app-decision-packs.html"] },
      { family: "Workspace", id: "inventory-rec", name: "RecommendationCard", notes: "Priority recommendation with confidence and citations.", sourcePages: ["design/app-decision-packs.html"] },
      { family: "Data", id: "inventory-table", name: "CatalogTable", notes: "Generic host for inventory and explorer rows.", sourcePages: ["design/app-explorer.html", "design/app-decision-packs.html"] },
      { family: "Data", id: "inventory-conversation", name: "ConversationBubble", notes: "Ask thread bubble for user and assistant turns.", sourcePages: ["design/app-ask.html"] },
      { family: "Data", id: "inventory-citation", name: "CitationList", notes: "Source chips used for provenance across features.", sourcePages: ["design/app-ask.html", "design/app-decision-packs.html", "design/app-explorer.html"] },
      { family: "Settings", id: "inventory-field", name: "FieldGroup", notes: "Label and hint wrapper for settings forms.", sourcePages: ["design/app-settings.html"] },
      { family: "Settings", id: "inventory-text", name: "TextField", notes: "Typed text input surface for org, policy, and security fields.", sourcePages: ["design/app-settings.html"] },
      { family: "Settings", id: "inventory-segmented", name: "SegmentedControl", notes: "Static segmented selector for theme, scope, and mode controls.", sourcePages: ["design/app-settings.html", "design/app-dashboard.html"] },
      { family: "Settings", id: "inventory-toggle", name: "ToggleRow", notes: "Preference row for notifications and security options.", sourcePages: ["design/app-settings.html"] },
      { family: "Settings", id: "inventory-preference", name: "PreferencePanel", notes: "Panel shell for grouped settings sections.", sourcePages: ["design/app-settings.html"] },
      { family: "Settings", id: "inventory-team", name: "TeamMemberRow", notes: "Member list row for roles, invites, and active users.", sourcePages: ["design/app-settings.html"] },
      { family: "Settings", id: "inventory-actions", name: "SettingsActionRow", notes: "Primary and secondary action row for settings footers.", sourcePages: ["design/app-settings.html"] },
      { family: "Settings", id: "inventory-dialog", name: "DialogFrame", notes: "Modal shell for invite, 2FA, and confirmation flows.", sourcePages: ["design/app-settings.html"] },
    ],
    section: {
      description: "Each row maps a reusable block to the source mock pages it was derived from.",
      eyebrow: "Inventory",
      title: "Current component inventory",
    },
    table: {
      ariaLabel: "Component inventory",
      componentHeader: "Component",
      intentHeader: "Catalog intent",
      sourceHeader: "Design sources",
    },
  },
  marketing: {
    cta: {
      description:
        "This remains a component preview, not a live conversion flow. The point is to lock the reusable surface area before pages are composed.",
      primaryAction: "Use in future landing pages",
      secondaryAction: "Keep scope on the MVP brief",
      title: "CTA surfaces are cataloged as reusable blocks too.",
    },
    hero: {
      actions: [
        { label: "Start free - no card", variant: "primary" },
        { label: "See how it works", variant: "secondary" },
      ],
      description:
        "PulseOps turns scattered service-business data into one operational brief with citations, confidence, and a clear weekly action list.",
      eyebrow: "Cash and margin intelligence",
      footerNote: "Sources: Fed Small Business Credit Survey and Intuit SMB surveys",
      stats: [
        { detail: "of small businesses are owed unpaid invoices", value: "56%" },
        { detail: "average outstanding receivable per business", value: "$17.5K" },
        { detail: "cite cost inflation as a top operating risk", value: "75%" },
        { detail: "challenge: predicting job margin accurately", value: "#1" },
      ],
      titleLines: ["Run a service business on", "facts instead of guesswork."],
    },
    pricingCards: [
      {
        ctaLabel: "Start trial",
        description: "For owner-led service businesses focused on weekly cash and margin visibility.",
        name: "Cash and margin brief",
        points: ["One business and up to four sources", "Weekly cash and margin brief", "Invoice and receivable tracking"],
        price: "$149",
        priceSuffix: "/month",
      },
      {
        ctaLabel: "Start trial",
        description: "For growing operators that want more frequent monitoring and intervention.",
        featured: true,
        featuredLabel: "Most popular",
        name: "Full operations pack",
        points: ["Daily snapshots plus weekly brief", "Crew and job profitability tracking", "Exception-based alerts"],
        price: "$299",
        priceSuffix: "/month",
      },
      {
        ctaLabel: "Contact sales",
        description: "For multi-location operators that need rollups and benchmarking.",
        name: "Multi-location",
        points: ["Unlimited locations", "Cross-site benchmarking", "Custom connector support"],
        price: "Custom",
        priceSuffix: "pricing",
      },
    ],
    problemCards: [
      { description: "Quotes stay flat while labor and materials drift. Margin loss only appears after the work is done.", icon: "$", title: "Underpriced jobs" },
      { description: "Cash was earned, but nobody is chasing the invoices that now fund customer working capital.", icon: "#", title: "Invoices no one owns" },
      { description: "Small cost overruns compound quietly across crews, vendors, and job types.", icon: "%", title: "Margin leakage" },
      { description: "Collections and payables move on different clocks, which creates preventable cash pressure.", icon: "!", title: "Cash flow whiplash" },
    ],
    questions: {
      badgeLabel: "Weekly brief questions",
      description:
        "These cards are structured around the six operating questions the product is supposed to answer each week.",
      items: [
        { description: "Compare estimated versus actual margin and flag the job types that consistently miss target.", icon: "$", title: "Which jobs are underpriced?" },
        { description: "Rank invoice follow-up based on days overdue and dollars at risk.", icon: "#", title: "Which invoices need action today?" },
        { description: "Surface the highest-impact changes to make first when time is limited.", icon: ">", title: "What deserves attention first?" },
      ],
      title: "Decision-oriented question cards",
    },
    section: {
      description: "Public-site blocks shared across the homepage and surrounding marketing pages.",
      eyebrow: "Marketing",
      title: "Public-site building blocks",
    },
    testimonials: [
      { company: "HVAC - 14 technicians", initials: "MR", name: "Marcus R.", quote: "PulseOps showed which service line was losing money once drive time and callbacks were counted. That let us fix pricing without guesswork." },
      { company: "Plumbing - 9 employees", initials: "DV", name: "Diana V.", quote: "The first brief gave me a call list for overdue invoices. We collected a meaningful share of the balance the same week." },
      { company: "Landscaping - 2 crews", initials: "TB", name: "Tariq B.", quote: "It isolated a margin problem to one estimating pattern instead of one crew, which changed the fix completely." },
    ],
    workflowSteps: [
      { description: "Start with uploads and existing systems rather than asking the operator to re-key data.", step: "1", title: "Connect or upload" },
      { description: "Normalize files into one typed operational picture with explicit provenance.", step: "2", title: "Build one canonical view" },
      { description: "Flag what changed, why it changed, and how confident the system is.", step: "3", title: "Explain every recommendation" },
      { description: "Deliver a Monday brief instead of expecting users to monitor dashboards all week.", step: "4", title: "Ship the weekly brief" },
    ],
  },
  pageSummary: {
    badgeLabel: "Design review output",
    description:
      "The catalog covers recurring structures from the public marketing site and the authenticated app mocks: hero surfaces, pricing blocks, KPI tiles, queues, recommendation cards, provenance chips, explorer tables, ask bubbles, settings fields, and modal frames.",
    metrics: [
      { detail: "from 7 distinct design mock pages", label: "Cataloged blocks", tone: "success", trend: "21 reusable pieces", value: "21" },
      { detail: "marketing, workspace, data, settings", label: "Component families", tone: "info", trend: "4 grouped areas", value: "4" },
      { detail: "each example below accepts data through props", label: "Assembly mode", tone: "warning", trend: "No page routes built", value: "Catalog only" },
      { detail: "recommendations and answers keep source context visible", label: "Trust surfaces", tone: "danger", trend: "Citations stay first-class", value: "Built in" },
    ],
    sectionLinks: [
      { href: "#inventory", label: "Inventory" },
      { href: "#marketing", label: "Marketing" },
      { href: "#workspace", label: "Workspace" },
      { href: "#data", label: "Data and trust" },
      { href: "#controls", label: "Settings and dialogs" },
    ],
    title: "Pages are not being built yet. The app now has a catalog of reusable page parts.",
  },
  settings: {
    dialog: {
      actions: { cancel: "Cancel", continue: "Continue" },
      description: "A modal shell extracted from the settings mock for invite, security, and confirmation flows.",
      manualCodeLabel: "Manual code",
      manualCodeValue: "JBSW Y3DP EHPK 3PXP",
      qrLabel: "QR",
      recoveryCodes: ["8f2k-mn94", "t7qp-38xc", "w2ra-91bz", "6mds-44yt"],
      recoveryCodesLabel: "Recovery codes",
      stepLabel: "2FA setup",
      title: "Set up two-factor authentication",
      verificationCodeHint: "Use the six-digit code from your authenticator app.",
      verificationCodeLabel: "Verification code",
      verificationCodeValue: "000000",
    },
    panel: {
      actions: { primaryLabel: "Save changes", secondaryLabel: "Cancel" },
      description:
        "This panel demonstrates how the settings page can be assembled from a small control kit instead of one large page file.",
      organizationField: {
        hint: "Used to tune the first brief and its benchmarks.",
        label: "Organization name",
        value: "Broward HVAC Co.",
      },
      team: {
        badgeLabel: "4 members",
        description: "Simple list primitives for owners, admins, operators, and invites.",
        members: [
          { accessSummary: "Setup, Ops, Reports", email: "jamie@browardhvac.com", name: "Jamie R.", role: "Owner", status: "active", statusLabel: "Active" },
          { accessSummary: "Setup, Ops, Reports", email: "dana@browardhvac.com", name: "Dana M.", role: "Admin", status: "active", statusLabel: "Active" },
          { accessSummary: "Reports", email: "ops@browardhvac.com", name: "Invited User", role: "Viewer", status: "invited", statusLabel: "Invited" },
        ],
        title: "Team membership rows",
      },
      themeField: {
        label: "Theme preference",
        options: ["Dark", "Light", "System"],
      },
      title: "Workspace preferences",
      toggles: [
        { description: "Immediate email whenever a parse failure blocks the brief path.", enabled: true, title: "Notify on critical parse failures" },
        { description: "Send the ranked weekly recommendation list every Monday morning.", enabled: true, title: "Email the weekly cash and margin brief" },
        { description: "Allow low-confidence extractions to remain visible but excluded from pack output.", title: "Show low-confidence records in explorer" },
      ],
      verticalField: {
        label: "Primary industry",
        value: "HVAC",
      },
    },
    section: {
      description: "Control surfaces extracted from the settings mock.",
      eyebrow: "Settings",
      title: "Settings and dialog surfaces",
    },
  },
  workspace: {
    activity: {
      badgeLabel: "Live mock stream",
      items: [
        { action: "Review", detail: "Parsed, classified, and queued for extraction", label: "Import", time: "14m ago", title: "47 invoices imported from Gmail / AP inbox", tone: "info" },
        { action: "Inspect", detail: "Unsupported layout needs a parser update or manual review", label: "Failure", time: "14m ago", title: "3 PDF invoices failed layout parse", tone: "danger" },
        { action: "Approve", detail: "Equipment Rental and Subcontract Labor are waiting for operator approval", label: "AI", time: "1h ago", title: "2 new vendor categories auto-detected", tone: "warning" },
        { action: "Open pack", detail: "8 recommendations generated and 3 flagged high priority", label: "Pack", time: "6h ago", title: "Cash and margin brief completed for Broward HVAC Co.", tone: "accent" },
      ],
      title: "Pipeline activity",
    },
    filterKit: {
      chips: ["Last 7 days", "Invoices only", "ServiceTitan", "Needs review"],
      description: "Filter chips are shared across dashboard, explorer, ask, and pack contexts.",
      eyebrow: "Filter and navigation kit",
    },
    metrics: [
      { detail: "across uploads and connected sources", label: "Files received", tone: "success", trend: "+8 vs yesterday", value: "52" },
      { detail: "slightly below yesterday because of invoice layout drift", label: "Parse success", tone: "danger", trend: "-1.1 pts", value: "94.2%" },
      { detail: "decision output remains above the 0.85 brief threshold", label: "Average confidence", tone: "success", trend: "+0.03", value: "0.87" },
      { detail: "held before downstream write or pack inclusion", label: "Awaiting review", tone: "warning", trend: "7 items", value: "7" },
    ],
    packs: {
      badgeLabel: "7 total",
      items: [
        { accent: "accent", meta: "52 records and 5 recommendations", periodLabel: "Week of Apr 14, 2026", status: "ready", statusLabel: "Ready", title: "Cash and margin brief" },
        { accent: "info", meta: "31 records and 3 recommendations", periodLabel: "Week of Apr 14, 2026", status: "ready", statusLabel: "Ready", title: "Capacity and utilization" },
        { accent: "warning", meta: "18 records and 2 recommendations", periodLabel: "Week of Apr 14, 2026", status: "draft", statusLabel: "Draft", title: "Parts and supplier" },
      ],
      title: "Decision pack list",
    },
    queue: {
      badgeLabel: "5 items",
      items: [
        { actions: ["Merge", "Keep separate"], context: "Appears across 14 invoices totaling $33,400", priority: "danger", priorityLabel: "High priority", title: "HVAC Parts Ltd and HVAC Parts LLC detected as the same vendor", typeLabel: "Vendor merge" },
        { actions: ["Approve", "Rename", "Discard"], context: "Detected in 6 reports this week", priority: "warning", priorityLabel: "Needs review", title: "Approve a new cost bucket for Equipment Rental", typeLabel: "Bucket review" },
        { actions: ["Map now", "Skip"], context: "Office supplies and vehicle maintenance are unmapped", priority: "info", priorityLabel: "Informational", title: "Two QuickBooks accounts need assignment", typeLabel: "Account mapping" },
      ],
      title: "Operator queue",
    },
    recommendations: [
      { actions: ["Accept", "Dismiss"], citations: ["AP_Invoice_Cooltek_0419.pdf", "AP_Invoice_ThermoFlux_0412.pdf", "QBO_PL_Mar2026.xlsx"], confidence: 0.91, priority: "danger", priorityLabel: "Urgent", summary: "Three invoices are now overdue and represent $14,800 in collectible cash. Start with the oldest and largest balance first.", title: "Chase overdue invoices before Friday" },
      { actions: ["Accept", "Not now"], citations: ["Job_Report_Week17_Batch.csv", "AP_Invoice_Cooltek_0419.pdf"], confidence: 0.86, priority: "warning", priorityLabel: "Watch", summary: "Four jobs missed your target margin because parts costs drifted above estimate. Review pricing on the affected job type.", title: "Reprice jobs that are missing margin target" },
    ],
    section: {
      description: "Operational components from dashboard, pipeline, decision-pack, and queue flows.",
      eyebrow: "Workspace",
      title: "Authenticated app blocks",
    },
    signals: [
      { detail: "12 invoices and 38 days average overdue", label: "Past-due invoices", tone: "danger", value: "$42,800" },
      { detail: "average margin gap of $380 per job", label: "Underpriced jobs", tone: "warning", value: "3 jobs" },
      { detail: "up versus last month and at a 3-month high", label: "Margin trend", tone: "success", value: "+2.1%" },
      { detail: "acceptance rate over the last 30 days", label: "Recommendation acceptance", tone: "info", value: "71%" },
    ],
  },
  data: {
    ask: {
      assistantAvatarLabel: "PO",
      assistantLeadLabel: "Based on",
      assistantMessage: "Three invoices are past due as of Apr 19, 2026. Total outstanding:",
      citations: ["AP_Invoice_ThermoFlux_0412.pdf", "AP_Invoice_SkyAir_0408.pdf", "AP_Invoice_Cooltek_0419.pdf"],
      filters: ["All data", "This week", "Invoices only"],
      overdueItems: [
        { label: "11 days overdue", name: "AP_Invoice_ThermoFlux_0412", tone: "danger" },
        { label: "7 days overdue", name: "AP_Invoice_SkyAir_0408", tone: "warning" },
        { label: "5 days overdue", name: "AP_Invoice_Cooltek_0419", tone: "warning" },
      ],
      title: "Ask thread preview",
      totalOutstanding: "$14,800",
      userAvatarLabel: "JR",
      userQuestion: "Which invoices are overdue as of today?",
    },
    records: [
      { confidence: 0.94, id: "record-1", name: "AP_Invoice_Cooltek_0419.pdf", source: "Gmail / AP inbox", statusLabel: "Extracted", statusTone: "success", typeLabel: "Invoice", typeTone: "neutral" },
      { confidence: 0.97, id: "record-2", name: "Job_Report_Week17_Batch.csv", source: "ServiceTitan", statusLabel: "Extracted", statusTone: "success", typeLabel: "Job report", typeTone: "info" },
      { confidence: 0.72, id: "record-3", name: "Supplier_Receipt_Airpro_0418.pdf", source: "Gmail / AP inbox", statusLabel: "Needs review", statusTone: "warning", typeLabel: "Receipt", typeTone: "neutral" },
      { confidence: null, id: "record-4", name: "Invoice_Brightside_0412.pdf", source: "Gmail / AP inbox", statusLabel: "Parse failed", statusTone: "danger", typeLabel: "Invoice", typeTone: "neutral" },
    ],
    section: {
      description: "Evidence-first blocks shared between explorer, ask, and recommendations.",
      eyebrow: "Data and trust",
      title: "Explorer and provenance blocks",
    },
    table: {
      ariaLabel: "Explorer preview",
      classHeader: "Doc class",
      confidenceHeader: "Confidence",
      description: "The same generic table component can host both inventory views and parsed-record previews.",
      documentHeader: "Document",
      statusHeader: "Status",
      title: "Explorer table preview",
    },
  },
};
