import { type OutcomeObservation } from "@/features/outcomes/domain/outcome-tracking";

export interface OutcomeRepository {
  listByOrgId(orgId: string): Promise<OutcomeObservation[]>;
  listByRecommendationId(
    recommendationId: string,
  ): Promise<OutcomeObservation[]>;
  put(outcome: OutcomeObservation): Promise<OutcomeObservation>;
}
