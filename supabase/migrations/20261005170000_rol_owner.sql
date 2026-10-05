-- Rol owner: acceso total a Trackside sin suscripción (solo cuentas de Oriol). Aplicada el 5 oct 2026.
alter table public.profiles
  add column if not exists role text not null default 'member'
  check (role in ('member', 'owner'));

-- Emails que reciben el rol owner al crear la cuenta. Sin políticas: nadie la lee desde el navegador.
create table if not exists public.app_owners (
  email text primary key check (email = lower(email))
);
alter table public.app_owners enable row level security;

insert into public.app_owners (email) values
  ('pursec.telemetry.hq@gmail.com'),
  ('oriolgil14@gmail.com')
on conflict do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when exists (select 1 from public.app_owners o where o.email = lower(new.email)) then 'owner' else 'member' end
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;

create or replace function public.has_trackside()
returns boolean
language sql
stable security definer
set search_path to ''
as $function$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and (
        p.role = 'owner'
        or (p.plan = 'TRACKSIDE' and p.subscription_status in ('trialing', 'active'))
      )
  );
$function$;
