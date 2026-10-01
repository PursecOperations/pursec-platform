// Laboratorio: simulación vuelta a vuelta de una carrera para rehacer escenarios.
// Determinista. Cada coche: ritmo base, stints y paradas. Adelantar exige una ventaja mínima por vuelta.

import { lapDelta } from "./pace.js";

/**
 * @param {object} race
 * @param {number} race.laps
 * @param {number} race.refLap           s, vuelta de referencia (solo para el ritmo bajo Safety Car)
 * @param {object} race.compounds
 * @param {number} race.pitLoss
 * @param {number} [race.pitLossSC]      por defecto = pitLoss
 * @param {number} [race.pitLossVSC]     por defecto = pitLoss
 * @param {number} [race.passThreshold]  s/vuelta de ventaja para poder adelantar (por defecto 0.5)
 * @param {number} [race.minGap]         separación mínima cuando un coche va detrás de otro (por defecto 0.3)
 * @param {number} [race.startGap]       s entre posiciones de salida (por defecto 0.25)
 * @param {number} [race.scLapFactor]    vuelta bajo SC = refLap × factor (por defecto 1.4)
 * @param {number} [race.vscLapFactor]   (por defecto 1.3)
 * @param {number} [race.scGap]          separación tras reagrupar con SC (por defecto 0.5)
 * @param {Array<{fromLap:number,toLap:number,type:'SC'|'VSC'}>} [race.neutralisations]
 * @param {Array<{id:string, grid:number, pace:number, stints:Array<{compound:string, laps:number}>, retiredLap?:number}>} race.drivers
 */
export function simulateRace(race) {
  validateRace(race);
  const defined = Object.fromEntries(Object.entries(race).filter(([, v]) => v !== undefined && v !== null));
  const R = {
    passThreshold: 0.5,
    minGap: 0.3,
    startGap: 0.25,
    scLapFactor: 1.4,
    vscLapFactor: 1.3,
    scGap: 0.5,
    neutralisations: [],
    ...defined,
  };
  R.pitLossSC ??= R.pitLoss;
  R.pitLossVSC ??= R.pitLoss;

  const cars = R.drivers.map((d) => ({
    id: d.id,
    pace: d.pace,
    retiredLap: d.retiredLap || null,
    stints: d.stints,
    stintIdx: 0,
    age: 0,
    lapInStint: 0,
    t: (d.grid - 1) * R.startGap,
    pits: [],
    out: false,
  }));

  const neutralAt = (lap) => R.neutralisations.find((n) => lap >= n.fromLap && lap <= n.toLap) || null;
  const history = [];

  for (let lap = 1; lap <= R.laps; lap++) {
    const neut = neutralAt(lap);
    const order = cars.filter((c) => !c.out).sort((a, b) => a.t - b.t);

    // Tiempo "libre" de cada coche en esta vuelta
    const planned = new Map();
    for (const c of order) {
      const stint = c.stints[c.stintIdx];
      const comp = R.compounds[stint.compound];
      let lt = R.refLap + c.pace + lapDelta(comp, c.age);
      if (c.lapInStint === 0 && c.stintIdx > 0) lt += comp.warmup || 0;
      const pitsNow = c.lapInStint + 1 === stint.laps && c.stintIdx < c.stints.length - 1;
      if (neut?.type === "SC") lt = R.refLap * R.scLapFactor;
      else if (neut?.type === "VSC") lt = R.refLap * R.vscLapFactor + c.pace;
      if (pitsNow) lt += neut?.type === "SC" ? R.pitLossSC : neut?.type === "VSC" ? R.pitLossVSC : R.pitLoss;
      planned.set(c, { lt, pitsNow });
    }

    // Aplicar con bloqueo: no se adelanta sin ventaja suficiente (salvo en boxes o neutralizado)
    let prev = null;
    for (const c of order) {
      const { lt, pitsNow } = planned.get(c);
      let newT = c.t + lt;
      if (prev && !neut && !pitsNow && !prev.pitsNow) {
        const limit = prev.newT + R.minGap;
        const advantage = prev.lt - lt;
        if (newT < limit && advantage < R.passThreshold) newT = limit;
      }
      c.newT = newT;
      prev = { newT, lt, pitsNow };
      if (pitsNow) c.pits.push(lap);
    }

    for (const c of order) {
      c.t = c.newT;
      const stint = c.stints[c.stintIdx];
      c.age++;
      c.lapInStint++;
      if (c.lapInStint === stint.laps && c.stintIdx < c.stints.length - 1) {
        c.stintIdx++;
        c.age = 0;
        c.lapInStint = 0;
      }
      if (c.retiredLap && lap >= c.retiredLap) c.out = true;
    }

    // Fin de Safety Car: el pelotón se reagrupa detrás del líder
    if (neut?.type === "SC" && lap === neut.toLap) {
      const running = cars.filter((c) => !c.out).sort((a, b) => a.t - b.t);
      running.forEach((c, i) => {
        c.t = running[0].t + i * R.scGap;
      });
    }

    history.push(
      cars
        .filter((c) => !c.out)
        .sort((a, b) => a.t - b.t)
        .map((c) => c.id)
    );
  }

  const finished = cars.filter((c) => !c.out).sort((a, b) => a.t - b.t);
  const winnerT = finished[0]?.t ?? 0;
  const classification = [
    ...finished.map((c, i) => ({ position: i + 1, id: c.id, gap: Math.round((c.t - winnerT) * 1000) / 1000, pits: c.pits })),
    ...cars.filter((c) => c.out).map((c) => ({ position: null, id: c.id, gap: null, pits: c.pits, retiredLap: c.retiredLap })),
  ];
  return { classification, positionsByLap: history };
}

/**
 * Compara una carrera con un escenario modificado.
 * overrides: { drivers: { [id]: { stints?, pace? } }, neutralisations?, compounds? }
 */
export function compareScenario(race, overrides = {}) {
  const scenario = {
    ...race,
    compounds: { ...race.compounds, ...(overrides.compounds || {}) },
    neutralisations: overrides.neutralisations ?? race.neutralisations,
    drivers: race.drivers.map((d) => ({ ...d, ...(overrides.drivers?.[d.id] || {}) })),
  };
  const base = simulateRace(race);
  const alt = simulateRace(scenario);
  const posBase = Object.fromEntries(base.classification.map((r) => [r.id, r.position]));
  const changes = alt.classification.map((r) => ({
    id: r.id,
    before: posBase[r.id],
    after: r.position,
    change: posBase[r.id] && r.position ? posBase[r.id] - r.position : null,
  }));
  return { base, scenario: alt, changes };
}

function validateRace(r) {
  if (!Number.isInteger(r.laps) || r.laps < 1) throw new Error("laps no válido");
  if (!r.drivers?.length) throw new Error("Faltan pilotos");
  for (const d of r.drivers) {
    const total = d.stints.reduce((s, x) => s + x.laps, 0);
    if (!d.retiredLap && total !== r.laps) throw new Error(`${d.id}: los stints suman ${total} vueltas y la carrera tiene ${r.laps}`);
    for (const s of d.stints) if (!r.compounds[s.compound]) throw new Error(`${d.id}: compuesto desconocido ${s.compound}`);
  }
}
