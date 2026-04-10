# API Todo List

Dashboard-driven surface area. Organized by feature. Each entry notes the current state, what's missing, and what would power it.

---

## Dashboard

### `GET /api/dashboard`

**Status:** Route exists. Handler wired. RSC page uses server function directly.

**Gaps:**
- No date-range filtering in repository queries (`listByOrgId` has no `since` param).
- No source filtering (upload / email / api).
- No document-family / status filtering.
- Falls back to full mock data when workspace has zero documents and should return an empty-state payload instead.
- Filter chips on the dashboard UI are cosmetic; they don't drive a server re-fetch yet.

**Todo:**
- [ ] Add `since?: Date`, `source?: DocumentSource`, `status?: DocumentStatus` to `DocumentRepository.listByOrgId`.
- [ ] Apply those filters in `getDashboardPageData` so filter chip selections are reflected in server data.
- [ ] Replace the `documents.length === 0` fallback with a structured empty-state payload (no fake HVAC numbers).

---

### `POST /api/dashboard/queue/resolve`

**Status:** Built. Persists queue resolution events, writes an audit log event, and revalidates the dashboard.

**What this needs:**
- A `QueueEvent` domain model: itemId, orgId, action, actorId, resolvedAt.
- A `QueueEventRepository` with `put` and `listByOrgId`.
- The server action should persist the event, then revalidate.
- Queue items visible on the dashboard should exclude items with a recent resolution event.

**Todo:**
- [x] Define `QueueEvent` domain model and Zod schema.
- [x] Implement `LocalQueueEventRepository` (file-based, same pattern as other local repos).
- [x] Add `queueEventRepository` to `localIngestionRuntime`.
- [x] Update `resolveQueueItemAction` to call `queueEventRepository.put(...)` before `revalidatePath`.
- [x] Filter resolved queue item IDs out of `buildQueueItems` in `getDashboardPageData`.

---

## Pipeline

### `GET /api/pipeline`

**Status:** Route exists. Feeds `PipelinePage`. Status filter support is implemented for both the API route and the RSC page via `?status=`.

**Gaps:**
- Dashboard's "Inspect files" action navigates to `/pipeline` but can't pre-filter to failed documents.
- Dashboard's "Open explorer" action navigates to `/explorer` but can't pre-filter to review-status documents.

**Todo:**
- [x] Support `?status=failed` and `?status=parsed,classified` search params on the pipeline page.
- [ ] Pass pre-selected status filter from dashboard navigation into the page state.

---

### `PATCH /api/pipeline/[documentId]/status`

**Status:** Built. Updates an individual document's status, validates legal transitions, emits an audit log event, and revalidates `/pipeline` and `/dashboard`.

**Needed for:**
- Dismissing a failed document from the operator queue.
- Approving a parsed document for extraction.
- Manually marking a document for re-parsing.

**Todo:**
- [x] Add a PATCH or PUT handler for document status transitions.
- [x] Validate that the requested transition is legal (e.g. `failed -> uploaded` for retry).
- [x] Emit an audit log event on status change.
- [x] Call `revalidatePath("/pipeline")` and `/dashboard` after update.

---

## Upload / Ingest

### `POST /api/ingest/upload`

**Status:** Route exists.

**Gaps:**
- Dashboard "Upload files" header button navigates to `/pipeline` rather than opening an upload flow directly.

**Todo:**
- [ ] Build an upload modal or page segment at `/pipeline/upload` that calls `/api/ingest/upload`.
- [ ] Wire the dashboard header "Upload files" button to that route once it exists.

---

## Decision Packs / Weekly Brief

### `GET /api/packs`

**Status:** Route exists. Feeds `PacksPage`.

**Gaps:**
- Dashboard "Open weekly brief" navigates to `/packs`. No specific pack is selected.
- Business summary `title` on the dashboard is a generic string, not a real brief title from a pack record.

**Todo:**
- [x] Expose `latestPackId` from `packs` query so the dashboard can link directly to the current brief.
- [x] Update `getDashboardPageData` to fetch the latest pack from a `PackRepository` and use its title/description in `businessSummary`.

---

### `POST /api/packs/generate`

**Status:** Built. Generates a local pack record immediately and returns a completed job response.

**Needed for:** "Open this week's brief" when no brief exists yet should offer to generate one.

**Todo:**
- [x] Define the brief generation job trigger: calls the extraction + recommendation pipeline for a given org + date range.
- [x] Implement the API route.
- [x] Return a job ID so the UI can poll for readiness.
- [ ] Update the dashboard business summary CTA to show a "Generate brief" button when no pack exists.

---

### `GET /api/packs/[packId]`

**Status:** Built. Returns a single pack record from the local pack repository or the derived workspace pack set.

**Todo:**
- [x] Implement route to return a single pack's recommendations, citations, and confidence metadata.
- [ ] Power the pack detail page and the brief preview in the dashboard business view.

