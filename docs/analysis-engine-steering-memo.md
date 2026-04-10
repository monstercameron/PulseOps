# Analysis Engine Steering Memo

## 1. Core idea

The analysis engine should not try to "answer questions from documents" in one step. It should convert noisy operational inputs into **ranked, evidence-backed business datapoints**, then assemble those datapoints into **decision points**.

The engine's job is:

1. Observe messy business exhaust.
2. Reconstruct likely business truth.
3. Detect meaningful change or risk.
4. Explain why it matters.
5. Route the result into a decision pack.

A **datapoint** is a compact, machine-usable business signal.

Examples:

- `sales_velocity_down`
- `inventory_reorder_risk`
- `labor_cost_spike`
- `customer_repeat_rate_drop`
- `invoice_collection_risk`

A **decision point** is a business question that can consume multiple datapoints.

Examples:

- What should the owner change this week?
- What should be reordered today?
- Which menu or shift is underperforming?
- Which branch needs intervention?

## 2. North-star principles

### Principle 1: Separate observation from recommendation

The engine should first compute facts and signals, then generate recommendations. This keeps the system debuggable.

### Principle 2: Every signal needs provenance

Every datapoint must link back to source rows, files, events, or extracted facts.

### Principle 3: Confidence is part of the payload

A useful signal includes confidence, data sufficiency, freshness, and known blind spots.

### Principle 4: Prefer bounded business semantics over free-form AI

LLMs should map and explain. They should not invent the metric model.

### Principle 5: Decision packs are reusable DAGs

A decision pack should consume typed datapoints rather than raw files.

## 3. Object model

### Raw assets

- files
- api events
- tables
- messages
- form responses
- transactions

### Parsed artifacts

- normalized text
- table grids
- document spans
- extracted entities
- row-level tabular records

### Canonical business objects

- organization
- location
- menu item / sku
- vendor
- customer
- employee
- shift
- sale event
- purchase event
- inventory movement
- payment event
- review / survey response

### Derived datapoints

Datapoints are typed signal objects.

```json
{
  "signal_type": "sales_velocity_down",
  "entity_scope": {
    "organization_id": "org_1",
    "location_id": "loc_miami_beach",
    "dimension": "daypart",
    "dimension_value": "dinner"
  },
  "window": {
    "current_start": "2026-04-01",
    "current_end": "2026-04-07",
    "baseline_start": "2026-03-04",
    "baseline_end": "2026-03-31"
  },
  "metrics": {
    "current_sales": 18340,
    "baseline_expected_sales": 23120,
    "delta_pct": -0.2067,
    "transactions_delta_pct": -0.13,
    "avg_ticket_delta_pct": -0.088
  },
  "confidence": 0.86,
  "severity": 0.78,
  "data_sufficiency": 0.92,
  "evidence_refs": ["sales_export_2026_w14.csv:rows_300_352"],
  "explanation": "Dinner sales are running 20.7% below the weekday-adjusted 4-week baseline, driven by fewer covers and a smaller average ticket.",
  "downstream_packs": ["restaurant_revenue_pack"]
}
```

## 4. Analysis engine layers

### Layer A: business reconstruction

Input is messy and contradictory. This layer aligns source data into a canonical time series and entity graph.

Tasks:

- column mapping
- entity resolution
- dedupe
- timestamp normalization
- unit normalization
- location mapping
- menu/SKU mapping
- vendor mapping

### Layer B: metric builder

Turn reconstructed objects into stable metrics.

Restaurant examples:

- daily sales
- covers
- average ticket
- gross margin estimate
- item velocity
- waste
- stock on hand
- days of cover
- supplier lead time

### Layer C: signal generation

Run algorithms over metrics to produce datapoints.

### Layer D: recommendation synthesis

Consume datapoints plus business context to generate actions.

### Layer E: feedback and learning

Use accept/reject/edit/outcome signals to calibrate thresholds and ranking.

## 5. Core algorithms

## 5.1 Data sufficiency scoring

Before generating a signal, verify that the dataset is usable.

