// Calculadora de campeonato. Aritmética pura con la clasificación pública y los puntos en juego.

/**
 * @param {Array<{name:string, points:number}>} standings
 * @param {Array<{sprint?:boolean}>} remaining   eventos que quedan (cada uno = una carrera, + sprint si lo hay)
 * @param {{race:number[], sprint:number[], verified:boolean}} points
 */
export function championship(standings, remaining, points) {
  if (!points?.verified) throw new Error("Sistema de puntos sin verificar para esta serie");
  if (!standings?.length) throw new Error("Falta la clasificación");
  const maxRace = points.race[0] || 0;
  const maxSprint = points.sprint[0] || 0;
  const maxLeft = remaining.reduce((s, e) => s + maxRace + (e.sprint ? maxSprint : 0), 0);

  const sorted = [...standings].sort((a, b) => b.points - a.points);
  const leader = sorted[0];
  const second = sorted[1];

  const rows = sorted.map((d, i) => {
    const maxPossible = d.points + maxLeft;
    let status = "in_fight";
    if (i === 0 && second && d.points - second.points > maxLeft) status = "champion";
    else if (i === 0 && second && d.points - second.points === maxLeft) status = "champion_unless_tiebreak";
    else if (i > 0 && maxPossible < leader.points) status = "eliminated";
    else if (i > 0 && maxPossible === leader.points) status = "tiebreak_only";
    return {
      position: i + 1,
      name: d.name,
      points: d.points,
      gapToLeader: leader.points - d.points,
      maxPossible,
      status,
    };
  });

  return { pointsLeft: maxLeft, events: remaining.length, rows };
}

const pts = (table, pos) => (pos >= 1 && pos <= table.length ? table[pos - 1] : 0);

/**
 * ¿Se decide el título en el próximo evento? Matriz posición del líder × posición del rival (solo la carrera;
 * si el evento tiene sprint, pasa los puntos de la sprint ya sumados en standings).
 * Devuelve para cada combinación si el líder es campeón al acabar ese evento.
 */
export function clinchMatrix(leader, rival, remaining, points, maxPos = 11) {
  const [, ...after] = remaining; // eventos posteriores al próximo
  const maxAfter = after.reduce((s, e) => s + points.race[0] + (e.sprint ? points.sprint[0] : 0), 0);
  const matrix = [];
  for (let lp = 1; lp <= maxPos; lp++) {
    const row = [];
    for (let rp = 1; rp <= maxPos; rp++) {
      if (lp === rp && lp < maxPos) {
        row.push(null); // no pueden acabar en la misma posición
        continue;
      }
      const lead = leader.points + pts(points.race, lp) - (rival.points + pts(points.race, rp));
      row.push(lead > maxAfter ? "campeon" : lead === maxAfter ? "desempate" : "no");
    }
    matrix.push(row);
  }
  return { positions: maxPos, lastLabel: `P${maxPos}+ / sin puntos`, maxAfter, matrix };
}
