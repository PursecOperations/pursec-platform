// PURSEC v4 — datos de la web pública.
// REAL: calendario F1 2026 (misma fuente que supabase/migrations/20261001000200_races_f1_2026.sql).
// DEMO: todo lo demás (calendarios del resto de series, horarios de sesiones, equipos, pilotos, puntos, noticias, vídeos).
// Los equipos y pilotos son ficticios a propósito: así la demo nunca atribuye resultados inventados a gente real.
// Cuando haya datos con fuente, se sustituyen aquí sin tocar las páginas.
(function () {
  "use strict";

  // ---------- series ----------
  // type: open | fe | indy | bike | proto | gt  (decide la silueta del coche)
  var SERIES = [
    { id: "f1", short: "F1", name: "Formula 1", type: "open", hue: 275, season: "2026", sprint: true,
      tag: "La cima del motorsport en circuito.", carsPerTeam: 2, driversPerCar: 1, teams: 11,
      intro: "Monoplazas híbridos de 2026: chasis más corto y ligero, aerodinámica activa y casi la mitad de la potencia eléctrica. 22 coches, 11 equipos y un campeonato que se decide en el Undercut, la degradación y la gestión de energía.",
      facts: [["Coches", "22"], ["Potencia", "≈1.000 cv"], ["Vel. punta", "≈350 km/h"], ["Carrera", "≈305 km"], ["Peso mín.", "≈768 kg"], ["Rondas", "23"]],
      keys: [["Energy management", "Recargar y desplegar la batería decide adelantamientos y defensa."], ["Tyre deg", "Tres compuestos por fin de semana y al menos una parada obligatoria en seco."], ["Active aero", "Alas móviles en recta y curva: el coche cambia de configuración cada vuelta."]],
      points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1] },
    { id: "f2", short: "F2", name: "Formula 2", type: "open", hue: 262, season: "2026", sprint: true,
      tag: "La última puerta antes de la F1.", carsPerTeam: 2, driversPerCar: 1, teams: 11,
      intro: "Monoplaza único para todos: mismo chasis, mismo motor y mismos neumáticos. Gana el piloto y el equipo que mejor lee la carrera. Sprint Race el sábado con parrilla invertida y Feature Race el domingo con parada obligatoria.",
      facts: [["Coches", "22"], ["Potencia", "≈620 cv"], ["Vel. punta", "≈335 km/h"], ["Feature", "≈170 km"], ["Chasis", "Único"], ["Rondas", "12 (demo)"]],
      keys: [["Reverse grid", "El top 10 de la clasificación sale invertido en la Sprint Race."], ["Mandatory stop", "En la Feature Race hay que usar los dos compuestos."], ["Spec car", "Sin desarrollo: la diferencia está en el setup y en el piloto."]],
      points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1] },
    { id: "f3", short: "F3", name: "Formula 3", type: "open", hue: 250, season: "2026", sprint: true,
      tag: "Treinta coches, cero margen.", carsPerTeam: 3, driversPerCar: 1, teams: 10,
      intro: "La parrilla más llena del paddock: 30 pilotos, coches idénticos y carreras sin parada. Aquí se aprende a adelantar en el tráfico y a cuidar el neumático durante toda la carrera.",
      facts: [["Coches", "30"], ["Potencia", "≈380 cv"], ["Vel. punta", "≈300 km/h"], ["Carrera", "≈40 min"], ["Paradas", "0"], ["Rondas", "9 (demo)"]],
      keys: [["Pack racing", "Las diferencias son de décimas: el slipstream manda."], ["No pit stops", "Un juego de neumáticos para toda la carrera."], ["Qualifying", "Con 30 coches, una vuelta limpia vale media carrera."]],
      points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1] },
    { id: "fe", short: "FE", name: "Formula E", type: "fe", hue: 290, season: "2025-26", sprint: false,
      tag: "Eléctrico, urbano y estratégico.", carsPerTeam: 2, driversPerCar: 1, teams: 11,
      intro: "Monoplazas 100 % eléctricos en circuitos urbanos. La carrera se gana con la energía: cuándo ahorrar, cuándo atacar y cuándo usar el Attack Mode. Clasificación en duelos cara a cara.",
      facts: [["Coches", "22"], ["Potencia", "≈470 cv"], ["0-100", "≈1,8 s"], ["Carrera", "≈45 min"], ["Regeneración", "≈600 kW"], ["Rondas", "16"]],
      keys: [["Energy target", "Todos salen con la misma energía: gana quien la reparte mejor."], ["Attack Mode", "Potencia extra temporal a cambio de salirse de la trazada."], ["Duels", "La clasificación final se decide en eliminatorias 1 contra 1."]],
      points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1] },
    { id: "motogp", short: "MotoGP", name: "MotoGP", type: "bike", hue: 300, season: "2026", sprint: true,
      tag: "Prototipos de dos ruedas al límite.", carsPerTeam: 2, driversPerCar: 1, teams: 11,
      intro: "Motos prototipo de 1.000 cc con más de 290 cv y menos de 160 kg. Sprint el sábado a media distancia y carrera el domingo. Neumático delantero, presión mínima y electrónica marcan la diferencia.",
      facts: [["Motos", "22"], ["Potencia", "≈290 cv"], ["Vel. punta", "≈365 km/h"], ["Carrera", "≈40 min"], ["Peso", "≈157 kg"], ["Rondas", "22"]],
      keys: [["Sprint", "Media carrera el sábado con la mitad de puntos."], ["Tyre pressure", "Ir por debajo de la presión mínima se sanciona."], ["Ride height", "Dispositivos de salida y altura cambian la aceleración."]],
      points: [25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1] },
    { id: "indycar", short: "IndyCar", name: "IndyCar", type: "indy", hue: 240, season: "2026", sprint: false,
      tag: "Óvalos, urbanos y circuitos.", carsPerTeam: 2, driversPerCar: 1, teams: 12,
      intro: "Chasis único con Aeroscreen y motores V6 híbridos. Corre en óvalos a más de 370 km/h, en calles y en circuitos permanentes. Push-to-pass, cautions y estrategia de combustible deciden muchas carreras.",
      facts: [["Coches", "≈27"], ["Potencia", "≈800 cv"], ["Vel. punta", "≈380 km/h"], ["Indy 500", "805 km"], ["Chasis", "Único"], ["Rondas", "17"]],
      keys: [["Fuel saving", "Ahorrar combustible puede quitar una parada entera."], ["Push-to-pass", "Potencia extra con un tiempo total limitado por carrera."], ["Cautions", "Los periodos de neutralización reordenan la estrategia."]],
      points: [50, 40, 35, 32, 30, 28, 26, 24, 22, 20, 19, 18, 17, 16, 15] },
    { id: "wec", short: "WEC", name: "WEC", type: "proto", hue: 268, season: "2026", sprint: false,
      tag: "Resistencia mundial: 6, 10 y 24 horas.", carsPerTeam: 2, driversPerCar: 3, teams: 9,
      intro: "Hypercars de varios fabricantes compartiendo pista con GT3 en carreras de 6 a 24 horas. Tres pilotos por coche, Balance of Performance y tráfico constante. Le Mans da puntos dobles.",
      facts: [["Hypercars", "≈18"], ["Potencia", "≈680 cv"], ["Vel. punta", "≈340 km/h"], ["Le Mans", "24 h"], ["Pilotos/coche", "3"], ["Rondas", "8"]],
      keys: [["BoP", "Peso y potencia ajustados para igualar fabricantes."], ["Traffic", "Adelantar GT3 sin perder tiempo es media carrera."], ["Stint length", "Doble o triple stint de neumáticos y piloto."]],
      points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1] },
    { id: "imsa", short: "IMSA", name: "IMSA", type: "proto", hue: 282, season: "2026", sprint: false,
      tag: "Resistencia americana, de Daytona a Road Atlanta.", carsPerTeam: 2, driversPerCar: 2, teams: 8,
      intro: "Prototipos GTP híbridos y GT en circuitos clásicos de Norteamérica. Carreras de 2h40 a 24 horas con muchas neutralizaciones: la estrategia de cautions es un arte.",
      facts: [["GTP", "≈12"], ["Potencia", "≈680 cv"], ["Vel. punta", "≈320 km/h"], ["Daytona", "24 h"], ["Pilotos/coche", "2-4"], ["Rondas", "11"]],
      keys: [["Full course yellow", "Las cautions agrupan y reabren la carrera."], ["Wave-by", "Saber cuándo te devuelven la vuelta cambia el plan."], ["Multi-class", "Tres clases a la vez en la misma pista."]],
      points: [350, 320, 300, 280, 260, 250, 240, 230, 220, 210] },
    { id: "gt3", short: "GT3", name: "GT World Challenge", type: "gt", hue: 258, season: "2026", sprint: true,
      tag: "Coches de calle convertidos en armas de carrera.", carsPerTeam: 2, driversPerCar: 2, teams: 10,
      intro: "Deportivos GT3 de más de diez marcas igualados por BoP. Formato Endurance (3 a 24 horas) y Sprint (1 hora). Pilotos profesionales y amateurs comparten coche y clasificación.",
      facts: [["Coches", "≈50"], ["Potencia", "≈550 cv"], ["Vel. punta", "≈290 km/h"], ["Spa", "24 h"], ["Marcas", "10+"], ["Rondas", "10"]],
      keys: [["BoP", "Cada modelo lleva su lastre y restrictor."], ["Pit window", "Ventana obligatoria de parada y cambio de piloto."], ["Pro-Am", "Varias categorías de piloto en el mismo coche."]],
      points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1] }
  ];
  var BY = {}; SERIES.forEach(function (s) { BY[s.id] = s; });

  // ---------- calendarios ----------
  // [nombre, circuito, país, bandera, inicio, carrera, UTC offset del circuito, sprint, desplazamiento horario (h)]
  var CAL = {
    f1: [
      ["GP de Australia","Albert Park","Australia","🇦🇺","2026-03-06","2026-03-08",11,0],
      ["GP de China","Shanghai International Circuit","China","🇨🇳","2026-03-13","2026-03-15",8,1],
      ["GP de Japón","Suzuka","Japón","🇯🇵","2026-03-27","2026-03-29",9,0],
      ["GP de Miami","Miami International Autodrome","EE. UU.","🇺🇸","2026-05-01","2026-05-03",-4,1],
      ["GP de Canadá","Circuit Gilles Villeneuve","Canadá","🇨🇦","2026-05-22","2026-05-24",-4,1],
      ["GP de Mónaco","Circuit de Monaco","Mónaco","🇲🇨","2026-06-05","2026-06-07",2,0],
      ["GP de Barcelona-Catalunya","Circuit de Barcelona-Catalunya","España","🇪🇸","2026-06-12","2026-06-14",2,0],
      ["GP de Austria","Red Bull Ring","Austria","🇦🇹","2026-06-26","2026-06-28",2,0],
      ["GP de Gran Bretaña","Silverstone","Reino Unido","🇬🇧","2026-07-03","2026-07-05",1,1],
      ["GP de Bélgica","Spa-Francorchamps","Bélgica","🇧🇪","2026-07-17","2026-07-19",2,0],
      ["GP de Hungría","Hungaroring","Hungría","🇭🇺","2026-07-24","2026-07-26",2,0],
      ["GP de Países Bajos","Zandvoort","Países Bajos","🇳🇱","2026-08-21","2026-08-23",2,1],
      ["GP de Italia","Monza","Italia","🇮🇹","2026-09-04","2026-09-06",2,0],
      ["GP de España","Madring","España","🇪🇸","2026-09-11","2026-09-13",2,0],
      ["GP de Azerbaiyán","Baku City Circuit","Azerbaiyán","🇦🇿","2026-09-24","2026-09-26",4,0],
      ["GP de Baréin (en Sepang)","Sepang International Circuit","Malasia","🇲🇾","2026-10-02","2026-10-04",8,0],
      ["GP de Singapur","Marina Bay","Singapur","🇸🇬","2026-10-09","2026-10-11",8,1,5],
      ["GP de Estados Unidos","Circuit of the Americas","EE. UU.","🇺🇸","2026-10-23","2026-10-25",-5,0],
      ["GP de México","Autódromo Hermanos Rodríguez","México","🇲🇽","2026-10-30","2026-11-01",-6,0],
      ["GP de Brasil","Interlagos","Brasil","🇧🇷","2026-11-06","2026-11-08",-3,0],
      ["GP de Las Vegas","Las Vegas Strip Circuit","EE. UU.","🇺🇸","2026-11-19","2026-11-21",-8,0,7],
      ["GP de Catar","Losail","Catar","🇶🇦","2026-11-27","2026-11-29",3,0,4],
      ["GP de Abu Dabi","Yas Marina","EAU","🇦🇪","2026-12-04","2026-12-06",4,0,2]
    ],
    f2: [
      ["Ronda de Australia","Albert Park","Australia","🇦🇺","2026-03-06","2026-03-08",11,1],
      ["Ronda de Mónaco","Circuit de Monaco","Mónaco","🇲🇨","2026-06-05","2026-06-07",2,1],
      ["Ronda de Barcelona","Circuit de Barcelona-Catalunya","España","🇪🇸","2026-06-12","2026-06-14",2,1],
      ["Ronda de Austria","Red Bull Ring","Austria","🇦🇹","2026-06-26","2026-06-28",2,1],
      ["Ronda de Gran Bretaña","Silverstone","Reino Unido","🇬🇧","2026-07-03","2026-07-05",1,1],
      ["Ronda de Bélgica","Spa-Francorchamps","Bélgica","🇧🇪","2026-07-17","2026-07-19",2,1],
      ["Ronda de Hungría","Hungaroring","Hungría","🇭🇺","2026-07-24","2026-07-26",2,1],
      ["Ronda de Italia","Monza","Italia","🇮🇹","2026-09-04","2026-09-06",2,1],
      ["Ronda de Madrid","Madring","España","🇪🇸","2026-09-11","2026-09-13",2,1],
      ["Ronda de Azerbaiyán","Baku City Circuit","Azerbaiyán","🇦🇿","2026-09-24","2026-09-26",4,1],
      ["Ronda de Catar","Losail","Catar","🇶🇦","2026-11-27","2026-11-29",3,1,4],
      ["Ronda de Abu Dabi","Yas Marina","EAU","🇦🇪","2026-12-04","2026-12-06",4,1,2]
    ],
    f3: [
      ["Ronda de Australia","Albert Park","Australia","🇦🇺","2026-03-06","2026-03-08",11,1],
      ["Ronda de Mónaco","Circuit de Monaco","Mónaco","🇲🇨","2026-06-05","2026-06-07",2,1],
      ["Ronda de Barcelona","Circuit de Barcelona-Catalunya","España","🇪🇸","2026-06-12","2026-06-14",2,1],
      ["Ronda de Austria","Red Bull Ring","Austria","🇦🇹","2026-06-26","2026-06-28",2,1],
      ["Ronda de Gran Bretaña","Silverstone","Reino Unido","🇬🇧","2026-07-03","2026-07-05",1,1],
      ["Ronda de Bélgica","Spa-Francorchamps","Bélgica","🇧🇪","2026-07-17","2026-07-19",2,1],
      ["Ronda de Hungría","Hungaroring","Hungría","🇭🇺","2026-07-24","2026-07-26",2,1],
      ["Ronda de Italia","Monza","Italia","🇮🇹","2026-09-04","2026-09-06",2,1],
      ["Ronda de Madrid","Madring","España","🇪🇸","2026-09-11","2026-09-13",2,1]
    ],
    fe: [
      ["E-Prix de São Paulo","Anhembi","Brasil","🇧🇷","2025-12-06","2025-12-06",-3,0],
      ["E-Prix de Ciudad de México","Autódromo Hermanos Rodríguez","México","🇲🇽","2026-01-10","2026-01-10",-6,0],
      ["E-Prix de Miami","Homestead-Miami","EE. UU.","🇺🇸","2026-01-31","2026-01-31",-5,0],
      ["E-Prix de Yeda","Jeddah Corniche","Arabia Saudí","🇸🇦","2026-02-13","2026-02-14",3,0],
      ["E-Prix de Madrid","Jarama","España","🇪🇸","2026-03-21","2026-03-21",1,0],
      ["E-Prix de Berlín","Tempelhof","Alemania","🇩🇪","2026-05-02","2026-05-03",2,0],
      ["E-Prix de Mónaco","Circuit de Monaco","Mónaco","🇲🇨","2026-05-16","2026-05-17",2,0],
      ["E-Prix de Shanghái","Shanghai International Circuit","China","🇨🇳","2026-06-06","2026-06-07",8,0],
      ["E-Prix de Yakarta","Jakarta International e-Prix Circuit","Indonesia","🇮🇩","2026-06-20","2026-06-20",7,0],
      ["E-Prix de Tokio","Tokyo Street Circuit","Japón","🇯🇵","2026-07-25","2026-07-26",9,0],
      ["E-Prix de Londres","ExCeL London","Reino Unido","🇬🇧","2026-08-15","2026-08-16",1,0]
    ],
    motogp: [
      ["GP de Tailandia","Chang International Circuit","Tailandia","🇹🇭","2026-02-27","2026-03-01",7,1],
      ["GP de Brasil","Goiânia","Brasil","🇧🇷","2026-03-20","2026-03-22",-3,1],
      ["GP de las Américas","Circuit of the Americas","EE. UU.","🇺🇸","2026-03-27","2026-03-29",-5,1],
      ["GP de Catar","Losail","Catar","🇶🇦","2026-04-10","2026-04-12",3,1],
      ["GP de España","Jerez","España","🇪🇸","2026-04-24","2026-04-26",2,1],
      ["GP de Francia","Le Mans Bugatti","Francia","🇫🇷","2026-05-08","2026-05-10",2,1],
      ["GP de Cataluña","Circuit de Barcelona-Catalunya","España","🇪🇸","2026-05-15","2026-05-17",2,1],
      ["GP de Italia","Mugello","Italia","🇮🇹","2026-05-29","2026-05-31",2,1],
      ["GP de Hungría","Balaton Park","Hungría","🇭🇺","2026-06-05","2026-06-07",2,1],
      ["GP de Chequia","Brno","Chequia","🇨🇿","2026-06-19","2026-06-21",2,1],
      ["GP de Países Bajos","Assen","Países Bajos","🇳🇱","2026-06-26","2026-06-28",2,1],
      ["GP de Alemania","Sachsenring","Alemania","🇩🇪","2026-07-10","2026-07-12",2,1],
      ["GP de Gran Bretaña","Silverstone","Reino Unido","🇬🇧","2026-08-07","2026-08-09",1,1],
      ["GP de Aragón","MotorLand Aragón","España","🇪🇸","2026-08-28","2026-08-30",2,1],
      ["GP de San Marino","Misano","San Marino","🇸🇲","2026-09-11","2026-09-13",2,1],
      ["GP de Austria","Red Bull Ring","Austria","🇦🇹","2026-09-18","2026-09-20",2,1],
      ["GP de Japón","Motegi","Japón","🇯🇵","2026-10-02","2026-10-04",9,1],
      ["GP de Indonesia","Mandalika","Indonesia","🇮🇩","2026-10-09","2026-10-11",8,1],
      ["GP de Australia","Phillip Island","Australia","🇦🇺","2026-10-23","2026-10-25",11,1],
      ["GP de Malasia","Sepang International Circuit","Malasia","🇲🇾","2026-10-30","2026-11-01",8,1],
      ["GP de Portugal","Portimão","Portugal","🇵🇹","2026-11-13","2026-11-15",0,1],
      ["GP de la Comunitat Valenciana","Ricardo Tormo","España","🇪🇸","2026-11-20","2026-11-22",1,1]
    ],
    indycar: [
      ["GP de St. Petersburg","Streets of St. Petersburg","EE. UU.","🇺🇸","2026-02-27","2026-03-01",-5,0],
      ["Phoenix","Phoenix Raceway","EE. UU.","🇺🇸","2026-03-06","2026-03-07",-7,0],
      ["GP de Arlington","Streets of Arlington","EE. UU.","🇺🇸","2026-03-13","2026-03-15",-5,0],
      ["GP de Alabama","Barber Motorsports Park","EE. UU.","🇺🇸","2026-03-27","2026-03-29",-5,0],
      ["GP de Long Beach","Streets of Long Beach","EE. UU.","🇺🇸","2026-04-17","2026-04-19",-7,0],
      ["GP de Indianápolis","Indianapolis Road Course","EE. UU.","🇺🇸","2026-05-08","2026-05-09",-4,0],
      ["Indianapolis 500","Indianapolis Motor Speedway","EE. UU.","🇺🇸","2026-05-22","2026-05-24",-4,0],
      ["GP de Detroit","Streets of Detroit","EE. UU.","🇺🇸","2026-05-29","2026-05-31",-4,0],
      ["Gateway","World Wide Technology Raceway","EE. UU.","🇺🇸","2026-06-05","2026-06-06",-5,0],
      ["Road America","Road America","EE. UU.","🇺🇸","2026-06-19","2026-06-21",-5,0],
      ["Mid-Ohio","Mid-Ohio Sports Car Course","EE. UU.","🇺🇸","2026-07-03","2026-07-05",-4,0],
      ["GP de Toronto","Streets of Toronto","Canadá","🇨🇦","2026-07-17","2026-07-19",-4,0],
      ["Laguna Seca","WeatherTech Raceway Laguna Seca","EE. UU.","🇺🇸","2026-08-07","2026-08-09",-7,0],
      ["Milwaukee","Milwaukee Mile","EE. UU.","🇺🇸","2026-08-29","2026-08-30",-5,0]
    ],
    wec: [
      ["1812 km de Catar","Losail","Catar","🇶🇦","2026-03-26","2026-03-28",3,0],
      ["6 Horas de Imola","Imola","Italia","🇮🇹","2026-04-17","2026-04-19",2,0],
      ["6 Horas de Spa","Spa-Francorchamps","Bélgica","🇧🇪","2026-05-07","2026-05-09",2,0],
      ["24 Horas de Le Mans","Circuit de la Sarthe","Francia","🇫🇷","2026-06-10","2026-06-14",2,0],
      ["6 Horas de São Paulo","Interlagos","Brasil","🇧🇷","2026-07-10","2026-07-12",-3,0],
      ["Lone Star Le Mans","Circuit of the Americas","EE. UU.","🇺🇸","2026-09-04","2026-09-06",-5,0],
      ["6 Horas de Fuji","Fuji Speedway","Japón","🇯🇵","2026-09-25","2026-09-27",9,0],
      ["8 Horas de Baréin","Bahrain International Circuit","Baréin","🇧🇭","2026-11-05","2026-11-07",3,0]
    ],
    imsa: [
      ["24 Horas de Daytona","Daytona International Speedway","EE. UU.","🇺🇸","2026-01-22","2026-01-25",-5,0],
      ["12 Horas de Sebring","Sebring","EE. UU.","🇺🇸","2026-03-18","2026-03-21",-4,0],
      ["GP de Long Beach","Streets of Long Beach","EE. UU.","🇺🇸","2026-04-17","2026-04-18",-7,0],
      ["Laguna Seca","WeatherTech Raceway Laguna Seca","EE. UU.","🇺🇸","2026-05-01","2026-05-03",-7,0],
      ["GP de Detroit","Streets of Detroit","EE. UU.","🇺🇸","2026-05-29","2026-05-30",-4,0],
      ["6 Horas de Watkins Glen","Watkins Glen","EE. UU.","🇺🇸","2026-06-25","2026-06-28",-4,0],
      ["Canadian Tire Motorsport Park","CTMP","Canadá","🇨🇦","2026-07-10","2026-07-12",-4,0],
      ["Road America","Road America","EE. UU.","🇺🇸","2026-07-31","2026-08-02",-5,0],
      ["Virginia International Raceway","VIR","EE. UU.","🇺🇸","2026-08-21","2026-08-23",-4,0],
      ["Indianápolis","Indianapolis Road Course","EE. UU.","🇺🇸","2026-09-18","2026-09-20",-4,0],
      ["Petit Le Mans","Road Atlanta","EE. UU.","🇺🇸","2026-10-07","2026-10-10",-4,0]
    ],
    gt3: [
      ["Paul Ricard","Circuit Paul Ricard","Francia","🇫🇷","2026-04-10","2026-04-12",2,0],
      ["Brands Hatch","Brands Hatch","Reino Unido","🇬🇧","2026-05-01","2026-05-03",1,1],
      ["Monza","Monza","Italia","🇮🇹","2026-05-29","2026-05-31",2,0],
      ["24 Horas de Spa","Spa-Francorchamps","Bélgica","🇧🇪","2026-06-24","2026-06-28",2,0],
      ["Misano","Misano","Italia","🇮🇹","2026-07-17","2026-07-19",2,1],
      ["Magny-Cours","Magny-Cours","Francia","🇫🇷","2026-07-31","2026-08-02",2,1],
      ["Nürburgring","Nürburgring","Alemania","🇩🇪","2026-08-28","2026-08-30",2,0],
      ["Valencia","Ricardo Tormo","España","🇪🇸","2026-09-18","2026-09-20",2,1],
      ["Zandvoort","Zandvoort","Países Bajos","🇳🇱","2026-09-25","2026-09-27",2,1],
      ["Barcelona","Circuit de Barcelona-Catalunya","España","🇪🇸","2026-10-09","2026-10-11",2,0]
    ]
  };

  // sesiones DEMO por serie: [día desde inicio, hora local, nombre]
  var SESS = {
    open: [[0,"12:30","FP1"],[0,"16:00","FP2"],[1,"12:30","FP3"],[1,"16:00","Qualifying"],[2,"15:00","Race"]],
    openSprint: [[0,"12:30","FP1"],[0,"16:30","Sprint Qualifying"],[1,"12:00","Sprint"],[1,"16:00","Qualifying"],[2,"15:00","Race"]],
    feeder: [[0,"10:05","Practice"],[0,"15:00","Qualifying"],[1,"13:15","Sprint Race"],[2,"10:00","Feature Race"]],
    fe: [[0,"10:30","FP1"],[0,"15:00","FP2"],[1,"10:30","Qualifying"],[1,"15:05","Race"]],
    bike: [[0,"10:45","FP1"],[0,"15:00","Practice"],[1,"10:10","FP2"],[1,"10:50","Qualifying"],[1,"15:00","Sprint"],[2,"10:40","Warm Up"],[2,"14:00","Race"]],
    indy: [[0,"13:00","Practice 1"],[1,"10:30","Practice 2"],[1,"14:30","Qualifying"],[1,"17:30","Final Practice"],[2,"12:30","Race"]],
    proto: [[0,"11:00","FP1"],[0,"16:00","FP2"],[1,"11:00","FP3"],[1,"15:00","Qualifying"],[1,"15:30","Hyperpole"],[2,"12:00","Race"]],
    imsa: [[0,"11:00","Practice 1"],[0,"15:30","Practice 2"],[1,"14:00","Qualifying"],[2,"09:00","Warm Up"],[2,"12:10","Race"]],
    gt: [[0,"11:00","Free Practice"],[0,"16:00","Pre-Qualifying"],[1,"10:00","Qualifying"],[2,"14:30","Race"]],
    gtSprint: [[0,"11:00","Free Practice"],[1,"10:00","Qualifying 1"],[1,"14:30","Race 1"],[2,"10:00","Qualifying 2"],[2,"14:30","Race 2"]]
  };
  function sessTemplate(sid, round) {
    var s = BY[sid];
    if (sid === "f1") return round.sprint ? SESS.openSprint : SESS.open;
    if (sid === "f2" || sid === "f3") return SESS.feeder;
    if (sid === "fe") return SESS.fe;
    if (sid === "motogp") return SESS.bike;
    if (sid === "indycar") return SESS.indy;
    if (sid === "wec") return SESS.proto;
    if (sid === "imsa") return SESS.imsa;
    if (sid === "gt3") return round.sprint ? SESS.gtSprint : SESS.gt;
    return SESS.open;
  }

  var TODAY = new Date();
  function dayUTC(iso) { return new Date(iso + "T00:00:00Z"); }
  function todayISO() { var t = TODAY; return new Date(t.getTime() - t.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }

  var CALS = {};
  SERIES.forEach(function (s) {
    CALS[s.id] = CAL[s.id].map(function (r, i) {
      return { series: s.id, round: i + 1, name: r[0], circuit: r[1], country: r[2], flag: r[3], start: r[4], date: r[5], tz: r[6], sprint: !!r[7], shift: r[8] || 0, real: s.id === "f1" };
    });
  });
  function status(r) {
    var t = todayISO();
    if (r.date < t) return "done";
    if (r.start <= t) return "live";
    return "next";
  }
  function nextRace(sid) {
    var t = todayISO();
    var list = CALS[sid];
    for (var i = 0; i < list.length; i++) if (list[i].date >= t) return list[i];
    return null;
  }
  function sessions(r) {
    return sessTemplate(r.series, r).map(function (x) {
      var hm = x[1].split(":");
      var local = parseInt(hm[0], 10) + r.shift;
      var start = dayUTC(r.start);
      // hora del circuito → UTC
      var ms = start.getTime() + x[0] * 86400000 + (local - r.tz) * 3600000 + parseInt(hm[1], 10) * 60000;
      return { name: x[2], utc: new Date(ms), trackHour: ((local % 24) + 24) % 24, trackMin: hm[1], day: x[0] };
    });
  }

  // ---------- equipos y pilotos ficticios (DEMO) ----------
  function rng(seed) { var a = 0; for (var i = 0; i < seed.length; i++) a = (a * 31 + seed.charCodeAt(i)) >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var TEAM_NAMES = ["Orbit","Halo Works","Quasar","Nebula","Vertex","Comet","Pulsar","Eclipse","Zenith","Lumen","Meridian","Solstice","Ion","Prism","Vortex","Aphelion","Parallax","Kepler","Equinox","Corona","Umbra","Strata"];
  var SUFFIX = { f1: "Racing", f2: "GP", f3: "Junior", fe: "E-Team", motogp: "Moto", indycar: "Motorsport", wec: "Endurance", imsa: "Prototypes", gt3: "GT" };
  var COLORS = ["#7C3AED","#E11D48","#F59E0B","#0EA5E9","#10B981","#F97316","#6366F1","#EC4899","#14B8A6","#EAB308","#64748B","#A855F7","#DC2626","#2563EB","#84CC16","#D946EF"];
  var FIRST = ["Leo","Mateo","Hugo","Noah","Elias","Luca","Theo","Kai","Iker","Adrian","Marco","Felix","Oscar","Bruno","Nico","Rafael","Tomas","Arvid","Yuki","Kenji","Dario","Emil","Jonas","Max","Liam","Ari","Sami","Rory","Enzo","Pablo","Ivo","Lars","Aleix","Joan","Milo","Ruben","Caio","Diego","Sven","Tiago","Matteo","Jules","Arlo","Henrik","Zane","Ilan","Otto","Viktor","Dani","Oriel"];
  var LAST = ["Ardent","Valez","Korhonen","Marlow","Okafor","Brandt","Sorel","Haldane","Ruiz","Castell","Vidal","Lindqvist","Moreau","Takeda","Rossetti","Novak","Hartley","Quinn","Duarte","Kessler","Arkwright","Belmonte","Sato","Varga","Nyström","Ferro","Calloway","Ibarra","Kowal","Renner","Vasquez","Halloran","Aoki","Delacroix","Strand","Marchetti","Oyelaran","Pires","Weller","Esteve","Brisco","Laurent","Mendel","Tavares","Kirov","Holm","Serrat","Oduya","Vance","Ricci"];
  var NATS = [["🇪🇸","España"],["🇬🇧","Reino Unido"],["🇳🇱","Países Bajos"],["🇫🇷","Francia"],["🇮🇹","Italia"],["🇩🇪","Alemania"],["🇧🇷","Brasil"],["🇦🇺","Australia"],["🇯🇵","Japón"],["🇺🇸","EE. UU."],["🇫🇮","Finlandia"],["🇲🇽","México"],["🇩🇰","Dinamarca"],["🇳🇿","Nueva Zelanda"],["🇨🇦","Canadá"],["🇦🇷","Argentina"],["🇵🇹","Portugal"],["🇸🇪","Suecia"]];
  var BASES = ["Silverstone, Reino Unido","Maranello, Italia","Milton Keynes, Reino Unido","Barcelona, España","Viry-Châtillon, Francia","Hinwil, Suiza","Colonia, Alemania","Faenza, Italia","Indianápolis, EE. UU.","Valencia, España","Brackley, Reino Unido","Bolonia, Italia"];


  // ---------- PARRILLAS REALES (F1 y MotoGP) ----------
  // Nombres, dorsales y colores de equipo reales. Puntos tal y como los publica la fuente; nada calculado a ojo.
  // [equipo, nombre corto, color, [[nombre, apellido, dorsal, bandera, país], ...]]
  var REAL = {
    f1: {
      asOf: "Tras la R16 · GP de Baréin (en Sepang), 4 oct 2026",
      src: "https://www.crash.net/f1/news/1106505/1/f1-championship-standings-after-bahrain-grand-prix-malaysia",
      srcName: "Crash.net",
      teams: [
        ["Mercedes-AMG Petronas F1 Team", "Mercedes", "#00A19C", [["George","Russell",63,"🇬🇧","Reino Unido"],["Kimi","Antonelli",12,"🇮🇹","Italia"]], "Brackley, Reino Unido", "Mercedes"],
        ["Scuderia Ferrari HP", "Ferrari", "#DC0000", [["Charles","Leclerc",16,"🇲🇨","Mónaco"],["Lewis","Hamilton",44,"🇬🇧","Reino Unido"]], "Maranello, Italia", "Ferrari"],
        ["McLaren Mastercard F1 Team", "McLaren", "#E87A00", [["Lando","Norris",1,"🇬🇧","Reino Unido"],["Oscar","Piastri",81,"🇦🇺","Australia"]], "Woking, Reino Unido", "Mercedes"],
        ["Oracle Red Bull Racing", "Red Bull Racing", "#2B4C8C", [["Max","Verstappen",3,"🇳🇱","Países Bajos"],["Isack","Hadjar",6,"🇫🇷","Francia"]], "Milton Keynes, Reino Unido", "Red Bull Ford"],
        ["Visa Cash App Racing Bulls", "Racing Bulls", "#2F49C9", [["Liam","Lawson",30,"🇳🇿","Nueva Zelanda"],["Arvid","Lindblad",41,"🇬🇧","Reino Unido"]], "Faenza, Italia", "Red Bull Ford"],
        ["BWT Alpine F1 Team", "Alpine", "#0A6FB3", [["Pierre","Gasly",10,"🇫🇷","Francia"],["Franco","Colapinto",43,"🇦🇷","Argentina"]], "Enstone, Reino Unido", "Mercedes"],
        ["TGR Haas F1 Team", "Haas", "#6B6E73", [["Esteban","Ocon",31,"🇫🇷","Francia"],["Oliver","Bearman",87,"🇬🇧","Reino Unido"]], "Kannapolis, EE. UU.", "Ferrari"],
        ["Audi Revolut F1 Team", "Audi", "#9E1B32", [["Nico","Hulkenberg",27,"🇩🇪","Alemania"],["Gabriel","Bortoleto",5,"🇧🇷","Brasil"]], "Hinwil, Suiza", "Audi"],
        ["Atlassian Williams F1 Team", "Williams", "#1A5DC8", [["Alex","Albon",23,"🇹🇭","Tailandia"],["Carlos","Sainz",55,"🇪🇸","España"]], "Grove, Reino Unido", "Mercedes"],
        ["Aston Martin Aramco F1 Team", "Aston Martin", "#1F7A5C", [["Fernando","Alonso",14,"🇪🇸","España"],["Lance","Stroll",18,"🇨🇦","Canadá"]], "Silverstone, Reino Unido", "Honda"],
        ["Cadillac F1 Team", "Cadillac", "#4A4D55", [["Sergio","Perez",11,"🇲🇽","México"],["Valtteri","Bottas",77,"🇫🇮","Finlandia"]], "Fishers, EE. UU.", "Ferrari"]
      ],
      drivers: [["Andrea Kimi Antonelli",320],["George Russell",236],["Lewis Hamilton",214],["Charles Leclerc",191],["Lando Norris",188],["Max Verstappen",188],["Oscar Piastri",128],["Isack Hadjar",96],["Liam Lawson",65],["Pierre Gasly",41],["Arvid Lindblad",38],["Franco Colapinto",27],["Oliver Bearman",20],["Gabriel Bortoleto",10],["Nico Hulkenberg",7],["Esteban Ocon",7],["Fernando Alonso",7],["Carlos Sainz",7],["Alex Albon",5],["Yuki Tsunoda",1],["Lance Stroll",0],["Valtteri Bottas",0]],
      teamPts: [["Mercedes",556],["Ferrari",405],["McLaren",316],["Red Bull Racing",298],["Racing Bulls",90],["Alpine",68],["Haas",27],["Audi",17],["Williams",12],["Aston Martin",7],["Cadillac",0]],
      last: { name: "GP de Baréin (en Sepang)", src: "https://www.crash.net/f1/results/1106501/1/f1-bahrain-grand-prix-malaysia-full-race-results",
        order: ["Verstappen","Antonelli","Hamilton","Leclerc","Hadjar","Piastri","Lawson","Alonso","Norris","Lindblad","Hulkenberg","Stroll","Colapinto","Bearman","Ocon","Gasly","Sainz","Bortoleto","Perez"], dnf: ["Russell","Albon","Bottas"] }
    },
    motogp: {
      asOf: "Tras la R15 · GP de Austria, 20 sep 2026 (Motegi aún sin tabla publicada)",
      src: "https://www.crash.net/motogp/results/1104906/1/austria-new-2026-motogp-world-championship-standings",
      srcName: "Crash.net",
      teams: [
        ["Aprilia Racing", "Aprilia Racing", "#8C1D2E", [["Jorge","Martin",89,"🇪🇸","España"],["Marco","Bezzecchi",72,"🇮🇹","Italia"]], "Noale, Italia", "Aprilia RS-GP26"],
        ["Ducati Lenovo Team", "Ducati Lenovo", "#C8102E", [["Marc","Marquez",93,"🇪🇸","España"],["Francesco","Bagnaia",63,"🇮🇹","Italia"]], "Bolonia, Italia", "Ducati GP26"],
        ["Red Bull KTM Factory Racing", "Red Bull KTM", "#E35205", [["Pedro","Acosta",37,"🇪🇸","España"],["Brad","Binder",33,"🇿🇦","Sudáfrica"]], "Mattighofen, Austria", "KTM RC16"],
        ["Pertamina Enduro VR46", "VR46 Ducati", "#B39B00", [["Fabio","di Giannantonio",49,"🇮🇹","Italia"],["Franco","Morbidelli",21,"🇮🇹","Italia"]], "Tavullia, Italia", "Ducati"],
        ["Trackhouse MotoGP Team", "Trackhouse", "#123B8A", [["Ai","Ogura",79,"🇯🇵","Japón"],["Raul","Fernandez",25,"🇪🇸","España"]], "Concord, EE. UU.", "Aprilia RS-GP26"],
        ["BK8 Gresini Racing", "Gresini Ducati", "#3D8FC0", [["Alex","Marquez",73,"🇪🇸","España"],["Fermin","Aldeguer",54,"🇪🇸","España"]], "Faenza, Italia", "Ducati"],
        ["Honda HRC Castrol", "Honda HRC", "#B3202A", [["Luca","Marini",10,"🇮🇹","Italia"],["Joan","Mir",36,"🇪🇸","España"]], "Tokio, Japón", "Honda RC213V"],
        ["Red Bull KTM Tech3", "KTM Tech3", "#1F2D52", [["Enea","Bastianini",23,"🇮🇹","Italia"],["Maverick","Viñales",12,"🇪🇸","España"]], "Bormes-les-Mimosas, Francia", "KTM RC16"],
        ["LCR Honda", "LCR Honda", "#5E6168", [["Diogo","Moreira",0,"🇧🇷","Brasil"],["Johann","Zarco",5,"🇫🇷","Francia"]], "Mónaco", "Honda RC213V"],
        ["Monster Energy Yamaha", "Yamaha", "#0B2E8F", [["Fabio","Quartararo",20,"🇫🇷","Francia"],["Alex","Rins",42,"🇪🇸","España"]], "Iwata, Japón", "Yamaha YZR-M1"],
        ["Prima Pramac Yamaha", "Pramac Yamaha", "#6B2F8A", [["Jack","Miller",43,"🇦🇺","Australia"],["Toprak","Razgatlioglu",0,"🇹🇷","Turquía"]], "Pramac, Italia", "Yamaha YZR-M1"]
      ],
      drivers: [["Jorge Martin",306],["Marc Marquez",294],["Marco Bezzecchi",264],["Pedro Acosta",234],["Fabio di Giannantonio",230],["Ai Ogura",222],["Raul Fernandez",203],["Alex Marquez",158],["Francesco Bagnaia",156],["Fermin Aldeguer",115],["Luca Marini",98],["Enea Bastianini",97],["Brad Binder",94],["Diogo Moreira",65],["Fabio Quartararo",61],["Franco Morbidelli",56],["Johann Zarco",45],["Joan Mir",33],["Jack Miller",28],["Alex Rins",24],["Toprak Razgatlioglu",18],["Maverick Viñales",10],["Iker Lecuona",9],["Augusto Fernandez",6],["Pol Espargaro",5],["Takaaki Nakagami",3]],
      teamPts: null,
      last: null
    }
  };
  function norm(x) { return x.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function realGrid(sid) {
    var R = REAL[sid], s = BY[sid];
    var teams = [], drivers = [];
    R.teams.forEach(function (t, i) {
      var team = { id: "t" + (i + 1), name: t[1], full: t[0], color: t[2], base: t[4], engine: t[5], cars: [], drivers: [], real: true };
      t[3].forEach(function (d, j) {
        var name = d[0] + " " + d[1];
        var drv = { id: "d" + (drivers.length + 1), first: d[0], last: d[1], name: name, number: d[2] || null, flag: d[3], nation: d[4], team: team, real: true, pts: 0, pos: null };
        team.drivers.push(drv); drivers.push(drv);
      });
      teams.push(team);
    });
    var find = function (full) { var f = norm(full); return drivers.filter(function (d) { return f === norm(d.name) || f.indexOf(norm(d.last)) >= 0 && f.indexOf(norm(d.first)) >= 0 || (norm(d.name).indexOf("kimi") >= 0 && f.indexOf("antonelli") >= 0); })[0]; };
    var dStand = R.drivers.map(function (row, i) {
      var d = find(row[0]);
      if (d) { d.pts = row[1]; d.pos = i + 1; return d; }
      return { name: row[0], pts: row[1], pos: i + 1, team: null, flag: "", ghost: true };
    });
    // líder → huecos
    var lead = dStand[0].pts;
    dStand.forEach(function (d) { d.gap = lead - d.pts; });
    teams.forEach(function (t) { t.pts = t.drivers.reduce(function (a, d) { return a + (d.pts || 0); }, 0); });
    var tStand;
    if (R.teamPts) {
      tStand = R.teamPts.map(function (row, i) { var t = teams.filter(function (x) { return x.name === row[0]; })[0]; t.pts = row[1]; t.pos = i + 1; t.calc = false; return t; });
    } else {
      tStand = teams.slice().sort(function (a, b) { return b.pts - a.pts; });
      tStand.forEach(function (t, i) { t.pos = i + 1; t.calc = true; });
    }
    if (R.last) {
      R.last.order.forEach(function (ln, i) { var d = drivers.filter(function (x) { return norm(x.last) === norm(ln); })[0]; if (d) d.lastPos = i + 1; });
      R.last.dnf.forEach(function (ln) { var d = drivers.filter(function (x) { return norm(x.last) === norm(ln); })[0]; if (d) d.lastPos = "DNF"; });
    }
    var done = CALS[sid].filter(function (r) { return status(r) === "done"; });
    return { real: true, teams: teams, drivers: drivers, dStand: dStand, tStand: tStand, done: done, asOf: R.asOf, src: R.src, srcName: R.srcName, last: R.last };
  }

  var GRID = {};
  function buildGrid(sid) {
    if (GRID[sid]) return GRID[sid];
    if (REAL[sid]) return (GRID[sid] = realGrid(sid));
    var s = BY[sid], R = rng("pursec-" + sid), used = {};
    var teams = [], drivers = [], num = 1;
    var offset = Math.floor(R() * TEAM_NAMES.length);
    for (var t = 0; t < s.teams; t++) {
      var tn = TEAM_NAMES[(offset + t * 3) % TEAM_NAMES.length] + " " + SUFFIX[sid];
      var team = { id: "t" + (t + 1), name: tn, full: tn, color: COLORS[(t * 5 + offset) % COLORS.length], strength: 1 - t / (s.teams + 2) + R() * 0.18,
        base: BASES[Math.floor(R() * BASES.length)], principal: FIRST[Math.floor(R() * FIRST.length)] + " " + LAST[Math.floor(R() * LAST.length)],
        debut: 1990 + Math.floor(R() * 34), titles: R() > 0.7 ? Math.floor(R() * 6) + 1 : 0, cars: [] };
      for (var c = 0; c < s.carsPerTeam; c++) {
        var car = { id: team.id + "c" + c, number: num++, team: team, drivers: [] };
        for (var d = 0; d < s.driversPerCar; d++) {
          var name;
          do { name = FIRST[Math.floor(R() * FIRST.length)] + " " + LAST[Math.floor(R() * LAST.length)]; } while (used[name]);
          used[name] = 1;
          var nat = NATS[Math.floor(R() * NATS.length)];
          var age = 18 + Math.floor(R() * (sid === "f3" ? 4 : sid === "f2" ? 6 : 18));
          var drv = { id: "d" + (drivers.length + 1), first: name.split(" ")[0], last: name.split(" ").slice(1).join(" "), name: name, flag: nat[0], nation: nat[1], age: age, number: car.number, team: team, car: car,
            seasons: Math.max(1, Math.floor((age - 17) * R() * 0.8)), skill: R() * 0.25,
            careerWins: 0, careerPodiums: 0, careerPoles: 0, titles: R() > 0.93 ? 1 + Math.floor(R() * 2) : 0 };
          drv.careerWins = Math.floor(R() * drv.seasons * 2.2 * team.strength);
          drv.careerPodiums = drv.careerWins + Math.floor(R() * drv.seasons * 3);
          drv.careerPoles = Math.floor(drv.careerWins * (0.5 + R()));
          car.drivers.push(drv); drivers.push(drv);
        }
        team.cars.push(car);
      }
      teams.push(team);
    }
    // resultados de las rondas ya disputadas
    var cars = [].concat.apply([], teams.map(function (t) { return t.cars; }));
    var done = CALS[sid].filter(function (r) { return status(r) === "done"; });
    cars.forEach(function (c) { c.pts = 0; c.byRound = []; c.wins = 0; c.podiums = 0; c.poles = 0; c.best = 99; c.dnf = 0; });
    done.forEach(function (r, ri) {
      var order = cars.map(function (c) {
        var sk = c.drivers.reduce(function (a, d) { return a + d.skill; }, 0) / c.drivers.length;
        return { c: c, v: c.team.strength + sk + R() * 0.55, dnf: R() < 0.05 };
      }).sort(function (a, b) { return (a.dnf - b.dnf) || (b.v - a.v); });
      order.sort(function (a, b) { return (a.dnf - b.dnf) || (b.v - a.v); });
      order[0].c.poles += R() > 0.4 ? 1 : 0;
      order.forEach(function (o, pos) {
        var p = o.dnf ? 0 : (s.points[pos] || 0);
        if (r.sprint && s.sprint && sid !== "gt3") p += o.dnf ? 0 : Math.round((s.points[pos] || 0) * 0.35);
        o.c.pts += p; o.c.byRound.push(p);
        if (o.dnf) o.c.dnf++; else { if (pos === 0) o.c.wins++; if (pos < 3) o.c.podiums++; o.c.best = Math.min(o.c.best, pos + 1); }
      });
    });
    drivers.forEach(function (d) { var c = d.car; d.pts = c.pts; d.byRound = c.byRound; d.wins = c.wins; d.podiums = c.podiums; d.poles = c.poles; d.best = c.best; d.dnf = c.dnf; });
    teams.forEach(function (t) {
      t.pts = 0; t.wins = 0; t.podiums = 0; t.byRound = done.map(function () { return 0; });
      t.cars.forEach(function (c) { t.pts += c.pts; t.wins += c.wins; t.podiums += c.podiums; c.byRound.forEach(function (p, i) { t.byRound[i] += p; }); });
    });
    var dStand = drivers.slice().sort(function (a, b) { return b.pts - a.pts || b.wins - a.wins; });
    dStand.forEach(function (d, i) { d.pos = i + 1; });
    var tStand = teams.slice().sort(function (a, b) { return b.pts - a.pts || b.wins - a.wins; });
    tStand.forEach(function (t, i) { t.pos = i + 1; });
    teams.forEach(function (t) { t.drivers = [].concat.apply([], t.cars.map(function (c) { return c.drivers; })); });
    var lead0 = dStand[0].pts; dStand.forEach(function (d) { d.gap = lead0 - d.pts; });
    GRID[sid] = { real: false, teams: teams, drivers: drivers, dStand: dStand, tStand: tStand, done: done };
    return GRID[sid];
  }

  // ---------- noticias y vídeos (DEMO) ----------
  var NEWS = [
    { s: "f1", k: "Analysis", t: "Marina Bay: por qué el Undercut vale más que nunca en Singapur", d: "Muros a centímetros, Safety Car casi seguro y una salida de boxes larga. Lo que dice el modelo antes del fin de semana." },
    { s: "f1", k: "Debrief", t: "Sepang, vuelta a vuelta: la degradación que nadie esperaba", d: "El asfalto nuevo cambió el plan de casi toda la parrilla en el segundo stint." },
    { s: "motogp", k: "Preview", t: "Mandalika: neumático delantero y calor extremo", d: "La presión mínima vuelve a ser la clave del fin de semana en Indonesia." },
    { s: "imsa", k: "Preview", t: "Petit Le Mans: 10 horas y un título en juego", d: "Las cautions de Road Atlanta deciden campeonatos. Así se prepara la estrategia." },
    { s: "f1", k: "Tech", t: "Active aero en curva lenta: qué ganan los coches de 2026", d: "Cómo cambia el reparto de carga cuando el ala trabaja en cada sector." },
    { s: "wec", k: "Analysis", t: "Baréin decide el Mundial de Resistencia: los números de cada Hypercar", d: "El BoP final y el desgaste nocturno, a examen." },
    { s: "gt3", k: "Preview", t: "Barcelona cierra la temporada de GT3", d: "Ventanas de parada, Pro-Am y un título con cuatro aspirantes." },
    { s: "fe", k: "Season review", t: "Temporada 2025-26 de Formula E: lo que nos enseñó la energía", d: "Los E-Prix que se ganaron levantando el pie a tiempo." },
    { s: "indycar", k: "Season review", t: "IndyCar 2026: el año de la estrategia de combustible", d: "Cuántas carreras se decidieron con una parada menos." },
    { s: "f2", k: "Analysis", t: "Feature Race de Bakú: la parada obligatoria que lo cambió todo", d: "El momento exacto en que el Undercut dejó de funcionar." },
    { s: "f3", k: "Season review", t: "F3 2026: treinta pilotos y un campeón en Madring", d: "Lo que separó al campeón del resto, en cinco gráficos." },
    { s: "motogp", k: "Debrief", t: "Motegi: la Sprint que adelantó el domingo", d: "Quién eligió bien el neumático trasero y quién lo pagó." }
  ];
  var VIDEOS = [
    { s: "f1", t: "El Undercut en 62 segundos", d: "0:62", n: "reel" }, { s: "f1", t: "Qué es la active aero", d: "0:58", n: "tiktok" },
    { s: "motogp", t: "La presión mínima del neumático, explicada", d: "0:61", n: "reel" }, { s: "wec", t: "Cómo se adelanta a un GT3 sin perder tiempo", d: "0:60", n: "tiktok" },
    { s: "f1", t: "Singapur: la vuelta en 3 sectores", d: "0:62", n: "short" }, { s: "imsa", t: "Wave-by: recuperar la vuelta", d: "0:55", n: "reel" },
    { s: "fe", t: "Attack Mode en 1 minuto", d: "0:59", n: "tiktok" }, { s: "gt3", t: "Qué es el BoP", d: "0:62", n: "short" }
  ];

  window.PS = {
    SERIES: SERIES, BY: BY, CALS: CALS, NEWS: NEWS, VIDEOS: VIDEOS,
    nextRace: nextRace, sessions: sessions, status: status, grid: buildGrid, todayISO: todayISO, rng: rng,
    SOURCE_F1: "https://www.formula1.com/en/racing/2026"
  };
})();
