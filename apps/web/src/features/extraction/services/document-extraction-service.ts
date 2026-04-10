import { type DocumentFamilyClassification } from "@/features/documents/domain/document-family-heuristics";
import { type DocumentRecord } from "@/features/documents/domain/document";
import { type ExtractionContract } from "@/features/extraction/domain/extraction-contract";
import { type ParserArtifact } from "@/features/parsing/domain/parser-artifact";
import { type TextParserArtifact } from "@/features/parsing/domain/text-parser-artifact";

export type DocumentExtractionServiceInput =
  | {
      body: Buffer;
      classification: DocumentFamilyClassification | null;
      document: DocumentRecord;
      parserArtifact: ParserArtifact;
      parserRoute: "tabular";
    }
  | {
      body: Buffer;
      document: DocumentRecord;
      parserRoute: "text";
      textParserArtifact: TextParserArtifact;
    };

export interface DocumentExtractionService {
  extract(input: DocumentExtractionServiceInput): Promise<ExtractionContract | null>;
}
