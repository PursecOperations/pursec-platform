// PURSEC — API privada del panel de administración (/admin/*).
//
// Seguridad (todo se comprueba aquí, en el servidor; el navegador solo pinta lo que llega):
//   1. Cada petición lleva el token de sesión de Supabase Auth (enlace mágico) en Authorization.
//   2. El token se valida contra Supabase (/auth/v1/user): firma, caducidad y sesión viva.
//   3. El email debe estar confirmado y estar en ADMIN_EMAILS. Cualquier otro -> 403 sin datos.
//   4. Solo lectura, salvo POST /admin/social (instantánea de estadísticas de redes).
// Los secretos (clave de servicio, Stripe, Packlink...) nunca salen del Worker.

import { supabase, stripe, json } from "./clients.js";
import { packlinkKey, packlinkGet } from "./packlink.js";

export const REVENUE_STATUSES = ["paid", "packed", "shipped", "delivered"];
export const TO_SHIP_STATUSES = ["paid", "packed"];
export const PLATFORMS = ["instagram", "tiktok", "youtube", "x"];
const VAT_RATE = 0.21; // IVA español (ropa, venta a particulares UE bajo el umbral OSS)
const OSS_LIMIT_EUR = 10000;
const DAY = 86400000;
const TZ = "Europe/Madrid";
const NO_STORE = { "Cache-Control": "no-store" };

// ---------------------------------------------------------------- autenticación
const tokenCache = new Map(); // token -> { email, exp }  (60 s, solo aciertos)

export function adminEmails(env) {
  return (env.ADMIN_EMAILS || "pursec.telemetry.hq@gmail.com")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export async function authenticate(request, env, now = Date.now()) {
  const m = /^Bearer\s+([A-Za-z0-9._~+/=-]{20,4096})$/.exec(request.headers.get("Authorization") || "");
  if (!m) return { status: 401, error: "Sesión no válida" };
  const token = m[1];
  const hit = tokenCache.get(token);
  if (hit && hit.exp > now) return { email: hit.email };

  const apikey = env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_SERVICE_KEY;
  if (!apikey || !env.SUPABASE_URL) return { status: 503, error: "Falta configuración de Supabase en el Worker" };
  let res;
  try {
    res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, { headers: { apikey, Authorization: `Bearer ${token}` } });
  } catch {
    return { status: 503, error: "No se pudo validar la sesión" };
  }
  if (!res.ok) return { status: 401, error: "Sesión caducada" };
  const user = await res.json().catch(() => null);
  const email = String(user?.email || "").toLowerCase();
  const confirmed = Boolean(user?.email_confirmed_at || user?.confirmed_at);
  if (!email || !confirmed || !adminEmails(env).includes(email)) return { status: 403, error: "Esta cuenta no tiene acceso" };

  if (tokenCache.size > 50) tokenCache.clear();
  tokenCache.set(token, { email, exp: now + 60000 });
  return { email };
}

// ---------------------------------------------------------------- utilidades de cálculo (puras)
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const num = (v) => (v === null || v === undefined || v === "" ? 0 : Number(v) || 0);

export function dayKey(ms) {
  return new Date(ms).toLocaleDateString("sv-SE", { timeZone: TZ }); // YYYY-MM-DD en hora de Madrid
}
const monthKey = (ms) => dayKey(ms).slice(0, 7);
const ts = (row) => Date.parse(row.created_at);

export const isRevenue = (o) => REVENUE_STATUSES.includes(o.status);

export function splitVat(gross) {
  const base = round2(gross / (1 + VAT_RATE));
  return { base, vat: round2(gross - base) };
}

export function sumGross(orders) {
  return round2(orders.reduce((t, o) => t + num(o.amount_total_eur), 0));
}

export function periodStats(orders, from, to) {
  const sel = orders.filter((o) => isRevenue(o) && ts(o) >= from && ts(o) < to);
  const revenue = sumGross(sel);
  return { revenue, orders: sel.length, aov: sel.length ? round2(revenue / sel.length) : 0 };
}

export function dailySeries(orders, days, now) {
  const keys = [];
  for (let i = days - 1; i >= 0; i--) keys.push(dayKey(now - i * DAY));
  const map = new Map(keys.map((k) => [k, { d: k, revenue: 0, orders: 0 }]));
  for (const o of orders) {
    if (!isRevenue(o)) continue;
    const b = map.get(dayKey(ts(o)));
    if (b) { b.revenue = round2(b.revenue + num(o.amount_total_eur)); b.orders += 1; }
  }
  return keys.map((k) => map.get(k));
}

