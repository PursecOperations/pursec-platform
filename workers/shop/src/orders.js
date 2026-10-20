// Pedidos con stock propio: Stripe (pago) -> Supabase (orders + descuento de stock).
// El envío lo hace Oriol con su app de etiquetas; el agente Orders marca el pedido como enviado.

import { supabase, stripe, json } from "./clients.js";

const SIGNATURE_TOLERANCE_S = 300;

// ---------------------------------------------------------------- firma de Stripe
export async function verifyStripeSignature(payload, header, secret, nowS = Date.now() / 1000) {
  if (!header || !secret) return false;
  const pairs = header.split(",").map((kv) => kv.trim());
  const timestamp = Number((pairs.find((kv) => kv.startsWith("t=")) || "").slice(2));
  const signatures = pairs.filter((kv) => kv.startsWith("v1=")).map((kv) => kv.slice(3));
  if (!timestamp || signatures.length === 0) return false;
  if (Math.abs(nowS - timestamp) > SIGNATURE_TOLERANCE_S) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return signatures.some((sig) => safeEqual(sig, expected));
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ---------------------------------------------------------------- Stripe -> pedido
export async function handleStripeWebhook(request, env) {
  const payload = await request.text();
  const ok = await verifyStripeSignature(payload, request.headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET);
  if (!ok) return new Response("Firma de Stripe no válida", { status: 400 });
  const event = JSON.parse(payload);
  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
    return json({ received: true, ignored: event.type });
  }
  const session = event.data.object;
  if (session.mode !== "payment" || session.payment_status !== "paid") return json({ received: true, pending: true });
  try {
    const result = await recordOrder(env, session);
    return json({ received: true, ...result });
  } catch (err) {
    // 500 -> Stripe reintenta durante días. El agente de imprevistos lo ve en el resumen.
    return new Response(`Error con el pedido ${session.id}: ${err.message}`, { status: 500 });
  }
}

export function shippingFrom(session) {
  const s = session.collected_information?.shipping_details || session.shipping_details || {};
  const a = s.address || {};
  const c = session.customer_details || {};
  return {
    name: s.name || c.name || "",
    address1: a.line1 || "",
    address2: a.line2 || "",
    city: a.city || "",
    state_code: a.state || "",
    country_code: a.country || "",
    zip: a.postal_code || "",
    email: c.email || "",
    phone: c.phone || "",
  };
}

export function parseCartMeta(session) {
  const raw = JSON.parse(session.metadata?.cart || "[]");
  return raw.map(([variant_id, quantity]) => ({ variant_id: Number(variant_id), quantity: Number(quantity) }));
}

// Guarda el pedido y descuenta el stock una sola vez, aunque Stripe repita el aviso.
export async function recordOrder(env, session) {
  const existing = await supabase(env, `orders?stripe_session_id=eq.${encodeURIComponent(session.id)}&select=id,status,stock_issue`);
  let order = existing?.[0];

  if (order) {
    // Si el pedido ya existe, solo falta algo cuando el descuento de stock no llegó a hacerse.
    if (order.stock_issue) return { order_id: order.id, already: order.status };
    const moved = await supabase(env, `stock_movements?ref=eq.${order.id}&select=id&limit=1`);
    if (moved?.length) return { order_id: order.id, already: order.status };
  }

  const lines = parseCartMeta(session);
  if (lines.length === 0) throw new Error("La sesión no trae el carrito en metadata");
  const ids = lines.map((l) => l.variant_id).join(",");
  const variants = await supabase(env, `product_variants?id=in.(${ids})&select=id,size,color,product:products(name,price_eur)`);
  const byId = new Map((variants || []).map((v) => [v.id, v]));
  const items = lines.map((l) => {
    const v = byId.get(l.variant_id);
    if (!v) throw new Error(`Variante ${l.variant_id} no encontrada`);
    return { variant_id: v.id, name: v.product?.name, size: v.size, color: v.color, qty: l.quantity, unit_eur: Number(v.product?.price_eur) };
  });
  const recipient = shippingFrom(session);

  if (!order) {
    const rows = await supabase(env, "orders?on_conflict=stripe_session_id", {
      method: "POST",
      headers: { Prefer: "return=representation,resolution=merge-duplicates" },
      body: {
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent || null,
        email: recipient.email || null,
        customer_name: recipient.name || null,
        shipping: recipient,
        items,
        amount_total_eur: (session.amount_total || 0) / 100,
        status: "paid",
      },
    });
    order = rows[0];
  }

  const shortfalls = await supabase(env, "rpc/apply_order_stock", {
    method: "POST",
    body: { p_items: items.map((i) => ({ variant_id: i.variant_id, qty: i.qty })), p_ref: order.id },
  });
  if (Array.isArray(shortfalls) && shortfalls.length) {
    await supabase(env, `orders?id=eq.${order.id}`, {
      method: "PATCH",
      body: { stock_issue: true, notes: `Pagado sin stock suficiente: ${JSON.stringify(shortfalls)}` },
    });
    return { order_id: order.id, stock_issue: true };
  }
  return { order_id: order.id, stock_issue: false };
}

// ---------------------------------------------------------------- página de gracias
export async function handleOrderStatus(request, env) {
  const sessionId = new URL(request.url).searchParams.get("session_id") || "";
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(sessionId)) return json({ error: "Sesión no válida" }, 400);
  const session = await stripe(env, `checkout/sessions/${sessionId}`);
  return json({ paid: session.payment_status === "paid" });
}
