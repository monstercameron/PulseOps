import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createLocalAuditLogRepository } from "@/features/audit/repositories/local-audit-log-repository";
import { createLocalFeedbackRepository } from "@/features/feedback/repositories/local-feedback-repository";
import {
  RecommendationFeedbackAccessError,
  recordRecommendationFeedback,
} from "@/features/feedback/services/record-recommendation-feedback";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("recordRecommendationFeedback", () => {
  it("persists accepted recommendation feedback and audit logs", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-feedback-"),
    );
    temporaryDirectories.push(rootDirectory);

    const feedbackRepository = createLocalFeedbackRepository({ rootDirectory });
    const auditLogRepository = createLocalAuditLogRepository({ rootDirectory });
    const result = await recordRecommendationFeedback({
      action: "accept",
      actorSession: {
        expiresAt: "2026-04-15T00:00:00.000Z",
        orgId: "org_123",
        role: "owner",
        userId: "user_123",
      },
      auditLogRepository,
      feedbackRepository,
      generateId: (() => {
        const ids = ["feedback_123", "audit_123"];

        return () => ids.shift() ?? "fallback_id";
      })(),
      now: () => "2026-04-09T18:15:00.000Z",
      orgId: "org_123",
      reason: "We can execute this this week.",
      recommendationId: "rec_123",
    });

    expect(result.feedbackEvent).toMatchObject({
      action: "accept",
      id: "feedback_123",
      recommendationId: "rec_123",
    });
    expect(result.auditLog).toMatchObject({
      action: "recommendation.feedback.accept",
      entityId: "rec_123",
      id: "audit_123",
    });
    await expect(
      feedbackRepository.listByRecommendationId("rec_123"),
    ).resolves.toHaveLength(1);
    await expect(auditLogRepository.listByOrgId("org_123")).resolves.toEqual([
      expect.objectContaining({
        id: "audit_123",
      }),
    ]);
  });

  it("allows analysts to submit edit feedback but not approvals", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-feedback-"),
    );
    temporaryDirectories.push(rootDirectory);

    const feedbackRepository = createLocalFeedbackRepository({ rootDirectory });
    const auditLogRepository = createLocalAuditLogRepository({ rootDirectory });

    await expect(
      recordRecommendationFeedback({
        action: "edit",
        actorSession: {
          expiresAt: "2026-04-15T00:00:00.000Z",
          orgId: "org_123",
          role: "analyst",
          userId: "analyst_123",
        },
        auditLogRepository,
        editPayload: {
          impactSummary: "Call the top 3 overdue accounts before Friday.",
        },
        feedbackRepository,
        generateId: (() => {
          const ids = ["feedback_123", "audit_123"];

          return () => ids.shift() ?? "fallback_id";
        })(),
        orgId: "org_123",
        recommendationId: "rec_123",
      }),
    ).resolves.toMatchObject({
      feedbackEvent: {
        action: "edit",
      },
    });

    await expect(
      recordRecommendationFeedback({
        action: "reject",
        actorSession: {
          expiresAt: "2026-04-15T00:00:00.000Z",
          orgId: "org_123",
          role: "analyst",
          userId: "analyst_123",
        },
        auditLogRepository,
        feedbackRepository,
        orgId: "org_123",
        recommendationId: "rec_456",
      }),
    ).rejects.toBeInstanceOf(RecommendationFeedbackAccessError);
  });

  it("rejects cross-org feedback writes", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-feedback-"),
    );
    temporaryDirectories.push(rootDirectory);

    const feedbackRepository = createLocalFeedbackRepository({ rootDirectory });
    const auditLogRepository = createLocalAuditLogRepository({ rootDirectory });

    await expect(
      recordRecommendationFeedback({
        action: "accept",
        actorSession: {
          expiresAt: "2026-04-15T00:00:00.000Z",
          orgId: "org_other",
          role: "owner",
          userId: "user_123",
        },
        auditLogRepository,
        feedbackRepository,
        orgId: "org_123",
        recommendationId: "rec_123",
      }),
    ).rejects.toBeInstanceOf(RecommendationFeedbackAccessError);
  });
});
