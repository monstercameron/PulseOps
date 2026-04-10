import { type DocumentFamilyClassification } from "@/features/documents/domain/document-family-heuristics";
import { type DocumentRecord } from "@/features/documents/domain/document";
import { type ExtractionContract } from "@/features/extraction/domain/extraction-contract";
import { type ParserArtifact } from "@/features/parsing/domain/parser-artifact";

export type TabularExtractionServiceInput = {
  body: Buffer;
  classification: DocumentFamilyClassification;
  document: DocumentRecord;
  parserArtifact: ParserArtifact;
};

export interface TabularExtractionService {
  extract(
    input: TabularExtractionServiceInput,
  ): Promise<ExtractionContract | null>;
}
