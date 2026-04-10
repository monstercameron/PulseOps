import { z } from "zod";

import { type DocumentRepository } from "@/features/documents/repositories/document-repository";
import { type FactRepository } from "@/features/facts/repositories/fact-repository";
import { type PackRecord } from "@/features/packs/domain/pack-record";
import { type PackRepository } from "@/features/packs/repositories/pack-repository";
import { getPackRecordForOrg } from "@/features/packs/server/pack-record-service";

const packExportSearchParamsSchema = z.object({
  orgId: z.string().min(1),
});

type PackExportDependencies = Readonly<{
  documentRepository: DocumentRepository;
  factRepository: FactRepository;
  packRepository?: PackRepository;
}>;

export async function handlePackExportRequest(
  request: Request,
  dependencies: PackExportDependencies,
) {
  const url = new URL(request.url);
  const parsedSearchParams = packExportSearchParamsSchema.safeParse({
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

  const fileSafeTitle = packRecord.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return new Response(buildPackExport(packRecord), {
    headers: {
      "content-disposition": `attachment; filename="${fileSafeTitle}.txt"`,
      "content-type": "text/plain; charset=utf-8",
    },
    status: 200,
  });
}

function extractPackIdFromRequest(pathname: string) {
  const pathSegments = pathname.split("/").filter(Boolean);
  const exportSegment = pathSegments.at(-1);
  const packId = pathSegments.at(-2);
  const packsSegment = pathSegments.at(-3);
  const apiSegment = pathSegments.at(-4);

  if (
    exportSegment !== "export" ||
    apiSegment !== "api" ||
    packsSegment !== "packs" ||
    packId === undefined
  ) {
    return null;
  }

  return packId;
}

function buildPackExport(packRecord: PackRecord) {
  return [
    packRecord.title,
    packRecord.generatedAtLabel,
    "",
    "Summary",
    ...packRecord.meta,
    "",
    "Recommendations",
    ...packRecord.recommendations.flatMap((recommendation, index) => [
      `${index + 1}. ${recommendation.title}`,
      recommendation.summary,
      `Priority: ${recommendation.priorityLabel}`,
      `Confidence: ${recommendation.confidence.toFixed(2)}`,
      `Citations: ${recommendation.citations.join(", ")}`,
      "",
    ]),
  ].join("\n");
}
