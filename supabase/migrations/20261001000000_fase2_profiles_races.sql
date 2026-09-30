-- Fase 2 · Cuentas, planes y cobros
-- Aditiva: no toca user_profiles ni ninguna tabla existente.

-- 1. PERFILES ------------------------------------------------------------
create table public.profiles (
  id                     uuid primary key references auth.users (id) on delete cascade,
  email                  text,
  plan                   text not null default 'PADDOCK' check (plan in ('PADDOCK', 'TRACKSIDE')),
  billing_interval       text check (billing_interval in ('month', 'year')),
  subscription_status    text not null default 'none'
                           check (subscription_status in ('none','trialing','active','past_due','canceled','incomplete','incomplete_expired','unpaid','paused')),
  trial_end              timestamptz,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  discord_user_id        text unique,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

comment on table public.profiles is
  'Un perfil por usuario de Auth. Solo el servidor (service role: webhook de Stripe, bot de Discord) lo modifica.';

alter table public.profiles enable row level security;

-- Cada usuario solo lee su propio perfil. No hay políticas de insert/update/delete:
-- nadie puede cambiar su plan desde el navegador.
create policy "Leer mi perfil" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

-- Perfil automático al registrarse
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Email sincronizado si el usuario lo cambia
create function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email, updated_at = now() where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- updated_at automático
create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ¿El usuario que hace la consulta tiene Trackside activo?
-- Se usará en las políticas RLS del contenido de pago (tabla posts, Fase 5).
create function public.has_trackside()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.plan = 'TRACKSIDE'
      and p.subscription_status in ('trialing', 'active')
  );
$$;

revoke all on function public.has_trackside() from public, anon;
grant execute on function public.has_trackside() to authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.handle_user_email_change() from public, anon, authenticated;

-- 2. CALENDARIO -----------------------------------------------------------
create table public.races (
  id             bigint generated always as identity primary key,
  series         text not null,              -- 'F1', 'MotoGP', ...
  season         int  not null,
  round          int  not null,
  name           text not null,              -- nombre neutro, sin marcas comerciales
  circuit        text not null,
  country        text not null,
  weekend_start  date not null,              -- primer día del fin de semana (FP1)
  race_date      date not null,              -- día de la carrera principal
  race_start_utc timestamptz,                -- hora de salida si está publicada
  has_sprint     boolean not null default false,
  source_url     text not null,              -- de dónde sale el dato
  created_at     timestamptz not null default now(),
  unique (series, season, round),
  check (race_date >= weekend_start)
);

create index races_race_date_idx on public.races (race_date);

alter table public.races enable row level security;

create policy "Calendario público" on public.races
  for select to anon, authenticated
  using (true);
