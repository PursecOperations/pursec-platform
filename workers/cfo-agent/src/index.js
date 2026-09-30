// PURSEC — Agente 08 (CFO): recibe los avisos de Stripe, actualiza el plan del usuario
// en Supabase y apunta cada cobro en financial_ledger.
//
// Variables del Worker (Cloudflare → Settings → Variables and Secrets):
//   SUPABASE_URL            texto   https://<ref>.supabase.co
//   SUPABASE_SERVICE_KEY    secreto clave service_role (eyJ…) o secret (sb_secret_…)
//   STRIPE_WEBHOOK_SECRET   secreto signing secret del endpoint de Stripe (whsec_…)
//   STRIPE_SECRET_KEY       secreto opcional; si existe, la comisión se lee de Stripe en vez de estimarse

const SIGNATURE_TOLERANCE_S = 300;
const ACTIVE_STATUSES = ["active", "trialing"];

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("PURSEC Agent 08 operativo", { status: 200 });
    }

    const payload = await request.text();
    const valid = await verifyStripeSignature(payload, request.headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET);
    if (!valid) {
      return new Response("Firma de Stripe no válida", { status: 400 });
    }

    const event = JSON.parse(payload);
    try {
      switch (event.type) {
        case "invoice.paid":
          await onInvoicePaid(event.data.object, env);
          break;
        case "customer.subscription.created":
        case "customer.subscription.updated":
          await onSubscriptionChanged(event.data.object, env);
          break;
        case "customer.subscription.deleted":
          await setPlanByCustomer(env, event.data.object.customer, "PADDOCK", "canceled");
          break;
        case "charge.succeeded":
          await onChargeSucceeded(event.data.object, env);
          break;
        default:
          break; // eventos que no usamos: se aceptan para que Stripe no reintente
      }
    } catch (err) {
      // 500 → Stripe reintenta el aviso más tarde
      return new Response(`Error procesando ${event.type}: ${err.message}`, { status: 500 });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};

// ---------------------------------------------------------------- Stripe

async function verifyStripeSignature(payload, header, secret) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const i = kv.indexOf("=");
      return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()];
    })
  );
  const timestamp = Number(parts.t);
  const signatures = header
    .split(",")
    .filter((kv) => kv.trim().startsWith("v1="))
    .map((kv) => kv.trim().slice(3));
  if (!timestamp || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > SIGNATURE_TOLERANCE_S) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return signatures.some((sig) => timingSafeEqual(sig, expected));
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function stripeGet(env, path) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
  });
  if (!res.ok) throw new Error(`Stripe ${path}: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------- Planes

async function onInvoicePaid(invoice, env) {
  const email = invoice.customer_email;
  if (!email) return; // sin email no podemos saber a qué cuenta pertenece
  const subscriptionId =
    invoice.subscription ||
    invoice.parent?.subscription_details?.subscription ||
    null;
  await supabase(env, "user_profiles?on_conflict=email", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: {
      email,
      subscription_plan: "TRACKSIDE",
      subscription_status: "active",
      stripe_customer_id: invoice.customer,
      stripe_subscription_id: subscriptionId,
      updated_at: new Date().toISOString(),
    },
  });
}

async function onSubscriptionChanged(sub, env) {
  const active = ACTIVE_STATUSES.includes(sub.status);
  await setPlanByCustomer(env, sub.customer, active ? "TRACKSIDE" : "PADDOCK", sub.status, sub.id);
}

async function setPlanByCustomer(env, customerId, plan, status, subscriptionId) {
  const body = { subscription_plan: plan, subscription_status: status, updated_at: new Date().toISOString() };
  if (subscriptionId) body.stripe_subscription_id = subscriptionId;
  await supabase(env, `user_profiles?stripe_customer_id=eq.${encodeURIComponent(customerId)}`, {
    method: "PATCH",
    body,
  });
}

// ---------------------------------------------------------------- Contabilidad

async function onChargeSucceeded(charge, env) {
  const gross = charge.amount / 100;
  if (!gross) return;

  // Evitar asientos duplicados si Stripe reenvía el aviso
  const existing = await supabase(
    env,
    `financial_ledger?external_ref=eq.${encodeURIComponent(charge.id)}&select=id`,
    { method: "GET" }
  );
  if (Array.isArray(existing) && existing.length > 0) return;

  // Comisión real desde Stripe si hay clave secreta; si no, estimación de tarjeta UE estándar
  let fee = round2(gross * 0.015 + 0.25);
  let feeIsReal = false;
  if (env.STRIPE_SECRET_KEY && charge.balance_transaction) {
    const bt = await stripeGet(env, `balance_transactions/${charge.balance_transaction}`);
    fee = round2(bt.fee / 100);
    feeIsReal = true;
  }

  // IVA: estimación al 21 % (España) hasta decidir con el gestor el régimen OSS o Stripe Tax
  const vatRate = 21;
  const taxBase = round2(gross / (1 + vatRate / 100));
  const vat = round2(gross - taxBase);
  const now = new Date();

  await supabase(env, "financial_ledger", {
    method: "POST",
    body: {
      fiscal_quarter: `${now.getUTCFullYear()}-Q${Math.floor(now.getUTCMonth() / 3) + 1}`,
      tx_type: gross >= 50 ? "INGRESO_TRACKSIDE_ANUAL" : "INGRESO_TRACKSIDE_MENSUAL",
      concept: `Cobro Stripe ${charge.id}${feeIsReal ? "" : " (comisión estimada)"}`,
      customer_country: charge.billing_details?.address?.country || null,
      gross_eur: gross,
      tax_base_eur: taxBase,
      vat_rate_pct: vatRate,
      vat_eur: vat,
      stripe_fee_eur: fee,
      net_cash_eur: round2(gross - vat - fee),
      external_ref: charge.id,
    },
  });
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------- Supabase

async function supabase(env, path, { method, headers = {}, body }) {
  const key = env.SUPABASE_SERVICE_KEY;
  const auth = { apikey: key };
  // Las claves antiguas (JWT) también van en Authorization; las nuevas sb_secret_ solo en apikey
  if (key && key.startsWith("eyJ")) auth.Authorization = `Bearer ${key}`;

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...auth, ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Supabase ${method} ${path.split("?")[0]}: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
