// Pruebas: node --test workers/shop/test/
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { parseCart, buildSessionParams } from "../src/checkout.js";
import { verifyStripeSignature, shippingFrom } from "../src/orders.js";
import worker from "../src/index.js";

const ENV = {
  SUPABASE_URL: "https://db.test",
  SUPABASE_SERVICE_KEY: "sb_secret_test",
  STRIPE_SECRET_KEY: "sk_test_x",
  STRIPE_WEBHOOK_SECRET: "whsec_test",
  PRINTFUL_TOKEN: "pf_test",
  PRINTFUL_WEBHOOK_TOKEN: "tok123",
  SHIPPING_EUR: "4.95",
  SITE_URL: "https://pursec.club",
  PRINTFUL_CONFIRM: "false",
};

const VARIANTS = [
  { id: 11, size: "M", color: "Black", printful_sync_variant_id: 9001, product: { id: 1, slug: "heavy-hoodie", name: "Heavy Hoodie", price_eur: "79.00", active: true } },
  { id: 12, size: "L", color: "Black", printful_sync_variant_id: null, product: { id: 1, slug: "heavy-hoodie", name: "Heavy Hoodie", price_eur: "79.00", active: true } },
];

// ---------------------------------------------------------------- fetch simulado
let calls = [];
let routes = [];
function route(match, reply) { routes.push({ match, reply }); }
beforeEach(() => {
  calls = []; routes = [];
  globalThis.fetch = async (url, init = {}) => {
    const call = { url: String(url), method: init.method || "GET", body: init.body, headers: init.headers || {} };
    calls.push(call);
    const r = routes.find((x) => x.match(call));
    if (!r) throw new Error(`Llamada no esperada: ${call.method} ${call.url}`);
    const { status = 200, body } = typeof r.reply === "function" ? r.reply(call) : r.reply;
    return new Response(body === undefined ? "" : JSON.stringify(body), { status });
  };
});

async function signed(payload, secret = ENV.STRIPE_WEBHOOK_SECRET, t = Math.floor(Date.now() / 1000)) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${payload}`));
  return `t=${t},v1=${[...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

// ---------------------------------------------------------------- carrito
test("el carrito une líneas repetidas y limita cantidades", () => {
  assert.deepEqual(parseCart({ items: [{ variant_id: 11, quantity: 2 }, { variant_id: "11", quantity: 1 }] }), [{ variant_id: 11, quantity: 3 }]);
  assert.throws(() => parseCart({ items: [] }));
  assert.throws(() => parseCart({ items: [{ variant_id: 11, quantity: 9 }] }));
  assert.throws(() => parseCart({ items: [{ variant_id: "x" }] }));
});

test("el precio sale de Supabase y el envío es obligatorio", () => {
  const p = buildSessionParams([{ variant_id: 11, quantity: 2 }], VARIANTS, ENV);
  assert.equal(p.mode, "payment");
  assert.equal(p.line_items[0].price_data.unit_amount, 7900);
  assert.equal(p.line_items[0].quantity, 2);
  assert.equal(p.shipping_options[0].shipping_rate_data.fixed_amount.amount, 495);
  assert.ok(p.shipping_address_collection.allowed_countries.includes("ES"));
  assert.equal(p.metadata.cart, "[[11,2]]");
  assert.throws(() => buildSessionParams([{ variant_id: 11, quantity: 1 }], VARIANTS, { ...ENV, SHIPPING_EUR: "" }), /CONFIG/);
  assert.throws(() => buildSessionParams([{ variant_id: 12, quantity: 1 }], VARIANTS, ENV), /Printful/);
  assert.throws(() => buildSessionParams([{ variant_id: 99, quantity: 1 }], VARIANTS, ENV), /no está a la venta/);
});

test("POST /checkout devuelve la URL de Stripe", async () => {
  route((c) => c.url.startsWith("https://db.test/rest/v1/product_variants"), { body: [VARIANTS[0]] });
  route((c) => c.url === "https://api.stripe.com/v1/checkout/sessions", { body: { id: "cs_test_1", url: "https://checkout.stripe.com/c/pay/cs_test_1" } });
  const res = await worker.fetch(new Request("https://shop.test/checkout", { method: "POST", headers: { Origin: "https://pursec.club" }, body: JSON.stringify({ items: [{ variant_id: 11, quantity: 1 }] }) }), ENV);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).url, "https://checkout.stripe.com/c/pay/cs_test_1");
  assert.equal(res.headers.get("Access-Control-Allow-Origin"), "https://pursec.club");
  const form = new URLSearchParams(calls[1].body);
  assert.equal(form.get("line_items[0][price_data][unit_amount]"), "7900");
});

