import { describe, expect, it } from "vitest";

import { createFeedbackEvent } from "@/features/feedback/domain/feedback-event";

describe("feedback event", () => {
  it("accepts edit feedback with a structured edit payload", () => {
    const event = createFeedbackEvent({
      action: "edit",
      actorId: "user_123",
      editPayload: {
        estimatedValueCents: 52_000,
        title: "Call overdue customer before Friday",
      },
      id: "feedback_123",
      orgId: "org_123",
      recommendationId: "rec_123",
      reason: "Reduce the ask and make the next step explicit.",
    });

    expect(event.editPayload).toMatchObject({
      estimatedValueCents: 52_000,
      title: "Call overdue customer before Friday",
    });
  });

  it("rejects edit feedback without an edit payload", () => {
    expect(() =>
      createFeedbackEvent({
        action: "edit",
        actorId: "user_123",
        id: "feedback_123",
        orgId: "org_123",
        recommendationId: "rec_123",
      }),
    ).toThrow("Edit feedback requires an edit payload.");
  });

  it("rejects edit payloads on non-edit actions", () => {
    expect(() =>
      createFeedbackEvent({
        action: "accept",
        actorId: "user_123",
        editPayload: {
          title: "Updated title",
        },
        id: "feedback_123",
        orgId: "org_123",
        recommendationId: "rec_123",
      }),
    ).toThrow("Only edit feedback can carry an edit payload.");
  });
});
