import path from "node:path";

import {
  textParserArtifactSchema,
  type TextParserArtifact,
} from "@/features/parsing/domain/text-parser-artifact";
import { type TextParserArtifactRepository } from "@/features/parsing/repositories/text-parser-artifact-repository";
import { createLocalJsonCollection } from "@/features/persistence/lib/local-json-collection";

type LocalTextParserArtifactRepositoryOptions = {
  rootDirectory: string;
};

export function createLocalTextParserArtifactRepository({
  rootDirectory,
}: LocalTextParserArtifactRepositoryOptions): TextParserArtifactRepository {
  const collection = createLocalJsonCollection({
    filePath: path.join(rootDirectory, "text-parser-artifacts.json"),
    recordSchema: textParserArtifactSchema,
  });

  return {
    async getById(id) {
      return collection.getById(id);
    },
    async listByDocumentId(documentId) {
      const textParserArtifacts = await collection.list();

      return textParserArtifacts.filter(
        (textParserArtifact) => textParserArtifact.documentId === documentId,
      );
    },
    async put(textParserArtifact) {
      return collection.put(textParserArtifactSchema.parse(textParserArtifact));
    },
  };
}

export type { TextParserArtifact };
