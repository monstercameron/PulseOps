import { type ImportBlueprint } from "@/features/ingestion/domain/import-blueprint";

export interface ImportBlueprintRepository {
  getById(id: string): Promise<ImportBlueprint | null>;
  listByOrgId(orgId: string): Promise<ImportBlueprint[]>;
  put(importBlueprint: ImportBlueprint): Promise<ImportBlueprint>;
}
