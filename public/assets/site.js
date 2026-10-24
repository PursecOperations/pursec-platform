/* PURSEC — tienda (web v2). Sin dependencias.
   Datos públicos: productos y lista de espera en Supabase (clave publicable, RLS),
   pago en el Worker pursec-shop (Stripe Checkout). Aquí no hay ninguna clave secreta. */
(() => {
"use strict";

const SUPABASE_URL = "https://uymgrzlbpaqorbwajhfh.supabase.co";
const SUPABASE_KEY = "sb_publishable_aKv-FR4J-9LYHz45Np-u_Q_TUoF9ybe";
const SHOP_API = "https://pursec-shop.pursec-telemetry-hq.workers.dev";
const SHIPPING_EUR = 4.95, FREE_FROM = 70, MAX_QTY = 5, MAX_LINES = 10;
const SIZE_ORDER = ["XXS","XS","S","M","L","XL","XXL","2XL","3XL","One size"];
/* Banda sonora de cada página. Pega el enlace de Spotify (canción, álbum o playlist).
   null = la mesa muestra "coming soon". "default" se usa en las páginas sin canción propia. */
const SOUNDTRACK = {
  default: null,
  // Inicio
  home: { url: "https://open.spotify.com/track/5XlzuIySfqhqMv5MqjHj6H", title: "Tell Me Somethin'", artist: "Toomas", cover: "https://i.scdn.co/image/ab67616d0000b27351d00e92ac87efac98195198" },
  // Drop 01 (tienda)
  shop: { url: "https://open.spotify.com/track/49BbpJuVsX2wUl0Qo9aVvC", title: "mop (feat. Young Thug)", artist: "Gunna", cover: "https://i.scdn.co/image/ab67616d0000b273095bca744b48a058767a8f48" },
  // Producto
  product: { url: "https://open.spotify.com/track/04Gk5sGLIDk6mRfTLnRasR", title: "DICEN", artist: "Fanta Rosario, Ponlos", cover: "https://i.scdn.co/image/ab67616d0000b2730e4994eaf538636d76b264b8" },
  // Ayuda
  help: { url: "https://open.spotify.com/track/6mjhmQB61lSVhgcmOFJv9L", title: "Ayúdame", artist: "Romeo Santos", cover: "https://i.scdn.co/image/ab67616d0000b273485849255c69a3c2c3cfc6a5" },
  // Legal
  legal: { url: "https://open.spotify.com/track/4X5f3vT8MRuXF68pfjNte5", title: "F**kin' Problems", artist: "A$AP Rocky, Drake, 2 Chainz, Kendrick Lamar", cover: "https://i.scdn.co/image/ab67616d0000b2732ae92030b51fb8135d694af9" },
};
const CATEGORIES = { hoodies:"Hoodies", tees:"Tees", sweatshirts:"Sweatshirts", bottoms:"Bottoms", outerwear:"Outerwear", accessories:"Accessories" };

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const eur = (n) => new Intl.NumberFormat("en-IE", { style:"currency", currency:"EUR" }).format(Number(n) || 0);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const page = document.body.dataset.page || "";
const sb = (path, opts = {}) => fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...opts, headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json", ...(opts.headers || {}) } });
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

const ICON = {
  photo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="5" width="18" height="14" rx="1.5"/><circle cx="12" cy="12" r="3.4"/><path d="M8 5l1.4-2h5.2L16 5"/></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 6h11v10H3zM14 9h4l3 3.5V16h-7"/><circle cx="7" cy="17.5" r="1.6"/><circle cx="17" cy="17.5" r="1.6"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9 7L4.5 11.5 9 16"/><path d="M5 11.5h9.5a5 5 0 010 10H12"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V8a4 4 0 018 0v2.5"/></svg>',
};

/* =================================================================== estructura común */
const NAV = [["Shop","/shop"],["Drop 01","/#drop"],["Fits","/#fits"],["About","/#about"]];
function chrome() {
  const here = location.pathname.replace(/\.html$/, "").replace(/\/$/, "") || "/";
  const hdr = $("[data-header]");
  if (hdr) hdr.outerHTML = `
  <a class="skip" href="#main">Skip to content</a>
  <div class="announce" role="region" aria-label="Announcements"><span class="msg">Free shipping from €70 · 14-day returns · Ships from Spain</span></div>
  <header class="hdr" id="hdr">
    <div style="display:flex;align-items:center">
      <button class="burger" aria-label="Menu" aria-expanded="false" aria-controls="mmenu"><i></i><i></i></button>
      <nav aria-label="Main">${NAV.map(([t, h]) => `<a href="${h}"${h === here ? ' aria-current="page"' : ""}>${t}</a>`).join("")}</nav>
    </div>
    <a class="brand${page === "home" ? " is-home" : ""}" href="/" aria-label="PURSEC — go to home"><img src="/img/brand/logo-nav.webp" width="286" height="72" alt="PURSEC"><span class="home-sig" aria-hidden="true"><i></i><b>Home</b><i></i></span></a>
    <div class="tools">
      <a class="tool hide-s" href="/help">Help</a>
      <button class="tool" data-open-bag aria-controls="bag">Bag<span class="bag-count" data-count>0</span></button>
    </div>
  </header>
  <div class="mmenu" id="mmenu" aria-hidden="true">
    <div>${NAV.map(([t, h]) => `<a class="big" href="${h}">${t}</a>`).join("")}</div>
    <div class="small caps"><a href="/help">Help</a><a href="/help#shipping">Shipping</a><a href="/help#returns">Returns</a><a href="/legal">Legal</a><a href="mailto:hola@pursec.club">hola@pursec.club</a></div>
  </div>`;

  const ftr = $("[data-footer]");
  if (ftr) ftr.outerHTML = `
  <footer class="ftr">
    <div class="rule" data-reveal style="margin:calc(-1 * clamp(48px,7vw,90px)) calc(-1 * var(--g)) 0"></div>
    ${deckHTML()}
    <div class="cols">
      <div class="about"><h4>PURSEC</h4><p>Streetwear released in drops. Shipped from our own stock in Spain.</p></div>
      <div><h4>Shop</h4><ul><li><a href="/shop">All pieces</a></li><li><a href="/#drop">Drop 01</a></li><li><a href="/#fits">Fits</a></li><li><a href="/#list">The list</a></li></ul></div>
      <div><h4>Help</h4><ul><li><a href="/help#shipping">Shipping</a></li><li><a href="/help#returns">Returns</a></li><li><a href="/help#sizing">Size guide</a></li><li><a href="/help#faq">FAQ</a></li><li><a href="mailto:hola@pursec.club">hola@pursec.club</a></li></ul></div>
      <div><h4>Legal</h4><ul><li><a href="/legal#terms">Terms of sale</a></li><li><a href="/legal#returns">Right of withdrawal</a></li><li><a href="/legal#privacy">Privacy</a></li><li><a href="/legal#cookies">Cookies</a></li><li><a href="/legal#owner">Legal notice</a></li></ul></div>
    </div>
    <img class="mega" src="/img/brand/logo-hero.webp" width="1080" height="300" alt="" loading="lazy" data-reveal>
    <div class="base mono mute"><span>© ${new Date().getFullYear()} PURSEC</span><span>Prices in EUR, VAT included · Payments by Stripe</span><span>Shipping to ES · FR · DE · IT · PT</span></div>
  </footer>
  <div class="scrim" data-close></div>
  <aside class="drawer" id="bag" aria-label="Bag" aria-hidden="true" tabindex="-1">
    <header><span class="h3">Bag <span class="mono mute" data-count-text></span></span><button class="x" data-close aria-label="Close">×</button></header>
    <div class="ship-bar" data-shipbar></div>
    <div class="body" data-lines></div>
    <footer data-bag-foot></footer>
  </aside>
  <aside class="drawer" id="sizes" aria-label="Size guide" aria-hidden="true" tabindex="-1">
    <header><span class="h3">Size guide</span><button class="x" data-close aria-label="Close">×</button></header>
    <div class="body" style="padding-top:18px">${sizeGuideHTML()}</div>
  </aside>
  <div class="toast" role="status" aria-live="polite"></div>
  <div class="sound-hint"><span class="rail" role="scrollbar" tabindex="0" aria-orientation="vertical" aria-controls="main" aria-label="Scroll the page" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span class="flare"></span><span class="cap"></span></span><a class="lbl" href="#deck" aria-label="Go to the soundtrack">Sound</a></div>`;

  // menú móvil
  const burger = $(".burger");
  burger?.addEventListener("click", () => {
    const open = !document.body.classList.contains("menu-open");
    document.body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open);
    $("#mmenu").setAttribute("aria-hidden", !open);
  });
  $$("#mmenu a").forEach((a) => a.addEventListener("click", () => { document.body.classList.remove("menu-open"); burger.setAttribute("aria-expanded", false); }));

  // cajones
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-bag]")) { e.preventDefault(); openDrawer("bag"); }
    if (e.target.closest("[data-open-sizes]")) { e.preventDefault(); openDrawer("sizes"); }
    if (e.target.closest("[data-close]")) closeDrawers();
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape") { closeDrawers(); document.body.classList.remove("menu-open"); } });
}

