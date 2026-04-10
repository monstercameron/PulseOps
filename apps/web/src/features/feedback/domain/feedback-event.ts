import { z } from "zod";

export const feedbackActionSchema = z.enum(["accept", "reject", "edit"]);

export const feedbackEditPayloadSchema = z
  .object({
    estimatedValueCents: z.number().int().nonnegative().optional(),
    impactSummary: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "Edit feedback requires at least one changed field.",
  });

export const feedbackEventSchema = z
  .object({
    action: feedbackActionSchema,
    actorId: z.string().min(1),
    createdAt: z.string().datetime(),
    editPayload: feedbackEditPayloadSchema.optional(),
    id: z.string().min(1),
    orgId: z.string().min(1),
    recommendationId: z.string().min(1),
    reason: z.string().trim().min(1).optional(),
    version: z.literal("feedback-event.v1"),
  })
  .superRefine((event, context) => {
    if (event.action === "edit" && event.editPayload === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Edit feedback requires an edit payload.",
        path: ["editPayload"],
      });
    }

    if (event.action !== "edit" && event.editPayload !== undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only edit feedback can carry an edit payload.",
        path: ["editPayload"],
      });
    }
  });

export type FeedbackEvent = z.infer<typeof feedbackEventSchema>;

export function createFeedbackEvent(
  input: Omit<FeedbackEvent, "createdAt" | "version"> & { createdAt?: string },
): FeedbackEvent {
  return feedbackEventSchema.parse({
    ...input,
    createdAt: input.createdAt ?? new Date().toISOString(),
    version: "feedback-event.v1",
  });
}
