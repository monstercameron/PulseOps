/**
 * Seeded demo conversations shown on first load of the Ask surface.
 * Each entry pairs a sidebar history item with a full message exchange
 * (including widgets) so the UI renders rich content without making API calls.
 *
 * To add more seed threads: extend SEED_HISTORY and SEED_THREAD_MESSAGES with
 * matching ids. To remove seeds: clear both arrays.
 */

import { type AskWidget } from "@/features/ask/lib/ask-widget-types";

// ─── Shared type (mirrors the local AskMessage shape in ask-page.tsx) ─────────

export type SeedMessage = Readonly<{
  citations: readonly string[];
  clarificationQuestions: readonly string[];
  id: string;
  role: "assistant" | "user";
  text: string;
  widget?: AskWidget | null;
}>;

// ─── Thread 1: Overdue invoices & cash exposure ───────────────────────────────

const THREAD_1_ID = "seed-thread-overdue-invoices";

const thread1Messages: readonly SeedMessage[] = [
  {
    citations: [],
    clarificationQuestions: [],
    id: "seed-t1-u1",
    role: "user",
    text: "Which invoices are overdue and what's the total cash exposure?",
  },
  {
    citations: [
      "inv_2024_0042 · invoice.amount.outstanding $8,450",
      "inv_2024_0039 · invoice.payment_days_late 47",
      "inv_2024_0051 · invoice.amount.outstanding $3,200",
    ],
    clarificationQuestions: [],
    id: "seed-t1-a1",
    role: "assistant",
    text: "You have 6 overdue invoices totalling $24,180 in outstanding receivables. Three accounts are significantly past 30 days and flagged as high-risk. The oldest is 47 days late.",
    widget: {
      type: "metric-grid",
      metrics: [
        { label: "Total Outstanding", tone: "negative", value: "$24,180" },
        { label: "Overdue Count", tone: "negative", value: "6" },
        { label: "Avg Days Late", tone: "warning", value: "28d" },
        { label: "Oldest Invoice", tone: "negative", value: "47d" },
      ],
      title: "Receivables snapshot",
    },
  },
  {
    citations: [],
    clarificationQuestions: [],
    id: "seed-t1-u2",
    role: "user",
    text: "Which customers owe more than $5,000?",
  },
  {
    citations: [
      "inv_2024_0042 · customer Northgate Properties",
      "inv_2024_0039 · customer Riverfront Commercial",
      "inv_2024_0044 · customer Summit Retail Group",
    ],
    clarificationQuestions: [],
    id: "seed-t1-a2",
    role: "assistant",
    text: "Three customers have balances above $5,000. Northgate Properties is the largest exposure at $8,450 and is 31 days overdue. Riverfront Commercial has been in arrears for 47 days.",
    widget: {
      type: "data-table",
      columns: [
        { key: "customer", label: "Customer", sortable: true },
        { key: "invoice", label: "Invoice" },
        { key: "outstanding", label: "Outstanding", numeric: true, sortable: true },
        { key: "daysLate", label: "Days Late", numeric: true, sortable: true },
        { key: "dueDate", label: "Due Date" },
      ],
      rows: [
        { customer: "Northgate Properties", daysLate: 31, dueDate: "Mar 9, 2026", invoice: "INV-2024-0042", outstanding: "$8,450" },
        { customer: "Riverfront Commercial", daysLate: 47, dueDate: "Feb 21, 2026", invoice: "INV-2024-0039", outstanding: "$7,320" },
        { customer: "Summit Retail Group", daysLate: 14, dueDate: "Mar 26, 2026", invoice: "INV-2024-0044", outstanding: "$5,910" },
      ],
      title: "High-balance overdue accounts",
      totalCount: 3,
    },
  },
  {
    citations: [],
    clarificationQuestions: [],
    id: "seed-t1-u3",
    role: "user",
    text: "Flag the critical accounts so I can prioritise collection calls.",
  },
  {
    citations: [
      "inv_2024_0039 · invoice.payment_days_late 47",
      "inv_2024_0042 · invoice.payment_days_late 31",
      "inv_2024_0044 · invoice.payment_days_late 14",
      "inv_2024_0051 · invoice.amount.outstanding $3,200",
    ],
    clarificationQuestions: [],
    id: "seed-t1-a3",
    role: "assistant",
    text: "Two accounts are critical and should be contacted today. Riverfront Commercial is past 45 days with no payment activity on record. Northgate Properties crossed 30 days this week. Summit Retail is approaching the 30-day threshold and should be pre-emptively contacted.",
    widget: {
      type: "alert-list",
      alerts: [
        {
          description: "INV-2024-0039 · No payment activity recorded · Call: Mark Ellison (604) 555-0182",
          severity: "critical",
          title: "Riverfront Commercial — 47 days overdue",
          value: "$7,320",
        },
        {
          description: "INV-2024-0042 · Crossed 30-day threshold this week · Call: Sandra Park (778) 555-0341",
          severity: "critical",
          title: "Northgate Properties — 31 days overdue",
          value: "$8,450",
        },
        {
          description: "INV-2024-0044 · Approaching 30-day threshold · Send reminder email",
          severity: "warning",
          title: "Summit Retail Group — 14 days overdue",
          value: "$5,910",
        },
        {
          description: "INV-2024-0051 · Recently issued, monitor next week",
          severity: "info",
          title: "Bayside Contractors — 6 days overdue",
          value: "$3,200",
        },
      ],
      title: "Collection priority order",
    },
  },
];

