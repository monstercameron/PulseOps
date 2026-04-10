import { type RecommendationRecord } from "@/features/packs/domain/recommendation-record";

export interface RecommendationRepository {
  listByDecisionRunId(decisionRunId: string): Promise<RecommendationRecord[]>;
  listByOrgId(orgId: string): Promise<RecommendationRecord[]>;
  put(recommendation: RecommendationRecord): Promise<RecommendationRecord>;
}
