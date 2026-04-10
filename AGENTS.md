AGENTS.md

Default operating rules for agents in this repo.

Context

- This repo is currently a small local prototype with a static design site and lightweight docs.
- The docs describe a target architecture, not a completed implementation.
- Do not assume the planned monorepo or service boundaries already exist.
- Default MVP assumptions unless the user changes them:
- ICP: field-service or local service businesses
- First product: weekly cash and margin brief
- First value path: upload data -> parse -> normalize -> derive facts and metrics -> generate cited recommendations

Product scope

- Freeze one ICP first. Do not broaden vertical scope until the first ICP works end to end.
- Freeze one decision pack first: weekly cash and margin brief.
- Do not turn the MVP into a general BI platform, data warehouse product, or open-ended ask-anything system before the core brief works reliably.
- Start with the smallest ingestion surface that proves value.
- First: manual upload.
- First formats: CSV and XLSX.
- Later: email forwarding, PDF, OCR, DOCX, and wider connectors.
- Public product claims, UI copy, and docs must stay aligned with actual implementation or be clearly marked as planned or mock.

Core architecture

- Keep storage simple.
- Use object storage for raw uploads and artifacts.
- Use Postgres for canonical application data.
- Use pgvector for embeddings at MVP.
- Do not add extra databases, queues, search engines, or infra products without a clear demonstrated need.
- Use one canonical pipeline:
- raw file
- parsed artifact
- typed extraction JSON
- canonical facts
- metrics
- recommendations or decision outputs
- Do not create dynamic tables per import or tenant-specific schemas.
- Prefer explicit contracts, stable schemas, and versioned cross-boundary payloads.
- Design multi-tenant org scoping into schema and APIs from day one, even if local development uses one org.

Trust, safety, and AI

- Trust is a core requirement, not polish.
- Every fact and recommendation must include provenance or citation metadata, confidence metadata, and enough source context to support review.
- LLMs must not receive unrestricted database or code execution access.
- All LLM outputs must be validated against explicit schemas before use.
- Use constrained planners, validators, and safe executors for query and recommendation flows.
- The system may propose new buckets or business dimensions, but must not create arbitrary dimensions automatically without human approval.
- Sensitive-data rules apply from the start:
- auth
- org and tenant access control
- auditability
- redaction strategy
- retention strategy
- backup awareness
- Do not defer security thinking to later hardening.

Repo and file organization

- Organize by feature, not by generic layer, where practical.
- Each feature should own its routes, server logic, schemas, UI, jobs, and tests where practical.
- Keep unrelated features in separate files and folders.
- Do not let shared, utils, or helpers become dumping grounds.
- Co-locate feature-specific types, validators, transformations, fixtures, and tests until reuse is real.
- Promote code to shared only after genuine reuse appears across features.
- Small stateless components may live in the same file as their parent component.
- Stateful, complex, or reusable components should be split into separate files.
- Keep naming stable and boring. Prefer predictability over cleverness.

Code style and design

- Prefer simple, explicit, typed, maintainable code.
- Prefer pure functions wherever feasible.
- Keep side effects at the edges:
- routes
- actions
- jobs
- DB adapters
- storage adapters
- network integrations
- Keep domain logic deterministic and testable.
- Inject time, randomness, and external state when practical so logic stays reproducible.
- Avoid speculative abstractions and premature frameworks.
- Avoid deep inheritance, magic registries, hidden coupling, and overly generic base classes.
- Avoid broad mutable shared state.
- Ban untyped escape hatches by default:
- no casual any
- no unchecked JSON blobs flowing through the system
- no undocumented cast chains
- Validate all external boundaries at runtime:
- request payloads
- env vars
- parser output
- queue events
- webhook bodies
- LLM output
- persisted JSON blobs

React and Next.js

- Default to React Server Components where possible.
- Add client components only for interactivity, browser-only APIs, local UI state, or imperative event handling.
- Keep client components thin.
- Push secure logic, fetching, normalization, and heavy transformations to the server side by default.
- Prefer streaming and progressive rendering for slow server work.
- Use Suspense and route segmentation intentionally where it improves UX.
- Decompose components when responsibilities, behavior, or state differ.
- Small stateless display fragments can be grouped together in one file.
- Avoid effect-heavy components and derived state when composition or server-driven data can solve it more directly.
- Avoid prop-drilling-heavy trees when better composition or server boundaries exist.

