// Pruebas del panel /admin: node --test workers/shop/test/
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";
import {
  authenticate, adminEmails, periodStats, dailySeries, monthlySeries, toShipInfo, stockSummary,
  waitlistSummary, customersFromOrders, ossStatus, cogsForOrders, splitVat, stripeMode, buildAlerts,
  summarizeSocial, validateSocial, dayKey,
} from "../src/admin.js";

const ENV = {
  SUPABASE_URL: "https://db.test",
  SUPABASE_SERVICE_KEY: "sb_secret_test",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  STRIPE_SECRET_KEY: "sk_test_x",
  SHIPPING_EUR: "4.95",
  ADMIN_EMAILS: "owner@pursec.test",
};
const NOW = Date.parse("2026-10-28T12:00:00Z");
const TOKEN = "t".repeat(40);

let userReply;
let tables;
beforeEach(() => {
  userReply = { status: 200, body: { email: "owner@pursec.test", email_confirmed_at: "2026-10-01T00:00:00Z" } };
  tables = {};
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url);
    if (u.endsWith("/auth/v1/user")) return new Response(JSON.stringify(userReply.body), { status: userReply.status });
    const m = /\/rest\/v1\/([a-z_]+)/.exec(u);
    if (m && tables[m[1]] !== undefined) {
      if (tables[m[1]] instanceof Error) return new Response(JSON.stringify({ code: "PGRST205", message: "no table" }), { status: 404 });
      return new Response(JSON.stringify(tables[m[1]]), { status: 200 });
    }
    return new Response("[]", { status: 200 });
  };
});

const req = (path, { token = TOKEN, method = "GET", body, origin = "https://pursec.club" } = {}) =>
  new Request(`https://shop.test${path}`, {
    method,
    headers: { Origin: origin, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });

// ---------------------------------------------------------------- seguridad
test("sin token -> 401 y ningún dato", async () => {
  const res = await worker.fetch(req("/admin/overview", { token: null }), ENV);
  assert.equal(res.status, 401);
  assert.deepEqual(await res.json(), { error: "Sesión no válida" });
});

test("token inválido (Supabase lo rechaza) -> 401", async () => {
  userReply = { status: 401, body: { msg: "bad jwt" } };
  const res = await worker.fetch(req("/admin/orders", { token: "x".repeat(41) }), ENV);
  assert.equal(res.status, 401);
});

test("usuario válido pero que NO es el administrador -> 403", async () => {
  userReply = { status: 200, body: { email: "otro@gmail.com", email_confirmed_at: "2026-10-01T00:00:00Z" } };
  const res = await worker.fetch(req("/admin/overview", { token: "y".repeat(41) }), ENV);
  assert.equal(res.status, 403);
  assert.deepEqual(await res.json(), { error: "Esta cuenta no tiene acceso" });
});

test("el email del administrador sin confirmar -> 403", async () => {
  userReply = { status: 200, body: { email: "owner@pursec.test", email_confirmed_at: null } };
  const res = await worker.fetch(req("/admin/overview", { token: "z".repeat(41) }), ENV);
  assert.equal(res.status, 403);
});

test("el email se compara sin mayúsculas", async () => {
  userReply = { status: 200, body: { email: "Owner@Pursec.Test", email_confirmed_at: "2026-10-01T00:00:00Z" } };
  const r = await authenticate(req("/admin/me", { token: "q".repeat(41) }), ENV, NOW);
  assert.equal(r.email, "owner@pursec.test");
});

test("ADMIN_EMAILS por defecto es solo el email del negocio", () => {
  assert.deepEqual(adminEmails({}), ["pursec.telemetry.hq@gmail.com"]);
  assert.deepEqual(adminEmails({ ADMIN_EMAILS: " A@x.com , b@x.com " }), ["a@x.com", "b@x.com"]);
});

test("un origen desconocido no llega ni a validar el token", async () => {
  const before = globalThis.fetch;
  let touched = false;
  globalThis.fetch = async (...a) => { touched = true; return before(...a); };
  const res = await worker.fetch(req("/admin/overview", { origin: "https://evil.example" }), ENV);
  assert.equal(res.status, 403);
  assert.equal(touched, false);
});

test("la petición previa (OPTIONS) permite Authorization", async () => {
  const res = await worker.fetch(new Request("https://shop.test/admin/overview", { method: "OPTIONS", headers: { Origin: "https://pursec.club" } }), ENV);
  assert.equal(res.status, 204);
  assert.match(res.headers.get("Access-Control-Allow-Headers"), /Authorization/);
});

test("rutas desconocidas y métodos no permitidos -> 404 (con sesión válida)", async () => {
  assert.equal((await worker.fetch(req("/admin/nada"), ENV)).status, 404);
  assert.equal((await worker.fetch(req("/admin/orders", { method: "POST", body: {} }), ENV)).status, 404);
});

test("las respuestas del panel nunca se cachean", async () => {
  tables = { orders: [], product_variants: [], waitlist: [], expenses: [], social_stats: [] };
  const res = await worker.fetch(req("/admin/overview"), ENV);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("Cache-Control"), "no-store");
});

