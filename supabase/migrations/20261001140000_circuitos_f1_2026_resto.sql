-- Circuitos de las 8 carreras F1 que quedan en 2026 (rondas 16–23), con fuente por dato.
-- pit_loss_*, pass_threshold y compounds: PENDIENTE (sin fuente pública fiable).
insert into public.circuits (slug, name, city, country, timezone, length_km, sources) values
('sepang','Sepang International Circuit','Sepang','Malasia','Asia/Kuala_Lumpur',5.543,'{"length_km":"https://www.formula1.com/en/racing/2026/bahrain"}'),
('marina-bay','Marina Bay Street Circuit','Singapur','Singapur','Asia/Singapore',4.927,'{"length_km":"https://www.formula1.com/en/racing/2026/singapore"}'),
('cota','Circuit of the Americas','Austin','EE. UU.','America/Chicago',5.513,'{"length_km":"https://www.formula1.com/en/racing/2026/united-states"}'),
('hermanos-rodriguez','Autódromo Hermanos Rodríguez','Ciudad de México','México','America/Mexico_City',4.304,'{"length_km":"https://www.formula1.com/en/racing/2026/mexico"}'),
('interlagos','Autódromo José Carlos Pace (Interlagos)','São Paulo','Brasil','America/Sao_Paulo',4.309,'{"length_km":"https://www.formula1.com/en/racing/2026/brazil"}'),
('las-vegas','Las Vegas Strip Circuit','Las Vegas','EE. UU.','America/Los_Angeles',6.201,'{"length_km":"https://en.wikipedia.org/wiki/2025_Las_Vegas_Grand_Prix"}'),
('lusail','Lusail International Circuit','Lusail','Catar','Asia/Qatar',5.419,'{"length_km":"https://www.formula1.com/en/racing/2026/qatar"}'),
('yas-marina','Yas Marina Circuit','Abu Dabi','EAU','Asia/Dubai',5.281,'{"length_km":"https://racingnews365.com/formula-1-circuits/abu-dhabi-gp"}')
on conflict (slug) do nothing;

insert into public.circuit_series (circuit_id, series, race_laps, sources, notes)
select c.id, 'F1', v.laps, jsonb_build_object('race_laps', v.src), 'pit_loss_*, pass_threshold y compounds: PENDIENTE (sin fuente pública fiable)'
from public.circuits c join (values
  ('sepang',56,'https://www.formula1.com/en/racing/2026/bahrain'),
  ('marina-bay',62,'https://www.formula1.com/en/racing/2026/singapore'),
  ('cota',56,'https://www.formula1.com/en/racing/2026/united-states'),
  ('hermanos-rodriguez',71,'https://www.formula1.com/en/racing/2026/mexico'),
  ('interlagos',71,'https://www.formula1.com/en/racing/2026/brazil'),
  ('las-vegas',50,'https://en.wikipedia.org/wiki/2025_Las_Vegas_Grand_Prix'),
  ('lusail',57,'https://www.formula1.com/en/racing/2026/qatar'),
  ('yas-marina',58,'https://racingnews365.com/formula-1-circuits/abu-dhabi-gp')
) as v(slug, laps, src) on v.slug = c.slug
on conflict (circuit_id, series) do nothing;

update public.races r set circuit_id = c.id
from public.circuits c join (values (16,'sepang'),(17,'marina-bay'),(18,'cota'),(19,'hermanos-rodriguez'),(20,'interlagos'),(21,'las-vegas'),(22,'lusail'),(23,'yas-marina')) as m(round, slug) on m.slug = c.slug
where r.series = 'F1' and r.season = 2026 and r.round = m.round;
