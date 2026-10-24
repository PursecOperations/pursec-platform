// Packlink PRO (API por clave). Packlink no publica una especificación completa: los campos del
// borrador siguen su módulo oficial de código abierto (logeecom/pl_module_core, Draft::toArray).
// El pago de las etiquetas nunca se hace desde aquí: el borrador queda sin pagar y lo paga Oriol.

const BASE = "https://api.packlink.com/v1";

// El secreto en Cloudflare se llama PACKLINKPRO_API_KEY (también se acepta PACKLINK_API_KEY)
export const packlinkKey = (env) => env.PACKLINKPRO_API_KEY || env.PACKLINK_API_KEY;

export async function packlinkGet(env, path) {
  return packlinkFetch(env, path);
}

async function packlinkFetch(env, path, init = {}) {
  const key = packlinkKey(env);
  if (!key) throw new Error("NO_KEY");
  // La clave va tal cual en Authorization, sin "Bearer"
  const headers = { Authorization: key, Accept: "application/json" };
  if (init.body) headers["Content-Type"] = "application/json";
  return fetch(`${BASE}${path}`, { ...init, headers });
}

async function packlinkJson(env, path, init) {
  const res = await packlinkFetch(env, path, init);
  const text = await res.text();
  if (!res.ok) throw new Error(`Packlink ${init?.method || "GET"} ${path.split("?")[0]} -> ${res.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

// ---------------------------------------------------------------- borrador de envío
// Paquete por defecto (Oriol, 24 oct 2026): sobre 40x30x10 cm, 0,5 kg por prenda.
export function parcelFor(items, env = {}) {
  const [length, width, height] = (env.PARCEL_CM || "40x30x10").split("x").map(Number);
  const perItem = Number(env.PARCEL_KG_PER_ITEM || "0.5");
  const units = items.reduce((t, i) => t + Number(i.qty || 0), 0) || 1;
  return { weight: Math.round(perItem * units * 100) / 100, length, width, height };
}

export function splitName(full = "") {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { name: parts[0] || "", surname: "" };
  return { name: parts[0], surname: parts.slice(1).join(" ") };
}

// Servicio: Correos más barato con entrega en oficina (Oriol deposita, no hay recogida).
// Si no hay Correos, el más barato con entrega en oficina; si nada, sin servicio (lo elige Oriol).
export function pickService(services) {
  const priced = (Array.isArray(services) ? services : [])
    .map((s) => ({ id: s.id ?? s.service_id, carrier: s.carrier_name || "", dropoff: s.dropoff === true || s.departure_type === "drop-off", price: s.price?.total_price ?? s.base_price }))
    .filter((s) => s.id != null && typeof s.price === "number");
  const cheapest = (arr) => arr.sort((a, b) => a.price - b.price)[0] || null;
  return cheapest(priced.filter((s) => s.dropoff && /correos/i.test(s.carrier)))
    || cheapest(priced.filter((s) => s.dropoff))
    || null;
}

export function buildDraft({ order, warehouse, parcel, service }) {
  const sh = order.shipping || {};
  const to = splitName(sh.name || order.customer_name || "");
  const from = splitName([warehouse.name, warehouse.surname].filter(Boolean).join(" "));
  const value = (order.items || []).reduce((t, i) => t + Number(i.unit_eur || 0) * Number(i.qty || 0), 0);
  const draft = {
    platform: "PRO",
    platform_country: "ES",
    source: "PRO",
    content: "Clothing",
    contentvalue: Math.round(value * 100) / 100,
    contentValue_currency: "EUR",
    shipment_custom_reference: `PURSEC-${order.id}`,
    from: {
      name: from.name, surname: from.surname, company: warehouse.company || "PURSEC",
      street1: warehouse.address || "", street2: warehouse.address2 || "",
      zip_code: String(warehouse.postal_code || "").split(" - ")[0], city: warehouse.city || "",
      country: warehouse.country || "ES", phone: warehouse.phone || "", email: warehouse.email || "",
    },
    to: {
      name: to.name, surname: to.surname, company: "",
      street1: sh.address1 || "", street2: sh.address2 || "",
      zip_code: sh.zip || "", city: sh.city || "", country: sh.country_code || "",
      phone: sh.phone || "", email: sh.email || order.email || "",
    },
    packages: [parcel],
  };
  if (service) draft.service_id = service.id;
  return draft;
}

// Crea el borrador en Packlink para un pedido pagado. Devuelve la referencia.
export async function createDraftForOrder(env, order) {
  const warehouses = await packlinkJson(env, "/clients/warehouses");
  const list = Array.isArray(warehouses) ? warehouses : warehouses?.warehouses || [];
  const warehouse = list.find((w) => w.default_selection) || list[0];
  if (!warehouse) throw new Error("Packlink no tiene ninguna dirección de recogida guardada");
  const parcel = parcelFor(order.items || [], env);
  const sh = order.shipping || {};
  let service = null;
  try {
    const q = new URLSearchParams({
      "from[country]": warehouse.country || "ES", "from[zip]": String(warehouse.postal_code || "").split(" - ")[0],
      "to[country]": sh.country_code || "", "to[zip]": sh.zip || "",
      "packages[0][weight]": String(parcel.weight), "packages[0][length]": String(parcel.length),
      "packages[0][width]": String(parcel.width), "packages[0][height]": String(parcel.height),
      source: "PRO",
    });
    service = pickService(await packlinkJson(env, `/services?${q}`));
  } catch { /* sin servicio: el borrador se crea igual y Oriol lo elige */ }
  const res = await packlinkJson(env, "/shipments", { method: "POST", body: JSON.stringify(buildDraft({ order, warehouse, parcel, service })) });
  const ref = res?.reference;
  if (!ref) throw new Error(`Packlink no devolvió referencia: ${JSON.stringify(res).slice(0, 200)}`);
  return { ref, service: service ? `${service.carrier} ${service.price} €` : "sin servicio" };
}
