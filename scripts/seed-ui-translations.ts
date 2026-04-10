import { seedUiTranslationBundles } from "../apps/web/src/features/i18n/server/seed-ui-translation-bundles";
import { localIngestionRuntime } from "../apps/web/src/features/runtime/local-ingestion-runtime";

async function main() {
  const result = await seedUiTranslationBundles({
    repository: localIngestionRuntime.uiTranslationBundleRepository,
  });

  console.log(
    JSON.stringify(
      {
        insertedLocales: result.insertedLocales,
        skippedLocales: result.skippedLocales,
      },
      null,
      2,
    ),
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
