import { describe, expect, it } from "vitest";

import {
  loadServerEnv,
  resolveServerPaths,
} from "@/features/config/server-env";

describe("server env", () => {
  it("provides local defaults for backend services", () => {
    expect(loadServerEnv({ NODE_ENV: "test" })).toMatchObject({
      BIZOPS_AUTH_SECRET: "dev-auth-secret",
      BIZOPS_OPENAI_EXTRACTION_MODEL: "gpt-5-mini",
      BIZOPS_RECORDS_ROOT: ".local-data/records",
      BIZOPS_RUNTIME_STORAGE: "local",
      BIZOPS_STORAGE_ROOT: ".local-data/storage",
      DATABASE_URL: "postgres://postgres@localhost:5432/bizopsaccelerator",
    });
    expect(
      resolveServerPaths({
        BIZOPS_AUTH_SECRET: "auth-secret-1234",
        BIZOPS_OPENAI_EXTRACTION_MODEL: "gpt-5.4-mini",
        BIZOPS_RECORDS_ROOT: ".tmp/records",
        BIZOPS_STORAGE_ROOT: ".tmp/storage",
        BIZOPS_WEBHOOK_SECRET: "secret-1234",
        DATABASE_URL: "postgres://localhost:5432/custom",
        NODE_ENV: "test",
        OPENAI_API_KEY: "sk-test-123",
      }),
    ).toMatchObject({
      authSecret: "auth-secret-1234",
      databaseUrl: "postgres://localhost:5432/custom",
      openAiApiKey: "sk-test-123",
      openAiExtractionModel: "gpt-5.4-mini",
      runtimeStorage: "local",
      webhookSecret: "secret-1234",
    });
  });
});
