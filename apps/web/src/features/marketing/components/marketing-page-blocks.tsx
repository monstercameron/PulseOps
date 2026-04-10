import Link from "next/link";
import type { ReactNode } from "react";

import {
  CatalogCard,
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
  const isHomePage = stats.length > 0;
  return (
    <section
      className={`overflow-hidden px-6 text-white md:px-12 ${isHomePage ? "pb-20 pt-16 md:pb-28 md:pt-24" : "pb-20 pt-16 md:pb-24 md:pt-20"}`}
      style={{
        backgroundColor: "#0b1929",
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,.055) 1px, transparent 0), linear-gradient(150deg, #0b1929 0%, #0d1e30 55%, #0c2640 100%)",
        backgroundSize: "32px 32px, cover",
      }}
    >
      <div className={`mx-auto ${isHomePage ? "max-w-[1080px]" : "max-w-[800px]"}`}>
        <div className="mb-8 inline-flex items-center rounded-full border border-accent/25 bg-accent/[.08] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[.09em] text-accent">
          {eyebrow}
        </div>
        <h1 className={`text-[clamp(2rem,5vw,3rem)] font-extrabold leading-[1.12] tracking-tight prose-balance ${isHomePage ? "max-w-[820px] text-[clamp(2.2rem,5.5vw,3.75rem)]" : "max-w-[700px]"}`}>
          {title}
        </h1>
        <p className={`mt-5 text-[1.05rem] leading-relaxed text-[#94afc7] ${isHomePage ? "max-w-[560px]" : ""}`}>
          {description}
        </p>
        {actions.length > 0 ? (
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            {actions.map((action, i) => (
              <Link key={action.href} href={action.href}>
                {action.variant === "primary" || i === 0 ? (
                  <span className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-accent px-8 py-3.5 text-[.95rem] font-bold text-[#0d1b2a] shadow-[0_0_24px_rgba(0,201,167,.25)] transition hover:-translate-y-px hover:bg-[#00b898]">
                    {action.label}
                  </span>
                ) : (
                  <span className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-white/20 px-8 py-3.5 text-[.95rem] text-white/80 transition hover:border-white/40 hover:text-white">
                    {action.label}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ) : null}
        {stats.length > 0 ? (
          <div className="mt-8 border-t border-white/[0.08] pt-6 md:mt-16 md:pt-12">
            <div className="flex flex-wrap gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.detail}
                  className="rounded-lg border border-white/[.09] bg-white/[.05] px-4 py-2.5"
                >
                  <div className="text-[1.35rem] font-extrabold leading-none text-white">
                    {stat.value}
                  </div>
                  <div className="mt-0.5 text-[.72rem] leading-[1.3] text-[#7a9ab4] whitespace-pre-line">
                    {stat.detail}
                  </div>
                </div>
              ))}
              {footerNote ? (
                <div className="hidden sm:flex ml-auto flex-col justify-end text-right gap-1">
                  {footerNote.split(",").map((line, i) => (
                    <div key={i} className="text-[.72rem] text-[#4d6883]">{line.trim()}</div>
                  ))}
                </div>
              ) : null}
            </div>
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
  light: "bg-[#f4f6f9] text-foreground",
  white: "bg-white text-foreground border-b border-[#e8eff5]",
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
      className={cx("px-6 py-14 md:px-12 md:py-20", sectionToneClasses[tone])}
      id={id}
    >
      <div className="mx-auto max-w-[1080px]">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[.09em] text-accent mb-4">
            {eyebrow}
          </p>
          <h2
            className={cx(
              "text-[clamp(1.5rem,3vw,2.2rem)] font-extrabold leading-[1.2] tracking-tight prose-balance",
              tone === "dark" ? "text-white" : "text-[#0d1b2a]",
            )}
          >
            {title}
          </h2>
          {description ? (
            <p
              className={cx(
                "mt-4 text-[.97rem] leading-relaxed",
                tone === "dark" ? "text-[#7a9ab4]" : "text-[#4e6278]",
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
  navyIconBox?: boolean;
  title: string;
  tone?: "dark" | "light" | "warning";
}>;

const infoCardToneClasses = {
  dark: "border-white/[0.08] bg-white/[0.05] text-white",
  light: "border-[#e4edf5] bg-white text-foreground",
  warning: "border-[#f0d0d2] bg-[#fff8f8] text-foreground",
} as const;

export function MarketingInfoCard({
  description,
  icon,
  navyIconBox = false,
  title,
  tone = "light",
}: MarketingInfoCardProps) {
  return (
    <CatalogCard
      className={cx("h-full rounded-2xl", navyIconBox ? "p-7" : "p-6", infoCardToneClasses[tone])}
      tone={tone === "dark" ? "shell" : "default"}
    >
      {icon ? (
        navyIconBox ? (
          <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#0d1b2a] text-lg text-accent">
            {icon}
          </div>
        ) : (
          <div className="mb-4 text-[1.4rem]">{icon}</div>
        )
      ) : null}
      <h3 className={cx(navyIconBox ? "text-[1rem]" : "text-[.95rem]", "font-bold tracking-tight", tone === "dark" ? "text-white" : "text-[#0d1b2a]")}>
        {title}
      </h3>
      <p className={cx("mt-3 leading-relaxed", navyIconBox ? "text-[.87rem]" : "text-[.85rem]", tone === "dark" ? "text-[#6a8faa]" : navyIconBox ? "text-[#5a6e80]" : "text-[#6a7e8f]")}>
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
        <div key={item} className="flex gap-3 items-start text-[.9rem] text-[#334455]">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[.7rem] font-extrabold text-[#0d1b2a]">
            ✓
          </span>
          <span className="leading-relaxed">{item}</span>
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
    <div className="flex min-h-[calc(100vh-68px)]">
      {/* Left panel */}
      <div
        className="relative hidden overflow-hidden px-12 py-10 text-white md:flex md:w-[42%] md:flex-col"
        style={{ background: "#0d1b2a" }}
      >
        {/* Decorative glows */}
        <div className="pointer-events-none absolute right-0 top-0 h-[420px] w-[420px] rounded-full" style={{ background: "radial-gradient(circle, rgba(0,201,167,.18) 0%, transparent 70%)" }} />
        <div className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full" style={{ background: "radial-gradient(circle, rgba(29,65,102,.6) 0%, transparent 70%)" }} />
        <div className="relative z-10">
          <div className="mb-8 inline-flex items-center rounded-full border border-accent/25 bg-accent/[.08] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[.09em] text-accent">
            {eyebrow}
          </div>
          <h1 className="text-[30px] font-extrabold leading-[1.1] tracking-tight text-white">
            {title}
          </h1>
          <p className="mt-4 text-[.9rem] leading-relaxed" style={{ color: "rgba(255,255,255,.55)" }}>
            {highlight}
          </p>
          <div className="mt-8 space-y-3">
            {details.map((detail) => (
              <div
                key={detail}
                className="rounded-[10px] border border-white/[.07] px-4 py-3 text-[.87rem] text-[#c6d6e5]"
                style={{ background: "rgba(255,255,255,.05)" }}
              >
                {detail}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Right panel */}
      <div
        className="flex flex-1 items-start justify-center px-6 py-10 md:items-center"
        style={{ background: "#f4f6f9" }}
      >
        {children}
      </div>
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
    <div className="w-full max-w-[400px] rounded-[14px] bg-white p-7 shadow-[0_4px_24px_rgba(20,34,53,0.10)]">
      <h2 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#0d1b2a]">{title}</h2>
      <p className="mt-2 text-[14px] text-[#8898aa]">{subtitle}</p>
      <div className="mt-6 space-y-4">
        {fields.map((field) => (
          <label key={field.label} className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-[#142235]">
              {field.label}
            </span>
            <input
              className="w-full rounded-[9px] border border-[rgba(20,34,53,.12)] bg-white px-[14px] py-[11px] text-[14px] text-[#142235] outline-none transition placeholder:text-[#8898aa]/60 focus:border-accent focus:shadow-[0_0_0_3px_rgba(0,201,167,.12)]"
              placeholder={field.placeholder}
              type={field.type ?? "text"}
            />
            {field.hint ? (
              <span className="mt-2 block text-[12px] text-[#8898aa]">{field.hint}</span>
            ) : null}
          </label>
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {actions.map((action, index) => {
          const isPrimary = (action.variant === "primary") || (!action.variant && index === 0);
          const cls = isPrimary
            ? "block w-full rounded-[10px] bg-accent py-[13px] text-center text-[14.5px] font-bold text-[#0d1b2a] transition hover:bg-[#00b898]"
            : "block w-full rounded-[10px] border border-[rgba(20,34,53,.12)] bg-white py-[13px] text-center text-[13.5px] font-semibold text-[#142235] transition hover:shadow-[0_1px_4px_rgba(20,34,53,.07)]";
          return action.href ? (
            <Link key={action.label} className={cls} href={action.href}>
              {action.label}
            </Link>
          ) : (
            <button key={action.label} className={cls} type="button">
              {action.label}
            </button>
          );
        })}
      </div>
      <div className="mt-6 border-t border-[rgba(20,34,53,.08)] pt-4 text-[13px] text-[#8898aa]">{footer}</div>
    </div>
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
  updatedLabel,
}: LegalDocumentProps) {
  return (
    <div className="bg-white px-6 py-12 md:px-12 md:py-16">
      <div className="mx-auto max-w-[760px]">
        <p className="mb-3 text-[.9rem] text-[#7a9ab4]">{updatedLabel}</p>
        <div className="mt-8 space-y-8">
          <p className="text-[.9rem] leading-[1.75] text-[#4e6278]">{intro}</p>
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mt-8 text-[1.05rem] font-bold text-[#0d1b2a]">
                {section.title}
              </h2>
              <div className="mt-3 space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-[.9rem] leading-[1.75] text-[#4e6278]">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
