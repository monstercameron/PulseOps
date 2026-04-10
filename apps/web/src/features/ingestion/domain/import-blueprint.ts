import { z } from "zod";

import { processingPolicyParserRouteSchema } from "@/features/governance/domain/processing-policy";

export const importBlueprintSourceKindSchema = z.enum(["upload", "email", "api"]);
export const importBlueprintStatusSchema = z.enum([
  "draft",
  "active",
  "archived",
]);

export const importBlueprintSchema = z.object({
  createdAt: z.string().datetime(),
  exampleFileNames: z.array(z.string().min(1)).readonly(),
  id: z.string().min(1),
  name: z.string().min(1),
  orgId: z.string().min(1),
  parserRoute: processingPolicyParserRouteSchema,
  policyId: z.string().min(1).optional(),
  sourceKind: importBlueprintSourceKindSchema,
  status: importBlueprintStatusSchema,
  targetDocumentFamily: z.string().min(1),
  updatedAt: z.string().datetime(),
  version: z.literal("import-blueprint.v1"),
});

export type ImportBlueprint = z.infer<typeof importBlueprintSchema>;

type CreateImportBlueprintInput = Omit<
  ImportBlueprint,
  "createdAt" | "updatedAt" | "version"
> & {
  createdAt?: string;
  updatedAt?: string;
};

export function createImportBlueprint(
  input: CreateImportBlueprintInput,
): ImportBlueprint {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return importBlueprintSchema.parse({
    ...input,
    createdAt,
    updatedAt: input.updatedAt ?? createdAt,
    version: "import-blueprint.v1",
  });
}
