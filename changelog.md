# Changelog

## 2026-04-09

### Bootstrap
- Added the repo workspace, formatting rules, ignore files, CI workflow, and shared npm scripts for the Next.js app, tests, and static design builds.
- Added static design prototypes and sample source documents to support product, UX, and parser iteration.

### Application
- Added the `apps/web` Next.js prototype with marketing pages, authenticated workspace routes, API routes, and a feature-first code layout.
- Added core MVP domain logic and tests for ingestion, parsing, extraction, facts, chunks, query planning, recommendations, trust metadata, feedback, settings, and observability flows.

### Operations
- Added local Postgres and pgvector setup SQL, verification scripts, smoke scripts, and seed helpers for local development.
- Added architecture and implementation notes covering MVP scope, supported formats, local database setup, and target system design.

### Fixes
- Fixed app-wide TypeScript issues in dashboard request handling and account seed helpers so the full workspace typecheck passes.
- Updated dashboard request tests to match the current filtered KPI and signal behavior.
