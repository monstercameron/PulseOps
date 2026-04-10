"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { CatalogButton } from "@/features/catalog/components/catalog-primitives";
import { CatalogModalOverlay, PlaceholderActionDialog } from "@/features/catalog/components/catalog-dialogs";
import { DialogFrame } from "@/features/catalog/components/settings-catalog-blocks";
import {
  CitationList,
  ConversationBubble,
  WorkspaceHeader,
} from "@/features/catalog/components/workspace-catalog-blocks";
import {
  CatalogCard,
  StatusBadge,
} from "@/features/catalog/components/catalog-primitives";
import { type AskHistoryThread } from "@/features/query/server/handle-ask-history-request";
import { AskWidgetRenderer } from "@/features/ask/components/ask-widget-renderer";
import { AskMessageRichText } from "@/features/ask/components/ask-message-rich-text";
import {
  clearCachedAskThreadScrollTop,
  readCachedAskThreadScrollTop,
  writeCachedAskThreadScrollTop,
} from "@/features/ask/lib/ask-thread-scroll-cache";
import {
  getAskMessageActionIds,
  hasAskMessageContext,
} from "@/features/ask/lib/ask-message-actions";
import {
  appendAskThreadMessages,
  sliceAskThreadMessages,
  type AskMessage,
} from "@/features/ask/lib/ask-thread-messages";
import { type AskWidget } from "@/features/ask/lib/ask-widget-types";
import {
  SEED_DEFAULT_THREAD_ID,
  SEED_HISTORY,
  SEED_THREAD_MESSAGES,
  type SeedMessage,
} from "@/features/ask/lib/ask-seed-threads";
import { useUiI18n } from "@/features/i18n/components/ui-i18n-provider";

type AskPageProps = Readonly<{
  initialHistory: readonly AskHistoryThread[];
  orgId: string;
}>;

type AskForkState = Readonly<{
  baseMessages: readonly AskMessage[];
  draft: string;
  sourceMessagePreview: string;
}>;

// SeedMessage is structurally identical — assign freely
function isSeedId(threadId: string | null): threadId is string {
  return threadId !== null && threadId in SEED_THREAD_MESSAGES;
}

type AskApiResponse = Readonly<{
  answer: Readonly<{
    answerText: string;
    citations: readonly Readonly<{
      documentId: string;
      locator: Record<string, boolean | number | string>;
      locatorType: string;
    }>[];
    clarificationQuestions: readonly string[];
    status: "answered" | "needs-clarification";
  }>;
  plan: Readonly<{
    retrievalMode: "clarify" | "facts" | "hybrid" | "vectors";
  }>;
  widget: AskWidget | null;
}>;

const ASK_COMPOSER_MIN_HEIGHT = 36;
const ASK_COMPOSER_MAX_HEIGHT = 120;

