// Packlink PRO (API por clave). Packlink no publica una especificación completa:
// aquí solo hay una comprobación de solo lectura para saber si la clave funciona.
// El pago de las etiquetas nunca se hace desde aquí: lo paga Oriol en su cuenta.

const BASE = "https://api.packlink.com/v1";

// El secreto en Cloudflare se llama PACKLINKPRO_API_KEY (también se acepta PACKLINK_API_KEY)
export const packlinkKey = (env) => env.PACKLINKPRO_API_KEY || env.PACKLINK_API_KEY;

export async function packlinkGet(env, path) {
  const key = packlinkKey(env);
  if (!key) throw new Error("NO_KEY");
  // La clave va tal cual en Authorization, sin "Bearer"
  return fetch(`${BASE}${path}`, {
    headers: { Authorization: key, Accept: "application/json" },
  });
}

// GET /packlink-check — TEMPORAL. Devuelve solo códigos de estado, el número de servicios y
// los 3 más baratos de una cotización de prueba. Nada privado.
export async function handlePacklinkCheck(request, env) {
  if (!packlinkKey(env)) return Response.json({ key: "missing" });
  const q = new URLSearchParams({
    "from[country]": "ES", "from[zip]": "08786",
    "to[country]": "FR", "to[zip]": "75001",
    "packages[0][weight]": "1", "packages[0][length]": "40", "packages[0][width]": "30", "packages[0][height]": "8",
    source: "PRO",
  });
  const out = { key: "present" };
  const res = await packlinkGet(env, `/services?${q}`);
  out.services_status = res.status;
  if (res.ok) {
    const list = await res.json();
    const arr = Array.isArray(list) ? list : [];
    out.services_count = arr.length;
    out.cheapest = arr
      .map((s) => ({ carrier: s.carrier_name || s.carrierName, service: s.name, price: s.price?.total_price ?? s.base_price ?? s.price, days: s.transit_time }))
      .filter((s) => typeof s.price === "number")
      .sort((a, b) => a.price - b.price)
      .slice(0, 3);
  }
  // Direcciones guardadas: solo país y código postal de la predeterminada
  for (const path of ["/clients/warehouses", "/warehouses"]) {
    const w = await packlinkGet(env, path);
    out[`warehouses ${path}`] = w.status;
    if (w.ok) {
      const data = await w.json();
      const arr = Array.isArray(data) ? data : data?.warehouses || [];
      out.warehouses_count = arr.length;
      const def = arr.find((x) => x.default_selection || x.defaultSelection);
      if (def) out.default_warehouse = { country: def.country, zip: def.postal_code || def.zip_code };
      break;
    }
  }
  return Response.json(out);
}
