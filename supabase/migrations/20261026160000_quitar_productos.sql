-- Quitar todos los productos de la tienda (26-10-2026, con el sí de Oriol).
-- Ya aplicada en pursec-core-db: se borró el producto "block-to-grid-long-sleeve" y el de prueba "zz-test-order".
-- Las variantes se borran en cascada. El pedido de prueba cancelado (orders) se conserva como registro.
delete from public.stock_movements
  where variant_id in (select v.id from public.product_variants v join public.products p on p.id = v.product_id
                       where p.slug in ('block-to-grid-long-sleeve', 'zz-test-order'));
delete from public.products where slug in ('block-to-grid-long-sleeve', 'zz-test-order');