/* =================================================================== mesa de DJ */
function spotifyUri(link) {
  const m = String(link || "").match(/(track|album|playlist|episode)[/:]([A-Za-z0-9]{10,})/);
  return m ? `spotify:${m[1]}:${m[2]}` : null;
}
const PAGE_NAMES = { home: "PURSEC", shop: "Drop 01", product: "Product", help: "Help", legal: "Legal", thanks: "Thank you", "404": "Lost" };
function platter(side) {
  return `<div class="platter ${side}" aria-hidden="true"><div class="vinyl"><span class="label"><img src="/img/brand/logo-mark.webp" alt=""></span></div><span class="arm"></span></div>`;
}
function deckHTML() {
  const t = SOUNDTRACK[page] ?? SOUNDTRACK.default;
  const uri = spotifyUri(t?.url);
  const body = `<svg class="dk-body d" viewBox="0 0 1000 420" preserveAspectRatio="none" aria-hidden="true"><path class="shell" vector-effect="non-scaling-stroke" d="M36 210C36 132 110 52 230 50C270 50 280 60 290 40Q300 14 340 12L660 12Q700 14 710 40C720 60 730 50 770 50C890 52 964 132 964 210C964 288 890 368 770 370C730 370 720 360 710 380Q700 406 660 408L340 408Q300 406 290 380C280 360 270 370 230 370C110 368 36 288 36 210Z"/><path class="inner" vector-effect="non-scaling-stroke" transform="translate(25 10.5) scale(.95)" d="M36 210C36 132 110 52 230 50C270 50 280 60 290 40Q300 14 340 12L660 12Q700 14 710 40C720 60 730 50 770 50C890 52 964 132 964 210C964 288 890 368 770 370C730 370 720 360 710 380Q700 406 660 408L340 408Q300 406 290 380C280 360 270 370 230 370C110 368 36 288 36 210Z"/></svg>
    <svg class="dk-body m" viewBox="0 0 400 480" preserveAspectRatio="none" aria-hidden="true"><path class="shell" vector-effect="non-scaling-stroke" d="M70 6L330 6Q372 8 374 50L374 230C374 262 398 280 398 330L398 400C398 452 360 474 300 474L100 474C40 474 2 452 2 400L2 330C2 280 26 262 26 230L26 50Q28 8 70 6Z"/><path class="inner" vector-effect="non-scaling-stroke" transform="translate(10 12) scale(.95)" d="M70 6L330 6Q372 8 374 50L374 230C374 262 398 280 398 330L398 400C398 452 360 474 300 474L100 474C40 474 2 452 2 400L2 330C2 280 26 262 26 230L26 50Q28 8 70 6Z"/></svg>`;
  return `<section class="deck${uri ? "" : " empty"}" id="deck" aria-label="Soundtrack">
    ${body}
    <span class="dk-wire l" aria-hidden="true"><i></i></span><span class="dk-wire r" aria-hidden="true"><i></i></span>
    <span class="leds" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
    <div class="pod l">${platter("l")}</div>
    <div class="screen">
      ${t?.cover ? `<img class="screen-bg" src="${esc(t.cover)}" alt="" loading="lazy">` : ""}
      <div class="idle">
        ${t?.cover ? `<img class="art" src="${esc(t.cover)}" alt="Cover of ${esc(t.title)}" loading="lazy" width="640" height="640">` : `<div class="art ph"></div>`}
        <div class="meta">
          <span class="eyebrow">Soundtrack · ${esc(PAGE_NAMES[page] || "PURSEC")}</span>
          <b class="track">${esc(t?.title || "Coming soon")}</b>
          <span class="artist">${esc(t?.artist || "A track for this page is on its way")}</span>
          <button class="play" type="button" ${uri ? "" : "disabled"} aria-label="Play ${esc(t?.title || "the soundtrack")}"><span class="tri"></span></button>
          <span class="note">${uri ? "Plays only when you press play" : ""}</span>
        </div>
      </div>
      <div class="embed" id="deck-embed"></div>
      <span class="scan" aria-hidden="true"></span>
    </div>
    <div class="pod r">${platter("r")}</div>
    <div class="fader" aria-hidden="true"><i></i></div>
  </section>`;
}
function deck() {
  const d = $("#deck"); if (!d) return;
  const uri = spotifyUri((SOUNDTRACK[page] ?? SOUNDTRACK.default)?.url);
  const btn = $(".play", d);
  let ctrl = null;
  const setPlaying = (on) => d.classList.toggle("playing", on);
  btn?.addEventListener("click", () => {
    if (!uri) return;
    if (ctrl) { ctrl.togglePlay(); return; }
    btn.disabled = true; d.classList.add("loading");
    // Spotify solo se carga cuando el cliente pulsa play: antes no se envía nada a Spotify.
    window.onSpotifyIframeApiReady = (API) => {
      API.createController($("#deck-embed"), { uri, width: "100%", height: 152, theme: "dark" }, (c) => {
        ctrl = c; d.classList.remove("loading"); d.classList.add("live"); btn.disabled = false;
        c.addListener("ready", () => c.play());
        c.addListener("playback_update", (e) => setPlaying(!e.data.isPaused));
      });
    };
    const sc = document.createElement("script");
    sc.src = "https://open.spotify.com/embed/iframe-api/v1"; sc.async = true;
    sc.onerror = () => { d.classList.remove("loading"); btn.disabled = false; toast("Spotify couldn't load. Try again."); };
    document.body.appendChild(sc);
  });
  // Fader lateral: arrastrar = desplazar la página; "Sound" lleva a la mesa.
  const hint = $(".sound-hint"); if (!hint) return;
  const rail = $(".rail", hint);
  const max = () => document.documentElement.scrollHeight - innerHeight;
  const go = (clientY) => { const r = rail.getBoundingClientRect(); const t = Math.min(1, Math.max(0, (clientY - r.top) / r.height)); scrollTo({ top: t * max(), behavior: "instant" }); };
  let drag = false;
  rail.addEventListener("pointerdown", (e) => { if (e.pointerType === "mouse" && e.button !== 0) return; drag = true; rail.setPointerCapture(e.pointerId); hint.classList.add("drag"); go(e.clientY); e.preventDefault(); });
  // Solo se mueve con el botón pulsado: pasar el ratón por encima no hace nada.
  rail.addEventListener("pointermove", (e) => { if (!drag) return; if (e.pointerType === "mouse" && e.buttons === 0) return end(); go(e.clientY); });
  const end = () => { drag = false; hint.classList.remove("drag"); };
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((ev) => rail.addEventListener(ev, end));
  addEventListener("blur", end);
  rail.addEventListener("keydown", (e) => {
    const step = { ArrowDown: 0.08, ArrowUp: -0.08, PageDown: 0.25, PageUp: -0.25 }[e.key];
    if (e.key === "Home") { e.preventDefault(); return scrollTo({ top: 0 }); }
    if (e.key === "End") { e.preventDefault(); return scrollTo({ top: max() }); }
    if (step) { e.preventDefault(); scrollBy({ top: step * max(), behavior: reduce ? "auto" : "smooth" }); }
  });
  addEventListener("scroll", () => rail.setAttribute("aria-valuenow", Math.round((scrollY / Math.max(1, max())) * 100)), { passive: true });
  if ("IntersectionObserver" in window) new IntersectionObserver(([en]) => hint.classList.toggle("at-deck", en.isIntersecting), { threshold: 0.2 }).observe(d);
  $(".lbl", hint).addEventListener("click", (e) => { e.preventDefault(); d.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); });
}

