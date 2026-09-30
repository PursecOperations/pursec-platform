-- La función antigua gdpr_delete_user_account(email) era SECURITY DEFINER y ejecutable
-- por visitantes (anon): cualquiera podía borrar filas de user_profiles sabiendo un email.
-- Se retira el permiso público (no borra nada). Reversible con un GRANT.
revoke execute on function public.gdpr_delete_user_account(text) from public, anon, authenticated;
alter function public.gdpr_delete_user_account(text) set search_path = '';
