"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { BlogPost, BlogPostStatus } from "@/features/blog/domain/blog-post";

type EditorTab = "write" | "preview";

type GalleryImage = Readonly<{ filename: string; url: string }>;

function altFromFilename(filename: string): string {
  const noExt = filename.replace(/\.[^.]+$/, "");
  if (/^\d+-[0-9a-f]+$/i.test(noExt)) return "image";
  return noExt.replace(/[-_]+/g, " ").trim();
}

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
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GalleryImage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

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

  async function loadGallery() {
    try {
      const res = await fetch("/api/blog/images");
      if (!res.ok) return;
      const data = (await res.json()) as { images: GalleryImage[] };
      setGalleryImages(data.images);
    } catch {
      // non-fatal — gallery just stays empty
    }
  }

  useEffect(() => {
    void loadGallery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function copyMarkdown(image: GalleryImage) {
    const md = `![${altFromFilename(image.filename)}](${image.url})`;
    void navigator.clipboard.writeText(md).then(() => {
      setCopiedUrl(image.url);
      setTimeout(() => setCopiedUrl(null), 1800);
    });
  }

  async function confirmDelete() {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/blog/images", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ filename: deleteTarget.filename }),
      });
      if (res.ok || res.status === 404) {
        setDeleteTarget(null);
        void loadGallery();
      }
    } finally {
      setIsDeleting(false);
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
      void loadGallery();
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

            {/* ── Image gallery ─────────────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                  Images
                </span>
                <button
                  className="flex items-center gap-1 rounded-[5px] px-2 py-0.5 text-[11px] font-medium text-muted transition hover:bg-surface-muted hover:text-foreground disabled:opacity-40"
                  disabled={isUploading}
                  onClick={() => galleryFileInputRef.current?.click()}
                  title="Upload image"
                  type="button"
                >
                  <svg fill="none" height="11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="11">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" x2="12" y1="3" y2="15" />
                  </svg>
                  {isUploading ? "Uploading…" : "Upload"}
                </button>
                <input
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleImageUpload(file);
                    e.target.value = "";
                  }}
                  ref={galleryFileInputRef}
                  style={{ display: "none" }}
                  type="file"
                />
              </div>

              {galleryImages.length === 0 ? (
                <p className="text-[11.5px] italic text-muted">No images yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {galleryImages.map((img) => (
                    <div className="group relative" key={img.url}>
                      <button
                        className="relative overflow-hidden rounded-[6px] border border-border bg-surface-subtle transition hover:border-accent/50 w-full"
                        onClick={() => copyMarkdown(img)}
                        title={`Click to copy markdown: ![…](${img.url})`}
                        type="button"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt={altFromFilename(img.filename)}
                          className="aspect-square w-full object-cover"
                          src={img.url}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                          {copiedUrl === img.url ? (
                            <span className="rounded-[4px] bg-accent px-1.5 py-0.5 text-[10px] font-bold text-[#0d1b2a]">
                              Copied!
                            </span>
                          ) : (
                            <svg fill="none" height="16" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
                              <rect height="13" rx="2" width="13" x="9" y="9" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )}
                        </div>
                      </button>
                      {/* Delete button — always visible on hover of the outer div */}
                      <button
                        aria-label={`Delete ${img.filename}`}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(img); }}
                        title="Delete image"
                        type="button"
                      >
                        <svg fill="none" height="9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="9">
                          <line x1="18" x2="6" y1="6" y2="18" />
                          <line x1="6" x2="18" y1="6" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
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

      {/* ── Delete confirmation modal ────────────────────────────────────────── */}
      {deleteTarget !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div className="w-[340px] rounded-[12px] border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-2 text-[14px] font-bold text-foreground" id="delete-modal-title">
              Delete image?
            </h2>
            <p className="mb-1 text-[12.5px] text-muted">
              This will permanently delete the file from disk.
            </p>
            <p className="mb-5 truncate rounded-[6px] bg-surface-subtle px-2.5 py-1.5 font-mono text-[11px] text-foreground">
              {deleteTarget.filename}
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="rounded-[7px] border border-border-strong bg-surface-subtle px-4 py-1.5 text-[12.5px] font-medium text-muted transition hover:bg-surface-muted hover:text-foreground"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-[7px] bg-red-600 px-4 py-1.5 text-[12.5px] font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                disabled={isDeleting}
                onClick={() => void confirmDelete()}
                type="button"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
