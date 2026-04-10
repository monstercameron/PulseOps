import { z } from "zod";

import { type PackRepository } from "@/features/packs/repositories/pack-repository";
import { markPackReviewed } from "@/features/packs/server/pack-record-service";

const packReviewRequestSchema = z.object({
  orgId: z.string().min(1),
});

type PackReviewDependencies = Readonly<{
  now?: () => string;
  packRepository: PackRepository;
}>;

export async function handlePackReviewRequest(
  request: Request,
  dependencies: PackReviewDependencies,
) {
  const parsedBody = packReviewRequestSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return Response.json(
      {
        error: "Invalid pack review payload.",
      },
      { status: 400 },
    );
  }

  const packId = extractPackIdFromRequest(new URL(request.url).pathname);

  if (packId === null) {
    return Response.json(
      {
        error: "Missing packId path parameter.",
      },
      { status: 400 },
    );
  }

  const existingPack = await dependencies.packRepository.getById(packId);

  if (existingPack === null || existingPack.orgId !== parsedBody.data.orgId) {
    return Response.json(
      {
        error: "Pack not found.",
      },
      { status: 404 },
    );
  }

  const updatedPack = await dependencies.packRepository.put(
    markPackReviewed(existingPack, dependencies.now?.() ?? new Date().toISOString()),
  );

  return Response.json(
    {
      orgId: parsedBody.data.orgId,
      pack: updatedPack,
    },
    { status: 200 },
  );
}

function extractPackIdFromRequest(pathname: string) {
  const pathSegments = pathname.split("/").filter(Boolean);
  const reviewSegment = pathSegments.at(-1);
  const packId = pathSegments.at(-2);
  const packsSegment = pathSegments.at(-3);
  const apiSegment = pathSegments.at(-4);

  if (
    reviewSegment !== "review" ||
    apiSegment !== "api" ||
    packsSegment !== "packs" ||
    packId === undefined
  ) {
    return null;
  }

  return packId;
}
