import { type DashboardSurfaceRecord } from "@/features/dashboard/domain/dashboard-surface-record";

export interface DashboardSurfaceRepository {
  getByOrgId(orgId: string): Promise<DashboardSurfaceRecord | null>;
  put(dashboardSurfaceRecord: DashboardSurfaceRecord): Promise<DashboardSurfaceRecord>;
}
