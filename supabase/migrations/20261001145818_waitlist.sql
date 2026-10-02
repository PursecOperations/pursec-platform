-- Lista de espera de la página "Muy pronto" (aplicada en pursec-core-db el 1 oct 2026, aprobada por Oriol).
-- Cualquiera puede apuntarse (insert); nadie puede leer la lista desde el navegador.
create table public.waitlist (
  id          bigint generated always as identity primary key,
  email       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
  consent_at  timestamptz not null default now(),   -- aceptó la política de privacidad
  lang        text not null default 'es' check (lang in ('es', 'en')),
  source      text,                                  -- de dónde viene (utm, red social…)
  created_at  timestamptz not null default now()
);
create unique index waitlist_email_unique on public.waitlist (lower(email));

alter table public.waitlist enable row level security;

create policy "Apuntarse a la lista" on public.waitlist
  for insert to anon, authenticated
  with check (consent_at is not null and (source is null or length(source) <= 100));
