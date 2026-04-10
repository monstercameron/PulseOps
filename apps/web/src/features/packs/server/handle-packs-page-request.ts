import { z } from "zod";

import { type DocumentRepository } from "@/features/documents/repositories/document-repository";
import { type FactRepository } from "@/features/facts/repositories/fact-repository";
import { fallbackPacksPageData, type PacksPageData } from "@/features/packs/constants/packs-page-content";
import { packRecordToPackItem } from "@/features/packs/lib/pack-page-state";
import { type PackRepository } from "@/features/packs/repositories/pack-repository";
import { listPackRecordsForOrg } from "@/features/packs/server/pack-record-service";

const packsSearchParamsSchema = z.object({
  orgId: z.string().min(1),
});

type PacksDependencies = Readonly<{
  documentRepository: DocumentRepository;
  factRepository: FactRepository;
  packRepository?: PackRepository;
}>;

export async function handlePacksPageRequest(
  request: Request,
  dependencies: PacksDependencies,
) {
  const url = new URL(request.url);
  const parsedSearchParams = packsSearchParamsSchema.safeParse({
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

  const data = await getPacksPageData({
    ...dependencies,
    orgId: parsedSearchParams.data.orgId,
  });

  return Response.json({
    orgId: parsedSearchParams.data.orgId,
    ...data,
  });
}

type GetPacksPageDataInput = PacksDependencies &
  Readonly<{
    locale?: string;
    orgId: string;
  }>;

export async function getPacksPageData({
  documentRepository,
  factRepository,
  locale = "en-US",
  orgId,
  packRepository,
}: GetPacksPageDataInput): Promise<PacksPageData> {
  const packRecords = await listPackRecordsForOrg({
    documentRepository,
    factRepository,
    locale,
    orgId,
    packRepository,
  });

  return {
    ...fallbackPacksPageData,
    latestPackId: packRecords[0]?.id,
    packs: packRecords.map((packRecord) => packRecordToPackItem(packRecord)),
  };
}
