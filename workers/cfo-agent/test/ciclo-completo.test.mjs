// Ciclo completo de un miembro, de punta a punta, contra el código real del Worker.
// Stripe y Supabase se simulan con estado (una tabla `profiles` y un almacén de suscripciones),
// y cada aviso del webhook va firmado como lo firma Stripe.
// Ejecutar: node --test workers/cfo-agent/test/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

const ENV = {
  SUPABASE_URL: "https://sb.test",
  SUPABASE_SERVICE_KEY: "sb_secret_test",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  STRIPE_SECRET_KEY: "rk_test_x",
  STRIPE_WEBHOOK_SECRET: "whsec_test",
  PRICE_MONTHLY: "price_m",
  PRICE_YEARLY: "price_y",
  SITE_URL: "https://pursec.club",
  LAUNCH_SERIES: "F1",
};
const USER = { id: "u1", email: "socio@ejemplo.com" };
const DAY = 86400;

// ------------------------------------------------------------------ mundo simulado
function world() {
  const db = {
    profiles: [{ id: USER.id, email: USER.email, plan: "PADDOCK", subscription_status: "none", trial_end: null, stripe_customer_id: null, stripe_subscription_id: null }],
    financial_ledger: [],
  };
  const stripeSubs = {};
  const stripeCalls = [];
  const balance = { txn_1: { fee: 40 } }; // 0,40 € de comisión real

  const ok = (data) => new Response(JSON.stringify(data), { status: 200 });
  const matches = (row, query) => {
    for (const [k, v] of query) {
      if (k === "select" || k === "order" || k === "limit") continue;
      const cell = row[k] == null ? null : String(row[k]);
      if (v === "is.null") { if (cell !== null) return false; continue; }
      if (v.startsWith("eq.")) { if (cell !== decodeURIComponent(v.slice(3))) return false; continue; }
    }
    return true;
  };

  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(String(url));
    const method = init.method || "GET";
    const body = init.body ? (typeof init.body === "string" && init.body.startsWith("{") ? JSON.parse(init.body) : init.body) : null;

    // Supabase Auth
    if (u.pathname === "/auth/v1/user") return ok(USER);

    // Supabase REST
    if (u.pathname.startsWith("/rest/v1/")) {
      const table = u.pathname.split("/").pop();
      if (table === "races") return ok([{ race_date: "2026-10-11" }, { race_date: "2026-10-25" }]);
      const rows = db[table];
      if (method === "GET") return ok(rows.filter((r) => matches(r, u.searchParams)));
      if (method === "PATCH") {
        const hit = rows.filter((r) => matches(r, u.searchParams));
        hit.forEach((r) => Object.assign(r, body));
        return ok(hit);
      }
      if (method === "POST") { rows.push(body); return ok([body]); }
    }

    // Stripe
    if (u.hostname === "api.stripe.com") {
      stripeCalls.push({ path: u.pathname, method, body });
      if (u.pathname === "/v1/customers") return ok({ id: "cus_1" });
      if (u.pathname === "/v1/checkout/sessions") return ok({ url: "https://checkout.stripe.com/c/test" });
      if (u.pathname === "/v1/billing_portal/sessions") return ok({ url: "https://billing.stripe.com/p/test" });
      const sub = u.pathname.match(/^\/v1\/subscriptions\/(.+)$/);
      if (sub) return ok(stripeSubs[sub[1]]);
      const bt = u.pathname.match(/^\/v1\/balance_transactions\/(.+)$/);
      if (bt) return ok(balance[bt[1]]);
    }
    return new Response("sin simular: " + u, { status: 500 });
  };

  return { db, stripeSubs, stripeCalls, profile: () => db.profiles[0] };
}

// ------------------------------------------------------------------ utilidades
async function sign(payload, secret, t) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${payload}`));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sendEvent(type, object) {
  const payload = JSON.stringify({ id: `evt_${Math.random().toString(36).slice(2)}`, type, data: { object } });
  const t = Math.floor(Date.now() / 1000);
  const sig = await sign(payload, ENV.STRIPE_WEBHOOK_SECRET, t);
  const res = await worker.fetch(new Request("https://cfo.test/", { method: "POST", headers: { "stripe-signature": `t=${t},v1=${sig}` }, body: payload }), ENV);
  assert.equal(res.status, 200, `${type} debería devolver 200`);
}

const call = (path, body) =>
  worker.fetch(
    new Request(`https://cfo.test${path}`, {
      method: "POST",
      headers: { Origin: "https://pursec.club", Authorization: "Bearer token", "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    ENV
  );

function subscription({ status, interval = "month", trialEnd = null, periodEnd, cancelAtPeriodEnd = false }) {
  return {
    id: "sub_1",
    customer: "cus_1",
    status,
    trial_end: trialEnd,
    cancel_at_period_end: cancelAtPeriodEnd,
    metadata: { supabase_user_id: USER.id },
    items: { data: [{ price: { id: interval === "month" ? "price_m" : "price_y", recurring: { interval } }, current_period_end: periodEnd }] },
  };
}

