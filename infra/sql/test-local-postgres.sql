\set ON_ERROR_STOP 1

select replace(gen_random_uuid()::text, '-', '') as run_suffix \gset

begin;

create temp table bizops_smoke_ids on commit drop as
select
  'dbtest_org_' || :'run_suffix' as org_id,
  'dbtest_billing_' || :'run_suffix' as billing_id,
  'dbtest_llm_usage_' || :'run_suffix' as llm_usage_id,
  'dbtest_doc_' || :'run_suffix' as doc_id,
  'dbtest_job_' || :'run_suffix' as job_id,
  'dbtest_event_' || :'run_suffix' as event_id,
  'dbtest_parser_' || :'run_suffix' as parser_id,
  'dbtest_text_parser_' || :'run_suffix' as text_parser_id,
  'dbtest_entity_' || :'run_suffix' as entity_id,
  'dbtest_fact_' || :'run_suffix' as fact_id,
  'dbtest_chunk_' || :'run_suffix' as chunk_id,
  'dbtest_chunk_invalid_' || :'run_suffix' as invalid_chunk_id,
  'dbtest_memory_' || :'run_suffix' as memory_id,
  'dbtest_policy_' || :'run_suffix' as policy_id,
  'dbtest_blueprint_' || :'run_suffix' as blueprint_id,
  'dbtest_decision_' || :'run_suffix' as decision_run_id,
  'dbtest_recommendation_' || :'run_suffix' as recommendation_id,
  'dbtest_experiment_' || :'run_suffix' as experiment_id,
  'dbtest_question_' || :'run_suffix' as question_id,
  'dbtest_feedback_' || :'run_suffix' as feedback_id,
  'dbtest_outcome_' || :'run_suffix' as outcome_id,
  'dbtest_audit_' || :'run_suffix' as audit_id,
  'source-hash-' || :'run_suffix' as source_hash,
  'sha256-smoke-' || :'run_suffix' as checksum_sha256;

insert into organizations (
  id,
  name,
  industry,
  location,
  revenue_model,
  invoice_cycle,
  team_size,
  goals,
  status
)
values (
  (select org_id from bizops_smoke_ids),
  'Smoke Test Services',
  'Field services',
  'New York, NY',
  'Invoice after completion',
  'Weekly',
  '12',
  array['Protect weekly margin', 'Reduce overdue AR'],
  'active'
);

insert into billing_accounts (
  id,
  org_id,
  plan_name,
  status,
  currency,
  monthly_platform_fee_cents,
  profit_premium_basis_points,
  billing_anchor_day_of_month
)
values (
  (select billing_id from bizops_smoke_ids),
  (select org_id from bizops_smoke_ids),
  'Growth',
  'active',
  'USD',
  14900,
  2000,
  9
);

insert into llm_usage_events (
  id,
  org_id,
  provider,
  model,
  feature,
  operation,
  input_tokens,
  cached_input_tokens,
  output_tokens,
  total_tokens,
  pricing_available,
  pricing_source,
  pricing_version,
  provider_input_cost_nano_usd,
  provider_output_cost_nano_usd,
  provider_total_cost_nano_usd,
  profit_premium_basis_points,
  billable_cost_nano_usd
)
values (
  (select llm_usage_id from bizops_smoke_ids),
  (select org_id from bizops_smoke_ids),
  'openai',
  'gpt-5-mini',
  'extraction',
  'generic-document-extraction',
  1000,
  100,
  500,
  1500,
  true,
  'gpt-5-mini',
  'openai-api-pricing-2026-04-09',
  227500,
  1000000,
  1227500,
  2000,
  1473000
);

insert into documents (
  id,
  org_id,
  file_name,
  file_extension,
  status,
  source,
  content_type,
  size_bytes,
  checksum_sha256,
  retention_policy_key,
  archive_after_days,
  raw_object
)
values (
  (select doc_id from bizops_smoke_ids),
  (select org_id from bizops_smoke_ids),
  'weekly-cash.csv',
  'csv',
  'stored',
  'upload',
  'text/csv',
  128,
  (select checksum_sha256 from bizops_smoke_ids),
  'retention/default',
  365,
  jsonb_build_object(
    'bucket', 'local',
    'key', 'orgs/org_local_smoke/documents/' || (select doc_id from bizops_smoke_ids) || '/2026/04/weekly-cash.csv',
    'sha256', (select checksum_sha256 from bizops_smoke_ids),
    'sizeBytes', 128,
    'createdAt', now(),
    'metadata', jsonb_build_object('source', 'db-test')
  )
);

