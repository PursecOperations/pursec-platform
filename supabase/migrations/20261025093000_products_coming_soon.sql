-- Productos anunciados que aún no han salido: la web muestra "Coming soon" en vez de "Sold out".
alter table public.products add column if not exists coming_soon boolean not null default false;
