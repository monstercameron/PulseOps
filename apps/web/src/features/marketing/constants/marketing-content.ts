import type {
  MarketingFooterGroup,
  MarketingNavLink,
} from "@/features/marketing/components/marketing-shell";

export const marketingNavigationLinks: readonly MarketingNavLink[] = [
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#questions", label: "What You Get" },
  { href: "/#difference", label: "Why Different" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
];

export const marketingFooterGroups: readonly MarketingFooterGroup[] = [
  {
    title: "Product",
    links: [
      { href: "/#questions", label: "What You Get" },
      { href: "/#how-it-works", label: "How It Works" },
      { href: "/#pricing", label: "Pricing" },
      { href: "/#difference", label: "Why Different" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/blog", label: "Blog" },
      { href: "/careers", label: "Careers" },
      { href: "/press", label: "Press" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/help", label: "Help Center" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
] as const;

export const marketingShellContent = {
  ctaHref: "/signup",
  ctaLabel: "Start Free",
  footerDescription:
    "Weekly cash and margin clarity for local service businesses with no analysts, no dashboards, and no guesswork.",
  footerTagline: "Built for local service businesses everywhere.",
} as const;

export const homePageContent = {
  hero: {
    eyebrow: "Cash and Margin Intelligence",
    title: "Your service business runs on gut feel. Start running it on facts.",
    description:
      "PulseOps delivers a plain-language weekly brief that tells you where money is leaking, which invoices to chase, and what to fix before Friday.",
    actions: [
      { href: "/signup", label: "Start Free", variant: "primary" },
      { href: "/#how-it-works", label: "See How It Works", variant: "secondary" },
    ],
    stats: [
      { value: "56%", detail: "of small businesses carry overdue invoices" },
      { value: "$17.5K", detail: "average outstanding balance per business" },
      { value: "75%", detail: "cite rising costs as the top challenge" },
      { value: "#1", detail: "margin clarity is the most common blind spot" },
    ],
    footerNote: "Sources: Fed small business credit survey and Intuit SMB research.",
  },
  pain: {
    eyebrow: "The Real Problem",
    title: "The numbers are already there. They just are not usable fast enough to act on.",
    description:
      "Sales live in one system, costs in another, schedules in a spreadsheet, and invoices in an inbox. Problems pile up quietly until they are painful.",
    items: [
      {
        icon: "Cash",
        title: "Underpriced jobs",
        description:
          "Labor runs over estimate, materials creep up, and pricing never catches up.",
      },
      {
        icon: "AR",
        title: "Invoices nobody is chasing",
        description:
          "Cash is earned, but collections slip because the right accounts never get surfaced early.",
      },
      {
        icon: "Margin",
        title: "Line-item leakage",
        description:
          "One service type or one supplier can quietly erase margin without showing up in a dashboard summary.",
      },
      {
        icon: "Timing",
        title: "Cash flow whiplash",
        description:
          "Vendors want cash before customers pay, and the shortfall only becomes obvious when it is too late.",
      },
    ],
  },
  workflow: {
    eyebrow: "How It Works",
    title: "Connected in a day. Actionable by Monday.",
    description:
      "We do the messy integration and normalization work so the owner gets a short, useful brief instead of another report to maintain.",
    steps: [
      {
        step: "1",
        title: "Connect the systems you already use",
        description:
          "QuickBooks, ServiceTitan, spreadsheets, inbox attachments, and manual uploads all flow into one intake surface.",
      },
      {
        step: "2",
        title: "Build one clean business picture",
        description:
          "PulseOps reconciles jobs, costs, payments, and documents into a single operating view.",
      },
      {
        step: "3",
        title: "Show the source evidence",
        description:
          "Every recommendation includes provenance, confidence, and the exact records behind it.",
      },
      {
        step: "4",
        title: "Deliver the weekly brief",
        description:
          "The owner gets six decision-focused answers in plain English with the next best actions ranked by impact.",
      },
    ],
    connectors: [
      "QuickBooks",
      "Jobber",
      "ServiceTitan",
      "Housecall Pro",
      "Google Sheets",
      "Excel",
      "Bank exports",
    ],
  },
  questions: {
    eyebrow: "The Weekly Brief",
    title: "Six questions. Answered every Monday.",
    description:
      "These are the questions owners already ask. PulseOps makes sure someone is answering them with evidence.",
    items: [
      {
        icon: "?",
        title: "Which jobs are underpriced?",
        description:
          "Find the services where actual cost consistently outruns quoted price.",
      },
      {
        icon: "?",
        title: "Where is margin leaking?",
        description:
          "Callbacks, overtime, and material variance get ranked by their dollar impact.",
      },
      {
        icon: "?",
        title: "Which invoices should we chase today?",
        description:
          "Get a short, urgent list of who owes cash and what to do first.",
      },
      {
        icon: "?",
        title: "Which customers need deposits?",
        description:
          "Flag slow-paying accounts and large upcoming work that should require cash upfront.",
      },
      {
        icon: "?",
        title: "What bills are timing-sensitive?",
        description:
          "Surface purchases and vendor payments that need to be timed against cash inflows.",
      },
      {
        icon: "?",
        title: "What deserves attention most?",
        description:
          "Get one ranked list of the highest-impact actions for the week.",
      },
    ],
  },
  preview: {
    eyebrow: "What It Looks Like",
    title: "Advice, not a report.",
    description:
      "Each recommendation tells you what changed, what it means in dollars, and what to do next.",
    checklist: [
      "Only highlights what changed or needs action.",
      "Shows source evidence and confidence for every recommendation.",
      "Ranks issues by dollar impact so you start with what matters most.",
      "Works in email or in-app with the same clear decision surface.",
      "Takes under five minutes to read and act on.",
    ],
    recommendations: [
      {
        title: "Pricing gap on water heater installs",
        summary:
          "Labor averaged 3.4 hours versus a 2.5 hour estimate across 17 recent jobs.",
        detail: "Estimated recovery: $2,400 per month.",
      },
      {
        title: "Three overdue invoices need escalation",
        summary:
          "Riverdale Commercial and two other accounts now represent the largest concentration of open receivables.",
        detail: "Cash at risk: $8,750.",
      },
      {
        title: "Supplier bill timing creates a cash pinch on Friday",
        summary:
          "A supplier invoice is due before expected receivables land, leaving a shortfall unless collections clear early.",
        detail: "Projected gap: $1,400.",
      },
    ],
  },
  difference: {
    eyebrow: "What Sets Us Apart",
    title: "Other tools show data. We tell you what to do about it.",
    description:
      "Most products read one clean system and hand you a chart. PulseOps reconciles the messy reality and turns it into a decision.",
    items: [
      {
        icon: "Merge",
        title: "One clear picture",
        description:
          "Bank data, job systems, spreadsheets, and inbox files are reconciled into a single operational view.",
      },
      {
        icon: "Proof",
        title: "Show your work",
        description:
          "Recommendations include the jobs, invoices, and calculations behind them so the user can judge the advice.",
      },
      {
        icon: "Learn",
        title: "Learns your business",
        description:
          "Corrections, approvals, and rejected recommendations tune the system toward how the business actually runs.",
      },
    ],
  },
  industries: {
    eyebrow: "Built For",
    title: "Project-based local service businesses with 5 to 50 employees.",
    description:
      "The first decision pack is optimized for field-service and trade businesses that live with the same cash and margin questions every week.",
    items: [
      "HVAC",
      "Plumbing",
      "Electrical",
      "Landscaping",
      "Pool Service",
      "Cleaning",
      "Pest Control",
      "Garage Door",
      "Light Construction",
      "Appliance Repair",
    ],
    note: "Additional decision packs for other verticals come later, after the cash and margin brief works end to end.",
  },
  testimonials: {
    eyebrow: "From the Field",
    title: "Owners who stopped flying blind.",
    items: [
      {
        quote:
          "PulseOps showed us that maintenance calls cost more than they bill once you count drive time and callbacks. We changed pricing and margin recovered in six weeks.",
        name: "Marcus R.",
        company: "HVAC - 14 technicians",
        initials: "MR",
      },
      {
        quote:
          "The first brief gave me a list of three invoices to chase that morning. We collected most of the backlog that same week.",
        name: "Diana V.",
        company: "Plumbing - 9 employees",
        initials: "DV",
      },
      {
        quote:
          "We fixed the estimating process, not the crew, because the system showed exactly where the margin problem started.",
        name: "Tariq B.",
        company: "Landscaping - 11 employees",
        initials: "TB",
      },
    ],
  },
  pricing: {
    eyebrow: "Pricing",
    title: "Flat-rate. No analysts. No surprises.",
    description:
      "Everything is included. No per-seat fees, no hidden implementation contract, and no surprise usage pricing on the first product.",
    tiers: [
      {
        name: "Cash and Margin Brief",
        price: "$149",
        priceSuffix: "/mo",
        description:
          "For owner-operated service businesses ready to stop guessing on cash and margin.",
        points: [
          "1 business and up to 4 data sources",
          "Weekly cash and margin brief",
          "Job profitability analysis",
          "Invoice and receivables tracking",
          "Industry benchmarks",
          "Email support",
        ],
        ctaLabel: "Start Free Trial",
      },
      {
        name: "Full Operations Pack",
        price: "$299",
        priceSuffix: "/mo",
        description:
          "For growing operators who need cash, margin, staffing, and exception visibility in one surface.",
        points: [
          "Up to 3 locations and unlimited sources",
          "Daily snapshots plus weekly brief",
          "Crew and job profitability tracking",
          "Customer deposit recommendations",
          "Exception-based alerts",
          "Priority support",
        ],
        ctaLabel: "Start Free Trial",
        featured: true,
        featuredLabel: "Most Popular",
      },
      {
        name: "Multi-location",
        price: "Custom",
        priceSuffix: "",
        description:
          "For groups and franchises that need consolidated visibility and benchmarking.",
        points: [
          "Unlimited locations",
          "Cross-location benchmarking",
          "Custom connectors",
          "Dedicated onboarding support",
          "White-label option",
          "SLA-backed support",
        ],
        ctaLabel: "Contact Sales",
      },
    ],
  },
  cta: {
    title: "Start knowing your numbers this week.",
    description:
      "Connect your first data source in under 10 minutes. Your first brief arrives Monday.",
    primaryAction: "Start Free",
    secondaryAction: "Talk to Sales",
  },
} as const;

export const aboutPageContent = {
  hero: {
    eyebrow: "About PulseOps",
    title:
      "We built the tool we wished existed when we were running service businesses.",
    description:
      "The goal is not another dashboard. The goal is a fast, trustworthy weekly answer to the money questions owners already ask.",
  },
  mission:
    "Every local service business deserves to run on facts instead of instinct, especially when margins are tight and cash timing is unforgiving.",
  story:
    "PulseOps started from the same frustration repeated across the trades: the data existed, but nobody had time to reconcile it, trust it, and turn it into an action before the week moved on.",
  stats: [
    { value: "5 min", detail: "target read time for the weekly brief" },
    { value: "1 pack", detail: "current product focus: weekly cash and margin" },
    { value: "0 fluff", detail: "every recommendation needs evidence and confidence" },
  ],
  values: [
    {
      title: "Decisions, not dashboards",
      description:
        "The product should end in a clear action, not another place to stare at numbers.",
    },
    {
      title: "Show your work",
      description:
        "Recommendations need source evidence, confidence, and enough context to support review.",
    },
    {
      title: "Built for the owner",
      description:
        "We optimize for the operator trying to protect cash and margin, not for an executive theater deck.",
    },
  ],
  team: [
    {
      name: "Jordan Kim",
      role: "Co-founder and former field-service operator",
      description:
        "Spent a decade inside service businesses that had good instincts and weak information flow.",
    },
    {
      name: "Sofia Reyes",
      role: "Product and design",
      description:
        "Focuses on making dense operational questions feel simple enough to use on a Monday morning.",
    },
    {
      name: "Marcus Liu",
      role: "Data systems",
      description:
        "Turns messy documents and exports into typed, reviewable facts that the product can trust.",
    },
  ],
  cta: {
    title: "Ready to see it in action?",
    description:
      "Start with the weekly cash and margin brief and connect one real workflow before broadening scope.",
    primaryAction: "Start Free",
    secondaryAction: "Contact Us",
  },
} as const;

export const blogPageContent = {
  hero: {
    eyebrow: "Blog",
    title: "Practical thinking for service business owners.",
    description:
      "Operator-first writing about cash timing, margin drift, field-service pricing, and decision quality.",
  },
  featuredPost: {
    title:
      "Why most HVAC businesses cannot answer 'are we profitable this month?'",
    summary:
      "The answer is usually trapped across job-cost data, invoices, supplier bills, and spreadsheets that never line up in time.",
    meta: "Featured article",
  },
  posts: [
    "How to know when your labor rate is out of date before it starts costing jobs.",
    "The commercial customer deposit conversation and when to have it.",
    "Drive time is destroying per-job margin. Here is what the math looks like.",
    "The 30/60/90 invoice problem and why bad AR becomes a habit.",
    "How one plumbing business found margin by fixing one job category.",
    "Material cost creep and why estimates go stale faster than you think.",
  ],
  cta: {
    title: "Get the weekly brief - free for 30 days.",
    description:
      "If the blog is useful, the product turns the same thinking into a recurring operating surface.",
    primaryAction: "Start Free",
    secondaryAction: "See Pricing",
  },
} as const;

export const careersPageContent = {
  hero: {
    eyebrow: "Careers",
    title: "Help us build the financial clarity layer for local service businesses.",
    description:
      "We stay small, ship real work, and optimize for useful product instead of internal theater.",
  },
  reasons: [
    {
      title: "The problem is genuinely hard",
      description:
        "Messy documents, fragmented systems, trust requirements, and high-stakes business decisions all meet in one product.",
    },
    {
      title: "Customers tell you quickly if it works",
      description:
        "The output either helps an owner protect cash and margin this week, or it does not.",
    },
    {
      title: "Build what matters",
      description:
        "We prefer constrained scope, clear contracts, and measurable product value over surface area.",
    },
  ],
  openings: [
    {
      title: "Senior Data Engineer",
      meta: "Remote - Full time",
      description:
        "Own ingestion and canonicalization paths from raw uploads to reviewable facts and metrics.",
    },
    {
      title: "Product Designer",
      meta: "Remote - Full time",
      description:
        "Design decision surfaces that stay simple without hiding confidence, provenance, or risk.",
    },
    {
      title: "Customer Success - Field Service Specialist",
      meta: "Remote - Full time",
      description:
        "Translate operator pain into onboarding, implementation, and product feedback loops.",
    },
    {
      title: "Growth Marketing Manager",
      meta: "Remote - Full time",
      description:
        "Help the right operators discover the product without drifting the ICP or the product claims.",
    },
  ],
} as const;

export const contactPageContent = {
  hero: {
    eyebrow: "Contact",
    title: "Get in touch.",
    description:
      "Use the route that fits the problem. We keep the product, support, and partnership conversations distinct.",
  },
  channels: [
    {
      title: "Customer Support",
      description: "Help with onboarding, data issues, or brief interpretation.",
      action: "support@pulseops.io",
    },
    {
      title: "Sales and Multi-location",
      description: "Pricing, expansion, and larger operational rollouts.",
      action: "sales@pulseops.io",
    },
    {
      title: "Press and Media",
      description: "Interviews, coverage, and product background.",
      action: "press@pulseops.io",
    },
    {
      title: "Partnerships and Integrations",
      description: "Platform partnerships and connector discussions.",
      action: "partners@pulseops.io",
    },
  ],
  formFields: [
    { label: "Name", placeholder: "Jamie Reynolds" },
    { label: "Work email", placeholder: "jamie@browardhvac.com", type: "email" },
    { label: "Company", placeholder: "Broward HVAC Co." },
    { label: "Message", placeholder: "Tell us what you need help with." },
  ],
} as const;

export const helpPageContent = {
  hero: {
    eyebrow: "Help Center",
    title: "How can we help?",
    description:
      "The first product is intentionally narrow, so the help content is focused on setup, ingestion, the weekly brief, and account controls.",
  },
  groups: [
    {
      title: "Getting Started",
      items: [
        {
          question: "What does PulseOps do first?",
          answer:
            "The first product is the weekly cash and margin brief for field-service businesses. It is not a general BI platform.",
        },
        {
          question: "What data can I upload today?",
          answer:
            "CSV and XLSX are the first-class manual upload formats. Additional sources come later.",
        },
      ],
    },
    {
      title: "Connecting Data",
      items: [
        {
          question: "Can I connect ServiceTitan and QuickBooks together?",
          answer:
            "Yes. The goal is to reconcile fragmented data into one usable operational view.",
        },
        {
          question: "What happens if parsing fails?",
          answer:
            "Failed records stay visible for review and retry instead of silently contaminating downstream outputs.",
        },
      ],
    },
    {
      title: "Your Brief",
      items: [
        {
          question: "Why does every recommendation include confidence?",
          answer:
            "Trust is a core product requirement. The user needs to know how strong the evidence is before acting.",
        },
        {
          question: "Can recommendations be rejected?",
          answer:
            "Yes. Rejections and edits are part of the feedback loop that helps the system learn the business.",
        },
      ],
    },
    {
      title: "Account and Billing",
      items: [
        {
          question: "Can I cancel anytime?",
          answer: "Yes. The early product is structured to stay simple and low-friction.",
        },
        {
          question: "Do you charge per seat?",
          answer:
            "No. Pricing is flat-rate for the product package rather than seat-based.",
        },
      ],
    },
  ],
  cta: {
    title: "Still have a question?",
    description: "Talk to the team directly if the help center does not cover your case.",
    primaryAction: "Contact Support",
    secondaryAction: "Start Free",
  },
} as const;

export const pressPageContent = {
  hero: {
    eyebrow: "Press",
    title: "Press and media resources.",
    description:
      "Background material, product framing, and contact details for media coverage.",
  },
  boilerplate:
    "PulseOps helps local service businesses protect cash and margin through a weekly decision brief grounded in their real operational data.",
  facts: [
    { value: "Field service", detail: "Initial ICP focus" },
    { value: "1 product", detail: "Weekly cash and margin brief" },
    { value: "Trust-first", detail: "Evidence and confidence on every recommendation" },
    { value: "Next.js", detail: "Current local product surface" },
  ],
  colors: [
    { name: "Navy", value: "#0d1b2a" },
    { name: "Accent", value: "#11b58a" },
    { name: "Background", value: "#f5f7fb" },
    { name: "Text", value: "#142235" },
  ],
  coverage: [
    "The new class of field service analytics tools is finally built for the owner, not the accountant.",
    "PulseOps delivers what QuickBooks will not: a weekly answer to whether the business is actually profitable.",
    "A $149 brief that tells trades operators which jobs are losing money? We tried it.",
  ],
} as const;

export const privacyPageContent = {
  title: "Privacy Policy",
  updatedLabel: "Updated Apr 9, 2026",
  intro:
    "This policy explains what information PulseOps collects, how it is used, and how it is protected while the product is being built around a trust-first operating model.",
  sections: [
    {
      title: "1. Information We Collect",
      body: [
        "We collect account information, uploaded documents, connected-system data, support messages, and product usage signals necessary to run the service.",
        "We minimize collection to what is needed for ingestion, normalization, decision output, security, and operational support.",
      ],
    },
    {
      title: "2. How We Use Information",
      body: [
        "Information is used to process uploads, generate recommendations, improve model quality, support customers, secure the product, and comply with legal obligations.",
      ],
    },
    {
      title: "3. Data Connections and Third-Party Access",
      body: [
        "Connected systems and upload processors are used only to operate the product. We do not grant unrestricted model access to your databases or arbitrary code execution environments.",
      ],
    },
    {
      title: "4. Data Security",
      body: [
        "We design for tenant isolation, access control, auditability, redaction strategy, and retention awareness from the start rather than as a later hardening step.",
      ],
    },
    {
      title: "5. Data Retention",
      body: [
        "Retention windows are tied to the product workflow, business need, and contractual obligations. Artifacts and logs are not kept indefinitely by default.",
      ],
    },
    {
      title: "6. Your Rights",
      body: [
        "You may request access, correction, export, or deletion of your data subject to legal and operational obligations.",
      ],
    },
    {
      title: "7. Cookies",
      body: [
        "We use a limited set of cookies and local storage mechanisms for authentication, security, and product functionality.",
      ],
    },
    {
      title: "8. Changes",
      body: [
        "If this policy changes materially, we will update the effective date and communicate the change through the product or email when appropriate.",
      ],
    },
  ],
} as const;

export const termsPageContent = {
  title: "Terms of Service",
  updatedLabel: "Updated Apr 9, 2026",
  intro:
    "These terms govern access to PulseOps and describe subscription use, acceptable behavior, and the limits of the current product scope.",
  sections: [
    {
      title: "1. The Service",
      body: [
        "PulseOps currently provides a narrow product focused on a weekly cash and margin brief and the supporting ingestion, review, and recommendation workflows required to produce it.",
      ],
    },
    {
      title: "2. Account Registration",
      body: [
        "You are responsible for keeping account credentials secure and for activity occurring under your account.",
      ],
    },
    {
      title: "3. Subscriptions and Billing",
      body: [
        "Subscriptions renew according to the selected billing period unless cancelled before renewal.",
      ],
    },
    {
      title: "4. Your Data",
      body: [
        "You retain ownership of your data. You grant us the rights required to store, process, and transform that data in order to operate the service.",
      ],
    },
    {
      title: "5. Acceptable Use",
      body: [
        "You may not use the service to violate law, abuse the system, interfere with others, or attempt to gain unauthorized access to data or infrastructure.",
      ],
    },
    {
      title: "6. Service Limitations",
      body: [
        "The service is evolving. Some features shown in design or documentation may be planned rather than fully implemented, and we aim to label those cases clearly.",
      ],
    },
    {
      title: "7. Disclaimer and Liability",
      body: [
        "Except as required by law, the service is provided as available and liability is limited to the fullest extent permitted.",
      ],
    },
    {
      title: "8. Changes to Terms",
      body: [
        "We may update these terms over time. Continued use after an update constitutes acceptance of the revised terms.",
      ],
    },
  ],
} as const;

export const loginPageContent = {
  eyebrow: "Sign In",
  title: "Welcome back",
  highlight:
    "Open the latest cash and margin brief, inspect evidence, and review operator actions from one workspace.",
  details: [
    "Weekly brief review with evidence and confidence metadata.",
    "Explorer access for parsed records and extracted facts.",
    "Pipeline visibility for source health and failed records.",
  ],
  form: {
    title: "Welcome back",
    subtitle: "Sign in to continue into the PulseOps workspace.",
    fields: [
      { label: "Work email", placeholder: "jamie@browardhvac.com", type: "email" },
      { label: "Password", placeholder: "Enter your password", type: "password" },
    ],
    actions: [
      { label: "Sign in", href: "/dashboard", variant: "primary" },
      { label: "Forgot password?", href: "/help", variant: "secondary" },
    ],
    footerPrompt: "Need an account?",
    footerLinkLabel: "Start a free trial",
    footerLinkHref: "/signup",
  },
} as const;

export const signupPageContent = {
  eyebrow: "Start Free",
  title: "Start your free trial",
  highlight:
    "Connect one business, upload real records, and get the first cash and margin brief before broadening scope.",
  details: [
    "Flat-rate pricing with no seat-based tax.",
    "Manual upload support for CSV and XLSX from day one.",
    "Trust-first recommendations with citations and confidence.",
  ],
  form: {
    title: "Create your account",
    subtitle: "Tell us enough to stand up the first workspace and brief.",
    fields: [
      { label: "Full name", placeholder: "Jamie Reynolds" },
      { label: "Work email", placeholder: "jamie@browardhvac.com", type: "email" },
      { label: "Company", placeholder: "Broward HVAC Co." },
      { label: "Password", placeholder: "Choose a password", type: "password" },
    ],
    actions: [
      { label: "Create account", href: "/dashboard", variant: "primary" },
      { label: "Talk to sales", href: "/contact", variant: "secondary" },
    ],
    footerPrompt: "Already have an account?",
    footerLinkLabel: "Sign in",
    footerLinkHref: "/login",
  },
} as const;
