"use client";

import Link from "next/link";
import type { ReactNode } from "react";

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

function renderShell(pathName: ShellPath, children: ReactNode) {
  return (
    <MarketingShell
      ctaHref={marketingShellContent.ctaHref}
      ctaLabel={marketingShellContent.ctaLabel}
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

export function MarketingHomePage() {
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

export function ContactPage() {
  const { messages, resolveTree } = useUiI18n();
  const content = resolveTree("marketing.contact", contactPageContent);

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
            {content.channels.map((channel) => (
              <CatalogCard key={channel.title} className="p-6 shadow-none">
                <p className="text-lg font-semibold tracking-tight text-foreground">
                  {channel.title}
                </p>
                <p className="mt-2 text-sm leading-7 text-muted">{channel.description}</p>
                <p className="mt-4 text-sm font-semibold text-accent">{channel.action}</p>
              </CatalogCard>
            ))}
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