test("/admin/me devuelve el email y el modo de Stripe, sin secretos", async () => {
  const res = await worker.fetch(req("/admin/me"), ENV);
  const body = await res.json();
  assert.deepEqual(body, { email: "owner@pursec.test", stripe_mode: "test" });
});

test("una pedido con nombre malicioso se devuelve como dato, el servidor no lo interpreta", async () => {
  tables = { orders: [{ id: "a", created_at: "2026-10-27T10:00:00Z", status: "paid", amount_total_eur: "10.00", customer_name: "<img src=x onerror=alert(1)>", items: [], shipping: {} }] };
  const res = await worker.fetch(req("/admin/orders"), ENV);
  const body = await res.json();
  assert.equal(body.orders[0].name, "<img src=x onerror=alert(1)>");
});

// ---------------------------------------------------------------- cálculos
const O = (over) => ({ id: "o", created_at: "2026-10-27T10:00:00Z", status: "paid", amount_total_eur: "100.00", shipping: { country_code: "ES" }, items: [], ...over });

test("los pedidos cancelados, reembolsados y fallidos no cuentan como ingresos", () => {
  const orders = [O({}), O({ status: "canceled" }), O({ status: "refunded" }), O({ status: "failed" }), O({ status: "shipped", amount_total_eur: "50" })];
  const s = periodStats(orders, NOW - 30 * 86400000, NOW + 86400000);
  assert.equal(s.revenue, 150);
  assert.equal(s.orders, 2);
  assert.equal(s.aov, 75);
});

test("IVA: el bruto se divide entre 1,21 y la suma cuadra", () => {
  const { base, vat } = splitVat(121);
  assert.equal(base, 100);
  assert.equal(vat, 21);
  const x = splitVat(79);
  assert.equal(Math.round((x.base + x.vat) * 100) / 100, 79);
});

test("serie diaria: 30 días, sin huecos, en hora de Madrid", () => {
  const d = dailySeries([O({ created_at: "2026-10-27T23:30:00Z" })], 30, NOW); // 28 oct 00:30 en Madrid
  assert.equal(d.length, 30);
  assert.equal(d[29].d, "2026-10-28");
  assert.equal(d[29].revenue, 100);
  assert.equal(d.reduce((t, x) => t + x.orders, 0), 1);
});

test("serie mensual: 6 meses terminando en el actual", () => {
  const m = monthlySeries([O({})], 6, NOW);
  assert.deepEqual(m.map((x) => x.m), ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]);
  assert.equal(m[5].revenue, 100);
});

test("pedidos por enviar: antigüedad y más de 24 h", () => {
  const t = toShipInfo([O({ created_at: "2026-10-26T10:00:00Z" }), O({ created_at: "2026-10-28T10:00:00Z", status: "packed" }), O({ status: "shipped" })], NOW);
  assert.equal(t.count, 2);
  assert.equal(t.over24h, 1);
  assert.equal(t.oldest_hours, 50);
});

test("stock: unidades, valor, agotadas, poco stock y sin coste", () => {
  const s = stockSummary([
    { stock: 5, unit_cost_eur: "10.00", low_stock_alert: 2, active: true },
    { stock: 2, unit_cost_eur: null, low_stock_alert: 2, active: true },
    { stock: 0, unit_cost_eur: "10", low_stock_alert: 2, active: true },
    { stock: 0, unit_cost_eur: "10", low_stock_alert: 2, active: false },
  ]);
  assert.deepEqual(s, { variants: 4, units: 7, value_eur: 50, low: 1, out: 1, missing_cost: 1 });
});

test("lista de espera: totales, 7 días y 30 días", () => {
  const w = waitlistSummary([
    { created_at: "2026-10-27T10:00:00Z", source: "web-home", lang: "en" },
    { created_at: "2026-10-10T10:00:00Z", source: "web-home", lang: "en" },
    { created_at: "2026-10-22T10:00:00Z", source: null, lang: "es" },
  ], NOW);
  assert.equal(w.total, 3);
  assert.equal(w.last7, 2);
  assert.equal(w.daily.length, 30);
  assert.equal(w.by_source[0].key, "web-home");
});

test("clientes: agrupa por email y suma lo gastado", () => {
  const c = customersFromOrders([O({ email: "A@x.com", amount_total_eur: "40" }), O({ email: "a@x.com", amount_total_eur: "60" }), O({ email: "b@x.com", status: "canceled" })]);
  assert.equal(c.length, 1);
  assert.equal(c[0].orders, 2);
  assert.equal(c[0].spent, 100);
});

