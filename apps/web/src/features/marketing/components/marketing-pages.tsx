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
  return renderShell(
    "/",
    <>
      <MarketingPageHero
        actions={homePageContent.hero.actions}
        description={homePageContent.hero.description}
        eyebrow={homePageContent.hero.eyebrow}
        footerNote={homePageContent.hero.footerNote}
        stats={homePageContent.hero.stats}
        title={homePageContent.hero.title}
      />

      <MarketingSection
        description={homePageContent.pain.description}
        eyebrow={homePageContent.pain.eyebrow}
        title={homePageContent.pain.title}
        tone="white"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {homePageContent.pain.items.map((item) => (
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
        description={homePageContent.workflow.description}
        eyebrow={homePageContent.workflow.eyebrow}
        id="how-it-works"
        title={homePageContent.workflow.title}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          {homePageContent.workflow.steps.map((step) => (
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
            Works with
          </span>
          {homePageContent.workflow.connectors.map((connector) => (
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
        description={homePageContent.questions.description}
        eyebrow={homePageContent.questions.eyebrow}
        id="questions"
        title={homePageContent.questions.title}
        tone="dark"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {homePageContent.questions.items.map((item) => (
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
        description={homePageContent.preview.description}
        eyebrow={homePageContent.preview.eyebrow}
        title={homePageContent.preview.title}
        tone="white"
      >
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <MarketingChecklist items={homePageContent.preview.checklist} />
          </div>
          <CatalogCard
            className="bg-[linear-gradient(145deg,#0d1b2a_0%,#12304b_100%)] p-6 text-white"
            tone="shell"
          >
            <div className="border-b border-white/[0.08] pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                Weekly Cash and Margin Brief
              </p>
              <p className="mt-2 text-sm text-[#84a0ba]">
                Week of Apr 14, 2026 - Precision Plumbing Co.
              </p>
            </div>
            <div className="mt-5 space-y-3">
              {homePageContent.preview.recommendations.map((recommendation) => (
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
        description={homePageContent.difference.description}
        eyebrow={homePageContent.difference.eyebrow}
        id="difference"
        title={homePageContent.difference.title}
      >
        <div className="grid gap-5 md:grid-cols-3">
          {homePageContent.difference.items.map((item) => (
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
        description={homePageContent.industries.description}
        eyebrow={homePageContent.industries.eyebrow}
        title={homePageContent.industries.title}
        tone="white"
      >
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {homePageContent.industries.items.map((item) => (
            <CatalogCard key={item} className="p-4 text-center shadow-none">
              <p className="text-sm font-semibold text-foreground">{item}</p>
            </CatalogCard>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted">{homePageContent.industries.note}</p>
      </MarketingSection>

      <MarketingSection
        eyebrow={homePageContent.testimonials.eyebrow}
        title={homePageContent.testimonials.title}
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {homePageContent.testimonials.items.map((item) => (
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
        description={homePageContent.pricing.description}
        eyebrow={homePageContent.pricing.eyebrow}
        id="pricing"
        title={homePageContent.pricing.title}
        tone="white"
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {homePageContent.pricing.tiers.map((tier) => (
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
            description={homePageContent.cta.description}
            primaryAction={homePageContent.cta.primaryAction}
            secondaryAction={homePageContent.cta.secondaryAction}
            title={homePageContent.cta.title}
          />
        </div>
      </div>
    </>,
  );
}

export function AboutPage() {
  return renderShell(
    "/about",
    <>
      <MarketingPageHero
        description={aboutPageContent.hero.description}
        eyebrow={aboutPageContent.hero.eyebrow}
        title={aboutPageContent.hero.title}
      />
      <MarketingSection
        description={aboutPageContent.story}
        eyebrow="Mission"
        title={aboutPageContent.mission}
        tone="white"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {aboutPageContent.stats.map((stat) => (
            <CatalogCard key={stat.detail} className="p-6 shadow-none">
              <p className="text-3xl font-semibold tracking-tight text-foreground">
                {stat.value}
              </p>
              <p className="mt-2 text-sm leading-7 text-muted">{stat.detail}</p>
            </CatalogCard>
          ))}
        </div>
      </MarketingSection>
      <MarketingSection eyebrow="What We Care About" title="A few things we care about deeply.">
        <div className="grid gap-5 md:grid-cols-3">
          {aboutPageContent.values.map((value) => (
            <MarketingInfoCard
              key={value.title}
              description={value.description}
              title={value.title}
            />
          ))}
        </div>
      </MarketingSection>
      <MarketingSection eyebrow="Team" title="People who have actually run the problem.">
        <div className="grid gap-5 md:grid-cols-3">
          {aboutPageContent.team.map((member) => (
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
            description={aboutPageContent.cta.description}
            primaryAction={aboutPageContent.cta.primaryAction}
            secondaryAction={aboutPageContent.cta.secondaryAction}
            title={aboutPageContent.cta.title}
          />
        </div>
      </div>
    </>,
  );
}

export function BlogPage() {
  return renderShell(
    "/blog",
    <>
      <MarketingPageHero
        description={blogPageContent.hero.description}
        eyebrow={blogPageContent.hero.eyebrow}
        title={blogPageContent.hero.title}
      />
      <MarketingSection eyebrow="Featured" title={blogPageContent.featuredPost.title} tone="white">
        <CatalogCard className="p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            {blogPageContent.featuredPost.meta}
          </p>
          <p className="mt-4 text-base leading-8 text-muted">
            {blogPageContent.featuredPost.summary}
          </p>
        </CatalogCard>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {blogPageContent.posts.map((post) => (
            <CatalogCard key={post} className="flex h-full flex-col p-6 shadow-none">
              <p className="text-lg font-semibold tracking-tight text-foreground">{post}</p>
              <Link className="mt-4 text-sm font-semibold text-accent" href="/contact">
                Request this article
              </Link>
            </CatalogCard>
          ))}
        </div>
      </MarketingSection>
      <div className="px-6 py-12 md:px-10 md:py-16">
        <div className="mx-auto max-w-7xl">
          <CallToActionBanner
            description={blogPageContent.cta.description}
            primaryAction={blogPageContent.cta.primaryAction}
            secondaryAction={blogPageContent.cta.secondaryAction}
            title={blogPageContent.cta.title}
          />
        </div>
      </div>
    </>,
  );
}

export function CareersPage() {
  return renderShell(
    "/careers",
    <>
      <MarketingPageHero
        description={careersPageContent.hero.description}
        eyebrow={careersPageContent.hero.eyebrow}
        title={careersPageContent.hero.title}
      />
      <MarketingSection eyebrow="Why Join" title="We are small by design. Everyone ships real work.">
        <div className="grid gap-5 md:grid-cols-3">
          {careersPageContent.reasons.map((reason) => (
            <MarketingInfoCard
              key={reason.title}
              description={reason.description}
              title={reason.title}
            />
          ))}
        </div>
      </MarketingSection>
      <MarketingSection eyebrow="Open Roles" title="Current openings" tone="white">
        <div className="space-y-4">
          {careersPageContent.openings.map((opening) => (
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
                  Apply interest
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
  return renderShell(
    "/contact",
    <>
      <MarketingPageHero
        description={contactPageContent.hero.description}
        eyebrow={contactPageContent.hero.eyebrow}
        title={contactPageContent.hero.title}
      />
      <MarketingSection eyebrow="Reach Us" title="Other ways to reach the team" tone="white">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-4">
            {contactPageContent.channels.map((channel) => (
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
              Send us a message
            </p>
            <div className="mt-6 space-y-4">
              {contactPageContent.formFields.map((field) => (
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
                  Send message
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
  return renderShell(
    "/help",
    <>
      <MarketingPageHero
        description={helpPageContent.hero.description}
        eyebrow={helpPageContent.hero.eyebrow}
        title={helpPageContent.hero.title}
      />
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10">
        <CatalogCard className="p-4 shadow-none">
          <input
            className="w-full border-none bg-transparent text-base text-foreground outline-none placeholder:text-muted"
            placeholder="Search the help center"
            type="text"
          />
        </CatalogCard>
      </div>
      <div className="mx-auto grid max-w-7xl gap-5 px-6 pb-14 md:grid-cols-2 md:px-10 md:pb-20">
        {helpPageContent.groups.map((group) => (
          <MarketingFaqGroup key={group.title} items={group.items} title={group.title} />
        ))}
      </div>
      <div className="px-6 py-12 md:px-10 md:py-16">
        <div className="mx-auto max-w-7xl">
          <CallToActionBanner
            description={helpPageContent.cta.description}
            primaryAction={helpPageContent.cta.primaryAction}
            secondaryAction={helpPageContent.cta.secondaryAction}
            title={helpPageContent.cta.title}
          />
        </div>
      </div>
    </>,
  );
}

export function PressPage() {
  return renderShell(
    "/press",
    <>
      <MarketingPageHero
        description={pressPageContent.hero.description}
        eyebrow={pressPageContent.hero.eyebrow}
        title={pressPageContent.hero.title}
      />
      <MarketingSection eyebrow="Company Boilerplate" title="Company boilerplate" tone="white">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <CatalogCard className="p-7 shadow-none">
            <p className="text-base leading-8 text-muted">{pressPageContent.boilerplate}</p>
          </CatalogCard>
          <div className="grid gap-4 md:grid-cols-2">
            {pressPageContent.facts.map((fact) => (
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
      <MarketingSection eyebrow="Brand" title="Logos and color palette">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pressPageContent.colors.map((color) => (
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
      <MarketingSection eyebrow="Coverage" title="Recent press coverage" tone="white">
        <div className="grid gap-4 lg:grid-cols-3">
          {pressPageContent.coverage.map((quote) => (
            <CatalogCard key={quote} className="p-6 shadow-none">
              <p className="text-sm leading-7 text-foreground-soft">{quote}</p>
            </CatalogCard>
          ))}
        </div>
        <div className="mt-8">
          <CallToActionBanner
            description="For interviews, logos, product screenshots, or background material, contact the media team."
            primaryAction="press@pulseops.io"
            secondaryAction="Contact Us"
            title="Media inquiries"
          />
        </div>
      </MarketingSection>
    </>,
  );
}

export function PrivacyPage() {
  return renderShell(
    "/privacy",
    <LegalDocument
      intro={privacyPageContent.intro}
      sections={privacyPageContent.sections}
      title={privacyPageContent.title}
      updatedLabel={privacyPageContent.updatedLabel}
    />,
  );
}

export function TermsPage() {
  return renderShell(
    "/terms",
    <LegalDocument
      intro={termsPageContent.intro}
      sections={termsPageContent.sections}
      title={termsPageContent.title}
      updatedLabel={termsPageContent.updatedLabel}
    />,
  );
}

export function LoginPage() {
  return renderShell(
    "/login",
    <AuthSplitLayout
      details={loginPageContent.details}
      eyebrow={loginPageContent.eyebrow}
      highlight={loginPageContent.highlight}
      title={loginPageContent.title}
    >
      <AuthFormCard
        actions={loginPageContent.form.actions}
        fields={loginPageContent.form.fields}
        footer={
          <>
            {loginPageContent.form.footerPrompt}{" "}
            <Link className="font-semibold text-accent" href={loginPageContent.form.footerLinkHref}>
              {loginPageContent.form.footerLinkLabel}
            </Link>
          </>
        }
        subtitle={loginPageContent.form.subtitle}
        title={loginPageContent.form.title}
      />
    </AuthSplitLayout>,
  );
}

export function SignupPage() {
  return renderShell(
    "/signup",
    <AuthSplitLayout
      details={signupPageContent.details}
      eyebrow={signupPageContent.eyebrow}
      highlight={signupPageContent.highlight}
      title={signupPageContent.title}
    >
      <AuthFormCard
        actions={signupPageContent.form.actions}
        fields={signupPageContent.form.fields}
        footer={
          <>
            {signupPageContent.form.footerPrompt}{" "}
            <Link className="font-semibold text-accent" href={signupPageContent.form.footerLinkHref}>
              {signupPageContent.form.footerLinkLabel}
            </Link>
          </>
        }
        subtitle={signupPageContent.form.subtitle}
        title={signupPageContent.form.title}
      />
    </AuthSplitLayout>,
  );
}
