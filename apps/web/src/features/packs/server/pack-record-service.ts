import { randomUUID } from "node:crypto";

import { type DocumentRepository } from "@/features/documents/repositories/document-repository";
import { type FactRepository } from "@/features/facts/repositories/fact-repository";
import { fallbackPacksPageData, type PackItem } from "@/features/packs/constants/packs-page-content";
import { createDecisionRun, type DecisionRun } from "@/features/packs/domain/decision-run";
import { createPackRecord, type PackRecord } from "@/features/packs/domain/pack-record";
import {
  createRecommendationRecord,
  type RecommendationRecord,
} from "@/features/packs/domain/recommendation-record";
import { type DecisionRunRepository } from "@/features/packs/repositories/decision-run-repository";
import { type PackRepository } from "@/features/packs/repositories/pack-repository";
import { type RecommendationRepository } from "@/features/packs/repositories/recommendation-repository";

export async function listPackRecordsForOrg(input: Readonly<{
  documentRepository: DocumentRepository;
  factRepository: FactRepository;
  locale?: string;
  orgId: string;
  packRepository?: PackRepository;
}>): Promise<readonly PackRecord[]> {
  const [documents, facts, storedPacks] = await Promise.all([
    input.documentRepository.listByOrgId(input.orgId),
    input.factRepository.listByOrgId(input.orgId),
    input.packRepository?.listByOrgId(input.orgId) ?? Promise.resolve([]),
  ]);

  const derivedPacks = documents.length === 0
    ? fallbackPacksPageData.packs.map((pack) => packItemToRecord(pack, input.orgId))
    : buildDerivedPackRecords({
        documents,
        facts,
        locale: input.locale,
        orgId: input.orgId,
      });

  const storedPackIds = new Set(storedPacks.map((pack) => pack.id));
  const visiblePacks = [
    ...storedPacks
      .slice()
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    ...derivedPacks.filter((pack) => !storedPackIds.has(pack.id)),
  ];

  return visiblePacks;
}

export async function getPackRecordForOrg(input: Readonly<{
  documentRepository: DocumentRepository;
  factRepository: FactRepository;
  orgId: string;
  packId: string;
  packRepository?: PackRepository;
}>): Promise<PackRecord | null> {
  const storedPack = await input.packRepository?.getById(input.packId);

  if (storedPack !== null && storedPack !== undefined && storedPack.orgId === input.orgId) {
    return storedPack;
  }

  const visiblePacks = await listPackRecordsForOrg(input);

  return visiblePacks.find((pack) => pack.id === input.packId) ?? null;
}