### `POST /api/packs/[packId]/review`

**Status:** Built. Marks a generated pack as reviewed.

### `GET /api/packs/[packId]/export`

**Status:** Built. Exports a pack as a plaintext attachment for now.

### `POST /api/packs/[packId]/recommendations/[recommendationId]/feedback`

**Status:** Built. Records local accept or reject feedback for pack recommendations without the auth-gated brief feedback path.

---

## Business Signals

### `GET /api/signals`

**Status:** Built. Exposes the same current workspace signal set used by the dashboard.

**Mock signals that need real computation:**
| Signal | Mock value | What's needed |
|---|---|---|
| Past-due invoices | $42,800 | Fact records with `type: "invoice"` and a due-date field past today |
| Likely underpriced jobs | 3 jobs | Job margin facts compared against a target margin threshold |
| Margin trend | +2.1% | Aggregated revenue and cost facts over two date windows |
| Parts cost anomaly | $1,200 | Statistical deviation from historical parts-cost facts |
| Recommendation acceptance | 71% | Feedback event ratio from `FeedbackRepository` |

**Todo:**
- [ ] Define a `SignalComputer` service that reads from `FactRepository` and `FeedbackRepository`.
- [ ] Add financial metadata fields (`amount`, `dueDate`, `marginPct`, `category`) to the canonical fact schema.
- [ ] Implement signal computations one at a time, starting with pipeline risk (already real) and fact coverage (already real).
- [x] Expose as a dedicated `GET /api/signals?orgId=` endpoint and call it from `getDashboardPageData`.

---

## Explorer

### `GET /api/explorer/records`

**Status:** Route exists. Supports `?status=` and `?documentId=` filtering in both the API route and the RSC page.

**Gaps:**
- Dashboard "Review" and "Open explorer" actions still land on the explorer with no pre-filter context.

**Todo:**
- [x] Add `?status=` and `?documentId=` as optional filter params on the explorer page.
- [x] Read search params server-side and pass them to the explorer data fetcher.
- [ ] Pass pre-selected status or document filters from dashboard navigation into the page state.

---

## Settings / Org

### `GET /api/settings`

**Status:** Route exists. Reads organization metadata plus account-backed team membership when available, with settings-record fallback for local prototype state.

**Gaps:**
- Workspace name on the dashboard is `DEFAULT_WORKSPACE.name`, a compile-time constant. Should come from an org settings record.
- Integration connection status ("ServiceTitan online" in mock data) has no real source.

**Todo:**
- [x] Store org name in a settings record (Postgres at scale, JSON file locally).
- [x] Return org name from `GET /api/settings?orgId=`.
- [x] Add an `integrations` field to settings returning per-connector health status.
- [x] Update `getDashboardPageData` to fetch org name from settings instead of using `DEFAULT_WORKSPACE`.

### `PATCH /api/settings`

**Status:** Built. Persists organization updates to the org record and keeps notification / preference state in the settings record.

### `POST /api/settings/team/invitations`

**Status:** Built. Persists invited team members into `account_users` + `organization_memberships` when the account store is available, with legacy settings-record fallback for local-only flows.

### `POST /api/settings/security/api-keys/revoke`

**Status:** Built. Revokes API keys from the local settings record.

### `POST /api/settings/security/sessions/revoke`

**Status:** Built. Revokes non-current sessions from the local settings record.

---

## Ask

### `GET /api/ask/threads`

**Status:** Built. Returns saved question history via the dedicated route alias.

**Gaps:**
- Activity feed "Open Ask" link navigates to `/ask` with no thread context. No way to deep-link to a saved thread.

**Todo:**
- [ ] Add `?threadId=` param support to the Ask page so dashboard activity items can link directly to the relevant conversation.

### `GET /api/ask/threads/[threadId]`

**Status:** Built. Returns a single saved thread and its query plan.

---

## Audit / Observability

**Status:** `AuditLogRepository` exists in runtime. Dashboard queue actions and pipeline status transitions now persist audit entries.

**Todo:**
- [x] Emit an audit log event from `resolveQueueItemAction` when it persists a queue resolution.
- [ ] Include `orgId`, `actorId`, `queueItemId`, `action`, and `resolvedAt` fields.
- [ ] Surface recent audit events optionally in the dashboard activity feed alongside document activity.

---

## Repository layer gaps (cross-cutting)

These are needed before multiple APIs above can be built:

- [ ] `DocumentRepository.listByOrgId` add filter options: `since`, `source`, `status`, `documentFamily`.
- [ ] `FactRepository.listByOrgId` add filter options for fact `type` and `entityId` ranges.
- [x] New: `QueueEventRepository` persist and query operator queue resolution events.
- [x] New: `PackRepository` store generated decision packs and their recommendation sets.
- [ ] New: `IntegrationStatusRepository` track connector health timestamps and error states.
