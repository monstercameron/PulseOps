import { type FeedbackEvent } from "@/features/feedback/domain/feedback-event";

export interface FeedbackRepository {
  listByOrgId(orgId: string): Promise<FeedbackEvent[]>;
  listByRecommendationId(recommendationId: string): Promise<FeedbackEvent[]>;
  put(event: FeedbackEvent): Promise<FeedbackEvent>;
}
