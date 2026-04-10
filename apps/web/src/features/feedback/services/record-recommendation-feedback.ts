import { randomUUID } from "node:crypto";

import { createAuditLog, type AuditLog } from "@/features/audit/domain/audit-log";
import { type AuditLogRepository } from "@/features/audit/repositories/audit-log-repository";
import { type AuthSession } from "@/features/auth/domain/auth-session";
import {
  createFeedbackEvent,
  feedbackActionSchema,
  feedbackEditPayloadSchema,
  type FeedbackEvent,
} from "@/features/feedback/domain/feedback-event";
import { type FeedbackRepository } from "@/features/feedback/repositories/feedback-repository";
import { canAccessOrgResource } from "@/features/security/domain/access-control";

type RecordRecommendationFeedbackInput = {
  action: typeof feedbackActionSchema._output;
  actorSession: AuthSession;
  auditLogRepository: AuditLogRepository;
  editPayload?: typeof feedbackEditPayloadSchema._output;
  feedbackRepository: FeedbackRepository;
  generateId?: () => string;
  now?: () => string;
  orgId: string;
  reason?: string;
  recommendationId: string;
};

export class RecommendationFeedbackAccessError extends Error {
  constructor(message = "Actor is not allowed to submit recommendation feedback.") {
    super(message);
    this.name = "RecommendationFeedbackAccessError";
  }
}

export async function recordRecommendationFeedback(
  input: RecordRecommendationFeedbackInput,
): Promise<{
  auditLog: AuditLog;
  feedbackEvent: FeedbackEvent;
}> {
  const action = feedbackActionSchema.parse(input.action);
  const now = input.now ?? (() => new Date().toISOString());
  const generateId = input.generateId ?? randomUUID;
  const requiredPermission = action === "edit" ? "write" : "approve";

  if (
    !canAccessOrgResource({
      actorOrgId: input.actorSession.orgId,
      actorRole: input.actorSession.role,
      permission: requiredPermission,
      resourceOrgId: input.orgId,
    })
  ) {
    throw new RecommendationFeedbackAccessError();
  }

  const createdAt = now();
  const feedbackEvent = createFeedbackEvent({
    action,
    actorId: input.actorSession.userId,
    createdAt,
    editPayload: input.editPayload,
    id: generateId(),
    orgId: input.orgId,
    reason: input.reason,
    recommendationId: input.recommendationId,
  });
  const auditLog = createAuditLog({
    action: `recommendation.feedback.${action}`,
    actorId: input.actorSession.userId,
    createdAt,
    entityId: input.recommendationId,
    id: generateId(),
    metadata: {
      feedbackEventId: feedbackEvent.id,
      ...(feedbackEvent.reason === undefined ? {} : { reason: feedbackEvent.reason }),
      ...(feedbackEvent.editPayload === undefined
        ? {}
        : { editPayload: feedbackEvent.editPayload }),
    },
    orgId: input.orgId,
  });

  await input.feedbackRepository.put(feedbackEvent);
  await input.auditLogRepository.put(auditLog);

  return {
    auditLog,
    feedbackEvent,
  };
}
