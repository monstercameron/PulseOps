import Link from "next/link";
import { blogRepository } from "@/features/blog/server/blog-repository";

export const dynamic = "force-dynamic";

export default function Blog() {
  const allPosts = blogRepository.list();
  const published = allPosts.filter((p) => p.status === "published");
  const [featured, ...rest] = published;

  return (
    <main className="min-h-screen bg-background px-6 py-12 md:px-10 md:py-16">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Blog</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Insights for field-service operators
        </h1>
        <p className="mt-3 text-[15px] leading-7 text-muted">
          Practical thinking on cash flow, job margin, and running a tighter operation.
        </p>

        {published.length === 0 ? (
          <div className="mt-12 rounded-[12px] border border-border bg-card p-8 text-center">
            <p className="text-[14px] text-muted">No posts published yet — check back soon.</p>
          </div>
        ) : (
          <>
            {featured ? (
              <div className="mt-10 rounded-[14px] border border-border bg-card p-8">
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-accent">
                  Featured
                </p>
                <h2 className="mt-3 text-xl font-bold tracking-tight text-foreground">
                  {featured.title}
                </h2>
                <p className="mt-2 text-[13.5px] leading-[1.7] text-muted">{featured.summary}</p>
                <div className="mt-4 flex items-center gap-3 text-[12px] text-muted">
                  <span>{featured.author}</span>
                  {featured.publishedAt ? (
                    <>
                      <span>·</span>
                      <span>
                        {new Intl.DateTimeFormat("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(featured.publishedAt))}
                      </span>
                    </>
                  ) : null}
                </div>
                <div className="mt-5 whitespace-pre-line text-[13.5px] leading-[1.8] text-foreground/80">
                  {featured.body}
                </div>
              </div>
            ) : null}

            {rest.length > 0 ? (
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {rest.map((post) => (
                  <div
                    key={post.id}
                    className="flex flex-col rounded-[12px] border border-border bg-card p-6"
                  >
                    <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                      {post.title}
                    </h3>
                    <p className="mt-2 flex-1 text-[13px] leading-[1.65] text-muted">
                      {post.summary}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-[11.5px] text-muted">
                      <span>{post.author}</span>
                      {post.publishedAt ? (
                        <>
                          <span>·</span>
                          <span>
                            {new Intl.DateTimeFormat("en-US", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }).format(new Date(post.publishedAt))}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        )}

        <div className="mt-12 border-t border-border pt-8 text-center">
          <Link
            className="text-[13px] font-semibold text-accent hover:underline"
            href="/signup"
          >
            Get weekly cash &amp; margin insights →
          </Link>
        </div>
      </div>
    </main>
  );
}
