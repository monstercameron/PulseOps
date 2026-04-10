export type AskMessageActionId = "copy" | "fork-thread" | "save-to-pack";
export type AskMessageRole = "assistant" | "user";

export function getAskMessageActionIds(
  role: AskMessageRole,
): readonly AskMessageActionId[] {
  if (role === "assistant") {
    return ["copy", "fork-thread", "save-to-pack"];
  }

  return ["copy", "fork-thread"];
}

export function hasAskMessageContext(input: Readonly<{
  citationsCount: number;
  clarificationQuestionsCount: number;
}>): boolean {
  return (
    input.citationsCount > 0 || input.clarificationQuestionsCount > 0
  );
}