let lastFocus = null;
function openDrawer(id) {
  closeDrawers(true);
  lastFocus = document.activeElement;
  const d = document.getElementById(id);
  d.classList.add("open"); d.setAttribute("aria-hidden", "false");
  document.body.classList.add("drawer-open");
  if (id === "bag") { renderBag(); validateBag(); }
  setTimeout(() => d.focus(), 50);
}
function closeDrawers(silent) {
  $$(".drawer.open").forEach((d) => { d.classList.remove("open"); d.setAttribute("aria-hidden", "true"); });
  document.body.classList.remove("drawer-open");
  if (!silent && lastFocus) lastFocus.focus?.();
}

let toastT;
function toast(msg) {
  const t = $(".toast"); if (!t) return;
  t.textContent = msg; t.classList.add("on");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 2600);
}

function sizeGuideHTML() {
  const rows = ["XS","S","M","L","XL","XXL"].map((s) => `<tr><td>${s}</td><td>—</td><td>—</td><td>—</td></tr>`).join("");
  return `<p class="small" style="margin:0 0 14px">Measurements are taken flat, in centimetres. Each piece lists its own fit and measurements on its page when the drop opens.</p>
  <table class="table"><thead><tr><th>Size</th><th>Chest ½</th><th>Length</th><th>Sleeve</th></tr></thead><tbody>${rows}</tbody></table>
  <h3 class="h3" style="margin:26px 0 8px;font-size:15px">How to measure</h3>
  <p class="small" style="margin:0">Lay a piece you already own flat. Chest: armpit to armpit. Length: from the highest point of the shoulder to the hem. Sleeve: from the shoulder seam to the cuff. Compare with the table.</p>
  <p class="small" style="margin:14px 0 0">Between two sizes? Write to <a href="mailto:hola@pursec.club">hola@pursec.club</a> and we will help you choose.</p>`;
}

