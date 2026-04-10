import { randomUUID } from "node:crypto";
import type { BlogPost, CreateBlogPostInput, UpdateBlogPostInput } from "@/features/blog/domain/blog-post";

const seedPosts: BlogPost[] = [
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

// Module-level store — resets on server restart, fine for prototype.
const store = new Map<string, BlogPost>(seedPosts.map((p) => [p.id, p]));

export const blogRepository = {
  list(): readonly BlogPost[] {
    return Array.from(store.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  getById(id: string): BlogPost | null {
    return store.get(id) ?? null;
  },

  getBySlug(slug: string): BlogPost | null {
    for (const post of store.values()) {
      if (post.slug === slug) return post;
    }
    return null;
  },

  create(input: CreateBlogPostInput): BlogPost {
    const now = new Date().toISOString();
    const post: BlogPost = {
      id: randomUUID(),
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      body: input.body,
      author: input.author,
      status: input.status,
      publishedAt: input.status === "published" ? now : null,
      createdAt: now,
      updatedAt: now,
    };
    store.set(post.id, post);
    return post;
  },

  update(id: string, input: UpdateBlogPostInput): BlogPost | null {
    const existing = store.get(id);
    if (!existing) return null;
    const now = new Date().toISOString();
    const next: BlogPost = {
      ...existing,
      ...input,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: now,
      publishedAt:
        input.status === "published" && existing.status !== "published"
          ? now
          : input.status === "draft"
            ? null
            : existing.publishedAt,
    };
    store.set(id, next);
    return next;
  },

  delete(id: string): boolean {
    return store.delete(id);
  },
};
