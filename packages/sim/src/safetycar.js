// Ventana de Safety Car: si sale el SC o el VSC al final de la vuelta L, ¿cuánto se gana parando?
// Compara, para el resto de la carrera, "parar ahora con la pérdida reducida" frente a "seguir con el mejor plan".

import { optimizeStrategy, round3 } from "./strategy.js";

// Estado del coche al terminar la vuelta L siguiendo un plan
export function stateAfterLap(plan, L) {
  const used = [];
  let stopsDone = 0;
  for (const s of plan.stints) {
    if (!used.includes(s.compound)) used.push(s.compound);
    if (L <= s.toLap) {
      return { compound: s.compound, age: s.startAge + (L - s.fromLap + 1), used, stopsDone };
    }
    stopsDone++;
  }
  const last = plan.stints[plan.stints.length - 1];
  return { compound: last.compound, age: last.startAge + last.laps, used, stopsDone: plan.stops };
}

/**
 * @param {object} p  mismos parámetros que optimizeStrategy (carrera completa) +
 *   pitLossSC, pitLossVSC (s perdidos al parar bajo SC / VSC)
 *   plan (opcional): plan que sigue el coche; por defecto el óptimo sin Safety Car
 */
export function safetyCarWindow(p) {
  const base = p.plan ? { best: p.plan, feasible: true } : optimizeStrategy(p);
  if (!base.feasible) return base;
  const plan = base.best;
  const rules = { ...(p.rules || {}) };
  const names = Object.keys(p.compounds);
  const rows = [];

  for (let L = 1; L < p.laps; L++) {
    const st = stateAfterLap(plan, L);
    const remaining = p.laps - L;
    const stay = optimizeStrategy({
      laps: remaining,
      lapStart: L,
      pitLoss: p.pitLoss,
      compounds: p.compounds,
      rules: { ...rules, minStops: 0 },
      start: { compound: st.compound, age: st.age },
      used: st.used,
    });

    let bestPit = null;
    for (const c of names) {
      const after = optimizeStrategy({
        laps: remaining,
        lapStart: L,
        pitLoss: p.pitLoss,
        // El primer stint de un plan no suma calentamiento: la vuelta de salida va bajo SC/VSC.
        // Las paradas posteriores sí lo suman.
        compounds: p.compounds,
        rules: { ...rules, minStops: 0 },
        start: { compound: c, age: 0 },
        used: [...st.used, c],
      });
      if (!after.feasible) continue;
      if (!bestPit || after.best.total < bestPit.total) bestPit = { compound: c, total: after.best.total, plan: after.best };
    }

    const row = { lap: L, onTyre: st.compound, tyreAge: st.age };
    if (stay.feasible && bestPit) {
      for (const [mode, loss] of [["SC", p.pitLossSC], ["VSC", p.pitLossVSC]]) {
        if (typeof loss !== "number") continue;
        const gain = stay.best.total - (bestPit.total + loss);
        row[`gain${mode}`] = round3(gain);
        row[`pit${mode}`] = gain > 0;
      }
      row.pitCompound = bestPit.compound;
    } else {
      row.note = "Sin estrategia válida desde aquí";
    }
    rows.push(row);
  }

  return {
    feasible: true,
    plan,
    rows,
    assumptions: [
      "Ganancia = tiempo del resto de carrera siguiendo sin parar ahora − tiempo parando ahora con la pérdida reducida",
      "No modela que el Safety Car agrupa al pelotón ni el tráfico al salir de boxes",
      "Ganancia positiva: compensa parar",
    ],
  };
}
