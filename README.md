# PulseOps

PulseOps is a prototype for a simpler kind of operations software for field-service businesses.

Instead of asking an owner or operator to live inside dashboards all day, PulseOps is built around a narrower promise:

- upload the files you already have
- reconstruct what matters
- show the facts with evidence
- help you act on cash and margin issues faster

The current MVP is focused on one business type, one intake path, and one decision rhythm:

- field-service and local service businesses
- manual file upload first
- a weekly cash and margin brief first

## What PulseOps Is Trying To Do

Most small operators do not need another generic analytics tool.
They need a faster way to answer questions like:

- Where is cash getting stuck?
- Which invoices or bills deserve attention this week?
- Which jobs or service lines are quietly dragging margin down?
- What should I review before the week gets away from me?

PulseOps is being shaped as an evidence-backed decision layer for those questions.

The product direction is intentionally constrained:

- not a broad BI platform
- not an open-ended "ask anything" toy
- not a connector-everything product on day one

The goal is operational clarity, not feature sprawl.

## What You Can See In The Prototype Today

The current repo includes a working product prototype with:

- a public marketing site and blog
- an authenticated workspace with dashboard, pipeline, explorer, packs, ask, and settings surfaces
- manual upload flows for CSV, XLSX, and PDF files
- document parsing and extraction flows
- explorer and document-review screens that surface findings, evidence, and citations
- a prototype decision-pack workflow for weekly cash and margin review

This is still a prototype, but it already shows the intended user experience:

1. Upload a business file
2. Parse and classify it
3. Extract facts with source evidence
4. Review the document in plain business language
5. Use those records inside downstream workflow surfaces

## Trust Matters Here

PulseOps is not being built as a black-box recommendation engine.

The product direction in this repo is centered on trust:

- facts should be reviewable
- evidence should be visible
- confidence should be explicit
- operators should be able to trace a claim back to a real source

That is why the prototype leans so heavily on:

- document review
- citations
- readable fact presentation
- evidence summaries

## Why This Repo Exists

This repository is the working home for:

- the app prototype
- local development tooling
- product and architecture notes
- design experiments
- sample business documents and testing fixtures

It is both a product repo and a working lab for narrowing the MVP.

If you are looking for the current implementation truth, start with:

- [`changelog.md`](./changelog.md)
- [`docs/architecture.md`](./docs/architecture.md)
- [`docs/manual-testing-workflows.md`](./docs/manual-testing-workflows.md)

## A Few Technical Notes

The product framing is business-first, but the implementation has a few deliberate choices:

- the app is built with Next.js, React, and TypeScript
- local development defaults to file-backed storage so the prototype is easy to run
- optional PostgreSQL + pgvector support is included for local database-backed testing
- the codebase is organized feature-first under [`apps/web/src/features`](./apps/web/src/features)

The current pipeline direction is:

`raw upload -> parsed artifact -> extracted facts -> review surface -> decision workflow`

That direction matters more than broad infrastructure at this stage.

## Running It Locally

1. Install dependencies:

```bash
npm install
```

2. Create a local env file:

```bash
copy .env.example .env
```

3. Start the app:

```bash
npm run dev
```

4. Open `http://localhost:3000`

Useful commands:

```bash
npm run dev
npm run check
npm run test
npm run build
```

If you want the optional local Postgres path, see [`docs/local-postgres.md`](./docs/local-postgres.md).

## Repo Layout

- [`apps/web`](./apps/web): main Next.js application
- [`assets/docs`](./assets/docs): sample source documents and testing fixtures
- [`design`](./design): static design prototypes
- [`docs`](./docs): architecture notes, QA workflows, and reference material
- [`infra/sql`](./infra/sql): local SQL setup and verification files
- [`scripts`](./scripts): setup, seed, and research scripts

## Current Scope Reminder

The repo is intentionally not trying to solve every workflow yet.

The current bar is smaller and sharper:

- one ICP first
- one upload path first
- one review workflow first
- one weekly brief first

That constraint is part of the product strategy, not a missing feature.
