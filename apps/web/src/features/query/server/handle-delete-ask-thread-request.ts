import { z } from "zod";

import { type SavedQuestionRepository } from "@/features/query/repositories/saved-question-repository";

const deleteThreadSearchParamsSchema = z.object({
  orgId: z.string().min(1),
});

type DeleteAskThreadDependencies = Readonly<{
  savedQuestionRepository: SavedQuestionRepository;
}>;

export async function handleDeleteAskThreadRequest(
  request: Request,
  dependencies: DeleteAskThreadDependencies,
) {
  const url = new URL(request.url);
  const parsedSearchParams = deleteThreadSearchParamsSchema.safeParse({
    orgId: url.searchParams.get("orgId"),
  });

  if (!parsedSearchParams.success) {
    return Response.json({ error: "Missing orgId query parameter." }, { status: 400 });
  }

  const threadId = extractThreadIdFromPath(url.pathname);

  if (threadId === null) {
    return Response.json({ error: "Missing threadId path parameter." }, { status: 400 });
  }

  const existing = await dependencies.savedQuestionRepository.getById(threadId);

  if (existing === null || existing.orgId !== parsedSearchParams.data.orgId) {
    return Response.json({ error: "Thread not found." }, { status: 404 });
  }

  await dependencies.savedQuestionRepository.deleteById(threadId);

  return new Response(null, { status: 204 });
}

function extractThreadIdFromPath(pathname: string): string | null {
  const segments = pathname.split("/");
  const threadId = segments[segments.length - 1];

  return threadId && threadId.length > 0 ? threadId : null;
}