/* =================================================================== datos */
// "*" trae category cuando exista la columna, sin romper si aún no está
const SELECT = "*,product_variants(id,size,color,active,stock)";
let productsCache = null;
async function loadProducts() {
  if (productsCache) return productsCache;
  let list = [];
  try {
    const r = await sb(`products?active=eq.true&order=sort.asc&select=${SELECT}`);
    if (r.ok) list = await r.json();
  } catch {}
  productsCache = (list || []).map(normalize).filter((p) => p.variants.length);
  return productsCache;
}
function normalize(p) {
  const variants = (p.product_variants || []).filter((v) => v.active).sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size));
  const img = p.images || {};
  const gallery = [img.front, img.back, ...(Array.isArray(img.gallery) ? img.gallery : [])].filter(Boolean);
  const inStock = variants.some((v) => v.stock > 0);
  return { ...p, variants, gallery, inStock, colors: [...new Set(variants.map((v) => v.color).filter(Boolean))] };
}

/* =================================================================== tarjetas */
function slotHTML(label, cls = "") {
  return `<div class="slot ${cls}"><span class="lbl">${ICON.photo}${esc(label)}</span></div>`;
}
function cardHTML(p, i) {
  const a = p.gallery[0], b = p.gallery[1];
  const sizes = p.variants.map((v) => `<button type="button" data-add="${v.id}" ${v.stock > 0 ? "" : "disabled"} aria-label="Add size ${esc(v.size)}">${esc(v.size)}</button>`).join("");
  const low = p.variants.reduce((t, v) => t + Math.max(0, v.stock), 0);
  const badge = !p.inStock ? '<span class="badge dark">Sold out</span>' : low <= 5 ? '<span class="badge lilac">Last pieces</span>' : '<span class="badge">Drop 01</span>';
  return `<article class="card" data-reveal style="--d:${(i % 4) * 0.06}s">
    <a class="media" href="/product?p=${encodeURIComponent(p.slug)}" aria-label="${esc(p.name)}">
      ${badge}
      ${a ? `<img class="a" src="${esc(a)}" alt="${esc(p.name)}" loading="lazy">` : slotHTML("Front", "a")}
      ${b ? `<img class="b" src="${esc(b)}" alt="" loading="lazy">` : slotHTML("Back", "b")}
    </a>
    ${p.inStock ? `<div class="quick" aria-label="Quick add">${sizes}</div>` : ""}
    <div class="row"><a class="name" href="/product?p=${encodeURIComponent(p.slug)}" style="text-decoration:none">${esc(p.name)}</a><span class="price">${eur(p.price_eur)}</span></div>
    ${p.colors.length ? `<div class="sub">${esc(p.colors.join(" / "))}</div>` : ""}
  </article>`;
}
function placeholderCards(n, start = 1) {
  return Array.from({ length: n }, (_, i) => {
    const k = String(start + i).padStart(2, "0");
    return `<article class="card" data-reveal style="--d:${(i % 4) * 0.06}s">
      <a class="media" href="/product?demo=1" aria-label="Piece ${k}, preview">
        <span class="badge">Coming soon</span>
        ${slotHTML(`Piece ${k} · front`, "a")}${slotHTML(`Piece ${k} · back`, "b")}
      </a>
      <div class="row"><span class="name">Piece ${k}</span><span class="price">€ —</span></div>
      <div class="sub">To be revealed</div>
    </article>`;
  }).join("");
}
function bindQuickAdd(root, products) {
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-add]"); if (!b) return;
    e.preventDefault();
    const id = Number(b.dataset.add);
    for (const p of products) { const v = p.variants.find((x) => x.id === id); if (v) { addToBag(p, v); break; } }
  });
}

