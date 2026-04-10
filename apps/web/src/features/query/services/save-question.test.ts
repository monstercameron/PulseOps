import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createLocalSavedQuestionRepository } from "@/features/query/repositories/local-saved-question-repository";
import { planDatasetQuestion } from "@/features/query/services/query-planner";
import { saveQuestion } from "@/features/query/services/save-question";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("saveQuestion", () => {
  it("persists saved questions with their generated query plans", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-saved-questions-"),
    );
    temporaryDirectories.push(rootDirectory);

    const repository = createLocalSavedQuestionRepository({
      rootDirectory,
    });
    const savedQuestion = await saveQuestion({
      createdAt: "2026-04-10T01:10:00.000Z",
      id: "saved_question_123",
      orgId: "org_123",
      question: "Why are overdue invoices climbing?",
      queryPlan: planDatasetQuestion(
        "Why are overdue invoices climbing?",
        "org_123",
      ),
      repository,
    });

    expect(savedQuestion.version).toBe("saved-question.v1");
    expect(await repository.listByOrgId("org_123")).toHaveLength(1);
  });
});
