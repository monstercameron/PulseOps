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
  ctaLabel: "Get Started Free",
  footerDescription:
    "Weekly cash and margin clarity for local service businesses with no analysts, no dashboards, and no guesswork.",
  footerTagline: "Built for local service businesses everywhere.",
} as const;

export const homePageContent = {
  hero: {
    eyebrow: "Cash & Margin Intelligence · Built for Trades & Local Services",
    title: "Your service business runs on gut feelings. Start running it on facts.",
    description:
      "PulseOps delivers a plain-language weekly brief that tells you exactly where your money is leaking, which invoices to chase, and what to fix before Friday — built for HVAC, plumbing, landscaping, cleaning, and every other project-based service business.",
    actions: [
      { href: "/signup", label: "Start Free — No Card Needed", variant: "primary" },
      { href: "/#how-it-works", label: "See How It Works", variant: "secondary" },
    ],
    stats: [
      { value: "56%", detail: "of small businesses\nowed unpaid invoices" },
      { value: "$17.5K", detail: "average outstanding\nper business" },
      { value: "75%", detail: "cite rising costs\nas top challenge" },
      { value: "#1", detail: "challenge: accurately\npredicting job margins" },
    ],
    footerNote: "Sources: Fed Small Business Credit Survey 2025, Intuit SMB Surveys 2025–2026",
  },
  pain: {
    eyebrow: "The Real Problem",
    title: "The numbers are already there. You just can't see them clearly enough to act.",
    description:
      "Your sales are in one system. Your costs are in another. Your schedule is in a spreadsheet. Your invoices are in an email thread. None of it talks to anything else — so you're making pricing, staffing, and cash decisions on gut feel, and the problems pile up quietly until they're painful.",
    items: [
      {
        icon: "💸",
        title: "Underpriced jobs",
        description:
          "Labor runs 11% over estimate. Materials crept up. But the quote hasn't changed in two years.",
      },
      {
        icon: "🧾",
        title: "Invoices no one is chasing",
        description:
          "47% of small businesses have invoices overdue more than 30 days. The cash was earned — it's just sitting with the customer.",
      },
      {
        icon: "📉",
        title: "Margin leaking by line item",
        description:
          "One job type is quietly unprofitable. One crew costs 18% more per hour once you count callbacks and drive time. The answer is already in your data — it just isn't visible yet.",
      },
      {
        icon: "⏳",
        title: "Cash flow whiplash",
        description:
          "28% of firms collect after delivery. So you're financing your customers with your own working capital and only finding out late.",
      },
    ],
  },
  workflow: {
    eyebrow: "How It Works",
    title: "Connected in a day. Actionable by Monday.",
    description:
      "We handle the messy part — pulling your numbers together from wherever they live — so you never have to clean a spreadsheet or build a report again.",
    steps: [
      {
        step: "1",
        title: "Connect your existing systems",
        description:
          "Link your POS, QuickBooks, job management software, or scheduling tool — or just upload a bank export or spreadsheet. We handle inconsistent and incomplete data on our end. No cleanup required from you.",
      },
      {
        step: "2",
        title: "We build one clear picture of your business",
        description:
          "PulseOps pulls together everything from all your sources and works out what's actually happening with your jobs, costs, payments, and margins — not just what one system is telling you.",
      },
      {
        step: "3",
        title: "You always know why we're flagging it",
        description:
          "Every recommendation tells you what's behind it — which jobs, which costs, how confident we are — so you can make the call yourself with full context, not just take our word for it.",
      },
      {
        step: "4",
        title: "Your Weekly Brief arrives Monday",
        description:
          "Six questions answered in plain English. Ranked by financial impact. Specific, actionable, and takes under five minutes. No dashboard to open. No report to run.",
      },
    ],
    connectors: [
      "QuickBooks",
      "Jobber",
      "ServiceTitan",
      "Square / Clover",
      "Excel & Google Sheets",
      "Bank Exports",
      "Housecall Pro",
    ],
  },
  questions: {
    eyebrow: "The Weekly Brief",
    title: "Six questions. Answered every Monday.",
    description:
      "These are the questions every service business owner is already asking. PulseOps makes sure someone is actually answering them — with data, not instinct.",
    items: [
      {
        icon: "💰",
        title: "Which jobs are underpriced?",
        description:
          "See where your prices no longer cover your real costs. We compare what jobs were supposed to cost against what they actually cost — and flag every service type where you're leaving money on the table.",
      },
      {
        icon: "🔍",
        title: "Where is margin leaking?",
        description:
          "Find out where money is quietly walking out the door — callbacks, overtime, materials that came in over budget — ranked by how much each one is actually costing you.",
      },
      {
        icon: "🧾",
        title: "Which invoices to chase today?",
        description:
          "A short list of who owes you money, how long they've owed it, and exactly what to do first — so the right calls get made before the week is over.",
      },
      {
        icon: "🛡️",
        title: "Which customers need deposits?",
        description:
          "Flag slow-paying customers and large upcoming jobs where requiring a deposit upfront would protect your cash flow.",
      },
      {
        icon: "📆",
        title: "What bills are timing-sensitive?",
        description:
          "Surface upcoming purchases and vendor payments that should be timed against your incoming cash — so you're never caught short.",
      },
      {
        icon: "🚦",
        title: "What deserves your attention most?",
        description:
          "One ranked list of the highest-impact actions for the week, so you know exactly where to start when you sit down Monday morning.",
      },
    ],
  },
  preview: {
    eyebrow: "What It Looks Like",
    title: "Advice, not a report.",
    description:
      "Every item in your brief tells you what changed, what it means in dollars, and what to do. You'll know exactly why something is being flagged before you decide whether to act on it.",
    checklist: [
      "Highlights only what changed or needs action — no noise",
      "Every recommendation shows its source data and confidence level",
      "Issues ranked by dollar impact — so you start with what matters most",
      "Delivered to your email — no dashboard to log into",
      "Under five minutes to read and act on",
    ],
    recommendations: [
      {
        title: "Water heater installs are underpriced by ~$140 per job.",
        summary:
          "Labor averaged 3.4 hrs vs. 2.5 hr estimate across 17 jobs this quarter. Materials rose 6% since last price update.",
        detail: "Based on 17 jobs · Confidence: High · $2,400/mo",
      },
      {
        title: "3 invoices are 32–45 days overdue.",
        summary:
          "Riverdale Commercial (52 days, $4,200) has the worst pattern. Recommend requiring a 30% deposit on all future commercial work.",
        detail: "Matched against your invoices and payment history · Confidence: High · $8,750 owed",
      },
      {
        title: "Drain cleaning margin improved 9 pts this month.",
        summary:
          "Technician route density is up — you're fitting 1.4 more jobs per day without overtime.",
        detail: "Scheduling + payroll data · Confidence: Medium",
      },
      {
        title: "Supplier invoice of $6,100 due Friday.",
        summary:
          "Current receivable collections projected to leave a $1,400 shortfall unless the Riverdale payment clears by Thursday.",
        detail: "Matched against your outstanding invoices and bank balance · Confidence: Medium",
      },
    ],
  },
  difference: {
    eyebrow: "What Sets Us Apart",
    title: "Other tools show you data. We tell you what to do about it.",
    description:
      "Most software reads one clean system and hands you a chart. PulseOps reconciles everything you have — messy as it is — and delivers a specific decision. That's a fundamentally different product, and an advantage that grows the longer you use it.",
    items: [
      {
        icon: "🔀",
        title: "One clear picture, no matter the mess",
        description:
          "Your bank, your job system, your schedule, and your spreadsheets rarely agree with each other. PulseOps pulls them all together and tells you what's actually happening in your business — even when your numbers don't line up.",
      },
      {
        icon: "🔎",
        title: "You always know why we flagged it",
        description:
          "We don't just say \"raise your price 8%.\" We show you the 17 jobs behind it, how much labor ran over estimate, how much materials went up, and how confident we are. You make the call — we give you the full picture first.",
      },
      {
        icon: "🧠",
        title: "The system learns your business",
        description:
          "Every correction you make — changing how a cost is categorized, updating how a job type is named, rejecting a suggestion that doesn't fit — gets remembered. Over time, PulseOps doesn't just know your industry. It knows how your specific business works.",
      },
    ],
  },
  industries: {
    eyebrow: "Built For",
    title: "Project-based local service businesses. 5\u201350 employees.",
    description:
      "These businesses deal with the same frustrations: numbers split across too many tools, decisions that need to happen fast, customers who pay late, and profitable improvements sitting unnoticed in data they already have.",
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
    note: "Restaurants, med spas, salons, and retail coming soon as additional Decision Packs.",
  },
  testimonials: {
    eyebrow: "From the Field",
    title: "Trades owners who stopped flying blind.",
    items: [
      {
        quote:
          "I've been doing HVAC for 16 years. I knew some calls were more profitable than others, but I couldn't prove it. PulseOps showed me that maintenance calls cost us more than they bill when you count drive time and callbacks. We restructured the plan tier pricing and margin recovered in six weeks.",
        name: "Marcus R.",
        company: "HVAC \u00b7 14 technicians",
        initials: "M",
      },
      {
        quote:
          "We had $22,000 sitting in overdue invoices and I didn't really know which ones to prioritize. The first brief gave me a list of three to call that morning. We collected $14,000 of it that week. I don't know how I ran this business without it.",
        name: "Diana V.",
        company: "Plumbing & Drain \u00b7 9 employees",
        initials: "D",
      },
      {
        quote:
          "I run a landscaping company with two crews. The brief showed me that one crew's jobs consistently ran over on labor while the other's didn't — and it traced it back to which crew lead was running estimates. Fixed the estimating process, not the crew. Huge difference.",
        name: "Tariq B.",
        company: "Landscaping \u00b7 2 crews, 11 employees",
        initials: "T",
      },
    ],
  },
  pricing: {
    eyebrow: "Pricing",
    title: "Flat-rate. No analysts. No surprises.",
    description:
      "Everything included. No per-seat fees, no data limits, no implementation costs hidden in a services contract.",
    tiers: [
      {
        name: "Cash & Margin Brief",
        price: "$149",
        priceSuffix: "/mo",
        description:
          "For owner-operated service businesses ready to stop guessing on cash and margin.",
        points: [
          "1 business \u00b7 up to 4 data sources",
          "Weekly Cash & Margin Brief",
          "Job profitability analysis",
          "Invoice & receivables tracking",
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
          "For growing service businesses that need full visibility across jobs, cash, and team performance.",
        points: [
          "Up to 3 locations \u00b7 unlimited sources",
          "Daily snapshots + Weekly Brief",
          "Crew & job profitability tracking",
          "Staffing demand estimates",
          "Customer deposit recommendations",
          "Exception-based SMS alerts",
          "Priority support",
        ],
        ctaLabel: "Start Free Trial",
        featured: true,
        featuredLabel: "Most Popular",
      },
      {
        name: "Multi-Location / Franchise",
        price: "Custom",
        priceSuffix: "",
        description:
          "For groups, franchises, and operators running 4+ locations who need consolidated intelligence and cross-site benchmarking.",
        points: [
          "Unlimited locations",
          "Cross-location benchmarking",
          "Custom connectors for legacy systems",
          "Dedicated onboarding specialist",
          "White-label available",
          "SLA-backed support",
        ],
        ctaLabel: "Contact Sales",
      },
    ],
  },
  cta: {
    title: "Start knowing your numbers this week.",
    description:
      "Connect your first data source in under 10 minutes. Your first Cash & Margin Brief arrives Monday. No credit card required.",
    primaryAction: "Start Free — No Card Needed",
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
