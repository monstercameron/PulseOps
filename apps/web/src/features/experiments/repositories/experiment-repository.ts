import { type ExperimentRecord } from "@/features/experiments/domain/experiment-record";

export interface ExperimentRepository {
  getById(id: string): Promise<ExperimentRecord | null>;
  listByOrgId(orgId: string): Promise<ExperimentRecord[]>;
  put(experiment: ExperimentRecord): Promise<ExperimentRecord>;
}
