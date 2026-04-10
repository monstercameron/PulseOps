"use client";

import { useState } from "react";

type InboxRole = "owner" | "operator" | "analyst";

type RecommendationItem = {
  citations: string[];
  confidenceScore: number;
  estimatedValue: string;
  id: string;
  impactSummary: string;
  priority: "critical" | "high" | "medium";
  roleSummary: Record<InboxRole, string>;
  title: string;
};

type ReviewItem = {
  assignedTo: InboxRole;
  detail: string;
  dueLabel: string;
  id: string;
  severity: "high" | "medium";
  title: string;
};

const roleMeta: Record<
  InboxRole,
  {
    badge: string;
    description: string;
    heading: string;
  }
> = {
  owner: {
    badge: "Value view",
    description: "Focus on value at risk, approvals, and expected cash impact.",
    heading: "Owner view",
  },
  operator: {
    badge: "Execution view",
    description: "Focus on what must be approved, routed, or corrected today.",
    heading: "Operator view",
  },
  analyst: {
    badge: "Review view",
    description: "Focus on citation quality, ambiguous fields, and edit suggestions.",
    heading: "Analyst view",
  },
};

const recommendationTone = {
  critical: {
    accent: "#dc2626",
    background: "#fef2f2",
    border: "#fecaca",
  },
  high: {
    accent: "#b45309",
    background: "#fffbeb",
    border: "#fde68a",
  },
  medium: {
    accent: "#1d4ed8",
    background: "#eff6ff",
    border: "#bfdbfe",
  },
} as const;

const recommendations: RecommendationItem[] = [
  {
    citations: ["AR aging row 14", "Invoice INV-1032", "Margin mart week 15"],
    confidenceScore: 0.94,
    estimatedValue: "$8,600",
    id: "rec_001",
    impactSummary: "Top overdue accounts now represent 19% of open receivables.",
    priority: "critical",
    roleSummary: {
      analyst: "Evidence is strong. One customer alias may need normalization.",
      operator: "Call the top 3 customers today and escalate invoices past 45 days.",
      owner: "Fastest path to improve next-week cash by roughly $8.6k.",
    },
    title: "Collect three overdue invoices before Friday",
  },
  {
    citations: ["Job cost report 4821", "ServiceTitan labor export", "Vendor bill VB-2209"],
    confidenceScore: 0.88,
    estimatedValue: "$3,100",
    id: "rec_002",
    impactSummary: "Two jobs are trending below target gross margin after parts overruns.",
    priority: "high",
    roleSummary: {
      analyst: "Part cost anomaly is confirmed. One labor record still needs source validation.",
      operator: "Review price-book exceptions on jobs 4821 and 4827 before dispatch closes.",
      owner: "Likely recoverable margin this week if quotes are corrected now.",
    },
    title: "Review underpriced work orders before dispatch closes",
  },
  {
    citations: ["Vendor bills week 15", "Bank transactions Apr 7-9", "Cash forecast mart"],
    confidenceScore: 0.83,
    estimatedValue: "$2,400",
    id: "rec_003",
    impactSummary: "Shifting one vendor payment would preserve cash without missing terms.",
    priority: "medium",
    roleSummary: {
      analyst: "Payment timing recommendation is valid but depends on one bill-date extraction.",
      operator: "Push the Acme Supply payment by 4 days and confirm no early-pay discount is lost.",
      owner: "Small but low-risk cash relief this week.",
    },
    title: "Adjust vendor payment timing for Acme Supply",
  },
];

const reviewQueue: ReviewItem[] = [
  {
    assignedTo: "analyst",
    detail: "Three invoices share the same totals but use different vendor legal names.",
    dueLabel: "Due in 45 min",
    id: "review_001",
    severity: "high",
    title: "Resolve vendor identity conflict before facts are merged",
  },
  {
    assignedTo: "analyst",
    detail: "A scanned PDF needs confirmation that service date, not invoice date, is the event date.",
    dueLabel: "Due this afternoon",
    id: "review_002",
    severity: "medium",
    title: "Confirm event date for field invoice packet",
  },
  {
    assignedTo: "operator",
    detail: "Two recommendations were edited by the analyst and need operator approval to ship.",
    dueLabel: "Waiting now",
    id: "review_003",
    severity: "high",
    title: "Approve analyst-edited brief items",
  },
];

function PriorityBadge({ priority }: { priority: RecommendationItem["priority"] }) {
  const tone = recommendationTone[priority];

  return (
    <span
      className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
      style={{ background: tone.background, color: tone.accent }}
    >
      {priority}
    </span>
  );
}

