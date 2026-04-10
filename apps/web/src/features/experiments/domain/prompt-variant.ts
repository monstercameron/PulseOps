import { createHash } from "node:crypto";

import { z } from "zod";

export const promptVariantSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean(),
  promptFamily: z.string().min(1),
  promptHash: z.string().min(1),
  promptText: z.string().min(1),
  version: z.literal("prompt-variant.v1"),
});

export type PromptVariant = z.infer<typeof promptVariantSchema>;

export function createPromptVariant(
  input: Omit<PromptVariant, "promptHash" | "version">,
): PromptVariant {
  return promptVariantSchema.parse({
    ...input,
    promptHash: createHash("sha256").update(input.promptText).digest("hex"),
    version: "prompt-variant.v1",
  });
}

export function assignPromptVariant(
  subjectKey: string,
  variants: readonly PromptVariant[],
): PromptVariant {
  const activeVariants = variants.filter((variant) => variant.isActive);

  if (activeVariants.length === 0) {
    throw new Error("At least one active prompt variant is required.");
  }

  const hash = createHash("sha256").update(subjectKey).digest();
  const index = hash[0] % activeVariants.length;

  return activeVariants[index]!;
}