Example components:

- freshness score
- coverage score
- row completeness score
- field confidence score
- cross-source agreement score

```text
sufficiency = 0.30*freshness + 0.25*coverage + 0.20*completeness + 0.15*field_confidence + 0.10*cross_source_agreement
```

Signals below a sufficiency threshold should be downgraded or routed to review.

## 5.2 Baseline modeling for SMB data

SMB data is noisy, sparse, and seasonal. Use simple, stable baselines first.

Recommended baseline stack:

1. Same-day-of-week trailing 4 to 8 weeks baseline
2. EWMA trend smoothing
3. Holiday/event exclusion rules
4. Optional weather/tourism/context features later

For restaurants, compare:

- Monday lunch vs prior Mondays
- Friday dinner vs prior Fridays
- current week vs prior 4 similar weeks

Avoid comparing raw daily sales without weekday adjustment.

## 5.3 Change detection / slowdown detection

For slowing sales, combine three tests:

1. Relative deviation from adjusted baseline
2. Short-term slope deterioration
3. Breadth check across linked measures

Example logic:

- sales delta < -12%
- and transaction count delta < -8% or avg ticket delta < -6%
- and at least 4 comparable prior periods exist
- and data sufficiency > 0.8

Severity score example:

```text
severity = clamp(
  0.45*abs(delta_sales_pct_norm) +
  0.20*abs(delta_transactions_pct_norm) +
  0.15*abs(delta_avg_ticket_pct_norm) +
  0.10*slope_change_norm +
  0.10*recency_norm
)
```

## 5.4 Inventory reorder algorithm

For restaurants, reordering should be a blend of usage velocity, current stock, lead time, and variability.

Recommended formula:

```text
reorder_point = demand_during_lead_time + safety_stock

demand_during_lead_time = avg_daily_usage * supplier_lead_time_days

safety_stock = z * stddev_daily_usage * sqrt(lead_time_days)
```

Where:

- `avg_daily_usage` is usually a weighted 14-day or 28-day mean
- `stddev_daily_usage` captures volatility
- `z` reflects desired service level

Then:

```text
days_of_cover = on_hand / avg_daily_usage
reorder_risk = sigmoid((reorder_point - on_hand) / max(reorder_point, 1))
```

Add practical checks:

- upcoming weekend or holiday uplift
- menu dependency concentration
- perishability
- vendor outage / delivery cadence
- substitution availability

## 5.5 Multi-signal ranking

A recommendation should rarely depend on one datapoint.

Rank candidate actions by:

- severity
- confidence
- expected economic impact
- reversibility
- urgency
- operator preference / policy

Example:

```text
priority = 0.30*severity + 0.20*confidence + 0.25*impact + 0.15*urgency + 0.10*policy_weight
```

## 5.6 Evidence assembly

Before any language output, assemble a compact evidence packet.

Example evidence packet:

- top changed metrics
- baseline comparison
- top contributing SKUs or channels
- source file refs
- freshness
- blind spots

LLM text generation should consume the evidence packet, not the raw warehouse.

## 6. Prompt architecture

LLMs should be used in a staged way.

## 6.1 Prompt role: business profiler

Purpose: infer likely operating model and suggest candidate decision packs.

Input:

- sample files
- source names
- a short user description

Output:

- business type
- primary revenue model
- likely key dimensions
- candidate metric packs
- missing information questions

## 6.2 Prompt role: field mapper

Purpose: map messy columns or extracted fields to canonical schema.

Constraints:

- must return confidence per field
- must explain uncertain mappings
- must propose manual questions when ambiguity is high

Prompt skeleton:

```text
System:
You map tabular business data into a canonical schema.
Do not invent fields.
Return only JSON.
Mark uncertain mappings explicitly.

User:
Business profile:
{{business_profile}}

Canonical schema candidates:
{{schema_candidates}}

Observed columns:
{{observed_columns}}

Sample rows:
{{sample_rows}}

Return:
- field_mappings
- ignored_fields
- confidence_by_field
- open_questions
```

