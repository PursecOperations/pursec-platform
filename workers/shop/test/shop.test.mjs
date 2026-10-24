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
  SHIPPING_EUR: "4.95",
  SITE_URL: "https://pursec.club",
};

const VARIANTS = [
  { id: 11, size: "M", color: "Black", stock: 3, product: { id: 1, slug: "heavy-hoodie", name: "Heavy Hoodie", price_eur: "79.00", active: true } },
  { id: 12, size: "L", color: "Black", stock: 0, product: { id: 1, slug: "heavy-hoodie", name: "Heavy Hoodie", price_eur: "79.00", active: true } },
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
  assert.throws(() => buildSessionParams([{ variant_id: 12, quantity: 1 }], VARIANTS, ENV), /Sold out/);
  assert.throws(() => buildSessionParams([{ variant_id: 11, quantity: 4 }], VARIANTS, ENV), /Sold out/);
  assert.throws(() => buildSessionParams([{ variant_id: 99, quantity: 1 }], VARIANTS, ENV), /no está a la venta/);
});

test("envío gratis desde el umbral (70 € clavados ya es gratis)", () => {
  const env = { ...ENV, FREE_SHIPPING_FROM: "70" };
  // 1 prenda de 79 € supera 70 -> envío gratis
  const gratis = buildSessionParams([{ variant_id: 11, quantity: 1 }], VARIANTS, env);
  assert.equal(gratis.shipping_options[0].shipping_rate_data.fixed_amount.amount, 0);
  assert.match(gratis.shipping_options[0].shipping_rate_data.display_name, /Free/);
  // Justo 70,00 € ya es gratis
  const justo = [{ id: 11, size: "M", color: "Black", stock: 3, product: { id: 2, slug: "tee", name: "Tee", price_eur: "70.00", active: true } }];
  const clavado = buildSessionParams([{ variant_id: 11, quantity: 1 }], justo, env);
  assert.equal(clavado.shipping_options[0].shipping_rate_data.fixed_amount.amount, 0);
  // Por debajo de 70 € paga el envío estándar
  const barato = [{ id: 11, size: "M", color: "Black", stock: 3, product: { id: 3, slug: "cap", name: "Cap", price_eur: "35.00", active: true } }];
  assert.equal(buildSessionParams([{ variant_id: 11, quantity: 1 }], barato, env).shipping_options[0].shipping_rate_data.fixed_amount.amount, 495);
  // Dos de 35 € suman 70,00 € -> gratis; 69,99 € no; sin umbral configurado, nunca es gratis
  assert.equal(buildSessionParams([{ variant_id: 11, quantity: 2 }], barato, env).shipping_options[0].shipping_rate_data.fixed_amount.amount, 0);
  const casi = [{ id: 11, size: "M", color: "Black", stock: 3, product: { id: 4, slug: "x", name: "X", price_eur: "69.99", active: true } }];
  assert.equal(buildSessionParams([{ variant_id: 11, quantity: 1 }], casi, env).shipping_options[0].shipping_rate_data.fixed_amount.amount, 495);
  assert.equal(buildSessionParams([{ variant_id: 11, quantity: 1 }], VARIANTS, ENV).shipping_options[0].shipping_rate_data.fixed_amount.amount, 495);
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

const ORDER_ID = "0f8fad5b-d9cb-469f-a165-70867728950e";
async function postWebhook(env = ENV) {
  const payload = JSON.stringify({ type: "checkout.session.completed", data: { object: SESSION } });
  return worker.fetch(new Request("https://shop.test/stripe-webhook", { method: "POST", headers: { "stripe-signature": await signed(payload) }, body: payload }), env);
}

test("pago completado -> pedido en Supabase -> se descuenta el stock", async () => {
  route((c) => c.method === "GET" && c.url.includes("/rest/v1/orders?stripe_session_id"), { body: [] });
  route((c) => c.url.includes("/rest/v1/product_variants"), { body: [VARIANTS[0]] });
  route((c) => c.method === "POST" && c.url.includes("/rest/v1/orders"), { body: [{ id: ORDER_ID, status: "paid" }] });
  route((c) => c.url.includes("/rest/v1/rpc/apply_order_stock"), { body: [] });
  const res = await postWebhook();
  assert.equal(res.status, 200);
  const out = await res.json();
  assert.equal(out.order_id, ORDER_ID);
  assert.equal(out.stock_issue, false);
  const insert = JSON.parse(calls.find((c) => c.method === "POST" && c.url.includes("/rest/v1/orders")).body);
  assert.equal(insert.status, "paid");
  assert.equal(insert.shipping.country_code, "ES");
  assert.deepEqual(insert.items, [{ variant_id: 11, name: "Heavy Hoodie", size: "M", color: "Black", qty: 1, unit_eur: 79 }]);
  const rpc = JSON.parse(calls.find((c) => c.url.includes("apply_order_stock")).body);
  assert.deepEqual(rpc, { p_items: [{ variant_id: 11, qty: 1 }], p_ref: ORDER_ID });
  assert.ok(!calls.some((c) => c.url.includes("printful")));
});

test("si se pagó sin stock suficiente, el pedido queda marcado", async () => {
  route((c) => c.method === "GET" && c.url.includes("/rest/v1/orders?stripe_session_id"), { body: [] });
  route((c) => c.url.includes("/rest/v1/product_variants"), { body: [VARIANTS[0]] });
  route((c) => c.method === "POST" && c.url.includes("/rest/v1/orders"), { body: [{ id: ORDER_ID, status: "paid" }] });
  route((c) => c.url.includes("/rest/v1/rpc/apply_order_stock"), { body: [{ variant_id: 11, missing: 1 }] });
  route((c) => c.method === "PATCH" && c.url.includes(`/rest/v1/orders?id=eq.${ORDER_ID}`), { body: [] });
  const res = await postWebhook();
  assert.equal((await res.json()).stock_issue, true);
  const patch = JSON.parse(calls.find((c) => c.method === "PATCH").body);
  assert.equal(patch.stock_issue, true);
  assert.match(patch.notes, /sin stock/);
});

test("un aviso repetido no descuenta el stock dos veces", async () => {
  route((c) => c.url.includes("/rest/v1/orders?stripe_session_id"), { body: [{ id: ORDER_ID, status: "paid", stock_issue: false }] });
  route((c) => c.url.includes("/rest/v1/stock_movements"), { body: [{ id: 1 }] });
  const res = await postWebhook();
  assert.equal((await res.json()).already, "paid");
  assert.ok(!calls.some((c) => c.url.includes("apply_order_stock")));
});

test("si el pedido existe pero el stock no se descontó, se descuenta al reintentar", async () => {
  route((c) => c.url.includes("/rest/v1/orders?stripe_session_id"), { body: [{ id: ORDER_ID, status: "paid", stock_issue: false }] });
  route((c) => c.url.includes("/rest/v1/stock_movements"), { body: [] });
  route((c) => c.url.includes("/rest/v1/product_variants"), { body: [VARIANTS[0]] });
  route((c) => c.url.includes("/rest/v1/rpc/apply_order_stock"), { body: [] });
  const res = await postWebhook();
  assert.equal(res.status, 200);
  assert.ok(calls.some((c) => c.url.includes("apply_order_stock")));
  assert.ok(!calls.some((c) => c.method === "POST" && c.url.endsWith("/rest/v1/orders?on_conflict=stripe_session_id")));
});

test("si Supabase falla, Stripe reintenta (500)", async () => {
  route((c) => c.url.includes("/rest/v1/orders?stripe_session_id"), { status: 503, body: { message: "down" } });
  const res = await postWebhook();
  assert.equal(res.status, 500);
});

test("eventos que no son de pago se ignoran", async () => {
  const payload = JSON.stringify({ type: "charge.succeeded", data: { object: {} } });
  const res = await worker.fetch(new Request("https://shop.test/stripe-webhook", { method: "POST", headers: { "stripe-signature": await signed(payload) }, body: payload }), ENV);
  assert.equal((await res.json()).ignored, "charge.succeeded");
});

test("la ruta antigua de Printful ya no existe", async () => {
  const res = await worker.fetch(new Request("https://shop.test/printful-webhook?token=x", { method: "POST", body: "{}" }), ENV);
  assert.equal(res.status, 404);
});

test("salud y rutas desconocidas", async () => {
  assert.equal((await worker.fetch(new Request("https://shop.test/"), ENV)).status, 200);
  assert.equal((await worker.fetch(new Request("https://shop.test/nada"), ENV)).status, 404);
});

// ---------------------------------------------------------------- Packlink
import { pickService, buildDraft, parcelFor, splitName } from "../src/packlink.js";

const PL_ENV = { ...ENV, PACKLINKPRO_API_KEY: "pl_test" };
const WAREHOUSE = { default_selection: true, name: "Oriol", surname: "Gil", company: "PURSEC", address: "Carrer Test 1", postal_code: "08786", city: "Capellades", country: "ES", phone: "600000000", email: "pursec@test" };
const ORDER_ROW = {
  id: ORDER_ID, email: "ana@test", customer_name: "Ana García López", status: "paid", stock_issue: false, packlink_ref: null, notes: null,
  items: [{ variant_id: 11, name: "Heavy Hoodie", size: "M", qty: 2, unit_eur: 79 }],
  shipping: { name: "Ana García López", address1: "Rue X 3", address2: "", city: "Paris", zip: "75001", country_code: "FR", phone: "+33", email: "ana@test" },
};

test("Packlink: siempre depósito en oficina y entrega a domicilio; Correos primero", () => {
  const s = pickService([
    { id: 1, carrier_name: "GLS", dropoff: true, delivery_to_parcelshop: false, price: { total_price: 6 } },
    { id: 2, carrier_name: "Correos", dropoff: false, delivery_to_parcelshop: false, price: { total_price: 5 } },
    { id: 3, carrier_name: "Correos", dropoff: true, delivery_to_parcelshop: true, price: { total_price: 4 } },
    { id: 5, carrier_name: "Correos", name: "Paq Ligero Punto de recogida", dropoff: true, price: { total_price: 3 } },
    { id: 6, carrier_name: "Correos", dropoff: true, delivery_to_parcelshop: false, price: { total_price: 9.41 } },
    { id: 4, carrier_name: "Correos Express", dropoff: true, delivery_to_parcelshop: false, price: { total_price: 8.2 } },
  ]);
  assert.equal(s.id, 4);
  assert.equal(pickService([{ id: 1, carrier_name: "GLS", dropoff: true, price: { total_price: 6 } }]).id, 1);
  assert.equal(pickService([{ id: 3, carrier_name: "Correos", dropoff: true, delivery_to_parcelshop: true, price: { total_price: 4 } }]), null);
  assert.equal(pickService([]), null);
});

test("Packlink: paquete, nombre y borrador", () => {
  assert.deepEqual(parcelFor([{ qty: 2 }]), { weight: 1, length: 40, width: 30, height: 10 });
  assert.deepEqual(splitName("Ana García López"), { name: "Ana", surname: "García López" });
  const d = buildDraft({ order: ORDER_ROW, warehouse: WAREHOUSE, parcel: parcelFor(ORDER_ROW.items), service: { id: 4 } });
  assert.equal(d.service_id, 4);
  assert.equal(d.contentvalue, 158);
  assert.equal(d.to.country, "FR");
  assert.equal(d.to.zip_code, "75001");
  assert.equal(d.from.zip_code, "08786");
  assert.equal(d.shipment_custom_reference, `PURSEC-${ORDER_ID}`);
});

function plRoutes({ draftStatus = 200, order = ORDER_ROW, services = [{ id: 7, carrier_name: "Correos", dropoff: true, price: { total_price: 9.41 } }] } = {}) {
  route((c) => c.method === "GET" && c.url.includes("/rest/v1/orders?stripe_session_id"), { body: [] });
  route((c) => c.url.includes("/rest/v1/product_variants"), { body: [VARIANTS[0]] });
  route((c) => c.method === "POST" && c.url.includes("/rest/v1/orders"), { body: [{ id: ORDER_ID, status: "paid" }] });
  route((c) => c.url.includes("/rest/v1/rpc/apply_order_stock"), { body: [] });
  route((c) => c.method === "GET" && c.url.includes(`/rest/v1/orders?id=eq.${ORDER_ID}`), { body: [order] });
  route((c) => c.method === "PATCH" && c.url.includes(`/rest/v1/orders?id=eq.${ORDER_ID}`), { body: [] });
  route((c) => c.url.includes("api.packlink.com/v1/clients/warehouses"), { body: [WAREHOUSE] });
  route((c) => c.url.includes("api.packlink.com/v1/services"), { body: services });
  route((c) => c.url.includes("api.packlink.com/v1/dropoffs/"), { body: [{ commerce_name: "Kiosko Sol", address: "Carrer Major 5", zip: "08786", city: "Capellades", phone: "93" }, { commerce_name: "Bar Pi", address: "Pl. Nova 1", zip: "08786", city: "Capellades" }] });
  route((c) => c.url === "https://hook.test/alert", { body: { ok: true } });
  route((c) => c.method === "POST" && c.url.includes("api.packlink.com/v1/shipments"), draftStatus === 200 ? { body: { reference: "ES2026PRO0001" } } : { status: draftStatus, body: { message: "bad" } });
}

test("pago -> borrador en Packlink y referencia guardada", async () => {
  plRoutes();
  const res = await postWebhook(PL_ENV);
  assert.equal(res.status, 200);
  assert.match((await res.json()).packlink, /ES2026PRO0001/);
  const post = calls.find((c) => c.method === "POST" && c.url.includes("packlink.com/v1/shipments"));
  assert.equal(post.headers.Authorization, "pl_test");
  assert.equal(JSON.parse(post.body).service_id, 7);
  const patch = calls.filter((c) => c.method === "PATCH").map((c) => JSON.parse(c.body));
  assert.deepEqual(patch.at(-1), { packlink_ref: "ES2026PRO0001" });
});

test("si Packlink falla, el pedido sigue bien (200) y queda la nota", async () => {
  plRoutes({ draftStatus: 422 });
  const res = await postWebhook(PL_ENV);
  assert.equal(res.status, 200);
  assert.match((await res.json()).packlink, /^error/);
  const patch = JSON.parse(calls.filter((c) => c.method === "PATCH").at(-1).body);
  assert.match(patch.notes, /Packlink .*422/);
});

test("no se crea un segundo borrador si ya existe", async () => {
  plRoutes({ order: { ...ORDER_ROW, packlink_ref: "ES2026PRO0001" } });
  const out = await (await postWebhook(PL_ENV)).json();
  assert.match(out.packlink, /ya creado/);
  assert.ok(!calls.some((c) => c.url.includes("packlink.com")));
});

test("si el servicio no es Correos: aviso inmediato con los puntos de depósito cercanos", async () => {
  plRoutes({ services: [{ id: 9, carrier_name: "GLS", name: "Business Parcel", dropoff: true, delivery_to_parcelshop: false, price: { total_price: 7.1 } }] });
  const out = await (await postWebhook({ ...PL_ENV, ALERT_WEBHOOK_URL: "https://hook.test/alert" })).json();
  assert.match(out.packlink, /aviso enviado/);
  assert.ok(calls.some((c) => c.url.includes("/v1/dropoffs/9/ES/08786")));
  const hook = JSON.parse(calls.find((c) => c.url === "https://hook.test/alert").body);
  assert.match(hook.subject, /NO es Correos/);
  assert.match(hook.text, /GLS/);
  assert.match(hook.text, /1\. Kiosko Sol — Carrer Major 5, 08786, Capellades/);
  const patch = JSON.parse(calls.filter((c) => c.method === "PATCH").at(-1).body);
  assert.equal(patch.packlink_ref, "ES2026PRO0001");
  assert.match(patch.notes, /AVISO envío/);
});

test("con Correos no hay aviso", async () => {
  plRoutes();
  const out = await (await postWebhook({ ...PL_ENV, ALERT_WEBHOOK_URL: "https://hook.test/alert" })).json();
  assert.doesNotMatch(out.packlink, /aviso/);
  assert.ok(!calls.some((c) => c.url === "https://hook.test/alert"));
});
