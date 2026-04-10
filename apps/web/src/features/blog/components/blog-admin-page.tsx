"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceHeader } from "@/features/catalog/components/workspace-catalog-blocks";
import { CatalogButton, StatusBadge } from "@/features/catalog/components/catalog-primitives";
import { CatalogModalOverlay, PlaceholderActionDialog } from "@/features/catalog/components/catalog-dialogs";
import { DialogFrame } from "@/features/catalog/components/settings-catalog-blocks";
import type { BlogPost, BlogPostStatus } from "@/features/blog/domain/blog-post";
import { useUiI18n } from "@/features/i18n/components/ui-i18n-provider";

export function BlogAdminPage({ orgId: _orgId }: Readonly<{ orgId?: string }>) {
  const router = useRouter();
  const { locale, messages } = useUiI18n();

  const [posts, setPosts] = useState<readonly BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [placeholderAction, setPlaceholderAction] = useState<{
    title: string;
    description?: string;
  } | null>(null);

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
            onClick: () => router.push("/content/new"),
            variant: "primary",
          },
          {
            label: messages.contentPage.actions.viewPublicBlog,
            onClick: () => window.open("/blog", "_blank"),
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
              onClick={() => router.push("/content/new")}
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
                      <div className="mt-0.5 max-w-[380px] truncate text-[11.5px] text-muted">
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
                        : "â€”"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded-[6px] border border-border-strong bg-surface-subtle px-2.5 py-1 text-[11.5px] font-medium text-muted transition hover:bg-surface-muted hover:text-foreground"
                          onClick={() => router.push(`/content/${post.id}`)}
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

      {/* Delete confirmation dialog */}
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
