"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

import { CatalogCard } from "@/features/catalog/components/catalog-primitives";
import {
  CallToActionBanner,
  PricingCard,
  QuestionCard,
  TestimonialCard,
  WorkflowStepCard,
} from "@/features/catalog/components/marketing-catalog-blocks";
import {
  aboutPageContent,
  blogPageContent,
  careersPageContent,
  contactPageContent,
  helpPageContent,
  homePageContent,
  loginPageContent,
  marketingFooterGroups,
  marketingNavigationLinks,
  marketingShellContent,
  pressPageContent,
  privacyPageContent,
  signupPageContent,
  termsPageContent,
} from "@/features/marketing/constants/marketing-content";
import {
  buildWebsiteContactRoutes,
  buildWebsiteFooterContacts,
  normalizeTelephoneHref,
  fallbackWebsiteDetails,
  type WebsiteDetails,
} from "@/features/marketing/domain/website-details";
import {
  AuthFormCard,
  AuthSplitLayout,
  LegalDocument,
  MarketingChecklist,
  MarketingFaqGroup,
  MarketingInfoCard,
  MarketingPageHero,
  MarketingSection,
} from "@/features/marketing/components/marketing-page-blocks";
import { MarketingShell } from "@/features/marketing/components/marketing-shell";
import { useUiI18n } from "@/features/i18n/components/ui-i18n-provider";

type ShellPath =
  | "/"
  | "/about"
  | "/blog"
  | "/careers"
  | "/contact"
  | "/help"
  | "/login"
  | "/press"
  | "/privacy"
  | "/signup"
  | "/terms";

type MarketingWebsiteProps = Readonly<{
  websiteDetails?: WebsiteDetails;
}>;

function renderShell(
  pathName: ShellPath,
  children: ReactNode,
  websiteDetails?: WebsiteDetails,
) {
  return (
    <MarketingShell
      ctaHref={marketingShellContent.ctaHref}
      ctaLabel={marketingShellContent.ctaLabel}
      footerContacts={
        websiteDetails ? buildWebsiteFooterContacts(websiteDetails) : undefined
      }
      footerDescription={marketingShellContent.footerDescription}
      footerGroups={marketingFooterGroups}
      footerTagline={marketingShellContent.footerTagline}
      navLinks={marketingNavigationLinks}
      pathName={pathName}
    >
      {children}
    </MarketingShell>
  );
}

