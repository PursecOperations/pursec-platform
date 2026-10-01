// PURSEC — generador de infografías (SVG determinista, sin IA, sin dependencias).
// Formato por defecto 1080×1350 (vertical, redes). Para PNG: renderizar el SVG con un navegador (scripts/render.mjs).

export const BRAND = {
  bg: "#050409",
  panel: "#0E0B16",
  grid: "#231C33",
  purple: "#A855F7",
  green: "#22C55E",
  text: "#EFE7FF",
  muted: "#A79FBA",
  fontTitle: "'Saira', 'Saira Condensed', sans-serif",
  fontMono: "'JetBrains Mono', ui-monospace, monospace",
};

// Colores de compuesto (convención de lectura, no marca)
export const COMPOUND_COLORS = {
  S: "#EF4444", SOFT: "#EF4444",
  M: "#EAB308", MEDIUM: "#EAB308",
  H: "#EFE7FF", HARD: "#EFE7FF",
  I: "#22C55E", INTER: "#22C55E",
  W: "#3B82F6", WET: "#3B82F6",
};

// Paleta categórica para pilotos (sobre fondo negro, distinguibles entre sí)
export const SERIES_COLORS = ["#A855F7", "#22C55E", "#F59E0B", "#38BDF8", "#F472B6", "#EFE7FF", "#FB7185", "#A3E635"];

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

const r1 = (x) => Math.round(x * 10) / 10;

function frame({ width = 1080, height = 1350, tag, title, subtitle, source }, body) {
  const fontsCss = `@import url('https://fonts.googleapis.com/css2?family=Saira:ital,wdth,wght@1,125,800&amp;family=JetBrains+Mono:wght@400;600&amp;display=swap');`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}">
