// Pruebas del motor. Todos los números de compuestos y carreras son FICTICIOS: solo comprueban la matemática.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  stintTime, lapDelta, optimizeStrategy, safetyCarWindow, stateAfterLap,
  undercut, undercutTable, championship, clinchMatrix, simulateRace, compareScenario, SERIES,
} from "../src/index.js";

const C = {
  S: { offset: 0, deg: 0.12, deg2: 0.002, maxLife: 22, warmup: 0.8 },
  M: { offset: 0.35, deg: 0.07, deg2: 0.001, maxLife: 35, warmup: 1.0 },
  H: { offset: 0.7, deg: 0.04, maxLife: 50, warmup: 1.4 },
};

// ------------------------------------------------------------------ ritmo
test("stintTime coincide con la suma vuelta a vuelta", () => {
  for (const c of Object.values(C)) {
    for (const [n, a0] of [[1, 0], [10, 0], [17, 5], [30, 12]]) {
      let s = 0;
      for (let i = 0; i < n; i++) s += lapDelta(c, a0 + i);
      assert.ok(Math.abs(stintTime(c, n, a0) - s) < 1e-9);
    }
  }
});

// ------------------------------------------------------------------ estrategia
function bruteForce(laps, pitLoss, compounds, maxStops, twoCompounds) {
  const names = Object.keys(compounds);
  let best = Infinity;
  const rec = (seq, lens, used) => {
    if (used === laps) {
      if (twoCompounds && new Set(seq).size < 2) return;
      let t = 0;
      seq.forEach((n, i) => {
        t += stintTime(compounds[n], lens[i], 0) + (i > 0 ? pitLoss + (compounds[n].warmup || 0) : 0);
      });
      best = Math.min(best, t);
      return;
    }
    if (seq.length > maxStops) return;
    for (const n of names) {
      const max = Math.min(compounds[n].maxLife || laps, laps - used);
      for (let j = 1; j <= max; j++) rec([...seq, n], [...lens, j], used + j);
    }
  };
  rec([], [], 0);
  return best;
}

test("el óptimo coincide con fuerza bruta (carrera corta)", () => {
  const laps = 24;
  const comp = {
    S: { offset: 0, deg: 0.3, maxLife: 14, warmup: 0.5 },
    H: { offset: 0.6, deg: 0.1, maxLife: 30, warmup: 1 },
  };
  for (const two of [false, true]) {
    const r = optimizeStrategy({ laps, pitLoss: 6, compounds: comp, rules: { maxStops: 2, mustUseTwoCompounds: two } });
    assert.ok(Math.abs(r.best.total - bruteForce(laps, 6, comp, 2, two)) < 1e-9);
  }
});

test("regla de 2 compuestos, vida máxima y suma de vueltas", () => {
  const r = optimizeStrategy({ laps: 57, pitLoss: 21, compounds: C, rules: SERIES.F1.rules });
  assert.equal(r.feasible, true);
  assert.ok(new Set(r.best.stints.map((s) => s.compound)).size >= 2);
  assert.equal(r.best.stints.reduce((s, x) => s + x.laps, 0), 57);
  for (const s of r.best.stints) assert.ok(s.laps <= C[s.compound].maxLife);
  assert.equal(r.best.stints[0].fromLap, 1);
  assert.equal(r.best.stints.at(-1).toLap, 57);
  for (const k of Object.keys(r.bestByStops)) assert.ok(r.bestByStops[k].delta >= 0);
});

test("ventanas de parada: contienen la vuelta óptima y su coste está dentro del margen", () => {
  const r = optimizeStrategy({ laps: 57, pitLoss: 21, compounds: C, rules: SERIES.F1.rules, windowTolerance: 1 });
  assert.equal(r.windows.length, r.best.stops);
  for (const w of r.windows) {
    assert.ok(w.from <= w.optimalLap && w.optimalLap <= w.to);
    assert.ok(w.laps.includes(w.optimalLap));
  }
});

