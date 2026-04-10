# Restaurant Analysis Pack Example

## Scenario

We are role-playing a 48-seat fast-casual restaurant in South Florida.

Business profile:

- 1 location
- lunch and dinner dayparts
- average weekly sales: $32k to $38k
- main categories: bowls, tacos, smoothies
- 3 top perishables: chicken breast, avocado, romaine
- deliveries from vendor on Monday, Wednesday, Friday
- reorder lead time for perishables: 2 days
- owner wants 2 kinds of decisions first:
  - slowing sales
  - reorder alerts

## Available inputs this week

### POS sales export

- date
- daypart
- transactions
- net sales
- discounts
- avg ticket
- top items sold

### Inventory sheet

- sku
- on hand
- units sold / used
- waste
- open purchase orders
- vendor lead time

### Context notes

- no holiday in the current week
- no closure days
- one rainy Wednesday dinner

## Sample source metrics

### Last 7 days: dinner sales

| Day | Net sales | Transactions | Avg ticket |
| --- | --------: | -----------: | ---------: |
| Mon |     2,480 |          118 |      21.02 |
| Tue |     2,390 |          113 |      21.15 |
| Wed |     2,050 |           96 |      21.35 |
| Thu |     2,610 |          121 |      21.57 |
| Fri |     3,180 |          143 |      22.24 |
| Sat |     3,560 |          157 |      22.68 |
| Sun |     2,070 |           99 |      20.91 |

Current 7-day dinner totals:

- net sales = 18,340
- transactions = 847
- avg ticket blended = 21.65

### Baseline: prior 4 comparable weeks, dinner only

- expected 7-day dinner sales = 23,120
- expected transactions = 974
- expected blended avg ticket = 23.72
- sales std dev = 1,920

### Chicken breast inventory

- current on hand = 38 lb
- avg daily usage last 14 days = 14 lb/day
- std dev daily usage = 3.5 lb/day
- lead time = 2 days
- next delivery slot = 2 days from now
- open PO = 0 lb
- desired service level z = 1.28

## Example datapoint 1: slowing sales

### Algorithm

Use weekday-adjusted trailing baseline plus breadth checks.

```text
sales_delta_pct = (current_sales - expected_sales) / expected_sales
transactions_delta_pct = (current_transactions - expected_transactions) / expected_transactions
avg_ticket_delta_pct = (current_avg_ticket - expected_avg_ticket) / expected_avg_ticket
z_score = (current_sales - expected_sales) / sales_std_dev
```

### Calculation

- sales delta = (18,340 - 23,120) / 23,120 = -20.7%
- transactions delta = (847 - 974) / 974 = -13.0%
- avg ticket delta = (21.65 - 23.72) / 23.72 = -8.7%
- z-score = (18,340 - 23,120) / 1,920 = -2.49

### Derived datapoint object

```json
{
  "signal_type": "sales_velocity_down",
  "entity_scope": {
    "location": "miami_beach_store",
    "daypart": "dinner"
  },
  "window": {
    "current": "last_7_days",
    "baseline": "prior_4_comparable_weeks"
  },
  "input_metrics": {
    "current_sales": 18340,
    "expected_sales": 23120,
    "current_transactions": 847,
    "expected_transactions": 974,
    "current_avg_ticket": 21.65,
    "expected_avg_ticket": 23.72,
    "sales_std_dev": 1920
  },
  "derived_metrics": {
    "sales_delta_pct": -0.207,
    "transactions_delta_pct": -0.13,
    "avg_ticket_delta_pct": -0.087,
    "z_score": -2.49
  },
  "severity": 0.81,
  "confidence": 0.88,
  "data_sufficiency": 0.94,
  "economic_impact_estimate": {
    "weekly_revenue_gap": 4780
  },
  "blind_spots": [
    "weather impact likely contributed to Wednesday dinner softness"
  ],
  "explanation": "Dinner sales are down 20.7% versus the weekday-adjusted 4-week baseline, with both traffic and average ticket down. The magnitude is statistically large enough to treat as an actionable slowdown rather than routine noise."
}
```

### Why this should exist as a datapoint

This is not yet a recommendation. It is a reusable business signal that can feed:

- revenue pack
- labor pack
- marketing pack
- owner weekly brief

### Candidate actions this datapoint could support later

- inspect whether promo discounting rose
- compare menu mix shift toward lower-ticket items
- reduce one weak dinner prep item on midweek nights
- review local weather/event context before deeper action

## Example datapoint 2: inventory reorder alert

### Algorithm

Use reorder point and days-of-cover.

```text
reorder_point = avg_daily_usage * lead_time_days + z * stddev_daily_usage * sqrt(lead_time_days)
```

### Calculation

