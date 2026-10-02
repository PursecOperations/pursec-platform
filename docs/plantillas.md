# PURSEC — Plantillas de contenido

Estado: **borrador para aprobar por Oriol** antes de la primera carrera.
Reglas: términos técnicos en inglés (pit stop, stint, undercut, Safety Car, Soft/Medium/Hard…); tono racing; sin logos, fotos oficiales ni marcas; cada dato con su fuente; lo que falte, `[PENDIENTE]`.
Flujo: los scripts calculan → Claude redacta el borrador (`posts.status = 'draft'`) → Oriol añade su criterio y dice "publica" → `published`.

Dónde va cada parte en la base de datos:
- `posts.summary_md` y `posts.data_free`: lo que ve todo el mundo (Paddock).
- `posts_trackside.body_md` y `posts_trackside.data`: lo completo (Trackside).

---

## 1. Strategy Brief · jueves antes de la carrera

**Título:** `Strategy Brief · {GP} {año}`

**Resumen gratis (Paddock), máx. 120 palabras**
- La estrategia más probable en una frase: `{n} pit stop(s), {secuencia}, ventana vuelta {from}–{to}`.
- El dato del fin de semana (uno, el más llamativo).
- Llamada a Trackside: "El brief completo y los simuladores, en el Club".

**Completo (Trackside)**
1. **Circuito.** Longitud, vueltas, trazado (mapa propio), dónde se adelanta. Fuente.
2. **Pit lane.** Pérdida en boxes con bandera verde, SC y VSC. Fuente o `[PENDIENTE]`.
3. **Neumáticos.** Compuestos nominados y qué se espera de cada uno (degradación estimada en libres).
4. **Safety Car history.** Últimas temporadas: Safety Cars, VSC, banderas rojas. Desde qué vuelta compensa parar bajo SC.
5. **Estrategias del simulador.** Mejor plan a 1, 2 y 3 paradas con su diferencia en segundos; ventanas de parada.
6. **3 claves a vigilar.** Criterio de Oriol: lo que ningún simulador da.
7. **Supuestos y fuentes.**

## 2. Race Card · sábado tras la clasificación

Pantalla para el móvil, abierta junto a la tele. La genera `buildRaceCard()` (`packages/sim/src/racecard.js`).

| Módulo | Contenido | Plan |
| --- | --- | --- |
| Pit windows | Plan óptimo, ventanas por parada, alternativas | Paddock |
| Grid | Parrilla real | Paddock |
| Grid & tyre strategy | Parrilla con neumático de salida | Trackside |
| Safety Car history | Historial y "desde la vuelta X, parar bajo SC compensa" | Trackside |
| Overtaking zones | Zonas de adelantamiento del circuito | Trackside |
| Key battles | Duelos clave con el gap máximo para el undercut (1, 2 y 3 vueltas) | Trackside |
| Wet race | Plan si llueve (si hay datos de neumáticos de lluvia) | Trackside |

## 3. Debrief · lunes o martes

**Título:** `Debrief · {GP} {año}: {la frase de la carrera}`

**Resumen gratis (Paddock), máx. 150 palabras**
- Qué pasó en 3 líneas.
- **¿Acertamos?** Una línea: lo que predijo el Brief frente a lo que pasó.

**Completo (Trackside)**
1. **¿Acertamos?** Tabla: predicción del Brief / realidad / acierto o fallo. Se enseñan también los fallos.
2. **La carrera en estrategias.** Infografía de mapa de estrategia.
3. **Ritmo por stint.** Infografía de ritmo; quién gestionó mejor el neumático.
4. **Momentos clave.** Paradas decisivas, Safety Car, undercuts que funcionaron o no (con el simulador).
5. **Qué habría pasado si…** 1–2 escenarios del Laboratorio.
6. **Campeonato.** Infografía y lo que necesita cada uno.
7. **Supuestos y fuentes.**

## 4. Infografías · toda la semana

Generador: `packages/infographics` (SVG con la marca; PNG con `scripts/render.mjs`). 1080×1350 para redes.

| Infografía | Función | Cuándo |
| --- | --- | --- |
| Mapa de estrategia | `strategyMap()` | Debrief |
| Ritmo por stint | `stintPace()` | Debrief |
| Posiciones vuelta a vuelta | `positionsChart()` | Debrief |
| Clasificación del campeonato | `championshipChart()` | Tras cada carrera |

Todas llevan fuente en el pie. Gratis en redes; alta resolución para Trackside.
