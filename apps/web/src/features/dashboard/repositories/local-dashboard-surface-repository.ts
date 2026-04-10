import path from "node:path";

import {
  dashboardSurfaceRecordSchema,
  type DashboardSurfaceRecord,
} from "@/features/dashboard/domain/dashboard-surface-record";
import { createLocalJsonCollection } from "@/features/persistence/lib/local-json-collection";
import { type DashboardSurfaceRepository } from "@/features/dashboard/repositories/dashboard-surface-repository";

type LocalDashboardSurfaceRepositoryOptions = Readonly<{
  rootDirectory: string;
}>;

export function createLocalDashboardSurfaceRepository({
  rootDirectory,
}: LocalDashboardSurfaceRepositoryOptions): DashboardSurfaceRepository {
  const collection = createLocalJsonCollection({
    filePath: path.join(rootDirectory, "dashboard-surface-records.json"),
    recordSchema: dashboardSurfaceRecordSchema,
  });

  return {
    async getByOrgId(orgId) {
      const dashboardSurfaceRecords = await collection.list();

      return dashboardSurfaceRecords.find((record) => record.orgId === orgId) ?? null;
    },
    async put(dashboardSurfaceRecord) {
      return collection.put(dashboardSurfaceRecordSchema.parse(dashboardSurfaceRecord));
    },
  };
}

export type { DashboardSurfaceRecord };
