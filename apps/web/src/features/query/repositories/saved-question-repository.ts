import { type SavedQuestion } from "@/features/query/domain/saved-question";

export interface SavedQuestionRepository {
  deleteById(id: string): Promise<void>;
  getById(id: string): Promise<SavedQuestion | null>;
  listByOrgId(orgId: string): Promise<SavedQuestion[]>;
  put(savedQuestion: SavedQuestion): Promise<SavedQuestion>;
}
