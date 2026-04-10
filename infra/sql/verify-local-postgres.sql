\set ON_ERROR_STOP 1

do $$
declare
  required_table text;
  required_index text;
  required_tables text[] := array[
    'organizations',
    'billing_accounts',
    'billing_payment_methods',
    'llm_usage_events',
    'account_users',
    'organization_memberships',
    'documents',
    'ingestion_jobs',
    'ingestion_events',
    'parser_artifacts',
    'text_parser_artifacts',
    'entities',
    'canonical_facts',
    'retrieval_chunks',
    'memory_embeddings',
    'saved_questions',
    'feedback_events',
    'outcome_observations',
    'audit_logs',
    'materialized_marts',
    'processing_policies',
    'import_blueprints',
    'decision_runs',
    'recommendations',
    'experiments'
  ];
  required_indexes text[] := array[
    'billing_accounts_org_id_uidx',
    'billing_payment_methods_org_role_uidx',
    'llm_usage_events_org_created_at_idx',
    'llm_usage_events_org_document_idx',
    'account_users_email_uidx',
    'organization_memberships_org_status_idx',
    'organization_memberships_user_id_idx',
    'processing_policies_org_scope_idx',
    'import_blueprints_org_status_idx',
    'decision_runs_org_created_at_idx',
    'recommendations_decision_run_id_idx',
    'recommendations_org_status_idx',
    'experiments_org_status_idx',
    'documents_org_status_idx',
    'documents_org_checksum_idx',
    'ingestion_jobs_org_status_idx',
    'ingestion_jobs_document_id_idx',
    'ingestion_events_org_created_at_idx',
    'parser_artifacts_document_id_idx',
    'text_parser_artifacts_document_id_idx',
    'entities_org_type_key_uidx',
    'canonical_facts_org_document_idx',
    'canonical_facts_entity_idx',
    'retrieval_chunks_org_document_idx',
    'retrieval_chunks_entity_idx',
    'memory_embeddings_org_kind_created_at_idx',
    'memory_embeddings_source_id_idx',
    'saved_questions_org_created_at_idx',
    'feedback_events_org_created_at_idx',
    'outcome_observations_org_recommendation_idx',
    'audit_logs_org_created_at_idx',
    'materialized_marts_org_metric_date_idx'
  ];
begin
  foreach required_table in array required_tables loop
    if to_regclass(format('%I.%I', 'public', required_table)) is null then
      raise exception 'Missing required table: %', required_table;
    end if;
  end loop;

  foreach required_index in array required_indexes loop
    if to_regclass(format('%I.%I', 'public', required_index)) is null then
      raise exception 'Missing required index: %', required_index;
    end if;
  end loop;

  if to_regclass('public.bizops_runtime_capabilities') is null then
    raise exception 'Missing bizops_runtime_capabilities view';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'billing_accounts'
      and column_name = 'usage_cap_cents'
  ) then
    raise exception 'billing_accounts.usage_cap_cents is missing';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'billing_payment_methods'
      and column_name = 'last4'
  ) then
    raise exception 'billing_payment_methods.last4 is missing';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'retrieval_chunks'
      and column_name = 'embedding_vector'
      and udt_name = 'vector'
  ) then
    raise exception 'retrieval_chunks.embedding_vector is missing or is not a vector column';
  end if;

  if not exists (select 1 from pg_extension where extname = 'vector') then
    raise exception 'pgvector extension is not enabled in the current database';
  end if;
end
$$;

select current_database() as database_name, current_user as database_user;
table bizops_runtime_capabilities;