test("/checkout rechaza orígenes de fuera", async () => {
  const res = await worker.fetch(new Request("https://shop.test/checkout", { method: "POST", headers: { Origin: "https://evil.test" }, body: "{}" }), ENV);
  assert.equal(res.status, 403);
});

// ---------------------------------------------------------------- webhook de Stripe
const SESSION = {
  id: "cs_test_abc", mode: "payment", payment_status: "paid", payment_intent: "pi_1", amount_total: 8395,
  metadata: { cart: "[[11,1]]" },
  customer_details: { email: "ana@example.com", name: "Ana", phone: "+34600000000" },
  collected_information: { shipping_details: { name: "Ana Pérez", address: { line1: "C/ Mayor 1", line2: "", city: "Barcelona", state: "B", country: "ES", postal_code: "08001" } } },
};

test("firma de Stripe: válida, caducada y falsa", async () => {
  const body = '{"a":1}';
  assert.equal(await verifyStripeSignature(body, await signed(body), ENV.STRIPE_WEBHOOK_SECRET), true);
  assert.equal(await verifyStripeSignature(body, await signed(body, ENV.STRIPE_WEBHOOK_SECRET, 1000), ENV.STRIPE_WEBHOOK_SECRET), false);
  assert.equal(await verifyStripeSignature(body, await signed(body, "otro"), ENV.STRIPE_WEBHOOK_SECRET), false);
});

test("la dirección de envío se lee del formato nuevo y del antiguo", () => {
  assert.equal(shippingFrom(SESSION).city, "Barcelona");
  const old = { ...SESSION, collected_information: undefined, shipping_details: SESSION.collected_information.shipping_details };
  assert.equal(shippingFrom(old).zip, "08001");
});

test("pago completado -> pedido en Supabase -> borrador en Printful -> submitted", async () => {
  const ORDER_ID = "0f8fad5b-d9cb-469f-a165-70867728950e";
  route((c) => c.method === "GET" && c.url.includes("/rest/v1/orders?stripe_session_id"), { body: [] });
  route((c) => c.url.includes("/rest/v1/product_variants"), { body: [VARIANTS[0]] });
  route((c) => c.method === "POST" && c.url.includes("/rest/v1/orders"), { body: [{ id: ORDER_ID, status: "paid" }] });
  route((c) => c.url.startsWith("https://api.printful.com/orders"), { body: { code: 200, result: { id: 555 } } });
  route((c) => c.method === "PATCH" && c.url.includes(`/rest/v1/orders?id=eq.${ORDER_ID}`), { body: [] });

  const payload = JSON.stringify({ type: "checkout.session.completed", data: { object: SESSION } });
  const res = await worker.fetch(new Request("https://shop.test/stripe-webhook", { method: "POST", headers: { "stripe-signature": await signed(payload) }, body: payload }), ENV);
  assert.equal(res.status, 200);
  const out = await res.json();
  assert.equal(out.printful_order_id, 555);
  assert.equal(out.confirmed, false);

  const pfCall = calls.find((c) => c.url.startsWith("https://api.printful.com/orders"));
  assert.equal(pfCall.url, "https://api.printful.com/orders"); // sin confirm=true: borrador
  const pfBody = JSON.parse(pfCall.body);
  assert.equal(pfBody.external_id, ORDER_ID.replace(/-/g, ""));
  assert.equal(pfBody.recipient.country_code, "ES");
  assert.deepEqual(pfBody.items, [{ sync_variant_id: 9001, quantity: 1 }]);
  const patch = calls.filter((c) => c.method === "PATCH").pop();
  assert.deepEqual(JSON.parse(patch.body), { status: "submitted", printful_order_id: 555, error: null });
});

