import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createEvaluationRun } from "@/features/evaluation/domain/evaluation-run";
import { detectDriftAlerts } from "@/features/evaluation/services/drift-alerts";
import { runWeeklyEvaluation } from "@/features/evaluation/services/run-weekly-evaluation";
import { createFeedbackEvent } from "@/features/feedback/domain/feedback-event";
import { createLocalFeedbackRepository } from "@/features/feedback/repositories/local-feedback-repository";
import { createOutcomeObservation } from "@/features/outcomes/domain/outcome-tracking";
import { createLocalOutcomeRepository } from "@/features/outcomes/repositories/local-outcome-repository";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("evaluation services", () => {
  it("runs weekly evaluation summaries from feedback and outcomes", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-evaluation-"),
    );
    temporaryDirectories.push(rootDirectory);

    const feedbackRepository = createLocalFeedbackRepository({ rootDirectory });
    const outcomeRepository = createLocalOutcomeRepository({ rootDirectory });

    await feedbackRepository.put(
      createFeedbackEvent({
        action: "accept",
        actorId: "user_1",
        createdAt: "2026-04-10T02:30:00.000Z",
        id: "feedback_1",
        orgId: "org_123",
        recommendationId: "rec_1",
      }),
    );
    await outcomeRepository.put(
      createOutcomeObservation({
        createdAt: "2026-04-10T02:30:00.000Z",
        id: "outcome_1",
        observedAt: "2026-04-17T02:30:00.000Z",
        orgId: "org_123",
        outcomeStatus: "positive",
        recommendationId: "rec_1",
        windowDays: 7,
      }),
    );

    const evaluationRun = await runWeeklyEvaluation({
      createdAt: "2026-04-17T02:30:00.000Z",
      feedbackRepository,
      id: "evaluation_1",
      orgId: "org_123",
      outcomeRepository,
      promptFamily: "query-planner",
    });

    expect(evaluationRun.acceptanceRate).toBe(1);
    expect(evaluationRun.outcomeRate).toBe(1);
  });

  it("raises drift alerts against historical baselines", () => {
    expect(
      detectDriftAlerts(
        [
          createEvaluationRun({
            acceptanceRate: 0.8,
            createdAt: "2026-04-03T02:30:00.000Z",
            id: "evaluation_1",
            orgId: "org_123",
            outcomeRate: 0.75,
            promptFamily: "query-planner",
            recommendationCount: 4,
          }),
        ],
        createEvaluationRun({
          acceptanceRate: 0.5,
          createdAt: "2026-04-10T02:30:00.000Z",
          id: "evaluation_2",
          orgId: "org_123",
          outcomeRate: 0.4,
          promptFamily: "query-planner",
          recommendationCount: 4,
        }),
      ),
    ).toHaveLength(2);
  });
});
