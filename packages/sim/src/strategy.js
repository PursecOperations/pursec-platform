// Simulador de estrategia: mejor combinación de compuestos y vueltas de parada.
// Determinista. Para cada secuencia de compuestos, programación dinámica sobre el reparto de vueltas.

import { stintTime, validateCompounds } from "./pace.js";

const INF = Number.POSITIVE_INFINITY;

function* sequences(names, length, first) {
  const seq = new Array(length);
  function* rec(i) {
    if (i === length) {
      yield seq.slice();
      return;
    }
    const options = i === 0 && first ? [first] : names;
    for (const n of options) {
      seq[i] = n;
      yield* rec(i + 1);
    }
  }
  yield* rec(0);
}

// Límite de vueltas de cada stint
function stintMax(c, startAge, maxStintLaps, laps) {
  let max = laps;
  if (c.maxLife) max = Math.min(max, c.maxLife - startAge);
  if (maxStintLaps) max = Math.min(max, maxStintLaps);
  return max;
}

// DP para una secuencia: devuelve el mejor reparto y, por cada parada, el mejor total con esa parada en cada vuelta
function solveSequence(seq, ctx) {
  const { laps, compounds, startAge, maxStintLaps } = ctx;
  const S = seq.length;
  const age0 = seq.map((_, i) => (i === 0 ? startAge : 0));
  const maxLen = seq.map((n, i) => stintMax(compounds[n], age0[i], maxStintLaps, laps));
  if (maxLen.some((m) => m < 1)) return null;

  // f[i][m]: coste mínimo de los stints 0..i cubriendo exactamente m vueltas
  const f = Array.from({ length: S }, () => new Float64Array(laps + 1).fill(INF));
  const fArg = Array.from({ length: S }, () => new Int32Array(laps + 1));
  for (let m = 1; m <= Math.min(maxLen[0], laps); m++) {
    f[0][m] = stintTime(compounds[seq[0]], m, age0[0]);
    fArg[0][m] = m;
  }
  for (let i = 1; i < S; i++) {
    const c = compounds[seq[i]];
    for (let m = i + 1; m <= laps; m++) {
      let best = INF;
      let arg = 0;
      for (let j = 1; j <= Math.min(maxLen[i], m - i); j++) {
        const prev = f[i - 1][m - j];
        if (prev === INF) continue;
        const v = prev + stintTime(c, j, 0);
        if (v < best) {
          best = v;
          arg = j;
        }
      }
      f[i][m] = best;
      fArg[i][m] = arg;
    }
  }
  if (f[S - 1][laps] === INF) return null;

  // b[i][m]: coste mínimo de los stints i..S-1 cuando ya se han hecho m vueltas
  const b = Array.from({ length: S + 1 }, () => new Float64Array(laps + 1).fill(INF));
  b[S][laps] = 0;
  for (let i = S - 1; i >= 0; i--) {
    const c = compounds[seq[i]];
    for (let m = 0; m < laps; m++) {
      let best = INF;
      for (let j = 1; j <= Math.min(maxLen[i], laps - m); j++) {
        const next = b[i + 1][m + j];
        if (next === INF) continue;
        const v = stintTime(c, j, age0[i]) + next;
        if (v < best) best = v;
      }
      b[i][m] = best;
    }
  }

  // Reconstrucción del reparto óptimo
  const lengths = new Array(S);
  let m = laps;
  for (let i = S - 1; i >= 0; i--) {
    lengths[i] = fArg[i][m];
    m -= lengths[i];
  }

  // Mejor total con la parada k (fin del stint k) en la vuelta m
  const byStopLap = [];
  for (let k = 0; k < S - 1; k++) {
    const row = new Float64Array(laps + 1).fill(INF);
    for (let mm = 1; mm < laps; mm++) {
      if (f[k][mm] !== INF && b[k + 1][mm] !== INF) row[mm] = f[k][mm] + b[k + 1][mm];
    }
    byStopLap.push(row);
  }

  return { cost: f[S - 1][laps], lengths, byStopLap };
}

