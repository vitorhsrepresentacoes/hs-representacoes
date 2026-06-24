create type analysis_status as enum ('pending', 'processing', 'completed', 'review_required');
create type ghl_sync_status as enum ('pending', 'synced', 'failed');

create table if not exists leads (
  id uuid primary key,
  name text not null,
  phone text not null,
  modality text not null,
  goal text not null,
  value_range text not null,
  city text not null,
  timeline text not null,
  consent_at timestamptz not null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  analysis_status analysis_status not null default 'pending',
  analysis_priority text,
  analysis_summary text,
  analysis_missing_data text[] not null default '{}',
  analysis_error text,
  ghl_status ghl_sync_status not null default 'pending',
  ghl_contact_id text,
  ghl_opportunity_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_created_at_idx on leads (created_at desc);
create index if not exists leads_phone_idx on leads (phone);
