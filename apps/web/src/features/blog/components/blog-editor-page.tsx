"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { BlogPost, BlogPostStatus } from "@/features/blog/domain/blog-post";

type EditorTab = "write" | "preview";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export function BlogEditorPage({ postId }: Readonly<{ postId: string | null }>) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [author, setAuthor] = useState("PulseOps Team");
  const [status, setStatus] = useState<BlogPostStatus>("draft");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [isLoading, setIsLoading] = useState(postId !== null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tab, setTab] = useState<EditorTab>("write");
  const [slugManual, setSlugManual] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (postId === null) return;
    void (async () => {
      try {
        const res = await fetch(`/api/blog/${postId}`);
        if (!res.ok) {
          router.push("/content");
          return;
        }
        const { post } = (await res.json()) as { post: BlogPost };
        setTitle(post.title);
        setSlug(post.slug);
        setAuthor(post.author);
        setStatus(post.status);
        setSummary(post.summary);
        setBody(post.body);
        setSlugManual(true);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [postId, router]);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugManual) {
      setSlug(slugify(value));
    }
  }

  function insertAtCursor(text: string) {
    const ta = textareaRef.current;
    if (!ta) {
      setBody((prev) => prev + text);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newBody = body.slice(0, start) + text + body.slice(end);
    setBody(newBody);
    requestAnimationFrame(() => {
      ta.selectionStart = start + text.length;
      ta.selectionEnd = start + text.length;
      ta.focus();
    });
  }

  function wrapSelection(before: string, after: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = body.slice(start, end);
    const newBody = body.slice(0, start) + before + selected + after + body.slice(end);
    setBody(newBody);
    requestAnimationFrame(() => {
      ta.selectionStart = start + before.length;
      ta.selectionEnd = end + before.length;
      ta.focus();
    });
  }

  async function handleImageUpload(file: File) {
    setIsUploading(true);
    setErrorMsg(null);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/blog/images", { method: "POST", body: form });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setErrorMsg(data.error ?? "Image upload failed");
        return;
      }
      const { url } = (await res.json()) as { url: string };
      const altText = file.name.replace(/\.[^.]+$/, "");
      insertAtCursor(`\n![${altText}](${url})\n`);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSave() {
    if (isSaving || !title.trim() || !slug.trim()) return;
    setErrorMsg(null);
    setIsSaving(true);
    try {
      const payload = { title, slug, author, status, summary, body };
      const res = await fetch(
        postId === null ? "/api/blog" : `/api/blog/${postId}`,
        {
          body: JSON.stringify(payload),
          headers: { "content-type": "application/json" },
          method: postId === null ? "POST" : "PATCH",
        },
      );
      if (res.ok) {
        router.push("/content");
      } else {
        const data = (await res.json()) as { error?: string };
        setErrorMsg(data.error ?? "Save failed");
      }
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-[13px] text-muted">
        Loading…
      </div>
    );
  }

  const canSave = title.trim().length > 0 && slug.trim().length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* ── Top bar ───────────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-5 py-3">
        <button
          className="flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 text-[12.5px] font-medium text-muted transition hover:bg-surface-subtle hover:text-foreground"
          onClick={() => router.push("/content")}
          type="button"
        >
          <svg
            fill="none"
            height="13"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
            width="13"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Content
        </button>

        <span className="h-4 w-px bg-border" />

        <span className="flex-1 truncate text-[13px] font-semibold text-foreground">
          {postId === null ? "New post" : title.trim() || "Edit post"}
        </span>

        {errorMsg ? (
          <span className="max-w-[260px] truncate text-[12px] text-red-400" role="alert">
            {errorMsg}
          </span>
        ) : null}

        <button
          className="rounded-[7px] border border-border-strong bg-surface-subtle px-3 py-1.5 text-[12.5px] font-medium text-muted transition hover:bg-surface-muted hover:text-foreground"
          onClick={() => router.push("/content")}
          type="button"
        >
          Cancel
        </button>

        <button
          className="rounded-[7px] bg-accent px-4 py-1.5 text-[12.5px] font-bold text-[#0d1b2a] transition enabled:hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canSave || isSaving}
          onClick={() => void handleSave()}
          type="button"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1">
        {/* Left sidebar: metadata */}
        <div className="w-[252px] shrink-0 overflow-y-auto border-r border-border bg-card px-4 py-5">
          <div className="flex flex-col gap-4">
            <EditorField label="Title">
              <input
                autoFocus
                className="field-input"
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. 5 Cash Flow Mistakes"
                type="text"
                value={title}
              />
            </EditorField>

            <EditorField label="Slug">
              <input
                className="field-input font-mono text-[11.5px]"
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugManual(true);
                }}
                placeholder="cash-flow-mistakes"
                type="text"
                value={slug}
              />
            </EditorField>

            <EditorField label="Author">
              <input
                className="field-input"
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="PulseOps Team"
                type="text"
                value={author}
              />
            </EditorField>

            <EditorField label="Status">
              <select
                className="field-input"
                onChange={(e) => setStatus(e.target.value as BlogPostStatus)}
                value={status}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </EditorField>

            <EditorField label="Summary">
              <textarea
                className="field-input resize-none"
                onChange={(e) => setSummary(e.target.value)}
                placeholder="One-paragraph summary shown in listing views."
                rows={6}
                value={summary}
              />
            </EditorField>
          </div>
        </div>

        {/* Right: markdown editor */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Toolbar */}
          <div className="flex shrink-0 items-center gap-1 border-b border-border bg-card px-4 py-2">
            <button
              className={tabButtonCx(tab === "write")}
              onClick={() => setTab("write")}
              type="button"
            >
              Write
            </button>
            <button
              className={tabButtonCx(tab === "preview")}
              onClick={() => setTab("preview")}
              type="button"
            >
              Preview
            </button>

            {tab === "write" ? (
              <div className="ml-3 flex items-center gap-0.5">
                <ToolbarBtn onClick={() => wrapSelection("**", "**")} title="Bold">
                  <strong style={{ fontSize: 13 }}>B</strong>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => wrapSelection("*", "*")} title="Italic">
                  <em style={{ fontSize: 13 }}>I</em>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => wrapSelection("`", "`")} title="Inline code">
                  <span style={{ fontFamily: "monospace", fontSize: 12 }}>{"<>"}</span>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => insertAtCursor("## ")} title="Heading">
                  <span style={{ fontSize: 11, fontWeight: 700 }}>H2</span>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => insertAtCursor("- ")} title="List item">
                  <span style={{ fontSize: 15, lineHeight: 1 }}>·</span>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => insertAtCursor("> ")} title="Blockquote">
                  <span style={{ fontSize: 13 }}>&quot;</span>
                </ToolbarBtn>
                <ToolbarBtn
                  onClick={() => {
                    const url = prompt("Paste a URL to link to:");
                    if (url) {
                      const ta = textareaRef.current;
                      const selected = ta ? body.slice(ta.selectionStart, ta.selectionEnd) : "";
                      wrapSelection(`[${selected ? "" : "link text"}`, `](${url})`);
                    }
                  }}
                  title="Insert link"
                >
                  <svg fill="none" height="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="13">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </ToolbarBtn>

                <span className="mx-1 h-4 w-px bg-border" />

                <ToolbarBtn
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  title={isUploading ? "Uploading…" : "Insert image"}
                >
                  {isUploading ? (
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-border border-t-accent" />
                  ) : (
                    <svg fill="none" height="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="13">
                      <rect height="18" rx="2" ry="2" width="18" x="3" y="3" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  )}
                </ToolbarBtn>

                <input
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleImageUpload(file);
                    e.target.value = "";
                  }}
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  type="file"
                />
              </div>
            ) : null}
          </div>

          {/* Write textarea or rendered preview */}
          {tab === "write" ? (
            <textarea
              className="min-h-0 flex-1 resize-none bg-background p-5 font-mono text-[13px] leading-[1.8] text-foreground outline-none placeholder:text-muted"
              onChange={(e) => setBody(e.target.value)}
              placeholder={"Write your post in Markdown…\n\n## Heading\n\n**Bold**, *italic*, `inline code`\n\n- Bullet list item"}
              ref={textareaRef}
              value={body}
            />
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {body.trim() ? (
                <div className="md-preview mx-auto max-w-[680px]">
                  <ReactMarkdown rehypePlugins={[rehypeSanitize]} remarkPlugins={[remarkGfm]}>
                    {body}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-[13px] italic text-muted">Nothing to preview yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function tabButtonCx(active: boolean) {
  return [
    "rounded-[5px] px-3 py-1 text-[12.5px] font-medium transition",
    active
      ? "bg-surface-muted text-foreground"
      : "text-muted hover:text-foreground",
  ].join(" ");
}

function ToolbarBtn({
  children,
  disabled,
  onClick,
  title,
}: Readonly<{
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  title: string;
}>) {
  return (
    <button
      className="flex h-7 w-7 items-center justify-center rounded-[5px] text-muted transition hover:bg-surface-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
      title={title}
      type="button"
    >
      {children}
    </button>
  );
}

function EditorField({
  children,
  label,
}: Readonly<{ children: React.ReactNode; label: string }>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