React performance

- Do not add useMemo, useCallback, or memo by habit.
- Use them only when profiling or a clear render bottleneck justifies them.
- Prefer meaningful optimizations such as startTransition, useDeferredValue, code splitting, streaming, virtualization for large lists, smaller payloads, and fewer client boundaries.
- Optimize data flow first, render code second.

Testing

- Add tests with the code, not later.
- Pure functions and core domain logic should get unit tests by default.
- Priority test targets:
- parsing
- normalization
- validation
- bucketing
- ranking
- recommendation logic
- planner and compiler logic
- citation and confidence behavior
- Add integration tests at important boundaries:
- route handlers
- server actions
- DB repositories
- job pipelines
- ingestion flows
- parser-to-canonical-model transitions
- Add regression tests for every bug fix when reasonable.
- Do not ship core logic that has no test path unless the user explicitly accepts that tradeoff.

Performance

- Measure before optimizing.
- Do not add complexity for hypothetical performance wins.
- If optimizing, base it on profiling data, traces, query analysis, reproducible latency evidence, or clear scale assumptions.
- Define and protect budgets where relevant:
- route latency
- DB query count
- page weight and bundle size
- ingestion throughput
- job runtime
- memory usage on heavy parse paths
- Default performance habits:
- avoid N+1 queries
- fetch only needed columns
- batch related lookups
- paginate large result sets
- stream or virtualize large UI lists
- keep heavy compute off the request path
- use background jobs for parsing, extraction, embeddings, and recommendation generation unless latency requirements demand otherwise
- avoid duplicate transforms and repeated fetches
- make caching explicit
- Every meaningful fetch path should have an intentional caching decision:
- uncached
- request-cached
- revalidated
- precomputed or materialized
- Cache invalidation ownership should be clear.
- Do not introduce stale-data risk casually in decision-critical paths.
- Prefer platform features and existing stack primitives before adding libraries.
- Keep dependency count low.
- New dependencies must provide clear value in productivity, correctness, or performance.

Data and jobs

- Background jobs must be idempotent and retry-safe.
- Use explicit status models for ingestion and pipeline steps.
- Design failure behavior intentionally:
- timeouts
- retries
- backoff
- dead-letter or failure visibility
- partial-failure handling
- Correlate artifacts and entities through stable IDs.
- Favor append-friendly audit trails over opaque mutation-only flows.

Observability

- Add structured logging from the beginning.
- Logs must be machine-readable and consistent.
- Prefer stable fields such as orgId, documentId, jobId, requestId, traceId, route, feature, phase, and outcome.
- Do not rely on unstructured console noise for important flows.
- Add OpenTelemetry support early.
- Trace critical flows end to end:
- ingestion
- parsing
- extraction
- ask and query flows
- recommendation generation
- feedback ingestion
- Correlate logs, traces, and job IDs across API, worker, parser, and DB boundaries.

UI quality

- Every user-facing feature should account for loading state, empty state, error state, retry path where applicable, and partial-data behavior where applicable.
- Keep UI copy precise and operationally useful.
- Accessibility is required:
- semantic HTML
- keyboard access
- reasonable contrast
- clear focus behavior
- Favor low-JS surfaces and minimal hydration where possible.

Documentation

- Keep docs synchronized with reality.
- If implementation changes repo structure, architecture, or phase ordering, update docs in the same change when practical.
- Clearly distinguish current state, target state, and planned state.
- Do not let outdated architecture docs drive incorrect implementation.

Agent workflow

- Before major work, verify current repo reality instead of assuming docs are fully current.
- Respect existing user changes. Never revert unrelated edits.
- Make the smallest coherent change that moves the project forward.
- When creating structure from scratch, prefer a clean scalable layout rather than patching ad hoc files everywhere.
- When a new feature adds a query, endpoint, pipeline step, or job, include scale assumptions and observability hooks.
- When a change affects trust, security, correctness, or performance, call that out explicitly.
- When in doubt: simplify, constrain scope, preserve traceability, keep core logic pure, test early, and measure real bottlenecks.

Heuristic summary

- sharp scope
- feature-first structure
- pure core logic
- typed validated boundaries
- server-first React
- explicit performance discipline
- strong observability
- tests by default
- high trust through citations and confidence
- minimal infra until proven necessary
