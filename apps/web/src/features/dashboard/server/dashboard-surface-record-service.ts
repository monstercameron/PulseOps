import {
  createDefaultDashboardSurfaceRecord,
  type DashboardSurfaceRecord,
} from "@/features/dashboard/domain/dashboard-surface-record";
import { type DashboardPageData } from "@/features/dashboard/constants/dashboard-page-content";
import { type DashboardSurfaceRepository } from "@/features/dashboard/repositories/dashboard-surface-repository";

export async function getDashboardSurfaceRecord(
  dashboardSurfaceRepository: DashboardSurfaceRepository,
  orgId: string,
): Promise<DashboardSurfaceRecord> {
  const persistedDashboardSurface = await dashboardSurfaceRepository.getByOrgId(orgId);

  if (persistedDashboardSurface !== null) {
    return persistedDashboardSurface;
  }

  const defaultDashboardSurface = createDefaultDashboardSurfaceRecord(orgId);

  return dashboardSurfaceRepository.put(defaultDashboardSurface);
}

export async function getDashboardSeedPageData(
  dashboardSurfaceRepository: DashboardSurfaceRepository,
  orgId: string,
): Promise<DashboardPageData> {
  const dashboardSurfaceRecord = await getDashboardSurfaceRecord(
    dashboardSurfaceRepository,
    orgId,
  );

  return dashboardSurfaceRecord.pageData;
}