insert into ingestion_jobs (
  id,
  org_id,
  document_id,
  status,
  attempt_count
)
values (
  (select job_id from bizops_smoke_ids),
  (select org_id from bizops_smoke_ids),
  (select doc_id from bizops_smoke_ids),
  'queued',
  1
);

insert into ingestion_events (
  id,
  org_id,
  document_id,
  job_id,
  kind,
  source,
  file_name,
  checksum_sha256,
  size_bytes,
  archive_after_days,
  retention_policy_key,
  deduplicated,
  estimated_ingest_cost_usd,
  metadata
)
values (
  (select event_id from bizops_smoke_ids),
  (select org_id from bizops_smoke_ids),
  (select doc_id from bizops_smoke_ids),
  (select job_id from bizops_smoke_ids),
  'upload.queued',
  'upload',
  'weekly-cash.csv',
  (select checksum_sha256 from bizops_smoke_ids),
  128,
  365,
  'retention/default',
  false,
  0.0016,
  jsonb_build_object('phase', 'smoke-test')
);

insert into parser_artifacts (
  id,
  document_id,
  parser_kind,
  sheet_count,
  sheets,
  total_row_count,
  confidence_score
)
values (
  (select parser_id from bizops_smoke_ids),
  (select doc_id from bizops_smoke_ids),
  'csv',
  1,
  jsonb_build_array(
    jsonb_build_object(
      'name', 'sheet-1',
      'rowCount', 2,
      'columnCount', 2,
      'headers', jsonb_build_array('customer', 'amount')
    )
  ),
  2,
  0.9
);

insert into text_parser_artifacts (
  id,
  document_id,
  parser_kind,
  text,
  text_length,
  section_count,
  used_ocr_fallback,
  confidence_score
)
values (
  (select text_parser_id from bizops_smoke_ids),
  (select doc_id from bizops_smoke_ids),
  'txt',
  'cash margin stable',
  18,
  1,
  false,
  0.8
);

insert into entities (
  id,
  org_id,
  entity_type,
  canonical_key,
  display_name,
  aliases,
  source_document_ids
)
values (
  (select entity_id from bizops_smoke_ids),
  (select org_id from bizops_smoke_ids),
  'document',
  'weekly-cash-' || :'run_suffix',
  'Weekly Cash Brief',
  array['cash brief'],
  array[(select doc_id from bizops_smoke_ids)]
);

insert into canonical_facts (
  id,
  org_id,
  document_id,
  entity_id,
  entity_type,
  canonical_fact_type_id,
  document_family,
  source_field_key,
  value,
  confidence_score,
  citations
)
values (
  (select fact_id from bizops_smoke_ids),
  (select org_id from bizops_smoke_ids),
  (select doc_id from bizops_smoke_ids),
  (select entity_id from bizops_smoke_ids),
  'document',
  'amount_cents',
  'sales_export',
  'sheet-1.amount',
  to_jsonb(124500),
  0.91,
  jsonb_build_array(
    jsonb_build_object(
      'version', 'citation.v1',
      'documentFamily', 'sales_export',
      'documentId', (select doc_id from bizops_smoke_ids),
      'locatorType', 'row',
      'locator', jsonb_build_object('row', 2),
      'sourceHash', (select source_hash from bizops_smoke_ids),
      'confidenceBand', 'high',
      'confidenceScore', 0.91,
      'capturedAt', now()
    )
  )
);

