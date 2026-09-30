// PURSEC — Worker de cobros (pursec-cfo-agent)
//
//   POST /           webhook de Stripe (firma obligatoria) → planes en `profiles` y contabilidad en `financial_ledger`
//   POST /checkout   alta en el Club: crea la sesión de Stripe Checkout (lo llama la web con la sesión de Supabase)
//   POST /portal     abre el portal de Stripe del usuario (cancelar, cambiar tarjeta, mensual ↔ anual)
//   GET  /           comprobación de salud
//
// Variables del Worker (Cloudflare → Settings → Variables and Secrets):
//   SUPABASE_URL            texto    https://<ref>.supabase.co
//   SUPABASE_SERVICE_KEY    secreto  clave service_role (eyJ…) o secret (sb_secret_…)
//   STRIPE_WEBHOOK_SECRET   secreto  signing secret del endpoint de Stripe (whsec_…)
//   STRIPE_SECRET_KEY       secreto  clave secreta de Stripe (sk_live_… o una restringida rk_live_…)
// Variables no secretas: en wrangler.jsonc (SUPABASE_PUBLISHABLE_KEY, PRICE_MONTHLY, PRICE_YEARLY, SITE_URL…)

import { handleWebhook } from "./webhook.js";
import { handleCheckout, handlePortal } from "./billing.js";

const PREVIEW_ORIGIN = /^https:\/\/([a-z0-9-]+-)?pursec-platform\.pursec-telemetry-hq\.workers\.dev$/;

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "https://pursec.club,https://www.pursec.club").split(",").map((s) => s.trim());
  if (!allowed.includes(origin) && !PREVIEW_ORIGIN.test(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === "/checkout" || pathname === "/portal") {
      const cors = corsHeaders(request, env);
      if (!cors) return new Response("Origen no permitido", { status: 403 });
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
      if (request.method !== "POST") return new Response("Método no permitido", { status: 405, headers: cors });
      try {
        return pathname === "/checkout"
          ? await handleCheckout(request, env, cors)
          : await handlePortal(request, env, cors);
      } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Error interno, inténtalo de nuevo" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...cors },
        });
      }
    }

    if (pathname === "/" && request.method === "POST") return handleWebhook(request, env);
    if (pathname === "/" && request.method === "GET") return new Response("PURSEC cobros operativo", { status: 200 });
    return new Response("No encontrado", { status: 404 });
  },
};
