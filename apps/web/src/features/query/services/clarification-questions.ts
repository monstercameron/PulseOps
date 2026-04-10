import { type QueryPlan } from "@/features/query/domain/query-plan";

export function buildClarificationQuestions(plan: QueryPlan): string[] {
  if (!plan.needsClarification) {
    return [];
  }

  return [
    "Are you asking about invoices, vendor bills, job margins, or cash movement?",
    "Do you want a numeric answer, a ranked list, or an explanation with evidence?",
    "Should I focus on a specific time period or the latest uploaded data?",
  ];
}
