// PURSEC — Garage: una sola pantalla. Exige sesión, pinta el menú y cambia el escenario sin cambiar de página.
import { startCheckout, openPortal } from "/js/pursec-billing.js";

const A = window.PURSEC && window.PURSEC.auth;
const ITEMS = window.PURSEC_ITEMS || [];
const $ = (s, r = document) => r.querySelector(s);
const stage = $("#stage");
const app = $("#app");
let ctx = null;

function el(tag, attrs, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  kids.flat().forEach((c) => c != null && n.append(c));
  return n;
}

// ---------- carrera seleccionada ----------
const raceSel = $("#race");
async function loadRaces() {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await A.client
    .from("races")
    .select("id, series, season, round, name, circuit, race_date, has_sprint")
    .order("race_date", { ascending: true });
  raceSel.textContent = "";
  if (error || !data || !data.length) {
    raceSel.append(el("option", { text: "Sin calendario disponible" }));
    return;
  }
  const fmt = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "UTC" });
  const past = data.filter((r) => r.race_date < today);
  const next = data.filter((r) => r.race_date >= today);
  const add = (label, rows) => {
    if (!rows.length) return;
    const g = el("optgroup", { label });
    rows.forEach((r) => g.append(el("option", { value: r.id, text: `${r.series} · R${r.round} · ${r.name} · ${fmt.format(new Date(r.race_date + "T00:00:00Z"))}` })));
    raceSel.append(g);
  };
  add("Próximas", next);
  add("Ya disputadas", past.slice().reverse());
  const pick = next[0] || past[past.length - 1];
  if (pick) raceSel.value = String(pick.id);
  raceSel.dataset.loaded = "1";
}
raceSel.addEventListener("change", () => render());
const raceLabel = () => {
  const o = raceSel.selectedOptions[0];
  return o && raceSel.dataset.loaded ? o.textContent : "";
};

// ---------- paneles ----------
function productPane(it) {
  const isS4 = it.group === "sector-4";
  const head = el("div", { class: "pane-h" },
    el("div", null,
      el("p", { class: "k" + (isS4 ? " s4" : ""), text: isS4 ? "Sector 4" : "Race Weekend" }),
      el("h1", { text: it.name })),
    el("div", { class: "meta" },
      it.when ? el("span", { class: "pill", text: it.when }) : null,
      raceLabel() && !isS4 ? el("span", { class: "pill race", text: raceLabel() }) : null,
      el("span", { class: "pill build", text: "Building" })));

  const notice = el("div", { class: "notice" },
    el("span", null, el("b", { text: "En construcción. " }),
      isS4
        ? "Esta tool llega con los datos reales de una carrera ya disputada. Esto es lo que tendrá cada plan."
        : "Esta pieza llega con la primera carrera real cargada. Esto es lo que tendrá cada plan."));

  const pad = el("section", { class: "lane pd" },
    el("h2", null, "PADDOCK", el("small", { text: "Gratis · con anuncios" })),
    el("ul", null, it.paddock.map(([lock, t]) =>
      el("li", { class: lock }, el("span", null, t,
        lock === "locked" ? el("span", { class: "tag", text: "Trackside" }) :
        lock === "partial" ? el("span", { class: "tag", text: "Simplificado" }) : null)))));

  const tr = el("section", { class: "lane tr" },
    el("h2", null, "TRACKSIDE", el("small", { text: "Completo · sin anuncios" })),
    el("ul", null, it.trackside.map((t) => el("li", null, el("span", { text: t })))),
    el("div", { class: "lock-cta" }, el("span", { text: "Desbloquea todo con TRACKSIDE." }),
      el("a", { class: "btn btn-primary btn-sm", href: "#membership", text: "Ver Membership" })));

  return el("div", { class: "pane" }, head, notice, el("div", { class: "lanes" }, pad, tr),
    it.note ? el("p", { class: "small", text: it.note }) : null);
}

