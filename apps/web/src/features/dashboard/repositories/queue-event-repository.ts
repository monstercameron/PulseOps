import { type QueueEvent } from "@/features/dashboard/domain/queue-event";

export interface QueueEventRepository {
  listByOrgId(orgId: string): Promise<QueueEvent[]>;
  put(queueEvent: QueueEvent): Promise<QueueEvent>;
}