// ------------------------------------------------------------------ el ciclo
test("ciclo completo: alta, prueba, pago, anual, cancelación y pago fallido", async () => {
  const w = world();
  const now = Math.floor(Date.now() / 1000);

  // 1. Alta: el usuario pulsa "Suscribirme" (mensual)
  const res = await call("/checkout", { interval: "month" });
  assert.equal(res.status, 200);
  const out = await res.json();
  assert.equal(out.url, "https://checkout.stripe.com/c/test");
  assert.ok(out.trial_end, "el mensual de una cuenta nueva lleva prueba");
  assert.equal(w.profile().stripe_customer_id, "cus_1", "el cliente de Stripe queda guardado en su perfil");
  const session = new URLSearchParams(w.stripeCalls.find((c) => c.path === "/v1/checkout/sessions").body);
  assert.equal(session.get("subscription_data[metadata][supabase_user_id]"), USER.id);
  const trialEnd = Number(session.get("subscription_data[trial_end]"));
  assert.ok(trialEnd > now + 6 * DAY, "la prueba dura al menos 7 días");

  // 2. Prueba: Stripe crea la suscripción en trialing
  w.stripeSubs.sub_1 = subscription({ status: "trialing", trialEnd, periodEnd: trialEnd });
  await sendEvent("customer.subscription.created", w.stripeSubs.sub_1);
  assert.equal(w.profile().plan, "TRACKSIDE");
  assert.equal(w.profile().subscription_status, "trialing");
  assert.equal(w.profile().trial_end, new Date(trialEnd * 1000).toISOString());

  // Un segundo intento de alta mientras está en prueba se rechaza
  assert.equal((await call("/checkout", { interval: "month" })).status, 409);

  // 3. Fin de la prueba: primer cobro de 9,99 €
  const p1 = trialEnd + 30 * DAY;
  w.stripeSubs.sub_1 = subscription({ status: "active", trialEnd, periodEnd: p1 });
  await sendEvent("invoice.paid", { id: "in_1", customer: "cus_1", customer_email: USER.email, subscription: "sub_1" });
  await sendEvent("charge.succeeded", { id: "ch_1", amount: 999, balance_transaction: "txn_1", billing_details: { address: { country: "ES" } } });
  assert.equal(w.profile().plan, "TRACKSIDE");
  assert.equal(w.profile().subscription_status, "active");
  assert.equal(w.db.financial_ledger.length, 1);
  const entry = w.db.financial_ledger[0];
  assert.equal(entry.gross_eur, 9.99);
  assert.equal(entry.stripe_fee_eur, 0.4, "usa la comisión real de Stripe");
  assert.equal(entry.tx_type, "INGRESO_TRACKSIDE_MENSUAL");
  // Stripe reenvía el mismo cobro: no se apunta dos veces
  await sendEvent("charge.succeeded", { id: "ch_1", amount: 999, balance_transaction: "txn_1" });
  assert.equal(w.db.financial_ledger.length, 1);

  // 4. Cambio a anual desde el portal
  assert.equal((await call("/portal", {})).status, 200);
  const p2 = now + 365 * DAY;
  w.stripeSubs.sub_1 = subscription({ status: "active", interval: "year", trialEnd, periodEnd: p2 });
  await sendEvent("customer.subscription.updated", w.stripeSubs.sub_1);
  assert.equal(w.profile().billing_interval, "year");
  assert.equal(w.profile().plan, "TRACKSIDE");

  // 5. Cancelación: sigue siendo Trackside hasta el final del periodo pagado
  w.stripeSubs.sub_1 = subscription({ status: "active", interval: "year", trialEnd, periodEnd: p2, cancelAtPeriodEnd: true });
  await sendEvent("customer.subscription.updated", w.stripeSubs.sub_1);
  assert.equal(w.profile().plan, "TRACKSIDE");
  assert.equal(w.profile().cancel_at_period_end, true);

  w.stripeSubs.sub_1 = { ...subscription({ status: "canceled", interval: "year", periodEnd: p2 }), trial_end: null };
  await sendEvent("customer.subscription.deleted", w.stripeSubs.sub_1);
  assert.equal(w.profile().plan, "PADDOCK", "al terminar el periodo pierde el acceso");
  assert.equal(w.profile().trial_end, new Date(trialEnd * 1000).toISOString(), "se guarda la prueba ya usada");

  // Vuelve a suscribirse: sin segunda prueba
  w.stripeCalls.length = 0;
  assert.equal((await call("/checkout", { interval: "month" })).status, 200);
  const again = new URLSearchParams(w.stripeCalls.find((c) => c.path === "/v1/checkout/sessions").body);
  assert.equal(again.get("subscription_data[trial_end]"), null);

  // 6. Pago fallido: Stripe pasa la suscripción a past_due y el acceso se corta
  w.stripeSubs.sub_1 = subscription({ status: "past_due", periodEnd: p1 });
  await sendEvent("customer.subscription.updated", w.stripeSubs.sub_1);
  assert.equal(w.profile().plan, "PADDOCK");
  assert.equal(w.profile().subscription_status, "past_due");

  // ...y vuelve cuando el reintento de cobro sale bien
  w.stripeSubs.sub_1 = subscription({ status: "active", periodEnd: p1 });
  await sendEvent("customer.subscription.updated", w.stripeSubs.sub_1);
  assert.equal(w.profile().plan, "TRACKSIDE");
});

test("avisos desordenados: manda el estado actual de Stripe, no el del aviso", async () => {
  const w = world();
  w.db.profiles[0].stripe_customer_id = "cus_1";
  w.stripeSubs.sub_1 = subscription({ status: "canceled", periodEnd: 0 });
  // Llega tarde un aviso viejo que decía "active"
  await sendEvent("customer.subscription.updated", subscription({ status: "active", periodEnd: 0 }));
  assert.equal(w.profile().plan, "PADDOCK");
});