export async function generatePackRecord(input: Readonly<{
  decisionRunRepository?: DecisionRunRepository;
  documentRepository: DocumentRepository;
  factRepository: FactRepository;
  generateId?: () => string;
  locale?: string;
  now?: () => string;
  orgId: string;
  packRepository: PackRepository;
  recommendationRepository?: RecommendationRepository;
}>): Promise<PackRecord> {
  const visiblePacks = await listPackRecordsForOrg({
    documentRepository: input.documentRepository,
    factRepository: input.factRepository,
    locale: input.locale,
    orgId: input.orgId,
    packRepository: input.packRepository,
  });
  const sourcePack = visiblePacks[0] ?? packItemToRecord(fallbackPacksPageData.packs[0], input.orgId);
  const timestamp = input.now?.() ?? new Date().toISOString();
  const formattedTimestamp = new Intl.DateTimeFormat(input.locale ?? "en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp));

  const packRecord = await input.packRepository.put(
    createPackRecord({
      ...sourcePack,
      generatedAtLabel: `Generated ${formattedTimestamp}`,
      id: input.generateId?.() ?? `pack_${randomUUID()}`,
      meta: sourcePack.meta.map((meta, index) =>
        index === 0 ? `Generated from workspace on ${formattedTimestamp}` : meta,
      ),
      orgId: input.orgId,
      reviewedAt: undefined,
      statusLabel: "Ready",
      statusTone: "success",
      title: sourcePack.title,
      updatedAt: timestamp,
    }),
  );

  if (
    input.decisionRunRepository !== undefined &&
    input.recommendationRepository !== undefined
  ) {
    const decisionRun = await input.decisionRunRepository.put(
      createDecisionRunForPack(packRecord, timestamp),
    );

    for (const recommendation of createRecommendationRecordsForPack(
      packRecord,
      decisionRun,
    )) {
      await input.recommendationRepository.put(recommendation);
    }
  }

  return packRecord;
}

export function markPackReviewed(
  packRecord: PackRecord,
  reviewedAt = new Date().toISOString(),
): PackRecord {
  return createPackRecord({
    ...packRecord,
    meta: Array.from(new Set([...packRecord.meta, "Reviewed"])),
    reviewedAt,
    statusLabel: "Ready",
    statusTone: "success",
    updatedAt: reviewedAt,
  });
}

function buildDerivedPackRecords(input: Readonly<{
  documents: Awaited<ReturnType<DocumentRepository["listByOrgId"]>>;
  facts: Awaited<ReturnType<FactRepository["listByOrgId"]>>;
  locale?: string;
  orgId: string;
}>): readonly PackRecord[] {
  const primaryPack = fallbackPacksPageData.packs[0];
  const latestUpdatedAt = input.documents
    .slice()
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]?.updatedAt;
  const readyPacks = input.documents.filter((document) => document.status === "extracted").length;
  const packs: readonly PackItem[] = [
    {
      ...primaryPack,
      generatedAtLabel: `Generated ${new Intl.DateTimeFormat(input.locale ?? "en-US", {
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(latestUpdatedAt ?? new Date().toISOString()))}`,
      meta: [
        primaryPack.meta[0],
        `${primaryPack.recommendations.length} recommendations`,
        `Based on ${input.documents.length} records`,
      ],
      metrics: primaryPack.metrics.map((metric) =>
        metric.label === "Outstanding A/R"
          ? { ...metric, detail: `${input.facts.length} facts contributed to this pack` }
          : metric,
      ),
      sourceData: input.documents.slice(0, 4).map((document) => ({
        id: document.id,
        classLabel: document.suggestedDocumentFamily ?? "Document",
        confidenceLabel:
          document.classificationConfidenceScore !== undefined
            ? document.classificationConfidenceScore.toFixed(2)
            : "--",
        contributionLabel:
          document.status === "extracted"
            ? "Feeds active recommendations"
            : "Pending broader use",
        name: document.fileName,
      })),
    },
    {
      ...fallbackPacksPageData.packs[1],
      meta: [
        fallbackPacksPageData.packs[1].meta[0],
        fallbackPacksPageData.packs[1].meta[1],
        `Based on ${readyPacks || input.documents.length} records`,
      ],
    },
    fallbackPacksPageData.packs[2],
  ];

  return packs.map((pack) =>
    packItemToRecord(pack, input.orgId, latestUpdatedAt),
  );
}

function packItemToRecord(
  pack: PackItem,
  orgId: string,
  updatedAt = new Date().toISOString(),
): PackRecord {
  return createPackRecord({
    ...pack,
    orgId,
    updatedAt,
  });
}

function createDecisionRunForPack(
  packRecord: PackRecord,
  timestamp: string,
): DecisionRun {
  return createDecisionRun({
    completedAt: timestamp,
    createdAt: timestamp,
    id: `decision_${packRecord.id}`,
    orgId: packRecord.orgId,
    packId: packRecord.id,
    packKey: "weekly-cash-margin-brief",
    recommendationCount: packRecord.recommendations.length,
    sourceDocumentIds: packRecord.sourceData.map((source) => source.id),
    startedAt: timestamp,
    status: "completed",
    summary:
      packRecord.recommendations[0]?.summary ??
      `${packRecord.title} generated with ${packRecord.recommendations.length} recommendations.`,
    supportingFactIds: [],
    updatedAt: timestamp,
  });
}

function createRecommendationRecordsForPack(
  packRecord: PackRecord,
  decisionRun: DecisionRun,
): RecommendationRecord[] {
  return packRecord.recommendations.map((recommendation, index) =>
    createRecommendationRecord({
      actions: recommendation.actions,
      citations: recommendation.citations,
      confidenceScore: recommendation.confidence,
      createdAt: decisionRun.createdAt,
      decisionRunId: decisionRun.id,
      id: `${decisionRun.id}:${recommendation.id}`,
      kind: slugifyRecommendationKind(recommendation.title),
      orgId: packRecord.orgId,
      priorityScore: priorityToneToScore(recommendation.priority) - index * 0.01,
      status: "open",
      summary: recommendation.summary,
      supportingFactIds: [],
      title: recommendation.title,
      updatedAt: decisionRun.updatedAt,
    }),
  );
}

function slugifyRecommendationKind(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function priorityToneToScore(
  tone: PackRecord["recommendations"][number]["priority"],
): number {
  switch (tone) {
    case "danger":
      return 4;
    case "warning":
      return 3;
    case "info":
      return 2;
    case "success":
      return 1;
  }
}
