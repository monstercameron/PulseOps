import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createQueryPlan } from "@/features/query/domain/query-plan";
import { createSavedQuestion } from "@/features/query/domain/saved-question";
import { createLocalSavedQuestionRepository } from "@/features/query/repositories/local-saved-question-repository";
import { handleAskHistoryRequest } from "@/features/query/server/handle-ask-history-request";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("handleAskHistoryRequest", () => {
  it("lists saved questions for one org in reverse chronological order", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-ask-history-"),
    );
    temporaryDirectories.push(rootDirectory);

    const savedQuestionRepository = createLocalSavedQuestionRepository({
      rootDirectory,
    });

    await savedQuestionRepository.put(
      createSavedQuestion({
        createdAt: "2026-04-10T01:00:00.000Z",
        id: "saved_question_1",
        orgId: "org_123",
        question: "Which invoices are overdue?",
        queryPlan: createQueryPlan({
          canonicalFactTypeIds: ["invoice.amount.outstanding"],
          entityTypes: ["invoice"],
          limit: 5,
          needsClarification: false,
          orgId: "org_123",
          question: "Which invoices are overdue?",
          rationale: "Matched invoice keywords.",
          retrievalMode: "facts",
        }),
      }),
    );
    await savedQuestionRepository.put(
      createSavedQuestion({
        createdAt: "2026-04-10T02:00:00.000Z",
        id: "saved_question_2",
        orgId: "org_123",
        question: "Why is margin dropping?",
        queryPlan: createQueryPlan({
          canonicalFactTypeIds: ["job.margin.gross"],
          entityTypes: ["job"],
          limit: 5,
          needsClarification: false,
          orgId: "org_123",
          question: "Why is margin dropping?",
          rationale: "Matched margin keywords.",
          retrievalMode: "hybrid",
          vectorSearchText: "Why is margin dropping?",
        }),
      }),
    );
    await savedQuestionRepository.put(
      createSavedQuestion({
        createdAt: "2026-04-10T03:00:00.000Z",
        id: "saved_question_other_org",
        orgId: "org_other",
        question: "Ignore me",
        queryPlan: createQueryPlan({
          canonicalFactTypeIds: ["invoice.amount.outstanding"],
          entityTypes: ["invoice"],
          limit: 5,
          needsClarification: false,
          orgId: "org_other",
          question: "Ignore me",
          rationale: "Matched invoice keywords.",
          retrievalMode: "facts",
        }),
      }),
    );

    const response = await handleAskHistoryRequest(
      new Request("http://localhost/api/ask?orgId=org_123"),
      {
        savedQuestionRepository,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      orgId: "org_123",
      threads: [
        {
          createdAt: "2026-04-10T02:00:00.000Z",
          id: "saved_question_2",
          needsClarification: false,
          question: "Why is margin dropping?",
          retrievalMode: "hybrid",
        },
        {
          createdAt: "2026-04-10T01:00:00.000Z",
          id: "saved_question_1",
          needsClarification: false,
          question: "Which invoices are overdue?",
          retrievalMode: "facts",
        },
      ],
    });
  });
});
