// POST /checkout — crea la sesión de pago de Stripe para lo que el cliente ha elegido.
// El precio sale SIEMPRE de Supabase (nunca del navegador).

import { supabase, stripe, json } from "./clients.js";

export const EU_COUNTRIES = ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE"];
const MAX_LINES = 10;
const MAX_QTY = 5;

export function parseCart(body) {
  const items = Array.isArray(body?.items) ? body.items : [];
  if (items.length === 0 || items.length > MAX_LINES) throw new Error("El carrito está vacío o tiene demasiadas líneas");
  const merged = new Map();
  for (const it of items) {
    const id = Number(it.variant_id);
    const qty = Number(it.quantity ?? 1);
    if (!Number.isInteger(id) || id <= 0) throw new Error("Variante no válida");
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) throw new Error("Cantidad no válida");
    merged.set(id, Math.min(MAX_QTY, (merged.get(id) || 0) + qty));
  }
  return [...merged].map(([variant_id, quantity]) => ({ variant_id, quantity }));
}

export function buildSessionParams(lines, variants, env) {
  const byId = new Map(variants.map((v) => [v.id, v]));
  const line_items = lines.map(({ variant_id, quantity }) => {
    const v = byId.get(variant_id);
    if (!v || !v.product || !v.product.active) throw new Error(`La variante ${variant_id} no está a la venta`);
    if (!(Number(v.stock) >= quantity)) throw new Error(`Sold out: ${v.product.name} — ${v.size}`);
    return {
      quantity,
      price_data: {
        currency: "eur",
        unit_amount: Math.round(Number(v.product.price_eur) * 100),
        product_data: {
          name: `${v.product.name} — ${v.size}`,
          metadata: { variant_id: String(v.id), product_slug: v.product.slug },
        },
      },
    };
  });

  const shipping = Number(env.SHIPPING_EUR);
  if (!(shipping >= 0) || env.SHIPPING_EUR === undefined || env.SHIPPING_EUR === "") {
    throw new Error("CONFIG: falta la variable SHIPPING_EUR (precio del envío)");
  }
  // Envío gratis si el importe de las prendas supera FREE_SHIPPING_FROM (en euros). Vacío = nunca gratis.
  const subtotalCents = line_items.reduce((t, l) => t + l.price_data.unit_amount * l.quantity, 0);
  const freeFrom = env.FREE_SHIPPING_FROM === undefined || env.FREE_SHIPPING_FROM === "" ? NaN : Number(env.FREE_SHIPPING_FROM);
  const isFree = freeFrom >= 0 && subtotalCents > Math.round(freeFrom * 100);
  const countries = (env.SHIP_COUNTRIES || EU_COUNTRIES.join(",")).split(",").map((c) => c.trim()).filter(Boolean);
  const site = env.SITE_URL || "https://pursec.club";

  return {
    mode: "payment",
    line_items,
    shipping_address_collection: { allowed_countries: countries },
    shipping_options: [{
      shipping_rate_data: {
        type: "fixed_amount",
        display_name: isFree ? (env.FREE_SHIPPING_LABEL || "Free shipping (EU)") : (env.SHIPPING_LABEL || "Standard shipping"),
        fixed_amount: { amount: isFree ? 0 : Math.round(shipping * 100), currency: "eur" },
      },
    }],
    phone_number_collection: { enabled: true },
    billing_address_collection: "auto",
    // Pedido compacto para el webhook: variante y cantidad
    metadata: { cart: JSON.stringify(lines.map((l) => [l.variant_id, l.quantity])) },
    payment_intent_data: { description: "PURSEC order" },
    success_url: `${site}/thanks.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/#drop`,
  };
}

export async function handleCheckout(request, env) {
  let lines;
  try {
    lines = parseCart(await request.json());
  } catch (err) {
    return json({ error: err.message }, 400);
  }
  const ids = lines.map((l) => l.variant_id).join(",");
  const variants = await supabase(
    env,
    `product_variants?id=in.(${ids})&active=eq.true&select=id,size,color,stock,product:products(id,slug,name,price_eur,active)`
  );
  let params;
  try {
    params = buildSessionParams(lines, variants || [], env);
  } catch (err) {
    const config = err.message.startsWith("CONFIG:");
    return json({ error: config ? "Shop temporarily unavailable" : err.message }, config ? 503 : 400);
  }
  const session = await stripe(env, "checkout/sessions", { method: "POST", params });
  return json({ url: session.url });
}
