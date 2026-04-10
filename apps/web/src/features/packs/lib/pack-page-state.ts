import { type PackRecord } from "@/features/packs/domain/pack-record";
import { type PackItem } from "@/features/packs/constants/packs-page-content";

export function packRecordToPackItem(packRecord: PackRecord): PackItem {
  return {
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
  };
}

export function mergeUpdatedPackItem(
  packs: readonly PackItem[],
  nextPack: PackItem,
): readonly PackItem[] {
  const remainingPacks = packs.filter((pack) => pack.id !== nextPack.id);

  return [nextPack, ...remainingPacks];
}

export function resolvePackRecommendationFeedbackAction(action: string) {
  if (action === "Accept") {
    return "accept" as const;
  }

  if (action === "Dismiss") {
    return "reject" as const;
  }

  return null;
}