insert into retrieval_chunks (
  id,
  org_id,
  document_id,
  entity_id,
  entity_type,
  source_kind,
  content,
  canonical_fact_type_ids,
  embedding_model,
  embedding,
  embedding_dimensions,
  citations
)
values (
  (select chunk_id from bizops_smoke_ids),
  (select org_id from bizops_smoke_ids),
  (select doc_id from bizops_smoke_ids),
  (select entity_id from bizops_smoke_ids),
  'document',
  'fact-entity-summary',
  'Weekly cash margin brief points to collections risk.',
  array['amount_cents'],
  'deterministic-embedder.v1',
  array[0.1, 0.2, 0.3]::double precision[],
  3,
  jsonb_build_array(
    jsonb_build_object(
      'version', 'citation.v1',
      'documentFamily', 'sales_export',
      'documentId', (select doc_id from bizops_smoke_ids),
      'locatorType', 'row',
      'locator', jsonb_build_object('row', 2),
      'sourceHash', (select source_hash from bizops_smoke_ids),
      'confidenceBand', 'high',
      'confidenceScore', 0.91,
      'capturedAt', now()
    )
  )
);

insert into memory_embeddings (
  id,
  org_id,
  memory_kind,
  source_id,
  content,
  metadata,
  embedding_model,
  embedding,
  embedding_dimensions
)
values (
  (select memory_id from bizops_smoke_ids),
  (select org_id from bizops_smoke_ids),
  'decision',
  (select chunk_id from bizops_smoke_ids),
  'Collections risk persisted as reusable decision memory.',
  jsonb_build_object('feature', 'packs', 'phase', 'db-smoke'),
  'deterministic-embedder.v1',
  array[0.4, 0.5, 0.6]::double precision[],
  3
);

insert into saved_questions (
  id,
  org_id,
  question,
  query_plan
)
values (
  (select question_id from bizops_smoke_ids),
  (select org_id from bizops_smoke_ids),
  'What changed in collections this week?',
  jsonb_build_object(
    'version', 'query-plan.v1',
    'intent', 'trend-summary',
    'filters', jsonb_build_object('windowDays', 7),
    'sources', jsonb_build_array('facts', 'vectors')
  )
);

insert into processing_policies (
  id,
  org_id,
  name,
  scope_kind,
  scope_key,
  parser_route,
  extraction_enabled,
  embeddings_enabled,
  human_review_required,
  redaction_policy_key,
  retention_policy_key
)
values (
  (select policy_id from bizops_smoke_ids),
  (select org_id from bizops_smoke_ids),
  'Default CSV upload policy',
  'source',
  'upload',
  'tabular',
  true,
  true,
  false,
  'tabular-financial-export',
  'manual-upload-hot-30d'
);

insert into import_blueprints (
  id,
  org_id,
  source_kind,
  name,
  target_document_family,
  parser_route,
  status,
  policy_id,
  example_file_names
)
values (
  (select blueprint_id from bizops_smoke_ids),
  (select org_id from bizops_smoke_ids),
  'upload',
  'Weekly cash export',
  'sales_export',
  'tabular',
  'active',
  (select policy_id from bizops_smoke_ids),
  array['weekly-cash.csv']
);

insert into decision_runs (
  id,
  org_id,
  pack_id,
  pack_key,
  status,
  summary,
  source_document_ids,
  supporting_fact_ids,
  recommendation_count
)
values (
  (select decision_run_id from bizops_smoke_ids),
  (select org_id from bizops_smoke_ids),
  'pack_smoke',
  'weekly-cash-margin-brief',
  'completed',
  'Collections risk increased for the current week.',
  array[(select doc_id from bizops_smoke_ids)],
  array[(select fact_id from bizops_smoke_ids)],
  1
);

insert into recommendations (
  id,
  org_id,
  decision_run_id,
  kind,
  title,
  summary,
  citations,
  actions,
  confidence_score,
  priority_score,
  status,
  supporting_fact_ids
)
values (
  (select recommendation_id from bizops_smoke_ids),
  (select org_id from bizops_smoke_ids),
  (select decision_run_id from bizops_smoke_ids),
  'collect-overdue-invoice',
  'Call overdue customers today',
  'Focus collections on the highest-value aging invoices.',
  array['weekly-cash.csv row 2'],
  array['Call customer', 'Escalate to owner'],
  0.88,
  7.2,
  'open',
  array[(select fact_id from bizops_smoke_ids)]
);

insert into feedback_events (
  id,
  org_id,
  recommendation_id,
  actor_id,
  action,
  reason
)
values (
  (select feedback_id from bizops_smoke_ids),
  (select org_id from bizops_smoke_ids),
  (select recommendation_id from bizops_smoke_ids),
  'owner_123',
  'accept',
  'Matches current collections push.'
);

