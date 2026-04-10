import { describe, expect, it } from "vitest";

import {
  getAskMessageActionIds,
  hasAskMessageContext,
} from "@/features/ask/lib/ask-message-actions";

describe("getAskMessageActionIds", () => {
  it("returns copy and fork actions for user messages", () => {
    expect(getAskMessageActionIds("user")).toEqual(["copy", "fork-thread"]);
  });

  it("returns copy, fork, and save actions for assistant messages", () => {
    expect(getAskMessageActionIds("assistant")).toEqual([
      "copy",
      "fork-thread",
      "save-to-pack",
    ]);
  });
});

describe("hasAskMessageContext", () => {
  it("returns true when citations exist", () => {
    expect(
      hasAskMessageContext({
        citationsCount: 1,
        clarificationQuestionsCount: 0,
      }),
    ).toBe(true);
  });

  it("returns true when clarification questions exist", () => {
    expect(
      hasAskMessageContext({
        citationsCount: 0,
        clarificationQuestionsCount: 1,
      }),
    ).toBe(true);
  });

  it("returns false when no context is present", () => {
    expect(
      hasAskMessageContext({
        citationsCount: 0,
        clarificationQuestionsCount: 0,
      }),
    ).toBe(false);
  });
});
