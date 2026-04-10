import { describe, expect, it } from "vitest";

import { signAuthSession } from "@/features/auth/domain/auth-session";
import { createLocalAuditLogRepository } from "@/features/audit/repositories/local-audit-log-repository";
import { createLocalFeedbackRepository } from "@/features/feedback/repositories/local-feedback-repository";
import { handleRecommendationFeedback } from "@/features/feedback/server/handle-recommendation-feedback";

describe("handleRecommendationFeedback", () => {
  it("records recommendation feedback for authorized users", async () => {
    const feedbackRepository = createLocalFeedbackRepository({
      rootDirectory: process.cwd(),
    });
    const auditLogRepository = createLocalAuditLogRepository({
      rootDirectory: process.cwd(),
    });
    const authSecret = "dev-auth-secret";
    const token = signAuthSession(
      {
        expiresAt: "2026-04-15T00:00:00.000Z",
        orgId: "org_123",
        role: "owner",
        userId: "user_123",
      },
      authSecret,
    );
    const ids = ["feedback_123", "audit_123"];

    const response = await handleRecommendationFeedback(
      new Request("http://localhost/api/brief/feedback", {
        body: JSON.stringify({
          action: "accept",
          orgId: "org_123",
          reason: "Approved for this week.",
          recommendationId: "rec_123",
        }),
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        method: "POST",
      }),
      {
        auditLogRepository,
        authSecret,
        feedbackRepository,
        generateId: () => ids.shift() ?? "fallback_id",
      },
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      auditLogId: "audit_123",
      feedbackEvent: {
        action: "accept",
        id: "feedback_123",
      },
    });
  });

  it("rejects invalid auth tokens", async () => {
    const response = await handleRecommendationFeedback(
      new Request("http://localhost/api/brief/feedback", {
        body: JSON.stringify({
          action: "accept",
          orgId: "org_123",
          recommendationId: "rec_123",
        }),
        headers: {
          authorization: "Bearer not-a-real-token",
          "content-type": "application/json",
        },
        method: "POST",
      }),
      {
        auditLogRepository: createLocalAuditLogRepository({
          rootDirectory: process.cwd(),
        }),
        authSecret: "dev-auth-secret",
        feedbackRepository: createLocalFeedbackRepository({
          rootDirectory: process.cwd(),
        }),
      },
    );

    expect(response.status).toBe(401);
  });

  it("rejects users without feedback permissions", async () => {
    const authSecret = "dev-auth-secret";
    const token = signAuthSession(
      {
        expiresAt: "2026-04-15T00:00:00.000Z",
        orgId: "org_123",
        role: "analyst",
        userId: "analyst_123",
      },
      authSecret,
    );

    const response = await handleRecommendationFeedback(
      new Request("http://localhost/api/brief/feedback", {
        body: JSON.stringify({
          action: "reject",
          orgId: "org_123",
          recommendationId: "rec_123",
        }),
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        method: "POST",
      }),
      {
        auditLogRepository: createLocalAuditLogRepository({
          rootDirectory: process.cwd(),
        }),
        authSecret,
        feedbackRepository: createLocalFeedbackRepository({
          rootDirectory: process.cwd(),
        }),
      },
    );

    expect(response.status).toBe(403);
  });
});
