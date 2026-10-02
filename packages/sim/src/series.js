// Reglas por serie. Lo que no está verificado con fuente lleva verified: false y no se usa en la web
// hasta completarlo.

export const FAMILIES = {
  pit_tyres: "Paradas para cambiar neumáticos",
  no_stops: "Sin paradas en seco: elección de neumático para toda la carrera",
  endurance: "Stints por combustible y cambio de piloto (v2, no incluido)",
};

const F1_POINTS = {
  race: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
  sprint: [8, 7, 6, 5, 4, 3, 2, 1],
  source: "https://racingnews365.com/f1-rules-explained",
  verified: true,
  note: "Sin punto por vuelta rápida desde 2025",
};

const MOTOGP_POINTS = {
  race: [25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  sprint: [12, 9, 7, 6, 5, 4, 3, 2, 1],
  source: "https://www.motogp.com/en/blog-articles/what-is-the-motogp-points-system-all-you-need-to-know/517281",
  verified: true,
};

const PENDING_POINTS = { race: [], sprint: [], source: null, verified: false };

export const SERIES = {
  F1: {
    family: "pit_tyres",
    rules: { minStops: 0, maxStops: 3, mustUseTwoCompounds: true, maxStintLaps: null },
    points: F1_POINTS,
  },
  F2: { family: "pit_tyres", rules: { minStops: 0, maxStops: 2, mustUseTwoCompounds: false, maxStintLaps: null, verified: false }, points: PENDING_POINTS },
  F3: { family: "pit_tyres", rules: { minStops: 0, maxStops: 1, mustUseTwoCompounds: false, maxStintLaps: null, verified: false }, points: PENDING_POINTS },
  IndyCar: { family: "pit_tyres", rules: { minStops: 0, maxStops: 4, mustUseTwoCompounds: false, maxStintLaps: null, verified: false }, points: PENDING_POINTS },
  MotoGP: { family: "no_stops", rules: { minStops: 0, maxStops: 0, mustUseTwoCompounds: false }, points: MOTOGP_POINTS },
  Moto2: { family: "no_stops", rules: { minStops: 0, maxStops: 0, mustUseTwoCompounds: false }, points: PENDING_POINTS },
  Moto3: { family: "no_stops", rules: { minStops: 0, maxStops: 0, mustUseTwoCompounds: false }, points: PENDING_POINTS },
  WEC: { family: "endurance", rules: null, points: PENDING_POINTS },
  IMSA: { family: "endurance", rules: null, points: PENDING_POINTS },
  GT3: { family: "endurance", rules: null, points: PENDING_POINTS },
};

export function seriesInfo(name) {
  const s = SERIES[name];
  if (!s) throw new Error(`Serie desconocida: ${name}`);
  return s;
}
