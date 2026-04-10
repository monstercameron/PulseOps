export const settingsPreferenceIds = {
  compactDashboardDensity: "compact_dashboard_density",
  evidenceFirstRecommendationView: "evidence_first_recommendation_view",
  experimentalPackDrafts: "experimental_pack_drafts",
  retainUploadedSourceFiles: "retain_uploaded_source_files",
} as const;

export const defaultRetainUploadedSourceFilesEnabled = true;

export const settingsPreferenceDefinitions = [
  {
    defaultEnabled: true,
    description: "Fit more queue and signal cards on a single desktop screen.",
    id: settingsPreferenceIds.compactDashboardDensity,
    title: "Compact dashboard density",
  },
  {
    defaultEnabled: true,
    description:
      "Open recommendation cards with citations expanded by default.",
    id: settingsPreferenceIds.evidenceFirstRecommendationView,
    title: "Evidence-first recommendation view",
  },
  {
    defaultEnabled: false,
    description:
      "Show draft decision-pack types before they are fully productionized.",
    id: settingsPreferenceIds.experimentalPackDrafts,
    title: "Experimental pack drafts",
  },
  {
    defaultEnabled: defaultRetainUploadedSourceFilesEnabled,
    description:
      "Keep raw uploads in storage so operators can download the original document later.",
    id: settingsPreferenceIds.retainUploadedSourceFiles,
    title: "Retain uploaded source files",
  },
] as const;

const legacyPreferenceIdsByTitle = new Map<string, string>(
  settingsPreferenceDefinitions.map((definition) => [
    definition.title,
    definition.id,
  ]),
);

export function buildDefaultSettingsPreferences() {
  return settingsPreferenceDefinitions.map((definition) => ({
    description: definition.description,
    enabled: definition.defaultEnabled,
    id: definition.id,
    title: definition.title,
  }));
}

export function normalizeSettingsPreferenceId(input: Readonly<{
  id?: string;
  title: string;
}>): string {
  const explicitId = input.id?.trim();
  const normalizedTitleId = input.title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (explicitId !== undefined && explicitId.length > 0) {
    return explicitId;
  }

  return (
    legacyPreferenceIdsByTitle.get(input.title) ??
    (normalizedTitleId || "unknown_preference")
  );
}

export function isSettingsPreferenceEnabled(
  preferences: readonly Readonly<{
    enabled: boolean;
    id: string;
  }>[],
  preferenceId: string,
  fallbackEnabled = false,
): boolean {
  const matchingPreference = preferences.find(
    (preference) => preference.id === preferenceId,
  );

  return matchingPreference?.enabled ?? fallbackEnabled;
}

export function shouldRetainUploadedSourceFiles(
  preferences: readonly Readonly<{
    enabled: boolean;
    id: string;
  }>[],
): boolean {
  return isSettingsPreferenceEnabled(
    preferences,
    settingsPreferenceIds.retainUploadedSourceFiles,
    defaultRetainUploadedSourceFilesEnabled,
  );
}

export function mergeSettingsPreferencesWithDefaults(
  preferences: readonly Readonly<{
    description: string;
    enabled: boolean;
    id: string;
    title: string;
  }>[],
) {
  const preferencesById = new Map(
    preferences.map((preference) => [preference.id, preference]),
  );
  const mergedPreferences = buildDefaultSettingsPreferences().map(
    (defaultPreference) => ({
      ...defaultPreference,
      ...preferencesById.get(defaultPreference.id),
    }),
  );
  const defaultPreferenceIds = new Set(
    mergedPreferences.map((preference) => preference.id),
  );
  const customPreferences = preferences.filter(
    (preference) => !defaultPreferenceIds.has(preference.id),
  );

  return [...mergedPreferences, ...customPreferences];
}
