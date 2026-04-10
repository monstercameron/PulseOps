\set ON_ERROR_STOP 1

select replace(gen_random_uuid()::text, '-', '') as run_suffix \gset

begin;

create temp table bizops_import_sales_csv (
  region text not null,
  country text not null,
  item_type text not null,
  sales_channel text not null,
  order_priority text not null,
  order_date text not null,
  order_id bigint not null,
  ship_date text not null,
  units_sold integer not null,
  unit_price numeric(12, 2) not null,
  unit_cost numeric(12, 2) not null,
  total_revenue numeric(14, 2) not null,
  total_cost numeric(14, 2) not null,
  total_profit numeric(14, 2) not null
) on commit drop;

\copy bizops_import_sales_csv (region, country, item_type, sales_channel, order_priority, order_date, order_id, ship_date, units_sold, unit_price, unit_cost, total_revenue, total_cost, total_profit) from __BIZOPS_IMPORT_ASSET_PATH__ with (format csv, header true)

create temp table bizops_import_ids on commit drop as
select
  'dbimport_doc_' || :'run_suffix' as doc_id,
  'dbimport_job_' || :'run_suffix' as job_id,
  'dbimport_event_' || :'run_suffix' as event_id,
  'dbimport_parser_' || :'run_suffix' as parser_id,
  'dbimport_entity_' || :'run_suffix' as entity_id,
  'dbimport_entity_other_' || :'run_suffix' as other_entity_id,
  'dbimport_fact_' || :'run_suffix' as fact_id,
  'dbimport_chunk_' || :'run_suffix' as chunk_id,
  'dbimport_chunk_other_' || :'run_suffix' as other_chunk_id,
  'sha256-import-' || :'run_suffix' as checksum_sha256,
  'source-hash-import-' || :'run_suffix' as source_hash;

do $$
declare
  imported_row_count integer;
  imported_total_profit numeric(14, 2);
begin
  select
    count(*),
    coalesce(sum(total_profit), 0)::numeric(14, 2)
  into imported_row_count, imported_total_profit
  from bizops_import_sales_csv;

  if imported_row_count <> 100 then
    raise exception 'Expected imported row count 100, got %', imported_row_count;
  end if;

  if imported_total_profit <> 44168198.40::numeric(14, 2) then
    raise exception 'Expected imported total profit 44168198.40, got %', imported_total_profit;
  end if;
end
$$;

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
  (select doc_id from bizops_import_ids),
  'org_local_import',
  '10020Records.csv',
  'csv',
  'parsed',
  'upload',
  'text/csv',
  12203,
  (select checksum_sha256 from bizops_import_ids),
  'retention/default',
  365,
  jsonb_build_object(
    'bucket', 'local',
    'key', 'orgs/org_local_import/documents/' || (select doc_id from bizops_import_ids) || '/2026/04/10020Records.csv',
    'sha256', (select checksum_sha256 from bizops_import_ids),
    'sizeBytes', 12203,
    'createdAt', now(),
    'metadata', jsonb_build_object('source', 'db-import-test')
  )
);