function RecommendationCard({
  item,
  onDecision,
  role,
  stateLabel,
}: {
  item: RecommendationItem;
  onDecision: (recommendationId: string, decision: string) => void;
  role: InboxRole;
  stateLabel?: string;
}) {
  const tone = recommendationTone[item.priority];

  return (
    <article
      className="rounded-2xl border bg-white p-4 shadow-[0_1px_4px_rgba(20,34,53,0.06)]"
      style={{ borderColor: tone.border }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={item.priority} />
            <span className="text-[12px] font-semibold text-muted">
              {item.estimatedValue} estimated value
            </span>
            <span className="text-[12px] font-semibold text-muted">
              {Math.round(item.confidenceScore * 100)}% confidence
            </span>
          </div>
          <h2 className="mt-2 text-[18px] font-semibold tracking-tight text-foreground">
            {item.title}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            {item.impactSummary}
          </p>
          <p className="mt-2 text-[13px] font-medium text-foreground">
            {item.roleSummary[role]}
          </p>
        </div>
        {stateLabel !== undefined ? (
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
            style={{ background: "#123d2f", color: "#f3efe6" }}
          >
            {stateLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {item.citations.map((citation) => (
          <span
            key={`${item.id}-${citation}`}
            className="rounded-full border border-[rgba(20,34,53,0.1)] px-2.5 py-1 text-[11px] font-semibold text-foreground/70"
          >
            {citation}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onDecision(item.id, "accepted")}
          className="rounded-lg bg-[#123d2f] px-3.5 py-2 text-[12.5px] font-semibold text-[#f3efe6] transition-colors hover:bg-[#0d3025]"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => onDecision(item.id, "rejected")}
          className="rounded-lg border border-[rgba(20,34,53,0.12)] px-3.5 py-2 text-[12.5px] font-semibold text-foreground transition-colors hover:bg-[rgba(20,34,53,0.04)]"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={() => onDecision(item.id, "edited")}
          className="rounded-lg border border-[rgba(17,181,138,0.25)] bg-[rgba(17,181,138,0.08)] px-3.5 py-2 text-[12.5px] font-semibold text-[#0d7a5f] transition-colors hover:bg-[rgba(17,181,138,0.14)]"
        >
          Edit
        </button>
      </div>
    </article>
  );
}

function ReviewQueueCard({
  item,
  role,
}: {
  item: ReviewItem;
  role: InboxRole;
}) {
  const isAssignedToCurrentRole = item.assignedTo === role;

  return (
    <div className="rounded-2xl border border-[rgba(20,34,53,0.08)] bg-white p-4 shadow-[0_1px_4px_rgba(20,34,53,0.05)]">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
          style={
            item.severity === "high"
              ? { background: "#fef2f2", color: "#dc2626" }
              : { background: "#fffbeb", color: "#b45309" }
          }
        >
          {item.severity}
        </span>
        <span className="text-[12px] font-semibold text-muted">
          {isAssignedToCurrentRole ? "Assigned to this view" : `Assigned to ${item.assignedTo}`}
        </span>
      </div>
      <h3 className="mt-2 text-[15px] font-semibold text-foreground">
        {item.title}
      </h3>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        {item.detail}
      </p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[12px] font-semibold text-foreground">
          {item.dueLabel}
        </span>
        <button
          type="button"
          className="rounded-lg border border-[rgba(20,34,53,0.12)] px-3 py-1.5 text-[12px] font-semibold text-foreground transition-colors hover:bg-[rgba(20,34,53,0.04)]"
        >
          Open review
        </button>
      </div>
    </div>
  );
}

export function DecisionInboxPage() {
  const [role, setRole] = useState<InboxRole>("operator");
  const [decisionState, setDecisionState] = useState<Record<string, string>>({});
  const visibleReviewItems = reviewQueue.filter(
    (item) => item.assignedTo === role || role === "owner",
  );
  const summary = roleMeta[role];

  return (
    <div className="flex min-h-full flex-col">
      <div className="sticky top-0 z-10 border-b border-[rgba(20,34,53,0.07)] bg-[rgba(245,247,251,0.94)] px-5 py-4 backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted">
              Decision inbox
            </p>
            <h1 className="mt-1 text-[24px] font-semibold tracking-tight text-foreground">
              Weekly cash and margin actions
            </h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted">
              Mobile-friendly brief review, role-aware action queues, and analyst review controls in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["owner", "operator", "analyst"] as const).map((candidate) => (
              <button
                key={candidate}
                type="button"
                onClick={() => setRole(candidate)}
                className="rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors"
                style={
                  role === candidate
                    ? { background: "#123d2f", color: "#f3efe6" }
                    : {
                        background: "rgba(20,34,53,0.06)",
                        color: "#142235",
                      }
                }
              >
                {roleMeta[candidate].heading}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 py-5">
        <div className="mb-5 rounded-2xl border border-[rgba(20,34,53,0.08)] bg-white p-4 shadow-[0_1px_4px_rgba(20,34,53,0.05)]">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted">
                {summary.badge}
              </p>
              <p className="mt-1 text-[15px] font-semibold text-foreground">
                {summary.heading}
              </p>
            </div>
            <p className="max-w-2xl text-[13px] leading-relaxed text-muted">
              {summary.description}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[13px] font-semibold uppercase tracking-widest text-muted">
                Recommendations
              </h2>
              <span className="text-[12px] font-semibold text-muted">
                {recommendations.length} live items
              </span>
            </div>

            {recommendations.map((item) => (
              <RecommendationCard
                key={item.id}
                item={item}
                onDecision={(recommendationId, decision) =>
                  setDecisionState((current) => ({
                    ...current,
                    [recommendationId]: decision,
                  }))
                }
                role={role}
                stateLabel={decisionState[item.id]}
              />
            ))}
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-[rgba(20,34,53,0.08)] bg-white p-4 shadow-[0_1px_4px_rgba(20,34,53,0.05)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[13px] font-semibold uppercase tracking-widest text-muted">
                  Analyst review console
                </h2>
                <span className="text-[12px] font-semibold text-muted">
                  {visibleReviewItems.length} active
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {visibleReviewItems.map((item) => (
                  <ReviewQueueCard key={item.id} item={item} role={role} />
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[rgba(20,34,53,0.08)] bg-white p-4 shadow-[0_1px_4px_rgba(20,34,53,0.05)]">
              <h2 className="text-[13px] font-semibold uppercase tracking-widest text-muted">
                Mobile inbox notes
              </h2>
              <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-muted">
                <li>Cards collapse to a single-column stack below tablet width.</li>
                <li>Action buttons wrap instead of truncating on narrow screens.</li>
                <li>Role switching keeps the queue focused for field operators on phones.</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
