-- Estadísticas de redes para el panel /admin (28-10-2026). SOLO añade una tabla; no toca ni borra nada.
-- Una fila por red y día (instantánea). Se rellena desde el panel (POST /admin/social) o desde un escenario de Make.
-- Sin políticas y sin permisos para anon/authenticated: solo el Worker con la clave de servicio.
create table if not exists public.social_stats (
  id           bigint generated always as identity primary key,
  platform     text not null check (platform in ('instagram','tiktok','youtube','x')),
  stat_date    date not null,
  followers    int  not null check (followers >= 0),
  views        int  check (views is null or views >= 0),          -- visualizaciones del periodo (7 o 28 días, siempre el mismo)
  interactions int  check (interactions is null or interactions >= 0),
  posts        int  check (posts is null or posts >= 0),          -- publicaciones en el periodo
  note         text check (note is null or length(note) <= 200),
  created_at   timestamptz not null default now(),
  unique (platform, stat_date)
);
create index if not exists social_stats_platform_date on public.social_stats (platform, stat_date desc);

alter table public.social_stats enable row level security;       -- sin políticas: solo el servidor
revoke all on public.social_stats from anon, authenticated;
