"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { CatalogButton } from "@/features/catalog/components/catalog-primitives";
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

type MarketingShellProps = Readonly<{
  children: ReactNode;
  ctaHref: string;
  ctaLabel: string;
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
  footerDescription,
  footerGroups,
  footerTagline,
  navLinks,
  pathName,
}: MarketingShellProps) {
  const { messages } = useUiI18n();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0d1b2a]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 md:px-10">
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
                      : "text-sm font-medium text-[#8fa8be] transition-colors hover:text-white"
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
            <Link href={ctaHref}>
              <CatalogButton variant="primary">{ctaLabel}</CatalogButton>
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content">{children}</main>

      <footer className="bg-[#0d1b2a] px-6 pb-8 pt-12 text-[#7a95ad] md:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.8fr_1fr_1fr_1fr]">
          <div>
            <Link className="text-[1.2rem] font-bold tracking-tight text-white" href="/">
              Pulse<span className="text-accent">Ops</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-7">{footerDescription}</p>
          </div>
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-white">
                {group.title}
              </h2>
              <div className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <div key={link.href}>
                    <Link
                      className="text-sm transition-colors hover:text-accent"
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
        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-2 border-t border-white/[0.07] pt-5 text-xs text-[#3d576b] sm:flex-row sm:items-center sm:justify-between">
          <span>{messages.marketing.shared.footerCopyright}</span>
          <span>{footerTagline}</span>
        </div>
      </footer>
    </div>
  );
}
