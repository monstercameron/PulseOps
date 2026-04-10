import { z } from "zod";

import { type SavedQuestionRepository } from "@/features/query/repositories/saved-question-repository";

const askHistorySearchParamsSchema = z.object({
  orgId: z.string().min(1),
});

type AskHistoryDependencies = {
  savedQuestionRepository: SavedQuestionRepository;
};

export type AskHistoryThread = Readonly<{
  createdAt: string;
  id: string;
  needsClarification: boolean;
  question: string;
  retrievalMode: "clarify" | "facts" | "hybrid" | "vectors";
}>;

export async function handleAskHistoryRequest(
  request: Request,
  dependencies: AskHistoryDependencies,
): Promise<Response> {
  const url = new URL(request.url);
  const parsedSearchParams = askHistorySearchParamsSchema.safeParse({
    orgId: url.searchParams.get("orgId"),
  });

  if (!parsedSearchParams.success) {
    return Response.json(
      {
        error: "Missing orgId query parameter.",
      },
      { status: 400 },
    );
  }

  const threads = await listAskHistoryThreads({
    orgId: parsedSearchParams.data.orgId,
    savedQuestionRepository: dependencies.savedQuestionRepository,
  });

  return Response.json({
    orgId: parsedSearchParams.data.orgId,
    threads,
  });
}

type ListAskHistoryThreadsInput = {
  orgId: string;
  savedQuestionRepository: SavedQuestionRepository;
};

export async function listAskHistoryThreads({
  orgId,
  savedQuestionRepository,
}: ListAskHistoryThreadsInput): Promise<AskHistoryThread[]> {
  const savedQuestions = await savedQuestionRepository.listByOrgId(orgId);

  return savedQuestions
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((savedQuestion) => ({
      createdAt: savedQuestion.createdAt,
      id: savedQuestion.id,
      needsClarification: savedQuestion.queryPlan.needsClarification,
      question: savedQuestion.question,
      retrievalMode: savedQuestion.queryPlan.retrievalMode,
    }));
}
