-- Only the Edge Function's server credential may access these tables.
create table public.menu_cache (
  cache_key text primary key,
  model text not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint menu_cache_key_sha256 check (cache_key ~ '^[a-f0-9]{64}$')
);
create index menu_cache_expiry_idx on public.menu_cache (expires_at);

create table public.products (
  product_key text primary key,
  thai_name text not null,
  english_name text not null,
  details jsonb not null,
  model text not null,
  updated_at timestamptz not null default now(),
  constraint products_key_sha256 check (product_key ~ '^[a-f0-9]{64}$'),
  constraint products_no_menu_price check (not (details ? 'price'))
);

alter table public.menu_cache enable row level security;
alter table public.products enable row level security;
revoke all on public.menu_cache, public.products from public, anon, authenticated;
grant select, insert, update, delete on public.menu_cache, public.products to service_role;

comment on table public.menu_cache is 'Exact request results. Only request hashes are stored, never menu image bytes. Expired rows are ignored.';
comment on table public.products is 'AI-generated dish descriptions for inspection and future curation. Prices remain specific to cached menu responses.';
