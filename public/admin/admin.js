/* PURSEC — panel privado (/admin). Sin dependencias.
   Aquí no hay ninguna clave secreta ni ningún dato: la página solo pide el enlace mágico a Supabase Auth
   y luego consulta al Worker de la tienda con el token de sesión. El Worker comprueba en cada petición
   que el email es el del administrador; si no lo es, no devuelve nada.
   Todo lo que viene de la base de datos (nombres, notas, direcciones) se escapa antes de pintarlo. */
(() => {
"use strict";

const SUPABASE_URL = "https://uymgrzlbpaqorbwajhfh.supabase.co";
const SUPABASE_KEY = "sb_publishable_aKv-FR4J-9LYHz45Np-u_Q_TUoF9ybe"; // clave publicable (pública por diseño)
// En pursec.club habla con el Worker de producción; en la vista previa de una rama
// (<rama>-pursec-platform...workers.dev) habla con la vista previa de esa misma rama de pursec-shop.
const PREVIEW_HOST = /^([a-z0-9-]+)-pursec-platform\.pursec-telemetry-hq\.workers\.dev$/;
const API = PREVIEW_HOST.test(location.hostname)
  ? `https://${location.hostname.replace(PREVIEW_HOST, "$1")}-pursec-shop.pursec-telemetry-hq.workers.dev/admin`
  : "https://pursec-shop.pursec-telemetry-hq.workers.dev/admin";
const SESSION_KEY = "pursec_admin_session";
const TZ = "Europe/Madrid";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* =================================================================== HTML seguro */
class Safe { constructor(s) { this.s = s; } toString() { return this.s; } }
const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ESC[c]);
const raw = (s) => new Safe(String(s));
const part = (v) => (v instanceof Safe ? v.s : Array.isArray(v) ? v.map(part).join("") : v === null || v === undefined || v === false ? "" : esc(v));
const html = (strs, ...vals) => new Safe(strs.reduce((o, s, i) => o + s + (i < vals.length ? part(vals[i]) : ""), ""));
const safeUrl = (u) => (/^https?:\/\/[^\s"'<>]+$/i.test(String(u || "")) ? String(u) : "");

/* =================================================================== formatos */
const nf = new Intl.NumberFormat("es-ES");
const eurF = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const compactF = new Intl.NumberFormat("es-ES", { notation: "compact", maximumFractionDigits: 1 });
const money = (n) => eurF.format(Number(n) || 0);
const int = (n) => nf.format(Number(n) || 0);
const fdt = (iso) => (iso ? new Date(iso).toLocaleString("es-ES", { timeZone: TZ, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");
const fdate = (iso) => (iso ? new Date(iso).toLocaleDateString("es-ES", { timeZone: TZ, day: "2-digit", month: "short", year: "numeric" }) : "—");
const fday = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString("es-ES", { timeZone: "UTC", day: "numeric", month: "short" });
const fmonth = (m) => new Date(`${m}-01T12:00:00Z`).toLocaleDateString("es-ES", { timeZone: "UTC", month: "short", year: "2-digit" });
const today = () => new Date().toLocaleDateString("sv-SE", { timeZone: TZ });
const shortId = (id) => `#${String(id || "").slice(0, 8).toUpperCase()}`;
const hoursLabel = (h) => (h >= 48 ? `${Math.floor(h / 24)} d` : `${h} h`);

function deltaPct(cur, prev) {
  if (!prev) return cur > 0 ? html`<span class="delta up">nuevo</span>` : html`<span class="delta flat">—</span>`;
  const p = Math.round(((cur - prev) / prev) * 100);
  const cls = p > 0 ? "up" : p < 0 ? "down" : "flat";
  return html`<span class="delta ${cls}">${p > 0 ? "▲" : p < 0 ? "▼" : "■"} ${Math.abs(p)}% vs 30 d previos</span>`;
}
const deltaAbs = (n, label) => (n === null || n === undefined ? html`<span class="delta flat">—</span>` : html`<span class="delta ${n > 0 ? "up" : n < 0 ? "down" : "flat"}">${n > 0 ? "▲ +" : n < 0 ? "▼ " : "■ "}${int(n)} ${label}</span>`);

/* =================================================================== componentes */
const STATUS = {
  paid: ["Pagado", "info"], packed: ["Empaquetado", "info"], shipped: ["Enviado", "good"], delivered: ["Entregado", "good"],
  canceled: ["Cancelado", "muted"], refunded: ["Reembolsado", "warn"], failed: ["Fallido", "crit"], submitted: ["En curso", "muted"], in_production: ["En curso", "muted"],
};
const badge = (text, tone = "") => html`<span class="badge ${tone}">${text}</span>`;
const statusBadge = (s) => { const [t, tone] = STATUS[s] || [s, "muted"]; return badge(t, tone); };
const empty = (title, text = "") => html`<div class="empty"><strong>${title}</strong>${text}</div>`;
const card = (title, body, { count, extra } = {}) => html`<section class="card"><div class="card-head"><h2>${title}${count !== undefined ? html`<span class="count">${count}</span>` : ""}</h2>${extra || ""}</div>${body}</section>`;
const kpi = (label, value, sub) => html`<div class="card kpi"><div class="label">${label}</div><div class="value">${value}</div><div class="sub">${sub}</div></div>`;
const banner = (tone, text, extra = "") => html`<div class="banner ${tone}" role="note"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/></svg><p>${text}${extra}</p></div>`;
const table = (heads, rows, { cls = "" } = {}) => html`<div class="tbl ${cls}"><table><thead><tr>${heads.map((h) => (Array.isArray(h) ? html`<th scope="col" class="${h[1]}">${h[0]}</th>` : html`<th scope="col">${h}</th>`))}</tr></thead><tbody>${rows}</tbody></table></div>`;

/* =================================================================== sesión (enlace mágico de Supabase) */
const loadSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } };
const saveSession = (s) => { try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch { /* sin almacenamiento */ } };
const clearSession = () => { try { localStorage.removeItem(SESSION_KEY); } catch { /* nada */ } };

function takeHashSession() {
  const p = new URLSearchParams(location.hash.replace(/^#\/?/, ""));
  const err = p.get("error_code") || p.get("error");
  if (err) {
    history.replaceState(null, "", location.pathname);
    return { error: err === "otp_expired" || err === "access_denied" ? "El enlace ha caducado o ya se usó. Pide uno nuevo." : "No se pudo completar el acceso. Pide un enlace nuevo." };
  }
  const at = p.get("access_token");
  if (!at) return null;
  history.replaceState(null, "", `${location.pathname}#/overview`);
  return { access_token: at, refresh_token: p.get("refresh_token"), expires_at: Date.now() + (Number(p.get("expires_in")) || 3600) * 1000 };
}

async function refreshSession(s) {
  if (!s?.refresh_token) throw new Error("sin refresh");
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST", headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: s.refresh_token }),
  });
  if (!res.ok) throw new Error("refresh");
  const d = await res.json();
  const next = { access_token: d.access_token, refresh_token: d.refresh_token || s.refresh_token, expires_at: Date.now() + (Number(d.expires_in) || 3600) * 1000 };
  saveSession(next);
  return next;
}

async function accessToken() {
  let s = loadSession();
  if (!s) return null;
  if (s.expires_at - Date.now() < 60000) { try { s = await refreshSession(s); } catch { clearSession(); return null; } }
  return s.access_token;
}

class AuthError extends Error {}

async function api(path, { method = "GET", body } = {}) {
  const token = await accessToken();
  if (!token) { showLogin("La sesión ha caducado. Pide un enlace nuevo."); throw new AuthError("sin sesión"); }
  let res;
  try {
    res = await fetch(API + path, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  } catch { throw new Error("No se pudo conectar con el servidor."); }
  if (res.status === 401) { clearSession(); showLogin("La sesión ha caducado. Pide un enlace nuevo."); throw new AuthError("401"); }
  if (res.status === 403) { clearSession(); showLogin("Esta cuenta no tiene acceso al panel.", "err"); throw new AuthError("403"); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

/* =================================================================== login */
function showLogin(msg = "", tone = "") {
  $("#app").hidden = true;
  $("#drawer").hidden = true;
  $("#login").hidden = false;
  const m = $("#login-msg");
  m.className = `login-msg ${tone}`;
  m.textContent = msg;
  $("#login-email").focus({ preventScroll: true });
}

function bindLogin() {
  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = $("#login-email"), btn = $("#login-btn"), msg = $("#login-msg");
    const email = input.value.trim();
    msg.className = "login-msg";
    if (!email || !input.checkValidity()) { msg.className = "login-msg err"; msg.textContent = "Escribe un email válido."; return; }
    btn.disabled = true;
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/otp?redirect_to=${encodeURIComponent(`${location.origin}/admin/`)}`, {
        method: "POST", headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ email, create_user: false }),
      });
      if (res.status === 429) { msg.className = "login-msg err"; msg.textContent = "Espera un minuto antes de pedir otro enlace."; }
      else { msg.className = "login-msg ok"; msg.textContent = "Si ese email tiene acceso, te hemos enviado el enlace. Ábrelo en este mismo navegador."; }
    } catch { msg.className = "login-msg err"; msg.textContent = "No se pudo enviar. Revisa la conexión."; }
    finally { btn.disabled = false; }
  });
}

async function logout() {
  const token = (loadSession() || {}).access_token;
  clearSession();
  if (token) fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: "POST", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` } }).catch(() => {});
  showLogin("Sesión cerrada.", "ok");
}

/* =================================================================== gráficos (SVG propio) */
const charts = new Map();
let chartSeq = 0;
function chart(spec) {
  const id = `c${++chartSeq}`;
  charts.set(id, spec);
  return raw(`<div class="chart" data-cid="${id}"></div>`);
}
function drawCharts() {
  $$(".chart[data-cid]").forEach((el) => {
    const spec = charts.get(el.dataset.cid);
    if (spec) el.innerHTML = spec(Math.floor(el.clientWidth) || 320);
  });
}

function niceMax(v) {
  if (!(v > 0)) return 1;
  const e = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * e >= v) return m * e;
  return 10 * e;
}
const tipAttr = (s) => esc(s);

function barPath(x, y, w, h, r) {
  r = Math.max(0, Math.min(r, h, w / 2));
  return `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`;
}

function barSvg(width, items, { ints = false, h = 210, yFmt = (v) => compactF.format(v), tip, color = "var(--red)" }) {
  const W = Math.max(260, width), padL = 44, padR = 6, padT = 10, padB = 24;
  const pw = W - padL - padR, ph = h - padT - padB;
  const top = Math.max(0, ...items.map((i) => i.v));
  const max = ints ? (top <= 2 ? 2 : top <= 4 ? 4 : niceMax(top)) : niceMax(top);
  const bw = pw / items.length, gap = Math.min(3, bw * 0.25), barW = Math.max(2, bw - gap);
  const y = (v) => padT + ph - (v / max) * ph;
  const step = Math.max(1, Math.ceil(54 / bw));
  let g = "";
  [0, 0.5, 1].forEach((f) => {
    const yy = y(max * f);
    g += `<line class="${f === 0 ? "base-l" : "grid-l"}" x1="${padL}" x2="${W - padR}" y1="${yy}" y2="${yy}"/><text x="${padL - 8}" y="${yy + 4}" text-anchor="end">${esc(yFmt(max * f))}</text>`;
  });
  items.forEach((it, i) => {
    const x = padL + i * bw + gap / 2, bh = (it.v / max) * ph;
    if (bh > 0) g += `<path d="${barPath(x, y(it.v), barW, bh, 4)}" fill="${color}"/>`;
    g += `<rect class="hit" x="${padL + i * bw}" y="${padT}" width="${bw}" height="${ph}" data-tip="${tipAttr(tip(it))}"/><rect class="hov" x="${padL + i * bw}" y="${padT}" width="${bw}" height="${ph}"/>`;
    if ((items.length - 1 - i) % step === 0) g += `<text x="${x + barW / 2}" y="${h - 6}" text-anchor="middle">${esc(it.lab)}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" role="img" aria-label="Gráfico de barras">${g}</svg>`;
}

function lineSvg(width, series, { h = 230, yFmt = (v) => compactF.format(v), labelFmt = fday }) {
  const W = Math.max(280, width), labels = W >= 520 && series.length <= 4;
  const padL = 46, padR = labels ? 76 : 14, padT = 12, padB = 26;
  const pw = W - padL - padR, ph = h - padT - padB;
  const all = series.flatMap((s) => s.pts);
  let t0 = Math.min(...all.map((p) => p.t)), t1 = Math.max(...all.map((p) => p.t));
  if (t0 === t1) { t0 -= 864e5; t1 += 864e5; }
  let lo = Math.min(...all.map((p) => p.v)), hi = Math.max(...all.map((p) => p.v));
  if (lo === hi) { lo = Math.max(0, lo * 0.8); hi = hi * 1.2 || 1; }
  const span = hi - lo; lo = Math.max(0, lo - span * 0.12); hi += span * 0.12;
  const x = (t) => padL + ((t - t0) / (t1 - t0)) * pw, y = (v) => padT + ph - ((v - lo) / (hi - lo)) * ph;
  let g = "";
  [0, 1 / 3, 2 / 3, 1].forEach((f) => {
    const v = lo + (hi - lo) * f, yy = y(v);
    g += `<line class="${f === 0 ? "base-l" : "grid-l"}" x1="${padL}" x2="${W - padR}" y1="${yy}" y2="${yy}"/><text x="${padL - 8}" y="${yy + 4}" text-anchor="end">${esc(yFmt(Math.round(v)))}</text>`;
  });
  const times = [...new Set(all.map((p) => p.t))].sort((a, b) => a - b);
  const nLab = Math.max(2, Math.min(times.length, Math.floor(pw / 90)));
  for (let i = 0; i < nLab; i++) {
    const t = nLab === 1 ? times[0] : t0 + ((t1 - t0) * i) / (nLab - 1);
    g += `<text x="${Math.min(W - padR - 18, Math.max(padL + 12, x(t)))}" y="${h - 6}" text-anchor="middle">${esc(labelFmt(new Date(t).toISOString().slice(0, 10)))}</text>`;
  }
  const ends = [];
  series.forEach((s) => {
    if (!s.pts.length) return;
    g += `<path d="${s.pts.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)}`).join("")}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    s.pts.forEach((p, i) => { if (s.pts.length <= 14 || i === s.pts.length - 1) g += `<circle cx="${x(p.t).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="4" fill="${s.color}" stroke="var(--panel)" stroke-width="2"/>`; });
    ends.push({ name: s.name, color: s.color, y: y(s.pts[s.pts.length - 1].v) });
  });
  if (labels) {
    ends.sort((a, b) => a.y - b.y);
    for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 13) ends[i].y = ends[i - 1].y + 13;
    ends.forEach((e) => { g += `<text x="${W - padR + 8}" y="${e.y + 4}" style="fill:var(--text)">${esc(e.name)}</text>`; });
  }
  times.forEach((t, i) => {
    const a = i ? (x(times[i - 1]) + x(t)) / 2 : padL, b = i < times.length - 1 ? (x(t) + x(times[i + 1])) / 2 : W - padR;
    const lines = [labelFmt(new Date(t).toISOString().slice(0, 10))];
    series.forEach((s) => { const p = s.pts.find((q) => q.t === t); if (p) lines.push(`{${s.color}}${s.name}: ${yFmt(p.v)}`); });
    g += `<rect class="hit" x="${a}" y="${padT}" width="${Math.max(2, b - a)}" height="${ph}" data-tip="${tipAttr(lines.join("|"))}"/><rect class="hov" x="${a}" y="${padT}" width="${Math.max(2, b - a)}" height="${ph}"/>`;
  });
  return `<svg viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" role="img" aria-label="Gráfico de líneas">${g}</svg>`;
}

const tableView = (head, rows) => html`<details class="tv"><summary>Ver como tabla</summary>${table(head, rows)}</details>`;

/* --- tooltip global */
const tipEl = $("#tip");
function showTip(text, x, y) {
  const [first, ...rest] = text.split("|");
  tipEl.innerHTML = `<b>${esc(first)}</b>` + rest.map((l) => { const m = /^\{(#[0-9a-fA-F]{6}|var\(--s[1-4]\))\}(.*)$/.exec(l); return m ? `<div><span class="sw" style="background:${m[1]}"></span>${esc(m[2])}</div>` : `<div>${esc(l)}</div>`; }).join("");
  tipEl.hidden = false;
  const r = tipEl.getBoundingClientRect();
  tipEl.style.left = `${Math.min(innerWidth - r.width - 8, Math.max(8, x + 14))}px`;
  tipEl.style.top = `${Math.min(innerHeight - r.height - 8, Math.max(8, y + 14))}px`;
}
document.addEventListener("pointermove", (e) => { const t = e.target.closest?.("[data-tip]"); if (t) showTip(t.dataset.tip, e.clientX, e.clientY); else tipEl.hidden = true; });
document.addEventListener("pointerdown", (e) => { const t = e.target.closest?.("[data-tip]"); if (t) showTip(t.dataset.tip, e.clientX, e.clientY); });
document.addEventListener("scroll", () => { tipEl.hidden = true; }, { passive: true, capture: true });

/* =================================================================== estado y navegación */
const ICON = {
  overview: "M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10",
  orders: "M6 3h12l2 4v13H4V7l2-4zM4 7h16M9 11h6",
  shipping: "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a1.5 1.5 0 1 0 0-.01M17 19a1.5 1.5 0 1 0 0-.01",
  products: "M12 3l9 5-9 5-9-5 9-5zM3 8v8l9 5 9-5V8M12 13v8",
  customers: "M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0",
  finance: "M4 19h16M6 16V9M11 16V5M16 16v-5M21 16V8",
  social: "M4 12a8 8 0 0 1 16 0M7.5 12a4.5 4.5 0 0 1 9 0M12 12v.01M5 21l3-6M19 21l-3-6",
  ecosystem: "M12 3v4M12 17v4M3 12h4M17 12h4M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8",
};
const SECTIONS = [
  ["overview", "Resumen"], ["orders", "Pedidos"], ["shipping", "Envíos"], ["products", "Productos y stock"],
  ["customers", "Clientes y lista"], ["finance", "Finanzas"], ["social", "Redes"], ["ecosystem", "Ecosistema"],
];
const state = { mode: null, badges: {}, orders: [], nav: 0, current: "overview", ui: { chip: "all", q: "" } };
let after = null;

function renderNav() {
  $("#nav").innerHTML = SECTIONS.map(([id, label]) => {
    const n = state.badges[id];
    return `<a href="#/${id}" ${id === state.current ? 'aria-current="page"' : ""}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICON[id]}"/></svg><span>${esc(label)}</span>${n ? `<span class="badge crit" aria-label="${n} pendientes">${n}</span>` : ""}</a>`;
  }).join("");
}

function setMode(mode) {
  state.mode = mode;
  const p = $("#mode");
  if (mode === "test") { p.className = "pill test"; p.textContent = "Stripe · modo prueba"; p.hidden = false; }
  else if (mode === "live") { p.className = "pill live"; p.textContent = "Stripe · modo real"; p.hidden = false; }
  else p.hidden = true;
}

function skeleton() {
  return raw('<div class="grid kpis"><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div></div><div class="skel" style="min-height:260px"></div>');
}

async function go(section, { quiet = false } = {}) {
  if (!VIEWS[section]) section = "overview";
  state.current = section;
  const id = ++state.nav;
  $("#title").textContent = SECTIONS.find((s) => s[0] === section)[1];
  document.title = `PURSEC — ${$("#title").textContent}`;
  renderNav();
  closeMenu();
  const view = $("#view");
  if (!quiet) view.innerHTML = String(skeleton());
  charts.clear();
  try {
    const data = await api(`/${section}`);
    if (id !== state.nav) return;
    if (data.mode) setMode(data.mode);
    after = null;
    view.innerHTML = String(VIEWS[section](data));
    drawCharts();
    if (after) after(data);
    $("#updated").textContent = `Actualizado ${new Date().toLocaleTimeString("es-ES", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })}`;
    if (section === "overview") { state.badges.shipping = data.to_ship.over24h || 0; renderNav(); }
  } catch (err) {
    if (err instanceof AuthError || id !== state.nav) return;
    view.innerHTML = String(card("No se pudo cargar", html`<p class="note">${err.message}</p><p><button class="btn-sm" id="retry" type="button">Reintentar</button></p>`));
    $("#retry")?.addEventListener("click", () => go(section));
  }
}

/* =================================================================== vistas */
const VIEWS = {};

/* ---------- Resumen */
VIEWS.overview = (d) => {
  const a = d.alerts || [];
  const lvl = { critical: ["Urgente", "crit"], warning: ["Atención", "warn"], info: ["Info", "info"] };
  const hasSales = d.daily.some((x) => x.revenue > 0);
  const hasWait = d.waitlist.total > 0;
  return html`
  <div class="grid kpis">
    ${kpi("Ventas · 30 días", money(d.last30.revenue), html`${deltaPct(d.last30.revenue, d.last30.prev_revenue)}<br>IVA incl. · base ${money(d.last30.base)}`)}
    ${kpi("Pedidos · 30 días", int(d.last30.orders), html`${deltaPct(d.last30.orders, d.last30.prev_orders)}<br>Ticket medio ${money(d.last30.aov)}`)}
    ${kpi("Por enviar", int(d.to_ship.count), d.to_ship.over24h ? badge(`${d.to_ship.over24h} con más de 24 h`, "crit") : d.to_ship.count ? badge("Dentro de plazo", "good") : "Todo enviado")}
    ${kpi("Lista de espera", int(d.waitlist.total), deltaAbs(d.waitlist.last7, "esta semana"))}
    ${kpi("Valor del stock", money(d.stock.value_eur), html`${int(d.stock.units)} uds${d.stock.missing_cost ? html` · ${d.stock.missing_cost} sin coste` : ""}`)}
    ${kpi("Gastos · 30 días", money(d.expenses30), "Base, sin IVA")}
  </div>
  ${card("Necesita tu atención", a.length
    ? html`<div class="alerts">${a.map((x) => html`<div class="alert">${badge(lvl[x.level][0], lvl[x.level][1])}<span>${x.text}</span>${x.go ? html`<a href="#/${x.go}">Ver →</a>` : ""}</div>`)}</div>`
    : html`<div class="alert">${badge("Todo en orden", "good")}<span>No hay avisos ahora mismo.</span></div>`)}
  <div class="grid cols-2">
    ${card("Ventas por día · 30 días", hasSales
      ? html`${chart((w) => barSvg(w, d.daily.map((x) => ({ v: x.revenue, lab: fday(x.d), d: x })), { yFmt: (v) => `${compactF.format(v)} €`, tip: (i) => `${fday(i.d.d)}|${money(i.d.revenue)}|${int(i.d.orders)} pedido(s)` }))}${tableView(["Día", ["Ventas", "right"], ["Pedidos", "right"]], d.daily.filter((x) => x.orders).map((x) => html`<tr><td>${fday(x.d)}</td><td class="right num">${money(x.revenue)}</td><td class="right num">${int(x.orders)}</td></tr>`))}`
      : empty("Aún no hay ventas", "Los pedidos aparecerán aquí en cuanto entre el primer pago."))}
    ${card("Altas en la lista · 30 días", hasWait
      ? chart((w) => barSvg(w, d.waitlist.daily.map((x) => ({ v: x.n, lab: fday(x.d), d: x })), { ints: true, yFmt: (v) => String(Math.round(v)), color: "var(--s1)", tip: (i) => `${fday(i.d.d)}|${int(i.d.n)} alta(s)` }))
      : empty("La lista está vacía", "Las altas del formulario de la web aparecerán aquí."))}
  </div>
  ${card("Últimos pedidos", d.recent_orders.length
    ? orderTable(d.recent_orders)
    : empty("Todavía no hay pedidos"), { extra: d.recent_orders.length ? html`<a class="link-btn" href="#/orders">Ver todos →</a>` : "" })}`;
};

function orderTable(orders) {
  state.orders = orders;
  return table(["Fecha", "Pedido", "Cliente", ["Total", "right"], "Estado"], orders.map((o) => html`<tr class="click" tabindex="0" data-oid="${o.id}"><td>${fdt(o.created_at)}</td><td class="id">${shortId(o.id)}</td><td><span class="trunc" style="display:block">${o.name || o.email || "—"}</span></td><td class="right num">${money(o.amount)}</td><td>${statusBadge(o.status)}</td></tr>`));
}

/* ---------- Pedidos */
const hasNoteIssue = (o) => /AVISO env[ií]o|Packlink \d{4}-/.test(o.notes || "");
const CHIPS = [
  ["all", "Todos", () => true],
  ["ship", "Por enviar", (o) => ["paid", "packed"].includes(o.status)],
  ["sent", "Enviados", (o) => ["shipped", "delivered"].includes(o.status)],
  ["issues", "Con incidencias", (o) => o.stock_issue || hasNoteIssue(o) || o.status === "failed"],
  ["closed", "Cancelados / reembolsos", (o) => ["canceled", "refunded"].includes(o.status)],
];

VIEWS.orders = (d) => {
  state.orders = d.orders;
  after = () => { bindOrderRows(); drawOrdersTable(); $$("[data-chip]").forEach((b) => b.addEventListener("click", () => { state.ui.chip = b.dataset.chip; $$("[data-chip]").forEach((c) => c.setAttribute("aria-pressed", String(c === b))); drawOrdersTable(); })); $("#oq")?.addEventListener("input", (e) => { state.ui.q = e.target.value; drawOrdersTable(); }); };
  if (!d.orders.length) return html`${empty("Todavía no hay pedidos", "Cuando Stripe cobre, el pedido aparece aquí con su dirección, artículos y estado de envío.")}`;
  return html`
  <div class="bar">
    <div class="chips" role="group" aria-label="Filtro de estado">${CHIPS.map(([id, label, fn]) => html`<button class="chip" type="button" data-chip="${id}" aria-pressed="${state.ui.chip === id}">${label}<span class="n">${d.orders.filter(fn).length}</span></button>`)}</div>
    <label class="sr" for="oq">Buscar pedido</label><input class="search" id="oq" type="search" placeholder="Buscar por cliente, email o nº" value="${state.ui.q}" autocomplete="off">
  </div>
  ${d.truncated ? banner("info", "Se muestran los 300 pedidos más recientes.") : ""}
  <section class="card"><div id="orders-table"></div></section>`;
};

function drawOrdersTable() {
  const box = $("#orders-table");
  if (!box) return;
  const fn = CHIPS.find((c) => c[0] === state.ui.chip)[2];
  const q = state.ui.q.trim().toLowerCase();
  const list = state.orders.filter(fn).filter((o) => !q || [o.name, o.email, o.id, shortId(o.id)].some((v) => String(v || "").toLowerCase().includes(q)));
  box.innerHTML = String(list.length ? table(["Fecha", "Pedido", "Cliente", "País", ["Uds", "right"], ["Total", "right"], "Estado", "Envío"], list.map((o) => html`<tr class="click" tabindex="0" data-oid="${o.id}"><td>${fdt(o.created_at)}</td><td class="id">${shortId(o.id)}</td><td><span class="trunc" style="display:block">${o.name || "—"}<span class="sub">${o.email || ""}</span></span></td><td>${o.ship_to.country || "—"}</td><td class="right num">${int(o.items.reduce((t, i) => t + Number(i.qty || 0), 0))}</td><td class="right num">${money(o.amount)}</td><td>${statusBadge(o.status)}${o.stock_issue ? html` ${badge("Sin stock", "crit")}` : ""}</td><td>${o.tracking_number ? "Con seguimiento" : o.packlink_ref ? "Borrador Packlink" : "—"}</td></tr>`)) : empty("Sin resultados", "Prueba con otro filtro o búsqueda."));
  bindOrderRows();
}

function bindOrderRows() {
  $$("tr[data-oid]").forEach((tr) => {
    const open = () => openOrder(state.orders.find((o) => o.id === tr.dataset.oid));
    tr.onclick = open;
    tr.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } };
  });
}

let lastFocus = null;
function openOrder(o) {
  if (!o) return;
  lastFocus = document.activeElement;
  const sh = o.ship_to;
  const pi = /^pi_[A-Za-z0-9]+$/.test(o.stripe_payment_intent || "") ? o.stripe_payment_intent : "";
  const stripeUrl = pi ? `https://dashboard.stripe.com/${state.mode === "test" ? "test/" : ""}payments/${pi}` : "";
  const track = safeUrl(o.tracking_url);
  $("#drawer-title").textContent = `Pedido ${shortId(o.id)}`;
  $("#drawer-body").innerHTML = String(html`
    <div>${statusBadge(o.status)} ${o.stock_issue ? badge("Pagado sin stock suficiente", "crit") : ""}<p class="note">${fdt(o.created_at)}</p></div>
    <div><h3>Cliente</h3><dl class="dl"><dt>Nombre</dt><dd>${o.name || "—"}</dd><dt>Email</dt><dd>${o.email || "—"}</dd><dt>Teléfono</dt><dd>${sh.phone || "—"}</dd></dl></div>
    <div><h3>Dirección de envío</h3><p class="pre">${[sh.name, sh.address1, sh.address2, `${sh.zip} ${sh.city}`.trim(), sh.country].filter(Boolean).join("\n") || "—"}</p></div>
    <div><h3>Artículos</h3>${o.items.length ? table(["Artículo", ["Uds", "right"], ["Precio", "right"]], o.items.map((i) => html`<tr><td>${i.name || "—"}<span class="sub">${[i.size, i.color].filter(Boolean).join(" · ")}</span></td><td class="right num">${int(i.qty)}</td><td class="right num">${money(i.unit_eur)}</td></tr>`)) : "—"}
      <dl class="dl" style="margin-top:10px"><dt class="total">Total cobrado (IVA incl.)</dt><dd class="total">${money(o.amount)}</dd></dl></div>
    <div><h3>Envío</h3><dl class="dl"><dt>Packlink</dt><dd>${o.packlink_ref || "—"}</dd><dt>Transportista</dt><dd>${o.carrier || "—"}</dd><dt>Seguimiento</dt><dd>${track ? html`<a href="${track}" target="_blank" rel="noopener noreferrer" style="color:var(--red-2)">${o.tracking_number || "Abrir"}</a>` : o.tracking_number || "—"}</dd><dt>Enviado</dt><dd>${o.shipped_at ? fdt(o.shipped_at) : "—"}</dd><dt>Coste etiqueta</dt><dd>${o.shipping_cost_eur === null ? "[PENDIENTE]" : money(o.shipping_cost_eur)}</dd></dl></div>
    ${o.notes ? html`<div><h3>Notas</h3><p class="pre">${o.notes}</p></div>` : ""}
    ${stripeUrl ? html`<a class="btn-sm" style="align-self:flex-start;text-decoration:none" href="${stripeUrl}" target="_blank" rel="noopener noreferrer">Abrir pago en Stripe ↗</a>` : ""}`);
  $("#drawer").hidden = false;
  $("#scrim").hidden = false;
  $("#drawer-close").focus();
}
function closeDrawer() {
  if ($("#drawer").hidden) return;
  $("#drawer").hidden = true;
  $("#scrim").hidden = true;
  lastFocus?.focus?.();
}

/* ---------- Envíos */
VIEWS.shipping = (d) => {
  const s = d.settings;
  return html`
  <div class="grid kpis">
    ${kpi("Por enviar", int(d.pending.length), d.pending.length ? "Pagados, pendientes de etiqueta" : "Todo enviado")}
    ${kpi("Más de 24 h", int(d.pending.filter((o) => o.hours >= 24).length), d.pending.some((o) => o.hours >= 24) ? badge("Prioridad", "crit") : badge("Al día", "good"))}
    ${kpi("Incidencias", int(d.problems.length), "Avisos de envío o errores de Packlink")}
    ${kpi("Enviados", int(d.shipped.length), "Últimos 30 pedidos")}
  </div>
  ${!s.packlink_key ? banner("warn", "Falta la clave de Packlink PRO en el Worker: no se crean borradores de envío al pagar.") : ""}
  ${!s.alert_webhook ? banner("info", "Falta el webhook de avisos (Make): los avisos de envío solo quedan en las notas del pedido.") : ""}
  ${card("Pendientes de enviar", d.pending.length
    ? table(["Pedido", "Cliente", "Destino", "Espera", "Packlink", "Aviso"], d.pending.map((o) => html`<tr class="click" tabindex="0" data-oid="${o.id}"><td class="id">${shortId(o.id)}</td><td>${o.name || o.email || "—"}</td><td>${[o.ship_to.city, o.ship_to.country].filter(Boolean).join(", ") || "—"}</td><td>${badge(hoursLabel(o.hours), o.hours >= 24 ? "crit" : "good")}</td><td class="id">${o.packlink_ref || "sin borrador"}</td><td>${o.stock_issue ? badge("Sin stock", "crit") : hasNoteIssue(o) ? badge("Ver notas", "warn") : "—"}</td></tr>`))
    : empty("No hay pedidos pendientes", "Los pagados aparecen aquí hasta que se marcan como enviados."))}
  ${d.problems.length ? card("Incidencias de envío", html`<div class="stack">${d.problems.map((o) => html`<div><strong>${shortId(o.id)}</strong> <span class="mute">· ${o.name || o.email || ""}</span><p class="pre">${o.notes}</p></div>`)}</div>`, { count: d.problems.length }) : ""}
  <div class="grid cols-2">
    ${card("Ajustes de envío", html`<dl class="dl"><dt>Precio al cliente</dt><dd>${s.price === null ? "[PENDIENTE]" : money(s.price)}</dd><dt>Gratis desde</dt><dd>${s.free_from ? money(s.free_from) : "—"}</dd><dt>Países</dt><dd>${s.countries.join(", ") || "—"}</dd><dt>Paquete</dt><dd>${s.parcel_cm ? `${s.parcel_cm} cm · ${s.kg_per_item} kg/prenda` : "—"}</dd><dt>Packlink PRO</dt><dd>${s.packlink_key ? badge("Clave configurada", "good") : badge("Sin clave", "crit")}</dd></dl><p class="note">Al pagar el cliente se crea el borrador en Packlink (depósito en oficina, entrega a domicilio, Correos si hay). La etiqueta la pagas e imprimes tú. <b>[PENDIENTE]</b> estado en vivo de cada envío en Packlink.</p>`)}
    ${card("Enviados recientes", d.shipped.length
      ? table(["Pedido", "Enviado", "Seguimiento"], d.shipped.slice(0, 10).map((o) => { const u = safeUrl(o.tracking_url); return html`<tr><td class="id">${shortId(o.id)}</td><td>${o.shipped_at ? fdate(o.shipped_at) : "—"}</td><td>${u ? html`<a href="${u}" target="_blank" rel="noopener noreferrer" style="color:var(--red-2)">${o.tracking_number || "Abrir"}</a>` : o.tracking_number || "—"}</td></tr>`; }))
      : empty("Aún no hay envíos"))}
  </div>`;
};
// la vista de envíos también abre el detalle de pedido
const shippingView = VIEWS.shipping;
VIEWS.shipping = (d) => { state.orders = [...d.pending, ...d.shipped, ...d.problems]; after = () => bindOrderRows(); return shippingView(d); };

/* ---------- Productos y stock */
VIEWS.products = (d) => {
  const s = d.summary;
  const REASON = { purchase: "Compra", sale: "Venta", return: "Devolución", adjustment: "Ajuste", damaged: "Dañado" };
  return html`
  <div class="grid kpis">
    ${kpi("Valor del stock", money(s.value_eur), `${int(s.units)} unidades · ${int(s.variants)} variantes`)}
    ${kpi("Agotadas", int(s.out), s.out ? badge("Revisar", "warn") : "Ninguna")}
    ${kpi("Poco stock", int(s.low), s.low ? badge("Reponer", "warn") : "Ninguna")}
    ${kpi("Sin coste", int(s.missing_cost), s.missing_cost ? "Faltan costes: el margen no es fiable" : "Costes completos")}
  </div>
  ${d.products.length
    ? d.products.map((p) => card(p.name, html`
      <div class="bar" style="margin-bottom:10px">${p.active ? badge("Activo", "good") : badge("Inactivo", "muted")}${p.coming_soon ? badge("Coming soon", "info") : ""}<span class="mute">${money(p.price_eur)} · ${p.category || "sin categoría"}</span></div>
      ${p.variants.length ? table(["Talla", "Color", "SKU", ["Stock", "right"], "Nivel", ["Coste ud.", "right"]], p.variants.map((v) => { const tone = v.stock === 0 ? "crit" : v.stock <= v.low_alert ? "warn" : ""; return html`<tr><td>${v.size}</td><td>${v.color}</td><td class="id">${v.sku || "—"}</td><td class="right num">${int(v.stock)}</td><td style="min-width:90px"><div class="meter ${tone}"><i style="width:${Math.min(100, (v.stock / Math.max(1, v.low_alert * 4)) * 100)}%"></i></div></td><td class="right num">${v.unit_cost === null ? "[PENDIENTE]" : money(v.unit_cost)}</td></tr>`; })) : empty("Sin variantes")}`, { count: `${p.variants.length} var.` }))
    : card("Catálogo", empty("Aún no hay productos en la tienda", "Cuando se creen, verás aquí cada prenda con su stock, coste y estado."))}
  ${card("Últimos movimientos de stock", d.movements.length
    ? table(["Fecha", "Prenda", "Motivo", ["Cambio", "right"], "Ref."], d.movements.map((m) => html`<tr><td>${fdt(m.created_at)}</td><td>${m.variant?.product?.name || "—"}<span class="sub">${[m.variant?.size, m.variant?.sku].filter(Boolean).join(" · ")}</span></td><td>${REASON[m.reason] || m.reason}</td><td class="right num">${m.delta > 0 ? "+" : ""}${int(m.delta)}</td><td class="id">${String(m.ref || "—").slice(0, 12)}</td></tr>`))
    : empty("Sin movimientos todavía"))}`;
};

/* ---------- Clientes y lista de espera */
VIEWS.customers = (d) => {
  const w = d.waitlist;
  return html`
  <div class="grid kpis">
    ${kpi("En la lista de espera", int(w.total), deltaAbs(w.last7, "esta semana"))}
    ${kpi("Últimos 7 días", int(w.last7), `Semana anterior: ${int(w.prev7)}`)}
    ${kpi("Clientes con compra", int(d.customers.length), "Pedidos pagados")}
    ${kpi("Ingresos por cliente", d.customers.length ? money(d.customers.reduce((t, c) => t + c.spent, 0) / d.customers.length) : money(0), "Media, IVA incl.")}
  </div>
  <div class="grid cols-2">
    ${card("Altas en la lista · 30 días", w.total ? chart((wd) => barSvg(wd, w.daily.map((x) => ({ v: x.n, lab: fday(x.d), d: x })), { ints: true, yFmt: (v) => String(Math.round(v)), color: "var(--s1)", tip: (i) => `${fday(i.d.d)}|${int(i.d.n)} alta(s)` })) : empty("La lista está vacía", "Las altas del formulario aparecerán aquí."))}
    ${card("De dónde vienen", w.total
      ? html`<div class="hbar">${w.by_source.map((r) => html`<div class="row"><span class="trunc" style="max-width:none">${r.key}</span><div class="track"><div class="fill" style="width:${(r.n / w.by_source[0].n) * 100}%"></div></div><span class="num">${int(r.n)}</span></div>`)}</div><p class="note">Idioma: ${w.by_lang.map((l) => `${l.key} ${l.n}`).join(" · ")}</p>`
      : empty("Sin datos"))}
  </div>
  ${card("Últimas altas", w.recent.length ? table(["Fecha", "Email", "Origen", "Idioma"], w.recent.map((r) => html`<tr><td>${fdt(r.created_at)}</td><td>${r.email}</td><td>${r.source || "—"}</td><td>${r.lang}</td></tr>`)) : empty("Nadie en la lista todavía"), { count: w.recent.length ? `últimas ${w.recent.length}` : undefined })}
  ${card("Clientes", d.customers.length ? table(["Cliente", "País", ["Pedidos", "right"], ["Gastado", "right"], "Último pedido"], d.customers.map((c) => html`<tr><td>${c.name || "—"}<span class="sub">${c.email}</span></td><td>${c.country || "—"}</td><td class="right num">${int(c.orders)}</td><td class="right num">${money(c.spent)}</td><td>${fdate(c.last)}</td></tr>`)) : empty("Aún no hay clientes", "Se crean solos con cada pedido pagado."))}`;
};

/* ---------- Finanzas */
const CAT = { stock: "Stock", shipping_labels: "Etiquetas de envío", packaging: "Embalaje", software: "Software", ads: "Anuncios", samples: "Muestras", fees: "Comisiones", other: "Otros" };
VIEWS.finance = (d) => {
  const p = d.pnl, st = d.stripe, o = d.oss;
  const hasRev = d.monthly.some((m) => m.revenue > 0);
  const neg = (n) => `−${money(Math.abs(n))}`;
  return html`
  ${state.mode === "test" ? banner("warn", "Stripe está en modo prueba: los importes de Stripe no son dinero real.") : ""}
  <div class="grid cols-2">
    ${card(`Cuenta del mes · ${fmonth(d.month)}`, html`
      <dl class="dl">
        <dt>Ingresos brutos (IVA incl.)</dt><dd>${money(p.gross)}</dd>
        <dt>IVA estimado (21 %)</dt><dd>${neg(p.vat)}</dd>
        <dt>Ingresos sin IVA</dt><dd>${money(p.base)}</dd>
        <dt>Coste de prendas</dt><dd>${neg(p.cogs)}</dd>
        <dt>Etiquetas de envío</dt><dd>${neg(p.labels)}</dd>
        <dt>Gastos (base)</dt><dd>${neg(p.expenses)}</dd>
        <dt>Comisiones Stripe (30 d)</dt><dd>${p.stripe_fees_30d === null ? "[PENDIENTE]" : neg(p.stripe_fees_30d)}</dd>
        <dt class="total">Resultado estimado</dt><dd class="total">${money(p.result)}</dd>
      </dl>
      <p class="note">${int(p.orders)} pedido(s) este mes.${p.cogs_missing_units ? html` <b>${p.cogs_missing_units} ud. sin coste unitario</b>: el resultado está inflado.` : ""}${p.labels_missing_orders ? html` <b>${p.labels_missing_orders} pedido(s) sin coste de etiqueta.</b>` : ""} Estimación de caja con IVA al 21 %; confirma con un gestor.</p>`)}
    ${card("Stripe", st.ok
      ? html`<dl class="dl"><dt>Modo</dt><dd>${st.mode === "live" ? badge("Real", "good") : badge("Prueba", "warn")}</dd>${st.balance ? html`<dt>Saldo disponible</dt><dd>${money(st.balance.available)}</dd><dt>Saldo pendiente</dt><dd>${money(st.balance.pending)}</dd>` : ""}${st.fees_30d ? html`<dt>Comisiones (30 d, reales)</dt><dd>${money(st.fees_30d.fee)}</dd><dt>Cobros analizados</dt><dd>${int(st.fees_30d.count)}${st.fees_30d.more ? "+" : ""}</dd>` : ""}<dt>Disputas recientes</dt><dd>${st.disputes?.length ? badge(`${st.disputes.length}`, "crit") : "0"}</dd><dt>Reembolsos recientes</dt><dd>${int(st.refunds?.length || 0)}</dd></dl>${st.partial_error ? html`<p class="note">Datos parciales: ${st.partial_error}</p>` : ""}${st.disputes?.length ? table(["Fecha", "Motivo", ["Importe", "right"], "Estado"], st.disputes.map((x) => html`<tr><td>${fdate(x.created)}</td><td>${x.reason}</td><td class="right num">${money(x.amount)}</td><td>${badge(x.status, "crit")}</td></tr>`)) : ""}`
      : banner("crit", `No se pudo leer Stripe: ${st.error || "error"}`))}
  </div>
  ${card("Ventas por mes · últimos 6 meses (IVA incl.)", hasRev
    ? html`${chart((w) => barSvg(w, d.monthly.map((m) => ({ v: m.revenue, lab: fmonth(m.m), m })), { yFmt: (v) => `${compactF.format(v)} €`, tip: (i) => `${fmonth(i.m.m)}|${money(i.m.revenue)}|${int(i.m.orders)} pedido(s)` }))}${tableView(["Mes", ["Ventas", "right"], ["Pedidos", "right"]], d.monthly.map((m) => html`<tr><td>${fmonth(m.m)}</td><td class="right num">${money(m.revenue)}</td><td class="right num">${int(m.orders)}</td></tr>`))}`
    : empty("Aún no hay ventas que mostrar"))}
  <div class="grid cols-2">
    ${card(`Gastos del mes por categoría`, d.expenses_by_category.length
      ? html`<div class="hbar">${d.expenses_by_category.map((r) => html`<div class="row"><span>${CAT[r.category] || r.category}</span><div class="track"><div class="fill" style="width:${(r.total / d.expenses_by_category[0].total) * 100}%"></div></div><span class="num">${money(r.total)}</span></div>`)}</div>`
      : empty("Sin gastos este mes", "Se leen de la tabla expenses de Supabase."))}
    ${card(`Umbral OSS · ${o.year}`, html`<p style="margin:0 0 8px"><strong class="num">${money(o.gross_other_eu)}</strong> <span class="mute">vendidos a otros países de la UE de ${money(o.limit)}</span></p><div class="meter ${o.pct >= 100 ? "crit" : o.pct >= 80 ? "warn" : ""}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(100, o.pct)}" aria-label="Umbral OSS"><i style="width:${Math.min(100, o.pct)}%"></i></div><p class="note">${o.pct}% del umbral. Al pasar de 10.000 €/año se aplica el IVA del país del cliente (OSS). Confirma con un gestor.</p>`)}
  </div>
  ${card("IVA por trimestre (estimado)", d.vat_table.length ? table(["Trimestre", ["Pedidos", "right"], ["Bruto", "right"], ["Base", "right"], ["IVA repercutido", "right"], ["IVA soportado (gastos)", "right"]], d.vat_table.map((r) => html`<tr><td>${r.q}</td><td class="right num">${int(r.orders)}</td><td class="right num">${money(r.gross)}</td><td class="right num">${money(r.base)}</td><td class="right num">${money(r.vat)}</td><td class="right num">${money(r.vat_deductible)}</td></tr>`)) : empty("Sin datos fiscales todavía"), { extra: d.ledger_csv.length ? html`<button class="btn-sm" id="csv" type="button">Exportar libro (CSV)</button>` : "" })}
  ${card("Gastos recientes", d.expenses.length ? table(["Fecha", "Categoría", "Concepto", "Proveedor", ["Base", "right"], ["IVA", "right"], ["Total", "right"]], d.expenses.map((e) => html`<tr><td>${fdate(e.expense_date)}</td><td>${CAT[e.category] || e.category}</td><td><span class="trunc" style="display:block">${e.concept}</span></td><td>${e.supplier || "—"}</td><td class="right num">${money(e.base_eur)}</td><td class="right num">${money(e.vat_eur)}</td><td class="right num">${money(e.total_eur)}</td></tr>`)) : empty("No hay gastos registrados", "La tabla expenses está vacía."))}
  ${d.legacy_ledger?.length ? card("Registros antiguos (tabla financial_ledger)", html`${table(["Fecha", "Tipo", "Concepto", ["Bruto", "right"]], d.legacy_ledger.map((r) => html`<tr><td>${fdate(r.tx_date)}</td><td class="id">${r.tx_type}</td><td>${r.concept}</td><td class="right num">${money(r.gross_eur)}</td></tr>`))}<p class="note">Esta tabla no está en las migraciones del repo y <b>no entra en los totales</b>. Decide si se pasa a expenses.</p>`) : ""}`;
};
function bindFinance(d) {
  $("#csv")?.addEventListener("click", () => {
    const head = "fecha,pedido,pais,bruto_eur,base_eur,iva_eur,coste_etiqueta_eur";
    const lines = d.ledger_csv.map((r) => [r.date, r.order, r.country, r.gross, r.base, r.vat, r.label_cost].join(","));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([[head, ...lines].join("\n")], { type: "text/csv;charset=utf-8" }));
    a.download = `pursec-libro-${today()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
}
const financeView = VIEWS.finance;
VIEWS.finance = (d) => { after = bindFinance; return financeView(d); };

/* ---------- Redes */
const PLAT = { instagram: ["Instagram", "var(--s1)", "#3987e5"], tiktok: ["TikTok", "var(--s2)", "#d95926"], youtube: ["YouTube", "var(--s3)", "#199e70"], x: ["X", "var(--s4)", "#c98500"] };
VIEWS.social = (d) => {
  const withData = d.platforms.filter((p) => p.series.length);
  const series = withData.map((p) => ({ name: PLAT[p.platform][0], color: PLAT[p.platform][2], pts: p.series.map((s) => ({ t: Date.parse(`${s.d}T12:00:00Z`), v: s.followers })) }));
  const anyViews = withData.some((p) => p.series.some((s) => s.views !== null && s.views !== undefined));
  after = () => bindSocialForm();
  return html`
  ${!d.ready ? banner("warn", "Falta crear la tabla social_stats en Supabase (migración 20261028140000_social_stats.sql). Hasta entonces no se pueden guardar mediciones.") : ""}
  <div class="grid kpis">${d.platforms.map((p) => {
    const [name, c] = PLAT[p.platform];
    return html`<div class="card kpi"><div class="label"><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${c};margin-right:7px"></span>${name}</div>${p.latest
      ? html`<div class="value">${int(p.latest.followers)}</div><div class="sub">${deltaAbs(p.delta_7d, "en 7 d")}<br>${p.latest.views !== null && p.latest.views !== undefined ? `${int(p.latest.views)} visualizaciones · ` : ""}${fday(p.latest.stat_date)}</div>`
      : html`<div class="value faint">—</div><div class="sub">Sin mediciones</div>`}</div>`;
  })}</div>
  ${card("Seguidores en el tiempo", series.length
    ? html`<div class="legend">${series.map((s) => html`<span><i style="background:${s.color}"></i>${s.name}</span>`)}</div>${chart((w) => lineSvg(w, series, {}))}${tableView(["Red", "Fecha", ["Seguidores", "right"], ["Visualizaciones", "right"], ["Interacciones", "right"], ["Posts", "right"]], withData.flatMap((p) => [...p.series].reverse().slice(0, 12).map((s) => html`<tr><td>${PLAT[p.platform][0]}</td><td>${fday(s.d)}</td><td class="right num">${int(s.followers)}</td><td class="right num">${s.views ?? "—"}</td><td class="right num">${s.interactions ?? "—"}</td><td class="right num">${s.posts ?? "—"}</td></tr>`)))}`
    : empty("Todavía no hay mediciones", "Añade la primera abajo. Con 2 o más fechas aparece la evolución."))}
  ${anyViews ? card("Visualizaciones por medición", html`${chart((w) => lineSvg(w, withData.map((p) => ({ name: PLAT[p.platform][0], color: PLAT[p.platform][2], pts: p.series.filter((s) => s.views !== null && s.views !== undefined).map((s) => ({ t: Date.parse(`${s.d}T12:00:00Z`), v: s.views })) })).filter((s) => s.pts.length), {}))}<p class="note">Usa siempre el mismo periodo al apuntar las visualizaciones (por ejemplo, últimos 28 días) para que se puedan comparar.</p>`) : ""}
  ${card("Añadir medición", html`
    <form id="social-form" class="form" novalidate>
      <div class="field"><label for="sf-p">Red</label><select id="sf-p">${Object.entries(PLAT).map(([k, v]) => html`<option value="${k}">${v[0]}</option>`)}</select></div>
      <div class="field"><label for="sf-d">Fecha</label><input id="sf-d" type="date" value="${today()}" max="${today()}" required></div>
      <div class="field"><label for="sf-f">Seguidores</label><input id="sf-f" type="number" min="0" step="1" inputmode="numeric" required></div>
      <div class="field"><label for="sf-v">Visualizaciones</label><input id="sf-v" type="number" min="0" step="1" inputmode="numeric"></div>
      <div class="field"><label for="sf-i">Interacciones</label><input id="sf-i" type="number" min="0" step="1" inputmode="numeric"></div>
      <div class="field"><label for="sf-o">Posts</label><input id="sf-o" type="number" min="0" step="1" inputmode="numeric"></div>
      <div class="field"><label>&nbsp;</label><button class="btn-sm primary" type="submit" id="sf-btn" ${d.ready ? "" : "disabled"}>Guardar</button></div>
    </form>
    <p id="sf-msg" class="form-msg" role="status"></p>
    <p class="note">Si repites red y fecha, se actualiza la medición. <b>[PENDIENTE]</b> sincronización automática desde las redes (API de cada plataforma o escenario de Make que escriba en social_stats).</p>`)}`;
};
function bindSocialForm() {
  const f = $("#social-form");
  if (!f) return;
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("#sf-msg"), btn = $("#sf-btn");
    const val = (id) => $(id).value.trim();
    const body = { platform: val("#sf-p"), stat_date: val("#sf-d"), followers: val("#sf-f"), views: val("#sf-v"), interactions: val("#sf-i"), posts: val("#sf-o") };
    msg.className = "form-msg";
    if (body.followers === "") { msg.className = "form-msg err"; msg.textContent = "Escribe los seguidores."; return; }
    btn.disabled = true;
    try {
      await api("/social", { method: "POST", body });
      toast("Medición guardada");
      go("social", { quiet: true });
    } catch (err) {
      if (err instanceof AuthError) return;
      msg.className = "form-msg err"; msg.textContent = err.message; btn.disabled = false;
    }
  });
}

/* ---------- Ecosistema */
VIEWS.ecosystem = (d) => {
  const notConnected = (what, secret, scopes) => html`<p class="note"><b>No conectado.</b> Para verlo aquí, crea un token de solo lectura (${scopes}) y pégalo tú en Cloudflare → pursec-shop → Variables y secretos con el nombre <code>${secret}</code>. No pases el token por el chat.</p>`;
  return html`
  <div class="grid cols-3">${d.services.map((s) => html`<div class="card"><div class="svc"><span class="dot ${s.ok ? "ok" : "bad"}"></span><div><strong>${s.label}</strong><div class="sub mute">${s.ok ? html`${badge("Operativo", "good")} ${s.detail || ""}${s.ms ? html` · ${s.ms} ms` : ""}` : html`${badge("Revisar", "crit")} ${s.error || ""}`}</div></div></div></div>`)}</div>
  <div class="grid cols-2">
    ${card("GitHub · pull requests", d.github.ok
      ? html`${d.github.data.pulls.length ? table(["#", "Título", "Rama"], d.github.data.pulls.map((p) => { const u = safeUrl(p.url); return html`<tr><td class="id">${p.number}</td><td><a href="${u}" target="_blank" rel="noopener noreferrer"><span class="trunc" style="display:block;max-width:300px">${p.title}</span></a>${p.draft ? badge("Borrador", "muted") : ""}</td><td class="id">${p.branch}</td></tr>`; })) : empty("No hay PRs abiertos")}<h2 style="margin:16px 0 8px">Últimos commits en main</h2>${table(["SHA", "Mensaje", "Fecha"], d.github.data.commits.map((c) => html`<tr><td class="id">${c.sha}</td><td><span class="trunc" style="display:block;max-width:300px">${c.message}</span></td><td>${fdate(c.date)}</td></tr>`))}`
      : d.github.error === "no-token" ? notConnected("GitHub", "GITHUB_TOKEN", "fine-grained: Contents, Pull requests y Metadata en lectura") : banner("crit", `GitHub: ${d.github.error}`))}
    ${card("Make · escenarios", d.make.ok
      ? (d.make.data.length ? table(["Escenario", "Estado", "Editado"], d.make.data.map((s) => html`<tr><td>${s.name}</td><td>${s.invalid ? badge("Inválido", "crit") : s.active ? badge("Activo", "good") : badge("Apagado", "muted")}</td><td>${fdate(s.last_edit)}</td></tr>`)) : empty("Sin escenarios"))
      : d.make.error === "no-token" ? notConnected("Make", "MAKE_API_TOKEN", "scopes scenarios:read") : banner("crit", `Make: ${d.make.error}`))}
  </div>
  ${card("Accesos directos", html`<div class="links">${d.links.map((l) => html`<a href="${safeUrl(l.url)}" target="_blank" rel="noopener noreferrer">${l.label}<span aria-hidden="true">↗</span></a>`)}</div>`)}
  ${card("No conectado todavía", html`<p class="note"><b>Kling</b> (créditos): sin API pública conectada; se consultan en el chat. <b>Despliegues de Cloudflare</b> y <b>tráfico de la web</b>: necesitan un token de la API de Cloudflare. <b>Estadísticas de redes</b>: manuales por ahora (sección Redes). <b>[PENDIENTE]</b> decidir cuáles conectar.</p>`)}`;
};

/* =================================================================== interfaz común */
function toast(text) {
  const t = $("#toast");
  t.textContent = text; t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { t.hidden = true; }, 2600);
}
function openMenu() { $("#side").classList.add("open"); $("#scrim").hidden = false; $("#menu").setAttribute("aria-expanded", "true"); }
function closeMenu() { $("#side").classList.remove("open"); if ($("#drawer").hidden) $("#scrim").hidden = true; $("#menu").setAttribute("aria-expanded", "false"); }

function route() {
  const id = (location.hash.replace(/^#\/?/, "").split("?")[0]) || "overview";
  go(VIEWS[id] ? id : "overview");
}

function startApp(me) {
  $("#login").hidden = true;
  $("#app").hidden = false;
  $("#who").textContent = me.email;
  setMode(me.stripe_mode);
  if (!location.hash.startsWith("#/")) history.replaceState(null, "", `${location.pathname}#/overview`);
  route();
}

function bindChrome() {
  addEventListener("hashchange", () => { if (!$("#app").hidden) route(); });
  $("#logout").addEventListener("click", logout);
  $("#menu").addEventListener("click", () => ($("#side").classList.contains("open") ? closeMenu() : openMenu()));
  $("#scrim").addEventListener("click", () => { closeDrawer(); closeMenu(); });
  $("#drawer-close").addEventListener("click", closeDrawer);
  addEventListener("keydown", (e) => { if (e.key === "Escape") { closeDrawer(); closeMenu(); } });
  $("#refresh").addEventListener("click", async () => {
    const b = $("#refresh");
    b.disabled = true; b.classList.add("spin");
    await go(state.current, { quiet: true });
    b.disabled = false; b.classList.remove("spin");
  });
  $("#view").addEventListener("click", (e) => {
    const tr = e.target.closest?.("tr[data-oid]");
    if (tr) openOrder(state.orders.find((o) => o.id === tr.dataset.oid));
  });
  let rt;
  new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(drawCharts, 120); }).observe($("#view"));
}

async function boot() {
  bindLogin();
  bindChrome();
  const fromHash = takeHashSession();
  if (fromHash?.error) { showLogin(fromHash.error, "err"); return; }
  if (fromHash) saveSession(fromHash);
  if (!loadSession()) { showLogin(); return; }
  try {
    startApp(await api("/me"));
  } catch (err) {
    if (err instanceof AuthError) return;
    showLogin(err.message, "err");
  }
}
boot();
})();
