import Link from "next/link";
import type { ReactNode } from "react";

import {
  CatalogButton,
  CatalogCard,
  StatusBadge,
  cx,
} from "@/features/catalog/components/catalog-primitives";

type MarketingPageHeroProps = Readonly<{
  actions?: readonly { href: string; label: string; variant?: "primary" | "secondary" }[];
  description: string;
  eyebrow: string;
  footerNote?: string;
  stats?: readonly {
    detail: string;
    value: string;
  }[];
  title: ReactNode;
}>;

export function MarketingPageHero({
  actions = [],
  description,
  eyebrow,
  footerNote,
  stats = [],
  title,
}: MarketingPageHeroProps) {
  return (
    <section className="overflow-hidden bg-[linear-gradient(150deg,#0b1929_0%,#0d1e30_55%,#0c2640_100%)] px-6 py-16 text-white md:px-10 md:py-24">
      <div className="mx-auto max-w-7xl">
        <StatusBadge label={eyebrow} tone="accent" />
        <h1 className="mt-6 max-w-4xl text-[clamp(2.2rem,5vw,3.8rem)] font-semibold leading-[1.08] tracking-tight">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-[#9db2c7]">
          {description}
        </p>
        {actions.length > 0 ? (
          <div className="mt-8 flex flex-wrap gap-3">
            {actions.map((action) => (
              <Link key={action.href} href={action.href}>
                <CatalogButton variant={action.variant ?? "secondary"}>
                  {action.label}
                </CatalogButton>
              </Link>
            ))}
          </div>
        ) : null}
        {stats.length > 0 ? (
          <div className="mt-10 border-t border-white/[0.08] pt-6">
            <div className="grid gap-3 md:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.detail}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.05] px-4 py-3"
                >
                  <div className="text-2xl font-semibold tracking-tight text-white">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-[#83a0b8]">
                    {stat.detail}
                  </div>
                </div>
              ))}
            </div>
            {footerNote ? (
              <p className="mt-4 text-right text-xs text-[#56718a]">{footerNote}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

type MarketingSectionProps = Readonly<{
  children: ReactNode;
  description?: string;
  eyebrow: string;
  id?: string;
  title: string;
  tone?: "dark" | "light" | "white";
}>;

const sectionToneClasses = {
  dark: "bg-[#0d1b2a] text-white",
  light: "bg-background text-foreground",
  white: "bg-white text-foreground",
} as const;

export function MarketingSection({
  children,
  description,
  eyebrow,
  id,
  title,
  tone = "light",
}: MarketingSectionProps) {
  return (
    <section
      className={cx("px-6 py-14 md:px-10 md:py-20", sectionToneClasses[tone])}
      id={id}
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p
            className={cx(
              "text-xs font-semibold uppercase tracking-[0.22em]",
              tone === "dark" ? "text-accent" : "text-accent",
            )}
          >
            {eyebrow}
          </p>
          <h2
            className={cx(
              "mt-4 text-[clamp(1.7rem,3.3vw,2.6rem)] font-semibold leading-[1.12] tracking-tight",
              tone === "dark" ? "text-white" : "text-foreground",
            )}
          >
            {title}
          </h2>
          {description ? (
            <p
              className={cx(
                "mt-4 text-base leading-8",
                tone === "dark" ? "text-[#7a9ab4]" : "text-muted",
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

type MarketingInfoCardProps = Readonly<{
  description: string;
  icon?: string;
  title: string;
  tone?: "dark" | "light" | "warning";
}>;

const infoCardToneClasses = {
  dark: "border-white/[0.08] bg-white/[0.05] text-white",
  light: "border-border bg-white text-foreground",
  warning: "border-red-100 bg-red-50 text-foreground",
} as const;

export function MarketingInfoCard({
  description,
  icon,
  title,
  tone = "light",
}: MarketingInfoCardProps) {
  return (
    <CatalogCard
      className={cx("h-full p-6 shadow-[0_14px_38px_rgba(20,34,53,0.08)]", infoCardToneClasses[tone])}
      tone={tone === "dark" ? "shell" : "default"}
    >
      {icon ? <div className="text-2xl">{icon}</div> : null}
      <h3 className={cx("mt-4 text-lg font-semibold tracking-tight", tone === "dark" ? "text-white" : "text-foreground")}>
        {title}
      </h3>
      <p className={cx("mt-3 text-sm leading-7", tone === "dark" ? "text-[#84a0ba]" : "text-muted")}>
        {description}
      </p>
    </CatalogCard>
  );
}

type MarketingChecklistProps = Readonly<{
  items: readonly string[];
}>;

export function MarketingChecklist({ items }: MarketingChecklistProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item} className="flex gap-3">
          <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-slate-950">
            +
          </span>
          <span className="text-sm leading-7 text-muted">{item}</span>
        </div>
      ))}
    </div>
  );
}

type MarketingFaqGroupProps = Readonly<{
  items: readonly {
    answer: string;
    question: string;
  }[];
  title: string;
}>;

export function MarketingFaqGroup({
  items,
  title,
}: MarketingFaqGroupProps) {
  return (
    <CatalogCard className="overflow-hidden">
      <div className="border-b border-border bg-[rgba(20,34,53,0.02)] px-6 py-4">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
      </div>
      <div className="divide-y divide-[rgba(20,34,53,0.05)]">
        {items.map((item) => (
          <details key={item.question} className="px-6 py-4">
            <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">
              {item.question}
            </summary>
            <p className="mt-3 text-sm leading-7 text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </CatalogCard>
  );
}

type AuthSplitLayoutProps = Readonly<{
  children: ReactNode;
  details: readonly string[];
  eyebrow: string;
  highlight: string;
  title: string;
}>;

export function AuthSplitLayout({
  children,
  details,
  eyebrow,
  highlight,
  title,
}: AuthSplitLayoutProps) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-148px)] max-w-7xl gap-8 px-6 py-10 md:grid-cols-[1.1fr_0.9fr] md:px-10">
      <CatalogCard
        className="overflow-hidden bg-[linear-gradient(150deg,#0b1929_0%,#0d1e30_55%,#0c2640_100%)] px-8 py-9 text-white"
        tone="shell"
      >
        <StatusBadge label={eyebrow} tone="accent" />
        <h1 className="mt-5 text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.1] tracking-tight">
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-8 text-[#9db2c7]">
          {highlight}
        </p>
        <div className="mt-8 space-y-3">
          {details.map((detail) => (
            <div key={detail} className="rounded-2xl border border-white/[0.08] bg-white/[0.05] px-4 py-3 text-sm text-[#c6d6e5]">
              {detail}
            </div>
          ))}
        </div>
      </CatalogCard>
      <div className="flex items-center">{children}</div>
    </div>
  );
}

type AuthFormCardProps = Readonly<{
  actions: readonly {
    href?: string;
    label: string;
    variant?: "primary" | "secondary";
  }[];
  fields: readonly {
    hint?: string;
    label: string;
    placeholder: string;
    type?: "email" | "password" | "text";
  }[];
  footer: ReactNode;
  subtitle: string;
  title: string;
}>;

export function AuthFormCard({
  actions,
  fields,
  footer,
  subtitle,
  title,
}: AuthFormCardProps) {
  return (
    <CatalogCard className="w-full p-7">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-muted">{subtitle}</p>
      <div className="mt-6 space-y-4">
        {fields.map((field) => (
          <label key={field.label} className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
              {field.label}
            </span>
            <input
              className="mt-2 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted/55 focus:border-accent focus:ring-[3px] focus:ring-accent/12"
              placeholder={field.placeholder}
              type={field.type ?? "text"}
            />
            {field.hint ? (
              <span className="mt-2 block text-xs text-muted">{field.hint}</span>
            ) : null}
          </label>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        {actions.map((action, index) =>
          action.href ? (
            <Link key={action.label} href={action.href}>
              <CatalogButton variant={action.variant ?? (index === 0 ? "primary" : "secondary")}>
                {action.label}
              </CatalogButton>
            </Link>
          ) : (
            <CatalogButton
              key={action.label}
              variant={action.variant ?? (index === 0 ? "primary" : "secondary")}
            >
              {action.label}
            </CatalogButton>
          ),
        )}
      </div>
      <div className="mt-6 border-t border-border pt-4 text-sm text-muted">{footer}</div>
    </CatalogCard>
  );
}

type LegalDocumentProps = Readonly<{
  intro: string;
  sections: readonly {
    body: readonly string[];
    title: string;
  }[];
  title: string;
  updatedLabel: string;
}>;

export function LegalDocument({
  intro,
  sections,
  title,
  updatedLabel,
}: LegalDocumentProps) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 md:px-10">
      <CatalogCard className="p-8 md:p-10">
        <StatusBadge label={updatedLabel} tone="info" />
        <h1 className="mt-5 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-4 text-sm leading-8 text-muted">{intro}</p>
        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {section.title}
              </h2>
              <div className="mt-3 space-y-4">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-8 text-muted">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </CatalogCard>
    </div>
  );
}