export function monthlySeries(orders, months, now) {
  const keys = [];
  const cur = new Date(dayKey(now).slice(0, 7) + "-01T12:00:00Z");
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() - i, 1, 12));
    keys.push(d.toISOString().slice(0, 7));
  }
  const map = new Map(keys.map((k) => [k, { m: k, revenue: 0, orders: 0 }]));
  for (const o of orders) {
    if (!isRevenue(o)) continue;
    const b = map.get(monthKey(ts(o)));
    if (b) { b.revenue = round2(b.revenue + num(o.amount_total_eur)); b.orders += 1; }
  }
  return keys.map((k) => map.get(k));
}

export function toShipInfo(orders, now) {
  const rows = orders
    .filter((o) => TO_SHIP_STATUSES.includes(o.status))
    .map((o) => ({ id: o.id, created_at: o.created_at, hours: Math.floor((now - ts(o)) / 3600000), stock_issue: !!o.stock_issue }));
  return { count: rows.length, over24h: rows.filter((r) => r.hours >= 24).length, oldest_hours: rows.reduce((m, r) => Math.max(m, r.hours), 0), rows };
}

export function stockSummary(variants) {
  let units = 0, value = 0, low = 0, out = 0, missingCost = 0;
  for (const v of variants) {
    const stock = num(v.stock);
    units += stock;
    if (v.unit_cost_eur !== null && v.unit_cost_eur !== undefined) value += stock * num(v.unit_cost_eur);
    else if (stock > 0) missingCost += 1;
    if (v.active !== false) {
      if (stock === 0) out += 1;
      else if (stock <= num(v.low_stock_alert)) low += 1;
    }
  }
  return { variants: variants.length, units, value_eur: round2(value), low, out, missing_cost: missingCost };
}

