"use client";

import { useEffect, useState } from "react";
import { WorkspaceHeader } from "@/features/catalog/components/workspace-catalog-blocks";
import { CatalogButton, StatusBadge } from "@/features/catalog/components/catalog-primitives";
import { CatalogModalOverlay, PlaceholderActionDialog } from "@/features/catalog/components/catalog-dialogs";
import { DialogFrame } from "@/features/catalog/components/settings-catalog-blocks";
import type { BlogPost, BlogPostStatus, CreateBlogPostInput } from "@/features/blog/domain/blog-post";
import { useUiI18n } from "@/features/i18n/components/ui-i18n-provider";

type DraftState = Readonly<{
  id: string | null; // null = new post
  title: string;
  slug: string;
  summary: string;
  body: string;
  author: string;
  status: BlogPostStatus;
}>;

const emptyDraft = (author = "PulseOps Team"): DraftState => ({
  id: null,
  title: "",
  slug: "",
  summary: "",
  body: "",
  author,
  status: "draft",
});

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export function BlogAdminPage({
  orgId: _orgId,
}: Readonly<{ orgId?: string }>) {
  const { locale, messages } = useUiI18n();
  const [posts, setPosts] = useState<readonly BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [placeholderAction, setPlaceholderAction] = useState<{ title: string; description?: string } | null>(null);

  async function loadPosts() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/blog");
      const data = (await res.json()) as { posts: BlogPost[] };
      setPosts(data.posts);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPosts();
  }, []);

  function openNew() {
    setDraft(emptyDraft(messages.contentPage.placeholders.author));
  }

  function openEdit(post: BlogPost) {
    setDraft({
      id: post.id,
      title: post.title,
      slug: post.slug,
      summary: post.summary,
      body: post.body,
      author: post.author,
      status: post.status,
    });
  }

  function updateDraft<K extends keyof DraftState>(key: K, value: DraftState[K]) {
    setDraft((prev) => {
      if (prev === null) return prev;
      const next = { ...prev, [key]: value };
      // Auto-generate slug from title when creating new
      if (key === "title" && prev.id === null) {
        next.slug = slugify(value as string);
      }
      return next;
    });
  }

  async function handleSave() {
    if (draft === null || isSubmitting) return;
    if (!draft.title.trim() || !draft.slug.trim()) return;

    setIsSubmitting(true);
    try {
      const body: CreateBlogPostInput = {
        author: draft.author,
        body: draft.body,
        slug: draft.slug,
        status: draft.status,
        summary: draft.summary,
        title: draft.title,
      };

      const res = await fetch(
        draft.id === null ? "/api/blog" : `/api/blog/${draft.id}`,
        {
          body: JSON.stringify(body),
          headers: { "content-type": "application/json" },
          method: draft.id === null ? "POST" : "PATCH",
        },
      );

      if (res.ok) {
        setDraft(null);
        await loadPosts();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setIsDeleting(true);
    try {
      await fetch(`/api/blog/${id}`, { method: "DELETE" });
      setPendingDeleteId(null);
      await loadPosts();
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleToggleStatus(post: BlogPost) {
    const nextStatus: BlogPostStatus = post.status === "published" ? "draft" : "published";
    await fetch(`/api/blog/${post.id}`, {
      body: JSON.stringify({ status: nextStatus }),
      headers: { "content-type": "application/json" },
      method: "PATCH",
    });
    await loadPosts();
  }

  const pendingDeletePost = posts.find((p) => p.id === pendingDeleteId);

  return (
    <div className="flex min-h-full flex-col">
      <WorkspaceHeader
        actions={[
          {
            label: messages.contentPage.actions.newPost,
            onClick: openNew,
            variant: "primary",
          },
          {
            label: messages.contentPage.actions.viewPublicBlog,
            onClick: () =>
              setPlaceholderAction({
                title: messages.contentPage.actions.viewPublicBlog,
                description: messages.contentPage.publicBlogDescription,
              }),
            variant: "secondary",
          },
        ]}
        breadcrumbs={messages.contentPage.breadcrumbs}
        description={messages.contentPage.description}
        title={messages.contentPage.title}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-[22px] py-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-[13px] text-muted">
            {messages.contentPage.loading}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <p className="text-[14px] font-semibold text-foreground">
              {messages.contentPage.emptyState.title}
            </p>
            <p className="text-[12.5px] text-muted">
              {messages.contentPage.emptyState.description}
            </p>
            <button
              className="mt-2 rounded-[8px] bg-accent px-4 py-2 text-[12.5px] font-bold text-[#0d1b2a]"
              onClick={openNew}
              type="button"
            >
              {messages.contentPage.actions.newPost}
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[12px] border border-border">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-border bg-surface-subtle">
                  <th className="px-4 py-3 font-semibold text-muted">
                    {messages.contentPage.tableHeaders.title}
                  </th>
                  <th className="px-4 py-3 font-semibold text-muted">
                    {messages.contentPage.tableHeaders.author}
                  </th>
                  <th className="px-4 py-3 font-semibold text-muted">
                    {messages.contentPage.tableHeaders.status}
                  </th>
                  <th className="px-4 py-3 font-semibold text-muted">
                    {messages.contentPage.tableHeaders.date}
                  </th>
                  <th className="px-4 py-3 font-semibold text-muted">
                    {messages.contentPage.tableHeaders.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {posts.map((post) => (
                  <tr key={post.id} className="transition-colors hover:bg-surface-subtle">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{post.title}</div>
                      <div className="mt-0.5 truncate text-[11.5px] text-muted max-w-[380px]">
                        {post.summary}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{post.author}</td>
                    <td className="px-4 py-3">
                      <button
                        className="cursor-pointer"
                        onClick={() => void handleToggleStatus(post)}
                        title={messages.contentPage.toggleStatusTitle}
                        type="button"
                      >
                        <StatusBadge
                          label={
                            post.status === "published"
                              ? messages.contentPage.statusLabels.published
                              : messages.contentPage.statusLabels.draft
                          }
                          tone={post.status === "published" ? "success" : "neutral"}
                        />
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-muted">
                      {post.publishedAt
                        ? new Intl.DateTimeFormat(locale, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }).format(new Date(post.publishedAt))
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded-[6px] border border-border-strong bg-surface-subtle px-2.5 py-1 text-[11.5px] font-medium text-muted transition hover:bg-surface-muted hover:text-foreground"
                          onClick={() => openEdit(post)}
                          type="button"
                        >
                          {messages.contentPage.actions.edit}
                        </button>
                        <button
                          className="rounded-[6px] border border-red-300/30 bg-red-50/5 px-2.5 py-1 text-[11.5px] font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                          onClick={() => setPendingDeleteId(post.id)}
                          type="button"
                        >
                          {messages.contentPage.actions.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {draft !== null ? (
        <CatalogModalOverlay>
          <DialogFrame
            description={
              draft.id === null
                ? messages.contentPage.editor.newDescription
                : messages.contentPage.editor.editDescription
            }
            footer={
              <>
                <CatalogButton onClick={() => setDraft(null)} variant="secondary">
                  {messages.contentPage.editor.cancel}
                </CatalogButton>
                <CatalogButton
                  disabled={isSubmitting || !draft.title.trim() || !draft.slug.trim()}
                  onClick={() => void handleSave()}
                  variant="primary"
                >
                  {isSubmitting
                    ? messages.contentPage.editor.saving
                    : draft.id === null
                      ? messages.contentPage.editor.create
                      : messages.contentPage.editor.saveChanges}
                </CatalogButton>
              </>
            }
            onClose={() => setDraft(null)}
            title={
              draft.id === null
                ? messages.contentPage.editor.newTitle
                : messages.contentPage.editor.editTitle
            }
          >
            <div className="space-y-3">
              <BlogField label={messages.contentPage.fields.title}>
                <input
                  autoFocus
                  className="w-full rounded-[8px] border border-border bg-surface-subtle px-3 py-2 text-[13px] text-foreground outline-none transition focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-glow)] placeholder:text-muted"
                  onChange={(e) => updateDraft("title", e.target.value)}
                  placeholder={messages.contentPage.placeholders.title}
                  value={draft.title}
                />
              </BlogField>
              <BlogField label={messages.contentPage.fields.slug}>
                <input
                  className="w-full rounded-[8px] border border-border bg-surface-subtle px-3 py-2 font-mono text-[12px] text-foreground outline-none transition focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-glow)] placeholder:text-muted"
                  onChange={(e) => updateDraft("slug", e.target.value)}
                  placeholder={messages.contentPage.placeholders.slug}
                  value={draft.slug}
                />
              </BlogField>
              <BlogField label={messages.contentPage.fields.author}>
                <input
                  className="w-full rounded-[8px] border border-border bg-surface-subtle px-3 py-2 text-[13px] text-foreground outline-none transition focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-glow)] placeholder:text-muted"
                  onChange={(e) => updateDraft("author", e.target.value)}
                  placeholder={messages.contentPage.placeholders.author}
                  value={draft.author}
                />
              </BlogField>
              <BlogField label={messages.contentPage.fields.status}>
                <select
                  className="rounded-[8px] border border-border bg-surface-subtle px-3 py-2 text-[13px] text-foreground outline-none transition focus:border-accent"
                  onChange={(e) => updateDraft("status", e.target.value as BlogPostStatus)}
                  value={draft.status}
                >
                  <option value="draft">{messages.contentPage.statusLabels.draft}</option>
                  <option value="published">{messages.contentPage.statusLabels.published}</option>
                </select>
              </BlogField>
              <BlogField label={messages.contentPage.fields.summary}>
                <textarea
                  className="w-full resize-none rounded-[8px] border border-border bg-surface-subtle px-3 py-2 text-[13px] leading-[1.6] text-foreground outline-none transition focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-glow)] placeholder:text-muted"
                  onChange={(e) => updateDraft("summary", e.target.value)}
                  placeholder={messages.contentPage.placeholders.summary}
                  rows={2}
                  value={draft.summary}
                />
              </BlogField>
              <BlogField label={messages.contentPage.fields.body}>
                <textarea
                  className="w-full resize-y rounded-[8px] border border-border bg-surface-subtle px-3 py-2 font-mono text-[12px] leading-[1.7] text-foreground outline-none transition focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-glow)] placeholder:text-muted"
                  onChange={(e) => updateDraft("body", e.target.value)}
                  placeholder={messages.contentPage.placeholders.body}
                  rows={10}
                  value={draft.body}
                />
              </BlogField>
            </div>
          </DialogFrame>
        </CatalogModalOverlay>
      ) : null}

      {/* Delete confirmation */}
      {pendingDeleteId !== null ? (
        <CatalogModalOverlay>
          <DialogFrame
            description={messages.contentPage.deleteDialog.description}
            footer={
              <>
                <CatalogButton
                  disabled={isDeleting}
                  onClick={() => setPendingDeleteId(null)}
                  variant="secondary"
                >
                  {messages.contentPage.deleteDialog.cancel}
                </CatalogButton>
                <CatalogButton
                  disabled={isDeleting}
                  onClick={() => void handleDelete(pendingDeleteId)}
                  variant="danger"
                >
                  {isDeleting
                    ? messages.contentPage.deleteDialog.deleting
                    : messages.contentPage.deleteDialog.delete}
                </CatalogButton>
              </>
            }
            onClose={() => setPendingDeleteId(null)}
            title={messages.contentPage.deleteDialog.title}
          >
            <p className="text-[13px] leading-[1.6] text-muted">
              {pendingDeletePost?.title ?? messages.contentPage.deleteDialog.postFallback}
            </p>
          </DialogFrame>
        </CatalogModalOverlay>
      ) : null}

      {placeholderAction !== null ? (
        <PlaceholderActionDialog
          description={placeholderAction.description}
          onClose={() => setPlaceholderAction(null)}
          title={placeholderAction.title}
        />
      ) : null}
    </div>
  );
}

function BlogField({
  children,
  label,
}: Readonly<{ children: React.ReactNode; label: string }>) {
  return (
    <div>
      <label className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
