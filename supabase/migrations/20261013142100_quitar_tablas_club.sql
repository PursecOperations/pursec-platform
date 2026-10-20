-- Fase 0, paso 4: quitar las tablas del club de motorsport.
-- Ejecutado a mano por Oriol en el SQL Editor de Supabase el 13/10/2026.
-- Copia completa en el esquema "archivo" (migración 20261012122800).
drop table if exists public.posts_trackside;
drop table if exists public.posts;
drop table if exists public.circuit_history;
drop table if exists public.circuit_series;
drop table if exists public.races;
drop table if exists public.circuits;