/* =================================================================== bolsa */
let bag = store.get("pursec-bag", []);
const saveBag = () => { store.set("pursec-bag", bag); paintCount(); };
const bagQty = () => bag.reduce((t, l) => t + l.qty, 0);
const bagSubtotal = () => bag.reduce((t, l) => t + l.qty * l.price, 0);
function paintCount(bump) {
  $$("[data-count]").forEach((c) => { c.textContent = bagQty(); if (bump) { c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump"); } });
  $$("[data-count-text]").forEach((c) => (c.textContent = `(${bagQty()})`));
}
function addToBag(p, v, qty = 1) {
  if (!(v.stock > 0)) return toast("That size is sold out.");
  const line = bag.find((l) => l.variant_id === v.id);
  const have = line ? line.qty : 0;
  const max = Math.min(MAX_QTY, v.stock);
  if (have + qty > max) return toast(`Only ${max} available in ${v.size}.`);
  if (!line && bag.length >= MAX_LINES) return toast("Your bag is full.");
  if (line) line.qty += qty;
  else bag.push({ variant_id: v.id, slug: p.slug, name: p.name, size: v.size, color: v.color || "", price: Number(p.price_eur), img: p.gallery[0] || "", qty, max });
  saveBag(); paintCount(true);
  openDrawer("bag");
}
function renderBag() {
  const lines = $("[data-lines]"), foot = $("[data-bag-foot]"), bar = $("[data-shipbar]");
  if (!lines) return;
  const sub = bagSubtotal();
  const left = Math.max(0, FREE_FROM - sub);
  bar.innerHTML = bag.length
    ? `<span>${left > 0 ? `You are <b>${eur(left)}</b> away from free shipping.` : "<b>Free shipping</b> unlocked."}</span><div class="track"><i style="width:${Math.min(100, (sub / FREE_FROM) * 100)}%"></i></div>`
    : `<span>Free shipping on orders from ${eur(FREE_FROM)}.</span>`;
  if (!bag.length) {
    lines.innerHTML = `<div class="empty"><span class="h3">Your bag is empty</span><span class="small">Drop 01 is coming. Join the list to hear first.</span><a class="btn dark" href="/#list" data-close>Join the list</a></div>`;
    foot.innerHTML = ""; paintCount(); return;
  }
  lines.innerHTML = bag.map((l, i) => `<div class="line">
      <a class="thumb" href="/product?p=${encodeURIComponent(l.slug)}">${l.img ? `<img src="${esc(l.img)}" alt="">` : slotHTML("")}</a>
      <div class="t"><b>${esc(l.name)}</b><span class="small">${esc([l.size, l.color].filter(Boolean).join(" · "))}</span>
        <div class="qty"><button data-q="${i}" data-d="-1" aria-label="Less">−</button><span>${l.qty}</span><button data-q="${i}" data-d="1" aria-label="More">+</button></div></div>
      <div class="r"><span>${eur(l.qty * l.price)}</span><button class="link rm" data-rm="${i}">Remove</button></div>
    </div>`).join("") + `<div data-bag-warn></div>`;
  const ship = sub >= FREE_FROM ? 0 : SHIPPING_EUR;
  foot.innerHTML = `
    <div class="totals"><span>Subtotal</span><span class="mono">${eur(sub)}</span></div>
    <div class="totals small" style="font-weight:400"><span>Shipping</span><span>${ship ? eur(ship) : "Free"}</span></div>
    <button class="btn dark block" data-checkout>Checkout <span class="arrow">→</span></button>
    <span class="small" style="text-align:center">VAT included. Secure payment by Stripe. Shipping to ES · FR · DE · IT · PT.</span>`;
  paintCount();
}
document.addEventListener("click", async (e) => {
  const q = e.target.closest("[data-q]"), rm = e.target.closest("[data-rm]"), co = e.target.closest("[data-checkout]");
  if (q) { const l = bag[+q.dataset.q]; const n = l.qty + Number(q.dataset.d); if (n < 1) bag.splice(+q.dataset.q, 1); else if (n > Math.min(MAX_QTY, l.max || MAX_QTY)) toast(`Only ${Math.min(MAX_QTY, l.max || MAX_QTY)} available.`); else l.qty = n; saveBag(); renderBag(); }
  if (rm) { bag.splice(+rm.dataset.rm, 1); saveBag(); renderBag(); }
  if (co) checkout(co);
});
// Precios y stock siempre desde Supabase: la bolsa guardada solo es una pista.
async function validateBag() {
  if (!bag.length) return;
  try {
    const ids = bag.map((l) => l.variant_id).join(",");
    const r = await sb(`product_variants?id=in.(${ids})&select=id,size,color,active,stock,product:products(slug,name,price_eur,active,images)`);
    if (!r.ok) return;
    const rows = await r.json(); const by = new Map(rows.map((x) => [x.id, x]));
    const notes = [];
    bag = bag.filter((l) => {
      const v = by.get(l.variant_id);
      if (!v || !v.active || !v.product?.active || !(v.stock > 0)) { notes.push(`${l.name} (${l.size}) is no longer available.`); return false; }
      l.price = Number(v.product.price_eur); l.max = v.stock; l.name = v.product.name;
      if (l.qty > Math.min(MAX_QTY, v.stock)) { l.qty = Math.min(MAX_QTY, v.stock); notes.push(`${l.name} (${l.size}): only ${l.qty} left.`); }
      return true;
    });
    saveBag(); renderBag();
    if (notes.length) { const w = $("[data-bag-warn]"); if (w) w.innerHTML = `<p class="warn" style="margin:14px 0">${notes.map(esc).join("<br>")}</p>`; }
  } catch {}
}
async function checkout(btn) {
  btn.disabled = true; const old = btn.innerHTML; btn.textContent = "Opening secure checkout…";
  try {
    const r = await fetch(`${SHOP_API}/checkout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: bag.map((l) => ({ variant_id: l.variant_id, quantity: l.qty })) }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.url) throw new Error(d.error || "Checkout is unavailable right now");
    location.href = d.url;
  } catch (err) { toast(`${err.message}. Please try again.`); btn.disabled = false; btn.innerHTML = old; }
}

/* =================================================================== lista de espera */
function bindWaitlists() {
  $$("form[data-waitlist]").forEach((f) => f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $(".form-msg", f), btn = $("button[type=submit]", f), email = $("input[type=email]", f).value.trim(), consent = $("input[type=checkbox]", f);
    msg.className = "form-msg"; msg.textContent = "";
    if (consent && !consent.checked) { msg.className = "form-msg err"; msg.textContent = "Please accept the privacy policy to join."; return; }
    btn.disabled = true;
    try {
      const r = await sb("waitlist", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ email, lang: "en", source: f.dataset.waitlist || "web" }) });
      if (!r.ok && r.status !== 409) throw new Error(String(r.status));
      msg.className = "form-msg ok"; msg.textContent = f.dataset.ok || "You're on the list. We'll email you before the drop opens.";
      $("input[type=email]", f).value = "";
    } catch { msg.className = "form-msg err"; msg.textContent = "Could not join right now. Try again in a minute."; }
    finally { btn.disabled = false; }
  }));
}

/* =================================================================== animación */
function reveals() {
  const els = $$("[data-reveal], .clip[data-split]");
  if (reduce || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
  const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  els.forEach((e) => io.observe(e));
}
function revealLate(root) { $$("[data-reveal]", root).forEach((e) => requestAnimationFrame(() => setTimeout(() => e.classList.add("in"), 30))); }

function manifesto() {
  const m = $(".manifesto"); if (!m) return;
  const hl = (m.dataset.hl || "").split(",").map((s) => s.trim().toLowerCase());
  m.innerHTML = m.textContent.trim().split(/\s+/).map((w) => `<span class="w${hl.includes(w.toLowerCase().replace(/[^a-z0-9]/g, "")) ? " hl" : ""}">${esc(w)}</span>`).join(" ");
  const ws = $$(".w", m);
  if (reduce) { ws.forEach((w) => w.classList.add("on")); return; }
  const tick = () => {
    const r = m.getBoundingClientRect(), vh = innerHeight;
    const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
    const n = Math.round(p * ws.length);
    ws.forEach((w, i) => w.classList.toggle("on", i < n));
  };
  addEventListener("scroll", tick, { passive: true }); tick();
}

function dragScroll(el) {
  if (!el) return;
  let down = false, x0 = 0, s0 = 0, moved = false;
  el.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; down = true; moved = false; x0 = e.clientX; s0 = el.scrollLeft; el.classList.add("drag"); });
  addEventListener("pointermove", (e) => { if (!down) return; const dx = e.clientX - x0; if (Math.abs(dx) > 4) moved = true; el.scrollLeft = s0 - dx; });
  addEventListener("pointerup", () => { down = false; el.classList.remove("drag"); });
  el.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
}

// La línea del logo: un punto de luz sigue al ratón por la línea del hero.
function beamHover(hero) {
  if (!hero || reduce || matchMedia("(hover: none)").matches) return;
  const beam = $(".beam", hero); if (!beam) return;
  hero.addEventListener("pointerenter", () => hero.classList.add("hover"));
  hero.addEventListener("pointerleave", () => hero.classList.remove("hover"));
  hero.addEventListener("pointermove", (e) => { const r = beam.getBoundingClientRect(); beam.style.setProperty("--mx", `${e.clientX - r.left}px`); }, { passive: true });
}
// Progreso de lectura: la línea bajo la cabecera se llena al bajar.
// Transición portada → Drop 01: la línea de luz se abre hasta volverse la página blanca.
function opening() {
  const el = $(".opening"); if (!el) return;
  if (reduce) { el.style.setProperty("--w", 1); el.style.setProperty("--h", 1); el.style.setProperty("--b", 0); return; }
  const tick = () => {
    const r = el.getBoundingClientRect(), vh = innerHeight;
    const mid = r.top + r.height / 2;
    const o = Math.min(1, Math.max(0, (vh * 0.95 - mid) / (vh * 0.85)));
    el.style.setProperty("--w", Math.min(1, o / 0.3).toFixed(3));
    const h = Math.min(1, Math.max(0, (o - 0.3) / 0.7));
    el.style.setProperty("--h", h.toFixed(3));
    el.style.setProperty("--b", (1 - Math.min(1, h * 3)).toFixed(3));
  };
  addEventListener("scroll", tick, { passive: true }); addEventListener("resize", tick); tick();
}
function progress() {
  const set = () => { const h = document.documentElement.scrollHeight - innerHeight; document.documentElement.style.setProperty("--p", h > 0 ? (scrollY / h).toFixed(4) : 0); };
  addEventListener("scroll", set, { passive: true }); addEventListener("resize", set); set();
}
function tilt(stage) {
  const t = $(".tilt", stage); if (!t || reduce || matchMedia("(hover: none)").matches) return;
  addEventListener("pointermove", (e) => {
    const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
    t.style.transform = `rotateY(${x * 9}deg) rotateX(${-y * 7}deg)`;
  }, { passive: true });
}

/* =================================================================== páginas */
async function home() {
  beamHover($(".hero")); tilt($(".logo-stage")); opening(); manifesto(); dragScroll($(".look"));
  const grid = $("#drop-grid"); if (!grid) return;
  const ps = await loadProducts();
  if (ps.length) {
    grid.innerHTML = ps.slice(0, 8).map(cardHTML).join("");
    $("#drop-count").textContent = String(ps.length).padStart(2, "0");
    $("#drop-state").textContent = ps.some((p) => p.inStock) ? "Available now" : "Sold out";
    bindQuickAdd(grid, ps);
  } else {
    grid.innerHTML = placeholderCards(4);
  }
  revealLate(grid);
}

async function shop() {
  const grid = $("#shop-grid"), pills = $("#pills"), sort = $("#sort"), info = $("#shop-info");
  const ps = await loadProducts();
  if (!ps.length) {
    grid.innerHTML = placeholderCards(8);
    info.textContent = "Drop 01 is not open yet. This is how the shop will look.";
    pills.innerHTML = Object.values(CATEGORIES).slice(0, 4).map((c, i) => `<button class="pill" aria-pressed="${i === 0}" disabled>${i === 0 ? "All" : c}</button>`).join("");
    sort.disabled = true; revealLate(grid); return;
  }
  const cats = [...new Set(ps.map((p) => p.category).filter(Boolean))];
  let cat = new URLSearchParams(location.search).get("c") || "all";
  pills.innerHTML = [["all", "All"], ...cats.map((c) => [c, CATEGORIES[c] || c])].map(([k, t]) => `<button class="pill" data-c="${esc(k)}" aria-pressed="${k === cat}">${esc(t)}</button>`).join("");
  const paint = () => {
    let list = ps.filter((p) => cat === "all" || p.category === cat);
    const s = sort.value;
    if (s === "price-asc") list = [...list].sort((a, b) => a.price_eur - b.price_eur);
    if (s === "price-desc") list = [...list].sort((a, b) => b.price_eur - a.price_eur);
    if (s === "new") list = [...list].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    grid.innerHTML = list.map(cardHTML).join("") || `<p class="small">Nothing here yet.</p>`;
    info.textContent = `${list.length} piece${list.length === 1 ? "" : "s"}`;
    revealLate(grid);
  };
  pills.addEventListener("click", (e) => { const b = e.target.closest("[data-c]"); if (!b) return; cat = b.dataset.c; $$(".pill", pills).forEach((x) => x.setAttribute("aria-pressed", x === b)); history.replaceState(null, "", cat === "all" ? "/shop" : `/shop?c=${cat}`); paint(); });
  sort.addEventListener("change", paint);
  bindQuickAdd(grid, ps); paint();
}

async function product() {
  const q = new URLSearchParams(location.search);
  const slug = q.get("p");
  const ps = await loadProducts();
  let p = slug ? ps.find((x) => x.slug === slug) : null;
  const demo = !p;
  if (demo && slug) $("#pdp-note").innerHTML = `<p class="warn" style="margin:0">This piece is not available. Showing the product page layout.</p>`;
  if (demo) p = { slug: "preview", name: "Piece 01", price_eur: null, description: "", specs: [], gallery: [], colors: [], inStock: false, variants: ["XS","S","M","L","XL","XXL"].map((s, i) => ({ id: -1 - i, size: s, stock: 0 })) };

  document.title = `${p.name} — PURSEC`;
  $("#pdp-name").textContent = p.name;
  $("#pdp-crumb").textContent = p.name;
  $("#pdp-price").innerHTML = demo ? `<span>€ —</span><span class="small">Price revealed with the drop</span>` : `<span>${eur(p.price_eur)}</span><span class="small">VAT included</span>`;
  $("#pdp-color").textContent = p.colors.length ? p.colors.join(" / ") : demo ? "Colour to be revealed" : "";
  const shots = demo || !p.gallery.length ? ["Front", "Back", "Detail", "On body", "Fabric"].map((t) => `<div class="shot">${slotHTML(t)}</div>`) : p.gallery.map((src, i) => `<div class="shot"><img src="${esc(src)}" alt="${esc(p.name)}, photo ${i + 1}" ${i ? 'loading="lazy"' : ""}></div>`);
  const gal = $("#gallery"); gal.innerHTML = shots.join("");
  $("#dots").innerHTML = shots.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("");
  gal.addEventListener("scroll", () => { const i = Math.round(gal.scrollLeft / gal.clientWidth); $$("#dots i").forEach((d, k) => d.classList.toggle("on", k === i)); }, { passive: true });

  $("#pdp-desc").innerHTML = p.description ? esc(p.description).replace(/\n/g, "<br>") : "The full description, fit and composition are published with the drop.";
  $("#pdp-specs").innerHTML = (p.specs || []).length ? `<ul>${p.specs.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : "Fibre composition and care instructions are listed here and on the garment label.";

  let chosen = null;
  const sizes = $("#sizes-row"), add = $("#add"), sticky = $("#sticky-add"), note = $("#stock-note"), notify = $("#notify");
  sizes.innerHTML = p.variants.map((v) => `<button type="button" data-v="${v.id}" class="${v.stock > 0 || demo ? "" : "out"}" aria-pressed="false" aria-label="Size ${esc(v.size)}${v.stock > 0 || demo ? "" : ", sold out"}">${esc(v.size)}</button>`).join("");
  const paint = () => {
    const v = chosen;
    if (demo) { add.textContent = "Coming soon"; add.disabled = true; note.textContent = ""; notify.hidden = false; return; }
    if (!v) { add.innerHTML = "Select a size"; add.disabled = true; note.textContent = ""; notify.hidden = true; return; }
    if (v.stock > 0) { add.innerHTML = `Add to bag — ${eur(p.price_eur)}`; add.disabled = false; notify.hidden = true; note.className = "stock-note" + (v.stock <= 3 ? " low" : ""); note.textContent = v.stock <= 3 ? `Only ${v.stock} left in ${v.size}.` : "In stock. Ships within 3 business days."; }
    else { add.textContent = "Sold out"; add.disabled = true; note.textContent = ""; notify.hidden = false; $("input[name=src]", notify)?.setAttribute("value", `restock:${p.slug}:${v.size}`); notify.dataset.waitlist = `restock:${p.slug}:${v.size}`; }
    sticky.innerHTML = add.innerHTML; sticky.disabled = add.disabled;
  };
  sizes.addEventListener("click", (e) => { const b = e.target.closest("[data-v]"); if (!b) return; chosen = p.variants.find((v) => String(v.id) === b.dataset.v); $$("button", sizes).forEach((x) => x.setAttribute("aria-pressed", x === b)); paint(); });
  const first = p.variants.filter((v) => v.stock > 0);
  if (first.length === 1) { chosen = first[0]; sizes.querySelector(`[data-v="${chosen.id}"]`).setAttribute("aria-pressed", "true"); }
  add.addEventListener("click", () => chosen && addToBag(p, chosen));
  sticky.addEventListener("click", () => chosen ? addToBag(p, chosen) : sizes.scrollIntoView({ behavior: "smooth", block: "center" }));
  if (!p.inStock || demo) notify.hidden = false;
  if (!demo) notify.dataset.waitlist = `restock:${p.slug}`; else notify.dataset.waitlist = "web-product-preview";
  paint();
  if (!demo) {
    new IntersectionObserver(([en]) => $(".sticky-buy").classList.toggle("on", !en.isIntersecting && en.boundingClientRect.top < 0)).observe(add);
  }
  const more = $("#more-grid");
  const others = ps.filter((x) => x.slug !== p.slug).slice(0, 4);
  more.innerHTML = others.length ? others.map(cardHTML).join("") : placeholderCards(4, 2);
  bindQuickAdd(more, ps); revealLate(more);
}

function docNav() {
  const links = $$(".doc nav a"); if (!links.length) return;
  const map = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
  const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { links.forEach((a) => a.classList.remove("on")); map.get(en.target.id)?.classList.add("on"); } }), { rootMargin: "-30% 0px -60% 0px" });
  $$(".doc h2[id]").forEach((h) => io.observe(h));
}

/* =================================================================== arranque */
chrome(); deck(); paintCount(); bindWaitlists(); docNav(); progress();
window.PURSEC = { clearBag() { bag = []; saveBag(); } };
const run = { home, shop, product, "404": () => beamHover($(".hero")) }[page];
Promise.resolve(run && run()).finally(reveals);
if (location.hash === "#bag") openDrawer("bag");
})();
