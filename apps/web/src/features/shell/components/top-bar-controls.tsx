"use client";

import { useState } from "react";
import { LocaleSwitcher } from "@/features/i18n/components/locale-switcher";
import {
  persistAppTheme,
  toggleAppTheme,
  type AppTheme,
} from "@/features/shell/lib/theme-preference";

export function TopBarControls() {
  const [themeOverride, setThemeOverride] = useState<AppTheme | null>(null);
  const theme =
    themeOverride ??
    (typeof document === "undefined"
      ? null
      : document.documentElement.getAttribute("data-theme") === "light"
        ? "light"
        : "dark");

  function handleThemeToggle() {
    const next = toggleAppTheme(theme ?? "dark");
    persistAppTheme(next);
    setThemeOverride(next);
  }

  const themeToggleLabel =
    theme === null
      ? "Toggle theme"
      : theme === "dark"
        ? "Switch to light mode"
        : "Switch to dark mode";

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        aria-label={themeToggleLabel}
        className="flex h-[26px] w-[26px] items-center justify-center rounded-[6px] border border-border-strong bg-surface-subtle text-muted transition hover:bg-surface-muted hover:text-foreground active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        onClick={handleThemeToggle}
        suppressHydrationWarning
        title={themeToggleLabel}
        type="button"
      >
        {theme === null ? (
          <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="M4.93 4.93l1.41 1.41" />
            <path d="M17.66 17.66l1.41 1.41" />
          </svg>
        ) : theme === "dark" ? (
          <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" x2="12" y1="1" y2="3" />
            <line x1="12" x2="12" y1="21" y2="23" />
            <line x1="4.22" x2="5.64" y1="4.22" y2="5.64" />
            <line x1="18.36" x2="19.78" y1="18.36" y2="19.78" />
            <line x1="1" x2="3" y1="12" y2="12" />
            <line x1="21" x2="23" y1="12" y2="12" />
            <line x1="4.22" x2="5.64" y1="19.78" y2="18.36" />
            <line x1="18.36" x2="19.78" y1="5.64" y2="4.22" />
          </svg>
        ) : (
          <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>
      <LocaleSwitcher />
    </div>
  );
}