- demand during lead time = 14 \* 2 = 28 lb
- safety stock = 1.28 _ 3.5 _ sqrt(2) = 6.33 lb
- reorder point = 28 + 6.33 = 34.33 lb
- days of cover = 38 / 14 = 2.71 days
- projected stock at next delivery if normal usage continues = 38 - 28 = 10 lb

To make the alert more useful, add a weekend uplift rule.
Assume expected weekend uplift over the next 3 days raises effective daily demand to 16 lb/day.

Adjusted projection over 3 days:

- projected usage = 48 lb
- projected ending stock = -10 lb

### Derived datapoint object

```json
{
  "signal_type": "inventory_reorder_risk",
  "entity_scope": {
    "location": "miami_beach_store",
    "sku": "chicken_breast"
  },
  "window": {
    "usage_window": "last_14_days",
    "forecast_window": "next_3_days"
  },
  "input_metrics": {
    "on_hand_lb": 38,
    "avg_daily_usage_lb": 14,
    "usage_stddev_lb": 3.5,
    "lead_time_days": 2,
    "open_po_lb": 0,
    "service_level_z": 1.28
  },
  "derived_metrics": {
    "reorder_point_lb": 34.33,
    "days_of_cover": 2.71,
    "projected_stock_at_next_delivery_lb": 10,
    "weekend_uplift_adjusted_projected_stock_lb": -10
  },
  "severity": 0.89,
  "confidence": 0.84,
  "data_sufficiency": 0.91,
  "economic_impact_estimate": {
    "stockout_risk": "high",
    "menu_items_affected": ["protein bowl", "chicken tacos", "salad add-on"]
  },
  "explanation": "Chicken inventory is at risk of falling below safe operating levels before the next delivery window. Normal lead-time demand leaves only 10 lb projected on hand, and a modest weekend uplift would likely cause a stockout."
}
```

### Why this should exist as a datapoint

This datapoint can feed:

- reorder pack
- menu availability planning
- substitution planning
- prep and labor planning

### Candidate actions this datapoint could support later

- place a supplemental order today
- raise par level for Friday delivery window
- prep substitution messaging for affected menu items
- reduce promo emphasis on chicken-heavy items

## Prompt examples for the restaurant pack

## Prompt 1: generate datapoints from metrics

```text
System:
You generate restaurant operating datapoints from metric bundles.
Use only the provided metrics and business rules.
Do not recommend actions.
Return JSON array of datapoints.

User:
Business profile:
- fast casual restaurant
- one location
- dayparts: lunch, dinner

Metric bundle:
{{metric_bundle}}

Allowed signal types:
- sales_velocity_down
- sales_velocity_up
- avg_ticket_drop
- inventory_reorder_risk
- waste_spike
- labor_vs_sales_mismatch

Rules:
- only emit a signal if data_sufficiency >= 0.8
- include confidence, severity, blind_spots, and evidence_refs
- if no signal qualifies, return []
```

## Prompt 2: explain a datapoint

```text
System:
Write a compact explanation for an operator.
Say what changed, how large the change is, and why this is not just noise.
Do not suggest actions.
Keep to 2 to 4 sentences.

User:
Datapoint:
{{datapoint_json}}
Evidence:
{{evidence_packet}}
```

## Prompt 3: convert datapoints into actions

```text
System:
Generate specific, reversible operating actions for a restaurant owner.
Use only the provided datapoints.
Prefer actions that can be executed within 24 to 72 hours.
Return JSON.

User:
Business profile:
{{business_profile}}
Datapoints:
{{datapoints}}
Policy constraints:
{{policies}}
Return:
- recommendations[] with title, rationale, urgency, expected_impact, owner
```

## Prompt 4: verifier

```text
System:
Verify that each recommendation is fully supported by the datapoints.
Reject any recommendation that introduces unsupported causes or unsupported numeric claims.
Return JSON with pass/fail and reasons.
```

## Example final owner-facing summary

### Slowing sales

Dinner sales are down 20.7% versus the weekday-adjusted 4-week baseline. The decline is broad-based: traffic is down 13.0% and average ticket is down 8.7%, which suggests this is more than normal week-to-week noise.

### Inventory alert

Chicken breast is likely to fall below a safe reorder threshold before the next delivery window. Current on-hand inventory is 38 lb, but projected demand leaves little buffer, and a normal weekend lift would likely trigger a stockout.

## Bounded clarification questions the system should ask

- Should rainy-day dinner traffic be excluded from baseline calculations?
- Is chicken usage measured from POS depletion, prep sheets, or end-of-day counts?
- Are weekend uplift assumptions stable enough to hard-code for this location?
- Should promotions and discount spikes be treated as separate causes when sales slow?

## What to implement first for this pack

1. sales baseline computation
2. inventory reorder-point computation
3. datapoint schema
4. evidence packet assembly
5. datapoint explainer prompt
6. recommendation prompt
7. verifier prompt
8. feedback capture on accepted or rejected actions