/**
 * @param {object} p
 * @param {number} p.laps            vueltas a cubrir
 * @param {number} p.pitLoss         s perdidos por parada (bandera verde)
 * @param {object} p.compounds       { S: {offset, deg, deg2?, maxLife?, warmup?}, … }
 * @param {object} [p.rules]         { minStops, maxStops, mustUseTwoCompounds, maxStintLaps }
 * @param {object} [p.start]         { compound, age } neumático montado (por defecto: elección libre, nuevo)
 * @param {string[]} [p.used]        compuestos ya usados en la carrera
 * @param {number} [p.lapStart]      vueltas ya completadas (para numerar vueltas absolutas)
 * @param {number} [p.windowTolerance] s de margen para la ventana de parada (por defecto 1)
 * @param {number} [p.top]           nº de estrategias en el ranking
 */
export function optimizeStrategy(p) {
  const names = validateCompounds(p.compounds);
  const laps = p.laps;
  if (!Number.isInteger(laps) || laps < 1) throw new Error("laps debe ser un entero ≥ 1");
  if (typeof p.pitLoss !== "number" || p.pitLoss < 0) throw new Error("pitLoss no válido");
  const rules = { minStops: 0, maxStops: 3, mustUseTwoCompounds: false, maxStintLaps: null, ...(p.rules || {}) };
  const lapStart = p.lapStart || 0;
  const tol = p.windowTolerance ?? 1;
  const used = new Set(p.used || []);
  const first = p.start?.compound || null;
  if (first && !p.compounds[first]) throw new Error(`Compuesto de salida desconocido: ${first}`);
  const startAge = p.start?.age || 0;

  const candidates = [];
  for (let k = rules.minStops; k <= rules.maxStops; k++) {
    if (k + 1 > laps) break;
    for (const seq of sequences(names, k + 1, first)) {
      if (rules.mustUseTwoCompounds && new Set([...used, ...seq]).size < 2) continue;
      const sol = solveSequence(seq, { laps, compounds: p.compounds, startAge, maxStintLaps: rules.maxStintLaps });
      if (!sol) continue;
      const fixed = k * p.pitLoss + seq.slice(1).reduce((s, n) => s + (p.compounds[n].warmup || 0), 0);
      candidates.push({ seq, k, total: sol.cost + fixed, sol, fixed });
    }
  }
  if (candidates.length === 0) {
    return { feasible: false, reason: "Ninguna estrategia cumple las reglas y la vida de los neumáticos" };
  }
  candidates.sort((a, b) => a.total - b.total || a.k - b.k);
  const best = candidates[0];

  const toPlan = (c) => {
    let lap = lapStart;
    const stints = c.seq.map((compound, i) => {
      const n = c.sol.lengths[i];
      const s = { compound, laps: n, fromLap: lap + 1, toLap: lap + n, startAge: i === 0 ? startAge : 0 };
      lap += n;
      return s;
    });
    return {
      stops: c.k,
      sequence: c.seq.join("-"),
      total: round3(c.total),
      delta: round3(c.total - best.total),
      stints,
      pitLaps: stints.slice(0, -1).map((s) => s.toLap),
    };
  };

  const bestByStops = {};
  for (const c of candidates) if (!(c.k in bestByStops)) bestByStops[c.k] = toPlan(c);

  // Ventanas de parada del plan óptimo
  const windows = best.sol.byStopLap.map((row, k) => {
    const lapsOk = [];
    for (let m = 1; m < row.length; m++) {
      if (row[m] !== Number.POSITIVE_INFINITY && row[m] + best.fixed - best.total <= tol + 1e-9) lapsOk.push(lapStart + m);
    }
    const optimal = toPlan(best).pitLaps[k];
    return { stop: k + 1, optimalLap: optimal, from: Math.min(...lapsOk), to: Math.max(...lapsOk), laps: lapsOk };
  });

  return {
    feasible: true,
    best: toPlan(best),
    bestByStops,
    ranking: candidates.slice(0, p.top || 10).map(toPlan),
    windows,
    assumptions: [
      "Tiempos relativos: el ritmo base y el combustible son iguales para todas las estrategias",
      "Sin tráfico ni Safety Car",
      `Ventana de parada: vueltas que cuestan menos de ${tol} s frente a la óptima`,
    ],
  };
}

export function round3(x) {
  return Math.round(x * 1000) / 1000;
}
