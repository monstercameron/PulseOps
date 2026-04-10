import { type FeedbackRepository } from "@/features/feedback/repositories/feedback-repository";
import {
  createEvaluationRun,
  type EvaluationRun,
} from "@/features/evaluation/domain/evaluation-run";
import { type OutcomeRepository } from "@/features/outcomes/repositories/outcome-repository";

type RunWeeklyEvaluationInput = {
  createdAt?: string;
  feedbackRepository: FeedbackRepository;
  id: string;
  orgId: string;
  outcomeRepository: OutcomeRepository;
  promptFamily: string;
};

export async function runWeeklyEvaluation({
  createdAt,
  feedbackRepository,
  id,
  orgId,
  outcomeRepository,
  promptFamily,
}: RunWeeklyEvaluationInput): Promise<EvaluationRun> {
  const feedbackEvents = await feedbackRepository.listByOrgId(orgId);
  const outcomes = await outcomeRepository.listByOrgId(orgId);
  const acceptanceRate =
    feedbackEvents.length === 0
      ? 0
      : feedbackEvents.filter((event) => event.action === "accept").length /
        feedbackEvents.length;
  const outcomeRate =
    outcomes.length === 0
      ? 0
      : outcomes.filter((outcome) => outcome.outcomeStatus === "positive")
          .length / outcomes.length;

  return createEvaluationRun({
    acceptanceRate: Number(acceptanceRate.toFixed(4)),
    createdAt,
    id,
    orgId,
    outcomeRate: Number(outcomeRate.toFixed(4)),
    promptFamily,
    recommendationCount: new Set(
      feedbackEvents.map((event) => event.recommendationId),
    ).size,
  });
}
