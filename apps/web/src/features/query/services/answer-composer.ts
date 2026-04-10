import { type FactVectorRetrievalResult } from "@/features/query/services/fact-vector-retrieval";
import { type QueryPlan } from "@/features/query/domain/query-plan";
import { buildClarificationQuestions } from "@/features/query/services/clarification-questions";
import { citationSchema } from "@/features/trust/domain/citation";

export type DatasetAnswer = {
  answerText: string;
  citations: ReturnType<typeof citationSchema.array>["_output"];
  clarificationQuestions: string[];
  status: "answered" | "needs-clarification";
};

export function composeDatasetAnswer(
  plan: QueryPlan,
  retrieval: FactVectorRetrievalResult,
): DatasetAnswer {
  if (plan.needsClarification) {
    return {
      answerText: "I need a bit more context before I can answer safely.",
      citations: [],
      clarificationQuestions: buildClarificationQuestions(plan),
      status: "needs-clarification",
    };
  }

  const factLines = retrieval.facts.map(
    (fact) => `${fact.factTypeId}: ${formatValue(fact.value)}`,
  );
  const chunkLines = retrieval.chunks.map((chunk) => chunk.content);
  const citations = [
    ...retrieval.facts.flatMap((fact) => fact.citations),
    ...retrieval.chunks.flatMap((chunk) => chunk.citations),
  ];

  return {
    answerText: [...factLines, ...chunkLines].join("\n"),
    citations,
    clarificationQuestions: [],
    status: "answered",
  };
}

function formatValue(
  value: FactVectorRetrievalResult["facts"][number]["value"],
) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value === null) {
    return "null";
  }

  return String(value);
}
