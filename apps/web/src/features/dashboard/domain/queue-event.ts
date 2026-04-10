import { z } from "zod";

export const queueEventSchema = z.object({
  action: z.string().min(1),
  actorId: z.string().min(1),
  id: z.string().min(1),
  itemId: z.string().min(1),
  orgId: z.string().min(1),
  resolvedAt: z.string().datetime(),
  version: z.literal("queue-event.v1"),
});

export type QueueEvent = z.infer<typeof queueEventSchema>;

type CreateQueueEventInput = Omit<QueueEvent, "resolvedAt" | "version"> & {
  resolvedAt?: string;
};

export function createQueueEvent(input: CreateQueueEventInput): QueueEvent {
  return queueEventSchema.parse({
    ...input,
    resolvedAt: input.resolvedAt ?? new Date().toISOString(),
    version: "queue-event.v1",
  });
}
