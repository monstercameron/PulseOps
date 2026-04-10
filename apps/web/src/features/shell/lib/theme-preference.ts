export type AppTheme = "dark" | "light";

export const APP_THEME_COOKIE_NAME = "pulseops-theme";

export function resolveAppThemePreference(
  storedTheme: string | null,
  prefersDark: boolean,
): AppTheme {
  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  return prefersDark ? "dark" : "light";
}

export function toggleAppTheme(theme: AppTheme): AppTheme {
  return theme === "dark" ? "light" : "dark";
}

export function coerceStoredAppTheme(theme: string | null | undefined): AppTheme | null {
  return theme === "dark" || theme === "light" ? theme : null;
}

export function persistAppTheme(theme: AppTheme) {
  document.documentElement.setAttribute("data-theme", theme);
  window.localStorage.setItem(APP_THEME_COOKIE_NAME, theme);
  document.cookie = `${APP_THEME_COOKIE_NAME}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
