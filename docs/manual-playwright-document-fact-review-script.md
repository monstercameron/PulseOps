# Manual Playwright Script: Document Fact Review UX

This is the detailed manual QA script for the document and fact review path.

Use this document when the goal is not only to confirm that facts exist, but to judge whether the review experience feels clear, trustworthy, and genuinely useful.

## Scope

This script covers:

- explorer discovery
- search and selection
- detail-pane orientation
- document metadata
- parser metadata
- key findings
- extracted fact readability
- evidence and citation clarity
- source verification against the underlying document

This script does not sign off on the final quality of recommendation logic.
It signs off on document-level fact review quality and operator trust.

## Test stance

Treat this as a trust-and-clarity workflow test, not just a data-presence test.

The review path is only acceptable if all of the following are true:

- the operator can tell what document they are looking at immediately
- the most important business takeaways are visible before reading every fact
- fact labels and values read like business information, not storage records
- evidence is understandable without technical context
- a reviewer can verify at least one high-signal fact against the source file

## Preconditions

- App is running locally at the Playwright base URL.
- Use the default local workspace.
- The explorer has seeded documents available.
- Prefer reviewing `10020Records.csv` first because it contains stable seeded facts.
- If a fresh upload from the prior workflow exists, review that second.

## Recommended records

Primary seeded review:

- `10020Records.csv`

Secondary seeded review:

- `supermarket_sales - Sheet1.csv`

Fresh follow-through:

- one CSV or XLSX uploaded during the upload workflow

## Primary scenario matrix

| Scenario | Goal | Required outcome |
| --- | --- | --- |
| Explorer discovery | Confirm the review entry point is usable | Known document is easy to find |
| Detail-pane orientation | Confirm the pane answers basic operator questions | File, source, state, and timing are visible |
| Key findings quality | Confirm the page leads with value | Findings summarize the document in business language |
| Fact card readability | Confirm facts are easy to read | Labels, values, descriptions, and evidence make sense |
| Evidence trust check | Confirm facts can be defended | Evidence and citations point to real source context |
| Source correctness check | Confirm details are actually right | Sampled facts match the underlying source |

## Scenario 1: Explorer Discovery

### Operator action

1. Open `/explorer`.
2. Search for `10020Records.csv`.
3. Select the matching record.

### What Playwright should do

```ts
await page.goto("/explorer");
await page.getByPlaceholder("Search records...").fill("10020Records.csv");
await page.getByRole("button", { name: /10020Records\.csv/i }).click();
```

### Required UX outcome

- The document appears from a simple file-name search.
- The selected record is visually distinct.
- The detail pane opens without route confusion or layout jumpiness.

### UX quality bar

- Search should feel immediate in a small local workspace.
- The record should feel selected, not just hovered.

## Scenario 2: Detail-Pane Orientation

### Operator action

Review the detail header before scrolling.

### Required checks

- File name is the dominant heading.
- Source is visible.
- Status is visible.
- Date is visible.
- Confidence is visible when available.
- Download action is present when the file is retained.

### Required UX outcome

The header should answer:

- what is this file
- where did it come from
- is it ready
- can I pull the original source if I need to verify it

### God-tier standard

- A reviewer should not need to inspect raw IDs to get oriented.
- The header should feel like a review surface, not an admin console.

## Scenario 3: Key Findings Quality

### Operator action

Scroll to the `Key findings` section and read it before the full fact list.

### Required checks

- The section is easy to spot.
- Findings are few enough to scan quickly.
- Findings surface money, date range, totals, or other high-signal takeaways when present.
- Findings do not repeat the same low-value fact in multiple cards.

### Required UX outcome

- The operator can explain the document at a high level after reading only the findings.
- Findings read like business facts, not parser output.

### Manual judgment notes

Ask:

- Do these findings help an operator understand why the document matters?
- Are the findings ordered by importance?
- Do they feel derived from real evidence instead of invented summaries?

## Scenario 4: Fact Card Readability

### Operator action

Inspect the extracted fact cards in order.

### Required checks

- Each fact has a readable label.
- Values are formatted correctly:
  currency as currency, dates as dates, counts as counts.
- Description text explains what the fact means.
- Evidence is visible on the same card.
- Source field is visible for deeper review without dominating the card.
- Source excerpt appears when available.

### Required UX outcome

- The operator should be able to review facts without mentally translating raw schemas.
- Fact cards should feel like defended claims, not raw rows.

### God-tier standard

- A reviewer should be able to move from:
  `what is the claim`
  to `what does it mean`
  to `where did it come from`
  in one card.

## Scenario 5: Evidence Trust Check

### Operator action

Inspect the `Evidence` line on at least two fact cards and the citations section.

### Required checks

- Evidence points to a real source location:
  row, sheet, field, line range, or similar.
- Citation list exists when facts have citations.
- Evidence copy is understandable without backend jargon.

### Required UX outcome

- The operator should feel they can defend the fact to another person.
- Evidence should reduce doubt rather than create more confusion.

### Manual judgment notes

Ask:

- Does the evidence wording help a non-technical operator?
- Are the citations too abstract?
- Would you trust this enough to use it in an internal review call?

## Scenario 6: Source Correctness Check

### Operator action

Verify at least one high-signal fact against the source file.

### Suggested samples

- `Rows parsed` against the row count for `10020Records.csv`
- `Total profit` against the seeded aggregate for `10020Records.csv`
- one uploaded document fact against the uploaded source file

### What Playwright should do

This step is partly manual.
Use Playwright only to open the document review surface and, if available, download the file.

### Required functional checks

- The sampled fact matches the underlying source.
- Excerpt and evidence do not contradict the fact value.
- Reviewers can complete this check without reverse-engineering the system.

### Required UX outcome

- The product should make verification feel practical, not burdensome.

## UX Review Rubric

Score each category from `1` to `5`.

### Orientation

- `1`: reviewer is unsure what document is open
- `3`: basic context is present but scattered
- `5`: file, source, state, and timing are obvious immediately

### Findings quality

- `1`: no meaningful summary value
- `3`: findings exist but feel generic or repetitive
- `5`: findings quickly explain why the document matters

### Fact readability

- `1`: cards feel like raw database output
- `3`: labels are readable but still technical
- `5`: cards read like business review artifacts

### Evidence clarity

- `1`: evidence feels opaque or too technical
- `3`: evidence is present but not especially helpful
- `5`: evidence is plain-language and reviewable

### Correctness confidence

- `1`: reviewer cannot verify facts easily
- `3`: verification is possible with effort
- `5`: sampled facts are easy to verify and hold up cleanly

## Current UX gaps to watch closely

These are the most likely blockers to a top-tier sign-off:

- some source-field labels remain technical because they reflect real schema keys
- citations are still shown as a separate list instead of being fully inline with every fact
- there is no explicit per-fact approval or correction workflow yet
- there is no side-by-side raw document preview in the explorer

These are not reasons to skip testing.
They are reasons to score the experience honestly.

## Tester notes template

Record the following for each review run:

- document name
- route used to open it
- status shown
- top three findings shown
- one fact sampled for source verification
- whether the sampled fact was correct
- copy that felt especially clear
- copy that felt too technical
- trust concerns
- recommendation:
  ship, improve soon, or block

## Suggested sign-off rule

Do not call this workflow ready unless:

- the explorer detail pane feels readable in one pass
- findings explain the document before the user reads the full fact list
- sampled facts are correct against the source
- evidence is understandable without backend knowledge
- at least one reviewer says they would trust the page to validate a real business file
