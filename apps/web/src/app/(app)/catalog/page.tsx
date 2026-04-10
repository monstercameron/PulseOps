import { ComponentCatalogPage } from "@/features/catalog/components/component-catalog-page";
import { getCurrentUiLocale } from "@/features/i18n/server/ui-translations";

type CatalogPageProps = Readonly<{
  searchParams?: Promise<{
    locale?: string;
  }>;
}>;

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const locale = params?.locale ?? (await getCurrentUiLocale());

  return <ComponentCatalogPage locale={locale} />;
}
