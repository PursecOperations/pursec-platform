// PURSEC — cobros desde la web (sin claves secretas: solo usa la sesión del usuario).
//
// Uso (cuando exista la pantalla Cuenta, Fase 4):
//   import { startCheckout, openPortal } from "/js/pursec-billing.js";
//   await startCheckout(supabaseClient, "month");   // o "year"
//   await openPortal(supabaseClient);
//
// El plan del usuario NUNCA se cambia desde aquí: lo actualiza el webhook de Stripe en Supabase.

export const BILLING_API = "https://pursec-cfo-agent.pursec-telemetry-hq.workers.dev";

async function call(supabaseClient, path, body) {
  const { data } = await supabaseClient.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw Object.assign(new Error("Inicia sesión para continuar"), { code: "not_signed_in" });
  const res = await fetch(`${BILLING_API}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json.error || "No se pudo completar"), { code: json.code, status: res.status });
  return json;
}

// Lleva al usuario a Stripe Checkout. interval: "month" (con prueba) o "year" (sin prueba)
export async function startCheckout(supabaseClient, interval) {
  const { url } = await call(supabaseClient, "/checkout", { interval });
  window.location.assign(url);
}

// Abre el portal de Stripe: cancelar, cambiar tarjeta, pasar de mensual a anual
export async function openPortal(supabaseClient) {
  const { url } = await call(supabaseClient, "/portal");
  window.location.assign(url);
}

// Lee el plan del usuario (RLS: cada uno solo ve su perfil)
export async function getMyPlan(supabaseClient) {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("plan, subscription_status, billing_interval, trial_end, current_period_end, cancel_at_period_end")
    .maybeSingle();
  if (error) throw error;
  return data;
}
