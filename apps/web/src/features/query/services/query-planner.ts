import { type CanonicalEntityType } from "@/features/entities/domain/canonical-entity";
import { type CanonicalFactTypeId } from "@/features/foundation/domain/canonical-facts";
import {
  createQueryPlan,
  type QueryPlan,
} from "@/features/query/domain/query-plan";

const keywordMappings: {
  entityType: CanonicalEntityType;
  factTypeIds: CanonicalFactTypeId[];
  keywords: string[];
}[] = [
  {
    entityType: "invoice",
    factTypeIds: [
      "invoice.amount.outstanding",
      "invoice.due_at",
      "invoice.payment_days_late",
    ],
    keywords: ["invoice", "receivable", "overdue", "collect", "payment"],
  },
  {
    entityType: "vendor_bill",
    factTypeIds: ["vendor_bill.amount.total", "vendor_bill.due_at"],
    keywords: ["bill", "vendor", "payable", "supplier"],
  },
  {
    entityType: "job",
    factTypeIds: [
      "job.revenue.actual",
      "job.cost.labor",
      "job.cost.material",
      "job.margin.gross",
    ],
    keywords: ["job", "margin", "underpriced", "profit", "cost"],
  },
  {
    entityType: "estimate",
    factTypeIds: ["estimate.amount.total"],
    keywords: ["estimate", "quote", "deposit"],
  },
  {
    entityType: "bank_transaction",
    factTypeIds: ["bank_transaction.amount", "bank_transaction.posted_at"],
    keywords: ["cash", "bank", "transaction"],
  },
  {
    entityType: "work_order",
    factTypeIds: ["work_order.scheduled_at"],
    keywords: ["schedule", "work order", "visit"],
  },
];

export function planDatasetQuestion(
  question: string,
  orgId: string,
): QueryPlan {
  const normalizedQuestion = question.trim().toLowerCase();
  const matches = keywordMappings.filter(({ keywords }) =>
    keywords.some((keyword) => normalizedQuestion.includes(keyword)),
  );

  if (normalizedQuestion.length < 8 || matches.length === 0) {
    return createQueryPlan({
      canonicalFactTypeIds: [],
      entityTypes: [],
      limit: 5,
      needsClarification: true,
      orgId,
      question,
      rationale:
        "The question does not identify a clear business object or metric family.",
      retrievalMode: "clarify",
    });
  }

  const retrievalMode = /why|summari|explain|attention|risk/.test(
    normalizedQuestion,
  )
    ? "hybrid"
    : "facts";

  return createQueryPlan({
    canonicalFactTypeIds: Array.from(
      new Set(matches.flatMap((match) => match.factTypeIds)),
    ),
    entityTypes: Array.from(new Set(matches.map((match) => match.entityType))),
    limit: 5,
    needsClarification: false,
    orgId,
    question,
    rationale: `Matched business keywords for ${matches
      .map((match) => match.entityType)
      .join(", ")}.`,
    retrievalMode,
    vectorSearchText: retrievalMode === "hybrid" ? question : undefined,
  });
}
