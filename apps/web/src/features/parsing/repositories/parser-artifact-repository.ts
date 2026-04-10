import { type ParserArtifact } from "@/features/parsing/domain/parser-artifact";

export interface ParserArtifactRepository {
  getById(id: string): Promise<ParserArtifact | null>;
  listByDocumentId(documentId: string): Promise<ParserArtifact[]>;
  put(parserArtifact: ParserArtifact): Promise<ParserArtifact>;
}
