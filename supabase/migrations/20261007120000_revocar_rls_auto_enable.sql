-- rls_auto_enable() es la función del event trigger "ensure_rls" (activa RLS en cada tabla nueva de public).
-- Es SECURITY DEFINER y estaba expuesta por la API (/rest/v1/rpc/rls_auto_enable) a anon y authenticated.
-- Nadie necesita llamarla a mano: el event trigger la ejecuta solo. Se retira el permiso (aviso del Security Advisor).
-- PENDIENTE de aplicar en pursec-core-db: requiere el "sí" de Oriol.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
