import { type MaterializedMart } from "@/features/marts/domain/materialized-mart";

export interface MartRepository {
  getById(id: string): Promise<MaterializedMart | null>;
  listByOrgId(orgId: string): Promise<MaterializedMart[]>;
  put(mart: MaterializedMart): Promise<MaterializedMart>;
}
