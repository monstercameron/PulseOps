export type AppTheme = "dark" | "light";

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
