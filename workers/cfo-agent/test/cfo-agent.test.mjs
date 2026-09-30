// Pruebas: node --test workers/cfo-agent/test/
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeTrialEnd, mondayAfter, localToUtc } from "../src/trial.js";
import { verifyStripeSignature, subscriptionToProfile, handleWebhook } from "../src/webhook.js";
import { handleCheckout, handlePortal } from "../src/billing.js";
import { stripeForm } from "../src/clients.js";
import worker from "../src/index.js";

// Calendario F1 2026 de la tabla races (fechas de carrera)
const F1_2026 = ["2026-09-26", "2026-10-04", "2026-10-11", "2026-10-25", "2026-11-01", "2026-11-08", "2026-11-21", "2026-11-29", "2026-12-06"];

// ---------------------------------------------------------------- prueba gratuita
test("lunes siguiente a carrera en domingo y en sábado", () => {
  assert.equal(mondayAfter("2026-10-04"), "2026-10-05"); // domingo
  assert.equal(mondayAfter("2026-11-21"), "2026-11-23"); // sábado (Las Vegas)
  assert.equal(mondayAfter("2026-10-05"), "2026-10-12"); // lunes -> lunes siguiente
});

test("hora de Madrid con horario de verano e invierno", () => {
  assert.equal(localToUtc("2026-10-05", 23, 59, 59).toISOString(), "2026-10-05T21:59:59.000Z"); // CEST
  assert.equal(localToUtc("2026-11-23", 23, 59, 59).toISOString(), "2026-11-23T22:59:59.000Z"); // CET
});

test("alta el jueves 1 oct: 7 días cubren Sepang y Singapur -> 7 días", () => {
  const now = new Date("2026-10-01T10:00:00Z");
  const r = computeTrialEnd(now, F1_2026);
  assert.equal(r.nextRace, "2026-10-04");
  assert.equal(r.rule, "7_dias");
  assert.equal(r.trialEnd.toISOString(), "2026-10-08T10:00:00.000Z");
});

test("alta el lunes 12 oct: próxima carrera el 25 -> termina el lunes 26 a las 23:59 Madrid", () => {
  const now = new Date("2026-10-12T09:00:00Z");
  const r = computeTrialEnd(now, F1_2026);
  assert.equal(r.nextRace, "2026-10-25");
  assert.equal(r.rule, "lunes_tras_carrera");
  assert.equal(r.trialEnd.toISOString(), "2026-10-26T22:59:59.000Z"); // 26 oct ya en horario de invierno
});

test("alta en domingo de carrera cuenta esa carrera (7 días ganan)", () => {
  const now = new Date("2026-10-11T08:00:00Z");
  const r = computeTrialEnd(now, F1_2026);
  assert.equal(r.nextRace, "2026-10-11");
  assert.equal(r.rule, "7_dias");
});

test("después de la última carrera y sin calendario nuevo -> 7 días", () => {
  const now = new Date("2026-12-10T12:00:00Z");
  const r = computeTrialEnd(now, F1_2026);
  assert.equal(r.nextRace, null);
  assert.equal(r.rule, "7_dias_sin_calendario");
  assert.equal(r.trialEnd.toISOString(), "2026-12-17T12:00:00.000Z");
});

test("pretemporada: sin tope la prueba dura hasta la primera carrera; con tope se corta", () => {
  const now = new Date("2026-12-10T12:00:00Z");
  const dates = ["2027-03-07"]; // fecha ficticia solo para la prueba
  assert.equal(computeTrialEnd(now, dates).rule, "lunes_tras_carrera");
  const capped = computeTrialEnd(now, dates, { maxTrialDays: 14 });
  assert.equal(capped.rule, "lunes_tras_carrera_con_tope");
  assert.equal(capped.trialEnd.toISOString(), "2026-12-24T12:00:00.000Z");
});

