import { DashboardPage } from "@/features/dashboard/components/dashboard-page";
import { readDashboardFilterValues } from "@/features/dashboard/lib/dashboard-filters";
import { getDashboardPageData } from "@/features/dashboard/server/handle-dashboard-page-request";
import { DEFAULT_WORKSPACE } from "@/features/foundation/domain/default-workspace";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

export const dynamic = "force-dynamic";

type DashboardPageProps = Readonly<{
  searchParams?: Promise<{
    dateRange?: string;
    documentType?: string;
    source?: string;
    status?: string;
  }>;
}>;

export default async function Dashboard({ searchParams }: DashboardPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const initialData = await getDashboardPageData({
    dashboardSurfaceRepository: localIngestionRuntime.dashboardSurfaceRepository,
    documentRepository: localIngestionRuntime.documentRepository,
    factRepository: localIngestionRuntime.factRepository,
    filters: readDashboardFilterValues(params),
    orgId: DEFAULT_WORKSPACE.orgId,
    packRepository: localIngestionRuntime.packRepository,
    queueEventRepository: localIngestionRuntime.queueEventRepository,
    savedQuestionRepository: localIngestionRuntime.savedQuestionRepository,
    settingsRepository: localIngestionRuntime.settingsRepository,
  });

  return <DashboardPage initialData={initialData} orgId={DEFAULT_WORKSPACE.orgId} />;
}
