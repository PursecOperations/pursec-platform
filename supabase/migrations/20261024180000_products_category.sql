-- Categoría de cada prenda para los filtros de la tienda (hoodies, tees, sweatshirts, bottoms, outerwear, accessories)
alter table public.products add column if not exists category text;
comment on column public.products.category is 'Categoría para los filtros de la web: hoodies, tees, sweatshirts, bottoms, outerwear, accessories';
