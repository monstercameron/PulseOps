import { describe, expect, it } from "vitest";

import {
  resolveAppThemePreference,
  toggleAppTheme,
} from "@/features/shell/lib/theme-preference";

describe("resolveAppThemePreference", () => {
  it("returns a valid stored theme", () => {
    expect(resolveAppThemePreference("dark", false)).toBe("dark");
    expect(resolveAppThemePreference("light", true)).toBe("light");
  });

  it("falls back to the system preference when the stored theme is invalid", () => {
    expect(resolveAppThemePreference("system", true)).toBe("dark");
    expect(resolveAppThemePreference(null, false)).toBe("light");
  });
});

describe("toggleAppTheme", () => {
  it("switches between light and dark themes", () => {
    expect(toggleAppTheme("light")).toBe("dark");
    expect(toggleAppTheme("dark")).toBe("light");
  });
});