<style>${fontsCss}
.t{font-family:${BRAND.fontTitle};font-style:italic;font-weight:800;font-stretch:125%;fill:${BRAND.text}}
.m{font-family:${BRAND.fontMono};fill:${BRAND.muted}}
.v{font-family:${BRAND.fontMono};fill:${BRAND.text};font-weight:600}
</style>
<rect width="${width}" height="${height}" fill="${BRAND.bg}"/>
<rect x="60" y="64" width="${esc(tag).length * 13 + 28}" height="36" rx="4" fill="none" stroke="${BRAND.purple}" stroke-width="2"/>
<text x="74" y="89" class="m" font-size="20" style="fill:${BRAND.purple}">${esc(tag)}</text>
<text x="60" y="168" class="t" font-size="56">${esc(title)}</text>
${subtitle ? `<text x="60" y="212" class="m" font-size="24">${esc(subtitle)}</text>` : ""}
${body}
<line x1="60" y1="${height - 110}" x2="${width - 60}" y2="${height - 110}" stroke="${BRAND.grid}" stroke-width="2"/>
<text x="60" y="${height - 62}" class="t" font-size="40" style="fill:${BRAND.purple}">PURSEC</text>
<text x="${width - 60}" y="${height - 70}" class="m" font-size="18" text-anchor="end">${esc(source ? `Fuente: ${source}` : "")}</text>
<text x="${width - 60}" y="${height - 46}" class="m" font-size="18" text-anchor="end">pursec.club</text>
</svg>`;
}

// 1 · Mapa de estrategia: una barra por piloto, un tramo por stint
export function strategyMap({ tag = "STRATEGY MAP", title, subtitle, laps, drivers, source }) {
  const x0 = 170, x1 = 1020, y0 = 280;
  const rowH = Math.min(110, (1350 - 110 - 150 - y0) / Math.max(drivers.length, 1));
  const sx = (lap) => x0 + ((x1 - x0) * lap) / laps;
  let body = "";
  for (const tick of ticks(laps)) {
    body += `<line x1="${r1(sx(tick))}" y1="${y0 - 12}" x2="${r1(sx(tick))}" y2="${r1(y0 + rowH * drivers.length)}" stroke="${BRAND.grid}" stroke-width="1"/>`;
    body += `<text x="${r1(sx(tick))}" y="${y0 - 22}" class="m" font-size="18" text-anchor="middle">${tick}</text>`;
  }
  drivers.forEach((d, i) => {
    const y = y0 + i * rowH;
    body += `<text x="${x0 - 20}" y="${r1(y + rowH / 2 + 9)}" class="v" font-size="26" text-anchor="end">${esc(d.code)}</text>`;
    let lap = 0;
    for (const s of d.stints) {
      const color = COMPOUND_COLORS[s.compound] || BRAND.muted;
      const w = Math.max(sx(lap + s.laps) - sx(lap) - 3, 1);
      const bh = Math.min(rowH * 0.64, 56);
      body += `<rect x="${r1(sx(lap) + 1.5)}" y="${r1(y + (rowH - bh) / 2)}" width="${r1(w)}" height="${r1(bh)}" rx="4" fill="${color}"/>`;
      if (w > 34) body += `<text x="${r1(sx(lap) + w / 2 + 1.5)}" y="${r1(y + rowH / 2 + 7)}" class="v" font-size="18" text-anchor="middle" style="fill:${BRAND.bg}">${esc(s.compound)} ${s.laps}</text>`;
      lap += s.laps;
    }
  });
  body += legendCompounds(drivers, y0 + rowH * drivers.length + 40);
  return frame({ tag, title, subtitle, source }, body);
}

function legendCompounds(drivers, y) {
  const used = [...new Set(drivers.flatMap((d) => d.stints.map((s) => s.compound)))];
  return used
    .map((c, i) => `<rect x="${60 + i * 150}" y="${y}" width="22" height="22" rx="4" fill="${COMPOUND_COLORS[c] || BRAND.muted}"/><text x="${92 + i * 150}" y="${y + 18}" class="m" font-size="18">${esc(c)}</text>`)
    .join("");
}

// 2 · Ritmo por stint: tiempos de vuelta por piloto
export function stintPace({ tag = "STINT PACE", title, subtitle, drivers, source, unit = "s" }) {
  const x0 = 140, x1 = 1020, y0 = 280, y1 = 1120;
  const all = drivers.flatMap((d) => d.laps.filter((p) => p.time != null));
  const maxLap = Math.max(...all.map((p) => p.lap));
  const minT = Math.min(...all.map((p) => p.time));
  const maxT = Math.max(...all.map((p) => p.time));
  const pad = (maxT - minT) * 0.08 || 0.5;
  const lo = minT - pad, hi = maxT + pad;
  const sx = (l) => x0 + ((x1 - x0) * (l - 1)) / Math.max(maxLap - 1, 1);
  const sy = (t) => y0 + ((y1 - y0) * (t - lo)) / (hi - lo); // más abajo = más lento
  let body = "";
  for (const t of niceRange(lo, hi, 6)) {
    body += `<line x1="${x0}" y1="${r1(sy(t))}" x2="${x1}" y2="${r1(sy(t))}" stroke="${BRAND.grid}" stroke-width="1"/>`;
    body += `<text x="${x0 - 14}" y="${r1(sy(t) + 6)}" class="m" font-size="18" text-anchor="end">${fmtLapTime(t)}</text>`;
  }
  for (const tick of ticks(maxLap)) body += `<text x="${r1(sx(tick))}" y="${y1 + 34}" class="m" font-size="18" text-anchor="middle">${tick}</text>`;
  body += `<text x="${x1}" y="${y1 + 64}" class="m" font-size="18" text-anchor="end">vuelta · arriba = más rápido</text>`;
  drivers.forEach((d, i) => {
    const color = d.color || SERIES_COLORS[i % SERIES_COLORS.length];
    // Un trazo por tramo continuo (las vueltas de boxes y SC vienen como time: null)
    let path = "";
    let open = false;
    for (const p of d.laps) {
      if (p.time == null) { open = false; continue; }
      path += `${open ? "L" : "M"}${r1(sx(p.lap))},${r1(sy(p.time))}`;
      open = true;
    }
    body += `<path d="${path}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round"/>`;
    const last = [...d.laps].reverse().find((p) => p.time != null);
    body += `<rect x="${60 + i * 170}" y="${y1 + 92}" width="22" height="6" fill="${color}"/><text x="${90 + i * 170}" y="${y1 + 101}" class="v" font-size="20">${esc(d.code)}</text>`;
    if (last) body += `<circle cx="${r1(sx(last.lap))}" cy="${r1(sy(last.time))}" r="5" fill="${color}"/>`;
  });
  return frame({ tag, title, subtitle, source }, body);
}

// 3 · Posiciones vuelta a vuelta (bump chart)
export function positionsChart({ tag = "LAP BY LAP", title, subtitle, drivers, highlight = [], source }) {
  const x0 = 120, x1 = 960, y0 = 280, y1 = 1150;
  const laps = Math.max(...drivers.map((d) => d.positions.length));
  const n = drivers.length;
  const sx = (i) => x0 + ((x1 - x0) * i) / Math.max(laps - 1, 1);
  const sy = (p) => y0 + ((y1 - y0) * (p - 1)) / Math.max(n - 1, 1);
  let body = "";
  for (let p = 1; p <= n; p++) body += `<text x="${x0 - 24}" y="${r1(sy(p) + 6)}" class="m" font-size="16" text-anchor="end">P${p}</text>`;
  const ordered = [...drivers].sort((a, b) => (highlight.includes(a.code) ? 1 : 0) - (highlight.includes(b.code) ? 1 : 0));
  ordered.forEach((d) => {
    const hi = highlight.length === 0 || highlight.includes(d.code);
    const idx = drivers.indexOf(d);
    const color = hi ? d.color || SERIES_COLORS[(highlight.indexOf(d.code) >= 0 ? highlight.indexOf(d.code) : idx) % SERIES_COLORS.length] : "#4A3F63";
    const pts = d.positions.map((p, i) => (p == null ? null : `${r1(sx(i))},${r1(sy(p))}`));
    let path = "";
    let open = false;
    for (const pt of pts) {
      if (!pt) { open = false; continue; }
      path += `${open ? "L" : "M"}${pt}`;
      open = true;
    }
    body += `<path d="${path}" fill="none" stroke="${color}" stroke-width="${hi ? 4 : 2}" stroke-linejoin="round"/>`;
    const lastIdx = d.positions.map((p) => p != null).lastIndexOf(true);
    if (lastIdx >= 0) {
      body += `<text x="${r1(sx(lastIdx) + 14)}" y="${r1(sy(d.positions[lastIdx]) + 7)}" class="${hi ? "v" : "m"}" font-size="${hi ? 20 : 16}">${esc(d.code)}</text>`;
    }
  });
  for (const tick of ticks(laps)) body += `<text x="${r1(sx(tick - 1))}" y="${y1 + 36}" class="m" font-size="18" text-anchor="middle">${tick}</text>`;
  return frame({ tag, title, subtitle, source }, body);
}

// 4 · Clasificación del campeonato: puntos actuales y máximo posible
export function championshipChart({ tag = "CHAMPIONSHIP", title, subtitle, rows, pointsLeft, source }) {
  const x0 = 250, x1 = 960, y0 = 290;
  const top = rows.slice(0, 12);
  const max = Math.max(...top.map((r) => r.points + (pointsLeft || 0)));
  const rowH = Math.min(110, (1350 - 110 - 170 - y0) / Math.max(top.length, 1));
  const bh = Math.min(rowH * 0.6, 56);
  const by = (y) => y + (rowH - bh) / 2;
  const ty = (y) => y + rowH / 2 + 8;
  const sx = (v) => x0 + ((x1 - x0) * v) / max;
  const leader = top[0]?.points ?? 0;
  let body = "";
  body += `<line x1="${r1(sx(leader))}" y1="${y0 - 16}" x2="${r1(sx(leader))}" y2="${r1(y0 + rowH * top.length)}" stroke="${BRAND.purple}" stroke-width="2" stroke-dasharray="6 6"/>`;
  body += `<text x="${r1(sx(leader))}" y="${y0 - 26}" class="m" font-size="16" text-anchor="middle" style="fill:${BRAND.purple}">líder ${leader}</text>`;
  top.forEach((r, i) => {
    const y = y0 + i * rowH;
    const alive = !["eliminated"].includes(r.status);
    body += `<text x="60" y="${r1(ty(y))}" class="m" font-size="22">${r.position ?? i + 1}</text>`;
    body += `<text x="${x0 - 18}" y="${r1(ty(y))}" class="v" font-size="24" text-anchor="end" style="fill:${alive ? BRAND.text : BRAND.muted}">${esc(r.name)}</text>`;
    if (pointsLeft) body += `<rect x="${x0}" y="${r1(by(y))}" width="${r1(sx(r.points + pointsLeft) - x0)}" height="${r1(bh)}" rx="4" fill="none" stroke="${alive ? "#3A2F52" : "#221B2E"}" stroke-width="2" stroke-dasharray="4 4"/>`;
    body += `<rect x="${x0}" y="${r1(by(y))}" width="${r1(Math.max(sx(r.points) - x0, 1))}" height="${r1(bh)}" rx="4" fill="${i === 0 ? BRAND.purple : alive ? BRAND.green : BRAND.grid}"/>`;
    body += `<text x="${r1(sx(r.points) - 12)}" y="${r1(ty(y))}" class="v" font-size="22" text-anchor="end" style="fill:${i === 0 || alive ? BRAND.bg : BRAND.muted}">${r.points}</text>`;
  });
  if (pointsLeft != null) {
    const y = y0 + rowH * top.length + 50;
    body += `<text x="60" y="${y}" class="v" font-size="22">Quedan ${pointsLeft} puntos en juego</text>`;
    body += `<text x="60" y="${y + 34}" class="m" font-size="20">Trazo discontinuo = máximo posible · gris = sin opciones de título</text>`;
  }
  return frame({ tag, title, subtitle, source }, body);
}

// ------------------------------------------------------------------ utilidades
export function ticks(n) {
  const step = n <= 20 ? 5 : n <= 60 ? 10 : 20;
  const out = [1];
  for (let t = step; t < n; t += step) out.push(t);
  if (out[out.length - 1] !== n) out.push(n);
  return out;
}

function niceRange(lo, hi, count) {
  const raw = (hi - lo) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) || raw;
  const out = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Math.round(v * 1000) / 1000);
  return out;
}

export function fmtLapTime(s) {
  const m = Math.floor(s / 60);
  const rest = s - m * 60;
  return m > 0 ? `${m}:${rest.toFixed(1).padStart(4, "0")}` : rest.toFixed(1);
}
