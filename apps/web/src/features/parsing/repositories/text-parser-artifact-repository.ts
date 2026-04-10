import { type TextParserArtifact } from "@/features/parsing/domain/text-parser-artifact";

export interface TextParserArtifactRepository {
  getById(id: string): Promise<TextParserArtifact | null>;
  listByDocumentId(documentId: string): Promise<TextParserArtifact[]>;
  put(textParserArtifact: TextParserArtifact): Promise<TextParserArtifact>;
}