export function waitlistSummary(rows, now) {
  const last7 = rows.filter((r) => ts(r) >= now - 7 * DAY).length;
  const prev7 = rows.filter((r) => ts(r) >= now - 14 * DAY && ts(r) < now - 7 * DAY).length;
  const keys = [];
  for (let i = 29; i >= 0; i--) keys.push(dayKey(now - i * DAY));
  const map = new Map(keys.map((k) => [k, 0]));
  for (const r of rows) { const k = dayKey(ts(r)); if (map.has(k)) map.set(k, map.get(k) + 1); }
  const count = (field) => {
    const m = new Map();
    for (const r of rows) { const k = r[field] || "—"; m.set(k, (m.get(k) || 0) + 1); }
    return [...m].map(([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n).slice(0, 8);
  };
  return { total: rows.length, last7, prev7, daily: keys.map((k) => ({ d: k, n: map.get(k) })), by_source: count("source"), by_lang: count("lang") };
}

export function customersFromOrders(orders) {
  const map = new Map();
  for (const o of orders) {
    if (!isRevenue(o)) continue;
    const email = String(o.email || "").toLowerCase() || `sin-email-${o.id}`;
    const c = map.get(email) || { email: o.email || "", name: o.customer_name || "", country: o.shipping?.country_code || "", orders: 0, spent: 0, last: o.created_at };
    c.orders += 1;
    c.spent = round2(c.spent + num(o.amount_total_eur));
    if (ts(o) > Date.parse(c.last)) c.last = o.created_at;
    map.set(email, c);
  }
  return [...map.values()].sort((a, b) => b.spent - a.spent);
}

export function ossStatus(orders, now) {
  const year = dayKey(now).slice(0, 4);
  const eu = orders.filter((o) => isRevenue(o) && dayKey(ts(o)).startsWith(year) && o.shipping?.country_code && o.shipping.country_code !== "ES");
  const gross = sumGross(eu);
  return { year, gross_other_eu: gross, limit: OSS_LIMIT_EUR, pct: round2((gross / OSS_LIMIT_EUR) * 100) };
}

export function cogsForOrders(orders, variantCost) {
  let cogs = 0, missing = 0;
  for (const o of orders) {
    for (const it of Array.isArray(o.items) ? o.items : []) {
      const cost = variantCost.get(Number(it.variant_id));
      if (cost === null || cost === undefined) missing += num(it.qty);
      else cogs += cost * num(it.qty);
    }
  }
  return { cogs: round2(cogs), missing_units: missing };
}

export function stripeMode(env) {
  const k = env.STRIPE_SECRET_KEY || "";
  if (/^(sk|rk)_live_/.test(k)) return "live";
  if (/^(sk|rk)_test_/.test(k)) return "test";
  return k ? "unknown" : "missing";
}

export function buildAlerts({ mode, toShip, orders, stock, oss, noteIssues, socialReady }) {
  const a = [];
  if (mode === "test") a.push({ level: "info", text: "Stripe está en modo PRUEBA: los cobros no son reales." });
  if (mode === "missing") a.push({ level: "critical", text: "Falta la clave de Stripe en el Worker." });
  if (toShip.over24h > 0) a.push({ level: "critical", text: `${toShip.over24h} pedido(s) pagado(s) sin enviar desde hace más de 24 h.`, go: "shipping" });
  const issues = orders.filter((o) => o.stock_issue && isRevenue(o)).length;
  if (issues) a.push({ level: "critical", text: `${issues} pedido(s) pagado(s) sin stock suficiente.`, go: "orders" });
  if (noteIssues) a.push({ level: "warning", text: `${noteIssues} pedido(s) con aviso de envío o error de Packlink en las notas.`, go: "shipping" });
  if (stock.out) a.push({ level: "warning", text: `${stock.out} variante(s) activas agotadas.`, go: "products" });
  if (stock.low) a.push({ level: "warning", text: `${stock.low} variante(s) con poco stock.`, go: "products" });
  if (oss.pct >= 80) a.push({ level: "warning", text: `Ventas a otros países UE: ${oss.pct}% del umbral OSS de 10.000 €.`, go: "finance" });
  if (socialReady === false) a.push({ level: "info", text: "Estadísticas de redes: falta aplicar la migración social_stats en Supabase.", go: "social" });
  return a;
}

const hasNoteIssue = (o) => /AVISO env[ií]o|Packlink \d{4}-/.test(o.notes || "");

// ---------------------------------------------------------------- carga de datos
async function rows(env, path) {
  return (await supabase(env, path)) || [];
}
async function optional(fn) {
  try { return { ok: true, data: await fn() }; } catch (err) { return { ok: false, error: String(err.message || err).slice(0, 240) }; }
}

const loadOrders = (env) => rows(env, "orders?select=*&order=created_at.desc&limit=1000");
const loadVariants = (env) =>
  rows(env, "product_variants?select=id,product_id,size,color,sku,stock,unit_cost_eur,low_stock_alert,active,product:products(id,name,slug,price_eur,active,coming_soon,category)&order=product_id,id&limit=2000");

function publicOrder(o) {
  const sh = o.shipping || {};
  return {
    id: o.id, created_at: o.created_at, status: o.status, email: o.email, name: o.customer_name,
    amount: num(o.amount_total_eur), items: Array.isArray(o.items) ? o.items : [], stock_issue: !!o.stock_issue,
    packlink_ref: o.packlink_ref || null, tracking_number: o.tracking_number || null, tracking_url: o.tracking_url || null,
    carrier: o.carrier || null, shipped_at: o.shipped_at || null, shipping_cost_eur: o.shipping_cost_eur === null || o.shipping_cost_eur === undefined ? null : num(o.shipping_cost_eur),
    notes: o.notes || null, stripe_payment_intent: o.stripe_payment_intent || null,
    ship_to: { name: sh.name || "", address1: sh.address1 || "", address2: sh.address2 || "", city: sh.city || "", zip: sh.zip || "", country: sh.country_code || "", phone: sh.phone || "" },
  };
}

// ---------------------------------------------------------------- secciones
async function overview(env, now) {
  const [orders, variants, waitlist, expenses] = await Promise.all([
    loadOrders(env), loadVariants(env),
    rows(env, "waitlist?select=created_at,source,lang&order=created_at.desc&limit=5000"),
    rows(env, "expenses?select=expense_date,base_eur&order=expense_date.desc&limit=500"),
  ]);
  const social = await optional(() => rows(env, "social_stats?select=id&limit=1"));
  const mode = stripeMode(env);
  const cur = periodStats(orders, now - 30 * DAY, now + DAY);
  const prev = periodStats(orders, now - 60 * DAY, now - 30 * DAY);
  const toShip = toShipInfo(orders, now);
  const stock = stockSummary(variants);
  const oss = ossStatus(orders, now);
  const noteIssues = orders.filter((o) => isRevenue(o) && hasNoteIssue(o)).length;
  const since = dayKey(now - 30 * DAY);
  const expenses30 = round2(expenses.filter((e) => e.expense_date >= since).reduce((t, e) => t + num(e.base_eur), 0));
  return {
    mode, now,
    last30: { ...cur, prev_revenue: prev.revenue, prev_orders: prev.orders, ...splitVat(cur.revenue) },
    daily: dailySeries(orders, 30, now),
    to_ship: { count: toShip.count, over24h: toShip.over24h, oldest_hours: toShip.oldest_hours },
    stock, oss,
    waitlist: (({ total, last7, prev7, daily }) => ({ total, last7, prev7, daily }))(waitlistSummary(waitlist, now)),
    expenses30,
    recent_orders: orders.slice(0, 6).map(publicOrder),
    alerts: buildAlerts({ mode, toShip, orders, stock, oss, noteIssues, socialReady: social.ok }),
  };
}

async function ordersSection(env, now) {
  const orders = await loadOrders(env);
  const counts = {};
  for (const o of orders) counts[o.status] = (counts[o.status] || 0) + 1;
  return { now, counts, orders: orders.slice(0, 300).map(publicOrder), truncated: orders.length > 300 };
}

async function productsSection(env, now) {
  const [variants, products, movements] = await Promise.all([
    loadVariants(env),
    rows(env, "products?select=id,name,slug,price_eur,active,coming_soon,category,sort,updated_at&order=sort,id&limit=200"),
    rows(env, "stock_movements?select=id,delta,reason,ref,created_at,variant:product_variants(sku,size,color,product:products(name))&order=created_at.desc&limit=50"),
  ]);
  const byProduct = new Map(products.map((p) => [p.id, { ...p, price_eur: num(p.price_eur), variants: [] }]));
  for (const v of variants) byProduct.get(v.product_id)?.variants.push({
    id: v.id, size: v.size, color: v.color, sku: v.sku, stock: num(v.stock), low_alert: num(v.low_stock_alert), active: v.active,
    unit_cost: v.unit_cost_eur === null || v.unit_cost_eur === undefined ? null : num(v.unit_cost_eur),
  });
  return { now, summary: stockSummary(variants), products: [...byProduct.values()], movements };
}

async function customersSection(env, now) {
  const [waitlist, orders] = await Promise.all([
    rows(env, "waitlist?select=id,email,lang,source,created_at&order=created_at.desc&limit=5000"),
    loadOrders(env),
  ]);
  const w = waitlistSummary(waitlist, now);
  return { now, waitlist: { ...w, recent: waitlist.slice(0, 50) }, customers: customersFromOrders(orders).slice(0, 200) };
}

async function stripeBlock(env, now) {
  if (!env.STRIPE_SECRET_KEY) return { ok: false, error: "Falta STRIPE_SECRET_KEY" };
  const since = Math.floor((now - 30 * DAY) / 1000);
  const [bal, fees, disputes, refunds] = await Promise.allSettled([
    stripe(env, "balance"),
    stripe(env, "balance_transactions", { params: { limit: 100, type: "charge", "created[gte]": since } }),
    stripe(env, "disputes", { params: { limit: 5 } }),
    stripe(env, "refunds", { params: { limit: 5 } }),
  ]);
  const eur = (arr) => round2((Array.isArray(arr) ? arr : []).filter((b) => b.currency === "eur").reduce((t, b) => t + b.amount, 0) / 100);
  const out = { ok: true, mode: stripeMode(env) };
  if (bal.status === "fulfilled") out.balance = { available: eur(bal.value.available), pending: eur(bal.value.pending) };
  if (fees.status === "fulfilled") {
    const list = fees.value.data || [];
    out.fees_30d = { fee: round2(list.reduce((t, b) => t + b.fee, 0) / 100), gross: round2(list.reduce((t, b) => t + b.amount, 0) / 100), count: list.length, more: !!fees.value.has_more };
  }
  if (disputes.status === "fulfilled") out.disputes = (disputes.value.data || []).map((d) => ({ id: d.id, amount: d.amount / 100, status: d.status, reason: d.reason, created: d.created * 1000 }));
  if (refunds.status === "fulfilled") out.refunds = (refunds.value.data || []).map((r) => ({ id: r.id, amount: r.amount / 100, status: r.status, created: r.created * 1000 }));
  const failed = [bal, fees, disputes, refunds].filter((r) => r.status === "rejected");
  if (failed.length) out.partial_error = String(failed[0].reason?.message || failed[0].reason).slice(0, 200);
  return out;
}

async function financeSection(env, now) {
  const [orders, variants, expenses, ledger, stripeData] = await Promise.all([
    loadOrders(env), loadVariants(env),
    rows(env, "expenses?select=*&order=expense_date.desc&limit=500"),
    optional(() => rows(env, "financial_ledger?select=tx_date,fiscal_quarter,tx_type,concept,gross_eur&order=tx_date.desc&limit=50")),
    stripeBlock(env, now),
  ]);
  const cost = new Map(variants.map((v) => [v.id, v.unit_cost_eur === null || v.unit_cost_eur === undefined ? null : num(v.unit_cost_eur)]));
  const mk = dayKey(now).slice(0, 7);
  const monthOrders = orders.filter((o) => isRevenue(o) && monthKey(ts(o)) === mk);
  const gross = sumGross(monthOrders);
  const { base, vat } = splitVat(gross);
  const { cogs, missing_units } = cogsForOrders(monthOrders, cost);
  const labels = round2(monthOrders.reduce((t, o) => t + num(o.shipping_cost_eur), 0));
  const labelsMissing = monthOrders.filter((o) => o.shipping_cost_eur === null || o.shipping_cost_eur === undefined).length;
  const monthExpenses = expenses.filter((e) => String(e.expense_date).startsWith(mk));
  const expBase = round2(monthExpenses.reduce((t, e) => t + num(e.base_eur), 0));
  const byCat = new Map();
  for (const e of monthExpenses) byCat.set(e.category, round2((byCat.get(e.category) || 0) + num(e.base_eur)));

  const quarters = new Map();
  for (const o of orders) {
    if (!isRevenue(o)) continue;
    const k = dayKey(ts(o)); const q = `${k.slice(0, 4)}-Q${Math.floor((Number(k.slice(5, 7)) - 1) / 3) + 1}`;
    const r = quarters.get(q) || { q, gross: 0, orders: 0 };
    r.gross = round2(r.gross + num(o.amount_total_eur)); r.orders += 1; quarters.set(q, r);
  }
  const vatIn = new Map();
  for (const e of expenses) {
    const k = String(e.expense_date); const q = `${k.slice(0, 4)}-Q${Math.floor((Number(k.slice(5, 7)) - 1) / 3) + 1}`;
    vatIn.set(q, round2((vatIn.get(q) || 0) + num(e.vat_eur)));
  }
  const vatTable = [...quarters.values()].sort((a, b) => b.q.localeCompare(a.q)).slice(0, 4)
    .map((r) => ({ ...r, ...splitVat(r.gross), vat_deductible: vatIn.get(r.q) || 0 }));

  const stripeFees = stripeData.fees_30d ? stripeData.fees_30d.fee : null;
  return {
    now, month: mk, stripe: stripeData,
    monthly: monthlySeries(orders, 6, now),
    pnl: {
      gross, base, vat, cogs, cogs_missing_units: missing_units, labels, labels_missing_orders: labelsMissing,
      expenses: expBase, stripe_fees_30d: stripeFees,
      result: round2(base - cogs - labels - expBase - (stripeFees || 0)),
      orders: monthOrders.length,
    },
    expenses_by_category: [...byCat].map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total),
    expenses: expenses.slice(0, 30),
    vat_table: vatTable,
    oss: ossStatus(orders, now),
    legacy_ledger: ledger.ok ? ledger.data : null,
    ledger_csv: orders.filter(isRevenue).map((o) => ({
      date: dayKey(ts(o)), order: o.id, country: o.shipping?.country_code || "", gross: num(o.amount_total_eur), ...splitVat(num(o.amount_total_eur)),
      label_cost: o.shipping_cost_eur === null || o.shipping_cost_eur === undefined ? "" : num(o.shipping_cost_eur),
    })),
  };
}

async function shippingSection(env, now) {
  const orders = await loadOrders(env);
  const pending = orders.filter((o) => TO_SHIP_STATUSES.includes(o.status)).map((o) => ({ ...publicOrder(o), hours: Math.floor((now - ts(o)) / 3600000) }))
    .sort((a, b) => b.hours - a.hours);
  const shipped = orders.filter((o) => ["shipped", "delivered"].includes(o.status)).slice(0, 30).map(publicOrder);
  const problems = orders.filter((o) => isRevenue(o) && hasNoteIssue(o)).map(publicOrder);
  return {
    now, pending, shipped, problems,
    settings: {
      price: env.SHIPPING_EUR ?? null, free_from: env.FREE_SHIPPING_FROM ?? null,
      countries: (env.SHIP_COUNTRIES || "").split(",").map((s) => s.trim()).filter(Boolean),
      parcel_cm: env.PARCEL_CM || null, kg_per_item: env.PARCEL_KG_PER_ITEM || null,
      packlink_key: Boolean(packlinkKey(env)), alert_webhook: Boolean(env.ALERT_WEBHOOK_URL),
    },
  };
}

export function summarizeSocial(rowsIn) {
  const out = [];
  for (const platform of PLATFORMS) {
    const r = rowsIn.filter((x) => x.platform === platform).sort((a, b) => a.stat_date.localeCompare(b.stat_date));
    if (!r.length) { out.push({ platform, latest: null, series: [] }); continue; }
    const latest = r[r.length - 1];
    const prev = r.length > 1 ? r[r.length - 2] : null;
    const weekAgo = [...r].reverse().find((x) => x.stat_date <= new Date(Date.parse(latest.stat_date) - 7 * DAY).toISOString().slice(0, 10)) || null;
    out.push({
      platform, latest,
      delta_prev: prev ? latest.followers - prev.followers : null,
      delta_7d: weekAgo ? latest.followers - weekAgo.followers : null,
      series: r.slice(-60).map((x) => ({ d: x.stat_date, followers: x.followers, views: x.views, interactions: x.interactions, posts: x.posts })),
    });
  }
  return out;
}

async function socialSection(env, now) {
  const res = await optional(() => rows(env, "social_stats?select=platform,stat_date,followers,views,interactions,posts,note&order=stat_date.asc&limit=2000"));
  if (!res.ok) return { now, ready: false, error: res.error, platforms: PLATFORMS.map((p) => ({ platform: p, latest: null, series: [] })) };
  return { now, ready: true, platforms: summarizeSocial(res.data) };
}

export function validateSocial(body, now = Date.now()) {
  const platform = String(body?.platform || "");
  if (!PLATFORMS.includes(platform)) throw new Error("Plataforma no válida");
  const date = String(body?.stat_date || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) throw new Error("Fecha no válida");
  if (Date.parse(date) > now + DAY) throw new Error("La fecha no puede ser futura");
  const int = (v, required) => {
    if (v === undefined || v === null || v === "") { if (required) throw new Error("Faltan los seguidores"); return null; }
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0 || n > 1e9) throw new Error("Los números deben ser enteros positivos");
    return n;
  };
  const note = body?.note ? String(body.note).slice(0, 200) : null;
  return { platform, stat_date: date, followers: int(body?.followers, true), views: int(body?.views), interactions: int(body?.interactions), posts: int(body?.posts), note };
}

