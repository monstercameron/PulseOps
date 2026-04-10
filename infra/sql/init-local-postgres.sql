\set ON_ERROR_STOP 1

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_available_extensions
    where name = 'vector'
  ) then
    raise exception
      using message = 'pgvector is required for local BizOps runtime.',
            hint = 'Run npm run db:install:vector to build and install pgvector for PostgreSQL 16.';
  end if;
end
$$;

create extension if not exists vector;

create or replace function bizops_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

create or replace function bizops_touch_last_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.last_updated_at := now();
  return new;
end
$$;

create or replace function bizops_array_to_vector(input_values double precision[])
returns vector
language sql
immutable
strict
as $$
  select format('[%s]', array_to_string(input_values, ','))::vector
$$;

create or replace function bizops_prepare_retrieval_chunk()
returns trigger
language plpgsql
as $$
begin
  if new.embedding is null or cardinality(new.embedding) = 0 then
    raise exception 'retrieval_chunks.embedding must contain at least one value';
  end if;

  if new.embedding_dimensions is null then
    new.embedding_dimensions := cardinality(new.embedding);
  end if;

  if new.embedding_dimensions <> cardinality(new.embedding) then
    raise exception 'retrieval_chunks.embedding_dimensions must match embedding length';
  end if;

  new.embedding_vector := bizops_array_to_vector(new.embedding);
  new.updated_at := now();

  return new;
end
$$;

create or replace function bizops_prepare_memory_embedding()
returns trigger
language plpgsql
as $$
begin
  if new.embedding is null or cardinality(new.embedding) = 0 then
    raise exception 'memory_embeddings.embedding must contain at least one value';
  end if;

  if new.embedding_dimensions is null then
    new.embedding_dimensions := cardinality(new.embedding);
  end if;

  if new.embedding_dimensions <> cardinality(new.embedding) then
    raise exception 'memory_embeddings.embedding_dimensions must match embedding length';
  end if;

  new.embedding_vector := bizops_array_to_vector(new.embedding);
  new.updated_at := now();

  return new;
end
$$;

create table if not exists organizations (
  id text primary key,
  name text not null,
  industry text not null,
  location text not null,
  revenue_model text not null,
  invoice_cycle text not null,
  team_size text not null,
  goals text[] not null default array[]::text[],
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version text not null default 'organization-record.v1'
);

create table if not exists billing_accounts (
  id text primary key,
  org_id text not null,
  plan_name text not null,
  status text not null,
  currency text not null,
  monthly_platform_fee_cents integer not null,
  profit_premium_basis_points integer not null,
  billing_anchor_day_of_month integer not null,
  usage_cap_cents integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version text not null default 'billing-account.v1'
);

create table if not exists billing_payment_methods (
  id text primary key,
  org_id text not null,
  role text not null,
  cardholder_name text not null,
  brand text not null,
  last4 text not null,
  exp_month integer not null,
  exp_year integer not null,
  postal_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version text not null default 'billing-payment-method.v1',
  unique (org_id, role)
);

create table if not exists llm_usage_events (
  id text primary key,
  org_id text not null,
  provider text not null,
  model text not null,
  feature text not null,
  operation text not null,
  document_id text,
  input_tokens integer not null,
  cached_input_tokens integer not null default 0,
  output_tokens integer not null,
  total_tokens integer not null,
  pricing_available boolean not null default false,
  pricing_source text,
  pricing_version text,
  provider_input_cost_nano_usd bigint not null default 0,
  provider_output_cost_nano_usd bigint not null default 0,
  provider_total_cost_nano_usd bigint not null default 0,
  profit_premium_basis_points integer not null,
  billable_cost_nano_usd bigint not null default 0,
  created_at timestamptz not null default now(),
  version text not null default 'llm-usage-event.v1'
);

create table if not exists account_users (
  id text primary key,
  email text not null,
  display_name text not null,
  password_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version text not null default 'account-user.v1'
);

create table if not exists organization_memberships (
  id text primary key,
  org_id text not null references organizations(id) on delete cascade,
  user_id text not null references account_users(id) on delete cascade,
  role text not null,
  status text not null,
  setup_access boolean not null default false,
  operations_access boolean not null default false,
  report_access boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version text not null default 'organization-membership.v1',
  unique (org_id, user_id)
);

