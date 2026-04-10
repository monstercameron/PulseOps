"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { CatalogCard } from "@/features/catalog/components/catalog-primitives";
import {
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
        title={
          <>
            Your service business runs on gut feelings.{" "}
            <span className="text-accent">Start running it on facts.</span>
          </>
        }
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
              className="rounded-lg border border-[#dde8f0] bg-white px-3.5 py-1.5 text-[.8rem] font-semibold text-[#4e6278]"
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
          <div className="bg-[#0e1e30] rounded-2xl p-5 md:p-7 shadow-[0_8px_40px_rgba(0,0,0,.22)] border border-white/[.06]">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/[.08]">
              <div>
                <span className="block text-[.75rem] font-semibold text-accent uppercase tracking-[.08em]">
                  ⚡ {messages.marketing.shared.sampleBriefTitle}
                </span>
                <span className="block text-[.72rem] text-[#7a9ab4] mt-0.5">
                  {messages.marketing.shared.sampleBriefSubtitle}
                </span>
              </div>
              <span className="bg-white/[.06] text-[#7a9ab4] text-[.7rem] font-semibold px-2.5 py-1 rounded-lg">
                {content.preview.recommendations.length} items
              </span>
            </div>
            <div className="space-y-3">
              {content.preview.recommendations.map((rec, i) => {
                const borderColors = ["#ff4d52", "#f5a623", "#00c9a7", "#f5a623"];
                const borderColor = borderColors[i % borderColors.length];
                const labels = [
                  "🚨 Pricing Gap · High Impact",
                  "🧾 Receivables · Chase Today",
                  "✅ Margin Win · Keep Going",
                  "📆 Cash Timing · Act This Week",
                ];
                const badges: { text: string; color: string; bg: string }[] = [
                  { text: "$2,400/mo", color: "#ff8084", bg: "rgba(255,77,82,.15)" },
                  { text: "$8,750 owed", color: "#f5a623", bg: "rgba(245,166,35,.15)" },
                ];
                const badge = badges[i];
                const isWin = i === 2;
                return (
                  <div
                    key={rec.title}
                    className="rounded-xl bg-white/[.04] p-4"
                    style={{ borderLeft: `3px solid ${borderColor}` }}
                  >
                    <div className="mb-1.5 flex items-start justify-between gap-2">
                      <span className="text-[.7rem] uppercase tracking-[.07em] text-[#8fa8be] font-semibold">
                        {labels[i] ?? `Item ${i + 1}`}
                      </span>
                      {badge ? (
                        <span
                          className="shrink-0 rounded px-2 py-0.5 text-[.68rem] font-semibold"
                          style={{ color: badge.color, backgroundColor: badge.bg }}
                        >
                          {badge.text}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[.87rem] text-white leading-snug">
                      <strong className={isWin ? "font-semibold text-accent" : "font-semibold"}>
                        {rec.title}
                      </strong>{" "}
                      {rec.summary}
                    </div>
                    <div className="text-[.72rem] text-[#5a7a96] mt-2">{rec.detail}</div>
                  </div>
                );
              })}
            </div>
            <div className="text-center text-[.72rem] text-[#4d6478] mt-5 pt-4 border-t border-white/[.06]">
              Next brief Monday 7:00 AM · {content.preview.recommendations.length} items this week
            </div>
          </div>
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
              navyIconBox
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
        {(() => {
          const industryEmoji: Record<string, string> = {
            "HVAC": "🔧",
            "Plumbing": "🚿",
            "Electrical": "⚡",
            "Landscaping": "🌿",
            "Pool Service": "🏊",
            "Cleaning": "🏠",
            "Pest Control": "🐛",
            "Garage Door": "🚪",
            "Light Construction": "🏗️",
            "Appliance Repair": "🔩",
          };
          return (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
              {content.industries.items.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-[#e4edf5] bg-[#f4f6f9] p-4 text-center transition hover:-translate-y-0.5"
                >
                  {industryEmoji[item] ? (
                    <div className="text-2xl mb-2">{industryEmoji[item]}</div>
                  ) : null}
                  <p className="text-[.83rem] font-semibold text-[#0d1b2a]">{item}</p>
                </div>
              ))}
            </div>
          );
        })()}
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
        <div className="mt-8 text-center">
          <Link className="text-accent text-[.9rem] font-semibold hover:underline" href="/blog">
            Read case studies and practical guides on our blog →
          </Link>
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
        <p className="mt-10 text-center text-[.85rem] text-[#7a9ab4]">
          Have questions?{" "}
          <Link className="text-accent hover:underline" href="/help">Check the Help Center</Link>
          {" "}or{" "}
          <Link className="text-accent hover:underline" href="/contact">talk to us directly</Link>.
        </p>
      </MarketingSection>

      <section
        className="px-6 py-16 text-center md:px-12 md:py-24"
        style={{ background: "linear-gradient(135deg, #00c9a7 0%, #00a0c8 100%)" }}
      >
        <div className="mx-auto max-w-[700px]">
          <h2 className="mb-4 text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold tracking-tight text-[#0d1b2a]">
            {content.cta.title}
          </h2>
          <p className="mb-7 text-[.97rem] leading-relaxed text-[#0d1b2a]/75">
            {content.cta.description}
          </p>
          <Link
            className="inline-block rounded-xl bg-[#0d1b2a] px-9 py-4 text-[.97rem] font-bold text-white shadow-[0_4px_20px_rgba(13,27,42,.3)] transition hover:bg-[#0b1929]"
            href="/signup"
          >
            {content.cta.primaryAction}
          </Link>
          <p className="mt-4 text-[.8rem] text-[#0d1b2a]/55">
            30-day free trial · Cancel anytime · No implementation fees
          </p>
        </div>
      </section>
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
        <div className="grid gap-4 md:grid-cols-2">
          <div className="text-[.97rem] leading-relaxed text-[#4e6278] space-y-4">
            <p>{content.story}</p>
          </div>
          <div className="rounded-2xl border border-[#e4edf5] bg-[#f4f6f9] p-6">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[.09em] text-accent">By the numbers</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {content.stats.map((stat) => (
                <div key={stat.detail}>
                  <p className="text-[2rem] font-extrabold leading-none text-accent">{stat.value}</p>
                  <p className="mt-1 text-[.82rem] text-[#4e6278]">{stat.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </MarketingSection>
      <MarketingSection
        eyebrow={messages.marketing.shared.aboutValuesEyebrow}
        title={messages.marketing.shared.aboutValuesTitle}
        tone="white"
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
            <div key={member.name} className="rounded-2xl border border-[#e4edf5] bg-white p-6">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#0d1b2a] text-lg font-extrabold text-accent">
                {member.name.split(" ").map((n: string) => n[0]).join("")}
              </div>
              <p className="text-[.97rem] font-bold tracking-tight text-[#0d1b2a]">
                {member.name}
              </p>
              <p className="mt-1 text-[.82rem] font-semibold text-accent">{member.role}</p>
              <p className="mt-3 text-[.85rem] leading-relaxed text-[#4e6278]">{member.description}</p>
            </div>
          ))}
        </div>
      </MarketingSection>
      <section className="bg-[#0d1b2a] px-6 py-14 text-center md:px-12 md:py-20">
        <div className="mx-auto max-w-[560px]">
          <h2 className="mb-4 text-[clamp(1.5rem,3vw,2.2rem)] font-extrabold leading-[1.12] tracking-tight text-white">
            {content.cta.title}
          </h2>
          <p className="mb-7 text-[.95rem] leading-relaxed text-[#7a9ab4]">
            {content.cta.description}
          </p>
          <Link
            className="inline-block rounded-xl bg-accent px-8 py-3.5 text-[.95rem] font-bold text-[#0d1b2a] transition hover:bg-[#00b898]"
            href="/signup"
          >
            {content.cta.primaryAction}
          </Link>
        </div>
      </section>
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
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
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
      <section className="bg-[#0d1b2a] px-6 py-14 text-center md:px-12 md:py-20">
        <div className="mx-auto max-w-[520px]">
          <h2 className="mb-3 text-[clamp(1.4rem,3vw,2rem)] font-extrabold leading-[1.15] tracking-tight text-white">
            {content.cta.title}
          </h2>
          <p className="mb-7 text-[.95rem] leading-relaxed text-[#7a9ab4]">{content.cta.description}</p>
          <Link
            className="inline-block rounded-xl bg-accent px-8 py-3.5 text-[.95rem] font-bold text-[#0d1b2a] transition hover:bg-[#00b898]"
            href="/signup"
          >
            {content.cta.primaryAction}
          </Link>
        </div>
      </section>
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
        tone="white"
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
      >
        <div className="mx-auto max-w-[800px] space-y-4">
          {content.openings.map((opening, i) => {
            const badgeColors = [
              "bg-accent/[.10] text-accent",
              "bg-[#ffc947]/[.15] text-[#b38600]",
              "bg-[#ff5a5f]/[.12] text-[#cc3338]",
              "bg-accent/[.10] text-accent",
            ];
            const badgeColor = badgeColors[i % badgeColors.length] ?? badgeColors[0];
            return (
              <div key={opening.title} className="rounded-2xl border border-[#e4edf5] bg-white p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[.72rem] font-semibold ${badgeColor}`}>
                        {opening.meta}
                      </span>
                    </div>
                    <p className="text-[.97rem] font-bold text-[#0d1b2a]">{opening.title}</p>
                    <p className="mt-2 text-[.85rem] leading-relaxed text-[#4e6278]">{opening.description}</p>
                  </div>
                  <Link
                    className="inline-block shrink-0 rounded-lg bg-accent px-5 py-2.5 text-[.85rem] font-semibold text-[#0d1b2a] transition hover:bg-[#00b898]"
                    href="/contact"
                  >
                    {messages.marketing.shared.careersApplyInterest}
                  </Link>
                </div>
              </div>
            );
          })}
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
        <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
          <div className="space-y-4">
            {content.channels.map((channel, index) => {
              const route = contactRoutes[index] ?? contactRoutes[0];

              return (
                <div key={channel.title} className="rounded-2xl border border-[#e4edf5] bg-[#f4f6f9] p-5">
                  <p className="text-[.97rem] font-bold text-[#0d1b2a]">{channel.title}</p>
                  <p className="mt-2 text-[.85rem] leading-relaxed text-[#4e6278]">{channel.description}</p>
                  <div className="mt-3 space-y-1">
                    <a
                      className="block text-[.85rem] font-semibold text-accent transition-colors hover:underline"
                      href={`mailto:${route.email}`}
                    >
                      {route.email}
                    </a>
                    <a
                      className="block text-[.85rem] text-[#4e6278] transition-colors hover:text-accent"
                      href={`tel:${normalizeTelephoneHref(route.phone)}`}
                    >
                      {route.phone}
                    </a>
                  </div>
                </div>
              );
            })}
            <div className="rounded-2xl border border-accent/20 bg-accent/[.07] p-5 text-[.85rem] leading-relaxed text-[#3a6268]">
              Looking for quick answers? Check our{" "}
              <Link className="font-semibold text-accent hover:underline" href="/help">
                Help Center
              </Link>
              {" "}first — most answers are there.
            </div>
          </div>
          <div className="rounded-2xl border border-[#e4edf5] bg-[#f4f6f9] p-7">
            <p className="text-[.97rem] font-bold text-[#0d1b2a]">
              {messages.marketing.shared.contactSendTitle}
            </p>
            <div className="mt-5 space-y-4">
              {content.formFields.map((field) => (
                <label key={field.label} className="block">
                  <span className="mb-1.5 block text-[.82rem] font-semibold text-[#0d1b2a]">
                    {field.label}
                  </span>
                  {field.label === "Message" ? (
                    <textarea
                      className="min-h-[140px] w-full rounded-xl border border-[#ccdae6] bg-white px-4 py-3 text-[.9rem] text-[#0d1b2a] outline-none transition placeholder:text-[#8fa8be]/70 focus:border-accent focus:shadow-[0_0_0_2px_#00c9a7]"
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <input
                      className="w-full rounded-xl border border-[#ccdae6] bg-white px-4 py-3 text-[.9rem] text-[#0d1b2a] outline-none transition placeholder:text-[#8fa8be]/70 focus:border-accent focus:shadow-[0_0_0_2px_#00c9a7]"
                      placeholder={field.placeholder}
                      type={("type" in field ? field.type : undefined) ?? "text"}
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="mt-6">
              <button
                className="w-full rounded-xl bg-accent px-6 py-3.5 text-[.93rem] font-bold text-[#0d1b2a] transition hover:bg-[#00b898]"
                type="button"
              >
                {messages.marketing.shared.contactSendAction}
              </button>
            </div>
          </div>
        </div>
      </MarketingSection>
    </>,
    websiteDetails,
  );
}

export function HelpPage() {
  const { resolveTree } = useUiI18n();
  const content = resolveTree("marketing.help", helpPageContent);

  return renderShell(
    "/help",
    <>
      <MarketingPageHero
        description={content.hero.description}
        eyebrow={content.hero.eyebrow}
        title={content.hero.title}
      />
      <div className="bg-white px-6 py-10 md:px-12">
        <div className="mx-auto max-w-[800px]">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {content.groups.map((group) => (
              <div
                key={group.title}
                className="group rounded-2xl border border-[#e4edf5] bg-[#f4f6f9] p-5 text-center transition-colors hover:border-accent"
              >
                <p className="text-[.88rem] font-semibold text-[#0d1b2a] group-hover:text-accent">
                  {group.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white px-6 py-12 md:px-12 md:py-16">
        <div className="mx-auto max-w-[800px] space-y-10">
          {content.groups.map((group) => (
            <div key={group.title}>
              <h2 className="mb-4 text-[.97rem] font-bold text-[#0d1b2a]">{group.title}</h2>
              <div className="space-y-3">
                {group.items.map((item) => (
                  <details key={item.question} className="overflow-hidden rounded-2xl border border-[#e4edf5] bg-[#f4f6f9]">
                    <summary className="flex cursor-pointer list-none items-center justify-between p-5">
                      <span className="text-[.93rem] font-semibold text-[#0d1b2a]">{item.question}</span>
                      <svg className="h-5 w-5 shrink-0 text-[#7a9ab4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </summary>
                    <p className="px-5 pb-5 text-[.88rem] leading-relaxed text-[#4e6278]">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="px-6 py-12 md:px-12 md:py-16">
        <div className="mx-auto max-w-[800px]">
          <div className="rounded-2xl bg-[#0d1b2a] p-7 text-center">
            <h3 className="mb-3 text-[1.15rem] font-extrabold tracking-tight text-white">
              {content.cta.title}
            </h3>
            <p className="mb-5 text-[.88rem] leading-relaxed text-[#7a9ab4]">{content.cta.description}</p>
            <Link
              className="inline-block rounded-xl bg-accent px-6 py-3 text-[.9rem] font-bold text-[#0d1b2a] transition hover:bg-[#00b898]"
              href="/contact"
            >
              {content.cta.primaryAction}
            </Link>
          </div>
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
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-2xl border border-[#e4edf5] bg-[#f4f6f9] p-6 text-[.88rem] leading-relaxed text-[#4e6278]">
            {content.boilerplate}
          </div>
          <div className="divide-y divide-[#e4edf5] rounded-2xl border border-[#e4edf5] bg-white">
            {content.facts.map((fact) => (
              <div key={fact.detail} className="flex items-center justify-between px-5 py-4">
                <span className="text-[.88rem] text-[#4e6278]">{fact.detail}</span>
                <span className="text-[.97rem] font-bold text-[#0d1b2a]">{fact.value}</span>
              </div>
            ))}
          </div>
        </div>
      </MarketingSection>
      <MarketingSection
        eyebrow={messages.marketing.shared.pressBrandEyebrow}
        title={messages.marketing.shared.pressBrandTitle}
      >
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {content.colors.map((color) => (
            <div key={color.name} className="rounded-2xl border border-[#e4edf5] bg-white p-5">
              <div
                className="h-16 rounded-xl"
                style={{ backgroundColor: color.value }}
              />
              <p className="mt-4 text-[.88rem] font-semibold text-[#0d1b2a]">{color.name}</p>
              <p className="mt-1 font-mono text-[.78rem] text-[#7a9ab4]">{color.value}</p>
            </div>
          ))}
        </div>
      </MarketingSection>
      <MarketingSection
        eyebrow={messages.marketing.shared.pressCoverageEyebrow}
        title={messages.marketing.shared.pressCoverageTitle}
        tone="white"
      >
        <div className="space-y-4">
          {content.coverage.map((quote) => (
            <div key={quote} className="rounded-2xl border border-[#e4edf5] bg-[#f4f6f9] p-6">
              <p className="text-[.88rem] leading-relaxed text-[#4e6278]">{quote}</p>
            </div>
          ))}
        </div>
      </MarketingSection>
      <section className="bg-[#0d1b2a] px-6 py-14 text-center md:px-12 md:py-20">
        <div className="mx-auto max-w-[560px]">
          <h2 className="mb-4 text-[clamp(1.4rem,3vw,2rem)] font-extrabold leading-[1.15] tracking-tight text-white">
            {messages.marketing.shared.pressMediaTitle}
          </h2>
          <p className="mb-7 text-[.95rem] leading-relaxed text-[#7a9ab4]">
            {messages.marketing.shared.pressMediaDescription}
          </p>
          <a
            className="inline-block rounded-xl bg-accent px-8 py-3.5 text-[.95rem] font-bold text-[#0d1b2a] transition hover:bg-[#00b898]"
            href="mailto:press@pulseops.io"
          >
            {messages.marketing.shared.pressMediaPrimary}
          </a>
        </div>
      </section>
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
