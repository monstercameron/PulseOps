"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

import { LocaleSwitcher } from "@/features/i18n/components/locale-switcher";
import { useUiI18n } from "@/features/i18n/components/ui-i18n-provider";

export type MarketingNavLink = Readonly<{
  href: string;
  label: string;
}>;

export type MarketingFooterGroup = Readonly<{
  links: readonly MarketingNavLink[];
  title: string;
}>;

export type MarketingFooterContact = Readonly<{
  href: string;
  label: string;
  value: string;
}>;

type MarketingShellProps = Readonly<{
  children: ReactNode;
  ctaHref: string;
  ctaLabel: string;
  footerContacts?: readonly MarketingFooterContact[];
  footerDescription: string;
  footerGroups: readonly MarketingFooterGroup[];
  footerTagline: string;
  navLinks: readonly MarketingNavLink[];
  pathName: string;
}>;

export function MarketingShell({
  children,
  ctaHref,
  ctaLabel,
  footerContacts,
  footerDescription,
  footerGroups,
  footerTagline,
  navLinks,
  pathName,
}: MarketingShellProps) {
  const { messages } = useUiI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-[100] border-b border-white/[0.06] bg-[#0d1b2a]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-[68px] max-w-[1080px] items-center justify-between gap-4 px-6 md:px-12">
          <Link className="text-xl font-bold tracking-tight text-white" href="/">
            Pulse<span className="text-accent">Ops</span>
          </Link>
          <nav
            aria-label={messages.marketing.shared.footerNavigationLabel}
            className="hidden items-center gap-7 md:flex"
          >
            {navLinks.map((link) => {
              const isActive =
                link.href !== "/" &&
                (pathName === link.href || pathName.startsWith(`${link.href}/`));

              return (
                <Link
                  key={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={
                    isActive
                      ? "text-sm font-medium text-white"
                      : "text-sm font-medium text-[#8fa8be] transition-colors duration-200 hover:text-white"
                  }
                  href={link.href}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <LocaleSwitcher tone="dark" />
            <Link
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-[#0d1b2a] transition-colors hover:bg-[#00b898]"
              href={ctaHref}
            >
              {ctaLabel}
            </Link>
          </div>
          {/* Mobile hamburger */}
          <button
            aria-expanded={mobileOpen}
            aria-label="Open navigation"
            className="flex flex-col items-center justify-center gap-[5px] md:hidden"
            type="button"
            onClick={() => { setMobileOpen((v) => !v); }}
          >
            <span className={`block h-[2px] w-6 rounded bg-white transition-transform duration-200 ${mobileOpen ? "translate-y-[7px] rotate-45" : ""}`} />
            <span className={`block h-[2px] w-6 rounded bg-white transition-opacity duration-200 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block h-[2px] w-6 rounded bg-white transition-transform duration-200 ${mobileOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
          </button>
        </div>
        {/* Mobile dropdown */}
        {mobileOpen ? (
          <div className="border-t border-white/[0.08] bg-[#0d1b2a] px-6 pb-5 pt-2 md:hidden">
            {navLinks.map((link) => {
              const isActive =
                link.href !== "/" &&
                (pathName === link.href || pathName.startsWith(`${link.href}/`));
              return (
                <Link
                  key={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`block border-b border-white/[0.07] py-3 text-sm font-medium transition-colors ${isActive ? "text-white" : "text-[#8fa8be] hover:text-white"}`}
                  href={link.href}
                  onClick={() => { setMobileOpen(false); }}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              className="mt-4 block rounded-xl bg-accent py-3 text-center text-sm font-bold text-[#0d1b2a]"
              href={ctaHref}
              onClick={() => { setMobileOpen(false); }}
            >
              {ctaLabel}
            </Link>
          </div>
        ) : null}
      </header>

      <main id="main-content">{children}</main>

      <footer className="bg-[#0d1b2a] px-6 pb-7 pt-10 text-[#7a95ad] md:px-12 md:pt-14">
        <div className="mx-auto grid max-w-[1080px] gap-10 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <Link className="text-[1.2rem] font-bold tracking-tight text-white" href="/">
              Pulse<span className="text-accent">Ops</span>
            </Link>
            <p className="mt-4 max-w-[250px] text-[.85rem] leading-[1.65]">{footerDescription}</p>
            {footerContacts && footerContacts.length > 0 ? (
              <div className="mt-6 space-y-2">
                {footerContacts.map((contact) => (
                  <p key={contact.label} className="text-[.85rem] leading-6">
                    <span className="mr-2 font-semibold uppercase tracking-[0.08em] text-[#9eb5c9]">
                      {contact.label}
                    </span>
                    <a
                      className="transition-colors hover:text-accent"
                      href={contact.href}
                    >
                      {contact.value}
                    </a>
                  </p>
                ))}
              </div>
            ) : null}
          </div>
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h2 className="mb-4 text-[.82rem] font-semibold uppercase tracking-[.08em] text-white">
                {group.title}
              </h2>
              <div className="space-y-3">
                {group.links.map((link) => (
                  <div key={link.href}>
                    <Link
                      className={`text-[.85rem] transition-colors hover:text-accent ${pathName === link.href ? "text-accent" : ""}`}
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-8 flex max-w-[1080px] flex-col gap-2 border-t border-white/[0.07] pt-5 text-[.78rem] text-[#3d576b] sm:flex-row sm:items-center sm:justify-between">
          <span>{messages.marketing.shared.footerCopyright}</span>
          <span>{footerTagline}</span>
        </div>
      </footer>
    </div>
  );
}
