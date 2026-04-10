import { type DecisionRun } from "@/features/packs/domain/decision-run";

export interface DecisionRunRepository {
  getById(id: string): Promise<DecisionRun | null>;
  listByOrgId(orgId: string): Promise<DecisionRun[]>;
  put(decisionRun: DecisionRun): Promise<DecisionRun>;
}
