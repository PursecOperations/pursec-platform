// Race Card: junta las salidas de los simuladores en los 6 módulos de la tarjeta.
// Parte gratis (Paddock): pit windows y grid. Resto: Trackside.
// Se guarda en posts.data_free y posts_trackside.data (kind = 'race_card').

import { optimizeStrategy } from "./strategy.js";
import { safetyCarWindow } from "./safetycar.js";
import { undercutTable } from "./undercut.js";

/**
 * @param {object} p
 * @param {number} p.laps
 * @param {number} p.pitLoss, p.pitLossSC, p.pitLossVSC
 * @param {object} p.compounds         compuestos de seco
 * @param {object} p.rules             reglas de la serie
 * @param {Array<{position:number, code:string, startTyre?:string}>} p.grid
 * @param {Array<{season:number, safety_cars:number, virtual_safety_cars:number, red_flags:number, winning_strategy?:string}>} [p.history]
 * @param {Array<{name:string, note?:string}>} [p.overtakingZones]
 * @param {Array<{ahead:string, behind:string, a:object, b:object, newA:string, newB:string}>} [p.battles]
 * @param {object} [p.wetCompounds]    compuestos de lluvia (I, W) si se quiere el módulo de lluvia
 * @param {string[]} p.sources         fuentes de los datos usados
 */
export function buildRaceCard(p) {
  const strat = optimizeStrategy({ laps: p.laps, pitLoss: p.pitLoss, compounds: p.compounds, rules: p.rules });
  if (!strat.feasible) throw new Error(strat.reason);

  const sc = safetyCarWindow({ ...p, plan: strat.best });
  const scRows = sc.rows.filter((r) => r.gainSC !== undefined);
  const pitUnderSC = scRows.filter((r) => r.pitSC).map((r) => r.lap);

  const history = (p.history || []).slice().sort((a, b) => b.season - a.season);
  const seasons = history.length;
  const withSC = history.filter((h) => (h.safety_cars || 0) > 0).length;

  const free = {
    pit_windows: {
      best: { sequence: strat.best.sequence, stops: strat.best.stops, pitLaps: strat.best.pitLaps },
      windows: strat.windows.map(({ stop, optimalLap, from, to }) => ({ stop, optimalLap, from, to })),
      alternatives: Object.values(strat.bestByStops).map(({ stops, sequence, pitLaps, delta }) => ({ stops, sequence, pitLaps, delta })),
    },
    grid: (p.grid || []).map(({ position, code }) => ({ position, code })),
  };

  const trackside = {
    grid_tyre_strategy: (p.grid || []).map((g) => ({ ...g })),
    safety_car_history: {
      seasons,
      racesWithSC: withSC,
      rate: seasons ? Math.round((withSC / seasons) * 100) / 100 : null,
      bySeason: history,
      pitUnderSCFromLap: pitUnderSC.length ? Math.min(...pitUnderSC) : null,
      pitUnderSCLaps: pitUnderSC,
      gainByLap: scRows.map(({ lap, gainSC, gainVSC }) => ({ lap, gainSC, gainVSC })),
    },
    overtaking_zones: p.overtakingZones || [],
    key_battles: (p.battles || []).map((b) => ({
      ahead: b.ahead,
      behind: b.behind,
      undercutMaxGap: undercutTable({ compounds: p.compounds, pitLoss: p.pitLoss, a: b.a, b: b.b, newA: b.newA, newB: b.newB }),
    })),
    wet_race: p.wetCompounds
      ? optimizeStrategy({ laps: p.laps, pitLoss: p.pitLoss, compounds: p.wetCompounds, rules: { ...p.rules, mustUseTwoCompounds: false } }).bestByStops
      : null,
  };

  return {
    free,
    trackside,
    assumptions: [...strat.assumptions, ...sc.assumptions],
    sources: p.sources || [],
  };
}
