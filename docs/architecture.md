# Architecture

## Core principle

Use a **three-store model**:

1. **Object storage**
   - raw uploads
   - rendered images
   - parser artifacts
   - audit snapshots

2. **Postgres**
   - organizations
   - documents
   - chunks
   - facts
   - metrics
   - decision runs
   - recommendations
   - feedback
   - experiments
   - policies
   - import blueprints

3. **Vector index**
   - document chunks
   - facts
   - decision-memory embeddings
   - feedback embeddings

At MVP, keep (2) and (3) in Postgres + pgvector. Do **not** add a separate NoSQL database unless load or product shape proves you need it.

## Why not dynamic tables per import?

Because uploads are messy and heterogeneous. A table-per-upload design creates:

- migration sprawl
- brittle downstream queries
- hard lineage
- tenant-specific logic everywhere

Instead use:

- **raw file**
- **parsed artifact**
- **typed extraction JSON**
- **canonical facts**
- **bucket registry**
- **materialized marts when needed**

## Pipeline

### A. Ingestion path

upload/email/api -> storage -> job queued -> parser -> document classifier -> extraction contract -> typed facts -> canonical entity linking -> embeddings -> metrics -> decision packs -> notifications/UI

### B. Question-answer path

question -> query planner JSON -> validator -> SQL/fact/vector executor -> answer composer -> citations -> user feedback

### C. Learning path

recommendation shown -> accept/reject/edit -> observed outcome later -> experiment evaluator -> prompt/rule updates

## Dynamic business buckets

Do not make the LLM invent arbitrary buckets on every run.

Use a **bucket registry**:

- location
- department
- crew
- job type
- customer segment
- product/service line
- vendor
- payment status
- aging band
- margin band

The system can propose new buckets from observed data, but humans should approve them.
