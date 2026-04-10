import { z } from "zod";

const jsonValueSchema: z.ZodType<
  boolean | null | number | string | { [key: string]: unknown } | unknown[]
> = z.lazy(() =>
  z.union([
    z.boolean(),
    z.null(),
    z.number(),
    z.string(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

export const uiTranslationMessagesSchema = z.record(z.string(), jsonValueSchema);

export const uiTranslationBundleRecordSchema = z.object({
  createdAt: z.string().min(1),
  id: z.string().min(1),
  locale: z.string().min(2),
  messages: uiTranslationMessagesSchema,
  namespace: z.string().min(1),
  orgId: z.string().min(1).nullable(),
  updatedAt: z.string().min(1),
  version: z.literal("ui-translation-bundle.v1"),
});

export type UiTranslationBundleRecord = z.infer<
  typeof uiTranslationBundleRecordSchema
>;