insert into ingestion_jobs (
  id,
  org_id,
  document_id,
  status,
  attempt_count,
  started_at,
  completed_at
)
values (
  (select job_id from bizops_import_ids),
  'org_local_import',
  (select doc_id from bizops_import_ids),
  'completed',
  1,
  now(),
  now()
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
  (select event_id from bizops_import_ids),
  'org_local_import',
  (select doc_id from bizops_import_ids),
  (select job_id from bizops_import_ids),
  'upload.queued',
  'upload',
  '10020Records.csv',
  (select checksum_sha256 from bizops_import_ids),
  12203,
  365,
  'retention/default',
  false,
  0.0102,
  jsonb_build_object(
    'importedRows', (select count(*) from bizops_import_sales_csv)::text,
    'source', 'asset-regression'
  )
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
  (select parser_id from bizops_import_ids),
  (select doc_id from bizops_import_ids),
  'csv',
  1,
  jsonb_build_array(
    jsonb_build_object(
      'name', 'sales-export',
      'rowCount', (select count(*) from bizops_import_sales_csv),
      'columnCount', 14,
      'headers', jsonb_build_array(
        'Region',
        'Country',
        'Item Type',
        'Sales Channel',
        'Order Priority',
        'Order Date',
        'Order ID',
        'Ship Date',
        'Units Sold',
        'Unit Price',
        'Unit Cost',
        'Total Revenue',
        'Total Cost',
        'Total Profit'
      )
    )
  ),
  (select count(*) from bizops_import_sales_csv),
  0.96
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
values
(
  (select entity_id from bizops_import_ids),
  'org_local_import',
  'document',
  '10020records-sales-export',
  '10020Records Sales Export',
  array['sales export'],
  array[(select doc_id from bizops_import_ids)]
),
(
  (select other_entity_id from bizops_import_ids),
  'org_local_import',
  'document',
  '10020records-distractor',
  '10020Records Distractor',
  array['distractor'],
  array[(select doc_id from bizops_import_ids)]
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
  (select fact_id from bizops_import_ids),
  'org_local_import',
  (select doc_id from bizops_import_ids),
  (select entity_id from bizops_import_ids),
  'document',
  'amount_cents',
  'sales_export',
  'csv.total_profit',
  to_jsonb(((select sum(total_profit) from bizops_import_sales_csv) * 100)::bigint),
  0.94,
  jsonb_build_array(
    jsonb_build_object(
      'version', 'citation.v1',
      'documentFamily', 'sales_export',
      'documentId', (select doc_id from bizops_import_ids),
      'locatorType', 'sheet',
      'locator', jsonb_build_object('sheet', 'sales-export'),
      'sourceHash', (select source_hash from bizops_import_ids),
      'confidenceBand', 'high',
      'confidenceScore', 0.94,
      'excerpt', 'Imported sales export aggregate from 10020Records.csv',
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
values
(
  (select chunk_id from bizops_import_ids),
  'org_local_import',
  (select doc_id from bizops_import_ids),
  (select entity_id from bizops_import_ids),
  'document',
  'fact-entity-summary',
  format(
    'Imported 10020Records.csv with %s rows and total profit %s.',
    (select count(*) from bizops_import_sales_csv),
    (select sum(total_profit) from bizops_import_sales_csv)
  ),
  array['amount_cents'],
  'deterministic-embedder.v1',
  array[0.11, 0.22, 0.33, 0.44]::double precision[],
  4,
  jsonb_build_array(
    jsonb_build_object(
      'version', 'citation.v1',
      'documentFamily', 'sales_export',
      'documentId', (select doc_id from bizops_import_ids),
      'locatorType', 'sheet',
      'locator', jsonb_build_object('sheet', 'sales-export'),
      'sourceHash', (select source_hash from bizops_import_ids),
      'confidenceBand', 'high',
      'confidenceScore', 0.94,
      'excerpt', 'Imported sales export aggregate from 10020Records.csv',
      'capturedAt', now()
    )
  )
),
(
  (select other_chunk_id from bizops_import_ids),
  'org_local_import',
  (select doc_id from bizops_import_ids),
  (select other_entity_id from bizops_import_ids),
  'document',
  'fact-entity-summary',
  'Distractor vector row for nearest-neighbor validation.',
  array['amount_cents'],
  'deterministic-embedder.v1',
  array[0.91, 0.82, 0.73, 0.64]::double precision[],
  4,
  jsonb_build_array(
    jsonb_build_object(
      'version', 'citation.v1',
      'documentFamily', 'sales_export',
      'documentId', (select doc_id from bizops_import_ids),
      'locatorType', 'sheet',
      'locator', jsonb_build_object('sheet', 'sales-export'),
      'sourceHash', (select source_hash from bizops_import_ids),
      'confidenceBand', 'medium',
      'confidenceScore', 0.77,
      'capturedAt', now()
    )
  )
);

do $$
declare
  import_chunk_id text;
  nearest_chunk_id text;
  embedding_distance double precision;
begin
  select id, embedding_vector <-> '[0.11,0.22,0.33,0.44]'::vector
  into import_chunk_id, embedding_distance
  from retrieval_chunks
  where id = (select chunk_id from bizops_import_ids);

  if import_chunk_id is null then
    raise exception 'Expected imported retrieval chunk to exist';
  end if;

  if embedding_distance <> 0 then
    raise exception 'Expected import chunk vector distance to be 0, got %', embedding_distance;
  end if;

  select id
  into nearest_chunk_id
  from retrieval_chunks
  where id in (
    (select chunk_id from bizops_import_ids),
    (select other_chunk_id from bizops_import_ids)
  )
  order by embedding_vector <-> '[0.11,0.22,0.33,0.44]'::vector
  limit 1;

  if nearest_chunk_id <> (select chunk_id from bizops_import_ids) then
    raise exception 'Expected imported chunk to win nearest-neighbor query, got %', nearest_chunk_id;
  end if;
end
$$;

select
  (select count(*) from bizops_import_sales_csv) as imported_rows,
  (select sum(total_profit)::numeric(14, 2) from bizops_import_sales_csv) as imported_total_profit,
  (select embedding_dimensions from retrieval_chunks where id = (select chunk_id from bizops_import_ids)) as embedding_dimensions,
  (select embedding_vector::text from retrieval_chunks where id = (select chunk_id from bizops_import_ids)) as embedding_vector,
  (
    select id
    from retrieval_chunks
    where id in (
      (select chunk_id from bizops_import_ids),
      (select other_chunk_id from bizops_import_ids)
    )
    order by embedding_vector <-> '[0.11,0.22,0.33,0.44]'::vector
    limit 1
  ) as nearest_chunk_id;

rollback;
