-- Tienda de ropa (Fase 4). Aplicada en pursec-core-db el 12-10-2026 con el sí de Oriol (solo añade tablas).
-- Precios en Supabase (fuente única). Stripe cobra con price_data; Printful fabrica con el sync_variant_id.

-- ---------------------------------------------------------------- productos
create table public.products (
  id           bigint generated always as identity primary key,
  slug         text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  name         text not null check (length(name) <= 80),
  description  text check (length(description) <= 600),
  price_eur    numeric(10,2) not null check (price_eur > 0),
  specs        jsonb not null default '[]'::jsonb,      -- ["500 g/m²", "Oversized", ...]
  images       jsonb not null default '{}'::jsonb,      -- {"front": "/img/...", "back": "/img/..."}
  sort         int not null default 0,
  active       boolean not null default false,          -- solo se vende lo activo
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.product_variants (
  id                        bigint generated always as identity primary key,
  product_id                bigint not null references public.products(id) on delete cascade,
  size                      text not null check (length(size) <= 12),
  color                     text not null default 'Black' check (length(color) <= 30),
  printful_sync_variant_id  bigint,                     -- id de la variante sincronizada en Printful
  active                    boolean not null default true,
  unique (product_id, size, color)
);
create index product_variants_product on public.product_variants (product_id);

-- ---------------------------------------------------------------- pedidos
create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  stripe_session_id   text not null unique,
  stripe_payment_intent text,
  email               text,
  customer_name       text,
  shipping            jsonb,                            -- dirección de envío tal como la da Stripe
  items               jsonb not null,                   -- [{variant_id, name, size, qty, unit_eur}]
  amount_total_eur    numeric(10,2),
  status              text not null default 'paid'
                      check (status in ('paid','submitted','in_production','shipped','failed','canceled','refunded')),
  printful_order_id   bigint,
  tracking_number     text,
  tracking_url        text,
  carrier             text,
  error               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index orders_status on public.orders (status);

-- ---------------------------------------------------------------- RLS
-- Catálogo: cualquiera puede leer lo activo. Pedidos: nadie desde el navegador (solo el Worker con la clave de servicio).
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;

create policy "Leer productos activos" on public.products
  for select to anon, authenticated using (active);

create policy "Leer variantes activas" on public.product_variants
  for select to anon, authenticated
  using (active and exists (select 1 from public.products p where p.id = product_id and p.active));

-- updated_at automático
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();
