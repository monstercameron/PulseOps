import { z } from "zod";

export const outcomeStatusSchema = z.enum([
  "positive",
  "negative",
  "mixed",
  "unknown",
]);

export const outcomeObservationSchema = z.object({
  createdAt: z.string().datetime(),
  id: z.string().min(1),
  notes: z.string().min(1).optional(),
  observedAt: z.string().datetime(),
  orgId: z.string().min(1),
  outcomeStatus: outcomeStatusSchema,
  recommendationId: z.string().min(1),
  valueChangeCents: z.number().int().optional(),
  windowDays: z.union([z.literal(7), z.literal(30), z.literal(90)]),
  version: z.literal("outcome-observation.v1"),
});

export type OutcomeObservation = z.infer<typeof outcomeObservationSchema>;

export function createOutcomeObservation(
  input: Omit<OutcomeObservation, "createdAt" | "version"> & {
    createdAt?: string;
  },
): OutcomeObservation {
  return outcomeObservationSchema.parse({
    ...input,
    createdAt: input.createdAt ?? new Date().toISOString(),
    version: "outcome-observation.v1",
  });
}
