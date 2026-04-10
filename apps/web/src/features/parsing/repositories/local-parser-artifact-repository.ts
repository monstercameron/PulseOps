import path from "node:path";

import {
  parserArtifactSchema,
  type ParserArtifact,
} from "@/features/parsing/domain/parser-artifact";
import { type ParserArtifactRepository } from "@/features/parsing/repositories/parser-artifact-repository";
import { createLocalJsonCollection } from "@/features/persistence/lib/local-json-collection";

type LocalParserArtifactRepositoryOptions = {
  rootDirectory: string;
};

export function createLocalParserArtifactRepository({
  rootDirectory,
}: LocalParserArtifactRepositoryOptions): ParserArtifactRepository {
  const collection = createLocalJsonCollection({
    filePath: path.join(rootDirectory, "parser-artifacts.json"),
    recordSchema: parserArtifactSchema,
  });

  return {
    async getById(id) {
      return collection.getById(id);
    },
    async listByDocumentId(documentId) {
      const parserArtifacts = await collection.list();

      return parserArtifacts.filter(
        (parserArtifact) => parserArtifact.documentId === documentId,
      );
    },
    async put(parserArtifact) {
      return collection.put(parserArtifactSchema.parse(parserArtifact));
    },
  };
}

export type { ParserArtifact };
