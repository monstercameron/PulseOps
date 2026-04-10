import { type Pool } from "pg";

import {
  organizationRecordSchema,
  type OrganizationRecord,
} from "@/features/settings/domain/organization-record";
import { type OrganizationRepository } from "@/features/settings/repositories/organization-repository";
import {
  fromPostgresTimestamp,
  mapPostgresRows,
} from "@/features/persistence/postgres/postgres-pool";

type CreatePostgresOrganizationRepositoryInput = Readonly<{
  pool: Pool;
}>;

export function createPostgresOrganizationRepository({
  pool,
}: CreatePostgresOrganizationRepositoryInput): OrganizationRepository {
  return {
    async getById(id) {
      const result = await pool.query(
        `
          select *
          from organizations
          where id = $1
        `,
        [id],
      );

      return result.rows[0] === undefined
        ? null
        : mapOrganizationRow(result.rows[0]);
    },
    async list() {
      const result = await pool.query(
        `
          select *
          from organizations
          order by created_at asc
        `,
      );

      return mapPostgresRows(result.rows, mapOrganizationRow);
    },
    async put(organizationRecord) {
      const parsedOrganization =
        organizationRecordSchema.parse(organizationRecord);

      await pool.query(
        `
          insert into organizations (
            id,
            name,
            industry,
            location,
            revenue_model,
          invoice_cycle,
          team_size,
          goals,
          status,
          created_at,
          updated_at,
          version
        ) values (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        )
        on conflict (id) do update set
            name = excluded.name,
            industry = excluded.industry,
            location = excluded.location,
            revenue_model = excluded.revenue_model,
            invoice_cycle = excluded.invoice_cycle,
            team_size = excluded.team_size,
          goals = excluded.goals,
          status = excluded.status,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at,
          version = excluded.version
        `,
        [
          parsedOrganization.id,
          parsedOrganization.name,
          parsedOrganization.industry,
          parsedOrganization.location,
          parsedOrganization.revenueModel,
          parsedOrganization.invoiceCycle,
          parsedOrganization.teamSize,
          parsedOrganization.goals,
          parsedOrganization.status,
          parsedOrganization.createdAt,
          parsedOrganization.updatedAt,
          parsedOrganization.version,
        ],
      );

      return parsedOrganization;
    },
  };
}

function mapOrganizationRow(row: Record<string, unknown>): OrganizationRecord {
  return organizationRecordSchema.parse({
    createdAt: fromPostgresTimestamp(row.created_at as Date | string),
    goals: row.goals,
    id: row.id,
    industry: row.industry,
    invoiceCycle: row.invoice_cycle,
    location: row.location,
    name: row.name,
    revenueModel: row.revenue_model,
    status: row.status,
    teamSize: row.team_size,
    updatedAt: fromPostgresTimestamp(row.updated_at as Date | string),
    version: row.version,
  });
}
