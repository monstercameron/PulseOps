# Manual Testing Workflows

This document is the working reference for the next round of manual testing.

Use it to test the current prototype from manual file upload through document fact review and decision-pack actions.
It is grounded in current repo reality, not just target-state architecture.

## Reference docs

- `docs/analysis-engine-steering-memo.md`
- `docs/restaurant-analysis-pack-example.md`
- `docs/architecture.md`
- `docs/manual-playwright-document-fact-review-script.md`
- `docs/supported-format-matrix.md`
- `apps/web/src/features/foundation/domain/mvp-scope.ts`
- `apps/web/src/features/brief/domain/weekly-cash-margin-brief.ts`

## Current scope for manual testing

- Current MVP ICP: field-service businesses.
- Current MVP pack to treat as the primary sign-off path: weekly cash and margin brief.
- Current first intake path: manual upload.
- Current first structured formats to prioritize: CSV and XLSX.
- PDF is accepted and should be tested, but it is not the primary MVP success path.
- The restaurant analysis docs are useful design references for signal-first thinking, but they are not the current MVP sign-off path.

## Current prototype reality

- The intended analysis-engine pattern is still the right north star:
  `raw file -> parsed artifact -> typed extraction -> canonical facts -> metrics -> datapoints -> decision pack`.
- The visible document lifecycle in the prototype is simpler:
  `uploaded -> stored -> parsed -> classified -> extracted`, with `failed` as the exception path.
- The explorer now exposes document metadata, parser metadata, key findings, extracted facts, evidence summaries, and citations in one review surface.
- Decision-pack generation is still a prototype workflow surface. It proves pack lifecycle actions and source linkage, but it does not yet prove a fully grounded datapoint-driven recommendation engine end to end.

## Testing goals for this cycle

- Verify that manual uploads can move through the ingestion workflow without silent failure.
- Verify that document review surfaces present facts in readable business language rather than raw implementation detail.
- Verify that fact labels, values, evidence, and excerpts remain correct for a given document.
- Verify that extracted documents become visible as usable records for downstream surfaces.
- Verify that decision-pack generation, review, export, and recommendation feedback all work as operator flows.
- Separate workflow validation from business-output validation. A successful pack-generation click is not yet proof that recommendation logic is correct.

## Workflow 1: Upload New Business Files

### Goal

Get a newly uploaded business file into a state where it can contribute to downstream review and pack generation.

### Primary operator surfaces

- Dashboard upload flow
- Pipeline page
- Explorer page for record review

### Recommended test order

1. Upload a valid CSV.
2. Upload a valid XLSX.
3. Re-upload the same file to verify duplicate handling.
4. Upload a valid PDF.
5. Trigger at least one negative case:
   invalid format, mismatched extension, oversize file, or password-protected file.

### What testers should verify

- A document ID is returned after upload.
- The file appears in pipeline activity.
- The file progresses through statuses without getting stuck unexpectedly.
- Duplicate uploads are flagged as duplicates instead of creating misleading new records.
- Classification confidence is present when classification occurs.
- Successfully processed files become available for downstream review surfaces, even if full extraction is not configured in the current environment.
- Errors are visible and understandable when upload or processing fails.

## Workflow 2: Review Document Facts

### Goal

Confirm that the explorer turns processed documents into readable, trustworthy review records.

### Primary operator surfaces

- Explorer list and search
- Explorer detail pane
- Document download action

### Entry criteria

- At least one document is visible in Explorer.
- At least one document has facts attached.
- Prefer one extracted record and one earlier-stage record if both are available.

### Expected workflow

1. Open the explorer.
2. Find a known document by file name.
3. Open the detail pane.
4. Confirm the header answers:
   what file this is, where it came from, and what state it is in.
5. Review document metadata and parser metadata.
6. Review key findings before reading the full fact list.
7. Inspect extracted facts one by one.
8. Cross-check the most important values against the underlying document or seeded source.
9. Review citations and evidence language.
10. Download the source file when needed to confirm the review path feels trustworthy.

### What testers should verify

- Search by file name is fast and reliable.
- The detail pane opens without losing orientation.
- Key findings summarize the document in business language.
- Fact labels are readable and specific.
- Fact values are formatted correctly for money, dates, counts, and text.
- Fact descriptions explain what the number or value means.
- Evidence summaries point back to a real source location.
- Source excerpts, when present, support the fact rather than confusing it.
- The interface does not force the operator to read canonical IDs to understand the document.
- Missing facts, missing citations, and review-needed states are handled cleanly.

### Current pass criteria

- A tester can identify the important business takeaways from the key findings alone.
- The extracted fact cards feel like review tools, not raw database rows.
- At least one sampled value is verified against the source document and found to be correct.
- Evidence copy is understandable without technical background.

## Workflow 3: Generate And Review A Decision Pack

### Goal

Validate the operator flow for creating and acting on a decision pack after uploads and document review have produced usable records.

### Current pack under test

- `Weekly Cash and Margin Brief`

### What testers should verify

- Pack generation succeeds from the packs surface.
- A new pack record appears with a fresh generated timestamp.
- The pack shows source records, recommendation confidence, and citations.
- Review action updates the pack state cleanly.
- Export action succeeds.
- Recommendation accept and dismiss actions persist feedback.

### Current cautions

- Current pack generation still uses scaffolded pack content and fallback behavior in places.
- This testing cycle should not sign off on recommendation correctness, impact estimation, or root-cause accuracy.
- Treat this cycle as a workflow and trust-surface validation pass, not a final analytics-quality pass.

## Workflow 4: Future Signal-First Pack Pattern

This workflow is a design reference for later vertical packs and should not be used as the current MVP sign-off path.

### Why it matters

The analysis-engine memo and restaurant example describe the right long-term pattern:

1. reconstruct business truth
2. build stable metrics
3. generate typed datapoints
4. rank candidate actions
5. assemble a decision pack

### Manual-testing takeaway

For later vertical testing, the pack should be judged on whether it is built from typed datapoints with evidence refs, confidence, sufficiency, and blind spots.
That is the standard to work toward, but it is not yet the field-service MVP sign-off gate.

## Recommended fixture set for this testing round

Use the seeded documents already surfaced by the local explorer first.

- `10020Records.csv`
- `supermarket_sales - Sheet1.csv`

Then add at least one fresh upload for end-to-end workflow validation.

## Suggested manual test run order

1. Upload a fresh CSV or XLSX.
2. Confirm the document reaches a successful downstream state such as `parsed`, `classified`, or `extracted`.
3. Open the explorer and find the uploaded file.
4. Review one seeded extracted document in detail.
5. Review the fresh upload in detail.
6. Cross-check at least one high-signal fact against the source document.
7. Generate a new weekly cash and margin brief.
8. Review the pack.
9. Export the pack.
10. Accept one recommendation and dismiss another.

## What to record during manual testing

- date and tester
- org ID used
- file name and format
- document ID
- observed status progression
- suggested document family
- confidence shown to the operator
- whether the document was easy to find again
- whether the key findings matched the underlying facts
- whether sampled fact values were correct against the source
- whether evidence language felt clear and trustworthy
- whether a generated pack referenced the uploaded workspace documents
- any trust issues:
  missing citations, weak confidence display, unclear failure states, or unsupported claims

## Exit criteria for this manual-testing round

- Manual upload works reliably for CSV and XLSX.
- Explorer review makes the document understandable in one pass.
- At least one sampled fact is verified against the source and is correct.
- Pack lifecycle actions all work from the UI.
- The team has a clean list of where workflow quality is solid versus where analytics quality still needs work.