insert into outcome_observations (
  id,
  org_id,
  recommendation_id,
  outcome_status,
  window_days,
  value_change_cents,
  observed_at
)
values (
  (select outcome_id from bizops_smoke_ids),
  (select org_id from bizops_smoke_ids),
  (select recommendation_id from bizops_smoke_ids),
  'positive',
  7,
  125000,
  now()
);

insert into audit_logs (
  id,
  org_id,
  actor_id,
  action,
  entity_id,
  metadata
)
values (
  (select audit_id from bizops_smoke_ids),
  (select org_id from bizops_smoke_ids),
  'owner_123',
  'recommendation.accept',
  (select recommendation_id from bizops_smoke_ids),
  jsonb_build_object('surface', 'db-smoke')
);

insert into materialized_marts (
  id,
  org_id,
  metric_id,
  as_of_date,
  value,
  dimension_values,
  supporting_fact_ids
)
values (
  'mart_' || (select org_id from bizops_smoke_ids) || '_cash_on_hand_2026-04-09',
  (select org_id from bizops_smoke_ids),
  'cash_on_hand',
  date '2026-04-09',
  1245.00,
  jsonb_build_object('location', 'New York, NY'),
  array[(select fact_id from bizops_smoke_ids)]
);

insert into experiments (
  id,
  org_id,
  prompt_family,
  variant_id,
  hypothesis,
  primary_metric,
  status
)
values (
  (select experiment_id from bizops_smoke_ids),
  (select org_id from bizops_smoke_ids),
  'weekly-brief-recommendations',
  'variant_a',
  'More explicit collections framing improves acceptance.',
  'acceptance_rate',
  'running'
);

do $$
declare
  actual_dimensions integer;
  actual_memory_dimensions integer;
  nearest_id text;
begin
  select vector_dims(embedding_vector)
  into actual_dimensions
  from retrieval_chunks
  where id = (select chunk_id from bizops_smoke_ids);

  if actual_dimensions <> 3 then
    raise exception 'Expected retrieval_chunks.embedding_vector to have dimension 3, got %', actual_dimensions;
  end if;

  select vector_dims(embedding_vector)
  into actual_memory_dimensions
  from memory_embeddings
  where id = (select memory_id from bizops_smoke_ids);

  if actual_memory_dimensions <> 3 then
    raise exception 'Expected memory_embeddings.embedding_vector to have dimension 3, got %', actual_memory_dimensions;
  end if;

  begin
    insert into retrieval_chunks (
      id,
      org_id,
      document_id,
      entity_id,
      entity_type,
      source_kind,
      content,
      canonical_fact_type_ids,
      embedding_model,
      embedding,
      embedding_dimensions,
      citations
    )
    values (
      (select invalid_chunk_id from bizops_smoke_ids),
      (select org_id from bizops_smoke_ids),
      (select doc_id from bizops_smoke_ids),
      (select entity_id from bizops_smoke_ids),
      'document',
      'fact-entity-summary',
      'This row should fail the dimension check.',
      array['amount_cents'],
      'deterministic-embedder.v1',
      array[0.1, 0.2]::double precision[],
      3,
      '[]'::jsonb
    );

    raise exception 'Expected retrieval chunk dimension mismatch to fail';
  exception
    when check_violation or raise_exception then
      if sqlerrm = 'Expected retrieval chunk dimension mismatch to fail' then
        raise;
      end if;
  end;

  create temp table bizops_pgvector_smoke (
    id text primary key,
    embedding vector(3) not null
  ) on commit drop;

  insert into bizops_pgvector_smoke (id, embedding)
  values
    ('close', '[1,2,3]'),
    ('far', '[8,8,8]');

  create index bizops_pgvector_smoke_hnsw_idx
    on bizops_pgvector_smoke
    using hnsw (embedding vector_l2_ops);

  select id
  into nearest_id
  from bizops_pgvector_smoke
  order by embedding <-> '[1.1,2.1,3.1]'
  limit 1;

  if nearest_id <> 'close' then
    raise exception 'Expected pgvector nearest-neighbor smoke test to return close, got %', nearest_id;
  end if;
end
$$;

rollback;
