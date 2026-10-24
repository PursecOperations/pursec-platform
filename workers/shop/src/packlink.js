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

// Servicio (Oriol, 24 oct 2026): SIEMPRE se deposita en oficina (no hay recogida) y SIEMPRE se entrega
// en el domicilio del cliente (nunca en punto de recogida ni taquilla).
// Entre los que cumplen las dos cosas: el Correos más barato; si no hay Correos, el más barato.
// Si ninguno cumple, el borrador se crea sin servicio y Oriol lo elige en Packlink.
const PICKUP_POINT = /punto|parcel ?shop|locker|taquilla|citypaq|relais|point relais|oficina[- ]a[- ]oficina|office[- ]to[- ]office|drop[- ]?off[- ]to[- ]drop/i;

export function pickService(services) {
  const ok = (Array.isArray(services) ? services : [])
    .map((s) => ({
      id: s.id ?? s.service_id,
      carrier: s.carrier_name || "",
      name: s.name || s.service_name || "",
      dropoff: s.dropoff === true || s.departure_type === "drop-off",
      toDoor: !(s.delivery_to_parcelshop === true || s.destination_type === "drop-off"),
      price: s.price?.total_price ?? s.base_price,
    }))
    .filter((s) => s.id != null && typeof s.price === "number")
    .filter((s) => s.dropoff && s.toDoor && !PICKUP_POINT.test(s.name));
  const cheapest = (arr) => arr.sort((a, b) => a.price - b.price)[0] || null;
  return cheapest(ok.filter((s) => /correos/i.test(s.carrier))) || cheapest(ok);
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

// Puntos de depósito más cercanos a la dirección de origen para un servicio (los da Packlink).
export async function nearestDropoffs(env, serviceId, country, zip, n = 3) {
  const list = await packlinkJson(env, `/dropoffs/${encodeURIComponent(serviceId)}/${encodeURIComponent(country)}/${encodeURIComponent(zip)}`);
  return (Array.isArray(list) ? list : []).slice(0, n).map((d) => ({
    name: d.commerce_name || d.name || "",
    address: [d.address, d.zip, d.city].filter(Boolean).join(", "),
    phone: d.phone || "",
  }));
}

// Crea el borrador en Packlink para un pedido pagado. Devuelve la referencia y, si el servicio
// no es Correos (o no hay servicio), el aviso para Oriol con los puntos de depósito cercanos.
export async function createDraftForOrder(env, order) {
  const warehouses = await packlinkJson(env, "/clients/warehouses");
  const list = Array.isArray(warehouses) ? warehouses : warehouses?.warehouses || [];
  const warehouse = list.find((w) => w.default_selection) || list[0];
  if (!warehouse) throw new Error("Packlink no tiene ninguna dirección de recogida guardada");
  const fromZip = String(warehouse.postal_code || "").split(" - ")[0];
  const fromCountry = warehouse.country || "ES";
  const parcel = parcelFor(order.items || [], env);
  const sh = order.shipping || {};
  let service = null;
  try {
    const q = new URLSearchParams({
      "from[country]": fromCountry, "from[zip]": fromZip,
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

  let alert = null;
  if (!service || !/correos/i.test(service.carrier)) {
    let points = [];
    if (service) {
      try { points = await nearestDropoffs(env, service.id, fromCountry, fromZip); } catch { /* el aviso sale igual */ }
    }
    alert = alertText({ order, ref, service, points, fromZip, city: warehouse.city });
  }
  return { ref, service: service ? `${service.carrier} ${service.price} €` : "sin servicio", alert };
}

export function alertText({ order, ref, service, points, fromZip, city }) {
  const dest = [order.shipping?.city, order.shipping?.country_code].filter(Boolean).join(", ");
  const lines = [`Pedido ${order.id} (${dest}) — envío ${ref} en Packlink.`];
  if (!service) {
    lines.push("No hay ningún servicio con depósito en oficina y entrega a domicilio: elige el servicio a mano en Packlink antes de pagar.");
  } else {
    lines.push(`El servicio NO es Correos: ${service.carrier} — ${service.name || "servicio"} (${service.price} €). El paquete no se deja en Correos.`);
    if (points.length) {
      lines.push(`Puntos de depósito más cercanos a ${city || fromZip}:`);
      points.forEach((p, i) => lines.push(`${i + 1}. ${p.name} — ${p.address}${p.phone ? ` (${p.phone})` : ""}`));
    } else {
      lines.push(`Packlink no ha devuelto puntos de depósito cerca de ${fromZip}: búscalo en el envío dentro de Packlink.`);
    }
  }
  return lines.join("\n");
}

// Aviso inmediato a Oriol. ALERT_WEBHOOK_URL (secreto) es el webhook de Make que le manda el email.
export async function sendAlert(env, subject, text) {
  if (!env.ALERT_WEBHOOK_URL) return false;
  const res = await fetch(env.ALERT_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, text }) });
  return res.ok;
}
