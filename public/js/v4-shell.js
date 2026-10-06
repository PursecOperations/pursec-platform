// PURSEC v4 — armazón de todas las páginas: cabecera con desplegables, barra "Next races", gadgets, pie, cookies y bienvenida.
(function () {
  "use strict";
  var PS = window.PS;
  var D = document, body = D.body, page = body.getAttribute("data-page") || "";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function esc(s) { var d = D.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var Q = new URLSearchParams(location.search);

  // ---------- iconos ----------
  var I = {
    chev: '<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arr: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
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

  // ---------- visuales propios ----------
  function hueOf(sid) { return (PS.BY[sid] && PS.BY[sid].hue) || 275; }
  function vis(sid, opts) {
    opts = opts || {}; var s = PS.BY[sid] || PS.SERIES[0];
    return '<div class="vis" style="--h:' + (opts.h || hueOf(sid)) + ';--x:' + (opts.x || 70) + '%">' + '<span class="speed"></span>' +
      (opts.big !== false ? '<span class="big">' + esc(opts.label || s.short) + '</span>' : '') + PS.car(s.type, opts.accent) + (opts.extra || "") + '</div>';
  }
  function bust(color) {
    return '<svg class="bust" viewBox="0 0 200 240" preserveAspectRatio="xMidYMax meet" aria-hidden="true">' +
      '<defs><linearGradient id="bg' + color.slice(1) + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EADDFF"/><stop offset="1" stop-color="' + color + '"/></linearGradient></defs>' +
      '<path d="M18 240C20 190 46 168 86 160H114C154 168 180 190 182 240Z" fill="#0F0A1C"/>' +
      '<path d="M18 240C20 190 46 168 86 160L100 196L114 160C154 168 180 190 182 240Z" fill="' + color + '" opacity=".85"/>' +
      '<path d="M60 200L100 196L140 200" stroke="#EADDFF" stroke-width="4" opacity=".6" fill="none"/>' +
      '<rect x="86" y="140" width="28" height="26" rx="8" fill="#1A1228"/>' +
      '<path d="M48 92C48 52 72 30 104 30C138 30 156 56 156 92C156 120 146 148 112 152H84C60 150 48 124 48 92Z" fill="url(#bg' + color.slice(1) + ')"/>' +
      '<path d="M62 86C70 72 96 66 120 68C138 70 150 78 154 88V104C140 108 100 110 70 106C62 104 60 96 62 86Z" fill="#0B0715"/>' +
      '<path d="M76 80C96 74 124 74 146 84" stroke="#C9A7FF" stroke-width="3" opacity=".7" fill="none" stroke-linecap="round"/>' +
      '<path d="M60 126C80 134 130 136 150 120" stroke="#0B0715" stroke-width="5" fill="none" opacity=".5"/></svg>';
  }
  function trackSvg(seed) {
    var R = PS.rng("trk" + seed), pts = [], n = 9;
    for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2, r = 22 + R() * 14; pts.push([60 + Math.cos(a) * r * 1.6, 30 + Math.sin(a) * r * 0.7]); }
    var d = "M" + pts.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" L") + " Z";
    return '<svg class="track" viewBox="0 0 120 60" aria-hidden="true"><path d="' + d + '" fill="none" stroke="#C9A7FF" stroke-width="3" stroke-linejoin="round"/></svg>';
  }
  var fmtD = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", timeZone: "UTC" });
  function range(r) {
    var a = new Date(r.start + "T00:00:00Z"), b = new Date(r.date + "T00:00:00Z");
    var m = function (d) { return fmtD.formatToParts(d).find(function (p) { return p.type === "month"; }).value.replace(".", "").toUpperCase(); };
    var da = String(a.getUTCDate()).padStart(2, "0"), db = String(b.getUTCDate()).padStart(2, "0");
    return r.start === r.date ? da + " " + m(a) : (m(a) === m(b) ? da + " – " + db + " " + m(b) : da + " " + m(a) + " – " + db + " " + m(b));
  }

  // ---------- desplegables ----------
  var MENUS = {
    categories: { t: "Categories", p: "Elige una serie: introducción visual, cómo funciona y todo lo que hay dentro.", href: "/categorias?s=", info: function (s) { var g = PS.grid(s.id); return [s.short === s.name ? "Season " + s.season : s.tag, g.real ? "Live data" : ""]; } },
    schedules: { t: "Schedules", p: "El calendario completo de cada categoría.", href: "/calendario?s=", info: function (s) { var n = PS.nextRace(s.id); return [n ? "Next: " + n.name : "Temporada terminada", n ? range(n) : ""]; } },
    standings: { t: "Standings", p: "Clasificaciones generales de pilotos y constructores.", href: "/clasificacion?s=", info: function (s) { var g = PS.grid(s.id); return ["Líder: " + g.dStand[0].name, g.dStand[0].pts + " pts"]; } },
    drivers: { t: "Drivers", p: "Todos los pilotos de cada parrilla, con sus datos y su temporada.", href: "/pilotos?s=", info: function (s) { return [PS.grid(s.id).drivers.length + " pilotos", ""]; } },
    constructors: { t: "Constructors", p: "Los equipos de cada categoría: ficha técnica y temporada.", href: "/equipos?s=", info: function (s) { return [s.teams + " equipos", ""]; } },
    next: { t: "Next races", p: "La próxima carrera de cada categoría con todas sus sesiones y horarios.", href: "/proximas?s=", info: function (s) { var n = PS.nextRace(s.id); return [n ? n.flag + " " + n.name : "Off-season", n ? range(n) : ""]; } },
    brief: { t: "Weekend Brief", p: "Las predicciones de estrategia de las carreras que vienen.", href: "/weekend?k=brief&s=", info: function (s) { var n = PS.nextRace(s.id); return [n ? n.name : "Off-season", n ? range(n) : ""]; } },
    racecard: { t: "Race Card", p: "La tarjeta de carrera de cada próxima cita, con los umbrales clave.", href: "/weekend?k=racecard&s=", info: function (s) { var n = PS.nextRace(s.id); return [n ? n.name : "Off-season", n ? range(n) : ""]; } },
    sprintcard: { t: "Sprint Card", p: "Solo para las categorías con carrera sprint.", href: "/weekend?k=sprintcard&s=", only: function (s) { return s.sprint; }, info: function (s) { var n = nextSprint(s.id); return [n ? n.name : "Sin sprint próximo", n ? range(n) : ""]; } },
    debrief: { t: "Debrief", p: "El análisis técnico de la última carrera de cada categoría.", href: "/weekend?k=debrief&s=", info: function (s) { var l = lastRace(s.id); return [l ? l.name : "Sin carreras aún", l ? range(l) : ""]; } }
  };
  function nextSprint(sid) { var t = PS.todayISO(); return PS.CALS[sid].filter(function (r) { return r.date >= t && (r.sprint || sid === "motogp" || sid === "f2" || sid === "f3"); })[0] || null; }
  function lastRace(sid) { var d = PS.CALS[sid].filter(function (r) { return PS.status(r) === "done"; }); return d[d.length - 1] || null; }
  function megaHTML(key) {
    var m = MENUS[key];
    var cards = PS.SERIES.filter(function (s) { return !m.only || m.only(s); }).map(function (s) {
      var inf = m.info(s), off = /Off-season|terminada|Sin /.test(inf[0]);
      return '<a class="scard' + (off ? ' off' : '') + '" style="--h:' + s.hue + '" href="' + m.href + s.id + '">' + PS.car(s.type) +
        '<b>' + esc(s.short === s.name ? s.name : s.short) + '</b><small>' + esc(s.short === s.name ? s.tag : s.name) + '</small>' +
        '<span class="info"><span>' + esc(inf[0]) + '</span>' + (inf[1] ? '<em>' + esc(inf[1]) + '</em>' : '') + '</span></a>';
    }).join("");
    return '<div class="wrap"><div class="mh"><div><h2>' + m.t + '</h2><p>' + m.p + '</p></div><button class="x" type="button" data-close aria-label="Cerrar">×</button></div><div class="sgrid">' + cards + '</div></div>';
  }

  // ---------- cabecera ----------
  var f1n = PS.nextRace("f1");
  var NAV = [["categories", "Categories"], ["schedules", "Schedules"], ["standings", "Standings"], ["drivers", "Drivers"], ["constructors", "Constructors"]];
  var CUR = { categorias: "categories", calendario: "schedules", clasificacion: "standings", pilotos: "drivers", equipos: "constructors" }[page];
  var hd = D.createElement("header");
  hd.className = "hd"; hd.id = "hd";
  hd.innerHTML =
    '<div class="util"><div class="wrap"><a class="club" href="/club"><i></i><span>PURSEC · Motorsport Club</span></a>' +
      '<nav aria-label="Utilidades"><a class="store" href="/store">Store</a><a class="lg" href="/planes">Membership</a><a href="/contacto">Contacto</a><a class="lg" href="/aviso-legal">Aviso legal</a><a class="lg" href="/privacidad">Privacidad</a><a class="lg" href="/cookies">Cookies</a><a class="lg" href="/terminos">Términos</a></nav>' +
      '<div class="acc"><a class="me" href="/garage/" aria-label="Mi cuenta" title="Mi cuenta">' + I.user + '</a><a class="join" href="/planes">Join Trackside</a></div></div></div>' +
    '<div class="mainnav"><div class="wrap"><a class="logo" href="/" aria-label="PURSEC, portada"><img src="/img/ps-emblema.webp" alt="" width="44" height="44"><b>PURSEC</b></a>' +
      '<nav class="mn" aria-label="Principal">' + NAV.map(function (n) { return '<button type="button" data-menu="' + n[0] + '" aria-expanded="false"' + (CUR === n[0] ? ' aria-current="page"' : '') + '>' + n[1] + I.chev + '</button>'; }).join("") +
        '<a class="s4" href="/sector-4"' + (page === "sector4" ? ' aria-current="page"' : '') + '><span class="box"><span class="bars"><i></i><i></i><i></i></span>Sector 4</span></a></nav>' +
      '<button class="burger" type="button" aria-label="Abrir menú" aria-expanded="false"><i></i><i></i><i></i></button></div></div>' +
    '<div class="nextbar"><div class="wrap"><span class="lbl">Next races</span><button class="nr" type="button" data-menu="next" aria-expanded="false">' +
      (f1n ? '<span class="meta"><b>R' + f1n.round + '</b> · ' + range(f1n) + ' · F1</span><span class="rn">' + f1n.flag + ' ' + esc(f1n.name.replace("GP de ", "")) + I.arr + '</span>' : '<span class="rn">Ver todas' + I.arr + '</span>') +
      '</button><div class="clock" aria-label="Hora"><span class="me">My time</span><b id="ck-me">--:--</b><span>Track time</span><b id="ck-tr">--:--</b></div></div></div>';
  body.insertBefore(hd, body.firstChild);

  var mega = D.createElement("div"); mega.className = "mega"; mega.hidden = true; mega.setAttribute("role", "dialog"); body.appendChild(mega);
  var openKey = null, opener = null;
  function placeMega() { var r = hd.getBoundingClientRect(); var top = Math.max(0, r.bottom); mega.style.top = top + "px"; D.documentElement.style.setProperty("--top", top + "px"); }
  function closeMega() {
    if (!openKey) return;
    D.querySelectorAll('[data-menu][aria-expanded="true"]').forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    mega.classList.remove("on"); openKey = null; body.classList.remove("mega-open");
    setTimeout(function () { if (!openKey) mega.hidden = true; }, reduce ? 0 : 250);
  }
  function openMega(key, btn) {
    if (openKey === key) { closeMega(); return; }
    D.querySelectorAll('[data-menu][aria-expanded="true"]').forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    mega.innerHTML = megaHTML(key); mega.setAttribute("aria-label", MENUS[key].t);
    placeMega(); mega.hidden = false; openKey = key; opener = btn; body.classList.add("mega-open");
    if (btn) btn.setAttribute("aria-expanded", "true");
    requestAnimationFrame(function () { mega.classList.add("on"); });
    var first = mega.querySelector(".scard"); if (first && btn && btn.matches(":focus-visible")) first.focus();
  }
  D.addEventListener("click", function (e) {
    var b = e.target.closest("[data-menu]");
    if (b) { e.preventDefault(); closeSheet(); openMega(b.getAttribute("data-menu"), b); return; }
    if (e.target.closest("[data-close]")) { closeMega(); if (opener) opener.focus(); return; }
    if (openKey && !e.target.closest(".mega")) closeMega();
  });
  D.addEventListener("keydown", function (e) { if (e.key === "Escape") { if (openKey) { closeMega(); if (opener) opener.focus(); } closeSheet(); } });
  window.addEventListener("resize", function () { if (openKey) placeMega(); });
  window.addEventListener("scroll", function () { if (openKey) placeMega(); }, { passive: true });
  placeMega();

  // menú móvil
  var sheet = D.createElement("div"); sheet.className = "msheet"; sheet.hidden = true;
  sheet.innerHTML = '<div class="top2"><a class="logo" href="/"><img src="/img/ps-emblema.webp" alt="" width="40" height="40"><b>PURSEC</b></a><button class="x btn g sm" type="button" data-sclose aria-label="Cerrar menú">×</button></div>' +
    '<nav aria-label="Menú">' + NAV.map(function (n) { return '<button type="button" data-menu="' + n[0] + '">' + n[1] + I.chev + '</button>'; }).join("") +
    '<button type="button" data-menu="next">Next races' + I.chev + '</button><a class="s4m" href="/sector-4">Sector 4 <span>→</span></a></nav>' +
    '<div class="small"><a href="/store">Store</a><a href="/noticias">News</a><a href="/videos">Videos</a><a href="/purple-lap">Purple Lap</a><a href="/planes">Membership</a><a href="/contacto">Contacto</a><a href="/aviso-legal">Aviso legal</a><a href="/privacidad">Privacidad</a><a href="/cookies">Cookies</a><a href="/terminos">Términos</a></div>';
  body.appendChild(sheet);
  var burger = hd.querySelector(".burger");
  function closeSheet() { if (!sheet.hidden) { sheet.hidden = true; burger.setAttribute("aria-expanded", "false"); body.style.overflow = ""; } }
  burger.addEventListener("click", function () { sheet.hidden = false; burger.setAttribute("aria-expanded", "true"); body.style.overflow = "hidden"; });
  sheet.addEventListener("click", function (e) { if (e.target.closest("[data-sclose]")) closeSheet(); });

  // relojes (hora del usuario y del circuito de la próxima F1)
  function tick() {
    var now = new Date();
    var me = D.getElementById("ck-me"), tr = D.getElementById("ck-tr");
    if (me) me.textContent = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
    if (tr && f1n) { var t = new Date(now.getTime() + f1n.tz * 3600000); tr.textContent = String(t.getUTCHours()).padStart(2, "0") + ":" + String(t.getUTCMinutes()).padStart(2, "0"); }
  }
  tick(); setInterval(tick, 20000);

  // ---------- gadgets (todas las páginas menos la portada) ----------
  var SOCIAL = '<div class="social"><a href="#" data-pending="instagram" aria-label="Instagram de PURSEC">' + I.ig + 'Instagram</a><a href="#" data-pending="tiktok" aria-label="TikTok de PURSEC">' + I.tt + 'TikTok</a><a href="#" data-pending="youtube" aria-label="YouTube de PURSEC">' + I.yt + 'YouTube</a><a href="#" data-pending="x" aria-label="X de PURSEC">' + I.x + 'X</a><a href="#" data-pending="discord" aria-label="Discord del Club">' + I.dc + 'Discord</a></div>';
  function newsCard(n, i) { return '<a class="nc" href="/noticias#n' + i + '">' + vis(n.s, { x: 30 + (i * 17) % 60 }) + '<span class="k">' + esc(PS.BY[n.s].short) + ' · ' + esc(n.k) + '</span><h3>' + esc(n.t) + '</h3></a>'; }
  function reel(v, i) { return '<a class="vv" href="/videos#v' + i + '">' + vis(v.s, { big: false, x: 50 }) + '<span class="net demo">' + esc(v.n) + '</span><span class="play" aria-hidden="true"></span><h3>' + esc(v.t) + '</h3></a>'; }
  if (page && page !== "home") {
    var g = D.createElement("section"); g.className = "gadgets"; g.setAttribute("aria-label", "Más de PURSEC");
    var sid = PS.BY[Q.get("s")] ? Q.get("s") : null;
    var news = PS.NEWS.map(function (n, i) { return [n, i]; }).filter(function (x) { return !sid || x[0].s === sid; });
    if (news.length < 4) news = news.concat(PS.NEWS.map(function (n, i) { return [n, i]; }).filter(function (x) { return x[0].s !== sid; })).slice(0, 4); else news = news.slice(0, 4);
    g.innerHTML = '<div class="wrap"><div class="gg">' +
      '<div class="gcard"><h3>Latest news <a href="/noticias">Ver todo →</a></h3><div class="minis">' + news.map(function (x) { return newsCard(x[0], x[1]); }).join("") + '</div></div>' +
      '<div class="gcard tsell">' + PS.car("open") + '<span class="demo">Trackside</span><b>Entiende la carrera antes de que empiece.</b><ul><li>Weekend Brief y Race Card completos</li><li>Debrief técnico de cada carrera</li><li>Sector 4 y vídeos exclusivos</li><li>Sin anuncios</li></ul><a class="btn p" href="/planes">Probar 7 días gratis</a></div>' +
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
    '<div><h4>Series</h4>' + PS.SERIES.slice(0, 9).map(function (s) { return '<a href="/categorias?s=' + s.id + '">' + esc(s.name) + '</a>'; }).join("") + '</div>' +
    '<div><h4>Club</h4><a href="/weekend?k=brief&s=f1">Weekend Brief</a><a href="/weekend?k=racecard&s=f1">Race Card</a><a href="/weekend?k=sprintcard&s=f1">Sprint Card</a><a href="/weekend?k=debrief&s=f1">Debrief</a><a href="/sector-4">Sector 4</a><a href="/purple-lap">Purple Lap</a><a href="/club">Cómo funciona</a></div>' +
    '<div><h4>Contenido</h4><a href="/noticias">News</a><a href="/videos">Videos</a><a href="/proximas?s=f1">Next races</a><a href="/store">Store</a><a href="/planes">Membership</a><a href="/garage/">Mi cuenta</a></div>' +
    '<div><h4>Legal</h4><a href="/contacto">Contacto</a><a href="/aviso-legal">Aviso legal</a><a href="/privacidad">Privacidad</a><a href="/cookies">Cookies</a><a href="/terminos">Términos y condiciones</a><a href="#" data-cookie-settings>Configuración de cookies</a></div>' +
    '</div><div class="bottom"><span>© 2026 PURSEC</span><span>PURSEC es un proyecto independiente, sin relación con ningún campeonato, equipo o piloto. Los nombres de las series se usan solo para identificar los hechos deportivos que analizamos.</span></div></div>';
  body.appendChild(ft);
  D.querySelectorAll('[data-pending]').forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); }); a.title = "Enlace pendiente"; });

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

  // ---------- bienvenida: crear cuenta o entrar (solo sin sesión) ----------
  function hasSession() { try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/^sb-.*-auth-token$/.test(k)) return true; } } catch (e) {} return false; }
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

  window.PS.ui = { esc: esc, vis: vis, bust: bust, range: range, trackSvg: trackSvg, I: I, lastRace: lastRace, nextSprint: nextSprint, newsCard: newsCard, reel: reel, Q: Q, MENUS: MENUS };
})();
