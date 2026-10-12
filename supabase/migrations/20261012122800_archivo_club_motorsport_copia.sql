-- Copia de seguridad de las tablas del club antes de la limpieza (Fase 0, paso 2).
-- Ya aplicada en pursec-core-db el 12-10-2026.
-- El esquema "archivo" no está expuesto en la API: solo accesible desde el panel o con la clave de servicio.
create schema if not exists archivo;
revoke all on schema archivo from anon, authenticated;
create table archivo.races           as table public.races;
create table archivo.circuits        as table public.circuits;
create table archivo.circuit_series  as table public.circuit_series;
create table archivo.circuit_history as table public.circuit_history;
create table archivo.posts           as table public.posts;
create table archivo.posts_trackside as table public.posts_trackside;
comment on schema archivo is 'Copia de las tablas del club de motorsport (12-10-2026) antes de pasar a marca de ropa.';
