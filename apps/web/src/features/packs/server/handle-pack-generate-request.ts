import { z } from "zod";

import { type DocumentRepository } from "@/features/documents/repositories/document-repository";
import { type FactRepository } from "@/features/facts/repositories/fact-repository";
import { type DecisionRunRepository } from "@/features/packs/repositories/decision-run-repository";
import { type PackRepository } from "@/features/packs/repositories/pack-repository";
import { type RecommendationRepository } from "@/features/packs/repositories/recommendation-repository";
import { generatePackRecord } from "@/features/packs/server/pack-record-service";

const packGenerateRequestSchema = z.object({
  orgId: z.string().min(1),
});

type PackGenerateDependencies = Readonly<{
  decisionRunRepository?: DecisionRunRepository;
  documentRepository: DocumentRepository;
  factRepository: FactRepository;
  generateId?: () => string;
  now?: () => string;
  packRepository: PackRepository;
  recommendationRepository?: RecommendationRepository;
}>;

export async function handlePackGenerateRequest(
  request: Request,
  dependencies: PackGenerateDependencies,
) {
  const parsedBody = packGenerateRequestSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return Response.json(
      {
        error: "Invalid pack generation payload.",
      },
      { status: 400 },
    );
  }

  const packRecord = await generatePackRecord({
    decisionRunRepository: dependencies.decisionRunRepository,
    documentRepository: dependencies.documentRepository,
    factRepository: dependencies.factRepository,
    generateId: dependencies.generateId,
    now: dependencies.now,
    orgId: parsedBody.data.orgId,
    packRepository: dependencies.packRepository,
    recommendationRepository: dependencies.recommendationRepository,
  });

  return Response.json(
    {
      jobId: packRecord.id,
      orgId: parsedBody.data.orgId,
      pack: packRecord,
      status: "completed",
    },
    { status: 201 },
  );
}
