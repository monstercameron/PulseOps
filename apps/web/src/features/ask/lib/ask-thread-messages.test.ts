import { describe, expect, it } from "vitest";

import {
  appendAskThreadMessages,
  sliceAskThreadMessages,
  type AskMessage,
} from "@/features/ask/lib/ask-thread-messages";

const threadMessages: readonly AskMessage[] = [
  {
    citations: [],
    clarificationQuestions: [],
    id: "m1",
    role: "user",
    text: "First question",
  },
  {
    citations: [],
    clarificationQuestions: [],
    id: "m2",
    role: "assistant",
    text: "First answer",
  },
  {
    citations: [],
    clarificationQuestions: [],
    id: "m3",
    role: "user",
    text: "Second question",
  },
];

describe("sliceAskThreadMessages", () => {
  it("returns every prior message through the selected node", () => {
    expect(sliceAskThreadMessages(threadMessages, "m2")).toEqual([
      threadMessages[0],
      threadMessages[1],
    ]);
  });

  it("returns the full thread when the node is missing", () => {
    expect(sliceAskThreadMessages(threadMessages, "missing")).toEqual(
      threadMessages,
    );
  });
});

describe("appendAskThreadMessages", () => {
  it("appends the next exchange after the base thread", () => {
    expect(
      appendAskThreadMessages(threadMessages.slice(0, 2), [
        {
          citations: [],
          clarificationQuestions: [],
          id: "m4",
          role: "user",
          text: "Forked follow-up",
        },
        {
          citations: [],
          clarificationQuestions: [],
          id: "m5",
          role: "assistant",
          text: "Forked answer",
        },
      ]),
    ).toEqual([
      threadMessages[0],
      threadMessages[1],
      {
        citations: [],
        clarificationQuestions: [],
        id: "m4",
        role: "user",
        text: "Forked follow-up",
      },
      {
        citations: [],
        clarificationQuestions: [],
        id: "m5",
        role: "assistant",
        text: "Forked answer",
      },
    ]);
  });
});
