// Clientes mínimos de Supabase (REST + Auth) y Stripe (API REST), sin dependencias.

export async function supabase(env, path, { method = "GET", headers = {}, body } = {}) {
  const key = env.SUPABASE_SERVICE_KEY;
  const auth = { apikey: key };
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

// Devuelve el usuario de Supabase Auth dueño del token, o null si el token no vale
export async function getAuthUser(env, accessToken) {
  if (!accessToken) return null;
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const user = await res.json();
  return user && user.id ? user : null;
}

// Codifica objetos anidados al formato de formulario de Stripe: a[b][0][c]=x
export function stripeForm(obj, prefix = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item !== null && typeof item === "object") stripeForm(item, `${key}[${i}]`, out);
        else out.append(`${key}[${i}]`, String(item));
      });
    } else if (typeof v === "object") {
      stripeForm(v, key, out);
    } else {
      out.append(key, String(v));
    }
  }
  return out;
}

export async function stripe(env, path, { method = "GET", params, idempotencyKey } = {}) {
  if (!env.STRIPE_SECRET_KEY) throw new Error("Falta el secreto STRIPE_SECRET_KEY en el Worker");
  const headers = { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` };
  let url = `https://api.stripe.com/v1/${path}`;
  let body;
  if (method === "GET" && params) url += `?${stripeForm(params)}`;
  if (method !== "GET") {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = params ? stripeForm(params).toString() : "";
  }
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const res = await fetch(url, { method, headers, body });
  const data = await res.json();
  if (!res.ok) throw new Error(`Stripe ${method} ${path}: ${res.status} ${data?.error?.message || ""}`);
  return data;
}
