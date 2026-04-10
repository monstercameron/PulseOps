import path from "node:path";

import { z } from "zod";

type ServerEnvInput = Record<string, string | undefined>;

export const serverEnvSchema = z.object({
  BIZOPS_AUTH_SECRET: z.string().min(8).default("dev-auth-secret"),
  BIZOPS_OPENAI_ASK_MODEL: z.string().min(1).default("gpt-5-mini"),
  BIZOPS_OPENAI_EXTRACTION_MODEL: z.string().min(1).default("gpt-5-mini"),
  BIZOPS_RECORDS_ROOT: z.string().min(1).default(".local-data/records"),
  BIZOPS_RUNTIME_STORAGE: z
    .enum(["local", "postgres"])
    .default(process.env.NODE_ENV === "test" ? "local" : "postgres"),
  BIZOPS_STORAGE_ROOT: z.string().min(1).default(".local-data/storage"),
  BIZOPS_WEBHOOK_SECRET: z.string().min(8).default("dev-webhook-secret"),
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgres://postgres@localhost:5432/bizopsaccelerator"),
  OPENAI_API_KEY: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function loadServerEnv(env: ServerEnvInput = process.env): ServerEnv {
  return serverEnvSchema.parse(env);
}

export function resolveServerPaths(env: ServerEnvInput = process.env) {
  const serverEnv = loadServerEnv(env);

  return {
    authSecret: serverEnv.BIZOPS_AUTH_SECRET,
    databaseUrl: serverEnv.DATABASE_URL,
    openAiApiKey: serverEnv.OPENAI_API_KEY,
    openAiAskModel: serverEnv.BIZOPS_OPENAI_ASK_MODEL,
    openAiExtractionModel: serverEnv.BIZOPS_OPENAI_EXTRACTION_MODEL,
    recordsRoot: path.resolve(serverEnv.BIZOPS_RECORDS_ROOT),
    runtimeStorage: serverEnv.BIZOPS_RUNTIME_STORAGE,
    storageRoot: path.resolve(serverEnv.BIZOPS_STORAGE_ROOT),
    webhookSecret: serverEnv.BIZOPS_WEBHOOK_SECRET,
  };
}
