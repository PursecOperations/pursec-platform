// Modelo de ritmo por neumático. Todos los tiempos son DIFERENCIAS en segundos respecto a una
// vuelta de referencia: la parte común a todas las estrategias (combustible, ritmo base) se cancela.
//
// Compuesto: { offset, deg, deg2?, maxLife?, warmup? }
//   offset  s/vuelta más lento que el compuesto más rápido, con neumático nuevo
//   deg     s que se pierden por cada vuelta de uso (lineal)
//   deg2    término cuadrático opcional (caída de rendimiento al final de vida)
//   maxLife vueltas máximas razonables
//   warmup  s perdidos en la vuelta de salida con el neumático frío

const sumTo = (m) => (m < 0 ? 0 : (m * (m + 1)) / 2);
const sumSqTo = (m) => (m < 0 ? 0 : (m * (m + 1) * (2 * m + 1)) / 6);

// Diferencia de una vuelta con el neumático en su vuelta número `age` (0 = primera vuelta)
export function lapDelta(c, age) {
  return c.offset + c.deg * age + (c.deg2 || 0) * age * age;
}

// Suma de lapDelta para `n` vueltas empezando con edad `a0`
export function stintTime(c, n, a0 = 0) {
  if (n <= 0) return 0;
  const last = a0 + n - 1;
  const s1 = sumTo(last) - sumTo(a0 - 1);
  const s2 = sumSqTo(last) - sumSqTo(a0 - 1);
  return n * c.offset + c.deg * s1 + (c.deg2 || 0) * s2;
}

export function validateCompounds(compounds) {
  const names = Object.keys(compounds || {});
  if (names.length === 0) throw new Error("Hace falta al menos un compuesto");
  for (const n of names) {
    const c = compounds[n];
    for (const k of ["offset", "deg"]) {
      if (typeof c[k] !== "number" || !Number.isFinite(c[k])) throw new Error(`Compuesto ${n}: falta ${k}`);
    }
    if (c.deg < 0 || (c.deg2 || 0) < 0) throw new Error(`Compuesto ${n}: la degradación no puede ser negativa`);
  }
  return names;
}
