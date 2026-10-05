// Generado desde el Catálogo PURSEC (artefacto). Qué incluye cada pieza y tool en cada plan.
window.PURSEC_ITEMS = [
 {
  "id": "weekend-brief",
  "group": "race-weekend",
  "name": "Weekend Brief",
  "when": "Jueves antes de la carrera (Trackside: actualización tras los libres)",
  "note": "El diseño sigue el de la web, muy visual y eficiente: cada sección se entiende de un vistazo en el móvil. Sus cifras (pit loss, deg, estrategia) son las que usa la Race Card del sábado.",
  "paddock": [
   [
    "open",
    "Horario del fin de semana en la hora del usuario: cada sesión (libres, clasificación, sprint y carrera según categoría) con cuenta atrás a la siguiente"
   ],
   [
    "open",
    "Mapa 2D del circuito con el número y el nombre de cada curva (si lo tiene), las zonas de adelantamiento más habituales y las zonas de detección según categoría (DRS, overtake mode, push-to-pass…). Cartel con las vueltas o la duración de cada carrera del fin de semana (carrera principal, sprint u otros formatos)"
   ],
   [
    "locked",
    "Récord de vuelta en clasificación y en carrera: piloto, equipo y año. Últimos 5 poleman y últimos 5 ganadores"
   ],
   [
    "open",
    "Probabilidad de Safety Car, visual, con datos de años anteriores (SC/VSC en F1, F2, F3; caution en IndyCar; FCY y slow zones en resistencia; bandera roja en motos)"
   ],
   [
    "partial",
    "Neumáticos nominados de la carrera (compuestos en F1, F2, F3; delantero y trasero en motos; primary y alternate en IndyCar; asignación por coche en resistencia y GT3). Estrategia más probable en una línea"
   ],
   [
    "locked",
    "Pit loss del circuito, eligiendo Green Flag, VSC o SC"
   ],
   [
    "locked",
    "Clima interactivo de los tres días, hora a hora, con las horas de sesión destacadas"
   ],
   [
    "partial",
    "Las 3 claves del fin de semana con criterio PURSEC: lo que ningún dato te da"
   ],
   [
    "open",
    "5 datos clave de la carrera, muy visuales, cada uno enlazado a su noticia en la web (pilotos, equipos, mejoras, tipo de circuito…)"
   ],
   [
    "locked",
    "Actualización tras los libres: deg real y estrategia corregida, marcando qué ha cambiado respecto al jueves"
   ],
   [
    "open",
    "Supuestos y fuentes (visual también)"
   ]
  ],
  "trackside": [
   "Horario del fin de semana en la hora del usuario: cada sesión (libres, clasificación, sprint y carrera según categoría) con cuenta atrás a la siguiente",
   "Mapa 3D del circuito con el número y el nombre de cada curva (si lo tiene), las zonas de adelantamiento más habituales y las zonas de detección según categoría (DRS, overtake mode, push-to-pass…). Cartel con las vueltas o la duración de cada carrera del fin de semana (carrera principal, sprint u otros formatos)",
   "Récord de vuelta en clasificación y en carrera (piloto, equipo y año), y los últimos 5 poleman y los últimos 5 ganadores",
   "Probabilidad de Safety Car, visual, con datos de años anteriores (SC/VSC en F1, F2, F3; caution en IndyCar; FCY y slow zones en resistencia; bandera roja en motos)",
   "Neumáticos nominados y estrategia prevista: plan A y alternativas a 1, 2 y 3 paradas con la diferencia en segundos, comparadas con lo que funcionó en años anteriores. Motos: qué combinación aguanta la carrera. IndyCar: ventanas de combustible. Resistencia: stints y cambios de piloto",
   "Pit loss del circuito, eligiendo Green Flag, VSC o SC: es la cifra de la que salen los umbrales de la Race Card",
   "Clima interactivo de los tres días, hora a hora, con las horas de sesión destacadas y la probabilidad de lluvia en la carrera",
   "Las 3 claves del fin de semana con criterio PURSEC: lo que ningún dato te da",
   "5 datos clave de la carrera, muy visuales, cada uno enlazado a su noticia en la web (pilotos, equipos, mejoras, tipo de circuito…)",
   "Actualización tras los libres: deg real de cada compuesto y estrategia corregida, marcando qué ha cambiado respecto al jueves. Aviso en Discord cuando sale",
   "Supuestos y fuentes (visual también)"
  ]
 },
 {
  "id": "race-card",
  "group": "race-weekend",
  "name": "Race Card",
  "when": "Tras la clasificación, antes de la carrera principal",
  "note": "Mismo criterio que el Weekend Brief, enfocado al día de carrera. Una pantalla de móvil para tenerla abierta junto a la tele: umbrales precalculados, nunca datos en directo. Muy visual y acorde al diseño de la web.",
  "paddock": [
   [
    "open",
    "Cartel de carrera: vueltas o duración, hora de salida (local y la del usuario) y formato según categoría: paradas o compuestos obligatorios (F1, F2, F3), flag-to-flag (MotoGP, Moto2, Moto3), ventanas de combustible (IndyCar), duración en horas y cambios de piloto (WEC, IMSA, Le Mans), ventana de parada obligatoria (GT3)"
   ],
   [
    "locked",
    "Parrilla de salida visual con penalizaciones aplicadas. Neumático de salida de cada coche (o delantero y trasero en motos; clase en resistencia)"
   ],
   [
    "open",
    "Mapa 2D compacto del circuito con las zonas de adelantamiento y de detección (DRS, push-to-pass, attack…) según categoría"
   ],
   [
    "partial",
    "Plan óptimo y pit window principal. Alternativas, plan B y cruce entre compuestos. Motos: qué neumático aguanta toda la carrera. Resistencia: stints y cambios de piloto"
   ],
   [
    "open",
    "Probabilidad de Safety Car en la carrera, visual, con datos de años anteriores (SC/VSC en F1, F2, F3; caution en IndyCar; FCY y slow zones en resistencia; bandera roja y restart en motos)"
   ],
   [
    "locked",
    "Umbral de Safety Car: desde qué vuelta compensa parar bajo SC/VSC y cuánto se gana"
   ],
   [
    "locked",
    "Umbrales «Disparador → Lectura → Jugada» (4–6) para tener a mano viendo la carrera: 1 visible, el resto"
   ],
   [
    "partial",
    "Key battles: los 2–3 duelos que deciden la carrera"
   ],
   [
    "locked",
    "Ritmo de tanda larga de los libres por equipo y deg estimada"
   ],
   [
    "locked",
    "Clima a la hora de la carrera, simple. Gráfico hora a hora y plan wet race con el crossover entre slick y lluvia"
   ],
   [
    "open",
    "Campeonato en juego: quién puede ganar el título o el liderato este domingo y qué necesita"
   ],
   [
    "open",
    "Supuestos y fuentes (visual también)"
   ]
  ],
  "trackside": [
   "Cartel de carrera: vueltas o duración, hora de salida (local y la del usuario) y formato según categoría: paradas o compuestos obligatorios (F1, F2, F3), flag-to-flag (MotoGP, Moto2, Moto3), ventanas de combustible (IndyCar), duración en horas y cambios de piloto (WEC, IMSA, Le Mans), ventana de parada obligatoria (GT3)",
   "Parrilla de salida visual con penalizaciones aplicadas y el neumático de salida de cada coche (o delantero y trasero en motos; clase en resistencia)",
   "Mapa 3D compacto del circuito con las zonas de adelantamiento y de detección (DRS, push-to-pass, attack…) según categoría",
   "Estrategia: plan A y plan B, pit window de cada parada y vuelta de cruce entre compuestos. Motos: elección de neumático para toda la carrera. IndyCar: ventanas de combustible y caution. Resistencia: stints, cambios de piloto y pit windows por clase",
   "Probabilidad de Safety Car en la carrera, visual, con datos de años anteriores (SC/VSC en F1, F2, F3; caution en IndyCar; FCY y slow zones en resistencia; bandera roja y restart en motos)",
   "Umbral de Safety Car: desde qué vuelta compensa parar bajo SC/VSC y cuánto se gana, con el pit loss de cada caso",
   "Umbrales «Disparador → Lectura → Jugada» (4–6) para tener a mano viendo la carrera. Ejemplo: SC entre las vueltas A y B → parada «gratis» → gana quien no ha parado",
   "Key battles: los 2–3 duelos que deciden la carrera y el gap máximo para el undercut a 1, 2 y 3 vueltas (en motos, diferencia de ritmo y punta; en resistencia, por clase)",
   "Ritmo de tanda larga de los libres por equipo y deg estimada de cada compuesto",
   "Clima hora a hora durante la carrera y plan wet race con el crossover entre slick y lluvia",
   "Campeonato en juego: quién puede ganar el título o el liderato este domingo y qué necesita",
   "Supuestos y fuentes (visual también)"
  ]
 },
 {
  "id": "sprint-card",
  "group": "race-weekend",
  "name": "Sprint Card",
  "when": "Tras la clasificación del sprint, antes del sprint",
  "note": "Tarjeta corta para fines de semana con carrera corta. El nombre cambia con la categoría: F1 Sprint Card, Sprint Race Card (F2 y F3), MotoGP Sprint Card y GT3 Sprint Card. Mismo criterio que la Race Card: lo más atractivo gratis, el detalle que decide la jugada en Trackside.",
  "paddock": [
   [
    "open",
    "Solo en las series con carrera corta: F1 Sprint, Sprint Race de F2 y F3, Sprint de MotoGP y carreras sprint de GT3. Moto2, Moto3, IndyCar y resistencia no tienen sprint"
   ],
   [
    "open",
    "Cartel del sprint: vueltas o duración, hora de salida (local y la del usuario) y formato de la serie: sin parada obligatoria (F1, F2, F3, MotoGP), parrilla invertida (F2, F3), parada con cambio de piloto (GT3)"
   ],
   [
    "locked",
    "Parrilla del sprint, visual. Neumático de salida de cada coche (o delantero y trasero en MotoGP)"
   ],
   [
    "partial",
    "Qué neumático aguanta el sprint entero sin caer de rendimiento"
   ],
   [
    "locked",
    "Salida y vuelta 1: posiciones que se ganan o se pierden de media y dónde se adelanta en la primera vuelta"
   ],
   [
    "open",
    "Probabilidad de Safety Car o bandera roja en el sprint, visual, con datos de años anteriores"
   ],
   [
    "locked",
    "Umbrales «Disparador → Lectura → Jugada» (2–3): 1 visible, el resto"
   ],
   [
    "partial",
    "Key battles: 2 duelos que deciden el sprint"
   ],
   [
    "open",
    "Puntos en juego y efecto en el campeonato antes de la carrera principal"
   ],
   [
    "open",
    "Supuestos y fuentes (visual también)"
   ]
  ],
  "trackside": [
   "Solo en las series con carrera corta: F1 Sprint, Sprint Race de F2 y F3, Sprint de MotoGP y carreras sprint de GT3. Moto2, Moto3, IndyCar y resistencia no tienen sprint",
   "Cartel del sprint: vueltas o duración, hora de salida (local y la del usuario) y formato de la serie: sin parada obligatoria (F1, F2, F3, MotoGP), parrilla invertida (F2, F3), parada con cambio de piloto (GT3)",
   "Parrilla del sprint, visual, con el neumático de salida de cada coche (o delantero y trasero en MotoGP)",
   "Qué neumático aguanta el sprint entero sin caer de rendimiento y deg estimada en tanda corta",
   "Salida y vuelta 1: posiciones que se ganan o se pierden de media y dónde se adelanta en la primera vuelta",
   "Probabilidad de Safety Car o bandera roja en el sprint, visual, con datos de años anteriores. Umbral: un SC en las últimas vueltas puede acabar el sprint detrás del coche de seguridad",
   "Umbrales «Disparador → Lectura → Jugada» (2–3) pensados para pocas vueltas: sin paradas, todo se decide en pista",
   "Key battles: 2 duelos que deciden el sprint, con la diferencia de ritmo y de punta",
   "Puntos en juego y efecto en el campeonato antes de la carrera principal (puntos de sprint de F1 y MotoGP verificados; F2, F3 y GT3 [PENDIENTE])",
   "Qué cambia para la carrera principal: neumáticos que quedan y parrilla del domingo (F2 y F3)",
   "Supuestos y fuentes (visual también)"
  ]
 },
 {
  "id": "debrief",
  "group": "race-weekend",
  "name": "Debrief",
  "when": "Lunes tras la carrera",
  "note": "Cierra el ciclo del fin de semana: compara lo que dijeron el Weekend Brief, la Race Card y la Sprint Card con lo que pasó. Muy visual y acorde al diseño de la web; sus infografías son las que salen en redes.",
  "paddock": [
   [
    "open",
    "Cartel del resultado: podio y top 10, de qué posición salió cada uno y cuántas ganó o perdió, vuelta rápida (piloto, equipo y tiempo). En resistencia, por clase"
   ],
   [
    "partial",
    "¿Acertamos?: veredicto en una línea y marcador de aciertos de la temporada. La tabla de cada predicción del Weekend Brief y la Race Card frente a lo que pasó"
   ],
   [
    "open",
    "La carrera en estrategias: mapa visual de los stints de cada piloto por compuesto (motos: neumático delantero y trasero elegido; resistencia: stints y cambios de piloto por clase)"
   ],
   [
    "partial",
    "Posiciones vuelta a vuelta: el gráfico del top 10, estático. Interactivo y con toda la parrilla"
   ],
   [
    "partial",
    "Momentos clave en una línea de tiempo: paradas decisivas, Safety Car (caution, FCY o bandera roja según categoría), adelantamientos y penalizaciones. Se ven los titulares; el análisis de cada momento"
   ],
   [
    "locked",
    "Ritmo limpio por stint y deg real frente a la estimada en el Weekend Brief"
   ],
   [
    "locked",
    "Umbrales de la Race Card: cuáles se dispararon y si la jugada prevista era la buena"
   ],
   [
    "locked",
    "Pit stops: tiempo de parada por equipo, la mejor del día y pit loss real frente al previsto. En motos, long lap y cambios de moto en flag-to-flag; en IndyCar, ventanas de combustible"
   ],
   [
    "locked",
    "«¿Y si…?»: 1–2 escenarios de Sector 4 con botón para rehacerlos en el simulador"
   ],
   [
    "open",
    "Campeonato después de la carrera: clasificación, qué ha cambiado y qué necesita cada uno, con enlace a Title Fight"
   ],
   [
    "partial",
    "Solo fines de semana con carrera corta: el resultado del sprint de la categoría. Si la Sprint Card acertó"
   ],
   [
    "open",
    "5 datos clave de la carrera, muy visuales, cada uno enlazado a su noticia en la web"
   ],
   [
    "partial",
    "Qué nos llevamos para la próxima carrera: 3 lecciones con criterio PURSEC. Se ve la primera; las otras dos"
   ],
   [
    "open",
    "Supuestos y fuentes (visual también)"
   ]
  ],
  "trackside": [
   "Cartel del resultado: podio y top 10, de qué posición salió cada uno y cuántas ganó o perdió, vuelta rápida (piloto, equipo y tiempo). En resistencia, por clase",
   "¿Acertamos?: tabla de cada predicción del Weekend Brief y la Race Card frente a lo que pasó, con acierto o fallo y el porqué. Marcador de aciertos de la temporada. Se enseñan también los fallos",
   "La carrera en estrategias: mapa visual de los stints de cada piloto por compuesto (motos: neumático delantero y trasero elegido; resistencia: stints y cambios de piloto por clase)",
   "Posiciones vuelta a vuelta: gráfico interactivo de toda la parrilla",
   "Momentos clave en una línea de tiempo: paradas decisivas, Safety Car (caution, FCY o bandera roja según categoría), adelantamientos y penalizaciones, con el análisis de cada uno",
   "Ritmo limpio por stint y deg real frente a la estimada en el Weekend Brief: quién gestionó mejor el neumático",
   "Umbrales de la Race Card: cuáles se dispararon y si la jugada prevista era la buena",
   "Pit stops: tiempo de parada por equipo, la mejor del día y pit loss real frente al previsto. En motos, long lap y cambios de moto en flag-to-flag; en IndyCar, ventanas de combustible",
   "«¿Y si…?»: 1–2 escenarios de Sector 4 con botón para rehacerlos en el simulador",
   "Campeonato después de la carrera: clasificación, qué ha cambiado y qué necesita cada uno, con enlace a Title Fight",
   "Solo fines de semana con carrera corta: el resultado del sprint de la categoría y si la Sprint Card acertó",
   "5 datos clave de la carrera, muy visuales, cada uno enlazado a su noticia en la web",
   "Qué nos llevamos para la próxima carrera: 3 lecciones con criterio PURSEC, que alimentan el siguiente Weekend Brief",
   "Supuestos y fuentes (visual también)"
  ]
 },
 {
  "id": "rewind",
  "group": "sector-4",
  "name": "Rewind",
  "when": "Sector 4",
  "note": "La tool central de Sector 4. Absorbe el antiguo Stint Planner y el modo «¿y si…?» del Laboratorio. Adelantamientos con el umbral de cada circuito.",
  "paddock": [
   [
    "open",
    "Una pantalla: arriba, las barras de stints de cada piloto por compuesto; en el centro, el gráfico de gaps vuelta a vuelta; a la derecha, la clasificación final"
   ],
   [
    "open",
    "Replay de la última carrera con un slider de vueltas: posiciones, gaps, paradas y Safety Car en cada vuelta"
   ],
   [
    "partial",
    "¿Y si…?: arrastrar una parada a otra vuelta, cambiar el compuesto o mover el Safety Car, y ver el nuevo resultado"
   ],
   [
    "locked",
    "Resultado real frente a simulado: línea discontinua para lo que pasó y continua para tu escenario, y posiciones ganadas o perdidas con ▲▼"
   ],
   [
    "locked",
    "Estrategia óptima a toro pasado: la mejor estrategia posible para cada piloto con la deg real de esa carrera"
   ],
   [
    "open",
    "Según categoría: paradas y compuestos (F1, F2, F3), elección de neumático sin paradas (motos), combustible y caution (IndyCar), stints y cambios de piloto por clase (resistencia, GT3)"
   ],
   [
    "open",
    "Supuestos y fuentes"
   ]
  ],
  "trackside": [
   "Una pantalla: arriba, las barras de stints de cada piloto por compuesto; en el centro, el gráfico de gaps vuelta a vuelta; a la derecha, la clasificación final",
   "Replay de cualquier carrera del archivo con un slider de vueltas: posiciones, gaps, paradas y Safety Car en cada vuelta",
   "¿Y si…?: arrastrar una parada a otra vuelta, cambiar el compuesto o mover el Safety Car, y ver el nuevo resultado al momento",
   "Resultado real frente a simulado: línea discontinua para lo que pasó y continua para tu escenario, y posiciones ganadas o perdidas con ▲▼",
   "Estrategia óptima a toro pasado: la mejor estrategia posible para cada piloto con la deg real de esa carrera, y cuánto tiempo dejó en pista",
   "Según categoría: paradas y compuestos (F1, F2, F3), elección de neumático sin paradas (motos), combustible y caution (IndyCar), stints y cambios de piloto por clase (resistencia, GT3)",
   "Supuestos y fuentes"
  ]
 },
 {
  "id": "undercut-duel",
  "group": "sector-4",
  "name": "Undercut Duel",
  "when": "Sector 4",
  "note": "La misma lógica que las key battles de la Race Card, aplicada a lo que ya pasó.",
  "paddock": [
   [
    "open",
    "Una pantalla: dos coches frente a frente; a la izquierda, el gap vuelta a vuelta entre los dos; a la derecha, el mapa de calor de quién sale delante"
   ],
   [
    "open",
    "El duelo clave de la última carrera, ya montado desde el Debrief: quién paró primero y quién salió delante"
   ],
   [
    "locked",
    "Elegir cualquier pareja de pilotos y las vueltas de parada de cada uno"
   ],
   [
    "partial",
    "Mapa de calor gap × vueltas de diferencia (1, 2 y 3): en verde el undercut funciona, en morado gana el overcut"
   ],
   [
    "locked",
    "Desglose de la jugada: vuelta de salida con neumático frío, ritmo con neumático viejo y nuevo, y pit loss"
   ],
   [
    "open",
    "Según categoría: F1, F2, F3 e IndyCar (en IndyCar, también la ventana de combustible). En resistencia y GT3, por clase y con cambio de piloto"
   ],
   [
    "open",
    "Supuestos y fuentes"
   ]
  ],
  "trackside": [
   "Una pantalla: dos coches frente a frente; a la izquierda, el gap vuelta a vuelta entre los dos; a la derecha, el mapa de calor de quién sale delante",
   "Elegir cualquier pareja de pilotos de cualquier carrera del archivo y las vueltas de parada de cada uno",
   "Mapa de calor gap × vueltas de diferencia (1, 2 y 3) con cifras: en verde el undercut funciona, en morado gana el overcut, y el gap máximo con el que funciona",
   "Desglose de la jugada: vuelta de salida con neumático frío, ritmo con neumático viejo y nuevo, y pit loss",
   "Según categoría: F1, F2, F3 e IndyCar (en IndyCar, también la ventana de combustible). En resistencia y GT3, por clase y con cambio de piloto",
   "Supuestos y fuentes"
  ]
 },
 {
  "id": "sc-window",
  "group": "sector-4",
  "name": "SC Window",
  "when": "Sector 4",
  "note": "Comprueba a toro pasado los umbrales de Safety Car de la Race Card.",
  "paddock": [
   [
    "open",
    "Una pantalla: un gráfico de barras con una barra por vuelta y los segundos que se ganaban parando bajo Safety Car en esa vuelta; encima, la banda de la pit window"
   ],
   [
    "partial",
    "La última carrera con los Safety Car reales marcados: quién paró y si fue buena idea"
   ],
   [
    "locked",
    "Interruptor SC / VSC y deslizador para soltar un Safety Car en cualquier vuelta y ver quién gana y quién pierde"
   ],
   [
    "locked",
    "Pit loss usado en cada caso (verde, SC y VSC), con su fuente"
   ],
   [
    "open",
    "Según categoría: SC y VSC (F1, F2, F3), caution (IndyCar), FCY y slow zones (resistencia, GT3). No aplica a motos"
   ],
   [
    "open",
    "Supuestos y fuentes"
   ]
  ],
  "trackside": [
   "Una pantalla: un gráfico de barras con una barra por vuelta y los segundos que se ganaban parando bajo Safety Car en esa vuelta; encima, la banda de la pit window",
   "Cualquier carrera del archivo con los Safety Car reales marcados: quién paró, quién no y el veredicto de cada uno",
   "Interruptor SC / VSC y deslizador para soltar un Safety Car en cualquier vuelta y ver quién gana y quién pierde",
   "Pit loss usado en cada caso (verde, SC y VSC), con su fuente",
   "Según categoría: SC y VSC (F1, F2, F3), caution (IndyCar), FCY y slow zones (resistencia, GT3). No aplica a motos",
   "Supuestos y fuentes"
  ]
 },
 {
  "id": "deg-curve",
  "group": "sector-4",
  "name": "Deg Curve",
  "when": "Sector 4",
  "note": "Nueva. Sustituye a Tyre Call: las motos tienen su modo aquí. Es la tool que más enseña por qué funcionó una estrategia.",
  "paddock": [
   [
    "open",
    "Una pantalla: tiempo por vuelta de cada stint como puntos, con la recta de deg encima, coloreada por compuesto"
   ],
   [
    "open",
    "El podio de la última carrera, ritmo limpio y sin vueltas de Safety Car, tráfico ni boxes"
   ],
   [
    "locked",
    "Comparar hasta 4 pilotos de cualquier carrera"
   ],
   [
    "locked",
    "Filtro por compuesto y corrección de combustible activable"
   ],
   [
    "partial",
    "Cifras: segundos que se pierden por vuelta con cada compuesto y vuelta del cliff"
   ],
   [
    "open",
    "Según categoría: compuestos (F1, F2, F3), primary y alternate (IndyCar), delantero y trasero con la caída de ritmo al final (motos), por clase (resistencia, GT3)"
   ],
   [
    "open",
    "Supuestos y fuentes"
   ]
  ],
  "trackside": [
   "Una pantalla: tiempo por vuelta de cada stint como puntos, con la recta de deg encima, coloreada por compuesto",
   "Comparar hasta 4 pilotos de cualquier carrera del archivo, con ritmo limpio (sin vueltas de Safety Car, tráfico ni boxes)",
   "Filtro por compuesto y corrección de combustible activable",
   "Cifras: segundos que se pierden por vuelta con cada compuesto y vuelta del cliff",
   "Comparar la deg real con la que estimó el Weekend Brief",
   "Según categoría: compuestos (F1, F2, F3), primary y alternate (IndyCar), delantero y trasero con la caída de ritmo al final (motos), por clase (resistencia, GT3)",
   "Supuestos y fuentes"
  ]
 },
 {
  "id": "head-2-head",
  "group": "sector-4",
  "name": "Head 2 Head",
  "when": "Sector 4",
  "note": "Nueva. Es la tool más compartible en redes: el duelo de compañeros de equipo.",
  "paddock": [
   [
    "open",
    "Una pantalla: dos pilotos a cada lado y, en el centro, las barras enfrentadas de cada métrica de la temporada"
   ],
   [
    "open",
    "Compañeros de equipo de la temporada actual: quién gana en clasificación y en carrera, y por cuánto"
   ],
   [
    "locked",
    "Cualquier pareja de pilotos, de cualquier equipo y temporada"
   ],
   [
    "partial",
    "Gráfico carrera a carrera: diferencia en clasificación y posiciones ganadas o perdidas en carrera"
   ],
   [
    "locked",
    "Ritmo de carrera medio y gestión del neumático, con Deg Curve"
   ],
   [
    "open",
    "Según categoría: pilotos en todas las series; en resistencia y GT3, coches y tripulaciones por clase"
   ],
   [
    "open",
    "Supuestos y fuentes"
   ]
  ],
  "trackside": [
   "Una pantalla: dos pilotos a cada lado y, en el centro, las barras enfrentadas de cada métrica de la temporada",
   "Cualquier pareja de pilotos, de cualquier equipo y temporada: clasificación, carrera, puntos, abandonos y vueltas lideradas",
   "Gráfico carrera a carrera: diferencia en clasificación y posiciones ganadas o perdidas en carrera, con cifras",
   "Ritmo de carrera medio y gestión del neumático, con Deg Curve",
   "Según categoría: pilotos en todas las series; en resistencia y GT3, coches y tripulaciones por clase",
   "Supuestos y fuentes"
  ]
 },
 {
  "id": "title-fight",
  "group": "sector-4",
  "name": "Title Fight",
  "when": "Siempre",
  "note": "Antes «Calculadora de campeonato». Motor hecho; falta llevarla a la web.",
  "paddock": [
   [
    "open",
    "Una pantalla: la clasificación como barras de puntos y, debajo, las carreras que quedan en fila"
   ],
   [
    "open",
    "Arrastrar el resultado de cada piloto en las carreras que quedan (y en los sprints) y ver cómo se mueven las barras al momento"
   ],
   [
    "open",
    "Quién puede ser campeón, quién está eliminado y qué necesita cada uno en la próxima carrera"
   ],
   [
    "open",
    "Compartir tu escenario como imagen con la marca"
   ],
   [
    "open",
    "Puntos de carrera y sprint verificados por serie (F1 y MotoGP verificados; el resto [PENDIENTE]). Empates marcados como «depende del desempate»"
   ],
   [
    "locked",
    "Combinaciones en las que cada uno es campeón"
   ]
  ],
  "trackside": [
   "Una pantalla: la clasificación como barras de puntos y, debajo, las carreras que quedan en fila",
   "Arrastrar el resultado de cada piloto en las carreras que quedan (y en los sprints) y ver cómo se mueven las barras al momento",
   "Quién puede ser campeón, quién está eliminado y qué necesita cada uno en la próxima carrera",
   "Combinaciones en las que cada uno es campeón, contadas sin probabilidades inventadas",
   "Guardar tus escenarios y compartirlos como imagen con la marca",
   "Puntos de carrera y sprint verificados por serie (F1 y MotoGP verificados; el resto [PENDIENTE]). Empates marcados como «depende del desempate»"
  ]
 }
];
window.PURSEC_SECTOR4_NOTE = "Antes «Laboratorio». Las tools necesitan datos vuelta a vuelta de cada carrera: [PENDIENTE] permiso de Jolpica o recogida propia. Sin ellos, el ritmo se estima por stint.";
