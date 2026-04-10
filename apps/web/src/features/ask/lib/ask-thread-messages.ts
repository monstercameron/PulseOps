import { type AskWidget } from "@/features/ask/lib/ask-widget-types";

export type AskMessage = Readonly<{
  citations: readonly string[];
  clarificationQuestions: readonly string[];
  id: string;
  role: "assistant" | "user";
  text: string;
  widget?: AskWidget | null;
}>;

export function appendAskThreadMessages(
  baseMessages: readonly AskMessage[],
  nextMessages: readonly AskMessage[],
): readonly AskMessage[] {
  return [...baseMessages, ...nextMessages];
}

export function sliceAskThreadMessages(
  messages: readonly AskMessage[],
  messageId: string,
): readonly AskMessage[] {
  const selectedMessageIndex = messages.findIndex(
    (message) => message.id === messageId,
  );

  if (selectedMessageIndex === -1) {
    return [...messages];
  }

  return messages.slice(0, selectedMessageIndex + 1);
}