## 6.3 Prompt role: document fact extractor

Purpose: extract typed JSON from invoices, bills, contracts, tax docs, surveys, and similar artifacts.

Prompt skeleton:

```text
System:
Extract structured business facts from the document.
Use only supported schema fields.
If a value is missing, set null.
If uncertain, include a confidence score and evidence span.
Return valid JSON only.

User:
Document class: {{doc_class}}
Schema: {{json_schema}}
Parsed text: {{parsed_text}}
Table snippets: {{table_snippets}}
Layout spans: {{layout_spans}}
```

## 6.4 Prompt role: datapoint explainer

Purpose: convert evidence packets into operator-readable explanations.

Prompt skeleton:

```text
System:
Write a compact business datapoint explanation.
Do not recommend actions yet.
State what changed, how large the change is, and the confidence.
Mention blind spots if material.

User:
Datapoint object:
{{datapoint_json}}
Evidence packet:
{{evidence_packet}}
```

## 6.5 Prompt role: recommendation generator

Purpose: convert a small set of datapoints into candidate actions.

Prompt skeleton:

```text
System:
You are generating candidate operating actions for a small business manager.
Use only the provided datapoints and evidence.
Prefer reversible, specific actions.
Do not repeat facts without proposing action.
Return JSON.

User:
Business profile:
{{business_profile}}
Decision pack:
{{pack_id}}
Datapoints:
{{datapoints}}
Business policies:
{{policies}}
Return:
- recommendations[] with title, rationale, expected_impact, urgency, confidence, owner
```

## 6.6 Prompt role: critic / verifier

Purpose: catch hallucinated actions or unsupported claims.

Prompt skeleton:

```text
System:
Verify whether each recommendation is fully supported by the datapoints.
Reject any recommendation that introduces unsupported causes or numbers.
Return a pass/fail decision and reasons.
```

## 7. Restaurant pack: minimum viable datapoints

For a restaurant analysis pack, the first stable datapoints should be:

- sales_velocity_down
- sales_velocity_up
- avg_ticket_drop
- cover_count_drop
- menu_mix_shift
- inventory_reorder_risk
- waste_spike
- labor_vs_sales_mismatch
- vendor_cost_increase
- repeat_customer_drop
- negative_feedback_cluster

## 8. Signal schema

Every datapoint should include:

```json
{
  "signal_id": "sig_x",
  "signal_type": "inventory_reorder_risk",
  "entity_scope": {},
  "window": {},
  "input_metrics": {},
  "derived_metrics": {},
  "severity": 0.0,
  "confidence": 0.0,
  "data_sufficiency": 0.0,
  "economic_impact_estimate": null,
  "recommended_next_check": null,
  "evidence_refs": [],
  "blind_spots": [],
  "status": "candidate"
}
```

## 9. Guardrails

- Do not let LLMs create facts that bypass extraction or metrics.
- Never emit a recommendation without evidence refs.
- Never compare unlike periods without context adjustment.
- Never treat missing data as zero without an explicit rule.
- Separate operator-facing explanation from analyst/debug metadata.
- If the confidence is low, ask a bounded clarification question.

## 10. Feedback loop

Track for every recommendation:

- accepted / rejected / edited
- who changed it
- why
- downstream observed outcome
- original datapoints used
- prompt version
- threshold version

Learning targets:

- threshold tuning
- ranking improvements
- prompt simplification
- confidence calibration
- better missing-data questions

## 11. Build order for the analysis engine

1. canonical metrics for one vertical
2. datapoint schema and evidence packet schema
3. baseline + anomaly algorithms
4. recommendation generator prompt
5. verifier prompt
6. feedback capture
7. threshold tuning
8. decision-pack registry

## 12. What success looks like

The engine is working when it can do this reliably:

- ingest messy restaurant data
- reconstruct sales and inventory truth with acceptable confidence
- produce a slowing-sales datapoint before an owner notices manually
- produce a reorder alert early enough to act
- explain both with source-linked evidence
- improve over time based on operator feedback
