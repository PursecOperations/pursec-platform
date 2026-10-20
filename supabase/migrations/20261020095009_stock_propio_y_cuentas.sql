-- Stock propio (sin bajo demanda) y base contable. Aplicada en pursec-core-db el 20-10-2026.
-- Solo añade columnas, tablas y funciones; no borra datos.
-- Modelo: PURSEC compra stock a un proveedor, guarda las unidades y envía los pedidos.

-- ---------------------------------------------------------------- variantes con stock y coste
alter table public.product_variants
  add column if not exists sku             text unique check (sku is null or sku ~ '^[A-Z0-9-]{3,40}$'),
  add column if not exists stock           int not null default 0 check (stock >= 0),
  add column if not exists unit_cost_eur   numeric(10,2) check (unit_cost_eur is null or unit_cost_eur >= 0),
  add column if not exists low_stock_alert int not null default 2 check (low_stock_alert >= 0);

comment on column public.product_variants.printful_sync_variant_id is 'Obsoleto desde el 20-10-2026 (ya no hay bajo demanda). No se usa.';
comment on column public.product_variants.unit_cost_eur is 'Coste por unidad pagado al proveedor, sin IVA. Privado: no se expone a la web.';

-- La web solo puede leer estas columnas (el coste y el SKU no salen al navegador).
revoke select on public.product_variants from anon, authenticated;
grant select (id, product_id, size, color, active, stock) on public.product_variants to anon, authenticated;

-- ---------------------------------------------------------------- pedidos: estados del envío propio
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('paid','packed','shipped','delivered','canceled','refunded','failed',
                    'submitted','in_production'));   -- los dos últimos solo por compatibilidad; ya no se usan
alter table public.orders
  add column if not exists stock_issue        boolean not null default false,  -- se pagó sin stock suficiente
  add column if not exists shipped_at         timestamptz,
  add column if not exists shipping_cost_eur  numeric(10,2),                   -- lo que costó la etiqueta
  add column if not exists notes              text;
comment on column public.orders.printful_order_id is 'Obsoleto desde el 20-10-2026.';

-- ---------------------------------------------------------------- movimientos de stock
create table if not exists public.stock_movements (
  id          bigint generated always as identity primary key,
  variant_id  bigint not null references public.product_variants(id) on delete restrict,
  delta       int not null check (delta <> 0),
  reason      text not null check (reason in ('purchase','sale','return','adjustment','damaged')),
  ref         text,                    -- id de pedido, nº de factura del proveedor, etc.
  created_at  timestamptz not null default now()
);
create index if not exists stock_movements_variant on public.stock_movements (variant_id);
alter table public.stock_movements enable row level security;   -- sin políticas: solo el servidor

-- Descuenta el stock de un pedido pagado. Nunca baja de 0: si falta stock lo devuelve
-- para marcar el pedido con stock_issue. Solo la clave de servicio puede llamarla.
create or replace function public.apply_order_stock(p_items jsonb, p_ref text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  it jsonb;
  v_id bigint;
  v_qty int;
  v_have int;
  shortfalls jsonb := '[]'::jsonb;
begin
  for it in select * from jsonb_array_elements(p_items) loop
    v_id  := (it->>'variant_id')::bigint;
    v_qty := (it->>'qty')::int;
    select stock into v_have from public.product_variants where id = v_id for update;
    if v_have is null then
      shortfalls := shortfalls || jsonb_build_object('variant_id', v_id, 'missing', v_qty);
      continue;
    end if;
    if v_have < v_qty then
      shortfalls := shortfalls || jsonb_build_object('variant_id', v_id, 'missing', v_qty - v_have);
    end if;
    update public.product_variants set stock = greatest(v_have - v_qty, 0) where id = v_id;
    if least(v_qty, v_have) > 0 then
      insert into public.stock_movements (variant_id, delta, reason, ref)
        values (v_id, -least(v_qty, v_have), 'sale', p_ref);
    end if;
  end loop;
  return shortfalls;
end $$;
revoke all on function public.apply_order_stock(jsonb, text) from public, anon, authenticated;
grant execute on function public.apply_order_stock(jsonb, text) to service_role;

-- ---------------------------------------------------------------- gastos (contabilidad)
create table if not exists public.expenses (
  id           bigint generated always as identity primary key,
  expense_date date not null,
  category     text not null check (category in
                 ('stock','shipping_labels','packaging','software','ads','samples','fees','other')),
  concept      text not null check (length(concept) <= 200),
  supplier     text check (length(supplier) <= 120),
  invoice_ref  text check (length(invoice_ref) <= 80),
  base_eur     numeric(10,2) not null check (base_eur >= 0),
  vat_eur      numeric(10,2) not null default 0 check (vat_eur >= 0),
  total_eur    numeric(10,2) generated always as (base_eur + vat_eur) stored,
  receipt_url  text,           -- enlace a la factura en Google Drive
  notes        text,
  created_at   timestamptz not null default now()
);
create index if not exists expenses_date on public.expenses (expense_date);
alter table public.expenses enable row level security;   -- sin políticas: solo el servidor

-- ---------------------------------------------------------------- funciones del club: cerrar acceso público
revoke execute on function public.has_trackside() from anon, authenticated;
revoke execute on function public.rls_auto_enable() from anon, authenticated;
