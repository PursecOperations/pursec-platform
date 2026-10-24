// PURSEC — Worker de la tienda (pursec-shop)
//
//   POST /checkout          la web crea el pago (Stripe Checkout) con variantes de Supabase
//   GET  /order-status      la página de gracias comprueba si el pago se completó
//   POST /stripe-webhook    Stripe avisa del pago -> pedido en Supabase + descuento de stock + borrador en Packlink
//   GET  /                  comprobación de salud
//
// Secretos (Cloudflare -> Settings -> Variables and Secrets):
//   SUPABASE_SERVICE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PACKLINKPRO_API_KEY, ALERT_WEBHOOK_URL
// Variables públicas en wrangler.jsonc.

import { handleCheckout } from "./checkout.js";
import { handleStripeWebhook, handleOrderStatus } from "./orders.js";

const PREVIEW_ORIGIN = /^https:\/\/([a-z0-9-]+-)?pursec-platform\.pursec-telemetry-hq\.workers\.dev$/;

function cors(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "https://pursec.club,https://www.pursec.club").split(",").map((s) => s.trim());
  if (!allowed.includes(origin) && !PREVIEW_ORIGIN.test(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

async function withCors(request, env, handler) {
  const h = cors(request, env);
  if (!h) return new Response("Origen no permitido", { status: 403 });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  const res = await handler(request, env);
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(h)) out.headers.set(k, v);
  return out;
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    try {
      if (pathname === "/checkout" && (request.method === "POST" || request.method === "OPTIONS")) return await withCors(request, env, handleCheckout);
      if (pathname === "/order-status" && (request.method === "GET" || request.method === "OPTIONS")) return await withCors(request, env, handleOrderStatus);
      if (pathname === "/stripe-webhook" && request.method === "POST") return await handleStripeWebhook(request, env);
      if (pathname === "/" && request.method === "GET") return new Response("PURSEC tienda operativa", { status: 200 });
      return new Response("No encontrado", { status: 404 });
    } catch (err) {
      return new Response(`Error: ${err.message}`, { status: 500 });
    }
  },
};
