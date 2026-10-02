# PURSEC — Fichas de los simuladores

Estado: **borrador para aprobar por Oriol**. Código en `packages/sim/` (JavaScript puro, sin IA, sin dependencias).
Todo es determinista: mismos datos de entrada → mismo resultado. Cada simulador muestra en la web sus supuestos y fuentes.

## Familias de series

Las series no se simulan igual. El motor tiene tres familias de reglas:

| Familia | Series | Qué cambia |
| --- | --- | --- |
| `pit_tyres` | F1, F2, F3, IndyCar | Paradas para cambiar neumáticos (IndyCar: además, límite de vueltas por combustible) |
| `no_stops` | MotoGP, Moto2, Moto3 | Sin paradas en seco: solo elección de neumático para toda la carrera |
| `endurance` | WEC, IMSA, Le Mans, GT3 | Stints por combustible, cambio de piloto, BoP. **v2: no incluido en esta versión** |

Reglas por serie en `packages/sim/src/series.js`. Lo no verificado está marcado `PENDIENTE`.

## Modelo común de ritmo

Tiempo de una vuelta con un neumático de edad `a` (vueltas ya hechas con él):

```
t(a) = base + offset_compuesto + deg_lineal · a + deg_cuadratica · a²
```

- `offset_compuesto`: lo que es más lento el compuesto nuevo frente al más rápido (s/vuelta).
- `deg_lineal`, `deg_cuadratica`: cuánto se pierde por vuelta de uso.
- El efecto del combustible (el coche se aligera) es igual para todas las estrategias y se cancela al compararlas; no se modela.
- Tráfico y adelantamientos: solo en el Laboratorio (umbral de adelantamiento por circuito).

---

## 1. Simulador de estrategia

- **Pregunta:** ¿1, 2 o 3 paradas? ¿Con qué compuestos y en qué vueltas?
- **Fórmula:** tiempo total = Σ tiempo de cada stint + nº paradas × pérdida en boxes. Se prueban todas las combinaciones válidas de compuestos y vueltas de parada; se ordena por tiempo total.
- **Ventana de parada (pit window):** vueltas en las que parar cuesta menos de 1 s frente a la vuelta óptima. Alimenta el módulo *pit windows* de la Race Card.
- **Reglas:** F1 en seco obliga a usar 2 compuestos distintos; vida máxima por compuesto; IndyCar límite de vueltas por depósito.
- **Datos:** nº de vueltas, pérdida en boxes, por compuesto (offset, degradación, vida máxima). Por circuito y serie.
- **Familias:** `pit_tyres`; en `no_stops` compara compuestos a 0 paradas.
- **Plan:** Trackside. Las ventanas de parada de la Race Card, en Paddock.
- **Límite:** la degradación hay que estimarla en cada fin de semana (libres). Con el reglamento 2026 la de temporadas anteriores vale poco.

## 2. Ventana de Safety Car

- **Pregunta:** si sale el Safety Car (o VSC) en la vuelta X, ¿cuánto se gana parando?
- **Fórmula:** para cada vuelta, mejor plan para el resto de la carrera parando ya con la pérdida reducida (SC/VSC) frente al mejor plan sin parar ahora. Diferencia = segundos ganados.
- **Datos:** los del simulador de estrategia + pérdida en boxes bajo SC y bajo VSC (por circuito).
- **Familias:** `pit_tyres`.
- **Plan:** Trackside. Alimenta el módulo *Safety Car history* de la Race Card.
- **Límite:** no modela que el Safety Car agrupa al pelotón (eso lo hace el Laboratorio).

## 3. Undercut / overcut

- **Pregunta:** el coche B está a `g` segundos del A. Si B para primero y A para `k` vueltas después, ¿quién sale delante?
- **Fórmula:** se suman los tiempos de ambos desde la parada de B hasta que A sale de boxes (neumático viejo frente a nuevo, penalización de vuelta de salida por neumático frío, misma pérdida en boxes). Resultado: gap final y gap máximo con el que el undercut funciona para k = 1, 2, 3.
- **Datos:** degradación y edad de los neumáticos de ambos, penalización de vuelta de salida (por compuesto), pérdida en boxes.
- **Familias:** `pit_tyres`.
- **Plan:** Trackside. Alimenta *key battles* de la Race Card.

## 4. Calculadora de campeonato

- **Pregunta:** ¿qué necesita cada piloto para ganar el título? ¿Quién está eliminado?
- **Fórmula:** aritmética con puntos actuales y puntos que quedan en juego (carreras + sprints). Eliminado si su máximo posible < puntos actuales del líder. Campeón si su ventaja > máximo que puede sumar el segundo. Matriz "resultado del líder × mejor resultado del rival" para el siguiente evento.
- **Empates:** se marcan como "depende del desempate" (más victorias, etc.); no se resuelven.
- **Datos:** clasificación actual (pública), calendario restante (tabla `races`), sistema de puntos de la serie.
- **Familias:** todas.
- **Plan:** **Paddock (gratis)**: herramienta de captación.
- **Puntos verificados:** F1 carrera 25-18-15-12-10-8-6-4-2-1, sprint 8-7-6-5-4-3-2-1, sin punto por vuelta rápida desde 2025 ([RacingNews365](https://racingnews365.com/f1-rules-explained)). MotoGP carrera 25-20-16-13-11-10-9-8-7-6-5-4-3-2-1, sprint 12-9-7-6-5-4-3-2-1 ([motogp.com](https://www.motogp.com/en/blog-articles/what-is-the-motogp-points-system-all-you-need-to-know/517281)). Resto de series: `PENDIENTE`.

## 5. Laboratorio

- **Pregunta:** ¿qué habría pasado si…? (otra vuelta de parada, otra degradación, Safety Car en otro momento).
- **Fórmula:** simulación vuelta a vuelta de toda la parrilla. Cada coche: su ritmo base, sus stints y paradas. Un coche más rápido no adelanta si su ventaja por vuelta es menor que el umbral de adelantamiento del circuito (se queda detrás). Safety Car: congela el orden, agrupa a los coches a una separación fija y abarata las paradas.
- **Datos:** de cada carrera, por piloto: posición de salida, ritmo, stints. **Requiere datos vuelta a vuelta** para calibrar el ritmo; ver nota de datos.
- **Familias:** `pit_tyres` y `no_stops`.
- **Plan:** Trackside.

## 6. Elección de neumático (MotoGP, Moto2, Moto3)

- Caso particular del simulador de estrategia con 0 paradas: compara compuestos (delantero y trasero) para toda la carrera. Mismos datos y límites.

---

## Datos y licencias

- Solo datos públicos recopilados por nosotros, con su fuente en cada fila (`sources`).
- Jolpica (CC BY-NC-SA 4.0): no se usa en la web de pago sin permiso escrito. Email de petición redactado, pendiente de envío por Oriol.
- FastF1: solo para calibrar en privado, nunca se publica.
- Sin permiso de Jolpica, el Laboratorio funciona con los stints y resultados que recopilemos a mano; el ritmo de cada piloto se estima por stint, no vuelta a vuelta.

## Precisión

Cada modelo se contrastará con las últimas 3 temporadas cuando haya datos. Hasta entonces: **sin informe de precisión**; no se vende como predicción, solo como herramienta de escenarios.