test("más pérdida en boxes → menos o igual número de paradas", () => {
  const cheap = optimizeStrategy({ laps: 60, pitLoss: 12, compounds: C, rules: SERIES.F1.rules });
  const dear = optimizeStrategy({ laps: 60, pitLoss: 35, compounds: C, rules: SERIES.F1.rules });
  assert.ok(dear.best.stops <= cheap.best.stops);
});

test("sin estrategia posible: lo dice en vez de inventar", () => {
  const r = optimizeStrategy({ laps: 80, pitLoss: 20, compounds: { S: { offset: 0, deg: 0.1, maxLife: 10 } }, rules: { maxStops: 2 } });
  assert.equal(r.feasible, false);
});

test("MotoGP (0 paradas) elige el compuesto que aguanta la carrera", () => {
  const moto = { SOFT: { offset: 0, deg: 0.06, maxLife: 18 }, MEDIUM: { offset: 0.2, deg: 0.03, maxLife: 30 } };
  const r = optimizeStrategy({ laps: 25, pitLoss: 0, compounds: moto, rules: SERIES.MotoGP.rules });
  assert.equal(r.best.stops, 0);
  assert.equal(r.best.sequence, "MEDIUM");
});

test("rendimiento: 78 vueltas, 3 compuestos, hasta 3 paradas en menos de 1 s", () => {
  const t0 = performance.now();
  optimizeStrategy({ laps: 78, pitLoss: 19, compounds: C, rules: SERIES.F1.rules });
  assert.ok(performance.now() - t0 < 1000);
});

test("determinista: mismo resultado dos veces", () => {
  const p = { laps: 53, pitLoss: 22, compounds: C, rules: SERIES.F1.rules };
  assert.deepEqual(optimizeStrategy(p), optimizeStrategy(p));
});

// ------------------------------------------------------------------ Safety Car
test("estado tras la vuelta L siguiendo un plan", () => {
  const plan = { stops: 1, stints: [{ compound: "M", fromLap: 1, toLap: 20, laps: 20, startAge: 0 }, { compound: "H", fromLap: 21, toLap: 50, laps: 30, startAge: 0 }] };
  assert.deepEqual(stateAfterLap(plan, 10), { compound: "M", age: 10, used: ["M"], stopsDone: 0 });
  assert.deepEqual(stateAfterLap(plan, 25), { compound: "H", age: 5, used: ["M", "H"], stopsDone: 1 });
});

test("Safety Car: parar bajo SC gana más que bajo VSC y que con bandera verde", () => {
  const r = safetyCarWindow({ laps: 50, pitLoss: 22, pitLossSC: 11, pitLossVSC: 15, compounds: C, rules: SERIES.F1.rules });
  assert.equal(r.rows.length, 49);
  for (const row of r.rows) {
    if (row.gainSC === undefined) continue;
    assert.ok(row.gainSC >= row.gainVSC);
    assert.ok(Math.abs(row.gainSC - row.gainVSC - 4) < 1e-6); // 15 − 11
  }
  // Cerca de la parada óptima, el SC regala casi toda la diferencia de pérdida en boxes
  const stop = r.plan.pitLaps[0];
  const near = r.rows.find((x) => x.lap === stop);
  assert.ok(near.pitSC);
  assert.ok(near.gainSC > 22 - 11 - 1.5);
});

// ------------------------------------------------------------------ undercut
test("undercut: caso calculado a mano", () => {
  const comp = { X: { offset: 0, deg: 0.1, warmup: 1 } };
  // A: vueltas 20 y 21 viejas (2,0 + 2,1) + parada + salida (0 + 1) → 5,1 + P
  // B: vuelta 20 vieja (2,0) + parada + nuevas edad 0 y 1 (0 + 0,1) + calentamiento 1 → 3,1 + P
  const base = { compounds: comp, pitLoss: 20, a: { compound: "X", age: 20 }, b: { compound: "X", age: 20 }, newA: "X", newB: "X", k: 1 };
  assert.equal(undercut({ ...base, gap: 1.5 }).swing, 2);
  assert.equal(undercut({ ...base, gap: 1.5 }).winner, "B");
  assert.equal(undercut({ ...base, gap: 2.5 }).winner, "A");
  const table = undercutTable(base);
  assert.ok(table[0].maxGap < table[1].maxGap && table[1].maxGap < table[2].maxGap); // cuanto más tarda A, más gana B
});

