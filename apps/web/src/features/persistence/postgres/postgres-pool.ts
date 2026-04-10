import { Pool, type QueryResultRow } from "pg";

type PostgresPoolState = {
  connectionString: string;
  pool: Pool;
};

declare global {
  var __bizopsPostgresPoolState: PostgresPoolState | undefined;
}

export function getPostgresPool(connectionString: string): Pool {
  const existingState = globalThis.__bizopsPostgresPoolState;

  if (
    existingState !== undefined &&
    existingState.connectionString === connectionString
  ) {
    return existingState.pool;
  }

  const pool = new Pool({
    connectionString,
    max: 10,
  });

  globalThis.__bizopsPostgresPoolState = {
    connectionString,
    pool,
  };

  return pool;
}

export function toPostgresJson(value: unknown): string {
  return JSON.stringify(value);
}

export function fromPostgresTimestamp(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function fromPostgresNumber(
  value: number | string | null | undefined,
): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  return typeof value === "number" ? value : Number(value);
}

export function mapPostgresRows<T, Row extends QueryResultRow>(
  rows: readonly Row[],
  mapper: (row: Row) => T,
) {
  return rows.map(mapper);
}
