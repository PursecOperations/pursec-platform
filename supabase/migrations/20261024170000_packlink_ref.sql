-- Referencia del borrador de envío en Packlink PRO (lo crea el Worker de la tienda al confirmarse el pago)
alter table public.orders add column if not exists packlink_ref text;
comment on column public.orders.packlink_ref is 'Referencia del envío en Packlink PRO (borrador sin pagar hasta que Oriol lo paga)';
