-- Gastos, movimientos de stock y pedidos: solo el servidor. RLS ya los bloquea; esto cierra también los permisos. 20-10-2026.
revoke all on public.expenses, public.stock_movements, public.orders from anon, authenticated;
