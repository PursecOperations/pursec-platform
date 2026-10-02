-- Calendario F1 2026 (23 rondas). Fuente: https://www.formula1.com/en/racing/2026
-- contrastado con https://www.racefans.net/2026-f1-season/2026-f1-calendar/ (1 oct 2026).
-- Sprints según RaceFans. Horas de salida sin cargar: [PENDIENTE] de la web oficial.
insert into public.races (series, season, round, name, circuit, country, weekend_start, race_date, has_sprint, source_url) values
('F1',2026,1,'GP de Australia','Albert Park','Australia','2026-03-06','2026-03-08',false,'https://www.formula1.com/en/racing/2026'),
('F1',2026,2,'GP de China','Shanghai International Circuit','China','2026-03-13','2026-03-15',true,'https://www.formula1.com/en/racing/2026'),
('F1',2026,3,'GP de Japón','Suzuka','Japón','2026-03-27','2026-03-29',false,'https://www.formula1.com/en/racing/2026'),
('F1',2026,4,'GP de Miami','Miami International Autodrome','EE. UU.','2026-05-01','2026-05-03',true,'https://www.formula1.com/en/racing/2026'),
('F1',2026,5,'GP de Canadá','Circuit Gilles Villeneuve','Canadá','2026-05-22','2026-05-24',true,'https://www.formula1.com/en/racing/2026'),
('F1',2026,6,'GP de Mónaco','Circuit de Monaco','Mónaco','2026-06-05','2026-06-07',false,'https://www.formula1.com/en/racing/2026'),
('F1',2026,7,'GP de Barcelona-Catalunya','Circuit de Barcelona-Catalunya','España','2026-06-12','2026-06-14',false,'https://www.formula1.com/en/racing/2026'),
('F1',2026,8,'GP de Austria','Red Bull Ring','Austria','2026-06-26','2026-06-28',false,'https://www.formula1.com/en/racing/2026'),
('F1',2026,9,'GP de Gran Bretaña','Silverstone','Reino Unido','2026-07-03','2026-07-05',true,'https://www.formula1.com/en/racing/2026'),
('F1',2026,10,'GP de Bélgica','Spa-Francorchamps','Bélgica','2026-07-17','2026-07-19',false,'https://www.formula1.com/en/racing/2026'),
('F1',2026,11,'GP de Hungría','Hungaroring','Hungría','2026-07-24','2026-07-26',false,'https://www.formula1.com/en/racing/2026'),
('F1',2026,12,'GP de Países Bajos','Zandvoort','Países Bajos','2026-08-21','2026-08-23',true,'https://www.formula1.com/en/racing/2026'),
('F1',2026,13,'GP de Italia','Monza','Italia','2026-09-04','2026-09-06',false,'https://www.formula1.com/en/racing/2026'),
('F1',2026,14,'GP de España','Madring','España','2026-09-11','2026-09-13',false,'https://www.formula1.com/en/racing/2026'),
('F1',2026,15,'GP de Azerbaiyán','Baku City Circuit','Azerbaiyán','2026-09-24','2026-09-26',false,'https://www.formula1.com/en/racing/2026'),
('F1',2026,16,'GP de Baréin (en Sepang)','Sepang International Circuit','Malasia','2026-10-02','2026-10-04',false,'https://www.formula1.com/en/racing/2026'),
('F1',2026,17,'GP de Singapur','Marina Bay','Singapur','2026-10-09','2026-10-11',true,'https://www.formula1.com/en/racing/2026'),
('F1',2026,18,'GP de Estados Unidos','Circuit of the Americas','EE. UU.','2026-10-23','2026-10-25',false,'https://www.formula1.com/en/racing/2026'),
('F1',2026,19,'GP de México','Autódromo Hermanos Rodríguez','México','2026-10-30','2026-11-01',false,'https://www.formula1.com/en/racing/2026'),
('F1',2026,20,'GP de Brasil','Interlagos','Brasil','2026-11-06','2026-11-08',false,'https://www.formula1.com/en/racing/2026'),
('F1',2026,21,'GP de Las Vegas','Las Vegas Strip Circuit','EE. UU.','2026-11-19','2026-11-21',false,'https://www.formula1.com/en/racing/2026'),
('F1',2026,22,'GP de Catar','Losail','Catar','2026-11-27','2026-11-29',false,'https://www.formula1.com/en/racing/2026'),
('F1',2026,23,'GP de Abu Dabi','Yas Marina','EAU','2026-12-04','2026-12-06',false,'https://www.formula1.com/en/racing/2026')
on conflict (series, season, round) do nothing;