test("OSS: solo cuenta ventas a otros países de la UE este año", () => {
  const o = ossStatus([O({ shipping: { country_code: "FR" }, amount_total_eur: "8000" }), O({ shipping: { country_code: "ES" }, amount_total_eur: "5000" }), O({ shipping: { country_code: "DE" }, created_at: "2025-12-01T10:00:00Z", amount_total_eur: "999" })], NOW);
  assert.equal(o.gross_other_eu, 8000);
  assert.equal(o.pct, 80);
});

test("coste de prendas: usa el coste unitario y avisa de las unidades sin coste", () => {
  const cost = new Map([[1, 20], [2, null]]);
  const r = cogsForOrders([{ items: [{ variant_id: 1, qty: 2 }, { variant_id: 2, qty: 3 }, { variant_id: 9, qty: 1 }] }], cost);
  assert.equal(r.cogs, 40);
  assert.equal(r.missing_units, 4);
});

test("modo de Stripe según el prefijo de la clave", () => {
  assert.equal(stripeMode({ STRIPE_SECRET_KEY: "sk_test_1" }), "test");
  assert.equal(stripeMode({ STRIPE_SECRET_KEY: "sk_live_1" }), "live");
  assert.equal(stripeMode({}), "missing");
});

test("alertas: críticas por pedidos sin enviar y sin stock", () => {
  const orders = [O({ stock_issue: true })];
  const a = buildAlerts({ mode: "live", toShip: { over24h: 2 }, orders, stock: { out: 0, low: 0 }, oss: { pct: 10 }, noteIssues: 0, socialReady: true });
  assert.equal(a.filter((x) => x.level === "critical").length, 2);
});

test("dayKey usa la hora de Madrid", () => {
  assert.equal(dayKey(Date.parse("2026-10-27T22:30:00Z")), "2026-10-27"); // 00:30 del 28 en Madrid (CET UTC+1 desde el 25 oct)
  assert.equal(dayKey(Date.parse("2026-10-27T23:30:00Z")), "2026-10-28");
});

// ---------------------------------------------------------------- redes sociales
test("redes: validación de la instantánea", () => {
  const ok = validateSocial({ platform: "instagram", stat_date: "2026-10-28", followers: "120", views: 3400 }, NOW);
  assert.deepEqual(ok, { platform: "instagram", stat_date: "2026-10-28", followers: 120, views: 3400, interactions: null, posts: null, note: null });
  assert.throws(() => validateSocial({ platform: "myspace", stat_date: "2026-10-28", followers: 1 }, NOW), /Plataforma/);
  assert.throws(() => validateSocial({ platform: "x", stat_date: "2026-12-31", followers: 1 }, NOW), /futura/);
  assert.throws(() => validateSocial({ platform: "x", stat_date: "2026-10-28", followers: -3 }, NOW), /enteros/);
  assert.throws(() => validateSocial({ platform: "x", stat_date: "2026-10-28" }, NOW), /seguidores/);
  assert.throws(() => validateSocial({ platform: "x", stat_date: "hoy", followers: 1 }, NOW), /Fecha/);
});

test("redes: variación contra la medición anterior y a 7 días", () => {
  const s = summarizeSocial([
    { platform: "tiktok", stat_date: "2026-10-20", followers: 100 },
    { platform: "tiktok", stat_date: "2026-10-27", followers: 130 },
    { platform: "tiktok", stat_date: "2026-10-28", followers: 150 },
  ]).find((x) => x.platform === "tiktok");
  assert.equal(s.latest.followers, 150);
  assert.equal(s.delta_prev, 20);
  assert.equal(s.delta_7d, 50);
});

test("POST /admin/social guarda con upsert y rechaza datos malos", async () => {
  let saved;
  const before = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    if (String(url).includes("/rest/v1/social_stats")) { saved = { url: String(url), body: JSON.parse(init.body), prefer: init.headers.Prefer }; return new Response("", { status: 201 }); }
    return before(url, init);
  };
  const ok = await worker.fetch(req("/admin/social", { method: "POST", body: { platform: "tiktok", stat_date: "2026-10-28", followers: 150 } }), ENV);
  assert.equal(ok.status, 200);
  assert.match(saved.url, /on_conflict=platform,stat_date/);
  assert.match(saved.prefer, /merge-duplicates/);
  assert.equal(saved.body.followers, 150);
  const bad = await worker.fetch(req("/admin/social", { method: "POST", body: { platform: "nope", stat_date: "2026-10-28", followers: 1 } }), ENV);
  assert.equal(bad.status, 400);
});

test("redes: si la tabla no existe todavía, el panel lo dice en vez de romperse", async () => {
  tables = { social_stats: new Error("missing") };
  const res = await worker.fetch(req("/admin/social"), ENV);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.ready, false);
  assert.equal(body.platforms.length, 4);
});
