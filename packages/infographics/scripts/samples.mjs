// Genera SVG de ejemplo con DATOS FICTICIOS (pilotos y tiempos inventados) para revisar el diseño.
import { writeFile, mkdir } from "node:fs/promises";
import { strategyMap, stintPace, positionsChart, championshipChart } from "../src/index.js";

const out = process.argv[2] || "samples";
await mkdir(out, { recursive: true });
const note = "ejemplo con datos ficticios";

const drivers = [
  { code: "AAA", stints: [{ compound: "M", laps: 24 }, { compound: "H", laps: 32 }] },
  { code: "BBB", stints: [{ compound: "M", laps: 21 }, { compound: "H", laps: 35 }] },
  { code: "CCC", stints: [{ compound: "H", laps: 33 }, { compound: "M", laps: 23 }] },
  { code: "DDD", stints: [{ compound: "S", laps: 14 }, { compound: "M", laps: 20 }, { compound: "H", laps: 22 }] },
  { code: "EEE", stints: [{ compound: "M", laps: 18 }, { compound: "M", laps: 18 }, { compound: "S", laps: 20 }] },
  { code: "FFF", stints: [{ compound: "H", laps: 56 }] },
];
await writeFile(`${out}/1-strategy-map.svg`, strategyMap({ title: "Estrategias de carrera", subtitle: "GP de ejemplo · 56 vueltas", laps: 56, drivers, source: note }));

const lapsFor = (base, deg, pit, n) =>
  Array.from({ length: n }, (_, i) => {
    const lap = i + 1;
    if (lap === pit) return { lap, time: null };
    const age = lap < pit ? lap : lap - pit;
    return { lap, time: base + deg * age + (lap < pit ? 0 : -0.4) + ((lap * 37) % 7) * 0.02 };
  });
await writeFile(`${out}/2-stint-pace.svg`, stintPace({
  title: "Ritmo por stint",
  subtitle: "Tiempo por vuelta · vueltas de boxes excluidas",
  drivers: [
    { code: "AAA", laps: lapsFor(95.2, 0.05, 24, 56) },
    { code: "BBB", laps: lapsFor(95.4, 0.045, 21, 56) },
    { code: "CCC", laps: lapsFor(95.8, 0.03, 33, 56) },
  ],
  source: note,
}));

const pos = (start, changes, n = 30) => {
  let p = start;
  return Array.from({ length: n }, (_, i) => (changes[i + 1] ? (p = changes[i + 1]) : p));
};
await writeFile(`${out}/3-positions.svg`, positionsChart({
  title: "Posiciones vuelta a vuelta",
  subtitle: "Primeras 30 vueltas",
  drivers: [
    { code: "AAA", positions: pos(1, { 12: 2, 18: 1 }) },
    { code: "BBB", positions: pos(2, { 12: 1, 18: 3 }) },
    { code: "CCC", positions: pos(3, { 18: 2 }) },
    { code: "DDD", positions: pos(4, { 9: 6, 22: 5 }) },
    { code: "EEE", positions: pos(5, { 9: 4, 22: 4 }) },
    { code: "FFF", positions: pos(6, { 9: 5, 22: 6 }) },
  ],
  highlight: ["AAA", "BBB"],
  source: note,
}));

await writeFile(`${out}/4-championship.svg`, championshipChart({
  title: "Lucha por el título",
  subtitle: "Tras la ronda 17 · quedan 6 carreras y 1 sprint",
  pointsLeft: 158,
  rows: [
    { position: 1, name: "AAA", points: 342, status: "in_fight" },
    { position: 2, name: "BBB", points: 318, status: "in_fight" },
    { position: 3, name: "CCC", points: 251, status: "in_fight" },
    { position: 4, name: "DDD", points: 190, status: "in_fight" },
    { position: 5, name: "EEE", points: 160, status: "eliminated" },
    { position: 6, name: "FFF", points: 98, status: "eliminated" },
  ],
  source: note,
}));
console.log("ok");