export function AskPage({ initialHistory, orgId }: AskPageProps) {
  const { locale, messages: uiMessages, t } = useUiI18n();
  const showSeedThreads = locale.toLowerCase().startsWith("en");
  const starterPrompts = uiMessages.askPage.starterPrompts;
  const [draft, setDraft] = useState("");
  // Seed threads are prepended so they always appear at the top of the sidebar.
  const [history, setHistory] = useState([
    ...(showSeedThreads ? SEED_HISTORY : []),
    ...initialHistory.filter((t) => !(t.id in SEED_THREAD_MESSAGES)),
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [threadMessagesById, setThreadMessagesById] = useState<
    Record<string, readonly AskMessage[]>
  >(() => (showSeedThreads ? { ...SEED_THREAD_MESSAGES } : {}));
  // Show the first seed thread's messages on initial load.
  const [messages, setMessages] = useState<readonly AskMessage[]>(
    showSeedThreads
      ? ((SEED_THREAD_MESSAGES[SEED_DEFAULT_THREAD_ID] as readonly SeedMessage[]) ??
        [])
      : [],
  );
  const [pendingDeleteThreadId, setPendingDeleteThreadId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [placeholderAction, setPlaceholderAction] = useState<{
    description?: string;
    title: string;
  } | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    showSeedThreads ? SEED_DEFAULT_THREAD_ID : null,
  );
  const [forkState, setForkState] = useState<AskForkState | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const threadViewportRef = useRef<HTMLDivElement | null>(null);
  const threadScrollTopByIdRef = useRef<Record<string, number>>({});
  const pendingThreadScrollRestoreIdRef = useRef<string | null>(
    showSeedThreads ? SEED_DEFAULT_THREAD_ID : null,
  );

  function openPlaceholderAction(title: string, description?: string) {
    console.info(`[PulseOps] ${title}: not implemented yet.`);
    setPlaceholderAction({ description, title });
  }

  function cacheThreadScrollTop(threadId: string, scrollTop: number) {
    threadScrollTopByIdRef.current[threadId] = writeCachedAskThreadScrollTop(
      orgId,
      threadId,
      scrollTop,
    );
  }

  function captureThreadScrollTop(threadId: string | null) {
    if (threadId === null || threadViewportRef.current === null) {
      return;
    }

    cacheThreadScrollTop(threadId, threadViewportRef.current.scrollTop);
  }

  async function submitQuestion(
    question: string,
    saveQuestion: boolean,
    options?: Readonly<{
      baseMessages?: readonly AskMessage[];
      threadId?: string;
    }>,
  ) {
    const trimmedQuestion = question.trim();

    if (trimmedQuestion.length === 0 || isSubmitting) {
      return;
    }

    if (saveQuestion && options?.threadId === undefined) {
      captureThreadScrollTop(selectedThreadId);
    }

    const baseMessages = options?.baseMessages ?? messages;

    const userMessage: AskMessage = {
      citations: [],
      clarificationQuestions: [],
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmedQuestion,
    };
    setIsSubmitting(true);
    setMessages(appendAskThreadMessages(baseMessages, [userMessage]));

    try {
      const response = await fetch("/api/ask", {
        body: JSON.stringify({
          orgId,
          question: trimmedQuestion,
          saveQuestion,
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as AskApiResponse | { error: string };

      if (!response.ok || "error" in payload) {
        throw new Error(
          "error" in payload ? payload.error : t("askPage.errorFallback", "Ask request failed."),
        );
      }

      const assistantMessage: AskMessage = {
        citations: payload.answer.citations.map(formatCitationLabel),
        clarificationQuestions: payload.answer.clarificationQuestions,
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text:
          payload.answer.answerText.trim().length === 0
            ? "No matching evidence is available in this workspace yet. Upload more data or narrow the question."
            ? uiMessages.askPage.noAnswer
            : payload.answer.answerText,
        widget: payload.widget ?? null,
      };
      const nextMessages = appendAskThreadMessages(baseMessages, [
        userMessage,
        assistantMessage,
      ]);
      const nextThreadId =
        options?.threadId ??
        (saveQuestion ? `local-${Date.now()}` : undefined);

      setMessages(nextMessages);

      if (nextThreadId !== undefined) {
        setThreadMessagesById((current) => ({
          ...current,
          [nextThreadId]: nextMessages,
        }));
      }

      if (saveQuestion && nextThreadId !== undefined) {
        setSelectedThreadId(nextThreadId);
        setHistory((current) => [
          {
            createdAt: new Date().toISOString(),
            id: nextThreadId,
            needsClarification: payload.answer.status === "needs-clarification",
            question: trimmedQuestion,
            retrievalMode: payload.plan.retrievalMode,
          },
          ...current.filter((thread) => thread.id !== nextThreadId),
        ]);
      }
    } catch (error) {
      const errorAssistantMessage: AskMessage = {
          citations: [],
          clarificationQuestions: [],
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          text:
            error instanceof Error
              ? error.message
              : uiMessages.askPage.errorFallback,
        };
      const nextMessages = appendAskThreadMessages(baseMessages, [
        userMessage,
        errorAssistantMessage,
      ]);
      const nextThreadId =
        options?.threadId ??
        (saveQuestion ? `local-${Date.now()}` : undefined);

      setMessages(nextMessages);

      if (nextThreadId !== undefined) {
        setThreadMessagesById((current) => ({
          ...current,
          [nextThreadId]: nextMessages,
        }));
      }

      if (saveQuestion && nextThreadId !== undefined) {
        setSelectedThreadId(nextThreadId);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleThreadSelection(thread: AskHistoryThread) {
    captureThreadScrollTop(selectedThreadId);
    pendingThreadScrollRestoreIdRef.current = thread.id;
    setSelectedThreadId(thread.id);
    setDraft(thread.question);
    const cachedMessages = threadMessagesById[thread.id];

    if (cachedMessages !== undefined) {
      setMessages(cachedMessages);
      return;
    }

    // Seed threads have pre-built messages — no API call needed.
    if (isSeedId(thread.id)) {
      setMessages(SEED_THREAD_MESSAGES[thread.id] as readonly SeedMessage[]);
      return;
    }

    await submitQuestion(thread.question, false, {
      baseMessages: [],
      threadId: thread.id,
    });
  }

  async function handleForkConfirm() {
    const question = (forkState?.draft ?? "").trim();
    if (!question || isSubmitting) return;
    const baseMessages = forkState?.baseMessages ?? [];
    setForkState(null);
    setSelectedThreadId(null);
    setDraft(question);
    await submitQuestion(question, true, {
      baseMessages,
    });
  }

  function startNewThread(options?: Readonly<{ captureCurrentScroll?: boolean }>) {
    if (options?.captureCurrentScroll !== false) {
      captureThreadScrollTop(selectedThreadId);
    }

    setDraft("");
    setMessages([]);
    setSelectedThreadId(null);
    setForkState(null);
    pendingThreadScrollRestoreIdRef.current = null;
    composerRef.current?.focus();
  }

  async function deleteThread(threadId: string) {
    setIsDeleting(true);
    try {
      await fetch(`/api/ask/threads/${encodeURIComponent(threadId)}?orgId=${encodeURIComponent(orgId)}`, {
        method: "DELETE",
      });
      clearCachedAskThreadScrollTop(orgId, threadId);
      delete threadScrollTopByIdRef.current[threadId];
      setHistory((current) => current.filter((t) => t.id !== threadId));
      if (selectedThreadId === threadId) {
        startNewThread({ captureCurrentScroll: false });
      }
      setThreadMessagesById((current) => {
        if (!(threadId in current)) {
          return current;
        }

        const nextThreadMessages = { ...current };

        delete nextThreadMessages[threadId];

        return nextThreadMessages;
      });
    } finally {
      setIsDeleting(false);
      setPendingDeleteThreadId(null);
    }
  }

  function copyMessageToClipboard(text: string) {
    void navigator.clipboard.writeText(text);
  }

  useLayoutEffect(() => {
    const threadId = pendingThreadScrollRestoreIdRef.current;
    const viewport = threadViewportRef.current;

    if (threadId === null || threadId !== selectedThreadId || viewport === null) {
      return;
    }

    const inMemoryScrollTop = threadScrollTopByIdRef.current[threadId];

    if (inMemoryScrollTop !== undefined) {
      viewport.scrollTop = inMemoryScrollTop;
      pendingThreadScrollRestoreIdRef.current = null;
      return;
    }

    const persistedScrollTop = readCachedAskThreadScrollTop(orgId, threadId);

    if (persistedScrollTop !== null) {
      threadScrollTopByIdRef.current[threadId] = persistedScrollTop;
    }

    viewport.scrollTop = persistedScrollTop ?? 0;
    pendingThreadScrollRestoreIdRef.current = null;
  }, [messages, orgId, selectedThreadId]);

  useLayoutEffect(() => {
    const composer = composerRef.current;

    if (composer === null) {
      return;
    }

    composer.style.height = "0px";

    const nextComposerHeight = resolveAskComposerHeight(composer.scrollHeight);

    composer.style.height = `${nextComposerHeight}px`;
    composer.style.overflowY =
      composer.scrollHeight > ASK_COMPOSER_MAX_HEIGHT ? "auto" : "hidden";
  }, [draft]);

  return (
    <div className="flex min-h-full flex-col">
      <WorkspaceHeader
        actions={[
          {
            label: "Saved thread history",
            label: uiMessages.askPage.actions.history,
            onClick: () =>
              openPlaceholderAction(
                uiMessages.askPage.actions.history,
                uiMessages.askPage.historyActionDescription,
              ),
            variant: "secondary",
          },
          {
            label: uiMessages.askPage.actions.ask,
            onClick: () => composerRef.current?.focus(),
            variant: "primary",
          },
        ]}
        breadcrumbs={uiMessages.askPage.breadcrumbs}
        description={uiMessages.askPage.description}
        title={uiMessages.askPage.title}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden w-[220px] shrink-0 border-r border-border bg-card min-[721px]:flex min-[721px]:flex-col">
          <div className="border-b border-border px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.07em] text-muted">
              {uiMessages.askPage.threadsHeading}
            </p>
            <button
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-[8px] bg-accent px-3 py-2 text-[12.5px] font-bold text-[#0d1b2a]"
              onClick={() => startNewThread()}
              type="button"
            >
              <span className="text-sm leading-none">+</span>
              <span>{uiMessages.askPage.newThread}</span>
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {history.length === 0 ? (
              <CatalogCard className="p-4 shadow-none">
                <p className="text-sm font-semibold text-foreground">
                  {uiMessages.askPage.noThreadsTitle}
                </p>
                <p className="mt-2 text-xs leading-6 text-muted">
                  {uiMessages.askPage.noThreadsDescription}
                </p>
              </CatalogCard>
            ) : null}
            {history.map((thread) => (
              <div
                key={thread.id}
                className={[
                  "group relative rounded-[8px] transition-colors",
                  selectedThreadId === thread.id
                    ? "bg-accent/10 dark:bg-accent-dim"
                    : "hover:bg-surface-subtle dark:hover:bg-surface-muted",
                ].join(" ")}
              >
                <button
                  className="w-full px-[14px] py-[11px] text-left"
                  onClick={() => {
                    void handleThreadSelection(thread);
                  }}
                  type="button"
                >
                  <div className="flex items-start gap-2 pr-5">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-semibold text-foreground">
                        {thread.question}
                      </div>
                      <div className="mt-1 text-[11px] text-muted">
                        {formatThreadTimestamp(thread.createdAt)}
                      </div>
                    </div>
                    <StatusBadge
                      label={thread.needsClarification ? "Clarify" : thread.retrievalMode}
                      tone={thread.needsClarification ? "warning" : "info"}
                    />
                  </div>
                </button>
                <button
                  aria-label="Delete thread"
                  className="absolute right-[6px] top-1/2 -translate-y-1/2 rounded-[5px] p-[3px] text-muted opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingDeleteThreadId(thread.id);
                  }}
                  type="button"
                >
                  <svg fill="none" height="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 16 16" width="13">
                    <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex min-h-0 flex-1 flex-col">
          <div
            className="flex-1 overflow-y-auto px-5 py-5"
            onScroll={(event) => {
              if (selectedThreadId === null) {
                return;
              }

              cacheThreadScrollTop(selectedThreadId, event.currentTarget.scrollTop);
            }}
            ref={threadViewportRef}
          >
            {messages.length === 0 ? (
              <CatalogCard className="max-w-3xl p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                  {uiMessages.askPage.askSurfaceEyebrow}
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                  {uiMessages.askPage.emptyStateTitle}
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted">
                  {uiMessages.askPage.emptyStateDescription}
                </p>
              </CatalogCard>
            ) : (
              <div className="space-y-5">
                {messages.map((message) => {
                  const hasContext = hasAskMessageContext({
                    citationsCount: message.citations.length,
                    clarificationQuestionsCount:
                      message.clarificationQuestions.length,
                  });
                  const actionIds = getAskMessageActionIds(message.role);

                  return (
                    <div
                      key={message.id}
                      className={
                        message.role === "user"
                          ? "flex flex-col items-end gap-1.5"
                          : ""
                      }
                    >
                  <ConversationBubble
                    avatarLabel={message.role === "assistant" ? "PO" : "JR"}
                    footer={
                      <div className="space-y-3">
                        {hasContext ? (
                          <div className="space-y-3">
                            {message.citations.length > 0 ? (
                              <div>
                                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                                  {uiMessages.askPage.assistantLeadLabel}
                                </span>
                                <div className="mt-2">
                                  <CitationList items={message.citations} />
                                </div>
                              </div>
                            ) : null}
                            {message.clarificationQuestions.length > 0 ? (
                              <div>
                                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                                  {uiMessages.askPage.clarifyNextLabel}
                                </span>
                                <ul className="mt-2 space-y-1 text-sm text-foreground">
                                  {message.clarificationQuestions.map((question) => (
                                    <li key={question}>{question}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                        <div
                          className={[
                            "flex flex-wrap items-center gap-1 pt-3",
                            hasContext ? "border-t border-border" : "",
                          ].join(" ")}
                        >
                          {actionIds.map((actionId) => (
                            <button
                              key={`${message.id}-${actionId}`}
                              className="rounded-md px-2 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-surface-subtle hover:text-foreground"
                              onClick={() => {
                                if (actionId === "copy") {
                                  copyMessageToClipboard(message.text);
                                  return;
                                }

                                if (actionId === "fork-thread") {
                                  setForkState({
                                    baseMessages: sliceAskThreadMessages(
                                      messages,
                                      message.id,
                                    ),
                                    draft: "",
                                    sourceMessagePreview: message.text,
                                  });
                                  return;
                                }

                                openPlaceholderAction(
                                  uiMessages.askPage.saveToPack,
                                  uiMessages.askPage.saveToPackDescription,
                                );
                              }}
                              type="button"
                            >
                              {actionId === "copy"
                                ? uiMessages.askPage.copyAction
                                : actionId === "fork-thread"
                                  ? t("askPage.forkThread", "Fork thread")
                                  : uiMessages.askPage.saveToPack}
                            </button>
                          ))}
                        </div>
                      </div>
                    }
                    role={message.role}
                  >
                    <AskMessageRichText
                      content={message.text}
                      role={message.role}
                    />
                    {message.role === "assistant" && message.widget ? (
                      <AskWidgetRenderer widget={message.widget} />
                    ) : null}
                  </ConversationBubble>
                  </div>
                )})}
              </div>
            )}
          </div>

          <form
            className="border-t border-border bg-card px-5 py-2"
            onSubmit={(event) => {
              event.preventDefault();
              const question = draft.trim();

              if (question.length === 0) {
                return;
              }

              setDraft("");
              void submitQuestion(question, true);
            }}
          >
            <div className="-mx-1 mb-1.5 flex gap-2 overflow-x-auto px-1 pb-0.5">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  className={[
                    "shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium whitespace-nowrap transition-colors",
                    draft === prompt
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-[rgba(20,34,53,.09)] bg-background/75 text-[rgba(20,34,53,.72)] hover:border-accent hover:text-accent dark:border-border dark:bg-surface-subtle dark:text-muted",
                  ].join(" ")}
                  onClick={() => {
                    setDraft(prompt);
                    void submitQuestion(prompt, true);
                  }}
                  type="button"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className="rounded-[12px] border border-border bg-surface-subtle px-2.5 py-1.5">
              <textarea
                className="w-full resize-none border-none bg-transparent text-[13px] leading-[1.5] text-foreground outline-none placeholder:text-muted"
                rows={1}
                ref={composerRef}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={uiMessages.askPage.placeholder}
                value={draft}
              />
              <div className="mt-1.5 flex items-center justify-end">
                <button
                  className="rounded-[8px] bg-accent px-4 py-1.5 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting || draft.trim().length === 0}
                  type="submit"
                >
                  {isSubmitting ? uiMessages.askPage.submitting : uiMessages.askPage.submitLabel}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {placeholderAction ? (
        <PlaceholderActionDialog
          description={placeholderAction.description}
          onClose={() => setPlaceholderAction(null)}
          title={placeholderAction.title}
        />
      ) : null}

      {forkState !== null ? (
        <CatalogModalOverlay>
          <DialogFrame
            description="The new thread will keep every prior message through the selected point, then continue from there with a new question."
            footer={
              <>
                <CatalogButton
                  onClick={() => setForkState(null)}
                  variant="secondary"
                >
                  Cancel
                </CatalogButton>
                <CatalogButton
                  disabled={forkState.draft.trim().length === 0 || isSubmitting}
                  onClick={() => void handleForkConfirm()}
                  variant="primary"
                >
                  {isSubmitting ? "Forking…" : "Fork thread"}
                </CatalogButton>
              </>
            }
            onClose={() => setForkState(null)}
            title="Fork thread"
          >
            <div className="rounded-[8px] border border-border bg-surface-subtle px-3 py-2.5 text-[12px] leading-[1.6] text-muted">
              <span className="font-semibold text-foreground">Fork point</span>
              <p className="mt-1">
                {forkState.sourceMessagePreview.length > 180
                  ? `${forkState.sourceMessagePreview.slice(0, 180)}...`
                  : forkState.sourceMessagePreview}
              </p>
              <p className="mt-2">
                Prior messages carried into the new thread:{" "}
                <span className="font-semibold text-foreground">
                  {forkState.baseMessages.length}
                </span>
              </p>
            </div>
            <textarea
              autoFocus
              className="min-h-[96px] w-full resize-none rounded-[8px] border border-border bg-surface-subtle px-3 py-2.5 text-[13px] leading-[1.7] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-glow)]"
              onChange={(e) =>
                setForkState((current) =>
                  current === null
                    ? null
                    : { ...current, draft: e.target.value },
                )
              }
              placeholder="Ask the next question in the forked thread…"
              value={forkState.draft}
            />
            <p className="mt-2 text-[11.5px] text-muted">
              The forked thread will preserve the prior conversation and save the new branch to history.
            </p>
          </DialogFrame>
        </CatalogModalOverlay>
      ) : null}

      {pendingDeleteThreadId ? (
        <CatalogModalOverlay>
          <DialogFrame
            description="This thread will be permanently removed from the workspace. This cannot be undone."
            footer={
              <>
                <CatalogButton
                  disabled={isDeleting}
                  onClick={() => setPendingDeleteThreadId(null)}
                  variant="secondary"
                >
                  Cancel
                </CatalogButton>
                <CatalogButton
                  className="gap-2"
                  disabled={isDeleting}
                  onClick={() => void deleteThread(pendingDeleteThreadId)}
                  variant="danger"
                >
                  {isDeleting ? (
                    <>
                      <DeleteThreadLoadingIcon />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    "Delete thread"
                  )}
                </CatalogButton>
              </>
            }
            onClose={isDeleting ? undefined : () => setPendingDeleteThreadId(null)}
            title="Delete thread?"
          >
            <p className="text-[13px] leading-[1.6] text-muted">
              {history.find((t) => t.id === pendingDeleteThreadId)?.question ?? "This thread"}
            </p>
          </DialogFrame>
        </CatalogModalOverlay>
      ) : null}
    </div>
  );
}

function formatCitationLabel(citation: AskApiResponse["answer"]["citations"][number]) {
  const firstLocatorEntry = Object.entries(citation.locator)[0];

  if (firstLocatorEntry === undefined) {
    return `${citation.documentId} · ${citation.locatorType}`;
  }

  return `${citation.documentId} · ${firstLocatorEntry[0]} ${firstLocatorEntry[1]}`;
}

function formatThreadTimestamp(createdAt: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(new Date(createdAt));
}

export function resolveAskComposerHeight(scrollHeight: number) {
  return Math.min(
    ASK_COMPOSER_MAX_HEIGHT,
    Math.max(ASK_COMPOSER_MIN_HEIGHT, Math.ceil(scrollHeight)),
  );
}

export function DeleteThreadLoadingIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5 animate-spin"
      fill="none"
      viewBox="0 0 16 16"
    >
      <circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1.5" />
      <path
        d="M13.25 8A5.25 5.25 0 008 2.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
