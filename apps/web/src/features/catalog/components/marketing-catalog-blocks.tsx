import Link from "next/link";
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
    <CatalogCard className="flex gap-5 rounded-2xl border-[#e4edf5] bg-white p-7">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-base font-extrabold text-[#0d1b2a]">
        {step}
      </div>
      <div>
        <h3 className="text-[.95rem] font-bold tracking-tight text-[#0d1b2a]">
          {title}
        </h3>
        <p className="mt-2 text-[.88rem] leading-relaxed text-[#4e6278]">{description}</p>
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
    <div className="rounded-2xl border border-white/[.08] bg-white/[.05] p-6 transition hover:bg-white/[.08]">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/[.15] text-lg text-accent">
        {icon}
      </div>
      <h3 className="mt-4 text-[.95rem] font-bold text-white">{title}</h3>
      <p className="mt-2 text-[.83rem] leading-relaxed text-[#6a8faa]">{description}</p>
    </div>
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
    <div
      className={cx(
        "relative rounded-2xl p-7",
        featured
          ? "bg-[#0d1b2a] text-white shadow-[0_12px_48px_rgba(0,0,0,.22)]"
          : "border border-[#dde8f0] bg-[#f4f6f9]",
      )}
    >
      {featured && featuredLabel ? (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-[.7rem] font-extrabold uppercase tracking-[.06em] text-[#0d1b2a]">
          {featuredLabel}
        </span>
      ) : null}
      <p
        className={cx(
          "text-[.82rem] font-bold uppercase tracking-[.08em]",
          featured ? "text-accent" : "text-[#4e6278]",
        )}
      >
        {name}
      </p>
      <div className="mt-4 flex items-end gap-1">
        <span className="text-[2.4rem] font-extrabold leading-none">{price}</span>
        <span className={cx("pb-1 text-base font-normal", featured ? "text-[#91a5b8]" : "text-[#7a9ab4]")}>
          {priceSuffix}
        </span>
      </div>
      <p className={cx("mt-4 text-[.85rem] leading-relaxed", featured ? "text-[#91a5b8]" : "text-[#4e6278]")}>
        {description}
      </p>
      <ul className="mt-6 space-y-3">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-2.5 text-[.85rem] leading-relaxed">
            <span className="mt-0.5 font-bold text-accent">✓</span>
            <span className={featured ? "text-[#c6d6e5]" : "text-[#4e6278]"}>{point}</span>
          </li>
        ))}
      </ul>
      <div className="mt-7">
        <Link href="/signup">
          <span
            className={cx(
              "block w-full rounded-xl py-3 text-center text-[.88rem] font-semibold transition",
              featured
                ? "bg-accent text-[#0d1b2a] hover:bg-[#00b898]"
                : "border border-[#c8d8e6] text-[#0d1b2a] hover:border-accent hover:text-accent",
            )}
          >
            {ctaLabel}
          </span>
        </Link>
      </div>
    </div>
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
    <div className="flex h-full flex-col rounded-2xl border border-[#e4edf5] bg-white p-7">
      <p className="text-sm tracking-[0.24em] text-[#f5a623]">★★★★★</p>
      <p className="mt-4 flex-1 text-[.9rem] leading-relaxed text-[#334455]">{quote}</p>
      <div className="mt-6 flex items-center gap-3 border-t border-[#e4edf5] pt-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0d1b2a] text-sm font-extrabold text-accent">
          {initials}
        </div>
        <div>
          <div className="text-[.88rem] font-bold text-[#0d1b2a]">{name}</div>
          <div className="text-[.78rem] text-[#7a9ab4]">{company}</div>
        </div>
      </div>
    </div>
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
