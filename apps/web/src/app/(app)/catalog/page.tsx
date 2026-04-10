import { ComponentCatalogPage } from "@/features/catalog/components/component-catalog-page";

type CatalogPageProps = Readonly<{
  searchParams?: Promise<{
    locale?: string;
  }>;
}>;

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = searchParams ? await searchParams : undefined;

  return <ComponentCatalogPage locale={params?.locale} />;
}
