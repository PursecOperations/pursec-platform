import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { strategyMap, stintPace, positionsChart, championshipChart, esc, ticks, fmtLapTime } from "../src/index.js";

const wellFormed = (svg) => {
  // Python estándar como validador XML (sin dependencias de npm)
  execFileSync("python3", ["-c", "import sys,xml.etree.ElementTree as E;E.fromstring(sys.stdin.read())"], { input: svg });
};
const clean = (svg) => {
  assert.ok(!/NaN|undefined|Infinity/.test(svg), "valores vacíos en el SVG");
  wellFormed(svg);
};

test("las 4 infografías son SVG válidos y sin valores vacíos (datos ficticios)", () => {
  clean(strategyMap({ title: "T", laps: 20, drivers: [{ code: "A<B", stints: [{ compound: "M", laps: 10 }, { compound: "H", laps: 10 }] }], source: "x & y" }));
  clean(stintPace({ title: "T", drivers: [{ code: "A", laps: [{ lap: 1, time: 90 }, { lap: 2, time: null }, { lap: 3, time: 90.5 }] }] }));
  clean(positionsChart({ title: "T", drivers: [{ code: "A", positions: [1, 2, null] }, { code: "B", positions: [2, 1, 1] }], highlight: ["A"] }));
  clean(championshipChart({ title: "T", rows: [{ name: "A", points: 10 }, { name: "B", points: 0, status: "eliminated" }], pointsLeft: 25 }));
});

test("utilidades", () => {
  assert.equal(esc(`<a href="x">&'`), "&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
  assert.deepEqual(ticks(56), [1, 10, 20, 30, 40, 50, 56]);
  assert.equal(fmtLapTime(95.43), "1:35.4");
});