create table if not exists documents (
  id text primary key,
  org_id text not null,
  file_name text not null,
  file_extension text,
  status text not null,
  source text not null,
  content_type text,
  size_bytes bigint,
  checksum_sha256 text,
  retention_policy_key text,
  archive_after_days integer,
  parser_artifact_id text,
  classification_confidence_score double precision,
  suggested_document_family text,
  raw_object jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ingestion_jobs (
  id text primary key,
  org_id text not null,
  document_id text not null references documents(id) on delete cascade,
  status text not null,
  attempt_count integer not null default 1,
  failure_reason text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  last_updated_at timestamptz not null default now()
);

create table if not exists ingestion_events (
  id text primary key,
  org_id text not null,
  document_id text not null references documents(id) on delete cascade,
  job_id text not null references ingestion_jobs(id) on delete cascade,
  kind text not null,
  source text not null,
  file_name text not null,
  checksum_sha256 text not null,
  size_bytes bigint not null,
  archive_after_days integer not null,
  retention_policy_key text not null,
  deduplicated boolean not null,
  estimated_ingest_cost_usd double precision not null,
  metadata jsonb not null default '{}'::jsonb,
  version text not null default 'ingestion-event.v1',
  created_at timestamptz not null default now()
);

create table if not exists parser_artifacts (
  id text primary key,
  document_id text not null references documents(id) on delete cascade,
  parser_kind text not null,
  sheet_count integer not null,
  sheets jsonb not null,
  total_row_count integer not null,
  confidence_score double precision not null,
  created_at timestamptz not null default now()
);

create table if not exists text_parser_artifacts (
  id text primary key,
  document_id text not null references documents(id) on delete cascade,
  parser_kind text not null,
  text text not null,
  text_length integer not null,
  section_count integer not null,
  used_ocr_fallback boolean not null default false,
  confidence_score double precision not null,
  created_at timestamptz not null default now()
);

create table if not exists entities (
  id text primary key,
  org_id text not null,
  entity_type text not null,
  canonical_key text not null,
  display_name text not null,
  aliases text[] not null default array[]::text[],
  source_document_ids text[] not null,
  version text not null default 'canonical-entity.v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists canonical_facts (
  id text primary key,
  org_id text not null,
  document_id text not null references documents(id) on delete cascade,
  entity_id text not null references entities(id) on delete cascade,
  entity_type text not null,
  canonical_fact_type_id text not null,
  label text,
  document_family text not null,
  source_field_key text not null,
  value jsonb not null,
  confidence_score double precision not null,
  citations jsonb not null,
  version text not null default 'canonical-fact.v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists retrieval_chunks (
  id text primary key,
  org_id text not null,
  document_id text not null references documents(id) on delete cascade,
  entity_id text not null references entities(id) on delete cascade,
  entity_type text not null,
  source_kind text not null,
  content text not null,
  canonical_fact_type_ids text[] not null,
  embedding_model text not null,
  embedding double precision[] not null,
  embedding_dimensions integer not null,
  embedding_vector vector,
  citations jsonb not null,
  version text not null default 'retrieval-chunk.v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists memory_embeddings (
  id text primary key,
  org_id text not null,
  memory_kind text not null,
  source_id text not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  embedding_model text not null,
  embedding double precision[] not null,
  embedding_dimensions integer not null,
  embedding_vector vector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version text not null default 'memory-embedding.v1'
);

create table if not exists saved_questions (
  id text primary key,
  org_id text not null,
  question text not null,
  query_plan jsonb not null,
  created_at timestamptz not null default now(),
  version text not null default 'saved-question.v1'
);

create table if not exists feedback_events (
  id text primary key,
  org_id text not null,
  recommendation_id text not null,
  actor_id text not null,
  action text not null,
  edit_payload jsonb,
  reason text,
  created_at timestamptz not null default now(),
  version text not null default 'feedback-event.v1'
);

create table if not exists outcome_observations (
  id text primary key,
  org_id text not null,
  recommendation_id text not null,
  outcome_status text not null,
  window_days integer not null,
  value_change_cents integer,
  notes text,
  observed_at timestamptz not null,
  created_at timestamptz not null default now(),
  version text not null default 'outcome-observation.v1'
);

create table if not exists audit_logs (
  id text primary key,
  org_id text not null,
  actor_id text not null,
  action text not null,
  entity_id text not null,
  metadata jsonb not null,
  created_at timestamptz not null default now(),
  version text not null default 'audit-log.v1'
);

create table if not exists materialized_marts (
  id text primary key,
  org_id text not null,
  metric_id text not null,
  as_of_date date not null,
  value double precision not null,
  dimension_values jsonb not null,
  supporting_fact_ids text[] not null,
  created_at timestamptz not null default now(),
  version text not null default 'materialized-mart.v1'
);

create table if not exists processing_policies (
  id text primary key,
  org_id text not null,
  name text not null,
  scope_kind text not null,
  scope_key text not null,
  parser_route text not null,
  extraction_enabled boolean not null,
  embeddings_enabled boolean not null,
  human_review_required boolean not null,
  redaction_policy_key text not null,
  retention_policy_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version text not null default 'processing-policy.v1'
);

create table if not exists import_blueprints (
  id text primary key,
  org_id text not null,
  source_kind text not null,
  name text not null,
  target_document_family text not null,
  parser_route text not null,
  status text not null,
  policy_id text references processing_policies(id) on delete set null,
  example_file_names text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version text not null default 'import-blueprint.v1'
);

create table if not exists decision_runs (
  id text primary key,
  org_id text not null,
  pack_id text,
  pack_key text not null,
  status text not null,
  summary text not null,
  source_document_ids text[] not null default array[]::text[],
  supporting_fact_ids text[] not null default array[]::text[],
  recommendation_count integer not null default 0,
  failure_reason text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  version text not null default 'decision-run.v1'
);

create table if not exists recommendations (
  id text primary key,
  org_id text not null,
  decision_run_id text not null references decision_runs(id) on delete cascade,
  kind text not null,
  title text not null,
  summary text not null,
  citations text[] not null default array[]::text[],
  actions text[] not null default array[]::text[],
  confidence_score double precision not null,
  priority_score double precision not null,
  status text not null,
  supporting_fact_ids text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version text not null default 'recommendation-record.v1'
);

create table if not exists experiments (
  id text primary key,
  org_id text not null,
  prompt_family text not null,
  variant_id text not null,
  hypothesis text not null,
  primary_metric text not null,
  status text not null,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  version text not null default 'experiment-record.v1'
);

create table if not exists ui_translation_bundles (
  id text primary key,
  org_id text,
  locale text not null,
  namespace text not null,
  messages jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version text not null default 'ui-translation-bundle.v1'
);

alter table documents add column if not exists file_extension text;
alter table documents add column if not exists size_bytes bigint;
alter table documents add column if not exists checksum_sha256 text;
alter table documents add column if not exists retention_policy_key text;
alter table documents add column if not exists archive_after_days integer;
alter table documents add column if not exists classification_confidence_score double precision;
alter table documents add column if not exists raw_object jsonb;

alter table ingestion_jobs add column if not exists started_at timestamptz;
alter table ingestion_jobs add column if not exists completed_at timestamptz;

alter table canonical_facts add column if not exists document_family text;
alter table canonical_facts add column if not exists label text;
alter table canonical_facts add column if not exists source_field_key text;
alter table canonical_facts add column if not exists version text not null default 'canonical-fact.v1';

alter table retrieval_chunks add column if not exists embedding_dimensions integer;
alter table retrieval_chunks add column if not exists embedding_vector vector;
alter table retrieval_chunks add column if not exists version text not null default 'retrieval-chunk.v1';

alter table organizations add column if not exists version text not null default 'organization-record.v1';
alter table billing_accounts add column if not exists usage_cap_cents integer;

alter table memory_embeddings add column if not exists embedding_dimensions integer;
alter table memory_embeddings add column if not exists embedding_vector vector;
alter table memory_embeddings add column if not exists version text not null default 'memory-embedding.v1';

alter table saved_questions add column if not exists version text not null default 'saved-question.v1';

alter table feedback_events add column if not exists edit_payload jsonb;
alter table feedback_events add column if not exists version text not null default 'feedback-event.v1';

alter table outcome_observations add column if not exists notes text;
alter table outcome_observations add column if not exists version text not null default 'outcome-observation.v1';

alter table audit_logs add column if not exists version text not null default 'audit-log.v1';

alter table materialized_marts add column if not exists version text not null default 'materialized-mart.v1';

update retrieval_chunks
set embedding_dimensions = cardinality(embedding)
where embedding is not null
  and embedding_dimensions is null;

update retrieval_chunks
set embedding_vector = bizops_array_to_vector(embedding)
where embedding is not null
  and (
    embedding_vector is null
    or vector_dims(embedding_vector) <> cardinality(embedding)
  );

update memory_embeddings
set embedding_dimensions = cardinality(embedding)
where embedding is not null
  and embedding_dimensions is null;

update memory_embeddings
set embedding_vector = bizops_array_to_vector(embedding)
where embedding is not null
  and (
    embedding_vector is null
    or vector_dims(embedding_vector) <> cardinality(embedding)
  );

alter table organizations drop constraint if exists organizations_status_check;
alter table organizations add constraint organizations_status_check check (
  status in ('active', 'inactive', 'trial')
);
alter table organizations drop constraint if exists organizations_goals_check;
alter table organizations add constraint organizations_goals_check check (
  cardinality(goals) >= 0
);
alter table organizations drop constraint if exists organizations_version_check;
alter table organizations add constraint organizations_version_check check (
  version = 'organization-record.v1'
);

alter table billing_accounts drop constraint if exists billing_accounts_status_check;
alter table billing_accounts add constraint billing_accounts_status_check check (
  status in ('active', 'past_due', 'trial')
);
alter table billing_accounts drop constraint if exists billing_accounts_currency_check;
alter table billing_accounts add constraint billing_accounts_currency_check check (
  currency = 'USD'
);
alter table billing_accounts drop constraint if exists billing_accounts_monthly_platform_fee_cents_check;
alter table billing_accounts add constraint billing_accounts_monthly_platform_fee_cents_check check (
  monthly_platform_fee_cents >= 0
);
alter table billing_accounts drop constraint if exists billing_accounts_profit_premium_basis_points_check;
alter table billing_accounts add constraint billing_accounts_profit_premium_basis_points_check check (
  profit_premium_basis_points between 0 and 100000
);
alter table billing_accounts drop constraint if exists billing_accounts_billing_anchor_day_of_month_check;
alter table billing_accounts add constraint billing_accounts_billing_anchor_day_of_month_check check (
  billing_anchor_day_of_month between 1 and 28
);
alter table billing_accounts drop constraint if exists billing_accounts_usage_cap_cents_check;
alter table billing_accounts add constraint billing_accounts_usage_cap_cents_check check (
  usage_cap_cents is null or usage_cap_cents >= 0
);
alter table billing_accounts drop constraint if exists billing_accounts_version_check;
alter table billing_accounts add constraint billing_accounts_version_check check (
  version = 'billing-account.v1'
);

alter table billing_payment_methods drop constraint if exists billing_payment_methods_role_check;
alter table billing_payment_methods add constraint billing_payment_methods_role_check check (
  role in ('primary', 'backup')
);
alter table billing_payment_methods drop constraint if exists billing_payment_methods_brand_check;
alter table billing_payment_methods add constraint billing_payment_methods_brand_check check (
  brand in ('amex', 'discover', 'mastercard', 'other', 'visa')
);
alter table billing_payment_methods drop constraint if exists billing_payment_methods_last4_check;
alter table billing_payment_methods add constraint billing_payment_methods_last4_check check (
  last4 ~ '^[0-9]{4}$'
);
alter table billing_payment_methods drop constraint if exists billing_payment_methods_exp_month_check;
alter table billing_payment_methods add constraint billing_payment_methods_exp_month_check check (
  exp_month between 1 and 12
);
alter table billing_payment_methods drop constraint if exists billing_payment_methods_exp_year_check;
alter table billing_payment_methods add constraint billing_payment_methods_exp_year_check check (
  exp_year between 2000 and 2100
);
alter table billing_payment_methods drop constraint if exists billing_payment_methods_version_check;
alter table billing_payment_methods add constraint billing_payment_methods_version_check check (
  version = 'billing-payment-method.v1'
);

alter table llm_usage_events drop constraint if exists llm_usage_events_provider_check;
alter table llm_usage_events add constraint llm_usage_events_provider_check check (
  provider = 'openai'
);
alter table llm_usage_events drop constraint if exists llm_usage_events_input_tokens_check;
alter table llm_usage_events add constraint llm_usage_events_input_tokens_check check (
  input_tokens >= 0
);
alter table llm_usage_events drop constraint if exists llm_usage_events_cached_input_tokens_check;
alter table llm_usage_events add constraint llm_usage_events_cached_input_tokens_check check (
  cached_input_tokens >= 0
  and cached_input_tokens <= input_tokens
);
alter table llm_usage_events drop constraint if exists llm_usage_events_output_tokens_check;
alter table llm_usage_events add constraint llm_usage_events_output_tokens_check check (
  output_tokens >= 0
);
alter table llm_usage_events drop constraint if exists llm_usage_events_total_tokens_check;
alter table llm_usage_events add constraint llm_usage_events_total_tokens_check check (
  total_tokens >= 0
);
alter table llm_usage_events drop constraint if exists llm_usage_events_provider_input_cost_check;
alter table llm_usage_events add constraint llm_usage_events_provider_input_cost_check check (
  provider_input_cost_nano_usd >= 0
);
alter table llm_usage_events drop constraint if exists llm_usage_events_provider_output_cost_check;
alter table llm_usage_events add constraint llm_usage_events_provider_output_cost_check check (
  provider_output_cost_nano_usd >= 0
);
alter table llm_usage_events drop constraint if exists llm_usage_events_provider_total_cost_check;
alter table llm_usage_events add constraint llm_usage_events_provider_total_cost_check check (
  provider_total_cost_nano_usd >= 0
);
alter table llm_usage_events drop constraint if exists llm_usage_events_billable_cost_check;
alter table llm_usage_events add constraint llm_usage_events_billable_cost_check check (
  billable_cost_nano_usd >= 0
);
alter table llm_usage_events drop constraint if exists llm_usage_events_profit_premium_basis_points_check;
alter table llm_usage_events add constraint llm_usage_events_profit_premium_basis_points_check check (
  profit_premium_basis_points between 0 and 100000
);
alter table llm_usage_events drop constraint if exists llm_usage_events_version_check;
alter table llm_usage_events add constraint llm_usage_events_version_check check (
  version = 'llm-usage-event.v1'
);

alter table account_users drop constraint if exists account_users_version_check;
alter table account_users add constraint account_users_version_check check (
  version = 'account-user.v1'
);

alter table organization_memberships drop constraint if exists organization_memberships_role_check;
alter table organization_memberships add constraint organization_memberships_role_check check (
  role in ('admin', 'operator', 'analyst', 'viewer')
);
alter table organization_memberships drop constraint if exists organization_memberships_status_check;
alter table organization_memberships add constraint organization_memberships_status_check check (
  status in ('active', 'invited', 'disabled')
);
alter table organization_memberships drop constraint if exists organization_memberships_access_check;
alter table organization_memberships add constraint organization_memberships_access_check check (
  setup_access = true
  or operations_access = true
  or report_access = true
);
alter table organization_memberships drop constraint if exists organization_memberships_version_check;
alter table organization_memberships add constraint organization_memberships_version_check check (
  version = 'organization-membership.v1'
);

alter table documents drop constraint if exists documents_status_check;
alter table documents add constraint documents_status_check check (
  status in ('uploaded', 'stored', 'parsed', 'classified', 'extracted', 'failed')
);
alter table documents drop constraint if exists documents_source_check;
alter table documents add constraint documents_source_check check (
  source in ('upload', 'email', 'api')
);
alter table documents drop constraint if exists documents_size_bytes_check;
alter table documents add constraint documents_size_bytes_check check (
  size_bytes is null or size_bytes >= 0
);
alter table documents drop constraint if exists documents_archive_after_days_check;
alter table documents add constraint documents_archive_after_days_check check (
  archive_after_days is null or archive_after_days > 0
);
alter table documents drop constraint if exists documents_classification_confidence_score_check;
alter table documents add constraint documents_classification_confidence_score_check check (
  classification_confidence_score is null
  or classification_confidence_score between 0 and 1
);
alter table documents drop constraint if exists documents_raw_object_check;
alter table documents add constraint documents_raw_object_check check (
  raw_object is null or jsonb_typeof(raw_object) = 'object'
);

alter table ingestion_jobs drop constraint if exists ingestion_jobs_status_check;
alter table ingestion_jobs add constraint ingestion_jobs_status_check check (
  status in ('queued', 'parsing', 'classifying', 'extracting', 'normalizing', 'completed', 'failed', 'cancelled')
);
alter table ingestion_jobs drop constraint if exists ingestion_jobs_attempt_count_check;
alter table ingestion_jobs add constraint ingestion_jobs_attempt_count_check check (
  attempt_count > 0
);
alter table ingestion_jobs drop constraint if exists ingestion_jobs_completed_at_check;
alter table ingestion_jobs add constraint ingestion_jobs_completed_at_check check (
  completed_at is null or completed_at >= created_at
);

alter table ingestion_events drop constraint if exists ingestion_events_kind_check;
alter table ingestion_events add constraint ingestion_events_kind_check check (
  kind in ('upload.queued', 'upload.duplicate')
);
alter table ingestion_events drop constraint if exists ingestion_events_source_check;
alter table ingestion_events add constraint ingestion_events_source_check check (
  source in ('upload', 'email', 'api')
);
alter table ingestion_events drop constraint if exists ingestion_events_size_bytes_check;
alter table ingestion_events add constraint ingestion_events_size_bytes_check check (
  size_bytes >= 0
);
alter table ingestion_events drop constraint if exists ingestion_events_archive_after_days_check;
alter table ingestion_events add constraint ingestion_events_archive_after_days_check check (
  archive_after_days > 0
);
alter table ingestion_events drop constraint if exists ingestion_events_estimated_ingest_cost_usd_check;
alter table ingestion_events add constraint ingestion_events_estimated_ingest_cost_usd_check check (
  estimated_ingest_cost_usd >= 0
);
alter table ingestion_events drop constraint if exists ingestion_events_metadata_check;
alter table ingestion_events add constraint ingestion_events_metadata_check check (
  jsonb_typeof(metadata) = 'object'
);
alter table ingestion_events drop constraint if exists ingestion_events_version_check;
alter table ingestion_events add constraint ingestion_events_version_check check (
  version = 'ingestion-event.v1'
);

alter table parser_artifacts drop constraint if exists parser_artifacts_parser_kind_check;
alter table parser_artifacts add constraint parser_artifacts_parser_kind_check check (
  parser_kind in ('csv', 'xlsx')
);
alter table parser_artifacts drop constraint if exists parser_artifacts_sheet_count_check;
alter table parser_artifacts add constraint parser_artifacts_sheet_count_check check (
  sheet_count > 0
);
alter table parser_artifacts drop constraint if exists parser_artifacts_total_row_count_check;
alter table parser_artifacts add constraint parser_artifacts_total_row_count_check check (
  total_row_count >= 0
);
alter table parser_artifacts drop constraint if exists parser_artifacts_confidence_score_check;
alter table parser_artifacts add constraint parser_artifacts_confidence_score_check check (
  confidence_score between 0 and 1
);
alter table parser_artifacts drop constraint if exists parser_artifacts_sheets_check;
alter table parser_artifacts add constraint parser_artifacts_sheets_check check (
  jsonb_typeof(sheets) = 'array'
);

alter table text_parser_artifacts drop constraint if exists text_parser_artifacts_parser_kind_check;
alter table text_parser_artifacts add constraint text_parser_artifacts_parser_kind_check check (
  parser_kind in ('docx', 'html', 'json', 'pdf', 'ocr-image', 'ocr-pdf', 'txt', 'xml')
);
alter table text_parser_artifacts drop constraint if exists text_parser_artifacts_text_length_check;
alter table text_parser_artifacts add constraint text_parser_artifacts_text_length_check check (
  text_length > 0
);
alter table text_parser_artifacts drop constraint if exists text_parser_artifacts_section_count_check;
alter table text_parser_artifacts add constraint text_parser_artifacts_section_count_check check (
  section_count > 0
);
alter table text_parser_artifacts drop constraint if exists text_parser_artifacts_confidence_score_check;
alter table text_parser_artifacts add constraint text_parser_artifacts_confidence_score_check check (
  confidence_score between 0 and 1
);

alter table entities drop constraint if exists entities_version_check;
alter table entities add constraint entities_version_check check (
  version = 'canonical-entity.v1'
);
alter table entities drop constraint if exists entities_source_document_ids_check;
alter table entities add constraint entities_source_document_ids_check check (
  cardinality(source_document_ids) > 0
);

alter table canonical_facts drop constraint if exists canonical_facts_confidence_score_check;
alter table canonical_facts add constraint canonical_facts_confidence_score_check check (
  confidence_score between 0 and 1
);
alter table canonical_facts drop constraint if exists canonical_facts_citations_check;
alter table canonical_facts add constraint canonical_facts_citations_check check (
  jsonb_typeof(citations) = 'array'
);
alter table canonical_facts drop constraint if exists canonical_facts_version_check;
alter table canonical_facts add constraint canonical_facts_version_check check (
  version = 'canonical-fact.v1'
);

alter table retrieval_chunks drop constraint if exists retrieval_chunks_canonical_fact_type_ids_check;
alter table retrieval_chunks add constraint retrieval_chunks_canonical_fact_type_ids_check check (
  cardinality(canonical_fact_type_ids) > 0
);
alter table retrieval_chunks drop constraint if exists retrieval_chunks_embedding_dimensions_check;
alter table retrieval_chunks add constraint retrieval_chunks_embedding_dimensions_check check (
  embedding_dimensions > 0
  and embedding_dimensions = cardinality(embedding)
);
alter table retrieval_chunks drop constraint if exists retrieval_chunks_citations_check;
alter table retrieval_chunks add constraint retrieval_chunks_citations_check check (
  jsonb_typeof(citations) = 'array'
);
alter table retrieval_chunks drop constraint if exists retrieval_chunks_version_check;
alter table retrieval_chunks add constraint retrieval_chunks_version_check check (
  version = 'retrieval-chunk.v1'
);

alter table memory_embeddings drop constraint if exists memory_embeddings_memory_kind_check;
alter table memory_embeddings add constraint memory_embeddings_memory_kind_check check (
  memory_kind in ('decision', 'fact', 'feedback')
);
alter table memory_embeddings drop constraint if exists memory_embeddings_metadata_check;
alter table memory_embeddings add constraint memory_embeddings_metadata_check check (
  jsonb_typeof(metadata) = 'object'
);
alter table memory_embeddings drop constraint if exists memory_embeddings_embedding_dimensions_check;
alter table memory_embeddings add constraint memory_embeddings_embedding_dimensions_check check (
  embedding_dimensions > 0
  and embedding_dimensions = cardinality(embedding)
);
alter table memory_embeddings drop constraint if exists memory_embeddings_version_check;
alter table memory_embeddings add constraint memory_embeddings_version_check check (
  version = 'memory-embedding.v1'
);

alter table saved_questions drop constraint if exists saved_questions_query_plan_check;
alter table saved_questions add constraint saved_questions_query_plan_check check (
  jsonb_typeof(query_plan) = 'object'
);
alter table saved_questions drop constraint if exists saved_questions_version_check;
alter table saved_questions add constraint saved_questions_version_check check (
  version = 'saved-question.v1'
);

alter table feedback_events drop constraint if exists feedback_events_edit_payload_check;
alter table feedback_events add constraint feedback_events_edit_payload_check check (
  edit_payload is null or jsonb_typeof(edit_payload) = 'object'
);
alter table feedback_events drop constraint if exists feedback_events_version_check;
alter table feedback_events add constraint feedback_events_version_check check (
  version = 'feedback-event.v1'
);

alter table outcome_observations drop constraint if exists outcome_observations_window_days_check;
alter table outcome_observations add constraint outcome_observations_window_days_check check (
  window_days > 0
);
alter table outcome_observations drop constraint if exists outcome_observations_version_check;
alter table outcome_observations add constraint outcome_observations_version_check check (
  version = 'outcome-observation.v1'
);

alter table audit_logs drop constraint if exists audit_logs_metadata_check;
alter table audit_logs add constraint audit_logs_metadata_check check (
  jsonb_typeof(metadata) = 'object'
);
alter table audit_logs drop constraint if exists audit_logs_version_check;
alter table audit_logs add constraint audit_logs_version_check check (
  version = 'audit-log.v1'
);

alter table materialized_marts drop constraint if exists materialized_marts_dimension_values_check;
alter table materialized_marts add constraint materialized_marts_dimension_values_check check (
  jsonb_typeof(dimension_values) = 'object'
);
alter table materialized_marts drop constraint if exists materialized_marts_supporting_fact_ids_check;
alter table materialized_marts add constraint materialized_marts_supporting_fact_ids_check check (
  cardinality(supporting_fact_ids) > 0
);
alter table materialized_marts drop constraint if exists materialized_marts_version_check;
alter table materialized_marts add constraint materialized_marts_version_check check (
  version = 'materialized-mart.v1'
);

alter table processing_policies drop constraint if exists processing_policies_scope_kind_check;
alter table processing_policies add constraint processing_policies_scope_kind_check check (
  scope_kind in ('tenant-default', 'source', 'document-family')
);
alter table processing_policies drop constraint if exists processing_policies_parser_route_check;
alter table processing_policies add constraint processing_policies_parser_route_check check (
  parser_route in ('tabular', 'text')
);
alter table processing_policies drop constraint if exists processing_policies_version_check;
alter table processing_policies add constraint processing_policies_version_check check (
  version = 'processing-policy.v1'
);

alter table import_blueprints drop constraint if exists import_blueprints_source_kind_check;
alter table import_blueprints add constraint import_blueprints_source_kind_check check (
  source_kind in ('upload', 'email', 'api')
);
alter table import_blueprints drop constraint if exists import_blueprints_parser_route_check;
alter table import_blueprints add constraint import_blueprints_parser_route_check check (
  parser_route in ('tabular', 'text')
);
alter table import_blueprints drop constraint if exists import_blueprints_status_check;
alter table import_blueprints add constraint import_blueprints_status_check check (
  status in ('draft', 'active', 'archived')
);
alter table import_blueprints drop constraint if exists import_blueprints_version_check;
alter table import_blueprints add constraint import_blueprints_version_check check (
  version = 'import-blueprint.v1'
);

alter table decision_runs drop constraint if exists decision_runs_status_check;
alter table decision_runs add constraint decision_runs_status_check check (
  status in ('queued', 'running', 'completed', 'failed')
);
alter table decision_runs drop constraint if exists decision_runs_recommendation_count_check;
alter table decision_runs add constraint decision_runs_recommendation_count_check check (
  recommendation_count >= 0
);
alter table decision_runs drop constraint if exists decision_runs_completed_at_check;
alter table decision_runs add constraint decision_runs_completed_at_check check (
  completed_at is null or completed_at >= created_at
);
alter table decision_runs drop constraint if exists decision_runs_version_check;
alter table decision_runs add constraint decision_runs_version_check check (
  version = 'decision-run.v1'
);

alter table recommendations drop constraint if exists recommendations_confidence_score_check;
alter table recommendations add constraint recommendations_confidence_score_check check (
  confidence_score between 0 and 1
);
alter table recommendations drop constraint if exists recommendations_status_check;
alter table recommendations add constraint recommendations_status_check check (
  status in ('open', 'accepted', 'rejected', 'implemented', 'dismissed')
);
alter table recommendations drop constraint if exists recommendations_version_check;
alter table recommendations add constraint recommendations_version_check check (
  version = 'recommendation-record.v1'
);

alter table experiments drop constraint if exists experiments_status_check;
alter table experiments add constraint experiments_status_check check (
  status in ('draft', 'running', 'completed', 'archived')
);
alter table experiments drop constraint if exists experiments_completed_at_check;
alter table experiments add constraint experiments_completed_at_check check (
  completed_at is null or completed_at >= created_at
);
alter table experiments drop constraint if exists experiments_version_check;
alter table experiments add constraint experiments_version_check check (
  version = 'experiment-record.v1'
);

alter table ui_translation_bundles drop constraint if exists ui_translation_bundles_messages_check;
alter table ui_translation_bundles add constraint ui_translation_bundles_messages_check check (
  jsonb_typeof(messages) = 'object'
);
alter table ui_translation_bundles drop constraint if exists ui_translation_bundles_version_check;
alter table ui_translation_bundles add constraint ui_translation_bundles_version_check check (
  version = 'ui-translation-bundle.v1'
);

create unique index if not exists entities_org_type_key_uidx
  on entities (org_id, entity_type, canonical_key);
create unique index if not exists account_users_email_uidx
  on account_users (lower(email));
create unique index if not exists billing_accounts_org_id_uidx
  on billing_accounts (org_id);
create unique index if not exists billing_payment_methods_org_role_uidx
  on billing_payment_methods (org_id, role);
create index if not exists llm_usage_events_org_created_at_idx
  on llm_usage_events (org_id, created_at desc);
create index if not exists llm_usage_events_org_document_idx
  on llm_usage_events (org_id, document_id, created_at desc);
create index if not exists organization_memberships_org_status_idx
  on organization_memberships (org_id, status, updated_at desc);
create index if not exists organization_memberships_user_id_idx
  on organization_memberships (user_id);
create index if not exists documents_org_status_idx
  on documents (org_id, status);
create index if not exists documents_org_checksum_idx
  on documents (org_id, checksum_sha256);
create index if not exists ingestion_jobs_org_status_idx
  on ingestion_jobs (org_id, status);
create index if not exists ingestion_jobs_document_id_idx
  on ingestion_jobs (document_id);
create index if not exists ingestion_events_org_created_at_idx
  on ingestion_events (org_id, created_at desc);
create index if not exists parser_artifacts_document_id_idx
  on parser_artifacts (document_id);
create index if not exists text_parser_artifacts_document_id_idx
  on text_parser_artifacts (document_id);
create index if not exists canonical_facts_org_document_idx
  on canonical_facts (org_id, document_id);
create index if not exists canonical_facts_entity_idx
  on canonical_facts (entity_id);
create index if not exists retrieval_chunks_org_document_idx
  on retrieval_chunks (org_id, document_id);
create index if not exists retrieval_chunks_entity_idx
  on retrieval_chunks (entity_id);
create index if not exists memory_embeddings_org_kind_created_at_idx
  on memory_embeddings (org_id, memory_kind, created_at desc);
create index if not exists memory_embeddings_source_id_idx
  on memory_embeddings (source_id);
create index if not exists saved_questions_org_created_at_idx
  on saved_questions (org_id, created_at desc);
create index if not exists feedback_events_org_created_at_idx
  on feedback_events (org_id, created_at desc);
create index if not exists outcome_observations_org_recommendation_idx
  on outcome_observations (org_id, recommendation_id);
create index if not exists audit_logs_org_created_at_idx
  on audit_logs (org_id, created_at desc);
create index if not exists materialized_marts_org_metric_date_idx
  on materialized_marts (org_id, metric_id, as_of_date desc);
create index if not exists processing_policies_org_scope_idx
  on processing_policies (org_id, scope_kind, scope_key);
create index if not exists import_blueprints_org_status_idx
  on import_blueprints (org_id, status, updated_at desc);
create index if not exists decision_runs_org_created_at_idx
  on decision_runs (org_id, created_at desc);
create index if not exists recommendations_decision_run_id_idx
  on recommendations (decision_run_id);
create index if not exists recommendations_org_status_idx
  on recommendations (org_id, status, created_at desc);
create index if not exists experiments_org_status_idx
  on experiments (org_id, status, created_at desc);
create index if not exists ui_translation_bundles_locale_namespace_idx
  on ui_translation_bundles (locale, namespace, updated_at desc);

drop trigger if exists trg_organizations_touch_updated_at on organizations;
create trigger trg_organizations_touch_updated_at
before update on organizations
for each row execute function bizops_touch_updated_at();

drop trigger if exists trg_billing_accounts_touch_updated_at on billing_accounts;
create trigger trg_billing_accounts_touch_updated_at
before update on billing_accounts
for each row execute function bizops_touch_updated_at();

drop trigger if exists trg_billing_payment_methods_touch_updated_at on billing_payment_methods;
create trigger trg_billing_payment_methods_touch_updated_at
before update on billing_payment_methods
for each row execute function bizops_touch_updated_at();

drop trigger if exists trg_account_users_touch_updated_at on account_users;
create trigger trg_account_users_touch_updated_at
before update on account_users
for each row execute function bizops_touch_updated_at();

drop trigger if exists trg_organization_memberships_touch_updated_at on organization_memberships;
create trigger trg_organization_memberships_touch_updated_at
before update on organization_memberships
for each row execute function bizops_touch_updated_at();

drop trigger if exists trg_documents_touch_updated_at on documents;
create trigger trg_documents_touch_updated_at
before update on documents
for each row execute function bizops_touch_updated_at();

drop trigger if exists trg_ingestion_jobs_touch_last_updated_at on ingestion_jobs;
create trigger trg_ingestion_jobs_touch_last_updated_at
before update on ingestion_jobs
for each row execute function bizops_touch_last_updated_at();

drop trigger if exists trg_entities_touch_updated_at on entities;
create trigger trg_entities_touch_updated_at
before update on entities
for each row execute function bizops_touch_updated_at();

drop trigger if exists trg_canonical_facts_touch_updated_at on canonical_facts;
create trigger trg_canonical_facts_touch_updated_at
before update on canonical_facts
for each row execute function bizops_touch_updated_at();

drop trigger if exists trg_retrieval_chunks_prepare on retrieval_chunks;
create trigger trg_retrieval_chunks_prepare
before insert or update on retrieval_chunks
for each row execute function bizops_prepare_retrieval_chunk();

drop trigger if exists trg_memory_embeddings_prepare on memory_embeddings;
create trigger trg_memory_embeddings_prepare
before insert or update on memory_embeddings
for each row execute function bizops_prepare_memory_embedding();

drop trigger if exists trg_processing_policies_touch_updated_at on processing_policies;
create trigger trg_processing_policies_touch_updated_at
before update on processing_policies
for each row execute function bizops_touch_updated_at();

drop trigger if exists trg_import_blueprints_touch_updated_at on import_blueprints;
create trigger trg_import_blueprints_touch_updated_at
before update on import_blueprints
for each row execute function bizops_touch_updated_at();

drop trigger if exists trg_decision_runs_touch_updated_at on decision_runs;
create trigger trg_decision_runs_touch_updated_at
before update on decision_runs
for each row execute function bizops_touch_updated_at();

drop trigger if exists trg_recommendations_touch_updated_at on recommendations;
create trigger trg_recommendations_touch_updated_at
before update on recommendations
for each row execute function bizops_touch_updated_at();

drop trigger if exists trg_experiments_touch_updated_at on experiments;
create trigger trg_experiments_touch_updated_at
before update on experiments
for each row execute function bizops_touch_updated_at();

drop trigger if exists trg_ui_translation_bundles_touch_updated_at on ui_translation_bundles;
create trigger trg_ui_translation_bundles_touch_updated_at
before update on ui_translation_bundles
for each row execute function bizops_touch_updated_at();

create or replace view bizops_runtime_capabilities as
select
  current_database() as database_name,
  current_user as database_user,
  current_setting('server_version') as server_version,
  exists(select 1 from pg_extension where extname = 'pgcrypto') as pgcrypto_enabled,
  exists(select 1 from pg_available_extensions where name = 'vector') as vector_available,
  exists(select 1 from pg_extension where extname = 'vector') as vector_enabled,
  (select extversion from pg_extension where extname = 'vector') as vector_version;
