import { z } from "zod";

export const memoryKindSchema = z.enum(["decision", "fact", "feedback"]);

export const memoryEmbeddingSchema = z.object({
  content: z.string().min(1),
  createdAt: z.string().datetime(),
  embedding: z.array(z.number().finite()).min(1).readonly(),
  embeddingDimensions: z.number().int().positive(),
  embeddingModel: z.string().min(1),
  id: z.string().min(1),
  memoryKind: memoryKindSchema,
  metadata: z.record(z.string(), z.unknown()),
  orgId: z.string().min(1),
  sourceId: z.string().min(1),
  updatedAt: z.string().datetime(),
  version: z.literal("memory-embedding.v1"),
});

export type MemoryEmbedding = z.infer<typeof memoryEmbeddingSchema>;

type CreateMemoryEmbeddingInput = Omit<
  MemoryEmbedding,
  "createdAt" | "embeddingDimensions" | "updatedAt" | "version"
> & {
  createdAt?: string;
  updatedAt?: string;
};

export function createMemoryEmbedding(
  input: CreateMemoryEmbeddingInput,
): MemoryEmbedding {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return memoryEmbeddingSchema.parse({
    ...input,
    createdAt,
    embeddingDimensions: input.embedding.length,
    updatedAt: input.updatedAt ?? createdAt,
    version: "memory-embedding.v1",
  });
}
