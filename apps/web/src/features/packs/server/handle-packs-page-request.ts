import { z } from "zod";

import { type DocumentRepository } from "@/features/documents/repositories/document-repository";
import { type FactRepository } from "@/features/facts/repositories/fact-repository";
import { fallbackPacksPageData, type PacksPageData } from "@/features/packs/constants/packs-page-content";
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
    orgId: string;
  }>;

export async function getPacksPageData({
  documentRepository,
  factRepository,
  orgId,
  packRepository,
}: GetPacksPageDataInput): Promise<PacksPageData> {
  const packRecords = await listPackRecordsForOrg({
    documentRepository,
    factRepository,
    orgId,
    packRepository,
  });

  return {
    ...fallbackPacksPageData,
    latestPackId: packRecords[0]?.id,
    packs: packRecords.map((packRecord) => ({
      accent: packRecord.accent,
      generatedAtLabel: packRecord.generatedAtLabel,
      id: packRecord.id,
      meta: packRecord.meta,
      metrics: packRecord.metrics,
      recommendations: packRecord.recommendations,
      sourceData: packRecord.sourceData,
      statusLabel: packRecord.statusLabel,
      statusTone: packRecord.statusTone,
      title: packRecord.title,
    })),
  };
}