// ---------------------------------------------------------------- firma de Stripe
async function sign(payload, secret, t) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${payload}`));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

test("firma válida, inválida, caducada y sin secreto", async () => {
  const secret = "whsec_test";
  const payload = '{"id":"evt_1"}';
  const t = 1790000000;
  const sig = await sign(payload, secret, t);
  assert.equal(await verifyStripeSignature(payload, `t=${t},v1=${sig}`, secret, t + 10), true);
  assert.equal(await verifyStripeSignature(payload, `t=${t},v1=${"0".repeat(64)}`, secret, t + 10), false);
  assert.equal(await verifyStripeSignature(payload, `t=${t},v1=${sig}`, secret, t + 1000), false);
  assert.equal(await verifyStripeSignature(payload, `t=${t},v1=${sig}`, undefined, t + 10), false);
  assert.equal(await verifyStripeSignature(payload + " ", `t=${t},v1=${sig}`, secret, t + 10), false);
});

// ---------------------------------------------------------------- suscripción -> perfil
test("estados de Stripe -> plan", () => {
  const base = { id: "sub_1", customer: "cus_1", items: { data: [{ price: { recurring: { interval: "month" } }, current_period_end: 1791000000 }] } };
  assert.equal(subscriptionToProfile({ ...base, status: "trialing", trial_end: 1791000000 }).plan, "TRACKSIDE");
  assert.equal(subscriptionToProfile({ ...base, status: "active" }).plan, "TRACKSIDE");
  assert.equal(subscriptionToProfile({ ...base, status: "past_due" }).plan, "PADDOCK");
  assert.equal(subscriptionToProfile({ ...base, status: "canceled" }).plan, "PADDOCK");
  const p = subscriptionToProfile({ ...base, status: "active", cancel_at_period_end: true });
  assert.equal(p.billing_interval, "month");
  assert.equal(p.cancel_at_period_end, true);
  assert.equal(p.current_period_end, new Date(1791000000 * 1000).toISOString());
});

test("codificación de formularios de Stripe", () => {
  const f = stripeForm({ line_items: [{ price: "p", quantity: 1 }], subscription_data: { trial_end: 5, metadata: { a: "b" } }, x: undefined });
  assert.equal(f.toString(), "line_items%5B0%5D%5Bprice%5D=p&line_items%5B0%5D%5Bquantity%5D=1&subscription_data%5Btrial_end%5D=5&subscription_data%5Bmetadata%5D%5Ba%5D=b");
});

// ---------------------------------------------------------------- flujos con fetch simulado
const ENV = {
  SUPABASE_URL: "https://sb.test",
  SUPABASE_SERVICE_KEY: "sb_secret_test",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  STRIPE_SECRET_KEY: "sk_test_x",
  STRIPE_WEBHOOK_SECRET: "whsec_test",
  PRICE_MONTHLY: "price_m",
  PRICE_YEARLY: "price_y",
  SITE_URL: "https://pursec.club",
  LAUNCH_SERIES: "F1",
};
const CORS = { "Access-Control-Allow-Origin": "https://pursec.club" };

function mockFetch(profile, { user = { id: "u1", email: "a@b.c" } } = {}) {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url);
    calls.push({ url: u, method: init.method || "GET", body: init.body });
    const ok = (data) => new Response(JSON.stringify(data), { status: 200 });
    if (u.endsWith("/auth/v1/user")) return user ? ok(user) : new Response("{}", { status: 401 });
    if (u.includes("/rest/v1/profiles") && (init.method || "GET") === "GET") return ok(profile ? [profile] : []);
    if (u.includes("/rest/v1/profiles")) return ok([{ id: "u1" }]);
    if (u.includes("/rest/v1/races")) return ok([{ race_date: "2026-10-25" }]);
    if (u.includes("/rest/v1/")) return ok([]);
    if (u.endsWith("/v1/customers")) return ok({ id: "cus_new" });
    if (u.endsWith("/v1/checkout/sessions")) return ok({ url: "https://checkout.stripe.com/c/test" });
    if (u.endsWith("/v1/billing_portal/sessions")) return ok({ url: "https://billing.stripe.com/p/session/test" });
    if (u.includes("/v1/subscriptions/")) return ok({ id: "sub_1", customer: "cus_1", status: "active", metadata: { supabase_user_id: "u1" }, items: { data: [] } });
    return new Response("no mock", { status: 500 });
  };
  return calls;
}

const req = (body, token = "tok") =>
  new Request("https://w.test/checkout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

test("checkout mensual primera vez: crea cliente y pone trial_end", async () => {
  const calls = mockFetch({ id: "u1", subscription_status: "none", trial_end: null, stripe_subscription_id: null, stripe_customer_id: null });
  const res = await handleCheckout(req({ interval: "month" }), ENV, CORS);
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.url, "https://checkout.stripe.com/c/test");
  assert.ok(data.trial_end);
  const checkout = calls.find((c) => c.url.endsWith("/checkout/sessions"));
  const params = new URLSearchParams(checkout.body);
  assert.equal(params.get("customer"), "cus_new");
  assert.equal(params.get("line_items[0][price]"), "price_m");
  assert.ok(params.get("subscription_data[trial_end]"));
  assert.equal(params.get("client_reference_id"), "u1");
});

test("checkout anual: sin prueba", async () => {
  const calls = mockFetch({ id: "u1", subscription_status: "none", stripe_customer_id: "cus_1" });
  const res = await handleCheckout(req({ interval: "year" }), ENV, CORS);
  assert.equal(res.status, 200);
  const params = new URLSearchParams(calls.find((c) => c.url.endsWith("/checkout/sessions")).body);
  assert.equal(params.get("line_items[0][price]"), "price_y");
  assert.equal(params.get("subscription_data[trial_end]"), null);
  assert.equal(calls.some((c) => c.url.endsWith("/v1/customers")), false); // reutiliza el cliente
});

test("checkout mensual repetido: sin segunda prueba", async () => {
  const calls = mockFetch({ id: "u1", subscription_status: "canceled", trial_end: "2026-10-08T00:00:00Z", stripe_customer_id: "cus_1", stripe_subscription_id: "sub_old" });
  await handleCheckout(req({ interval: "month" }), ENV, CORS);
  const params = new URLSearchParams(calls.find((c) => c.url.endsWith("/checkout/sessions")).body);
  assert.equal(params.get("subscription_data[trial_end]"), null);
});

test("checkout: ya suscrito -> 409; sin sesión -> 401; plan raro -> 400", async () => {
  mockFetch({ id: "u1", subscription_status: "trialing" });
  assert.equal((await handleCheckout(req({ interval: "month" }), ENV, CORS)).status, 409);
  mockFetch(null, { user: null });
  assert.equal((await handleCheckout(req({ interval: "month" }), ENV, CORS)).status, 401);
  mockFetch({ id: "u1", subscription_status: "none" });
  assert.equal((await handleCheckout(req({ interval: "week" }), ENV, CORS)).status, 400);
});

test("portal: con cliente devuelve URL; sin cliente 404", async () => {
  mockFetch({ id: "u1", stripe_customer_id: "cus_1" });
  const ok = await handlePortal(req({}), ENV, CORS);
  assert.equal((await ok.json()).url, "https://billing.stripe.com/p/session/test");
  mockFetch({ id: "u1", stripe_customer_id: null });
  assert.equal((await handlePortal(req({}), ENV, CORS)).status, 404);
});

test("webhook firmado de suscripción actualiza profiles; sin firma se rechaza", async () => {
  const calls = mockFetch(null);
  const event = { type: "customer.subscription.updated", data: { object: { id: "sub_1", customer: "cus_1", status: "active", metadata: {} } } };
  const payload = JSON.stringify(event);
  const t = Math.floor(Date.now() / 1000);
  const sig = await sign(payload, ENV.STRIPE_WEBHOOK_SECRET, t);
  const res = await handleWebhook(new Request("https://w.test/", { method: "POST", headers: { "stripe-signature": `t=${t},v1=${sig}` }, body: payload }), ENV);
  assert.equal(res.status, 200);
  const patch = calls.find((c) => c.url.includes("/rest/v1/profiles") && c.method === "PATCH");
  assert.ok(patch.url.includes("id=eq.u1")); // usa el usuario de los metadatos de la suscripción releída
  assert.equal(JSON.parse(patch.body).plan, "TRACKSIDE");

  const bad = await handleWebhook(new Request("https://w.test/", { method: "POST", headers: { "stripe-signature": `t=${t},v1=${"0".repeat(64)}` }, body: payload }), ENV);
  assert.equal(bad.status, 400);
});

test("CORS: origen ajeno rechazado, pursec.club y vistas previas permitidos", async () => {
  const pre = (origin) => worker.fetch(new Request("https://w.test/checkout", { method: "OPTIONS", headers: { Origin: origin } }), ENV);
  assert.equal((await pre("https://evil.example")).status, 403);
  assert.equal((await pre("https://pursec.club")).status, 204);
  assert.equal((await pre("https://abc123-pursec-platform.pursec-telemetry-hq.workers.dev")).status, 204);
});
