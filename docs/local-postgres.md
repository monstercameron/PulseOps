Local Postgres

This repo now expects a real local PostgreSQL 16 runtime with pgvector enabled.

Commands

- `npm run db:install:vector`
  Builds and installs pgvector `v0.8.2` into the local PostgreSQL 16 install on Windows.
- `npm run db:init`
  Creates the `bizopsaccelerator` database if needed and applies the hardened local schema.
- `npm run db:check`
  Verifies required tables, indexes, the `embedding_vector` column, and extension capabilities.
- `npm run db:test`
  Runs a transactional smoke test for document/job/event persistence, retrieval chunk vector sync, dimension constraints, and pgvector nearest-neighbor search.
- `npm run db:test:import`
  Loads `assets/docs/10020Records.csv` through `psql \copy`, validates the imported row count and profit aggregate, persists a representative import payload into the canonical tables, and proves the retrieval chunk vector round-trip and nearest-neighbor query.

Expected local defaults

- PostgreSQL bin: `C:\Program Files\PostgreSQL\16\bin`
- Database: `bizopsaccelerator`
- User: `postgres`
- Host: `localhost`
- Port: `5432`

Override env vars

- `BIZOPS_POSTGRES_BIN`
- `BIZOPS_POSTGRES_DB`
- `BIZOPS_POSTGRES_USER`
- `BIZOPS_POSTGRES_HOST`
- `BIZOPS_POSTGRES_PORT`

Notes

- `db:init` now requires pgvector. It will fail fast with an explicit install hint instead of silently continuing without vector support.
- The schema keeps the canonical `embedding` array and also syncs `retrieval_chunks.embedding_vector` through a trigger for Postgres-native vector operations.
- The app default `DATABASE_URL` now matches the local database: `postgres://postgres@localhost:5432/bizopsaccelerator`
