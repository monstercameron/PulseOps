# Web App

Next.js prototype for the BizOps Accelerator MVP.

## Scope

- Marketing pages for the public site
- Authenticated workspace surfaces for dashboard, pipeline, explorer, packs, ask, and settings
- Route handlers backed by feature-first domain modules, local JSON repositories, and optional Postgres repositories

## Commands

From the repo root:

```bash
npm run dev
npm run check
```

App-only commands:

```bash
npm run dev --workspace web
npm run test --workspace web
npm run typecheck --workspace web
```

## Data shape

- Local development defaults to file-backed repositories for fast iteration.
- Postgres and pgvector support live under `infra/sql` and `scripts/`.
- The MVP pipeline stays constrained to upload -> parse -> extraction -> facts -> metrics -> recommendation surfaces.