test("con PRINTFUL_CONFIRM=true el pedido se confirma", async () => {
  route((c) => c.method === "GET" && c.url.includes("/rest/v1/orders?stripe_session_id"), { body: [{ id: "0f8fad5b-d9cb-469f-a165-70867728950e", status: "paid" }] });
  route((c) => c.url.includes("/rest/v1/product_variants"), { body: [VARIANTS[0]] });
  route((c) => c.url.startsWith("https://api.printful.com/orders"), { body: { result: { id: 556 } } });
  route((c) => c.method === "PATCH", { body: [] });
  const payload = JSON.stringify({ type: "checkout.session.completed", data: { object: SESSION } });
  const res = await worker.fetch(new Request("https://shop.test/stripe-webhook", { method: "POST", headers: { "stripe-signature": await signed(payload) }, body: payload }), { ...ENV, PRINTFUL_CONFIRM: "true" });
  assert.equal(res.status, 200);
  assert.ok(calls.some((c) => c.url === "https://api.printful.com/orders?confirm=true"));
});

test("un aviso repetido no crea un segundo pedido en Printful", async () => {
  route((c) => c.url.includes("/rest/v1/orders?stripe_session_id"), { body: [{ id: "x", status: "submitted" }] });
  const payload = JSON.stringify({ type: "checkout.session.completed", data: { object: SESSION } });
  const res = await worker.fetch(new Request("https://shop.test/stripe-webhook", { method: "POST", headers: { "stripe-signature": await signed(payload) }, body: payload }), ENV);
  assert.equal((await res.json()).already, "submitted");
  assert.ok(!calls.some((c) => c.url.includes("printful")));
});

test("si Printful falla, el pedido queda en failed y Stripe reintenta (500)", async () => {
  const ORDER_ID = "0f8fad5b-d9cb-469f-a165-70867728950e";
  route((c) => c.method === "GET" && c.url.includes("/rest/v1/orders?stripe_session_id"), { body: [] });
  route((c) => c.url.includes("/rest/v1/product_variants"), { body: [VARIANTS[0]] });
  route((c) => c.method === "POST" && c.url.includes("/rest/v1/orders"), { body: [{ id: ORDER_ID, status: "paid" }] });
  route((c) => c.url.startsWith("https://api.printful.com/orders"), { status: 400, body: { error: { message: "Invalid address" } } });
  route((c) => c.method === "PATCH", { body: [] });
  const payload = JSON.stringify({ type: "checkout.session.completed", data: { object: SESSION } });
  const res = await worker.fetch(new Request("https://shop.test/stripe-webhook", { method: "POST", headers: { "stripe-signature": await signed(payload) }, body: payload }), ENV);
  assert.equal(res.status, 500);
  const patch = JSON.parse(calls.filter((c) => c.method === "PATCH").pop().body);
  assert.equal(patch.status, "failed");
  assert.match(patch.error, /Invalid address/);
});

test("eventos que no son de pago se ignoran", async () => {
  const payload = JSON.stringify({ type: "charge.succeeded", data: { object: {} } });
  const res = await worker.fetch(new Request("https://shop.test/stripe-webhook", { method: "POST", headers: { "stripe-signature": await signed(payload) }, body: payload }), ENV);
  assert.equal((await res.json()).ignored, "charge.succeeded");
});

// ---------------------------------------------------------------- webhook de Printful
test("Printful: sin token no entra; package_shipped guarda el seguimiento", async () => {
  const bad = await worker.fetch(new Request("https://shop.test/printful-webhook?token=no", { method: "POST", body: "{}" }), ENV);
  assert.equal(bad.status, 401);

  route((c) => c.method === "PATCH" && c.url.includes("orders?id=eq.0f8fad5b-d9cb-469f-a165-70867728950e"), { body: [] });
  const ev = { type: "package_shipped", data: { order: { external_id: "0f8fad5bd9cb469fa16570867728950e" }, shipment: { tracking_number: "TRK1", tracking_url: "https://track.test/TRK1", carrier: "DHL" } } };
  const res = await worker.fetch(new Request("https://shop.test/printful-webhook?token=tok123", { method: "POST", body: JSON.stringify(ev) }), ENV);
  assert.equal(res.status, 200);
  assert.deepEqual(JSON.parse(calls[0].body), { status: "shipped", tracking_number: "TRK1", tracking_url: "https://track.test/TRK1", carrier: "DHL" });
});

test("salud y rutas desconocidas", async () => {
  assert.equal((await worker.fetch(new Request("https://shop.test/"), ENV)).status, 200);
  assert.equal((await worker.fetch(new Request("https://shop.test/nada"), ENV)).status, 404);
});
