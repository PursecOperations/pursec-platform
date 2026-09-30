// Webhook de Stripe: mantiene el plan de cada usuario en `profiles` y apunta cada cobro en `financial_ledger`.
// Solo actúa si la firma de Stripe es válida.

import { supabase, stripe } from "./clients.js";

const SIGNATURE_TOLERANCE_S = 300;
const TRACKSIDE_STATUSES = ["active", "trialing"];

export async function handleWebhook(request, env) {
  const payload = await request.text();
  const valid = await verifyStripeSignature(payload, request.headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET);
  if (!valid) return new Response("Firma de Stripe no válida", { status: 400 });

  const event = JSON.parse(payload);
  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(env, event.data.object);
        break;
      case "invoice.paid":
        await onInvoicePaid(env, event.data.object);
        break;
      case "charge.succeeded":
        await onChargeSucceeded(env, event.data.object);
        break;
      default:
        break;
    }
  } catch (err) {
    return new Response(`Error procesando ${event.type}: ${err.message}`, { status: 500 });
  }
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Firma
// ---------------------------------------------------------------------------
export async function verifyStripeSignature(payload, header, secret, nowS = Date.now() / 1000) {
  if (!header || !secret) return false;
  const pairs = header.split(",").map((kv) => kv.trim());
  const timestamp = Number((pairs.find((kv) => kv.startsWith("t=")) || "").slice(2));
  const signatures = pairs.filter((kv) => kv.startsWith("v1=")).map((kv) => kv.slice(3));
  if (!timestamp || signatures.length === 0) return false;
  if (Math.abs(nowS - timestamp) > SIGNATURE_TOLERANCE_S) return false;

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

// ---------------------------------------------------------------------------
// Suscripciones -> profiles
// ---------------------------------------------------------------------------
const toIso = (s) => (s ? new Date(s * 1000).toISOString() : null);

export function subscriptionToProfile(sub) {
  const item = sub.items?.data?.[0];
  const status = sub.status;
  return {
    plan: TRACKSIDE_STATUSES.includes(status) ? "TRACKSIDE" : "PADDOCK",
    subscription_status: status,
    billing_interval: item?.price?.recurring?.interval || null,
    trial_end: toIso(sub.trial_end),
    // En las versiones recientes de la API el periodo va en cada item
    current_period_end: toIso(item?.current_period_end ?? sub.current_period_end),
    cancel_at_period_end: Boolean(sub.cancel_at_period_end || sub.cancel_at),
    stripe_subscription_id: sub.id,
  };
}

async function syncSubscription(env, subFromEvent) {
  // Los avisos pueden llegar desordenados: con la clave de Stripe se relee el estado actual
  let sub = subFromEvent;
  if (env.STRIPE_SECRET_KEY) {
    try {
      sub = await stripe(env, `subscriptions/${subFromEvent.id}`);
    } catch {
      sub = subFromEvent;
    }
  }

  const update = subscriptionToProfile(sub);
  // Una suscripción borrada no debe pisar el trial_end guardado (sirve para no repetir prueba)
  if (!update.trial_end) delete update.trial_end;

  const userId = sub.metadata?.supabase_user_id;
  const filter = userId
    ? `id=eq.${encodeURIComponent(userId)}`
    : `stripe_customer_id=eq.${encodeURIComponent(sub.customer)}`;

  const rows = await supabase(env, `profiles?${filter}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: userId ? { ...update, stripe_customer_id: sub.customer } : update,
  });
  return Array.isArray(rows) ? rows.length : 0;
}

// Compatibilidad con los enlaces de pago antiguos (sin cuenta previa):
// si el email del cobro coincide con un perfil sin cliente de Stripe, se enlazan.
async function onInvoicePaid(env, invoice) {
  const email = (invoice.customer_email || "").toLowerCase();
  if (!email || !invoice.customer) return;
  await supabase(env, `profiles?email=eq.${encodeURIComponent(email)}&stripe_customer_id=is.null`, {
    method: "PATCH",
    body: { stripe_customer_id: invoice.customer },
  });
  const subscriptionId = invoice.subscription || invoice.parent?.subscription_details?.subscription || null;
  if (subscriptionId && env.STRIPE_SECRET_KEY) {
    const sub = await stripe(env, `subscriptions/${subscriptionId}`);
    await syncSubscription(env, sub);
  }
}

// ---------------------------------------------------------------------------
// Contabilidad
// ---------------------------------------------------------------------------
async function onChargeSucceeded(env, charge) {
  const gross = charge.amount / 100;
  if (!gross) return;
  const existing = await supabase(env, `financial_ledger?external_ref=eq.${encodeURIComponent(charge.id)}&select=id`);
  if (Array.isArray(existing) && existing.length > 0) return;

  let fee = round2(gross * 0.015 + 0.25);
  let feeIsReal = false;
  if (env.STRIPE_SECRET_KEY && charge.balance_transaction) {
    const bt = await stripe(env, `balance_transactions/${charge.balance_transaction}`);
    fee = round2(bt.fee / 100);
    feeIsReal = true;
  }
  // [PENDIENTE gestor] IVA fijo al 21 %; con clientes de otros países de la UE aplica el tipo de su país (OSS)
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
