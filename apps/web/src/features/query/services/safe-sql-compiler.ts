import { type QueryPlan } from "@/features/query/domain/query-plan";

export type CompiledSqlQuery = {
  params: Array<number | string | string[]>;
  text: string;
};

export function compileSafeFactSql(plan: QueryPlan): CompiledSqlQuery {
  if (plan.needsClarification || plan.retrievalMode === "clarify") {
    throw new Error("Cannot compile SQL for a clarification plan.");
  }

  if (plan.canonicalFactTypeIds.length === 0) {
    throw new Error("Cannot compile SQL without any canonical fact type ids.");
  }

  return {
    params: [plan.orgId, plan.canonicalFactTypeIds, plan.limit],
    text: [
      "select id, org_id, document_id, entity_id, entity_type, canonical_fact_type_id, value, confidence_score",
      "from canonical_facts",
      "where org_id = $1 and canonical_fact_type_id = any($2)",
      "order by confidence_score desc, id asc",
      "limit $3",
    ].join(" "),
  };
}
