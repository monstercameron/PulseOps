import { randomUUID } from "node:crypto";

import { z } from "zod";

import { type AuditLogRepository } from "@/features/audit/repositories/audit-log-repository";
import { verifyAuthSession } from "@/features/auth/domain/auth-session";
import { feedbackActionSchema, feedbackEditPayloadSchema } from "@/features/feedback/domain/feedback-event";
import {
  RecommendationFeedbackAccessError,
  recordRecommendationFeedback,
} from "@/features/feedback/services/record-recommendation-feedback";
import { type FeedbackRepository } from "@/features/feedback/repositories/feedback-repository";

const recommendationFeedbackRequestSchema = z.object({
  action: feedbackActionSchema,
  editPayload: feedbackEditPayloadSchema.optional(),
  orgId: z.string().min(1),
  reason: z.string().trim().min(1).optional(),
  recommendationId: z.string().min(1),
});

type RecommendationFeedbackDependencies = {
  auditLogRepository: AuditLogRepository;
  authSecret: string;
  feedbackRepository: FeedbackRepository;
  generateId?: () => string;
};

export async function handleRecommendationFeedback(
  request: Request,
  dependencies: RecommendationFeedbackDependencies,
): Promise<Response> {
  const authHeader = request.headers.get("authorization");

  if (authHeader === null || !authHeader.startsWith("Bearer ")) {
    return Response.json({ error: "Missing bearer auth token." }, { status: 401 });
  }

  let actorSession;

  try {
    actorSession = verifyAuthSession(
      authHeader.slice("Bearer ".length),
      dependencies.authSecret,
    );
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Invalid auth token.",
      },
      { status: 401 },
    );
  }

  const payload = recommendationFeedbackRequestSchema.parse(await request.json());

  try {
    const result = await recordRecommendationFeedback({
      action: payload.action,
      actorSession,
      auditLogRepository: dependencies.auditLogRepository,
      editPayload: payload.editPayload,
      feedbackRepository: dependencies.feedbackRepository,
      generateId: dependencies.generateId ?? randomUUID,
      orgId: payload.orgId,
      reason: payload.reason,
      recommendationId: payload.recommendationId,
    });

    return Response.json(
      {
        auditLogId: result.auditLog.id,
        feedbackEvent: result.feedbackEvent,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof RecommendationFeedbackAccessError) {
      return Response.json({ error: error.message }, { status: 403 });
    }

    throw error;
  }
}
