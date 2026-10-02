// Undercut / overcut entre dos coches.
// A va delante de B por `gap` segundos. B para al final de la vuelta L; A para k vueltas después.
// Se comparan ambos al final de la vuelta de salida de A.

import { lapDelta } from "./pace.js";
import { round3 } from "./strategy.js";

function lapsOn(c, startAge, n, firstLapWarmup) {
  let t = 0;
  for (let i = 0; i < n; i++) t += lapDelta(c, startAge + i) + (i === 0 && firstLapWarmup ? c.warmup || 0 : 0);
  return t;
}

/**
 * @param {object} p
 * @param {number} p.gap              s que A lleva de ventaja sobre B (>0)
 * @param {object} p.compounds        mismo formato que el simulador de estrategia
 * @param {number} p.pitLoss
 * @param {{compound:string, age:number}} p.a   neumático de A al empezar la vuelta en la que para B
 * @param {{compound:string, age:number}} p.b   neumático de B
 * @param {string} p.newA  compuesto que monta A
 * @param {string} p.newB  compuesto que monta B
 * @param {number} [p.k=1] vueltas que A sigue en pista tras parar B
 * @param {number} [p.paceBminusA=0] ritmo base de B menos el de A (s/vuelta; negativo = B más rápido)
 */
export function undercut(p) {
  const k = p.k ?? 1;
  const C = p.compounds;
  for (const n of [p.a.compound, p.b.compound, p.newA, p.newB]) if (!C[n]) throw new Error(`Compuesto desconocido: ${n}`);
  if (!(k >= 1)) throw new Error("k debe ser ≥ 1");
  const pace = p.paceBminusA || 0;
  const span = k + 2; // vuelta de parada de B, k vueltas, vuelta de salida de A

  // A: 1 + k vueltas con neumático viejo, para, 1 vuelta de salida con neumático nuevo
  const tA = lapsOn(C[p.a.compound], p.a.age, k + 1, false) + p.pitLoss + lapsOn(C[p.newA], 0, 1, true);
  // B: 1 vuelta con neumático viejo y para, k + 1 vueltas con neumático nuevo (la primera, de salida)
  const tB = lapsOn(C[p.b.compound], p.b.age, 1, false) + p.pitLoss + lapsOn(C[p.newB], 0, k + 1, true) + pace * span;

  const swing = tA - tB; // lo que B le recorta a A
  const gapAfter = p.gap - swing; // >0: A sigue delante
  return {
    gapBefore: round3(p.gap),
    swing: round3(swing),
    gapAfter: round3(gapAfter),
    winner: gapAfter > 0 ? "A" : gapAfter < 0 ? "B" : "empate",
    undercutWorks: gapAfter < 0,
    maxGapForUndercut: round3(swing),
    assumptions: ["Sin tráfico al salir de boxes", "Misma pérdida en boxes para los dos coches"],
  };
}

// Tabla para la Race Card: gap máximo con el que funciona el undercut si A responde 1, 2 o 3 vueltas después
export function undercutTable(p) {
  return [1, 2, 3].map((k) => ({ k, maxGap: undercut({ ...p, k, gap: 0 }).maxGapForUndercut }));
}
