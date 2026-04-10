# Changelog

## 2026-04-10

### Storage and Downloads
- Added settings-driven source-file retention, raw-upload cleanup after processing, and original document download routes with coverage for upload, ingestion, and document flows.
- Extended settings defaults and storage adapters so retained files, billing usage messaging, and download availability stay aligned across upload and workspace surfaces.

### Workspace Localization
- Localized dashboard, explorer, pipeline, dialogs, and workspace chrome with seeded UI translation bundles, locale-aware labels, and compact top-bar controls.
- Updated explorer and dashboard interactions to use localized filters, localized action labels, scoped detail panes, and document download entry points.

### Ask
- Added persistent thread scroll caching, auto-resizing composer behavior, and localized thread dialogs and status labels for the Ask surface.
- Fixed the empty-answer fallback so evidence-free responses render the localized no-answer state correctly.

### Content and Marketing
- Added a blog content workflow with public and workspace routes, CRUD API handlers, in-memory blog storage, and structured website contact details managed from settings.
- Wired website details into the home and contact marketing pages and added Playwright coverage for public blog, content admin, and website-detail flows.

### Research
- Added an extraction prompt optimization runner plus representative XLSX and PDF fixtures for evaluating structured fact extraction quality against expected business facts.

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

### Platform Follow-up
- Added UI locale infrastructure, translation bundle storage, locale switcher routes, and localized app and marketing shell content.
- Added current-actor resolution for authenticated workspace surfaces and threaded that context into the app shell.

### Settings Follow-up
- Added actor-aware account authorization rules, team account update flows, and richer settings state for current-user and team-member permissions.
- Added billing usage caps, masked payment method storage, updated billing summaries, and the supporting Postgres schema and repository changes.

### Ask Follow-up
- Added a conversational Ask fallback path for vague prompts, including a dedicated OpenAI Ask conversation service and model configuration.
- Added richer Ask message rendering with markdown support, thread actions, and thread message helpers for copy, fork, and clarification flows.

### UI Follow-up
- Improved explorer record selection with a responsive detail pane and explicit close behavior.
- Added small accessibility and interaction fixes across error surfaces, tables, buttons, dashboard actions, and workspace controls.
