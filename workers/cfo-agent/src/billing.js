// Alta en el Club (Stripe Checkout) y portal del cliente.
// Los llama la web con el token de sesión de Supabase del usuario.

import { supabase, getAuthUser, stripe } from "./clients.js";
import { computeTrialEnd } from "./trial.js";

const ACTIVE = ["trialing", "active", "past_due"];

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

async function requireUser(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  return getAuthUser(env, token);
}

async function loadProfile(env, userId) {
  const rows = await supabase(env, `profiles?id=eq.${userId}&select=*`);
  return rows?.[0] || null;
}

async function upcomingRaceDates(env, now) {
  const from = new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const series = env.LAUNCH_SERIES || "F1";
  const rows = await supabase(
    env,
    `races?series=eq.${encodeURIComponent(series)}&race_date=gte.${from}&select=race_date&order=race_date.asc&limit=5`
  );
  return (rows || []).map((r) => r.race_date);
}

// Crea (una sola vez) el cliente de Stripe del usuario y lo guarda en su perfil
async function ensureCustomer(env, user, profile) {
  if (profile.stripe_customer_id) return profile.stripe_customer_id;
  const customer = await stripe(env, "customers", {
    method: "POST",
    params: { email: user.email, metadata: { supabase_user_id: user.id } },
    idempotencyKey: `pursec-customer-${user.id}`,
  });
  await supabase(env, `profiles?id=eq.${user.id}&stripe_customer_id=is.null`, {
    method: "PATCH",
    body: { stripe_customer_id: customer.id },
  });
  return customer.id;
}

export async function handleCheckout(request, env, cors) {
  const user = await requireUser(request, env);
  if (!user) return json({ error: "Inicia sesión para suscribirte" }, 401, cors);

  let interval;
  try {
    ({ interval } = await request.json());
  } catch {
    interval = null;
  }
  if (interval !== "month" && interval !== "year") {
    return json({ error: "Plan no válido (month o year)" }, 400, cors);
  }

  const profile = await loadProfile(env, user.id);
  if (!profile) return json({ error: "Perfil no encontrado" }, 404, cors);
  if (ACTIVE.includes(profile.subscription_status)) {
    return json({ error: "Ya tienes una suscripción. Gestiónala desde tu cuenta.", code: "already_subscribed" }, 409, cors);
  }

  const customerId = await ensureCustomer(env, user, profile);
  const price = interval === "month" ? env.PRICE_MONTHLY : env.PRICE_YEARLY;
  const site = env.SITE_URL || "https://pursec.club";

  // Prueba: solo el mensual, y solo si esta cuenta nunca ha tenido prueba ni suscripción
  const subscriptionData = { metadata: { supabase_user_id: user.id } };
  let trial = null;
  const firstTime = !profile.trial_end && !profile.stripe_subscription_id;
  if (interval === "month" && firstTime) {
    const now = new Date();
    const dates = await upcomingRaceDates(env, now);
    const maxDays = env.MAX_TRIAL_DAYS ? Number(env.MAX_TRIAL_DAYS) : undefined;
    trial = computeTrialEnd(now, dates, { maxTrialDays: maxDays });
    subscriptionData.trial_end = Math.floor(trial.trialEnd.getTime() / 1000);
  }

  const session = await stripe(env, "checkout/sessions", {
    method: "POST",
    params: {
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price, quantity: 1 }],
      subscription_data: subscriptionData,
      metadata: { supabase_user_id: user.id, interval },
      automatic_tax: { enabled: true },
      billing_address_collection: "required",
      customer_update: { address: "auto", name: "auto" },
      success_url: `${site}/cuenta?alta=ok`,
      cancel_url: `${site}/descubrir?alta=cancelada`,
    },
  });

  return json(
    {
      url: session.url,
      trial_end: trial ? trial.trialEnd.toISOString() : null,
      trial_rule: trial ? trial.rule : null,
    },
    200,
    cors
  );
}

export async function handlePortal(request, env, cors) {
  const user = await requireUser(request, env);
  if (!user) return json({ error: "Inicia sesión" }, 401, cors);
  const profile = await loadProfile(env, user.id);
  if (!profile?.stripe_customer_id) {
    return json({ error: "Aún no tienes suscripción", code: "no_customer" }, 404, cors);
  }
  const site = env.SITE_URL || "https://pursec.club";
  const session = await stripe(env, "billing_portal/sessions", {
    method: "POST",
    params: { customer: profile.stripe_customer_id, return_url: `${site}/cuenta` },
  });
  return json({ url: session.url }, 200, cors);
}
