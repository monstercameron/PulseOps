"use client";

import { useLayoutEffect } from "react";

import {
  APP_THEME_COOKIE_NAME,
  coerceStoredAppTheme,
  persistAppTheme,
} from "@/features/shell/lib/theme-preference";

export function ThemeHydrator() {
  useLayoutEffect(() => {
    const storedTheme = coerceStoredAppTheme(
      window.localStorage.getItem(APP_THEME_COOKIE_NAME),
    );

    if (storedTheme === null) {
      return;
    }

    if (document.documentElement.getAttribute("data-theme") === storedTheme) {
      document.cookie =
        `${APP_THEME_COOKIE_NAME}=${storedTheme}; Path=/; Max-Age=31536000; SameSite=Lax`;
      return;
    }

    persistAppTheme(storedTheme);
  }, []);

  return null;
}
