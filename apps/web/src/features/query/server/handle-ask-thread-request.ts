import { z } from "zod";

import { type SavedQuestionRepository } from "@/features/query/repositories/saved-question-repository";

const askThreadSearchParamsSchema = z.object({
  orgId: z.string().min(1),
});

type AskThreadDependencies = Readonly<{
  savedQuestionRepository: SavedQuestionRepository;
}>;

export async function handleAskThreadRequest(
  request: Request,
  dependencies: AskThreadDependencies,
) {
  const url = new URL(request.url);
  const parsedSearchParams = askThreadSearchParamsSchema.safeParse({
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

  const threadId = extractThreadIdFromRequest(url.pathname);

  if (threadId === null) {
    return Response.json(
      {
        error: "Missing threadId path parameter.",
      },
      { status: 400 },
    );
  }

  const savedQuestion = await dependencies.savedQuestionRepository.getById(threadId);

  if (savedQuestion === null || savedQuestion.orgId !== parsedSearchParams.data.orgId) {
    return Response.json(
      {
        error: "Thread not found.",
      },
      { status: 404 },
    );
  }

  return Response.json(
    {
      orgId: parsedSearchParams.data.orgId,
      thread: {
        createdAt: savedQuestion.createdAt,
        id: savedQuestion.id,
        needsClarification: savedQuestion.queryPlan.needsClarification,
        question: savedQuestion.question,
        queryPlan: savedQuestion.queryPlan,
      },
    },
    { status: 200 },
  );
}

function extractThreadIdFromRequest(pathname: string) {
  const pathSegments = pathname.split("/").filter(Boolean);
  const threadId = pathSegments.at(-1);
  const threadsSegment = pathSegments.at(-2);
  const askSegment = pathSegments.at(-3);
  const apiSegment = pathSegments.at(-4);

  if (
    apiSegment !== "api" ||
    askSegment !== "ask" ||
    threadsSegment !== "threads" ||
    threadId === undefined
  ) {
    return null;
  }

  return threadId;
}
