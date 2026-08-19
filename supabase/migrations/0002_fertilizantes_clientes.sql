-- ============================================================================
-- 0002 — Fertilizantes, Clientes, y las columnas que los conectan con
-- cotizaciones. Migración aditiva: no modifica ni borra nada de 0001, así
-- que es segura de correr sobre un proyecto que ya tenga datos cargados.
-- ============================================================================

-- Nuevo tipo de producto cotizable. No se puede usar el valor nuevo dentro de
-- la misma transacción en la que se agrega, así que las funciones que lo usan
-- viven en la migración 0003.
alter type public.quotation_product_type add value 'fertilizantes';

-- ----------------------------------------------------------------------------
-- FERTILIZANTES — mismo patrón que semillas (catálogo con precio y stock
-- propios), pero con "presentación" libre en vez de clasificación botánica,
-- porque los fertilizantes se venden por saco/bidón/kg según el producto.
-- ----------------------------------------------------------------------------
create sequence public.fertilizer_code_seq;

create table public.fertilizers (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default ('FER-' || lpad(nextval('public.fertilizer_code_seq')::text, 4, '0')),
  common_name text not null,
  unit_label text not null default 'kg',
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  stock numeric(12,2) not null default 0 check (stock >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index fertilizers_common_name_idx on public.fertilizers using gin (to_tsvector('spanish', common_name));

create trigger trg_fertilizers_touch before update on public.fertilizers
  for each row execute function public.touch_updated_at();

alter table public.fertilizers enable row level security;
create policy "fertilizers_access" on public.fertilizers
  for all using (public.can_access()) with check (public.can_access());

-- ----------------------------------------------------------------------------
-- CLIENTES — registro opcional. Las cotizaciones siguen guardando su propio
-- client_name/client_address como fotografía histórica (igual que ya hacían
-- con los productos), así que borrar un cliente nunca corrompe cotizaciones
-- pasadas: client_id simplemente queda en null.
-- ----------------------------------------------------------------------------
create sequence public.client_code_seq;

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default ('CLI-' || lpad(nextval('public.client_code_seq')::text, 4, '0')),
  name text not null,
  address text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clients_name_idx on public.clients using gin (to_tsvector('spanish', name));

create trigger trg_clients_touch before update on public.clients
  for each row execute function public.touch_updated_at();

alter table public.clients enable row level security;
create policy "clients_access" on public.clients
  for all using (public.can_access()) with check (public.can_access());

-- ----------------------------------------------------------------------------
-- Conectar fertilizantes/clientes con cotizaciones
-- ----------------------------------------------------------------------------
alter table public.quotations
  add column client_id uuid references public.clients(id) on delete set null;

create index quotations_client_id_idx on public.quotations (client_id);

alter table public.quotation_items
  add column fertilizer_id uuid references public.fertilizers(id) on delete set null,
  add column unit_label text;
