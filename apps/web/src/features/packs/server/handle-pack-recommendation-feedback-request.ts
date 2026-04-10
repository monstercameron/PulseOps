import { randomUUID } from "node:crypto";

import { z } from "zod";

import { createAuditLog } from "@/features/audit/domain/audit-log";
import { type AuditLogRepository } from "@/features/audit/repositories/audit-log-repository";
import {
  createFeedbackEvent,
  feedbackActionSchema,
} from "@/features/feedback/domain/feedback-event";
import { type FeedbackRepository } from "@/features/feedback/repositories/feedback-repository";

const packRecommendationFeedbackRequestSchema = z.object({
  action: z.enum(["accept", "reject"]),
  actorId: z.string().min(1).optional(),
  orgId: z.string().min(1),
  reason: z.string().trim().min(1).optional(),
});

type PackRecommendationFeedbackDependencies = Readonly<{
  auditLogRepository: AuditLogRepository;
  feedbackRepository: FeedbackRepository;
  generateId?: () => string;
  now?: () => string;
}>;

export async function handlePackRecommendationFeedbackRequest(
  request: Request,
  dependencies: PackRecommendationFeedbackDependencies,
) {
  const parsedBody = packRecommendationFeedbackRequestSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return Response.json(
      {
        error: "Invalid recommendation feedback payload.",
      },
      { status: 400 },
    );
  }

  const recommendationId = extractRecommendationIdFromRequest(new URL(request.url).pathname);

  if (recommendationId === null) {
    return Response.json(
      {
        error: "Missing recommendationId path parameter.",
      },
      { status: 400 },
    );
  }

  const timestamp = dependencies.now?.() ?? new Date().toISOString();
  const generateId = dependencies.generateId ?? randomUUID;
  const feedbackEvent = await dependencies.feedbackRepository.put(
    createFeedbackEvent({
      action: feedbackActionSchema.parse(parsedBody.data.action),
      actorId: parsedBody.data.actorId ?? "local-ui",
      createdAt: timestamp,
      id: generateId(),
      orgId: parsedBody.data.orgId,
      reason: parsedBody.data.reason,
      recommendationId,
    }),
  );
  const auditLog = await dependencies.auditLogRepository.put(
    createAuditLog({
      action: `recommendation.feedback.${parsedBody.data.action}`,
      actorId: parsedBody.data.actorId ?? "local-ui",
      createdAt: timestamp,
      entityId: recommendationId,
      id: generateId(),
      metadata: {
        feedbackEventId: feedbackEvent.id,
        packRecommendationAction: parsedBody.data.action,
      },
      orgId: parsedBody.data.orgId,
    }),
  );

  return Response.json(
    {
      auditLogId: auditLog.id,
      feedbackEvent,
      orgId: parsedBody.data.orgId,
    },
    { status: 201 },
  );
}

function extractRecommendationIdFromRequest(pathname: string) {
  const pathSegments = pathname.split("/").filter(Boolean);
  const feedbackSegment = pathSegments.at(-1);
  const recommendationId = pathSegments.at(-2);
  const recommendationsSegment = pathSegments.at(-3);
  const packId = pathSegments.at(-4);
  const packsSegment = pathSegments.at(-5);
  const apiSegment = pathSegments.at(-6);

  if (
    feedbackSegment !== "feedback" ||
    recommendationsSegment !== "recommendations" ||
    apiSegment !== "api" ||
    packsSegment !== "packs" ||
    packId === undefined ||
    recommendationId === undefined
  ) {
    return null;
  }

  return recommendationId;
}
