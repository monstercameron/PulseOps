import type { BlogPost } from "@/features/blog/domain/blog-post";

/**
 * Seed posts loaded into the in-memory store on server start.
 * Edit this file to change the default content available in development/prototype environments.
 */
export const BLOG_SEED_POSTS: BlogPost[] = [
  {
    id: "seed-1",
    slug: "cash-flow-mistakes-field-service",
    title: "The 5 Cash Flow Mistakes Field Service Businesses Make Every Week",
    summary:
      "Most field-service operators work hard and still feel cash-poor. Here's why — and what to fix first.",
    body: `Running a field-service business means your revenue is real but your cash often isn't. Invoices sit unpaid, jobs run over budget, and payroll hits before receivables land.\n\nHere are the five mistakes we see repeated most often:\n\n1. **Invoicing too late.** Jobs close, work crews move on, and the paperwork sits. Every day between job completion and invoice sent is a day of free financing for your customer.\n\n2. **Underpricing repeat service.** Maintenance contracts look good on recurring revenue metrics but often hide negative margins once you account for travel time and callbacks.\n\n3. **No deposit on large jobs.** A $12,000 equipment replacement represents real cash risk. Getting 30–40% upfront isn't aggressive — it's standard practice in every healthy service business.\n\n4. **Chasing the wrong receivables.** Not all overdue invoices are equal. Focus on the three accounts with the most dollars outstanding, not the longest list.\n\n5. **Reviewing financials too infrequently.** Monthly P&L reviews miss weekly cash patterns. The problems compound in silence.`,
    author: "PulseOps Team",
    status: "published",
    publishedAt: "2026-04-01T09:00:00Z",
    createdAt: "2026-04-01T09:00:00Z",
    updatedAt: "2026-04-01T09:00:00Z",
  },
  {
    id: "seed-2",
    slug: "job-costing-hvac",
    title: "Why HVAC Businesses Lose Margin on Their Best-Selling Service",
    summary:
      "The service call that drives the most volume is often not the most profitable. Here's how to find out.",
    body: `High-volume services feel like wins. The schedule is full, the trucks are moving, and revenue looks healthy. But volume can mask serious margin problems.\n\nThe most common pattern we see: a high-volume maintenance service that absorbs more labor hours than the estimate assumed. Over dozens of calls, this gap between quoted and actual hours silently erodes margin.\n\nThe fix starts with job-level costing — not department-level, not monthly averages. You need to know: for this specific service type, what did labor actually cost versus what we priced in?\n\nOnce you see the pattern, the corrective actions are usually straightforward: adjust the pricing model, set tighter crew time expectations, or identify which technicians are running over and why.\n\nThe key is seeing it early enough to act before the quarter is over.`,
    author: "PulseOps Team",
    status: "published",
    publishedAt: "2026-04-05T09:00:00Z",
    createdAt: "2026-04-05T09:00:00Z",
    updatedAt: "2026-04-05T09:00:00Z",
  },
  {
    id: "seed-3",
    slug: "pricing-strategy-field-service",
    title: "How to Price Field Service Jobs So You Actually Make Money",
    summary:
      "Most service businesses guess on pricing. Here's a data-driven method to find your real floor — and how to raise rates without losing customers.",
    body: `Pricing is the highest-leverage decision in a field service business. A 5% price increase on your top service type — with zero change to volume — drops straight to the bottom line. But most operators still price by gut feel, competitor mimicry, or "what the market will bear."

Here's how to build a pricing model on actual numbers.

## Step 1: Know Your Real Cost Per Job

Before you can price correctly, you need your true cost — not the estimate, the *actual* average.

The three components most businesses undercount:

- **Burden rate on labor.** Your technician's hourly cost isn't their wage. Add payroll taxes, benefits, workers' comp, and vehicle costs. For most service businesses, the burden multiplier is **1.25–1.45×** the base wage.
- **Drive time.** If a tech spends 40 minutes travelling to a job, that time has a cost. Many businesses price as if every hour of the day is billable. It isn't.
- **Callback rate.** If 1 in 8 maintenance jobs requires a return visit, that callback is a real cost of the original job. Your pricing needs to absorb it.

![Gross Margin by Service Type](/uploads/blog/pricing-margin-chart.svg)

> **What this chart shows:** Maintenance and Inspection — two of the highest-volume service types — are also the lowest-margin. Most businesses don't know this because they don't track margin at the service-type level.

---

## Step 2: Set Your Floor, Then Your Target

Once you know your real cost per job, you have a **floor** — the price below which you lose money on every job.

Your floor is not your price. It's the number that makes every job below it a bad decision.

| Service Type | Avg. Real Cost | Current Price | Floor | Margin |
|---|---|---|---|---|
| AC Installation | $1,840 | $3,600 | $2,205 | 48.9% |
| Annual Maintenance | $195 | $249 | $234 | 1.0% |
| Emergency Call-Out | $310 | $595 | $372 | 47.9% |
| Duct Cleaning | $420 | $649 | $504 | 35.3% |

The maintenance line in this example is a problem. At a $15 margin per visit, one callback erases four jobs worth of profit.

### Setting a Target Margin

A healthy field service business runs **35–50% gross margin** on labor and materials, before overhead. If you're below that, you have three levers:

1. Raise the price
2. Reduce the real cost (faster jobs, less drive time, fewer callbacks)
3. Retire the service type from your active menu

---

## Step 3: Raise Rates Without Losing Customers

The fear of customer churn is the #1 reason operators undercharge. Here's what the data actually shows:

- **Price-sensitive customers churn anyway.** They're shopping on price regardless. Keeping them at a low rate just delays the inevitable while they drag down your margin.
- **Relationship customers absorb reasonable increases.** A 10–15% increase on a service they trust, delivered with a short honest explanation, has a very low churn rate.
- **The best time to raise rates is on renewal.** New contract terms don't feel like a price increase — they feel like a new agreement.

![Cash Position Impact of Pricing Changes](/uploads/blog/cash-position-chart.svg)

*The chart above shows a real pattern: businesses that implement pricing changes in Q1 see measurable cash position improvement by Q2, because the margin improvement compounds across every job.*

---

## The One Number to Track

If you take nothing else from this article: **calculate and track your gross margin by service type, every month.**

Not total revenue. Not total labor hours. Gross margin by service type.

That single number will tell you:

- Which services to grow
- Which to reprice
- Which to retire

\`\`\`
Gross Margin % = (Revenue − Direct Labor − Direct Materials) ÷ Revenue
\`\`\`

Most accounting software can produce this. Most operators never look at it broken down this way.

Start there.`,
    author: "PulseOps Team",
    status: "published",
    publishedAt: "2026-04-09T09:00:00Z",
    createdAt: "2026-04-09T09:00:00Z",
    updatedAt: "2026-04-09T09:00:00Z",
  },
  {
    id: "seed-4",
    slug: "ai-for-small-business-ops",
    title: "What AI Actually Looks Like for a 12-Person Service Business",
    summary:
      "Not dashboards, not chatbots — a weekly brief that answers the questions you already care about.",
    body: `Most small business owners don't need another dashboard. They need answers.\n\nThe promise of AI for small business has been oversold as a universal answer machine. The reality is narrower and more useful: AI is best at finding patterns in your specific operational data and surfacing the ones that matter this week.\n\nFor a 12-person HVAC company, that looks like: here are your three most at-risk receivables, here's the job type where your labor cost is outpacing your price, here's where cash gets tight before your next major payable.\n\nIt's not magic. It's the analysis your bookkeeper would flag if they were reviewing your data every day — made fast enough to act on before the problem compounds.\n\nThe right product for this doesn't require an AI strategy. It just requires uploading the files you already have.`,
    author: "PulseOps Team",
    status: "draft",
    publishedAt: null,
    createdAt: "2026-04-08T09:00:00Z",
    updatedAt: "2026-04-08T09:00:00Z",
  },
];