// ------------------------------------------------------------------ campeonato
test("campeonato: campeón, eliminados y empate posible (F1)", () => {
  const remaining = [{ sprint: false }, { sprint: true }]; // 25 + 25 + 8 = 58 en juego
  const r = championship(
    [{ name: "A", points: 300 }, { name: "B", points: 241 }, { name: "C", points: 242 }, { name: "D", points: 200 }],
    remaining, SERIES.F1.points
  );
  assert.equal(r.pointsLeft, 58);
  const by = Object.fromEntries(r.rows.map((x) => [x.name, x.status]));
  assert.equal(by.A, "champion_unless_tiebreak"); // 300 − 242 = 58
  assert.equal(by.C, "tiebreak_only");
  assert.equal(by.B, "eliminated");
  assert.equal(by.D, "eliminated");
});

test("campeonato: sin sistema de puntos verificado no calcula", () => {
  assert.throws(() => championship([{ name: "A", points: 1 }], [], SERIES.F2.points));
});

test("matriz de título en el próximo evento", () => {
  const m = clinchMatrix({ points: 300 }, { points: 260 }, [{}, {}], SERIES.F1.points);
  assert.equal(m.maxAfter, 25);
  assert.equal(m.matrix[0][1], "campeon"); // líder P1, rival P2: 300+25 − (260+18) = 47 > 25
  assert.equal(m.matrix[10][0], "no"); // líder sin puntos, rival P1: 40 − 25 = 15 < 25
  assert.equal(m.matrix[0][0], null);
});

// ------------------------------------------------------------------ Laboratorio
const LAB = {
  laps: 30, refLap: 90, pitLoss: 20, pitLossSC: 10,
  compounds: { M: { offset: 0, deg: 0.05, warmup: 1 }, H: { offset: 0.3, deg: 0.02, warmup: 1.5 } },
  drivers: [
    { id: "A", grid: 1, pace: 0, stints: [{ compound: "M", laps: 15 }, { compound: "H", laps: 15 }] },
    { id: "B", grid: 2, pace: -0.3, stints: [{ compound: "M", laps: 15 }, { compound: "H", laps: 15 }] },
  ],
};

test("Laboratorio: un coche más rápido que no llega al umbral se queda detrás", () => {
  const held = simulateRace({ ...LAB, passThreshold: 0.5 });
  assert.equal(held.classification[0].id, "A");
  const passes = simulateRace({ ...LAB, passThreshold: 0.2 });
  assert.equal(passes.classification[0].id, "B");
});

test("Laboratorio: undercut en el escenario y reagrupamiento con Safety Car", () => {
  const cmp = compareScenario({ ...LAB, passThreshold: 0.5 }, {
    drivers: { B: { stints: [{ compound: "M", laps: 12 }, { compound: "H", laps: 18 }] } },
  });
  assert.equal(cmp.scenario.classification[0].id, "B");
  assert.deepEqual(cmp.scenario.classification[0].pits, [12]);

  const sc = simulateRace({ ...LAB, passThreshold: 5, neutralisations: [{ fromLap: 10, toLap: 12, type: "SC" }] });
  assert.equal(sc.classification.length, 2);
  assert.ok(Math.abs(sc.classification[1].gap) < 30);
});

test("Laboratorio: abandono y validación de vueltas", () => {
  const r = simulateRace({ ...LAB, drivers: [LAB.drivers[0], { ...LAB.drivers[1], stints: [{ compound: "M", laps: 10 }], retiredLap: 10 }] });
  assert.equal(r.classification[1].position, null);
  assert.throws(() => simulateRace({ ...LAB, drivers: [{ ...LAB.drivers[0], stints: [{ compound: "M", laps: 10 }] }] }));
});
