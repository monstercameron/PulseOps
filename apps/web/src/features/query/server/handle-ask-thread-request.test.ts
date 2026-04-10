import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createQueryPlan } from "@/features/query/domain/query-plan";
import { createSavedQuestion } from "@/features/query/domain/saved-question";
import { createLocalSavedQuestionRepository } from "@/features/query/repositories/local-saved-question-repository";
import { handleAskThreadRequest } from "@/features/query/server/handle-ask-thread-request";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("handleAskThreadRequest", () => {
  it("returns a saved thread by id", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-ask-thread-"),
    );
    temporaryDirectories.push(rootDirectory);

    const savedQuestionRepository = createLocalSavedQuestionRepository({ rootDirectory });

    await savedQuestionRepository.put(
      createSavedQuestion({
        id: "thread_123",
        orgId: "org_123",
        question: "Which invoices are overdue?",
        queryPlan: createQueryPlan({
          canonicalFactTypeIds: ["invoice.amount.outstanding"],
          entityTypes: ["invoice"],
          limit: 5,
          needsClarification: false,
          orgId: "org_123",
          question: "Which invoices are overdue?",
          rationale: "Outstanding invoice amount should surface overdue AR.",
          retrievalMode: "facts",
        }),
      }),
    );

    const response = await handleAskThreadRequest(
      new Request("http://localhost/api/ask/threads/thread_123?orgId=org_123"),
      {
        savedQuestionRepository,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      thread: expect.objectContaining({
        id: "thread_123",
        question: "Which invoices are overdue?",
      }),
    });
  });
});