async function saveSocial(request, env, now) {
  let row;
  try { row = validateSocial(await request.json(), now); } catch (err) { return json({ error: err.message }, 400, NO_STORE); }
  try {
    await supabase(env, "social_stats?on_conflict=platform,stat_date", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: row });
  } catch (err) {
    const missing = /PGRST205|social_stats|42P01/.test(err.message);
    return json({ error: missing ? "Falta aplicar la migración social_stats en Supabase" : "No se pudo guardar" }, missing ? 409 : 502, NO_STORE);
  }
  return json({ saved: true }, 200, NO_STORE);
}

async function probe(label, fn) {
  const t0 = Date.now();
  try {
    const extra = await fn();
    return { label, ok: true, ms: Date.now() - t0, ...(extra || {}) };
  } catch (err) {
    return { label, ok: false, ms: Date.now() - t0, error: String(err.message || err).slice(0, 160) };
  }
}

async function ecosystemSection(env, now) {
  const repo = env.GITHUB_REPO || "PursecOperations/pursec-platform";
  const services = await Promise.all([
    probe("Supabase", async () => { await supabase(env, "orders?select=id&limit=1"); return { detail: "pursec-core-db" }; }),
    probe("Stripe", async () => {
      if (!env.STRIPE_SECRET_KEY) throw new Error("Falta STRIPE_SECRET_KEY");
      await stripe(env, "balance");
      return { detail: stripeMode(env) === "test" ? "modo PRUEBA" : stripeMode(env) === "live" ? "modo REAL" : "modo desconocido" };
    }),
    probe("Packlink PRO", async () => {
      if (!packlinkKey(env)) throw new Error("Falta PACKLINKPRO_API_KEY");
      const res = await packlinkGet(env, "/clients/warehouses");
      if (!res.ok) throw new Error(`Packlink respondió ${res.status}`);
      return { detail: "API key válida" };
    }),
    probe("Web pursec.club", async () => {
      const res = await fetch(env.SITE_URL || "https://pursec.club", { method: "GET", signal: AbortSignal.timeout(6000), redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { detail: `HTTP ${res.status}` };
    }),
    Promise.resolve({ label: "Avisos por email (Make)", ok: Boolean(env.ALERT_WEBHOOK_URL), ms: 0, detail: env.ALERT_WEBHOOK_URL ? "webhook configurado" : "falta ALERT_WEBHOOK_URL", error: env.ALERT_WEBHOOK_URL ? undefined : "Sin webhook: los avisos solo quedan en las notas del pedido" }),
  ]);

  const github = env.GITHUB_TOKEN
    ? await optional(async () => {
      const h = { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "User-Agent": "pursec-admin" };
      const get = async (p) => { const r = await fetch(`https://api.github.com/repos/${repo}${p}`, { headers: h, signal: AbortSignal.timeout(8000) }); if (!r.ok) throw new Error(`GitHub ${r.status}`); return r.json(); };
      const [pulls, commits] = await Promise.all([get("/pulls?state=open&per_page=10"), get("/commits?per_page=5")]);
      return {
        repo,
        pulls: pulls.map((p) => ({ number: p.number, title: p.title, url: p.html_url, branch: p.head?.ref, draft: !!p.draft, updated: p.updated_at })),
        commits: commits.map((c) => ({ sha: String(c.sha).slice(0, 7), message: String(c.commit?.message || "").split("\n")[0].slice(0, 90), date: c.commit?.author?.date, url: c.html_url })),
      };
    })
    : { ok: false, error: "no-token" };

  const make = env.MAKE_API_TOKEN && env.MAKE_TEAM_ID
    ? await optional(async () => {
      const r = await fetch(`https://${env.MAKE_ZONE || "eu1.make.com"}/api/v2/scenarios?teamId=${encodeURIComponent(env.MAKE_TEAM_ID)}`, { headers: { Authorization: `Token ${env.MAKE_API_TOKEN}` }, signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error(`Make ${r.status}`);
      const d = await r.json();
      return (d.scenarios || []).map((s) => ({ id: s.id, name: s.name, active: s.isActive ?? !s.isPaused, paused: !!s.isPaused, invalid: !!s.isinvalid, last_edit: s.lastEdit }));
    })
    : { ok: false, error: "no-token" };

  return {
    now, services, github, make,
    links: [
      { label: "Stripe", url: "https://dashboard.stripe.com" },
      { label: "Supabase", url: "https://supabase.com/dashboard/project/uymgrzlbpaqorbwajhfh" },
      { label: "Cloudflare", url: "https://dash.cloudflare.com" },
      { label: "Packlink PRO", url: "https://pro.packlink.es" },
      { label: "Make", url: "https://eu1.make.com" },
      { label: "GitHub", url: `https://github.com/${repo}` },
    ],
  };
}

const SECTIONS = {
  overview, orders: ordersSection, products: productsSection, customers: customersSection,
  finance: financeSection, shipping: shippingSection, social: socialSection, ecosystem: ecosystemSection,
};

export async function handleAdmin(request, env, pathname, now = Date.now()) {
  const auth = await authenticate(request, env, now);
  if (auth.error) return json({ error: auth.error }, auth.status, NO_STORE);
  const section = pathname.replace(/^\/admin\/?/, "").replace(/\/$/, "");

  if (request.method === "GET" && section === "me") return json({ email: auth.email, stripe_mode: stripeMode(env) }, 200, NO_STORE);
  if (request.method === "GET" && Object.hasOwn(SECTIONS, section)) {
    try {
      return json(await SECTIONS[section](env, now), 200, NO_STORE);
    } catch (err) {
      return json({ error: `No se pudieron cargar los datos: ${String(err.message || err).slice(0, 240)}` }, 502, NO_STORE);
    }
  }
  if (request.method === "POST" && section === "social") return saveSocial(request, env, now);
  return json({ error: "No encontrado" }, 404, NO_STORE);
}
