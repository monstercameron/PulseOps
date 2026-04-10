"use client";

import { useRef, useState } from "react";

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
import { type AskWidget } from "@/features/ask/lib/ask-widget-types";
import {
  SEED_DEFAULT_THREAD_ID,
  SEED_HISTORY,
  SEED_THREAD_MESSAGES,
  type SeedMessage,
} from "@/features/ask/lib/ask-seed-threads";

type AskPageProps = Readonly<{
  initialHistory: readonly AskHistoryThread[];
  orgId: string;
}>;

type AskMessage = Readonly<{
  citations: readonly string[];
  clarificationQuestions: readonly string[];
  id: string;
  role: "assistant" | "user";
  text: string;
  widget?: AskWidget | null;
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

const starterPrompts = [
  "Which invoices are overdue as of today?",
  "Which jobs are underpriced?",
  "What deserves attention first this week?",
] as const;

export function AskPage({ initialHistory, orgId }: AskPageProps) {
  const [draft, setDraft] = useState("");
  // Seed threads are prepended so they always appear at the top of the sidebar.
  const [history, setHistory] = useState([
    ...SEED_HISTORY,
    ...initialHistory.filter((t) => !(t.id in SEED_THREAD_MESSAGES)),
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Show the first seed thread's messages on initial load.
  const [messages, setMessages] = useState<readonly AskMessage[]>(
    (SEED_THREAD_MESSAGES[SEED_DEFAULT_THREAD_ID] as readonly SeedMessage[]) ?? [],
  );
  const [pendingDeleteThreadId, setPendingDeleteThreadId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [placeholderAction, setPlaceholderAction] = useState<{
    description?: string;
    title: string;
  } | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(SEED_DEFAULT_THREAD_ID);
  const [forkDraft, setForkDraft] = useState<string | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  function openPlaceholderAction(title: string, description?: string) {
    console.info(`[PulseOps] ${title}: not implemented yet.`);
    setPlaceholderAction({ description, title });
  }

  async function submitQuestion(question: string, saveQuestion: boolean) {
    const trimmedQuestion = question.trim();

    if (trimmedQuestion.length === 0 || isSubmitting) {
      return;
    }

    const userMessage: AskMessage = {
      citations: [],
      clarificationQuestions: [],
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmedQuestion,
    };
    setIsSubmitting(true);
    setMessages([userMessage]);

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
        throw new Error("error" in payload ? payload.error : "Ask request failed.");
      }

      const assistantMessage: AskMessage = {
        citations: payload.answer.citations.map(formatCitationLabel),
        clarificationQuestions: payload.answer.clarificationQuestions,
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text:
          payload.answer.answerText.trim().length === 0
            ? "No matching evidence is available in this workspace yet. Upload more data or narrow the question."
            : payload.answer.answerText,
        widget: payload.widget ?? null,
      };

      setMessages([userMessage, assistantMessage]);

      if (saveQuestion) {
        const threadId = `local-${Date.now()}`;

        setSelectedThreadId(threadId);
        setHistory((current) => [
          {
            createdAt: new Date().toISOString(),
            id: threadId,
            needsClarification: payload.answer.status === "needs-clarification",
            question: trimmedQuestion,
            retrievalMode: payload.plan.retrievalMode,
          },
          ...current.filter((thread) => thread.question !== trimmedQuestion),
        ]);
      }
    } catch (error) {
      setMessages([
        userMessage,
        {
          citations: [],
          clarificationQuestions: [],
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          text:
            error instanceof Error
              ? error.message
              : "The ask request could not be completed.",
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleThreadSelection(thread: AskHistoryThread) {
    setSelectedThreadId(thread.id);
    setDraft(thread.question);
    // Seed threads have pre-built messages — no API call needed.
    if (isSeedId(thread.id)) {
      setMessages(SEED_THREAD_MESSAGES[thread.id] as readonly SeedMessage[]);
      return;
    }
    await submitQuestion(thread.question, false);
  }

  async function handleForkConfirm() {
    const question = (forkDraft ?? "").trim();
    if (!question || isSubmitting) return;
    setForkDraft(null);
    setSelectedThreadId(null);
    setDraft(question);
    await submitQuestion(question, true);
  }

  function startNewThread() {
    setDraft("");
    setMessages([]);
    setSelectedThreadId(null);
    composerRef.current?.focus();
  }

  async function deleteThread(threadId: string) {
    setIsDeleting(true);
    try {
      await fetch(`/api/ask/threads/${encodeURIComponent(threadId)}?orgId=${encodeURIComponent(orgId)}`, {
        method: "DELETE",
      });
      setHistory((current) => current.filter((t) => t.id !== threadId));
      if (selectedThreadId === threadId) {
        startNewThread();
      }
    } finally {
      setIsDeleting(false);
      setPendingDeleteThreadId(null);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <WorkspaceHeader
        actions={[
          {
            label: "Saved thread history",
            onClick: () =>
              openPlaceholderAction(
                "Saved thread history",
                "Desktop thread history is already visible in the left rail. A dedicated history drawer for smaller screens is not implemented yet.",
              ),
            variant: "secondary",
          },
          {
            label: "Ask with evidence",
            onClick: () => composerRef.current?.focus(),
            variant: "primary",
          },
        ]}
        breadcrumbs={["Dashboard", "Ask"]}
        description="Query the workspace in plain language. Each answer is grounded in saved facts and returned with citations."
        title="Ask"
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden w-[220px] shrink-0 border-r border-border bg-card min-[721px]:flex min-[721px]:flex-col">
          <div className="border-b border-border px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.07em] text-muted">
              Threads
            </p>
            <button
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-[8px] bg-accent px-3 py-2 text-[12.5px] font-bold text-[#0d1b2a]"
              onClick={startNewThread}
              type="button"
            >
              <span className="text-sm leading-none">+</span>
              <span>New thread</span>
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {history.length === 0 ? (
              <CatalogCard className="p-4 shadow-none">
                <p className="text-sm font-semibold text-foreground">
                  No saved threads yet
                </p>
                <p className="mt-2 text-xs leading-6 text-muted">
                  Ask a question to create a reusable thread in this workspace.
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
          <div className="border-b border-border bg-card px-5 py-4">
            <div className="flex flex-wrap gap-2">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  className={[
                    "rounded-[20px] border px-[13px] py-[7px] text-[12.5px] font-medium transition-colors",
                    draft === prompt
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-[rgba(20,34,53,.09)] text-[rgba(20,34,53,.7)] hover:border-accent hover:text-accent dark:border-border dark:text-muted",
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
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            {messages.length === 0 ? (
              <CatalogCard className="max-w-3xl p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                  Ask Surface
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                  Start with a question that maps to invoices, jobs, cash, or margin.
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted">
                  The current query planner already recognizes those business objects.
                  When local evidence is missing, the page returns a clear no-evidence response instead of a dead mock.
                </p>
              </CatalogCard>
            ) : (
              <div className="space-y-5">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={message.role === "user" ? "group/msg flex flex-col items-end gap-1.5" : ""}
                  >
                  <ConversationBubble
                    avatarLabel={message.role === "assistant" ? "PO" : "JR"}
                    footer={
                      message.role === "assistant" &&
                      (message.citations.length > 0 ||
                        message.clarificationQuestions.length > 0) ? (
                        <div className="space-y-3">
                          {message.citations.length > 0 ? (
                            <div>
                              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                                Based on
                              </span>
                              <div className="mt-2">
                                <CitationList items={message.citations} />
                              </div>
                            </div>
                          ) : null}
                          {message.clarificationQuestions.length > 0 ? (
                            <div>
                              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                                Clarify next
                              </span>
                              <ul className="mt-2 space-y-1 text-sm text-foreground">
                                {message.clarificationQuestions.map((question) => (
                                  <li key={question}>{question}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          <div className="flex items-center gap-1 border-t border-border pt-3">
                            <button
                              className="rounded-md px-2 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-surface-subtle hover:text-foreground"
                              onClick={() => void navigator.clipboard.writeText(message.text)}
                              type="button"
                            >
                              Copy
                            </button>
                            <button
                              className="rounded-md px-2 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-surface-subtle hover:text-foreground"
                              onClick={() =>
                                openPlaceholderAction("Save to pack", "Ask insights can be saved to packs once that workflow is implemented.")
                              }
                              type="button"
                            >
                              Save to pack
                            </button>
                          </div>
                        </div>
                      ) : undefined
                    }
                    role={message.role}
                  >
                    <div className="space-y-2">
                      {message.text.split("\n").map((line, index) => (
                        <p key={`${message.id}-${index}`}>{line}</p>
                      ))}
                    </div>
                    {message.role === "assistant" && message.widget ? (
                      <AskWidgetRenderer widget={message.widget} />
                    ) : null}
                  </ConversationBubble>
                  {message.role === "user" ? (
                    <button
                      className="flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium text-muted/60 opacity-0 transition-opacity hover:bg-surface-subtle hover:text-foreground group-hover/msg:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      onClick={() => setForkDraft(message.text)}
                      title="Fork a new thread from this question"
                      type="button"
                    >
                      <svg fill="none" height="11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 16 16" width="11">
                        <circle cx="4" cy="4" r="1.5" />
                        <circle cx="4" cy="12" r="1.5" />
                        <circle cx="12" cy="4" r="1.5" />
                        <path d="M4 5.5v5M4 5.5C4 8 6 9 8 9h2.4" />
                        <path d="M10.5 5.5L12 4l1.5 1.5" />
                      </svg>
                      Fork thread
                    </button>
                  ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <form
            className="border-t border-border bg-card px-5 py-4"
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
            <div className="rounded-[12px] border border-border bg-surface-subtle p-3">
              <textarea
                className="min-h-[96px] w-full resize-none border-none bg-transparent text-sm leading-7 text-foreground outline-none placeholder:text-muted"
                ref={composerRef}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about overdue invoices, underpriced jobs, cash pressure, or margin drift."
                value={draft}
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-muted">
                  Questions are saved to thread history when submitted from this input.
                </p>
                <button
                  className="rounded-[8px] bg-accent px-4 py-2.5 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting || draft.trim().length === 0}
                  type="submit"
                >
                  {isSubmitting ? "Running..." : "Ask"}
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

      {forkDraft !== null ? (
        <CatalogModalOverlay>
          <DialogFrame
            description="Edit the question if needed, then fork it into a new saved thread."
            footer={
              <>
                <CatalogButton
                  onClick={() => setForkDraft(null)}
                  variant="secondary"
                >
                  Cancel
                </CatalogButton>
                <CatalogButton
                  disabled={forkDraft.trim().length === 0 || isSubmitting}
                  onClick={() => void handleForkConfirm()}
                  variant="primary"
                >
                  {isSubmitting ? "Forking…" : "Fork thread"}
                </CatalogButton>
              </>
            }
            onClose={() => setForkDraft(null)}
            title="Fork thread"
          >
            <textarea
              autoFocus
              className="min-h-[96px] w-full resize-none rounded-[8px] border border-border bg-surface-subtle px-3 py-2.5 text-[13px] leading-[1.7] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-glow)]"
              onChange={(e) => setForkDraft(e.target.value)}
              placeholder="Enter the forked question…"
              value={forkDraft}
            />
            <p className="mt-2 text-[11.5px] text-muted">
              The forked question will be submitted as a new thread and saved to history.
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
                  onClick={() => setPendingDeleteThreadId(null)}
                  variant="secondary"
                >
                  Cancel
                </CatalogButton>
                <CatalogButton
                  onClick={() => void deleteThread(pendingDeleteThreadId)}
                  variant="danger"
                >
                  {isDeleting ? "Deleting…" : "Delete thread"}
                </CatalogButton>
              </>
            }
            onClose={() => setPendingDeleteThreadId(null)}
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
