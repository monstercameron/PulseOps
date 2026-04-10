import { z } from "zod";

import { type DocumentRepository } from "@/features/documents/repositories/document-repository";
import { type FactRepository } from "@/features/facts/repositories/fact-repository";
import { type PackRepository } from "@/features/packs/repositories/pack-repository";
import { getPackRecordForOrg } from "@/features/packs/server/pack-record-service";

const packDetailSearchParamsSchema = z.object({
  orgId: z.string().min(1),
});

type PackDetailDependencies = Readonly<{
  documentRepository: DocumentRepository;
  factRepository: FactRepository;
  packRepository?: PackRepository;
}>;

export async function handlePackDetailRequest(
  request: Request,
  dependencies: PackDetailDependencies,
) {
  const url = new URL(request.url);
  const parsedSearchParams = packDetailSearchParamsSchema.safeParse({
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

  const packId = extractPackIdFromRequest(url.pathname);

  if (packId === null) {
    return Response.json(
      {
        error: "Missing packId path parameter.",
      },
      { status: 400 },
    );
  }

  const packRecord = await getPackRecordForOrg({
    documentRepository: dependencies.documentRepository,
    factRepository: dependencies.factRepository,
    orgId: parsedSearchParams.data.orgId,
    packId,
    packRepository: dependencies.packRepository,
  });

  if (packRecord === null) {
    return Response.json(
      {
        error: "Pack not found.",
      },
      { status: 404 },
    );
  }

  return Response.json(
    {
      orgId: parsedSearchParams.data.orgId,
      pack: packRecord,
    },
    { status: 200 },
  );
}

function extractPackIdFromRequest(pathname: string) {
  const pathSegments = pathname.split("/").filter(Boolean);
  const packId = pathSegments.at(-1);
  const packsSegment = pathSegments.at(-2);
  const apiSegment = pathSegments.at(-3);

  if (apiSegment !== "api" || packsSegment !== "packs" || packId === undefined) {
    return null;
  }

  return packId;
}