function membershipPane() {
  const p = ctx.profile || {};
  const t = ctx.tier;
  const err = el("p", { class: "err-text", role: "status" });
  const fail = (e) => { err.textContent = e && e.message ? e.message : "No se ha podido abrir el pago. Inténtalo de nuevo."; };
  const busy = (b, fn) => async () => { b.disabled = true; err.textContent = ""; try { await fn(); } catch (e) { fail(e); b.disabled = false; } };

  let state;
  if (t === "owner") state = el("p", { class: "state" }, "Tu cuenta es ", el("b", { text: "Owner" }), ": acceso total a TRACKSIDE sin suscripción.");
  else if (t === "trackside") {
    const end = p.current_period_end ? new Date(p.current_period_end).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : null;
    const trial = p.subscription_status === "trialing" && p.trial_end ? new Date(p.trial_end).toLocaleDateString("es-ES", { day: "numeric", month: "long" }) : null;
    state = el("p", { class: "state" }, "Estás en ", el("b", { text: "TRACKSIDE" }),
      p.billing_interval === "year" ? " anual" : " mensual",
      trial ? `. Prueba gratis hasta el ${trial}` : "",
      end ? (p.cancel_at_period_end ? `. Se cancela el ${end}` : `. Se renueva el ${end}`) : "", ".");
  } else state = el("p", { class: "state" }, "Estás en ", el("b", { text: "PADDOCK" }), ": gratis, con anuncios y con lo TRACKSIDE difuminado.");

  const portalBtn = el("button", { class: "btn btn-ghost", type: "button", text: "Gestionar suscripción" });
  portalBtn.addEventListener("click", busy(portalBtn, () => openPortal(A.client)));
  const mBtn = el("button", { class: "btn btn-primary", type: "button", text: "Probar 7 días gratis" });
  mBtn.addEventListener("click", busy(mBtn, () => startCheckout(A.client, "month")));
  const yBtn = el("button", { class: "btn btn-ghost", type: "button", text: "Pagar el año" });
  yBtn.addEventListener("click", busy(yBtn, () => startCheckout(A.client, "year")));

  const cards = el("div", { class: "cards2" },
    el("div", { class: "card" }, el("span", { class: "nm", text: "PADDOCK" }), el("span", { class: "pr" }, "0 €", el("small", { text: " para siempre" })),
      el("p", { text: "Resumen de Weekend Brief, Race Card, Sprint Card y Debrief, la versión gratis de cada tool y Title Fight entera. Con anuncios." })),
    el("div", { class: "card pro" }, el("span", { class: "nm", text: "TRACKSIDE" }), el("span", { class: "pr" }, "9,99 €", el("small", { text: " /mes · o 99,99 €/año" })),
      el("p", { text: "Todo completo y sin anuncios. La prueba del mensual dura 7 días o hasta el lunes después de la próxima carrera, lo que sea más tarde. Una por cuenta; el anual no tiene prueba." }),
      t === "paddock" ? el("div", { class: "row" }, mBtn, yBtn) : null));

  return el("div", { class: "pane" },
    el("div", { class: "pane-h" }, el("div", null, el("p", { class: "k", text: "Cuenta" }), el("h1", { text: "Membership" }))),
    state,
    t === "trackside" ? el("div", { class: "row" }, portalBtn) : null,
    cards, err,
    el("p", { class: "small", text: "Precios con IVA incluido. El pago lo gestiona Stripe; PURSEC no ve ni guarda tu tarjeta." }));
}

function pitRadioPane() {
  const copy = el("button", { class: "btn btn-ghost btn-sm", type: "button", text: "Copiar" });
  copy.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText("hola@pursec.club"); copy.textContent = "Copiado"; }
    catch { copy.textContent = "Selecciónalo y cópialo"; }
  });
  const topic = (b, s) => el("div", { class: "card" }, el("span", { class: "nm", text: b }), el("p", { text: s }));
  return el("div", { class: "pane" },
    el("div", { class: "pane-h" }, el("div", null, el("p", { class: "k", text: "Contacto" }), el("h1", { text: "Pit Radio" }))),
    el("div", { class: "mailbox" }, el("span", { text: "hola@pursec.club" }), copy),
    el("div", { class: "cards2" },
      topic("CUENTA Y SUSCRIPCIÓN", "Cambiar de plan, cancelar o descargar facturas: desde Membership. Si algo falla, escríbenos con el email de tu cuenta."),
      topic("ERRORES EN DATOS", "Dinos la carrera, la pieza o la tool y qué dato es. Lo revisamos y lo corregimos citando la fuente."),
      topic("PRENSA Y COLABORACIONES", "Pilotos, ingenieros, medios y marcas: cuéntanos la idea en pocas líneas."),
      topic("PRIVACIDAD", "Para ejercer tus derechos sobre tus datos, escríbenos con «Privacidad» en el asunto.")));
}

// ---------- navegación por #hash ----------
const DEFAULT = "weekend-brief";
function current() {
  const h = location.hash.slice(1);
  if (h === "membership" || h === "pit-radio" || ITEMS.some((i) => i.id === h)) return h;
  return DEFAULT;
}
function render() {
  if (!ctx) return;
  const id = current();
  document.querySelectorAll(".g-side a[data-id]").forEach((a) => {
    if (a.dataset.id === id) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  const it = ITEMS.find((i) => i.id === id);
  const pane = id === "membership" ? membershipPane() : id === "pit-radio" ? pitRadioPane() : productPane(it);
  stage.replaceChildren(pane);
  stage.scrollTop = 0;
  const name = it ? it.name : id === "membership" ? "Membership" : "Pit Radio";
  document.title = `PURSEC — ${name}`;
}
window.addEventListener("hashchange", () => { setMenu(false); render(); stage.focus({ preventScroll: true }); });

// ---------- cajón en móvil ----------
const burger = $("#burger"), scrim = $("#scrim");
function setMenu(open) {
  app.classList.toggle("menu", open);
  burger.setAttribute("aria-expanded", String(open));
  burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  scrim.hidden = !open;
}
burger.addEventListener("click", () => setMenu(!app.classList.contains("menu")));
scrim.addEventListener("click", () => setMenu(false));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

// ---------- arranque ----------
if (!A) location.replace("/acceso");
else {
  A.requireMember().then(async (c) => {
    if (!c) return;
    ctx = c;
    render();
    await loadRaces().catch(() => {});
    render();
  }).catch(() => location.replace("/acceso?next=%2Fgarage%2F"));
}
