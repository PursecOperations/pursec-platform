// PURSEC v4.1 — contenido de cada página (según <body data-page>). Todas las imágenes son fotos reales (Wikimedia Commons).
(function () {
  "use strict";
  var PS = window.PS, U = PS.ui, esc = U.esc, D = document, CR = window.PS_CREDITS || {};
  var page = D.body.getAttribute("data-page");
  var main = D.querySelector("main");
  var Q = U.Q;
  var sid = PS.BY[Q.get("s")] ? Q.get("s") : "f1";
  var S = PS.BY[sid];
  function $(h) { main.insertAdjacentHTML("beforeend", h); }
  function tabs(base) { return '<nav class="tabs" aria-label="Categorías">' + PS.SERIES.map(function (s) { return '<a href="' + base + s.id + '"' + (s.id === sid ? ' aria-current="page"' : '') + '>' + esc(s.short) + '</a>'; }).join("") + '</nav>'; }
  function crumb(items) { return '<div class="crumb">' + items.map(function (i) { return i[1] ? '<a href="' + i[1] + '">' + esc(i[0]) + '</a>' : '<span>' + esc(i[0]) + '</span>'; }).join("<span>/</span>") + '</div>'; }
  function badge(g) { return g && g.real ? '<span class="tag real">Datos reales · ' + esc(g.asOf) + '</span>' : ''; }
  function srcLine(g) { return g && g.real ? '<p class="src">Fuente: <a href="' + g.src + '" target="_blank" rel="noopener">' + esc(g.srcName) + '</a>. Puede no estar actualizado al minuto. Fotos y logos: <a href="/creditos">créditos</a>.</p>' : ''; }
  function credit(key) { var c = CR[key]; return c ? 'Foto: ' + esc(c.author || "Wikimedia Commons") + ' · ' + esc(c.license || "") : ''; }
  function keyOf(path) { return (path || "").replace("/img/fotos/", "").replace(".webp", ""); }
  var fmtT = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" });
  var fmtDay = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "short" });
  var fmtM = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric", timeZone: "UTC" });
  function header(t, lede, extra) { return '<section class="ph"><div class="wrap">' + (extra || '') + '<h1 class="tt">' + t + '</h1>' + (lede ? '<p class="lede">' + lede + '</p>' : '') + '</div></section>'; }

  function sidOf(d) { var m = PS.grid("motogp"); return m && m.drivers.indexOf(d) >= 0 ? "motogp" : "f1"; }
  function sidOfT(t) { var m = PS.grid("motogp"); return m && m.teams.indexOf(t) >= 0 ? "motogp" : "f1"; }
  // logo del equipo sobre placa blanca; si no hay logo libre, nombre del equipo en su color
  function logo(t, cls) { var l = PS.teamLogo(sidOfT(t), t); return l ? '<span class="lg logo-plate ' + (cls || "") + '"><img src="' + l + '" alt="' + esc(t.name) + '" loading="lazy"></span>' : '<span class="lg wordmark ' + (cls || "") + '" style="--tc:' + t.color + '">' + esc(t.name) + '</span>'; }
  function driverCard(d, href) {
    var t = d.team;
    return '<a class="dc" style="--tc:' + t.color + '" href="' + href + '">' + (d.number ? '<span class="num">' + d.number + '</span>' : '') +
      '<span class="fn">' + esc(d.first) + '</span><span class="ln">' + esc(d.last) + '</span><span class="tm">' + esc(t.name) + '</span>' +
      '<span class="foot"><span class="meta"><span class="fl" title="' + esc(d.nation) + '">' + d.flag + '</span><span class="pts">P' + (d.pos || "—") + ' · <b>' + (d.pts || 0) + '</b> pts</span></span>' + logo(t) + '</span></a>';
  }
  function teamCard(t, href) {
    return '<a class="dc team" style="--tc:' + t.color + '" href="' + href + '">' + logo(t) + '<span class="num">' + t.pos + '</span>' +
      '<span class="ln">' + esc(t.name) + '</span><span class="tm">' + esc(t.engine || t.full) + '</span>' +
      '<span class="drv">' + t.drivers.map(function (d) { return d.flag + " " + esc(d.name) + (d.number ? " · #" + d.number : ""); }).join("<br>") + '</span>' +
      '<span class="foot"><span class="pts">P' + t.pos + ' · <b>' + t.pts + '</b> pts' + (t.calc ? '*' : '') + '</span></span></a>';
  }
  function avatar(d) { return '<span class="av">' + (d.number ? '#' + d.number : esc((d.name || "").slice(0, 2).toUpperCase())) + '</span>'; }
  function row(d, i, top, href) {
    var c = d.team ? d.team.color : "#8E44DC";
    return '<a class="tr" style="--tc:' + c + '" ' + (href ? 'href="' + href + '"' : '') + '><span class="p">' + d.pos + '</span>' + avatar(d) +
      '<span class="n"><b>' + (d.flag ? d.flag + ' ' : '') + esc(d.name) + '</b><small>' + esc(d.team ? d.team.name : "Sustituto / wildcard") + '</small></span><span class="pt">' + d.pts + '</span><span class="bar" style="width:' + (d.pts / top * 100) + '%"></span></a>';
  }
  function podDriver(d, p, href) { return '<a class="pod p' + p + '" style="--tc:' + d.team.color + '" href="' + href + '"><span class="ps">' + p + '</span>' + logo(d.team) + '<b>' + esc(d.name) + '</b><small>' + esc(d.team.name) + '</small><em>' + d.pts + '</em></a>'; }
  function podTeam(t, p, href) { return '<a class="pod p' + p + '" style="--tc:' + t.color + '" href="' + href + '"><span class="ps">' + p + '</span>' + logo(t) + '<b>' + esc(t.name) + '</b><small>' + t.drivers.map(function (d) { return esc(d.last); }).join(" · ") + '</small><em>' + t.pts + '</em></a>'; }
  // series sin parrilla con fuente todavía: bloque honesto con lo que sí sabemos
  function pending(what) {
    var h = PS.HIGHLIGHT[sid], n = PS.nextRace(sid);
    return '<div class="wrap"><div class="hl"><div><span class="tag">' + esc(S.name) + ' · ' + esc(S.season) + '</span><b style="margin-top:12px">' + esc(h ? h.t : S.tag) + '</b>' +
      (h ? '<p class="src">Fuente: <a href="' + h.src + '" target="_blank" rel="noopener">' + esc(h.srcName) + '</a></p>' : '') +
      '<p style="margin:12px 0 0;color:var(--text)">' + what + ' de ' + esc(S.name) + ' con datos verificados: próximamente. Mientras, tienes el calendario real y la próxima carrera.</p></div>' +
      '<div class="row" style="margin:0"><a class="btn p" href="/calendario?s=' + sid + '">Schedule</a><a class="btn g" href="/proximas?s=' + sid + '">' + (n ? "Next race" : "Temporada") + '</a></div></div>' +
      '<div class="stage" style="margin-top:18px;aspect-ratio:21/8">' + U.photo(PS.carPhoto(sid), S.name) + '<span class="credit">' + credit("car-" + sid) + '</span></div></div>';
  }

  // ======================= PORTADA =======================
  function home() {
    var f1 = PS.grid("f1"), mg = PS.grid("motogp"), N = PS.NEWS;
    var cbtn = function (k, ic, t, s) { return '<button class="cbtn" type="button" data-menu="' + k + '" data-hover aria-expanded="false"><span class="ic">' + U.I[ic] + '</span><span><b>' + t + '</b><small>' + s + '</small></span>' + U.I.chev + '</button>'; };
    $('<section class="clubrow" aria-label="Club"><div class="wrap">' + cbtn("brief", "brief", "Weekend Brief", "Lo que viene, en todas las series") + cbtn("racecard", "card", "Race Card", "La carrera en una tarjeta") + cbtn("sprintcard", "sprint", "Sprint Card", "Las series con sprint") + cbtn("debrief", "debrief", "Debrief", "La última carrera, a fondo") + '</div></section>' +
      '<section class="pillrow" aria-label="Contenido"><div class="wrap"><div class="pillbox">' +
      '<a class="pill" href="/noticias">' + U.I.news + 'News</a><a class="pill" href="/videos">' + U.I.video + 'Videos</a><a class="pill" href="/videos#trackside">' + U.I.lock + 'Trackside Videos</a>' +
      '<a class="pill fan" href="/purple-lap">' + U.I.trophy + 'Purple Lap <span class="soon">Fantasy · soon</span></a></div></div></section>');

    var lead = N[0], quad = [N[1], N[2], N[3], N[4]], side = [N[5], N[6], N[7], N[8]];
    var li = function (n) { return N.indexOf(n); };
    $('<section class="hero"><div class="wrap"><div class="hgrid">' +
      '<a class="lead" href="/noticias#n0">' + U.photo(U.img(lead.img), lead.t) + '<div class="cap"><span class="tagl">' + esc(PS.BY[lead.s].short) + ' · ' + esc(lead.k) + '</span><h1>' + esc(lead.t) + '</h1><p>' + esc(lead.d) + '</p></div></a>' +
      '<div class="quad">' + quad.map(function (q) { return U.newsCard(q, li(q)); }).join("") + '</div>' +
      '<div class="side"><span class="sth">Más noticias</span>' + side.map(function (x) { return '<a class="si" href="/noticias#n' + li(x) + '"><div><span class="k">' + esc(PS.BY[x.s].short) + '</span><h3>' + esc(x.t) + '</h3></div>' + U.photo(U.img(x.img), "") + '</a>'; }).join("") + '</div>' +
      '</div></div></section>');

    $('<div class="wrap"><a class="upsell" href="/planes"><div class="t"><small>PURSEC Trackside</small><strong>Lee la carrera antes que nadie.</strong><span>Brief, Race Card y Debrief de las 9 series · 7 días gratis · 9,99 €/mes</span><span class="btn w">Probar Trackside</span></div>' + U.photo(U.img("car-imsa"), "") + '</a></div>');

    $('<section class="sec band"><div class="wrap"><div class="sh"><h2 class="tt">Next races</h2><div class="ctl"><a href="/proximas?s=f1">Ver sesiones →</a></div></div><div class="ngrid9">' +
      PS.SERIES.map(function (s) {
        var n = PS.nextRace(s.id);
        return '<a class="nx' + (n ? '' : ' off') + '" href="/proximas?s=' + s.id + '"><img src="' + PS.carPhoto(s.id) + '" alt="" loading="lazy"><span class="when">' + (n ? U.range(n) : 'Off-season') + '</span><span class="s">' + esc(s.name) + '</span><b>' + (n ? n.flag + ' ' + esc(n.name) : esc(PS.HIGHLIGHT[s.id] ? PS.HIGHLIGHT[s.id].t : 'Temporada terminada')) + '</b><small>' + (n ? esc(n.circuit) : 'Calendario ' + esc(s.season) + ' completo') + '</small></a>';
      }).join("") + '</div></div></section>');

    $('<section class="sec"><div class="wrap"><div class="sh"><h2 class="tt">Must watch</h2><div class="ctl"><a href="/videos">View all</a><button type="button" data-rail="-1" aria-label="Anterior">‹</button><button type="button" data-rail="1" aria-label="Siguiente">›</button></div></div>' +
      '<div class="rail" id="mw">' + PS.VIDEOS.map(function (v, i) { return '<a class="vc" href="/videos#v' + i + '"><div class="ph-img tint"><img src="' + U.img(v.img) + '" alt="" loading="lazy"><span class="play"></span><span class="dur">' + esc(v.d) + '</span></div><h3>' + esc(v.t) + '</h3></a>'; }).join("") + '</div></div></section>');

    $('<section class="sec band"><div class="wrap"><div class="sh"><h2 class="tt">Standings</h2><div class="ctl"><a href="/clasificacion?s=f1">Todas las series →</a></div></div><div class="stand">' +
      [["f1", f1], ["motogp", mg]].map(function (x) {
        var g = x[1], top = g.dStand[0].pts;
        var pod = [g.dStand[1], g.dStand[0], g.dStand[2]];
        return '<div><div class="h2" style="margin-top:0">' + esc(PS.BY[x[0]].name) + ' ' + badge(g) + '</div><div class="podium">' + pod.map(function (d, i) { return podDriver(d, [2, 1, 3][i], "/pilotos?s=" + x[0] + "&d=" + d.id); }).join("") + '</div>' +
          '<div class="tbl">' + g.dStand.slice(3, 8).map(function (d, i) { return row(d, i, top, "/pilotos?s=" + x[0] + "&d=" + d.id); }).join("") + '</div></div>';
      }).join("") + '</div></div></section>');

    D.querySelectorAll("[data-rail]").forEach(function (b) { b.addEventListener("click", function () { var r = D.getElementById("mw"); r.scrollBy({ left: r.clientWidth * 0.8 * +b.getAttribute("data-rail"), behavior: "smooth" }); }); });
  }

  // ======================= CATEGORÍA =======================
  function category() {
    var g = PS.grid(sid), n = PS.nextRace(sid), l = U.lastRace(sid), h = PS.HIGHLIGHT[sid];
    var total = PS.CALS[sid].length, done = PS.CALS[sid].filter(function (r) { return PS.status(r) === "done"; }).length;
    D.title = S.name + " — PURSEC";
    $('<section class="ph"><div class="wrap">' + crumb([["Categories", null], [S.name, null]]) + tabs("/categorias?s=") +
      '<div class="cat-hero"><div><h1 class="tt">' + esc(S.name) + '</h1><p class="lede">' + esc(S.intro) + '</p><div class="row"><span class="tag">Season ' + esc(S.season) + '</span>' + badge(g) + '</div></div>' +
      '<div class="stage">' + U.photo(PS.carPhoto(sid), S.name) + '<span class="credit">' + credit("car-" + sid) + '</span></div></div>' +
      '<div class="stats">' + S.facts.map(function (f) { return '<div class="stat"><b>' + esc(f[1]) + '</b><small>' + esc(f[0]) + '</small></div>'; }).join("") + '</div>' +
      '<p class="src">Cifras técnicas aproximadas, de referencia.</p></div></section>');
    var pct = Math.round(done / total * 100);
    var lead = g ? '<b>' + esc(g.dStand[0].name) + '</b><span>' + g.dStand[0].pts + ' pts</span>' : '<b>' + esc(h ? h.t : "—") + '</b>' + (h ? '<span><a href="' + h.src + '" target="_blank" rel="noopener">' + esc(h.srcName) + '</a></span>' : '');
    $('<div class="wrap">' +
      '<h2 class="h2">La temporada</h2><div class="wkd">' +
        '<div class="wk"><small>Rondas</small><b>' + done + ' / ' + total + '</b><div style="margin-top:10px;height:6px;border-radius:4px;background:var(--line2)"><div style="height:100%;width:' + pct + '%;border-radius:4px;background:linear-gradient(90deg,var(--green),var(--lila-hi))"></div></div></div>' +
        '<div class="wk"><small>' + (g ? 'Líder' : 'Lo último') + '</small>' + lead + '</div>' +
        (g ? '<div class="wk"><small>Mejor equipo</small><b>' + esc(g.tStand[0].name) + '</b><span>' + g.tStand[0].pts + ' pts</span></div>' : '') +
        '<div class="wk"><small>Próxima</small><b>' + (n ? n.flag + ' ' + esc(n.name) : 'Off-season') + '</b><span>' + (n ? U.range(n) : '') + '</span></div>' +
        '<div class="wk"><small>Última</small><b>' + (l ? l.flag + ' ' + esc(l.name) : '—') + '</b><span>' + (l ? U.range(l) : '') + '</span></div>' +
      '</div>' +
      '<h2 class="h2">Las 3 claves para entenderla</h2><div class="keys">' + S.keys.map(function (k, i) { return '<div class="key"><span class="n">0' + (i + 1) + '</span><b>' + esc(k[0]) + '</b><p>' + esc(k[1]) + '</p></div>'; }).join("") + '</div>' +
      '<h2 class="h2">Cómo se reparten los puntos</h2><div class="ptsviz">' + S.points.slice(0, 10).map(function (p, i) { return '<div><span>' + p + '</span><i style="height:' + (p / S.points[0] * 100) + '%"></i>P' + (i + 1) + '</div>'; }).join("") + '</div>' +
      '<h2 class="h2">Todo sobre ' + esc(S.short) + '</h2><div class="links">' +
        [["Schedule", total + " rondas, todas las fechas", "/calendario?s="], ["Standings", g ? "Pilotos y constructores" : "Próximamente", "/clasificacion?s="], ["Drivers", g ? g.drivers.length + " pilotos en parrilla" : "Próximamente", "/pilotos?s="], ["Constructors", g ? g.teams.length + " equipos" : "Próximamente", "/equipos?s="], ["Next race", n ? n.name : "Off-season", "/proximas?s="], ["Weekend Brief", "La predicción de estrategia", "/weekend?k=brief&s="]]
          .map(function (x) { return '<a class="lk" href="' + x[2] + sid + '"><b>' + x[0] + '</b><small>' + esc(x[1]) + '</small><span class="arr">→</span></a>'; }).join("") + '</div>' +
      (g ? '<h2 class="h2">Top 3 ahora</h2><div class="dgrid">' + g.dStand.slice(0, 3).map(function (d) { return driverCard(d, "/pilotos?s=" + sid + "&d=" + d.id); }).join("") + '</div>' + srcLine(g) : '') +
      '</div>');
  }

  // ======================= CALENDARIO =======================
  function schedule() {
    D.title = "Schedule " + S.short + " — PURSEC";
    var list = PS.CALS[sid], nxt = PS.nextRace(sid);
    var done = list.filter(function (r) { return PS.status(r) === "done"; }).length;
    $(header(esc(S.short) + ' Schedule ' + esc(S.season), list.length + ' rondas · ' + done + ' disputadas · ' + (list.length - done) + ' por correr.', crumb([["Schedules", null], [S.name, "/categorias?s=" + sid]]) + tabs("/calendario?s=")));
    var html = '<div class="wrap"><div class="cal">', lastM = "";
    list.forEach(function (r) {
      var m = fmtM.format(new Date(r.date + "T00:00:00Z"));
      if (m !== lastM) { html += '<div class="month">' + esc(m) + '</div>'; lastM = m; }
      var st = PS.status(r), isNext = nxt && r === nxt;
      var days = Math.round((new Date(r.start + "T00:00:00Z") - new Date(PS.todayISO() + "T00:00:00Z")) / 86400000);
      var cls = st === "done" ? "done" : st === "live" ? "live" : isNext ? "next" : "";
      html += '<a class="crow ' + cls + '" href="/proximas?s=' + sid + '&r=' + r.round + '">' +
        '<div class="c1"><span class="rd">Round ' + r.round + '</span><span class="dt">' + U.range(r) + '</span></div>' +
        '<div class="c2"><b><span class="fl">' + r.flag + '</span>' + esc(r.name) + '</b><small>' + esc(r.circuit) + ' · ' + esc(r.country) + '</small></div>' +
        '<div class="c3">' + (st === "done" ? '<span class="st done">Completed</span>' : st === "live" ? '<span class="st live">Race week</span>' : isNext ? '<span class="st next">Next</span>' : '<span class="st sp">Upcoming</span>') +
          (r.sprint && S.sprint ? '<span class="st sp">Sprint</span>' : '') + '<span class="cd">' + (st === "done" ? "" : days > 0 ? "en " + days + " días" : "esta semana") + '</span></div></a>';
    });
    html += '</div><p class="src">Calendario oficial publicado de cada campeonato (fuentes: web oficial y Wikipedia). Las fechas pueden cambiar.</p></div>';
    $(html);
  }

  // ======================= CLASIFICACIÓN =======================
  function standings() {
    var g = PS.grid(sid);
    D.title = "Standings " + S.short + " — PURSEC";
    $(header(esc(S.short) + ' Standings', '', crumb([["Standings", null], [S.name, "/categorias?s=" + sid]]) + tabs("/clasificacion?s=") + '<div class="row" style="margin:0 0 14px">' + badge(g) + '</div>'));
    if (!g) { $(pending("La clasificación")); return; }
    var top = g.dStand[0].pts || 1, ttop = g.tStand[0].pts || 1;
    var pod = [g.dStand[1], g.dStand[0], g.dStand[2]];
    var dH = '<div><h2 class="h2" style="margin-top:0">Drivers</h2><div class="podium">' + pod.map(function (d, i) { return podDriver(d, [2, 1, 3][i], "/pilotos?s=" + sid + "&d=" + d.id); }).join("") + '</div>' +
      '<div class="tbl">' + g.dStand.map(function (d, i) { return row(d, i, top, d.ghost ? null : "/pilotos?s=" + sid + "&d=" + d.id); }).join("") + '</div></div>';
    var tpod = [g.tStand[1], g.tStand[0], g.tStand[2]];
    var tH = '<div><h2 class="h2" style="margin-top:0">Constructors' + (g.tStand[0].calc ? ' <span class="tag">* suma de sus dos pilotos</span>' : '') + '</h2><div class="podium">' + tpod.map(function (t, i) { return podTeam(t, [2, 1, 3][i], "/equipos?s=" + sid + "&t=" + t.id); }).join("") + '</div>' +
      '<div class="tbl">' + g.tStand.map(function (t) { return '<a class="tr" style="--tc:' + t.color + '" href="/equipos?s=' + sid + '&t=' + t.id + '"><span class="p">' + t.pos + '</span><span class="av t">' + esc(t.name.slice(0, 2).toUpperCase()) + '</span><span class="n"><b>' + esc(t.name) + '</b><small>' + t.drivers.map(function (d) { return esc(d.last); }).join(" · ") + '</small></span><span class="pt">' + t.pts + '</span><span class="bar" style="width:' + (t.pts / ttop * 100) + '%"></span></a>'; }).join("") + '</div></div>';
    $('<div class="wrap"><div class="stand">' + dH + tH + '</div>' + srcLine(g) + '</div>');
  }

  // ======================= PILOTOS =======================
  function drivers() {
    var g = PS.grid(sid), did = Q.get("d");
    var d = g && did && g.drivers.filter(function (x) { return x.id === did; })[0];
    if (d) return driverProfile(g, d);
    D.title = S.short + " Drivers — PURSEC";
    $(header(esc(S.short) + ' Drivers ' + esc(S.season), g ? 'Todos los pilotos de la temporada. Toca uno para ver su ficha.' : '', crumb([["Drivers", null], [S.name, "/categorias?s=" + sid]]) + tabs("/pilotos?s=") + '<div class="row" style="margin:0 0 14px">' + badge(g) + '</div>'));
    if (!g) { $(pending("La parrilla")); return; }
    var order = g.tStand.slice();
    $('<div class="wrap"><div class="dgrid">' + [].concat.apply([], order.map(function (t) { return t.drivers; })).map(function (x) { return driverCard(x, "/pilotos?s=" + sid + "&d=" + x.id); }).join("") + '</div>' + srcLine(g) + '</div>');
  }
  function driverProfile(g, d) {
    D.title = d.name + " — PURSEC";
    var t = d.team, mate = t.drivers.filter(function (x) { return x !== d; }), lead = g.dStand[0];
    $('<section class="ph"><div class="wrap">' + crumb([["Drivers", "/pilotos?s=" + sid], [S.short, "/pilotos?s=" + sid], [d.name, null]]) + '<div class="row" style="margin:0 0 16px">' + badge(g) + '</div>' +
      '<div class="prof"><div class="card" style="--tc:' + t.color + '">' + (d.number ? '<span class="num">' + d.number + '</span>' : '') +
        '<span class="fn">' + esc(d.first) + '</span><span class="ln">' + esc(d.last) + '</span><span class="tm">' + esc(t.full || t.name) + '</span>' +
        '<div class="bottom"><span class="fl">' + d.flag + '</span>' + logo(t) + '</div></div>' +
      '<div><h2 class="h2" style="margin-top:0">Temporada ' + esc(S.season) + '</h2><div class="kv">' +
        '<div><small>Posición</small><b>P' + d.pos + '</b></div><div><small>Puntos</small><b>' + d.pts + '</b></div>' +
        '<div><small>A líder</small><b>' + (d === lead ? "Líder" : "−" + d.gap) + '</b></div>' +
        '<div><small>Última carrera</small><b>' + (d.lastPos ? (d.lastPos === "DNF" ? "DNF" : "P" + d.lastPos) : "Ver debrief") + '</b></div>' +
      '</div><h2 class="h2">Datos profesionales</h2><div class="kv">' +
        '<div><small>Equipo</small><b>' + esc(t.name) + '</b></div><div><small>Dorsal</small><b>' + (d.number ? "#" + d.number : "—") + '</b></div>' +
        '<div><small>Nacionalidad</small><b>' + d.flag + ' ' + esc(d.nation) + '</b></div><div><small>Compañero</small><b>' + mate.map(function (m) { return esc(m.name); }).join(", ") + '</b></div>' +
        '<div class="w"><small>' + (sid === "motogp" ? "Moto" : "Motor") + '</small><b>' + esc(t.engine || "—") + '</b></div>' +
      '</div></div></div>' +
      '<h2 class="h2">Puntos frente al top 10</h2><div class="tbl">' + g.dStand.slice(0, 10).map(function (x, i) { var h = row(x, i, lead.pts, x.ghost ? null : "/pilotos?s=" + sid + "&d=" + x.id); return x === d ? h.replace('<a class="tr" style="', '<a class="tr" style="background:rgba(168,85,247,.2);') : h; }).join("") + '</div>' +
      srcLine(g) + '<div class="row"><a class="btn g sm" href="/pilotos?s=' + sid + '">← Todos los pilotos</a><a class="btn g sm" href="/equipos?s=' + sid + '&t=' + t.id + '">Ver ' + esc(t.name) + '</a></div></div></section>');
  }

  // ======================= EQUIPOS =======================
  function teams() {
    var g = PS.grid(sid), tid = Q.get("t");
    var t = g && tid && g.teams.filter(function (x) { return x.id === tid; })[0];
    if (t) return teamProfile(g, t);
    D.title = S.short + " Constructors — PURSEC";
    $(header(esc(S.short) + ' Constructors ' + esc(S.season), g ? g.teams.length + ' equipos. Toca uno para ver su ficha y su temporada.' : '', crumb([["Constructors", null], [S.name, "/categorias?s=" + sid]]) + tabs("/equipos?s=") + '<div class="row" style="margin:0 0 14px">' + badge(g) + '</div>'));
    if (!g) { $(pending("Los equipos")); return; }
    $('<div class="wrap"><div class="dgrid">' + g.tStand.map(function (x) { return teamCard(x, "/equipos?s=" + sid + "&t=" + x.id); }).join("") + '</div>' + srcLine(g) + '</div>');
  }
  function teamProfile(g, t) {
    D.title = t.name + " — PURSEC";
    $('<section class="ph"><div class="wrap">' + crumb([["Constructors", "/equipos?s=" + sid], [S.short, "/equipos?s=" + sid], [t.name, null]]) + '<div class="row" style="margin:0 0 16px">' + badge(g) + '</div>' +
      '<div class="prof"><div class="card" style="--tc:' + t.color + '"><span class="num">' + t.pos + '</span>' +
        '<span class="ln">' + esc(t.name) + '</span><span class="tm">' + esc(t.full) + '</span><div class="bottom"><span class="fl">' + t.drivers.map(function (d) { return d.flag; }).join(" ") + '</span>' + logo(t) + '</div></div>' +
      '<div><h2 class="h2" style="margin-top:0">Temporada ' + esc(S.season) + '</h2><div class="kv">' +
        '<div><small>Posición</small><b>P' + t.pos + '</b></div><div><small>Puntos</small><b>' + t.pts + (t.calc ? '*' : '') + '</b></div>' +
      '</div><h2 class="h2">Ficha</h2><div class="kv">' +
        '<div class="w"><small>Nombre completo</small><b>' + esc(t.full) + '</b></div>' +
        '<div><small>Sede</small><b>' + esc(t.base || "—") + '</b></div><div><small>' + (sid === "motogp" ? "Moto" : "Motor") + '</small><b>' + esc(t.engine || "—") + '</b></div>' +
      '</div></div></div>' + (t.calc ? '<p class="src">* Suma de los puntos de sus dos pilotos fijos, calculada por PURSEC; no es la clasificación oficial de equipos.</p>' : '') +
      '<h2 class="h2">Pilotos</h2><div class="dgrid">' + t.drivers.map(function (d) { return driverCard(d, "/pilotos?s=" + sid + "&d=" + d.id); }).join("") + '</div>' + srcLine(g) +
      '<div class="row"><a class="btn g sm" href="/equipos?s=' + sid + '">← Todos los equipos</a></div></div></section>');
  }

  // ======================= PRÓXIMAS CARRERAS =======================
  function next() {
    var rq = parseInt(Q.get("r"), 10);
    var r = rq ? PS.CALS[sid][rq - 1] : PS.nextRace(sid);
    D.title = "Next race " + S.short + " — PURSEC";
    $('<section class="ph"><div class="wrap">' + crumb([["Next races", null], [S.name, "/categorias?s=" + sid]]) + tabs("/proximas?s=") + '</div></section>');
    if (!r) { $(pending("La temporada ha terminado. El calendario nuevo")); return; }
    var ss = PS.sessions(r), now = Date.now(), race = ss[ss.length - 1];
    $('<div class="wrap"><div class="nx-hero"><div><span class="tag">Round ' + r.round + ' · ' + U.range(r) + '</span><h1 class="tt">' + r.flag + ' ' + esc(r.name) + '</h1>' +
      '<p class="lede">' + esc(r.circuit) + ' · ' + esc(r.country) + '</p><div class="count" id="cd" aria-live="polite"></div><p class="src">Cuenta atrás a la ' + esc(race.name) + ' (horario orientativo).</p></div>' +
      '<div class="stage">' + U.photo(PS.carPhoto(sid), S.name) + '<span class="credit">' + credit("car-" + sid) + '</span></div></div>' +
      '<h2 class="h2">Sesiones <span class="tag">Horario orientativo · pendiente del oficial</span></h2><div class="sess">' +
      ss.map(function (x) {
        var past = x.utc.getTime() + 3600000 < now, isRace = /Race$|^Race|Feature/.test(x.name);
        return '<div class="se' + (isRace ? ' race' : '') + (past ? ' past' : '') + '"><span class="bar"></span><span class="dy">' + esc(fmtDay.format(x.utc)) + '</span><b>' + esc(x.name) + '</b>' +
          '<div class="tm"><div><small>Tu hora</small><span>' + fmtT.format(x.utc) + '</span></div><div><small>Circuito</small><span>' + String(x.trackHour).padStart(2, "0") + ':' + x.trackMin + '</span></div></div></div>';
      }).join("") + '</div>' +
      '<h2 class="h2">Prepara el fin de semana</h2><div class="links">' +
        [["Weekend Brief", "La predicción de estrategia", "/weekend?k=brief&s="], ["Race Card", "Los umbrales clave", "/weekend?k=racecard&s="], ["Standings", "Cómo llegan", "/clasificacion?s="], ["Schedule", "Toda la temporada", "/calendario?s="]].map(function (l) { return '<a class="lk" href="' + l[2] + sid + '"><b>' + l[0] + '</b><small>' + l[1] + '</small><span class="arr">→</span></a>'; }).join("") +
      '</div><h2 class="h2">Otras categorías</h2><div class="ngrid9">' + PS.SERIES.filter(function (s) { return s.id !== sid; }).map(function (s) { var n = PS.nextRace(s.id); return '<a class="nx' + (n ? '' : ' off') + '" href="/proximas?s=' + s.id + '"><img src="' + PS.carPhoto(s.id) + '" alt="" loading="lazy"><span class="when">' + (n ? U.range(n) : 'Off-season') + '</span><span class="s">' + esc(s.name) + '</span><b>' + (n ? n.flag + ' ' + esc(n.name) : 'Temporada terminada') + '</b></a>'; }).join("") + '</div></div>');
    var box = D.getElementById("cd");
    function tick() {
      var ms = race.utc.getTime() - Date.now();
      if (ms <= 0) { box.innerHTML = '<div><b>✓</b><small>Done</small></div>'; return; }
      var d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60;
      box.innerHTML = [[d, "Días"], [h, "Horas"], [m, "Min"]].map(function (x) { return '<div><b>' + String(x[0]).padStart(2, "0") + '</b><small>' + x[1] + '</small></div>'; }).join("");
    }
    tick(); setInterval(tick, 30000);
  }

  // ======================= WEEKEND =======================
  function weekend() {
    var k = Q.get("k") || "brief";
    var NAMES = { brief: "Weekend Brief", racecard: "Race Card", sprintcard: "Sprint Card", debrief: "Debrief" };
    if (!NAMES[k]) k = "brief";
    var r = k === "debrief" ? U.lastRace(sid) : k === "sprintcard" ? (S.sprint ? U.nextSprint(sid) : null) : PS.nextRace(sid);
    D.title = NAMES[k] + " " + S.short + " — PURSEC";
    $(header(NAMES[k], r ? r.flag + ' ' + esc(r.name) + ' · ' + U.range(r) : (k === "sprintcard" ? esc(S.name) + (S.sprint ? " no tiene sprint próximo." : " no usa formato sprint.") : "Off-season"),
      crumb([[NAMES[k], null], [S.name, "/categorias?s=" + sid]]) + '<nav class="tabs">' + Object.keys(NAMES).map(function (x) { return '<a href="/weekend?k=' + x + '&s=' + sid + '"' + (x === k ? ' aria-current="page"' : '') + '>' + NAMES[x] + '</a>'; }).join("") + '</nav>' + tabs("/weekend?k=" + k + "&s=")));
    if (!r) return;
    var R = PS.rng(k + sid + r.round);
    var strategies = [["1 stop · M–H", [["M", 42], ["H", 58]]], ["2 stops · S–M–H", [["S", 22], ["M", 38], ["H", 40]]], ["1 stop · H–M", [["H", 55], ["M", 45]]]];
    var probs = [48 + Math.round(R() * 20)]; probs.push(Math.round((100 - probs[0]) * .7)); probs.push(100 - probs[0] - probs[1]);
    $('<div class="wrap"><div class="row" style="margin:0 0 16px"><span class="tag">Ejemplo de formato · el contenido real se publica con cada carrera</span></div><div class="wgrid"><div class="box"><h3>Estrategias previstas</h3><div class="strat">' + strategies.map(function (s, i) { return '<div class="sr2"><span>' + s[0] + '</span><span class="lane">' + s[1].map(function (st) { return '<i class="' + st[0] + '" style="width:' + st[1] + '%"></i>'; }).join("") + '</span><b>' + probs[i] + '%</b></div>'; }).join("") + '</div><p class="src">S, M y H: compuestos blando, medio y duro.</p></div>' +
      '<div class="rc"><span class="tag">' + NAMES[k] + ' · R' + r.round + '</span><h3 style="margin:12px 0 0;font:700 24px/1.1 var(--f-title);color:var(--head)">' + esc(r.circuit) + '</h3><div class="row3">' +
        '<div class="cell"><small>Pit loss</small><b>' + (18 + Math.round(R() * 8)) + ' s</b></div><div class="cell"><small>Undercut</small><b>' + (0.8 + R() * 1.4).toFixed(1) + ' s</b></div><div class="cell"><small>Safety Car</small><b>' + (30 + Math.round(R() * 60)) + '%</b></div>' +
        '<div class="cell"><small>Overtake</small><b>' + ["Low", "Mid", "High"][Math.floor(R() * 3)] + '</b></div><div class="cell"><small>Track temp</small><b>' + (28 + Math.round(R() * 20)) + '°</b></div><div class="cell"><small>Deg</small><b>' + ["Low", "Mid", "High"][Math.floor(R() * 3)] + '</b></div>' +
      '</div></div></div>' +
      '<h2 class="h2">Análisis completo <span class="tag">Trackside</span></h2><div class="locked"><div class="blur"><div class="wgrid"><div class="box"><h3>Ventanas de parada</h3><p>Vueltas 14–19 para el Undercut con M, 22–27 si el Safety Car llega antes de la vuelta 12. El tráfico en el sector 2 penaliza ~0,4 s por vuelta…</p></div><div class="box"><h3>Umbrales</h3><p>Si el gap al coche de delante cae por debajo de 1,1 s en la vuelta 15, parada inmediata. Si el delta de deg supera 0,08 s/vuelta, el plan pasa a 2 stops…</p></div></div></div>' +
      '<div class="gate"><span class="lockic">' + U.I.lock + '</span><b>Solo para Trackside</b><p>Ventanas exactas, umbrales y el razonamiento completo. Prueba 7 días gratis.</p><div class="row" style="justify-content:center"><a class="btn p" href="/planes">Probar Trackside</a><a class="btn g" href="/acceso">Ya soy miembro</a></div></div></div></div>');
  }

  // ======================= NOTICIAS =======================
  function news() {
    var f = Q.get("s");
    D.title = "News — PURSEC";
    var list = PS.NEWS.map(function (n, i) { return [n, i]; }).filter(function (x) { return !f || x[0].s === f; });
    $(header('Latest News', 'Lo más importante de las 9 series, resumido por PURSEC y con enlace a la fuente original.', crumb([["News", null]]) + '<nav class="tabs"><a href="/noticias"' + (!f ? ' aria-current="page"' : '') + '>Todas</a>' + PS.SERIES.map(function (s) { return '<a href="/noticias?s=' + s.id + '"' + (f === s.id ? ' aria-current="page"' : '') + '>' + esc(s.short) + '</a>'; }).join("") + '</nav>'));
    if (!list.length) { $('<div class="wrap"><div class="box"><h3>Sin noticias de ' + esc(PS.BY[f].name) + ' aún</h3><p>Vuelve pronto.</p></div></div>'); return; }
    function srcA(n) { return '<a href="' + n.src + '" target="_blank" rel="noopener">' + esc(n.srcName) + '</a>'; }
    var a = list[0], rest = list.slice(1);
    $('<div class="wrap"><div class="nfeat"><div class="lead" id="n' + a[1] + '">' + U.photo(U.img(a[0].img), a[0].t) + '<div class="cap"><span class="tagl">' + esc(PS.BY[a[0].s].short) + ' · ' + esc(a[0].k) + '</span><h2>' + esc(a[0].t) + '</h2><p>' + esc(a[0].d) + '</p><p class="src">Fuente: ' + srcA(a[0]) + '</p></div></div>' +
      '<div class="stackc">' + rest.slice(0, 2).map(function (x) { return '<div class="nn" id="n' + x[1] + '">' + U.photo(U.img(x[0].img), x[0].t) + '<span class="k">' + esc(PS.BY[x[0].s].short) + ' · ' + esc(x[0].k) + ' · ' + srcA(x[0]) + '</span><h3>' + esc(x[0].t) + '</h3></div>'; }).join("") + '</div></div>' +
      (rest.length > 2 ? '<h2 class="h2">Más noticias</h2><div class="ngrid">' + rest.slice(2).map(function (x) { return '<div class="nn" id="n' + x[1] + '">' + U.photo(U.img(x[0].img), x[0].t) + '<span class="k">' + esc(PS.BY[x[0].s].short) + ' · ' + esc(x[0].k) + ' · ' + srcA(x[0]) + '</span><h3>' + esc(x[0].t) + '</h3><p>' + esc(x[0].d) + '</p></div>'; }).join("") + '</div>' : '') +
      '<p class="src">Titulares y resúmenes propios de PURSEC a partir de la fuente enlazada. Fotos: <a href="/creditos">créditos</a>.</p></div>');
  }

  // ======================= VÍDEOS =======================
  function videos() {
    D.title = "Videos — PURSEC";
    $(header('Videos', 'Lo que publicamos en redes y, para Trackside, vídeos exclusivos de la web.', crumb([["Videos", null]])));
    var ex = [["Debrief en vídeo: Sepang, vuelta a vuelta", "news-f1-a"], ["Sector 4: rehacemos el Undercut de Bakú", "car-f2"], ["Race Card explicada: Singapur", "news-f1-b"], ["Fuji: cómo remontó Toyota desde P8", "news-wec"], ["Le Mans de noche: la estrategia de stints", "car-wec"], ["MotoGP: el neumático delantero en Mandalika", "news-motogp"]];
    $('<div class="wrap"><h2 class="h2" style="margin-top:0">From our socials <span class="tag">Reels · TikTok · Shorts · próximamente</span></h2><div class="vgrid">' + PS.VIDEOS.map(U.reel).join("") + '</div>' +
      '<h2 class="h2" id="trackside">Trackside Exclusives <span class="tag">Solo en la web</span></h2><div class="locked"><div class="blur"><div class="dgrid">' +
      ex.map(function (e, i) { return '<a class="vc" href="#trackside"><div class="ph-img" style="aspect-ratio:16/9;border-radius:12px"><img src="' + U.img(e[1]) + '" alt="" loading="lazy"><span class="play"></span><span class="dur">' + (8 + i * 3) + ':' + String(10 + i * 7).slice(0, 2) + '</span></div><h3>' + esc(e[0]) + '</h3></a>'; }).join("") + '</div></div>' +
      '<div class="gate"><span class="lockic">' + U.I.lock + '</span><b>Vídeos exclusivos para Trackside</b><p>Debriefs en vídeo, Sector 4 explicado y análisis largos que no publicamos en redes.</p><div class="row" style="justify-content:center"><a class="btn p" href="/planes">Desbloquear con Trackside</a><a class="btn g" href="/acceso">Ya soy miembro</a></div></div></div></div>');
  }

  // ======================= CRÉDITOS =======================
  function credits() {
    $(header('Créditos', 'Todas las fotos y logos de la web vienen de Wikimedia Commons, con licencia libre o de dominio público. Los logos pertenecen a sus equipos y se usan solo para identificarlos.', crumb([["Legal", null]])));
    var keys = Object.keys(CR).sort();
    $('<div class="wrap"><div class="credits">' + keys.map(function (k) { var c = CR[k]; return '<a href="' + c.page + '" target="_blank" rel="noopener">' + (k.indexOf("logo-") === 0 ? '<img src="/img/logos/' + k.slice(5) + '.webp" alt="" loading="lazy">' : '<img class="ph" src="/img/fotos/' + k + '.webp" alt="" loading="lazy">') + '<span><b>' + esc(c.file.replace(/\.(jpe?g|png)$/i, "")) + '</b>' + esc(c.author || "Autor en Commons") + ' · ' + esc(c.license || "") + '</span></a>'; }).join("") + '</div></div>');
  }

  var R = { home: home, categorias: category, calendario: schedule, clasificacion: standings, pilotos: drivers, equipos: teams, proximas: next, weekend: weekend, noticias: news, videos: videos, creditos: credits };
  if (R[page]) R[page]();

  if (window.PURSEC && window.PURSEC.auth) {
    window.PURSEC.auth.session().then(function (s) { if (!s) return; return window.PURSEC.auth.profile().then(function (p) { D.documentElement.setAttribute("data-tier", window.PURSEC.auth.tierOf(p)); }); }).catch(function () {});
  }
})();