// ─── Thread 2: Job margin performance & scheduling ────────────────────────────

const THREAD_2_ID = "seed-thread-job-margins";

const thread2Messages: readonly SeedMessage[] = [
  {
    citations: [],
    clarificationQuestions: [],
    id: "seed-t2-u1",
    role: "user",
    text: "How are our job margins performing this quarter?",
  },
  {
    citations: [
      "job_q1_2026_001 · job.margin.gross 34.2",
      "job_q1_2026_002 · job.margin.gross 8.1",
      "job_q1_2026_003 · job.margin.gross 41.7",
    ],
    clarificationQuestions: [],
    id: "seed-t2-a1",
    role: "assistant",
    text: "Q1 2026 margin performance is mixed. Overall gross margin is 24.3%, below the 30% target. Two jobs are pulling the average down significantly — one is running at 8.1% which is effectively break-even once overhead is factored in. Three jobs are above 35% which is healthy.",
    widget: {
      type: "metric-grid",
      metrics: [
        { label: "Avg Gross Margin", tone: "warning", trendLabel: "Target: 30%", value: "24.3%" },
        { label: "Jobs Above Target", tone: "positive", value: "3 / 8" },
        { label: "Lowest Margin", tone: "negative", trendLabel: "Riverbrook HVAC", value: "8.1%" },
        { label: "Highest Margin", tone: "positive", trendLabel: "Meridian Office Fit-out", value: "41.7%" },
        { label: "Total Job Revenue", tone: "neutral", value: "$318,400" },
        { label: "Total Labor Cost", tone: "neutral", value: "$124,900" },
      ],
      title: "Q1 2026 job margin summary",
    },
  },
  {
    citations: [],
    clarificationQuestions: [],
    id: "seed-t2-u2",
    role: "user",
    text: "Rank the jobs from most to least profitable.",
  },
  {
    citations: [
      "job_q1_2026_003 · job.margin.gross 41.7",
      "job_q1_2026_005 · job.margin.gross 38.4",
      "job_q1_2026_001 · job.margin.gross 34.2",
    ],
    clarificationQuestions: [],
    id: "seed-t2-a2",
    role: "assistant",
    text: "Here are all 8 Q1 jobs ranked by gross margin. The top 3 are commercial fit-outs which tend to have lower material variability. The bottom 2 are residential HVAC installs where material overruns eroded margin.",
    widget: {
      type: "ranking-list",
      items: [
        { description: "Commercial fit-out · 14 days", label: "Meridian Office Fit-out", rank: 1, tone: "positive", value: "41.7%" },
        { description: "Commercial lighting · 9 days", label: "Pinnacle Retail — Phase 2", rank: 2, tone: "positive", value: "38.4%" },
        { description: "Residential reno · 22 days", label: "Harwood St Renovation", rank: 3, tone: "positive", value: "34.2%" },
        { description: "Commercial HVAC · 18 days", label: "Clearwater Office Park", rank: 4, tone: "neutral", value: "28.9%" },
        { description: "Residential electrical · 11 days", label: "Dunbar Ave Rewire", rank: 5, tone: "neutral", value: "22.1%" },
        { description: "Multi-unit plumbing · 31 days", label: "Eastview Condos — Plumbing", rank: 6, tone: "neutral", value: "19.5%" },
        { description: "Residential HVAC · 16 days", label: "Birchwood HVAC Install", rank: 7, tone: "warning", value: "12.3%" },
        { description: "Residential HVAC · 28 days (material overrun)", label: "Riverbrook HVAC Replacement", rank: 8, tone: "negative", value: "8.1%" },
      ],
      title: "Jobs ranked by gross margin — Q1 2026",
    },
  },
  {
    citations: [],
    clarificationQuestions: [],
    id: "seed-t2-u3",
    role: "user",
    text: "Give me the full details on the Meridian Office Fit-out.",
  },
  {
    citations: ["job_q1_2026_003 · job.revenue.actual 58400", "job_q1_2026_003 · job.margin.gross 41.7"],
    clarificationQuestions: [],
    id: "seed-t2-a3",
    role: "assistant",
    text: "Meridian Office Fit-out is the best-performing job this quarter. It closed on time and under the labor budget by 6%. The client is a repeat commercial tenant with a second phase estimated for Q2.",
    widget: {
      type: "business-card",
      fields: [
        { label: "Actual Revenue", value: "$58,400" },
        { label: "Labor Cost", value: "$18,200" },
        { label: "Material Cost", value: "$15,800" },
        { label: "Gross Margin", value: "41.7%" },
        { label: "Duration", value: "14 days" },
        { label: "Status", value: "Closed — complete" },
        { label: "Client contact", value: "Alicia Moreno, Meridian Holdings" },
      ],
      name: "Meridian Office Fit-out",
      subtitle: "Commercial fit-out · Q1 2026",
      tags: ["commercial", "repeat-client", "on-budget"],
    },
  },
  {
    citations: [],
    clarificationQuestions: [],
    id: "seed-t2-u4",
    role: "user",
    text: "What work orders are scheduled for the next two weeks?",
  },
  {
    citations: [
      "wo_2026_041 · work_order.scheduled_at 2026-04-11",
      "wo_2026_044 · work_order.scheduled_at 2026-04-14",
      "wo_2026_047 · work_order.scheduled_at 2026-04-16",
      "wo_2026_052 · work_order.scheduled_at 2026-04-22",
    ],
    clarificationQuestions: [],
    id: "seed-t2-a4",
    role: "assistant",
    text: "Four work orders are scheduled in the next two weeks. Two are new commercial starts and two are returning residential service visits. The Apr 16 job at Eastview is the largest by estimated hours.",
    widget: {
      type: "timeline",
      events: [
        {
          date: "Apr 11, 2026",
          description: "WO-041 · Pinnacle Retail Phase 3 prep · 6h est.",
          label: "Pinnacle Retail — site prep",
          tone: "neutral",
        },
        {
          date: "Apr 14, 2026",
          description: "WO-044 · Dunbar Ave annual service · 3h est.",
          label: "Dunbar Ave — HVAC service",
          tone: "neutral",
        },
        {
          date: "Apr 16, 2026",
          description: "WO-047 · Eastview Condos plumbing Phase 2 · 18h est.",
          label: "Eastview Condos — plumbing Phase 2",
          tone: "warning",
        },
        {
          date: "Apr 22, 2026",
          description: "WO-052 · Birchwood warranty callback · 2h est.",
          label: "Birchwood — warranty callback",
          tone: "neutral",
        },
      ],
      title: "Upcoming work orders",
    },
  },
];

// ─── Exports ──────────────────────────────────────────────────────────────────

export const SEED_HISTORY = [
  {
    createdAt: "2026-04-09T07:14:00.000Z",
    id: THREAD_1_ID,
    needsClarification: false,
    question: "Which invoices are overdue and what's the total cash exposure?",
    retrievalMode: "facts" as const,
  },
  {
    createdAt: "2026-04-09T08:02:00.000Z",
    id: THREAD_2_ID,
    needsClarification: false,
    question: "How are our job margins performing this quarter?",
    retrievalMode: "hybrid" as const,
  },
] satisfies Array<{
  createdAt: string;
  id: string;
  needsClarification: boolean;
  question: string;
  retrievalMode: "clarify" | "facts" | "hybrid" | "vectors";
}>;

export const SEED_THREAD_MESSAGES: Record<string, readonly SeedMessage[]> = {
  [THREAD_1_ID]: thread1Messages,
  [THREAD_2_ID]: thread2Messages,
};

/** The thread id to show on first load (before the user clicks anything). */
export const SEED_DEFAULT_THREAD_ID = THREAD_1_ID;
