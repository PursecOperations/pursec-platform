-- rls_auto_enable tenía EXECUTE para PUBLIC; se cierra (aviso de seguridad de Supabase). 20-10-2026.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
