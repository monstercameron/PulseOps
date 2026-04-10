# PulseOps

PulseOps is a local prototype for a field-service decision-support product.

The current MVP is intentionally narrow:

- ICP: field-service and local service businesses
- primary intake path: manual file upload
- primary output: a weekly cash and margin brief
- current proof path: upload data -> parse -> normalize/extract facts -> review evidence -> generate decision-pack workflow outputs

This repo contains the working Next.js app, local development tooling, product docs, design prototypes, and sample business documents used to exercise the pipeline.

## Current Product Reality

What works in the prototype today:

- public marketing site and blog
- authenticated workspace surfaces for dashboard, pipeline, explorer, packs, ask, and settings
- manual upload flows for CSV, XLSX, and PDF
- parser and extraction paths that materialize document facts with evidence metadata
- explorer and document review surfaces with key findings, citations, and source review cues
- prototype decision-pack generation and recommendation feedback flows
- local file-backed development mode, plus optional Postgres and pgvector support

What this is not yet:

- a production-ready multi-tenant SaaS deployment
- a broad connector platform
- a fully validated analytics engine for every downstream recommendation

The architecture docs in `docs/` are a mix of current implementation notes and target-state direction. Default to the code and the changelog when there is any conflict.

## Stack

- Next.js 16
- React 19
- TypeScript
- Vitest
- Playwright
- OpenAI SDK
- local JSON/file-backed repositories for fast iteration
- optional PostgreSQL 16 + pgvector for local database-backed testing

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create a local env file from the template:

```bash
copy .env.example .env
```

3. Start the app:

```bash
npm run dev
```

4. Open the app at `http://localhost:3000`.

Notes:

- Local development defaults to file-backed repositories, so Postgres is not required for basic app usage.
- `OPENAI_API_KEY` is optional for general local UI work, but required for the OpenAI-backed ask and extraction paths.

## Useful Commands

From the repo root:

```bash
npm run dev
npm run build
npm run check
npm run test
npm run typecheck
npm run lint
```

App-only commands:

```bash
npm run dev --workspace web
npm run test --workspace web
npm run typecheck --workspace web
npm run test:e2e --workspace web
```

## Environment

The default env template is in [`.env.example`](./.env.example).

Common values:

- `DATABASE_URL`: Postgres connection string for database-backed runs
- `OPENAI_API_KEY`: enables OpenAI-backed ask and extraction services
- `BIZOPS_OPENAI_ASK_MODEL`: ask model override
- `BIZOPS_OPENAI_EXTRACTION_MODEL`: extraction model override
- `BIZOPS_AUTH_SECRET`: local auth session signing secret
- `BIZOPS_STORAGE_ROOT`: raw file/object storage root for local mode
- `BIZOPS_RECORDS_ROOT`: local record store root for file-backed repositories

Do not commit `.env`.

## Optional Local Postgres

If you want the local database-backed setup, use the Windows scripts already included in the repo:

```bash
npm run db:install:vector
npm run db:init
npm run db:check
npm run db:test
```

Reference: [`docs/local-postgres.md`](./docs/local-postgres.md)

## Repo Layout

- [`apps/web`](./apps/web): main Next.js app
- [`assets/docs`](./assets/docs): sample business documents and testing fixtures
- [`design`](./design): static design prototypes
- [`docs`](./docs): architecture notes, QA workflows, and implementation references
- [`infra/sql`](./infra/sql): local Postgres and verification SQL
- [`scripts`](./scripts): setup, seed, and research scripts

Within the app, code is organized feature-first under [`apps/web/src/features`](./apps/web/src/features).

## Recommended Read Order

- [`changelog.md`](./changelog.md)
- [`docs/architecture.md`](./docs/architecture.md)
- [`docs/local-postgres.md`](./docs/local-postgres.md)
- [`docs/manual-testing-workflows.md`](./docs/manual-testing-workflows.md)
- [`docs/manual-playwright-document-fact-review-script.md`](./docs/manual-playwright-document-fact-review-script.md)

## Current Testing Focus

The current QA focus is:

- reliable manual upload for CSV and XLSX, with PDF support exercised as a secondary path
- readable document review in Explorer
- grounded fact labels, values, evidence, and excerpts
- pack lifecycle workflow validation

Reference sample documents:

- `assets/docs/10020Records.csv`
- `assets/docs/supermarket_sales - Sheet1.csv`
- `assets/docs/weekly_cash_margin_alert.pdf`

## Development Notes

- Keep MVP scope tight: field-service first, weekly cash and margin brief first.
- Prefer explicit contracts, runtime validation, and evidence-backed outputs.
- Keep domain logic under `src/features` testable and deterministic where practical.
- Treat docs as implementation-adjacent artifacts; update them when behavior changes.
