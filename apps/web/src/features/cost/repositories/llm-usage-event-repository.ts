import { type LlmUsageEvent } from "@/features/cost/domain/llm-usage-event";

export interface LlmUsageEventRepository {
  listByOrgIdInPeriod(input: Readonly<{
    endAtExclusive: string;
    orgId: string;
    startAtInclusive: string;
  }>): Promise<LlmUsageEvent[]>;
  put(llmUsageEvent: LlmUsageEvent): Promise<LlmUsageEvent>;
}
