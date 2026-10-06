// PURSEC v4.1 — armazón común: cabecera, paneles de media pantalla (al pasar el ratón), barra de próximas carreras,
// gadgets, pie, cookies y bienvenida.
(function () {
  "use strict";
  var PS = window.PS;
  var D = document, body = D.body, page = body.getAttribute("data-page") || "";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  function esc(s) { var d = D.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var Q = new URLSearchParams(location.search);

  var I = {
    chev: '<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    user: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    brief: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6z M14 3v5h5 M9 13h7 M9 17h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>',
    card: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 15l3-4 3 2 4-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    sprint: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    debrief: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    news: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 8h10M7 12h10M7 16h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    video: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4a3 3 0 0 0 4 4M16 6h4a3 3 0 0 1-4 4M12 13v4M8 21h8M9 17h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    ig: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg>',
    tt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3v11a3.5 3.5 0 1 1-3.5-3.5M14 3c.5 3 2.5 4.5 5 4.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    yt: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10 9v6l5-3z" fill="currentColor"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l16 16M20 4L4 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    dc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6c4-2 10-2 14 0l2 10c-2 2-4 3-6 3l-1-2M9 17l-1 2c-2 0-4-1-6-3L4 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="9" cy="12" r="1.4" fill="currentColor"/><circle cx="15" cy="12" r="1.4" fill="currentColor"/></svg>'
  };

  // foto con fondo (siempre real; nada de marcadores)
  function photo(src, alt, cls) { return '<div class="ph-img ' + (cls || "") + '"><img src="' + src + '" alt="' + esc(alt || "") + '" loading="lazy" decoding="async"></div>'; }
  function img(key) { return "/img/fotos/" + key + ".webp"; }

  var fmtD = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", timeZone: "UTC" });
  function mon(d) { return fmtD.formatToParts(d).filter(function (p) { return p.type === "month"; })[0].value.replace(".", "").toUpperCase(); }
  function range(r) {
    var a = new Date(r.start + "T00:00:00Z"), b = new Date(r.date + "T00:00:00Z");
    var da = String(a.getUTCDate()).padStart(2, "0"), db = String(b.getUTCDate()).padStart(2, "0");
    return r.start === r.date ? da + " " + mon(a) : (mon(a) === mon(b) ? da + " – " + db + " " + mon(b) : da + " " + mon(a) + " – " + db + " " + mon(b));
  }
  function nextSprint(sid) { var t = PS.todayISO(); return PS.CALS[sid].filter(function (r) { return r.date >= t && r.sprint; })[0] || null; }
  function lastRace(sid) { var d = PS.CALS[sid].filter(function (r) { return PS.status(r) === "done"; }); return d[d.length - 1] || null; }
  function leader(sid) { var g = PS.grid(sid); if (g) return [g.dStand[0].name, g.dStand[0].pts + " pts"]; var h = PS.HIGHLIGHT[sid]; return [h ? h.t : "", ""]; }

  // ---------- paneles ----------
  var MENUS = {
    categories: { t: "Categories", p: "Elige una serie: introducción visual, cómo funciona y todo lo que hay dentro.", href: "/categorias?s=", info: function (s) { return [s.tag, ""]; } },
    schedules: { t: "Schedules", p: "El calendario completo de cada categoría.", href: "/calendario?s=", info: function (s) { var n = PS.nextRace(s.id); return n ? ["Next: " + n.name, range(n)] : ["Temporada terminada", PS.CALS[s.id].length + " rondas"]; } },
    standings: { t: "Standings", p: "Clasificaciones generales de pilotos y constructores.", href: "/clasificacion?s=", info: function (s) { var l = leader(s.id); return [l[0], l[1]]; } },
    drivers: { t: "Drivers", p: "Los pilotos de cada parrilla, con su ficha y su temporada.", href: "/pilotos?s=", info: function (s) { var g = PS.grid(s.id); return g ? [g.drivers.length + " pilotos", "Ver parrilla"] : ["Parrilla con fuente: próximamente", ""]; } },
    constructors: { t: "Constructors", p: "Los equipos de cada categoría, con su ficha y su temporada.", href: "/equipos?s=", info: function (s) { var g = PS.grid(s.id); return g ? [g.teams.length + " equipos", "Ver equipos"] : ["Equipos con fuente: próximamente", ""]; } },
    next: { t: "Next races", p: "La próxima carrera de cada categoría, con todas sus sesiones y horarios.", href: "/proximas?s=", info: function (s) { var n = PS.nextRace(s.id); return n ? [n.flag + " " + n.name, range(n)] : ["Off-season", ""]; } },
    brief: { t: "Weekend Brief", p: "La predicción de estrategia de las carreras que vienen.", href: "/weekend?k=brief&s=", info: function (s) { var n = PS.nextRace(s.id); return n ? [n.name, range(n)] : ["Off-season", ""]; } },
    racecard: { t: "Race Card", p: "La tarjeta de cada próxima carrera, con los umbrales clave.", href: "/weekend?k=racecard&s=", info: function (s) { var n = PS.nextRace(s.id); return n ? [n.name, range(n)] : ["Off-season", ""]; } },
    sprintcard: { t: "Sprint Card", p: "Las carreras sprint que vienen, en las series que las tienen.", href: "/weekend?k=sprintcard&s=", info: function (s) { if (!s.sprint) return ["Sin formato sprint", ""]; var n = nextSprint(s.id); return n ? [n.name, range(n)] : ["Sin sprint próximo", ""]; } },
    debrief: { t: "Debrief", p: "El análisis técnico de la última carrera de cada categoría.", href: "/weekend?k=debrief&s=", info: function (s) { var l = lastRace(s.id); return l ? [l.name, range(l)] : ["Sin carreras aún", ""]; } }
  };
  function megaHTML(key) {
    var m = MENUS[key];
    var tiles = PS.SERIES.map(function (s) {
      var inf = m.info(s), off = /Off-season|terminada|Sin |próximamente/.test(inf[0]);
      return '<a class="mt' + (off ? ' off' : '') + '" href="' + m.href + s.id + '"><img src="' + PS.carPhoto(s.id) + '" alt="" loading="lazy"><span><b>' + esc(s.name) + '</b><small>' + esc(inf[0]) + '</small></span>' + (inf[1] ? '<em>' + esc(inf[1]) + '</em>' : '') + '</a>';
    }).join("");
    return '<div class="wrap"><div class="mh"><div><h2 class="tt">' + m.t + '</h2><p>' + m.p + '</p></div><button class="x" type="button" data-close aria-label="Cerrar">×</button></div><div class="mgrid">' + tiles + '</div></div>';
  }

  // ---------- cabecera ----------
  var NAV = [["categories", "Categories"], ["schedules", "Schedules"], ["standings", "Standings"], ["drivers", "Drivers"], ["constructors", "Constructors"]];
  var CUR = { categorias: "categories", calendario: "schedules", clasificacion: "standings", pilotos: "drivers", equipos: "constructors" }[page];
  var upcoming = PS.SERIES.map(function (s) { var n = PS.nextRace(s.id); return n ? { s: s, r: n } : null; }).filter(Boolean)
    .sort(function (a, b) { return a.r.start < b.r.start ? -1 : a.r.start > b.r.start ? 1 : 0; });
  var hd = D.createElement("header");
  hd.className = "hd"; hd.id = "hd";
  hd.innerHTML =
    '<div class="util"><div class="wrap"><a class="club" href="/club"><i></i><span>PURSEC · Motorsport Club</span></a>' +
      '<nav aria-label="Utilidades"><a class="store" href="/store">Store</a><a class="lg" href="/planes">Membership</a><a href="/contacto">Contacto</a><a class="lg" href="/aviso-legal">Aviso legal</a><a class="lg" href="/privacidad">Privacidad</a><a class="lg" href="/cookies">Cookies</a><a class="lg" href="/terminos">Términos</a></nav>' +
      '<div class="acc"><a class="me" href="/garage/" aria-label="Mi cuenta" title="Mi cuenta">' + I.user + '</a><a class="join" href="/planes">Join Trackside</a></div></div></div>' +
    '<div class="mainnav"><div class="wrap"><a class="logo" href="/" aria-label="PURSEC, portada"><img src="/img/ps-emblema.webp" alt="" width="44" height="44"><b>PURSEC</b></a>' +
      '<nav class="mn" aria-label="Principal">' + NAV.map(function (n) { return '<button type="button" data-menu="' + n[0] + '" data-hover aria-expanded="false"' + (CUR === n[0] ? ' aria-current="page"' : '') + '>' + n[1] + I.chev + '</button>'; }).join("") +
        '<a class="s4" href="/sector-4"' + (page === "sector4" ? ' aria-current="page"' : '') + '><span class="box"><span class="bars"><i></i><i></i><i></i></span>Sector 4</span></a></nav>' +
      '<button class="burger" type="button" aria-label="Abrir menú" aria-expanded="false"><i></i><i></i><i></i></button></div></div>' +
    '<div class="nextbar"><div class="wrap"><button class="lbl" type="button" data-menu="next" data-hover aria-expanded="false">Next races ' + I.chev.replace('class="chev"', '') + '</button>' +
      '<div class="chips">' + upcoming.slice(0, 6).map(function (u) { return '<a class="chip" href="/proximas?s=' + u.s.id + '"><span class="sb">' + esc(u.s.short) + '</span><b>' + u.r.flag + ' ' + esc(u.r.name.replace(/^(GP de |Ronda de |E-Prix de )/, "")) + '</b><small>' + range(u.r) + '</small></a>'; }).join("") + '</div>' +
      '<div class="clock" aria-label="Hora"><span>My time</span><b id="ck-me">--:--</b><span>UTC</span><b id="ck-utc">--:--</b></div></div></div>';
  body.insertBefore(hd, body.firstChild);

  var mega = D.createElement("div"); mega.className = "mega"; mega.hidden = true; mega.setAttribute("role", "dialog"); body.appendChild(mega);
  var openKey = null, opener = null, closeT = null;
  function placeMega() { var r = hd.getBoundingClientRect(); var top = Math.max(0, r.bottom); mega.style.top = top + "px"; D.documentElement.style.setProperty("--top", top + "px"); }
  function closeMega() {
    clearTimeout(closeT);
    if (!openKey) return;
    D.querySelectorAll('[data-menu][aria-expanded="true"]').forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    mega.classList.remove("on"); openKey = null; body.classList.remove("mega-open");
    setTimeout(function () { if (!openKey) mega.hidden = true; }, reduce ? 0 : 220);
  }
  function openMega(key, btn, toggle) {
    clearTimeout(closeT);
    if (openKey === key) { if (toggle) closeMega(); return; }
    D.querySelectorAll('[data-menu][aria-expanded="true"]').forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    mega.innerHTML = megaHTML(key); mega.setAttribute("aria-label", MENUS[key].t);
    placeMega(); mega.hidden = false; openKey = key; opener = btn; body.classList.add("mega-open");
    if (btn) btn.setAttribute("aria-expanded", "true");
    requestAnimationFrame(function () { mega.classList.add("on"); });
  }
  function laterClose() { clearTimeout(closeT); closeT = setTimeout(closeMega, 260); }
  D.addEventListener("click", function (e) {
    var b = e.target.closest("[data-menu]");
    if (b) { e.preventDefault(); closeSheet(); openMega(b.getAttribute("data-menu"), b, true); return; }
    if (e.target.closest("[data-close]")) { closeMega(); if (opener) opener.focus(); return; }
    if (openKey && !e.target.closest(".mega")) closeMega();
  });
  if (canHover) {
    D.addEventListener("mouseover", function (e) {
      var b = e.target.closest("[data-menu][data-hover]");
      if (b) { openMega(b.getAttribute("data-menu"), b, false); return; }
      if (e.target.closest(".mega")) { clearTimeout(closeT); return; }
    });
    D.addEventListener("mouseout", function (e) {
      var from = e.target.closest("[data-menu][data-hover], .mega"); if (!from) return;
      var to = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest("[data-menu][data-hover], .mega");
      if (!to) laterClose();
    });
  }
  D.addEventListener("keydown", function (e) { if (e.key === "Escape") { if (openKey) { closeMega(); if (opener) opener.focus(); } closeSheet(); } });
  window.addEventListener("resize", function () { if (openKey) placeMega(); });
  window.addEventListener("scroll", function () { if (openKey) placeMega(); }, { passive: true });
  placeMega();

  // menú móvil
  var sheet = D.createElement("div"); sheet.className = "msheet"; sheet.hidden = true;
  sheet.innerHTML = '<div class="top2"><a class="logo" href="/"><img src="/img/ps-emblema.webp" alt="" width="40" height="40"><b>PURSEC</b></a><button class="btn g sm" type="button" data-sclose aria-label="Cerrar menú">×</button></div>' +
    '<nav aria-label="Menú">' + NAV.map(function (n) { return '<button type="button" data-menu="' + n[0] + '">' + n[1] + I.chev + '</button>'; }).join("") +
    '<button type="button" data-menu="next">Next races' + I.chev + '</button><a class="s4m" href="/sector-4">Sector 4 <span>→</span></a></nav>' +
    '<div class="small"><a href="/store">Store</a><a href="/noticias">News</a><a href="/videos">Videos</a><a href="/purple-lap">Purple Lap</a><a href="/planes">Membership</a><a href="/contacto">Contacto</a><a href="/aviso-legal">Aviso legal</a><a href="/privacidad">Privacidad</a><a href="/cookies">Cookies</a><a href="/terminos">Términos</a><a href="/creditos">Créditos de fotos</a></div>';
  body.appendChild(sheet);
  var burger = hd.querySelector(".burger");
  function closeSheet() { if (!sheet.hidden) { sheet.hidden = true; burger.setAttribute("aria-expanded", "false"); body.style.overflow = ""; } }
  burger.addEventListener("click", function () { sheet.hidden = false; burger.setAttribute("aria-expanded", "true"); body.style.overflow = "hidden"; });
  sheet.addEventListener("click", function (e) { if (e.target.closest("[data-sclose]")) closeSheet(); });

  function tick() {
    var now = new Date(), me = D.getElementById("ck-me"), u = D.getElementById("ck-utc");
    if (me) me.textContent = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
    if (u) u.textContent = String(now.getUTCHours()).padStart(2, "0") + ":" + String(now.getUTCMinutes()).padStart(2, "0");
  }
  tick(); setInterval(tick, 20000);

  // ---------- gadgets (todas las páginas menos la portada) ----------
  var SOCIAL = '<div class="social"><a href="#" data-pending aria-label="Instagram de PURSEC">' + I.ig + 'Instagram</a><a href="#" data-pending aria-label="TikTok de PURSEC">' + I.tt + 'TikTok</a><a href="#" data-pending aria-label="YouTube de PURSEC">' + I.yt + 'YouTube</a><a href="#" data-pending aria-label="X de PURSEC">' + I.x + 'X</a><a href="#" data-pending aria-label="Discord del Club">' + I.dc + 'Discord</a></div>';
  function newsCard(n, i) { return '<a class="nc" href="/noticias#n' + i + '">' + photo(img(n.img), n.t) + '<span class="k">' + esc(PS.BY[n.s].short) + ' · ' + esc(n.k) + '</span><h3>' + esc(n.t) + '</h3></a>'; }
  function reel(v, i) { return '<a class="vv" href="/videos#v' + i + '">' + photo(img(v.img), "", "tint") + '<span class="net tag">' + esc(v.n) + '</span><span class="play" aria-hidden="true"></span><h3>' + esc(v.t) + '</h3></a>'; }
  if (page && page !== "home") {
    var g = D.createElement("section"); g.className = "gadgets"; g.setAttribute("aria-label", "Más de PURSEC");
    var sid = PS.BY[Q.get("s")] ? Q.get("s") : null;
    var all = PS.NEWS.map(function (n, i) { return [n, i]; });
    var news = all.filter(function (x) { return x[0].s === sid; }).concat(all.filter(function (x) { return x[0].s !== sid; })).slice(0, 4);
    g.innerHTML = '<div class="wrap"><div class="gg">' +
      '<div class="gcard"><h3>Latest news <a href="/noticias">Ver todo →</a></h3><div class="minis">' + news.map(function (x) { return newsCard(x[0], x[1]); }).join("") + '</div></div>' +
      '<div class="gcard tsell"><img src="' + img("car-wec") + '" alt=""><span class="tag">PURSEC Trackside</span><b>Entiende la carrera antes de que empiece.</b><ul><li>Weekend Brief y Race Card completos</li><li>Debrief técnico de cada carrera</li><li>Sector 4 y vídeos exclusivos</li><li>Sin anuncios</li></ul><a class="btn w" href="/planes">Probar 7 días gratis</a></div>' +
      '<div class="gcard"><h3>Reels & TikToks <a href="/videos">Ver vídeos →</a></h3><div class="reels">' + PS.VIDEOS.map(reel).join("") + '</div></div>' +
      '<div class="gcard"><h3>Accesos rápidos</h3><div class="qlinks">' +
        [["Next races", "/proximas?s=" + (sid || "f1")], ["Schedules", "/calendario?s=" + (sid || "f1")], ["Standings", "/clasificacion?s=" + (sid || "f1")], ["Weekend Brief", "/weekend?k=brief&s=" + (sid || "f1")], ["Purple Lap", "/purple-lap"], ["Store", "/store"]].map(function (l) { return '<a class="ql" href="' + l[1] + '">' + l[0] + '<span>→</span></a>'; }).join("") +
      '</div><h3 style="margin-top:20px">Síguenos</h3>' + SOCIAL + '</div>' +
      '</div></div>';
    var mainEl = D.querySelector("main"); if (mainEl) mainEl.after(g); else body.appendChild(g);
  }

  // ---------- pie ----------
  var ft = D.createElement("footer"); ft.className = "ft";
  ft.innerHTML = '<div class="wrap"><div class="ftg">' +
    '<div class="brandf"><img src="/img/ps-emblema.webp" alt="PURSEC" width="52" height="52"><p>Club de análisis técnico de motorsport. Strategy Brief, Race Card, Debrief y Sector 4 para todas las series.</p>' + SOCIAL + '</div>' +
    '<div><h4>Series</h4>' + PS.SERIES.map(function (s) { return '<a href="/categorias?s=' + s.id + '">' + esc(s.name) + '</a>'; }).join("") + '</div>' +
    '<div><h4>Club</h4><a href="/weekend?k=brief&s=f1">Weekend Brief</a><a href="/weekend?k=racecard&s=f1">Race Card</a><a href="/weekend?k=sprintcard&s=f1">Sprint Card</a><a href="/weekend?k=debrief&s=f1">Debrief</a><a href="/sector-4">Sector 4</a><a href="/purple-lap">Purple Lap</a><a href="/club">Cómo funciona</a></div>' +
    '<div><h4>Contenido</h4><a href="/noticias">News</a><a href="/videos">Videos</a><a href="/proximas?s=f1">Next races</a><a href="/store">Store</a><a href="/planes">Membership</a><a href="/garage/">Mi cuenta</a></div>' +
    '<div><h4>Legal</h4><a href="/contacto">Contacto</a><a href="/aviso-legal">Aviso legal</a><a href="/privacidad">Privacidad</a><a href="/cookies">Cookies</a><a href="/terminos">Términos y condiciones</a><a href="/creditos">Créditos de fotos</a><a href="#" data-cookie-settings>Configuración de cookies</a></div>' +
    '</div><div class="bottom"><span>© 2026 PURSEC</span><span>PURSEC es un proyecto independiente, sin relación con ningún campeonato, equipo o piloto. Fotos de <a href="/creditos">Wikimedia Commons</a> con licencia libre; los nombres de series, equipos y pilotos se usan solo para identificar los hechos deportivos que analizamos.</span></div></div>';
  body.appendChild(ft);
  D.querySelectorAll("[data-pending]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); }); a.title = "Enlace pendiente"; });

  // ---------- cookies ----------
  var CK = "pursec_consent_v1";
  function cookieBanner(force) {
    if (!force && ls(CK)) return;
    var c = D.createElement("div"); c.className = "ck"; c.setAttribute("role", "dialog"); c.setAttribute("aria-label", "Cookies");
    c.innerHTML = '<div><b>Box box: cookies.</b><p>Usamos almacenamiento técnico para que la web funcione (sesión y preferencias). Las cookies de publicidad solo se activan si consientes. Más info en la <a href="/cookies">política de cookies</a>.</p></div>' +
      '<div class="acts"><button class="btn g sm" data-ck="reject">No consentir</button><a class="btn g sm" href="/cookies#gestionar">Gestionar opciones</a><button class="btn p sm" data-ck="accept">Consentir</button></div>';
    body.appendChild(c); body.classList.add("ck-open");
    requestAnimationFrame(function () { requestAnimationFrame(function () { c.classList.add("on"); }); });
    c.addEventListener("click", function (e) {
      var b = e.target.closest("[data-ck]"); if (!b) return;
      ls(CK, JSON.stringify({ v: 1, choice: b.getAttribute("data-ck"), at: new Date().toISOString() }));
      c.classList.remove("on"); body.classList.remove("ck-open"); setTimeout(function () { c.remove(); }, 400);
    });
  }
  D.addEventListener("click", function (e) { if (e.target.closest("[data-cookie-settings]")) { e.preventDefault(); var o = D.querySelector(".ck"); if (o) o.remove(); cookieBanner(true); } });

  // ---------- bienvenida (solo sin sesión) ----------
  function hasSession() { try { for (var i = 0; i < localStorage.length; i++) { if (/^sb-.*-auth-token$/.test(localStorage.key(i))) return true; } } catch (e) {} return false; }
  function welcome() {
    if (hasSession()) return;
    try { if (sessionStorage.getItem("pursec_wl")) return; } catch (e) {}
    var w = D.createElement("aside"); w.className = "wl"; w.setAttribute("aria-label", "Únete al Club");
    w.innerHTML = '<button class="x" type="button" aria-label="Cerrar">×</button><span class="lt" aria-hidden="true"><i></i><i></i><i></i></span>' +
      '<b>¿Primera vuelta por aquí?</b><p>Crea tu cuenta Paddock gratis y sigue todas las series. ¿Ya eres del Club? Entra y sigue donde lo dejaste.</p>' +
      '<div class="acts"><a class="btn p sm" href="/acceso?modo=crear">Crear cuenta</a><a class="btn g sm" href="/acceso">Iniciar sesión</a></div>';
    body.appendChild(w); placeMega();
    setTimeout(function () { w.classList.add("on"); }, reduce ? 0 : 900);
    w.querySelector(".x").addEventListener("click", function () { try { sessionStorage.setItem("pursec_wl", "1"); } catch (e) {} w.classList.remove("on"); setTimeout(function () { w.remove(); }, 450); });
  }
  cookieBanner(false); welcome();

  window.PS.ui = { esc: esc, photo: photo, img: img, range: range, I: I, lastRace: lastRace, nextSprint: nextSprint, newsCard: newsCard, reel: reel, Q: Q, MENUS: MENUS, upcoming: upcoming };
})();
