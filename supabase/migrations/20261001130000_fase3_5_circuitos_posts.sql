-- Fases 3 y 5 · Circuitos (datos para simuladores) y contenido (posts)
-- Aditiva: tablas nuevas + una columna opcional en races. No toca datos existentes.
-- Escrituras: solo el servidor (service role). No hay políticas de insert/update/delete.

-- 1. CIRCUITOS ----------------------------------------------------------------
-- Datos físicos del circuito, comunes a todas las series. Hechos públicos con fuente.
create table public.circuits (
  id              bigint generated always as identity primary key,
  slug            text not null unique,              -- 'monza', 'marina-bay'
  name            text not null,
  city            text,
  country         text not null,
  timezone        text,                              -- 'Europe/Rome'
  length_km       numeric(6,3),
  osm_relation_id bigint,                            -- trazado en OpenStreetMap (licencia ODbL, citar)
  layout_geojson  jsonb,
  sources         jsonb not null default '{}'::jsonb, -- { "length_km": "https://…", … }
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Parámetros de los simuladores por circuito y serie (el coche cambia la pérdida en boxes, etc.).
-- Es el insumo de las herramientas de pago: solo lo leen miembros Trackside.
create table public.circuit_series (
  circuit_id        bigint not null references public.circuits (id) on delete cascade,
  series            text not null,                 -- 'F1', 'F2', 'MotoGP', …
  race_laps         int,
  pit_loss_green_s  numeric(5,2),                  -- segundos perdidos por parar con bandera verde
  pit_loss_sc_s     numeric(5,2),                  -- … bajo Safety Car
  pit_loss_vsc_s    numeric(5,2),                  -- … bajo VSC
  pass_threshold_s  numeric(4,2),                  -- ventaja por vuelta necesaria para adelantar (Laboratorio)
  overtaking_zones  jsonb not null default '[]'::jsonb,
  compounds         jsonb not null default '{}'::jsonb, -- parámetros por defecto de cada compuesto
  sources           jsonb not null default '{}'::jsonb,
  notes             text,
  updated_at        timestamptz not null default now(),
  primary key (circuit_id, series)
);

-- Historial por circuito, serie y temporada: Safety Cars, banderas rojas, estrategia ganadora.
create table public.circuit_history (
  id                bigint generated always as identity primary key,
  circuit_id        bigint not null references public.circuits (id) on delete cascade,
  series            text not null,
  season            int not null,
  safety_cars       int check (safety_cars >= 0),
  virtual_safety_cars int check (virtual_safety_cars >= 0),
  red_flags         int check (red_flags >= 0),
  wet               boolean,
  winner_stops      int check (winner_stops >= 0),
  winning_strategy  text,                          -- 'M-H', 'S-M-H'…
  notes             text,
  sources           jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  unique (circuit_id, series, season)
);

-- Enlace opcional de cada carrera del calendario con su circuito
alter table public.races add column circuit_id bigint references public.circuits (id);
create index races_circuit_id_idx on public.races (circuit_id);

alter table public.circuits        enable row level security;
alter table public.circuit_series  enable row level security;
alter table public.circuit_history enable row level security;

create policy "Circuitos públicos" on public.circuits
  for select to anon, authenticated using (true);

create policy "Historial público" on public.circuit_history
  for select to anon, authenticated using (true);

create policy "Parámetros solo Trackside" on public.circuit_series
  for select to authenticated using ((select public.has_trackside()));

create trigger circuits_touch_updated_at
  before update on public.circuits
  for each row execute function public.touch_updated_at();

create trigger circuit_series_touch_updated_at
  before update on public.circuit_series
  for each row execute function public.touch_updated_at();

-- 2. CONTENIDO ----------------------------------------------------------------
-- Parte pública de cada pieza (resumen, módulos gratis). Estados: borrador → revisado → publicado.
create table public.posts (
  id            uuid primary key default gen_random_uuid(),
  series        text not null,
  race_id       bigint references public.races (id) on delete set null,
  kind          text not null check (kind in ('brief', 'race_card', 'debrief', 'news', 'infographic')),
  status        text not null default 'draft' check (status in ('draft', 'reviewed', 'published')),
  lang          text not null default 'es',
  slug          text not null unique,
  title         text not null,
  summary_md    text,                              -- lo que ve Paddock
  data_free     jsonb not null default '{}'::jsonb, -- p. ej. pit windows y grid de la Race Card
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (status <> 'published' or published_at is not null)
);

create index posts_race_id_idx on public.posts (race_id);
create index posts_published_idx on public.posts (published_at desc) where status = 'published';

-- Parte Trackside de cada pieza (texto completo, módulos de pago)
create table public.posts_trackside (
  post_id     uuid primary key references public.posts (id) on delete cascade,
  body_md     text,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.posts           enable row level security;
alter table public.posts_trackside enable row level security;

create policy "Publicados para todos" on public.posts
  for select to anon, authenticated
  using (status = 'published');

create policy "Completo solo Trackside" on public.posts_trackside
  for select to authenticated
  using (
    (select public.has_trackside())
    and exists (select 1 from public.posts p where p.id = post_id and p.status = 'published')
  );

create trigger posts_touch_updated_at
  before update on public.posts
  for each row execute function public.touch_updated_at();

create trigger posts_trackside_touch_updated_at
  before update on public.posts_trackside
  for each row execute function public.touch_updated_at();
