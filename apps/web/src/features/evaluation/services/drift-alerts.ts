import { type EvaluationRun } from "@/features/evaluation/domain/evaluation-run";

export type DriftAlert = {
  kind: "acceptance-rate-drift" | "outcome-rate-drift";
  message: string;
  severity: "warn" | "critical";
};

export function detectDriftAlerts(
  history: readonly EvaluationRun[],
  current: EvaluationRun,
): DriftAlert[] {
  if (history.length === 0) {
    return [];
  }

  const averageAcceptanceRate =
    history.reduce((sum, run) => sum + run.acceptanceRate, 0) / history.length;
  const averageOutcomeRate =
    history.reduce((sum, run) => sum + run.outcomeRate, 0) / history.length;
  const alerts: DriftAlert[] = [];

  if (averageAcceptanceRate - current.acceptanceRate >= 0.2) {
    alerts.push({
      kind: "acceptance-rate-drift",
      message: "Acceptance rate fell materially below the trailing baseline.",
      severity: "warn",
    });
  }

  if (averageOutcomeRate - current.outcomeRate >= 0.25) {
    alerts.push({
      kind: "outcome-rate-drift",
      message: "Observed outcomes fell materially below the trailing baseline.",
      severity: "critical",
    });
  }

  return alerts;
}