export function MarketingHomePage({
  websiteDetails = fallbackWebsiteDetails,
}: MarketingWebsiteProps) {
  const { messages, resolveTree } = useUiI18n();
  const content = resolveTree("marketing.home", homePageContent);

  return renderShell(
    "/",
    <>
      <MarketingPageHero
        actions={content.hero.actions}
        description={content.hero.description}
        eyebrow={content.hero.eyebrow}
        footerNote={content.hero.footerNote}
        stats={content.hero.stats}
        title={content.hero.title}
      />

      <MarketingSection
        description={content.pain.description}
        eyebrow={content.pain.eyebrow}
        title={content.pain.title}
        tone="white"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {content.pain.items.map((item) => (
            <MarketingInfoCard
              key={item.title}
              description={item.description}
              icon={item.icon}
              title={item.title}
              tone="warning"
            />
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        description={content.workflow.description}
        eyebrow={content.workflow.eyebrow}
        id="how-it-works"
        title={content.workflow.title}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          {content.workflow.steps.map((step) => (
            <WorkflowStepCard
              key={step.step}
              description={step.description}
              step={step.step}
              title={step.title}
            />
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {messages.marketing.shared.worksWithLabel}
          </span>
          {content.workflow.connectors.map((connector) => (
            <span
              key={connector}
              className="rounded-xl border border-border bg-white px-3 py-1.5 text-sm font-medium text-muted"
            >
              {connector}
            </span>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        description={content.questions.description}
        eyebrow={content.questions.eyebrow}
        id="questions"
        title={content.questions.title}
        tone="dark"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {content.questions.items.map((item) => (
            <QuestionCard
              key={item.title}
              description={item.description}
              icon={item.icon}
              title={item.title}
            />
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        description={content.preview.description}
        eyebrow={content.preview.eyebrow}
        title={content.preview.title}
        tone="white"
      >
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <MarketingChecklist items={content.preview.checklist} />
          </div>
          <CatalogCard
            className="bg-[linear-gradient(145deg,#0d1b2a_0%,#12304b_100%)] p-6 text-white"
            tone="shell"
          >
            <div className="border-b border-white/[0.08] pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                {messages.marketing.shared.sampleBriefTitle}
              </p>
              <p className="mt-2 text-sm text-[#84a0ba]">
                {messages.marketing.shared.sampleBriefSubtitle}
              </p>
            </div>
            <div className="mt-5 space-y-3">
              {content.preview.recommendations.map((recommendation) => (
                <div
                  key={recommendation.title}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.05] p-4"
                >
                  <p className="text-sm font-semibold text-white">{recommendation.title}</p>
                  <p className="mt-2 text-sm leading-7 text-[#9db2c7]">
                    {recommendation.summary}
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-accent">
                    {recommendation.detail}
                  </p>
                </div>
              ))}
            </div>
          </CatalogCard>
        </div>
      </MarketingSection>

      <MarketingSection
        description={content.difference.description}
        eyebrow={content.difference.eyebrow}
        id="difference"
        title={content.difference.title}
      >
        <div className="grid gap-5 md:grid-cols-3">
          {content.difference.items.map((item) => (
            <MarketingInfoCard
              key={item.title}
              description={item.description}
              icon={item.icon}
              title={item.title}
            />
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        description={content.industries.description}
        eyebrow={content.industries.eyebrow}
        title={content.industries.title}
        tone="white"
      >
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {content.industries.items.map((item) => (
            <CatalogCard key={item} className="p-4 text-center shadow-none">
              <p className="text-sm font-semibold text-foreground">{item}</p>
            </CatalogCard>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted">{content.industries.note}</p>
      </MarketingSection>

      <MarketingSection
        eyebrow={content.testimonials.eyebrow}
        title={content.testimonials.title}
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {content.testimonials.items.map((item) => (
            <TestimonialCard
              key={item.name}
              company={item.company}
              initials={item.initials}
              name={item.name}
              quote={item.quote}
            />
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        description={content.pricing.description}
        eyebrow={content.pricing.eyebrow}
        id="pricing"
        title={content.pricing.title}
        tone="white"
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {content.pricing.tiers.map((tier) => (
            <PricingCard
              key={tier.name}
              ctaLabel={tier.ctaLabel}
              description={tier.description}
              featured={("featured" in tier ? tier.featured : undefined) ?? false}
              featuredLabel={
                "featuredLabel" in tier ? tier.featuredLabel : undefined
              }
              name={tier.name}
              points={tier.points}
              price={tier.price}
              priceSuffix={tier.priceSuffix}
            />
          ))}
        </div>
      </MarketingSection>

      <div className="px-6 py-12 md:px-10 md:py-16">
        <div className="mx-auto max-w-7xl">
          <CallToActionBanner
            description={content.cta.description}
            primaryAction={content.cta.primaryAction}
            secondaryAction={content.cta.secondaryAction}
            title={content.cta.title}
          />
        </div>
      </div>
    </>,
    websiteDetails,
  );
}

export function AboutPage() {
  const { messages, resolveTree } = useUiI18n();
  const content = resolveTree("marketing.about", aboutPageContent);

  return renderShell(
    "/about",
    <>
      <MarketingPageHero
        description={content.hero.description}
        eyebrow={content.hero.eyebrow}
        title={content.hero.title}
      />
      <MarketingSection
        description={content.story}
        eyebrow={messages.marketing.shared.aboutMissionEyebrow}
        title={content.mission}
        tone="white"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {content.stats.map((stat) => (
            <CatalogCard key={stat.detail} className="p-6 shadow-none">
              <p className="text-3xl font-semibold tracking-tight text-foreground">
                {stat.value}
              </p>
              <p className="mt-2 text-sm leading-7 text-muted">{stat.detail}</p>
            </CatalogCard>
          ))}
        </div>
      </MarketingSection>
      <MarketingSection
        eyebrow={messages.marketing.shared.aboutValuesEyebrow}
        title={messages.marketing.shared.aboutValuesTitle}
      >
        <div className="grid gap-5 md:grid-cols-3">
          {content.values.map((value) => (
            <MarketingInfoCard
              key={value.title}
              description={value.description}
              title={value.title}
            />
          ))}
        </div>
      </MarketingSection>
      <MarketingSection
        eyebrow={messages.marketing.shared.aboutTeamEyebrow}
        title={messages.marketing.shared.aboutTeamTitle}
      >
        <div className="grid gap-5 md:grid-cols-3">
          {content.team.map((member) => (
            <CatalogCard key={member.name} className="p-6 shadow-none">
              <p className="text-lg font-semibold tracking-tight text-foreground">
                {member.name}
              </p>
              <p className="mt-1 text-sm font-medium text-accent">{member.role}</p>
              <p className="mt-3 text-sm leading-7 text-muted">{member.description}</p>
            </CatalogCard>
          ))}
        </div>
      </MarketingSection>
      <div className="px-6 py-12 md:px-10 md:py-16">
        <div className="mx-auto max-w-7xl">
          <CallToActionBanner
            description={content.cta.description}
            primaryAction={content.cta.primaryAction}
            secondaryAction={content.cta.secondaryAction}
            title={content.cta.title}
          />
        </div>
      </div>
    </>,
  );
}

// ─── Dynamic Blog Page (API-driven) ──────────────────────────────────────────

export type DynamicBlogPost = Readonly<{
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  author: string;
  publishedAt: string | null;
}>;

type DynamicBlogPageProps = Readonly<{
  posts: readonly DynamicBlogPost[];
}>;

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

const POSTS_PER_PAGE = 6;

export function DynamicBlogPage({ posts }: DynamicBlogPageProps) {
  const [visible, setVisible] = useState(POSTS_PER_PAGE);

  const [featured, ...grid] = posts;
  const visibleGrid = grid.slice(0, visible - 1); // -1 because featured takes one slot
  const hasMore = visible - 1 < grid.length;

  return renderShell(
    "/blog",
    <>
      {/* Hero */}
      <section
        className="px-6 py-16 text-white md:px-12 md:py-20"
        style={{
          backgroundColor: "#0b1929",
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,.045) 1px, transparent 0), linear-gradient(150deg, #0b1929 0%, #0d1e30 60%, #0c2640 100%)",
          backgroundSize: "32px 32px, cover",
        }}
      >
        <div className="mx-auto max-w-[800px]">
          <div className="mb-8 flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/[.08] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[.09em] text-accent">
              Blog
            </span>
            <a
              aria-label="RSS feed"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.06] px-3 py-1.5 text-[11px] font-semibold text-[#94afc7] transition-colors hover:border-accent/40 hover:text-accent"
              href="/blog/rss.xml"
              rel="alternate"
              title="Subscribe via RSS"
              type="application/rss+xml"
            >
              <svg aria-hidden="true" fill="currentColor" height="13" viewBox="0 0 24 24" width="13" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/>
              </svg>
              RSS
            </a>
          </div>
          <h1 className="mb-5 text-[clamp(2rem,5vw,3rem)] font-extrabold leading-[1.12] tracking-tight">
            Practical thinking for service business owners.
          </h1>
          <p className="max-w-[520px] text-[1.05rem] leading-relaxed text-[#94afc7]">
            Cash flow, job margin, pricing, and ops — written for field service businesses.
          </p>
        </div>
      </section>

      {/* Featured post */}
      {posts.length === 0 ? (
        <section className="border-b border-[#e8eff5] bg-white px-6 py-10 md:px-12">
          <div className="mx-auto max-w-[1080px]">
            <p className="text-sm text-[#4e6278]">No posts published yet — check back soon.</p>
          </div>
        </section>
      ) : featured ? (
        <section className="border-b border-[#e8eff5] bg-white px-6 py-10 md:px-12">
          <div className="mx-auto max-w-[1080px]">
            <p className="mb-5 text-xs font-bold uppercase tracking-[.09em] text-accent">
              Featured
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="rounded-full bg-accent/[.10] px-3 py-1 text-[.75rem] font-semibold text-accent">
                Blog
              </span>
              {featured.publishedAt ? (
                <span className="text-[.75rem] font-medium text-[#7a9ab4]">
                  {formatDate(featured.publishedAt)}
                </span>
              ) : null}
            </div>
            <Link href={`/blog/${featured.slug}`}>
              <h2 className="mb-3 text-[clamp(1.55rem,3vw,2.2rem)] font-extrabold leading-[1.15] tracking-tight text-[#0d1b2a] hover:text-accent transition-colors">
                {featured.title}
              </h2>
            </Link>
            {featured.summary ? (
              <p className="mb-5 max-w-[640px] text-[1rem] font-medium leading-relaxed text-[#4e6278]">
                {featured.summary}
              </p>
            ) : null}
            <Link
              className="text-[.9rem] font-semibold text-accent hover:underline"
              href={`/blog/${featured.slug}`}
            >
              Read the article →
            </Link>
          </div>
        </section>
      ) : null}

      {/* Posts grid */}
      {visibleGrid.length > 0 ? (
        <section className="bg-white px-6 py-12 md:px-12 md:py-16">
          <div className="mx-auto max-w-[1080px]">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleGrid.map((post) => (
                <Link key={post.id} className="group flex flex-col" href={`/blog/${post.slug}`}>
                  <article className="flex h-full flex-col rounded-2xl border border-[#e4edf5] bg-[#f4f6f9] p-6 transition-shadow group-hover:shadow-md">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-accent/[.10] px-2.5 py-0.5 text-[.72rem] font-semibold text-accent">
                        Blog
                      </span>
                      {post.publishedAt ? (
                        <span className="text-[.72rem] text-[#7a9ab4]">
                          {formatDate(post.publishedAt)}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mb-2 flex-1 text-[1.05rem] font-extrabold leading-snug text-[#0d1b2a] group-hover:text-accent transition-colors">
                      {post.title}
                    </h3>
                    {post.summary ? (
                      <p className="mb-4 text-[.875rem] leading-relaxed text-[#4e6278] line-clamp-3">
                        {post.summary}
                      </p>
                    ) : null}
                    <span className="mt-auto text-[.84rem] font-semibold text-accent group-hover:underline">
                      Read more →
                    </span>
                  </article>
                </Link>
              ))}
            </div>

            {hasMore ? (
              <div className="mt-10 text-center">
                <button
                  className="inline-block rounded-xl border border-[#c8d8e6] px-6 py-3 text-[.9rem] font-semibold text-[#0d1b2a] transition-colors hover:border-accent hover:text-accent"
                  type="button"
                  onClick={() => { setVisible((v) => v + POSTS_PER_PAGE); }}
                >
                  Load more articles
                </button>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Newsletter CTA */}
      <section className="bg-[#0d1b2a] px-6 py-14 text-center md:px-12 md:py-20">
        <div className="mx-auto max-w-[520px]">
          <h2 className="mb-3 text-[clamp(1.4rem,3vw,2rem)] font-extrabold leading-[1.15] tracking-tight text-white">
            Get the weekly brief — free for 30 days.
          </h2>
          <p className="mb-7 text-[.95rem] leading-relaxed text-[#7a9ab4]">
            New articles and practical guides, directly to your inbox. No dashboards. No jargon.
          </p>
          <Link
            className="inline-block rounded-xl bg-accent px-8 py-3.5 text-[.95rem] font-bold text-[#0d1b2a] transition-colors hover:bg-[#00a98e]"
            href="/signup"
          >
            Start Free Trial
          </Link>
          <p className="mt-4 text-[.82rem] text-[#7a9ab4]">
            Learn more:{" "}
            <Link className="text-accent hover:underline" href="/about">
              About PulseOps
            </Link>
            {" · "}
            <Link className="text-accent hover:underline" href="/careers">
              {"We're hiring"}
            </Link>
          </p>
        </div>
      </section>
    </>,
  );
}

// ─── Dynamic Blog Post Page (full post view) ─────────────────────────────────

type DynamicBlogPostPageProps = Readonly<{
  post: DynamicBlogPost;
}>;

export function DynamicBlogPostPage({ post }: DynamicBlogPostPageProps) {
  return renderShell(
    "/blog",
    <>
      {/* Title hero — matches blog.html dark header motif */}
      <section
        className="px-6 py-14 text-white md:px-12 md:py-20"
        style={{
          backgroundColor: "#0b1929",
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,.045) 1px, transparent 0), linear-gradient(150deg, #0b1929 0%, #0d1e30 60%, #0c2640 100%)",
          backgroundSize: "32px 32px, cover",
        }}
      >
        <div className="mx-auto max-w-[760px]">
          <Link
            className="mb-6 inline-flex items-center gap-1.5 text-[.85rem] font-semibold text-[#94afc7] hover:text-accent transition-colors"
            href="/blog"
          >
            ← Back to blog
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent/[.12] px-3 py-1 text-[.75rem] font-semibold text-accent">
              Blog
            </span>
            {post.publishedAt ? (
              <span className="text-[.8rem] text-[#7a9ab4]">{formatDate(post.publishedAt)}</span>
            ) : null}
            {post.author ? (
              <span className="text-[.8rem] text-[#7a9ab4]">· {post.author}</span>
            ) : null}
          </div>
          <h1 className="mt-5 text-[clamp(1.7rem,4vw,2.6rem)] font-extrabold leading-[1.12] tracking-tight">
            {post.title}
          </h1>
          {post.summary ? (
            <p className="mt-4 max-w-[600px] text-[1rem] leading-relaxed text-[#94afc7]">
              {post.summary}
            </p>
          ) : null}
        </div>
      </section>

      {/* Article body */}
      <section className="bg-white px-6 py-12 text-[#0d1b2a] md:px-12 md:py-16">
        <div className="mx-auto max-w-[760px]">
          <div className="blog-prose text-[#0d1b2a]">
            <ReactMarkdown
              rehypePlugins={[rehypeSanitize]}
              remarkPlugins={[remarkGfm]}
            >
              {post.body}
            </ReactMarkdown>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-[#0d1b2a] px-6 py-14 text-center md:px-12 md:py-20">
        <div className="mx-auto max-w-[520px]">
          <h2 className="mb-3 text-[clamp(1.3rem,3vw,1.8rem)] font-extrabold leading-[1.15] tracking-tight text-white">
            Get the weekly brief — free for 30 days.
          </h2>
          <p className="mb-7 text-[.95rem] leading-relaxed text-[#7a9ab4]">
            Practical thinking delivered to your inbox. No dashboards. No jargon.
          </p>
          <Link
            className="inline-block rounded-xl bg-accent px-8 py-3.5 text-[.95rem] font-bold text-[#0d1b2a] transition-colors hover:bg-[#00a98e]"
            href="/signup"
          >
            Start Free Trial
          </Link>
        </div>
      </section>
    </>,
  );
}

// ─── Static Blog Page (legacy / fallback) ────────────────────────────────────

export function BlogPage() {
  const { messages, resolveTree } = useUiI18n();
  const content = resolveTree("marketing.blog", blogPageContent);

  return renderShell(
    "/blog",
    <>
      <MarketingPageHero
        description={content.hero.description}
        eyebrow={content.hero.eyebrow}
        title={content.hero.title}
      />
      <MarketingSection
        eyebrow={messages.marketing.shared.blogFeaturedEyebrow}
        title={content.featuredPost.title}
        tone="white"
      >
        <CatalogCard className="p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            {content.featuredPost.meta}
          </p>
          <p className="mt-4 text-base leading-8 text-muted">
            {content.featuredPost.summary}
          </p>
        </CatalogCard>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {content.posts.map((post) => (
            <CatalogCard key={post} className="flex h-full flex-col p-6 shadow-none">
              <p className="text-lg font-semibold tracking-tight text-foreground">{post}</p>
              <Link className="mt-4 text-sm font-semibold text-accent" href="/contact">
                {messages.marketing.shared.blogRequestArticle}
              </Link>
            </CatalogCard>
          ))}
        </div>
      </MarketingSection>
      <div className="px-6 py-12 md:px-10 md:py-16">
        <div className="mx-auto max-w-7xl">
          <CallToActionBanner
            description={content.cta.description}
            primaryAction={content.cta.primaryAction}
            secondaryAction={content.cta.secondaryAction}
            title={content.cta.title}
          />
        </div>
      </div>
    </>,
  );
}

export function CareersPage() {
  const { messages, resolveTree } = useUiI18n();
  const content = resolveTree("marketing.careers", careersPageContent);

  return renderShell(
    "/careers",
    <>
      <MarketingPageHero
        description={content.hero.description}
        eyebrow={content.hero.eyebrow}
        title={content.hero.title}
      />
      <MarketingSection
        eyebrow={messages.marketing.shared.careersWhyJoinEyebrow}
        title={messages.marketing.shared.careersWhyJoinTitle}
      >
        <div className="grid gap-5 md:grid-cols-3">
          {content.reasons.map((reason) => (
            <MarketingInfoCard
              key={reason.title}
              description={reason.description}
              title={reason.title}
            />
          ))}
        </div>
      </MarketingSection>
      <MarketingSection
        eyebrow={messages.marketing.shared.careersOpenRolesEyebrow}
        title={messages.marketing.shared.careersOpenRolesTitle}
        tone="white"
      >
        <div className="space-y-4">
          {content.openings.map((opening) => (
            <CatalogCard key={opening.title} className="p-6 shadow-none">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-lg font-semibold tracking-tight text-foreground">
                    {opening.title}
                  </p>
                  <p className="mt-1 text-sm font-medium text-accent">{opening.meta}</p>
                  <p className="mt-3 text-sm leading-7 text-muted">{opening.description}</p>
                </div>
                <Link className="text-sm font-semibold text-accent" href="/contact">
                  {messages.marketing.shared.careersApplyInterest}
                </Link>
              </div>
            </CatalogCard>
          ))}
        </div>
      </MarketingSection>
    </>,
  );
}

export function ContactPage({
  websiteDetails = fallbackWebsiteDetails,
}: MarketingWebsiteProps) {
  const { messages, resolveTree } = useUiI18n();
  const content = resolveTree("marketing.contact", contactPageContent);
  const contactRoutes = buildWebsiteContactRoutes(websiteDetails);

  return renderShell(
    "/contact",
    <>
      <MarketingPageHero
        description={content.hero.description}
        eyebrow={content.hero.eyebrow}
        title={content.hero.title}
      />
      <MarketingSection
        eyebrow={messages.marketing.shared.contactReachEyebrow}
        title={messages.marketing.shared.contactReachTitle}
        tone="white"
      >
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-4">
            {content.channels.map((channel, index) => {
              const route = contactRoutes[index] ?? contactRoutes[0];

              return (
                <CatalogCard key={channel.title} className="p-6 shadow-none">
                  <p className="text-lg font-semibold tracking-tight text-foreground">
                    {channel.title}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-muted">{channel.description}</p>
                  <div className="mt-4 space-y-2">
                    <a
                      className="block text-sm font-semibold text-accent transition-colors hover:text-accent/80"
                      href={`mailto:${route.email}`}
                    >
                      {route.email}
                    </a>
                    <a
                      className="block text-sm font-medium text-foreground transition-colors hover:text-accent"
                      href={`tel:${normalizeTelephoneHref(route.phone)}`}
                    >
                      {route.phone}
                    </a>
                  </div>
                </CatalogCard>
              );
            })}
          </div>
          <CatalogCard className="p-7">
            <p className="text-xl font-semibold tracking-tight text-foreground">
              {messages.marketing.shared.contactSendTitle}
            </p>
            <div className="mt-6 space-y-4">
              {content.formFields.map((field) => (
                <label key={field.label} className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    {field.label}
                  </span>
                  {field.label === "Message" ? (
                    <textarea
                      className="mt-2 min-h-[140px] w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted/55 focus:border-accent focus:ring-[3px] focus:ring-accent/12"
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <input
                      className="mt-2 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted/55 focus:border-accent focus:ring-[3px] focus:ring-accent/12"
                      placeholder={field.placeholder}
                      type={("type" in field ? field.type : undefined) ?? "text"}
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="mt-6">
              <Link href="/contact">
                <span className="inline-flex rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-slate-950">
                  {messages.marketing.shared.contactSendAction}
                </span>
              </Link>
            </div>
          </CatalogCard>
        </div>
      </MarketingSection>
    </>,
    websiteDetails,
  );
}

export function HelpPage() {
  const { messages, resolveTree } = useUiI18n();
  const content = resolveTree("marketing.help", helpPageContent);

  return renderShell(
    "/help",
    <>
      <MarketingPageHero
        description={content.hero.description}
        eyebrow={content.hero.eyebrow}
        title={content.hero.title}
      />
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10">
        <CatalogCard className="p-4 shadow-none">
          <label className="sr-only" htmlFor="help-search">
            {messages.marketing.shared.helpSearchPlaceholder}
          </label>
          <input
            id="help-search"
            className="w-full border-none bg-transparent text-base text-foreground outline-none placeholder:text-muted"
            placeholder={messages.marketing.shared.helpSearchPlaceholder}
            type="text"
          />
        </CatalogCard>
      </div>
      <div className="mx-auto grid max-w-7xl gap-5 px-6 pb-14 md:grid-cols-2 md:px-10 md:pb-20">
        {content.groups.map((group) => (
          <MarketingFaqGroup key={group.title} items={group.items} title={group.title} />
        ))}
      </div>
      <div className="px-6 py-12 md:px-10 md:py-16">
        <div className="mx-auto max-w-7xl">
          <CallToActionBanner
            description={content.cta.description}
            primaryAction={content.cta.primaryAction}
            secondaryAction={content.cta.secondaryAction}
            title={content.cta.title}
          />
        </div>
      </div>
    </>,
  );
}

export function PressPage() {
  const { messages, resolveTree } = useUiI18n();
  const content = resolveTree("marketing.press", pressPageContent);

  return renderShell(
    "/press",
    <>
      <MarketingPageHero
        description={content.hero.description}
        eyebrow={content.hero.eyebrow}
        title={content.hero.title}
      />
      <MarketingSection
        eyebrow={messages.marketing.shared.pressBoilerplateEyebrow}
        title={messages.marketing.shared.pressBoilerplateTitle}
        tone="white"
      >
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <CatalogCard className="p-7 shadow-none">
            <p className="text-base leading-8 text-muted">{content.boilerplate}</p>
          </CatalogCard>
          <div className="grid gap-4 md:grid-cols-2">
            {content.facts.map((fact) => (
              <CatalogCard key={fact.detail} className="p-6 shadow-none">
                <p className="text-2xl font-semibold tracking-tight text-foreground">
                  {fact.value}
                </p>
                <p className="mt-2 text-sm leading-7 text-muted">{fact.detail}</p>
              </CatalogCard>
            ))}
          </div>
        </div>
      </MarketingSection>
      <MarketingSection
        eyebrow={messages.marketing.shared.pressBrandEyebrow}
        title={messages.marketing.shared.pressBrandTitle}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {content.colors.map((color) => (
            <CatalogCard key={color.name} className="p-5 shadow-none">
              <div
                className="h-24 rounded-2xl"
                style={{ backgroundColor: color.value }}
              />
              <p className="mt-4 text-sm font-semibold text-foreground">{color.name}</p>
              <p className="mt-1 font-mono text-xs text-muted">{color.value}</p>
            </CatalogCard>
          ))}
        </div>
      </MarketingSection>
      <MarketingSection
        eyebrow={messages.marketing.shared.pressCoverageEyebrow}
        title={messages.marketing.shared.pressCoverageTitle}
        tone="white"
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {content.coverage.map((quote) => (
            <CatalogCard key={quote} className="p-6 shadow-none">
              <p className="text-sm leading-7 text-foreground-soft">{quote}</p>
            </CatalogCard>
          ))}
        </div>
        <div className="mt-8">
          <CallToActionBanner
            description={messages.marketing.shared.pressMediaDescription}
            primaryAction={messages.marketing.shared.pressMediaPrimary}
            secondaryAction={messages.marketing.shared.pressMediaSecondary}
            title={messages.marketing.shared.pressMediaTitle}
          />
        </div>
      </MarketingSection>
    </>,
  );
}

export function PrivacyPage() {
  const { resolveTree } = useUiI18n();
  const content = resolveTree("marketing.privacy", privacyPageContent);

  return renderShell(
    "/privacy",
    <LegalDocument
      intro={content.intro}
      sections={content.sections}
      title={content.title}
      updatedLabel={content.updatedLabel}
    />,
  );
}

export function TermsPage() {
  const { resolveTree } = useUiI18n();
  const content = resolveTree("marketing.terms", termsPageContent);

  return renderShell(
    "/terms",
    <LegalDocument
      intro={content.intro}
      sections={content.sections}
      title={content.title}
      updatedLabel={content.updatedLabel}
    />,
  );
}

export function LoginPage() {
  const { resolveTree } = useUiI18n();
  const content = resolveTree("marketing.login", loginPageContent);

  return renderShell(
    "/login",
    <AuthSplitLayout
      details={content.details}
      eyebrow={content.eyebrow}
      highlight={content.highlight}
      title={content.title}
    >
      <AuthFormCard
        actions={content.form.actions}
        fields={content.form.fields}
        footer={
          <>
            {content.form.footerPrompt}{" "}
            <Link className="font-semibold text-accent" href={content.form.footerLinkHref}>
              {content.form.footerLinkLabel}
            </Link>
          </>
        }
        subtitle={content.form.subtitle}
        title={content.form.title}
      />
    </AuthSplitLayout>,
  );
}

export function SignupPage() {
  const { resolveTree } = useUiI18n();
  const content = resolveTree("marketing.signup", signupPageContent);

  return renderShell(
    "/signup",
    <AuthSplitLayout
      details={content.details}
      eyebrow={content.eyebrow}
      highlight={content.highlight}
      title={content.title}
    >
      <AuthFormCard
        actions={content.form.actions}
        fields={content.form.fields}
        footer={
          <>
            {content.form.footerPrompt}{" "}
            <Link className="font-semibold text-accent" href={content.form.footerLinkHref}>
              {content.form.footerLinkLabel}
            </Link>
          </>
        }
        subtitle={content.form.subtitle}
        title={content.form.title}
      />
    </AuthSplitLayout>,
  );
}
