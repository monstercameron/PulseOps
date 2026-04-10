import type { ReactNode } from "react";

import {
  CatalogButton,
  CatalogCard,
  StatusBadge,
  cx,
} from "@/features/catalog/components/catalog-primitives";

type MarketingStat = Readonly<{
  detail: string;
  value: string;
}>;

type MarketingHeroProps = Readonly<{
  actions: readonly { label: string; variant?: "primary" | "secondary" }[];
  description: string;
  eyebrow: string;
  footerNote?: string;
  stats: readonly MarketingStat[];
  title: ReactNode;
}>;

export function MarketingHero({
  actions,
  description,
  eyebrow,
  footerNote,
  stats,
  title,
}: MarketingHeroProps) {
  return (
    <CatalogCard
      className="overflow-hidden bg-[linear-gradient(145deg,#0b1929_0%,#0d1e30_55%,#0c2640_100%)] px-8 py-9 text-white"
      tone="shell"
    >
      <div className="space-y-7">
        <div className="max-w-3xl">
          <StatusBadge label={eyebrow} tone="accent" />
          <h3 className="mt-5 text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-[1.08] tracking-tight">
            {title}
          </h3>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#9fb4c9]">
            {description}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {actions.map((action) => (
            <CatalogButton key={action.label} variant={action.variant ?? "secondary"}>
              {action.label}
            </CatalogButton>
          ))}
        </div>

        <div className="border-t border-white/[0.08] pt-6">
          <div className="grid gap-3 md:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.detail}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3"
              >
                <div className="text-2xl font-semibold tracking-tight text-white">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs leading-5 text-[#83a0b8]">{stat.detail}</div>
              </div>
            ))}
          </div>
          {footerNote ? <p className="mt-4 text-end text-xs text-[#56718a]">{footerNote}</p> : null}
        </div>
      </div>
    </CatalogCard>
  );
}

type ProblemCardProps = Readonly<{
  description: string;
  icon: string;
  title: string;
}>;

export function ProblemCard({ description, icon, title }: ProblemCardProps) {
  return (
    <CatalogCard className="p-6">
      <div className="text-2xl">{icon}</div>
      <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-muted">{description}</p>
    </CatalogCard>
  );
}

type WorkflowStepProps = Readonly<{
  description: string;
  step: string;
  title: string;
}>;

export function WorkflowStepCard({
  description,
  step,
  title,
}: WorkflowStepProps) {
  return (
    <CatalogCard className="flex gap-4 p-6">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-sm font-bold text-slate-950">
        {step}
      </div>
      <div>
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-7 text-muted">{description}</p>
      </div>
    </CatalogCard>
  );
}

type QuestionCardProps = Readonly<{
  description: string;
  icon: string;
  title: string;
}>;

export function QuestionCard({ description, icon, title }: QuestionCardProps) {
  return (
    <CatalogCard
      className="border-white/[0.08] bg-[#112338] p-6 text-white shadow-none"
      tone="shell"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/12 text-lg text-accent">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#84a0ba]">{description}</p>
    </CatalogCard>
  );
}

type PricingCardProps = Readonly<{
  ctaLabel: string;
  description: string;
  featured?: boolean;
  featuredLabel?: string;
  name: string;
  price: string;
  priceSuffix: string;
  points: readonly string[];
}>;

export function PricingCard({
  ctaLabel,
  description,
  featured = false,
  featuredLabel,
  name,
  points,
  price,
  priceSuffix,
}: PricingCardProps) {
  return (
    <CatalogCard
      className={cx(
        "relative p-7",
        featured ? "bg-[#0d1b2a] text-white" : "bg-white",
      )}
      tone={featured ? "shell" : "default"}
    >
      {featured && featuredLabel ? (
        <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-950">
          {featuredLabel}
        </span>
      ) : null}
      <p
        className={cx(
          "text-xs font-bold uppercase tracking-[0.12em]",
          featured ? "text-accent" : "text-muted",
        )}
      >
        {name}
      </p>
      <div className="mt-4 flex items-end gap-1">
        <span className="text-4xl font-semibold tracking-tight">{price}</span>
        <span className={cx("pb-1 text-sm", featured ? "text-[#91a5b8]" : "text-muted")}>
          {priceSuffix}
        </span>
      </div>
      <p className={cx("mt-4 text-sm leading-7", featured ? "text-[#91a5b8]" : "text-muted")}>
        {description}
      </p>
      <ul className="mt-6 space-y-3">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-2.5 text-sm leading-6">
            <span className={cx("mt-0.5 font-bold", featured ? "text-accent" : "text-accent")}>
              +
            </span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <div className="mt-7">
        <CatalogButton variant={featured ? "primary" : "secondary"}>
          {ctaLabel}
        </CatalogButton>
      </div>
    </CatalogCard>
  );
}

type TestimonialCardProps = Readonly<{
  company: string;
  initials: string;
  name: string;
  quote: string;
}>;

export function TestimonialCard({
  company,
  initials,
  name,
  quote,
}: TestimonialCardProps) {
  return (
    <CatalogCard className="flex h-full flex-col p-7">
      <p className="text-sm tracking-[0.24em] text-amber-500">*****</p>
      <p className="mt-4 flex-1 text-sm leading-7 text-foreground-soft">{quote}</p>
      <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0d1b2a] text-sm font-bold text-accent">
          {initials}
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{name}</div>
          <div className="text-xs text-muted">{company}</div>
        </div>
      </div>
    </CatalogCard>
  );
}

type CallToActionBannerProps = Readonly<{
  description: string;
  primaryAction: string;
  secondaryAction?: string;
  title: string;
}>;

export function CallToActionBanner({
  description,
  primaryAction,
  secondaryAction,
  title,
}: CallToActionBannerProps) {
  return (
    <CatalogCard className="overflow-hidden bg-[linear-gradient(135deg,#00c9a7_0%,#00a0c8_100%)] px-8 py-10 text-slate-950 shadow-[0_24px_60px_rgba(0,169,142,0.18)]">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h3 className="text-3xl font-semibold tracking-tight">{title}</h3>
          <p className="mt-4 text-sm leading-7 text-slate-800/75">{description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <CatalogButton variant="secondary">{primaryAction}</CatalogButton>
          {secondaryAction ? (
            <CatalogButton variant="ghost">{secondaryAction}</CatalogButton>
          ) : null}
        </div>
      </div>
    </CatalogCard>
  );
}
