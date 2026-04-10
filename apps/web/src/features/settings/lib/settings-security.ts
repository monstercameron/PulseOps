export type SettingsSecurityAuthRowKind =
  | "emailPassword"
  | "singleSignOn"
  | "twoFactor"
  | "unknown";

export function getSettingsSecurityAuthRowKind(
  title: string,
): SettingsSecurityAuthRowKind {
  switch (title) {
    case "Email and password":
      return "emailPassword";
    case "Two-factor authentication":
      return "twoFactor";
    case "Single sign-on":
      return "singleSignOn";
    default:
      return "unknown";
  }
}
