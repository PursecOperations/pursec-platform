// PURSEC v4 — contenido de cada página (según <body data-page>).
(function () {
  "use strict";
  var PS = window.PS, U = PS.ui, esc = U.esc, D = document;
  var page = D.body.getAttribute("data-page");
  var main = D.querySelector("main");
  var Q = U.Q;
  var sid = PS.BY[Q.get("s")] ? Q.get("s") : "f1";
  var S = PS.BY[sid];
  function $(h) { main.insertAdjacentHTML("beforeend", h); }
  function seriesTabs(base) {
    return '<nav class="tabs" aria-label="Categorías">' + PS.SERIES.map(function (s) { return '<a href="' + base + s.id + '"' + (s.id === sid ? ' aria-current="page"' : '') + '>' + esc(s.short) + '</a>'; }).join("") + '</nav>';
  }
  function crumb(items) { return '<div class="crumb">' + items.map(function (i) { return i[1] ? '<a href="' + i[1] + '">' + esc(i[0]) + '</a>' : '<span>' + esc(i[0]) + '</span>'; }).join("<span>/</span>") + '</div>'; }
  function badge(g) { return g.real ? '<span class="demo real">Datos reales · ' + esc(g.asOf) + '</span>' : '<span class="demo">Demo · equipos y pilotos de ejemplo</span>'; }
  function srcLine(g) { return g.real ? '<p class="crumb" style="margin-top:12px;text-transform:none;letter-spacing:0">Fuente: <a href="' + g.src + '" target="_blank" rel="noopener">' + esc(g.srcName) + '</a>. Puede no estar actualizado al minuto.</p>' : ''; }
  function calBadge() { return sid === "f1" ? '<span class="demo real">Calendario oficial publicado</span>' : '<span class="demo">Calendario demo · pendiente de verificar</span>'; }
  var fmtT = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" });
  var fmtDay = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "short" });
  var fmtM = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric", timeZone: "UTC" });

  function driverCard(d, href) {
    var t = d.team || { name: "—", color: "#3B2A5C" };
    return '<a class="dc" style="--tc:' + t.color + '" href="' + href + '">' + U.bust(t.color) +
      '<span class="fn">' + esc(d.first) + '</span><span class="ln">' + esc(d.last) + '</span><span class="tm">' + esc(t.name) + '</span>' +
      (d.number ? '<span class="num">' + d.number + '</span>' : '') + '<span class="fl" title="' + esc(d.nation) + '">' + d.flag + '</span>' +
      '<span class="pts">P' + (d.pos || "—") + ' · ' + (d.pts || 0) + ' pts</span></a>';
  }
  function teamCard(t, href, s) {
    return '<a class="dc team" style="--tc:' + t.color + '" href="' + href + '">' + PS.car(s.type, "#EADDFF") +
      '<span class="ln">' + esc(t.name) + '</span><span class="tm">' + esc(t.full !== t.name ? t.full : (t.base || "")) + '</span>' +
      '<span class="num">P' + t.pos + '</span><span class="drv">' + t.drivers.map(function (d) { return d.flag + " " + esc(d.last); }).join("<br>") + '</span>' +
      '<span class="pts">' + t.pts + ' pts' + (t.calc ? '*' : '') + '</span></a>';
  }

  // ======================= PORTADA =======================
  function home() {
    var f1 = PS.grid("f1"), mg = PS.grid("motogp");
    var n1 = PS.nextRace("f1");
    var lead = { s: "f1", t: "5 claves para leer el GP de Singapur antes de las luces", k: "Weekend Brief" };
    var quad = [
      { s: "f1", t: "Verstappen gana en Sepang y Antonelli amplía su ventaja a 84 puntos", k: "Debrief", h: "/weekend?k=debrief&s=f1" },
      { s: "motogp", t: "Martin llega a Mandalika como líder; Marc Marquez a 12 puntos tras Austria", k: "Standings", h: "/clasificacion?s=motogp" },
      { s: "f1", t: "Marina Bay estrena Sprint: qué cambia en la estrategia", k: "Sprint Card", h: "/weekend?k=sprintcard&s=f1" },
      { s: "imsa", t: "Petit Le Mans: 10 horas en Road Atlanta para cerrar el año", k: "Preview", h: "/proximas?s=imsa" }
    ];
    var side = [
      ["Russell, DNF en Sepang: así queda la pelea por el subcampeonato", "/clasificacion?s=f1", "f1"],
      ["Mercedes suma 556 puntos: el dominio de 2026 en un gráfico", "/clasificacion?s=f1", "f1"],
      ["Acosta, cuarto en MotoGP tras su primera victoria", "/pilotos?s=motogp", "motogp"],
      ["Todas las sesiones de la semana, a tu hora", "/proximas?s=f1", "gt3"]
    ];
    $('<section class="clubrow" aria-label="Club"><div class="wrap">' +
      '<button class="cbtn" type="button" data-menu="brief" aria-expanded="false"><span class="ic">' + U.I.brief + '</span><span><b>Weekend Brief</b><small>Lo que viene, por series</small></span>' + '<svg class="chev" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>' +
      '<button class="cbtn" type="button" data-menu="racecard" aria-expanded="false"><span class="ic">' + U.I.card + '</span><span><b>Race Card</b><small>La carrera en una tarjeta</small></span><svg class="chev" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>' +
      '<button class="cbtn" type="button" data-menu="sprintcard" aria-expanded="false"><span class="ic">' + U.I.sprint + '</span><span><b>Sprint Card</b><small>Solo series con sprint</small></span><svg class="chev" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>' +
      '<button class="cbtn" type="button" data-menu="debrief" aria-expanded="false"><span class="ic">' + U.I.debrief + '</span><span><b>Debrief</b><small>La última carrera, a fondo</small></span><svg class="chev" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>' +
      '</div></section>' +
      '<section class="pillrow" aria-label="Contenido"><div class="wrap"><div class="pillbox">' +
      '<a class="pill" href="/noticias">' + U.I.news + 'News</a><a class="pill" href="/videos">' + U.I.video + 'Videos</a><a class="pill" href="/videos#trackside">' + U.I.lock + 'Trackside Videos</a>' +
      '<a class="pill fan" href="/purple-lap">' + U.I.trophy + 'Purple Lap <span class="soon">Fantasy · soon</span></a></div></div></section>');

    $('<section class="hero"><div class="wrap"><div class="hgrid">' +
      '<a class="lead" href="/weekend?k=brief&s=f1"><div class="vis" style="--h:275;--x:50%"><span class="speed"></span></div>' +
      '<div class="gumw" aria-hidden="true">' + [0, 1, 2, 3, 4, 5].map(function (i) { return '<img src="/img/portada/gum-' + i + '.webp" alt="" width="200" height="200">'; }).join("") + '</div>' +
      '<div class="cap"><span class="tagl">Trackside</span><h1>' + esc(lead.t) + '</h1></div></a>' +
      '<div class="quad">' + quad.map(function (q, i) { return '<a class="nc" href="' + q.h + '">' + U.vis(q.s, { x: 20 + i * 20 }) + '<span class="k">' + esc(PS.BY[q.s].short) + ' · ' + esc(q.k) + '</span><h3>' + esc(q.t) + '</h3></a>'; }).join("") + '</div>' +
      '<div class="side">' + side.map(function (x) { return '<a class="si" href="' + x[1] + '"><h3>' + esc(x[0]) + '</h3>' + U.vis(x[2], { big: false }) + '</a>'; }).join("") + '</div>' +
      '</div></div></section>');

    $('<div class="wrap"><a class="upsell" href="/planes"><div class="t"><small>PURSEC Trackside</small><strong>Lee la carrera<br>antes que nadie</strong><span style="color:var(--text);font-size:14px">7 días gratis en el plan mensual · 9,99 €/mes</span><span class="btn p sm">Probar Trackside</span></div>' + U.vis("f1", { label: "P1", x: 40 }) + '</a></div>');

    $('<section class="sec"><div class="wrap"><div class="sh"><h2>Must watch</h2><div class="ctl"><a href="/videos">View all</a><button type="button" data-rail="-1" aria-label="Anterior">‹</button><button type="button" data-rail="1" aria-label="Siguiente">›</button></div></div>' +
      '<div class="rail" id="mw">' + PS.VIDEOS.map(function (v, i) { return '<a class="vc" href="/videos#v' + i + '"><div class="vis" style="--h:' + (PS.BY[v.s].hue) + ';--x:' + (30 + i * 9) + '%"><span class="speed"></span><span class="big">' + esc(PS.BY[v.s].short) + '</span>' + PS.car(PS.BY[v.s].type) + '<span class="play"></span><span class="dur">' + esc(v.d) + '</span></div><h3>' + esc(v.t) + '</h3></a>'; }).join("") + '</div></div></section>');

    var np = n1 ? '<b>' + esc(n1.name) + '</b> · ' + U.range(n1) : '';
    $('<section class="sec dark"><div class="wrap"><div class="sh"><h2>Editor’s picks</h2></div><div class="picks">' +
      '<a class="pk wide" href="/proximas?s=f1">' + U.vis("f1", { label: "SGP", x: 30 }) + '<h3>Next up: ' + np + '</h3></a>' +
      '<a class="pk" href="/pilotos?s=f1&d=' + f1.dStand[0].id + '">' + '<div class="vis" style="--h:170">' + '<span class="speed"></span>' + U.bust(f1.dStand[0].team.color) + '</div><h3>' + esc(f1.dStand[0].name) + ' lidera con ' + f1.dStand[0].pts + ' puntos tras 16 rondas</h3></a>' +
      '<a class="pk" href="/pilotos?s=motogp&d=' + mg.dStand[0].id + '">' + '<div class="vis" style="--h:350">' + '<span class="speed"></span>' + U.bust(mg.dStand[0].team.color) + '</div><h3>' + esc(mg.dStand[0].name) + ', líder de MotoGP: ' + mg.dStand[0].pts + ' puntos</h3></a>' +
      '</div></div></section>');

    $('<section class="sec"><div class="wrap"><div class="sh"><h2>Standings</h2><div class="ctl"><a href="/clasificacion?s=f1">Ver todo</a></div></div><div class="stand">' +
      [["f1", f1], ["motogp", mg]].map(function (x) {
        return '<div><div class="h2" style="margin-top:0">' + esc(PS.BY[x[0]].name) + ' ' + badge(x[1]) + '</div><div class="tbl">' + x[1].dStand.slice(0, 5).map(function (d) {
          return '<a class="tr" style="--tc:' + (d.team ? d.team.color : "#3B2A5C") + '" href="/pilotos?s=' + x[0] + '&d=' + d.id + '"><span class="p">' + d.pos + '</span><span class="n"><i></i><b>' + esc(d.name) + '</b><small>' + esc(d.team ? d.team.name : "") + '</small></span><span class="pt">' + d.pts + '</span><span class="bar" style="width:' + (d.pts / x[1].dStand[0].pts * 100) + '%"></span></a>';
        }).join("") + '</div></div>';
      }).join("") + '</div></div></section>');

    D.querySelectorAll("[data-rail]").forEach(function (b) { b.addEventListener("click", function () { var r = D.getElementById("mw"); r.scrollBy({ left: r.clientWidth * 0.8 * +b.getAttribute("data-rail"), behavior: "smooth" }); }); });
  }

  // ======================= CATEGORÍA =======================
  function category() {
    var g = PS.grid(sid), n = PS.nextRace(sid), l = U.lastRace(sid);
    var total = PS.CALS[sid].length, done = PS.CALS[sid].filter(function (r) { return PS.status(r) === "done"; }).length;
    D.title = S.name + " — PURSEC";
    $('<section class="ph"><div class="wrap">' + crumb([["Categories", null], [S.name, null]]) + seriesTabs("/categorias?s=") +
      '<div class="cat-hero"><div><h1>' + esc(S.name) + '</h1><p>' + esc(S.intro) + '</p><div class="row"><span class="demo">Season ' + esc(S.season) + '</span>' + badge(g) + '</div></div>' +
      '<div class="stage">' + U.vis(sid, { x: 60 }) + '</div></div>' +
      '<div class="stats">' + S.facts.map(function (f) { return '<div class="stat"><b>' + esc(f[1]) + '</b><small>' + esc(f[0]) + '</small></div>'; }).join("") + '</div>' +
      '<p class="crumb" style="margin-top:10px;text-transform:none;letter-spacing:0">Cifras aproximadas y de referencia.</p></div></section>');

    $('<main-x></main-x>');
    var seasonPct = Math.round(done / total * 100);
    $('<div class="wrap">' +
      '<h2 class="h2">La temporada</h2><div class="wkd">' +
        '<div class="wk"><small>Rondas</small><b>' + done + ' / ' + total + '</b><div style="margin-top:10px;height:6px;border-radius:4px;background:var(--line2)"><div style="height:100%;width:' + seasonPct + '%;border-radius:4px;background:linear-gradient(90deg,var(--green),var(--lila))"></div></div></div>' +
        '<div class="wk"><small>Líder</small><b>' + esc(g.dStand[0].name) + '</b><span style="color:var(--lila2);font-weight:800">' + g.dStand[0].pts + ' pts</span></div>' +
        '<div class="wk"><small>Mejor equipo</small><b>' + esc(g.tStand[0].name) + '</b><span style="color:var(--lila2);font-weight:800">' + g.tStand[0].pts + ' pts</span></div>' +
        '<div class="wk"><small>Próxima</small><b>' + (n ? n.flag + ' ' + esc(n.name) : 'Off-season') + '</b><span style="color:var(--lila2);font-weight:800">' + (n ? U.range(n) : '') + '</span></div>' +
        '<div class="wk"><small>Última</small><b>' + (l ? l.flag + ' ' + esc(l.name) : '—') + '</b></div>' +
      '</div>' +
      '<h2 class="h2">Las 3 claves para entenderla</h2><div class="keys">' + S.keys.map(function (k, i) { return '<div class="key"><span class="n">0' + (i + 1) + '</span><b>' + esc(k[0]) + '</b><p>' + esc(k[1]) + '</p></div>'; }).join("") + '</div>' +
      '<h2 class="h2">Cómo se reparten los puntos</h2><div class="ptsviz">' + S.points.slice(0, 10).map(function (p, i) { return '<div><span>' + p + '</span><i style="height:' + (p / S.points[0] * 100) + '%"></i>P' + (i + 1) + '</div>'; }).join("") + '</div>' +
      '<h2 class="h2">Un fin de semana tipo</h2><div class="wkd">' + (n ? PS.sessions(n) : PS.sessions(PS.CALS[sid][0])).map(function (x) { return '<div class="wk"><small>' + ["Viernes", "Sábado", "Domingo", "Lunes"][x.day] + '</small><b>' + esc(x.name) + '</b></div>'; }).join("") + '</div>' +
      '<h2 class="h2">Todo sobre ' + esc(S.short) + '</h2><div class="links">' +
        [["Schedule", "Calendario completo, ronda a ronda", "/calendario?s="], ["Standings", "Pilotos y constructores", "/clasificacion?s="], ["Drivers", g.drivers.length + " pilotos en parrilla", "/pilotos?s="], ["Constructors", g.teams.length + " equipos", "/equipos?s="], ["Next race", n ? n.name : "Off-season", "/proximas?s="], ["Weekend Brief", "La predicción de estrategia", "/weekend?k=brief&s="]]
          .map(function (l) { return '<a class="lk" href="' + l[2] + sid + '"><b>' + l[0] + '</b><small>' + esc(l[1]) + '</small><span class="arr">→</span></a>'; }).join("") +
      '</div>' +
      '<h2 class="h2">Top 3 ahora</h2><div class="dgrid">' + g.dStand.slice(0, 3).map(function (d) { return driverCard(d, "/pilotos?s=" + sid + "&d=" + d.id); }).join("") + '</div>' + srcLine(g) +
      '</div>');
    var mx = main.querySelector("main-x"); if (mx) mx.remove();
  }

  // ======================= CALENDARIO =======================
  function schedule() {
    D.title = "Schedule " + S.short + " — PURSEC";
    var list = PS.CALS[sid], nxt = PS.nextRace(sid);
    var done = list.filter(function (r) { return PS.status(r) === "done"; }).length;
    $('<section class="ph"><div class="wrap">' + crumb([["Schedules", null], [S.name, "/categorias?s=" + sid]]) + seriesTabs("/calendario?s=") +
      '<h1>' + esc(S.short) + ' Schedule ' + esc(S.season) + '</h1><p>' + list.length + ' rondas · ' + done + ' disputadas · ' + (list.length - done) + ' por correr.</p><div class="row">' + calBadge() + '</div></div></section>');
    var html = '<div class="wrap"><div class="cal">', lastM = "";
    list.forEach(function (r) {
      var m = fmtM.format(new Date(r.date + "T00:00:00Z"));
      if (m !== lastM) { html += '<div class="month">' + esc(m) + '</div>'; lastM = m; }
      var st = PS.status(r), isNext = nxt && r === nxt;
      var days = Math.round((new Date(r.start + "T00:00:00Z") - new Date(PS.todayISO() + "T00:00:00Z")) / 86400000);
      var cls = st === "done" ? "done" : st === "live" ? "live" : isNext ? "next" : "";
      var d = new Date(r.date + "T00:00:00Z");
      html += '<a class="crow ' + cls + '" href="/proximas?s=' + sid + '&r=' + r.round + '">' + U.trackSvg(sid + r.round) +
        '<div class="c1"><span class="rd">Round ' + r.round + '</span><span class="dt">' + U.range(r) + '</span></div>' +
        '<div class="c2"><b><span class="fl">' + r.flag + '</span>' + esc(r.name) + '</b><small>' + esc(r.circuit) + ' · ' + esc(r.country) + '</small></div>' +
        '<div class="c3">' + (st === "done" ? '<span class="st done">Completed</span>' : st === "live" ? '<span class="st live">Race week</span>' : isNext ? '<span class="st next">Next</span>' : '<span class="st sp">Upcoming</span>') +
          ((r.sprint && S.sprint) ? '<span class="st sp">Sprint</span>' : '') +
          '<span class="cd">' + (st === "done" ? "" : days > 0 ? "en " + days + " días" : "esta semana") + '</span></div></a>';
      void d;
    });
    html += '</div>' + (sid === "f1" ? '<p class="crumb" style="margin-top:14px;text-transform:none;letter-spacing:0">Fuente: <a href="' + PS.SOURCE_F1 + '" target="_blank" rel="noopener">calendario oficial publicado</a>. Las fechas pueden cambiar.</p>' : '') + '</div>';
    $(html);
  }

  // ======================= CLASIFICACIÓN =======================
  function standings() {
    var g = PS.grid(sid);
    D.title = "Standings " + S.short + " — PURSEC";
    $('<section class="ph"><div class="wrap">' + crumb([["Standings", null], [S.name, "/categorias?s=" + sid]]) + seriesTabs("/clasificacion?s=") +
      '<h1>' + esc(S.short) + ' Standings</h1><div class="row">' + badge(g) + '</div></div></section>');
    function podium(arr, nameF, subF, href) {
      var o = [arr[1], arr[0], arr[2]];
      return '<div class="podium">' + o.map(function (x, i) { var p = [2, 1, 3][i]; var c = x.team ? x.team.color : x.color; return '<a class="pod p' + p + '" style="--tc:' + c + '" href="' + href(x) + '"><span class="ps">' + p + '</span><b>' + esc(nameF(x)) + '</b><small>' + esc(subF(x)) + '</small><em>' + x.pts + '</em></a>'; }).join("") + '</div>';
    }
    var top = g.dStand[0].pts || 1;
    var dHtml = '<div><h2 class="h2" style="margin-top:0">Drivers</h2>' + podium(g.dStand, function (d) { return d.name; }, function (d) { return d.team ? d.team.name : ""; }, function (d) { return d.ghost ? "#" : "/pilotos?s=" + sid + "&d=" + d.id; }) +
      '<div class="tbl">' + g.dStand.map(function (d) {
        var c = d.team ? d.team.color : "#3B2A5C";
        return '<a class="tr" style="--tc:' + c + '" ' + (d.ghost ? '' : 'href="/pilotos?s=' + sid + '&d=' + d.id + '"') + '><span class="p">' + d.pos + '</span><span class="n"><i></i>' + (d.flag ? '<span>' + d.flag + '</span>' : '') + '<b>' + esc(d.name) + '</b><small>' + esc(d.team ? d.team.name : "Sustituto / wildcard") + '</small></span><span class="pt">' + d.pts + '</span><span class="bar" style="width:' + (d.pts / top * 100) + '%"></span></a>';
      }).join("") + '</div></div>';
    var ttop = g.tStand[0].pts || 1;
    var tHtml = '<div><h2 class="h2" style="margin-top:0">Constructors' + (g.tStand[0].calc ? ' <span class="demo">* suma de sus pilotos fijos</span>' : '') + '</h2>' + podium(g.tStand, function (t) { return t.name; }, function (t) { return t.drivers.map(function (d) { return d.last; }).join(" · "); }, function (t) { return "/equipos?s=" + sid + "&t=" + t.id; }) +
      '<div class="tbl">' + g.tStand.map(function (t) {
        return '<a class="tr" style="--tc:' + t.color + '" href="/equipos?s=' + sid + '&t=' + t.id + '"><span class="p">' + t.pos + '</span><span class="n"><i></i><b>' + esc(t.name) + '</b><small>' + t.drivers.map(function (d) { return esc(d.last); }).join(" · ") + '</small></span><span class="pt">' + t.pts + '</span><span class="bar" style="width:' + (t.pts / ttop * 100) + '%"></span></a>';
      }).join("") + '</div></div>';
    $('<div class="wrap"><div class="stand">' + dHtml + tHtml + '</div>' + srcLine(g) + '</div>');
  }

  // ======================= PILOTOS =======================
  function drivers() {
    var g = PS.grid(sid), did = Q.get("d");
    var d = did && g.drivers.filter(function (x) { return x.id === did; })[0];
    if (d) return driverProfile(g, d);
    D.title = S.short + " Drivers — PURSEC";
    $('<section class="ph"><div class="wrap">' + crumb([["Drivers", null], [S.name, "/categorias?s=" + sid]]) + seriesTabs("/pilotos?s=") +
      '<h1>' + esc(S.short) + ' Drivers ' + esc(S.season) + '</h1><p>Encuentra a todos los pilotos de la temporada ' + esc(S.season) + '. Toca uno para ver su ficha.</p><div class="row">' + badge(g) + '</div></div></section>');
    var order = g.teams.slice().sort(function (a, b) { return a.pos - b.pos; });
    $('<div class="wrap"><div class="dgrid">' + [].concat.apply([], order.map(function (t) { return t.drivers; })).map(function (x) { return driverCard(x, "/pilotos?s=" + sid + "&d=" + x.id); }).join("") + '</div>' + srcLine(g) + '</div>');
  }
  function driverProfile(g, d) {
    D.title = d.name + " — PURSEC";
    var t = d.team, mate = t.drivers.filter(function (x) { return x !== d; });
    var lead = g.dStand[0];
    $('<section class="ph"><div class="wrap">' + crumb([["Drivers", "/pilotos?s=" + sid], [S.short, "/pilotos?s=" + sid], [d.name, null]]) + '<div class="row" style="margin:0 0 14px">' + badge(g) + '</div>' +
      '<div class="prof"><div class="card" style="--tc:' + t.color + '">' + U.bust(t.color) + '<span class="fn">' + esc(d.first) + '</span><span class="ln">' + esc(d.last) + '</span>' +
        '<span class="tm" style="display:block;margin-top:8px;font-weight:800">' + esc(t.full || t.name) + '</span>' + (d.number ? '<div class="num">' + d.number + '</div>' : '') +
        '<div style="position:absolute;left:26px;bottom:26px;font-size:30px">' + d.flag + '</div></div>' +
      '<div><h2 class="h2" style="margin-top:0">Temporada ' + esc(S.season) + '</h2><div class="kv">' +
        '<div><small>Posición</small><b>P' + d.pos + '</b></div><div><small>Puntos</small><b>' + d.pts + '</b></div>' +
        '<div><small>A líder</small><b>' + (d === lead ? "Líder" : "−" + d.gap) + '</b></div>' +
        '<div><small>Última carrera</small><b>' + (d.lastPos ? (d.lastPos === "DNF" ? "DNF" : "P" + d.lastPos) : (g.real ? "[PENDIENTE]" : "P" + d.best)) + '</b></div>' +
        (g.real ? '' : '<div><small>Victorias</small><b>' + d.wins + '</b></div><div><small>Podios</small><b>' + d.podiums + '</b></div>') +
      '</div><h2 class="h2">Datos profesionales</h2><div class="kv">' +
        '<div><small>Equipo</small><b>' + esc(t.name) + '</b></div><div><small>Dorsal</small><b>' + (d.number || "—") + '</b></div>' +
        '<div><small>Nacionalidad</small><b>' + d.flag + ' ' + esc(d.nation) + '</b></div><div><small>Compañero</small><b>' + mate.map(function (m) { return esc(m.name); }).join(", ") + '</b></div>' +
        (g.real ? '<div class="w"><small>Carrera deportiva (títulos, victorias, poles)</small><b>[PENDIENTE] · se carga con fuente</b></div>'
          : '<div><small>Edad</small><b>' + d.age + '</b></div><div><small>Temporadas</small><b>' + d.seasons + '</b></div><div><small>Victorias carrera</small><b>' + d.careerWins + '</b></div><div><small>Títulos</small><b>' + d.titles + '</b></div>') +
      '</div></div></div>' +
      '<h2 class="h2">' + (g.real ? 'Puntos frente al top 10' : 'Puntos por ronda') + '</h2>' +
      (g.real ? '<div class="tbl">' + g.dStand.slice(0, 10).map(function (x) { return '<div class="tr" style="--tc:' + (x.team ? x.team.color : "#3B2A5C") + (x === d ? ';background:rgba(168,85,247,.16)' : '') + '"><span class="p">' + x.pos + '</span><span class="n"><i></i><b>' + esc(x.name) + '</b></span><span class="pt">' + x.pts + '</span><span class="bar" style="width:' + (x.pts / lead.pts * 100) + '%"></span></div>'; }).join("") + '</div>'
        : '<div class="rbars">' + d.byRound.map(function (p, i) { return '<i style="height:' + (p / (S.points[0] * 1.35) * 100) + '%" data-v="R' + (i + 1) + ' · ' + p + ' pts"></i>'; }).join("") + '</div>') +
      srcLine(g) + '<div class="row"><a class="btn g sm" href="/pilotos?s=' + sid + '">← Todos los pilotos</a><a class="btn g sm" href="/equipos?s=' + sid + '&t=' + t.id + '">Ver ' + esc(t.name) + '</a></div></div></section>');
  }

  // ======================= EQUIPOS =======================
  function teams() {
    var g = PS.grid(sid), tid = Q.get("t");
    var t = tid && g.teams.filter(function (x) { return x.id === tid; })[0];
    if (t) return teamProfile(g, t);
    D.title = S.short + " Constructors — PURSEC";
    $('<section class="ph"><div class="wrap">' + crumb([["Constructors", null], [S.name, "/categorias?s=" + sid]]) + seriesTabs("/equipos?s=") +
      '<h1>' + esc(S.short) + ' Constructors ' + esc(S.season) + '</h1><p>' + g.teams.length + ' equipos. Toca uno para ver su ficha y su temporada.</p><div class="row">' + badge(g) + '</div></div></section>');
    $('<div class="wrap"><div class="dgrid">' + g.tStand.map(function (x) { return teamCard(x, "/equipos?s=" + sid + "&t=" + x.id, S); }).join("") + '</div>' + srcLine(g) + '</div>');
  }
  function teamProfile(g, t) {
    D.title = t.name + " — PURSEC";
    $('<section class="ph"><div class="wrap">' + crumb([["Constructors", "/equipos?s=" + sid], [S.short, "/equipos?s=" + sid], [t.name, null]]) + '<div class="row" style="margin:0 0 14px">' + badge(g) + '</div>' +
      '<div class="prof"><div class="card" style="--tc:' + t.color + '">' + PS.car(S.type, "#EADDFF") + '<span class="ln">' + esc(t.name) + '</span><span class="tm" style="display:block;margin-top:8px;font-weight:800">' + esc(t.full) + '</span><div class="num">P' + t.pos + '</div></div>' +
      '<div><h2 class="h2" style="margin-top:0">Temporada ' + esc(S.season) + '</h2><div class="kv">' +
        '<div><small>Posición</small><b>P' + t.pos + '</b></div><div><small>Puntos</small><b>' + t.pts + (t.calc ? '*' : '') + '</b></div>' +
        (g.real ? '' : '<div><small>Victorias</small><b>' + t.wins + '</b></div><div><small>Podios</small><b>' + t.podiums + '</b></div>') +
      '</div><h2 class="h2">Ficha</h2><div class="kv">' +
        '<div class="w"><small>Nombre completo</small><b>' + esc(t.full) + '</b></div>' +
        '<div><small>Sede</small><b>' + esc(t.base || "[PENDIENTE]") + '</b></div><div><small>' + (sid === "motogp" ? "Moto" : "Motor") + '</small><b>' + esc(t.engine || "[PENDIENTE]") + '</b></div>' +
        (g.real ? '' : '<div><small>Director</small><b>' + esc(t.principal) + '</b></div><div><small>Debut</small><b>' + t.debut + '</b></div>') +
      '</div></div></div>' + (t.calc ? '<p class="crumb" style="text-transform:none;letter-spacing:0">* Suma de los puntos de sus dos pilotos fijos, calculada por PURSEC; no es la clasificación oficial de equipos.</p>' : '') +
      '<h2 class="h2">Pilotos</h2><div class="dgrid">' + t.drivers.map(function (d) { return driverCard(d, "/pilotos?s=" + sid + "&d=" + d.id); }).join("") + '</div>' + srcLine(g) +
      '<div class="row"><a class="btn g sm" href="/equipos?s=' + sid + '">← Todos los equipos</a></div></div></section>');
  }

  // ======================= PRÓXIMAS CARRERAS =======================
  function next() {
    var rq = parseInt(Q.get("r"), 10);
    var r = rq ? PS.CALS[sid][rq - 1] : PS.nextRace(sid);
    D.title = "Next race " + S.short + " — PURSEC";
    $('<section class="ph"><div class="wrap">' + crumb([["Next races", null], [S.name, "/categorias?s=" + sid]]) + seriesTabs("/proximas?s=") + '</div></section>');
    if (!r) { $('<div class="wrap"><div class="box"><h3>Off-season</h3><p>La temporada ' + esc(S.season) + ' de ' + esc(S.name) + ' ha terminado. Volvemos con el calendario nuevo.</p><a class="btn g sm" href="/calendario?s=' + sid + '">Ver la temporada</a></div></div>'); return; }
    var ss = PS.sessions(r), now = Date.now(), race = ss[ss.length - 1];
    $('<div class="wrap"><div class="nx-hero"><div><span class="demo">Round ' + r.round + ' · ' + U.range(r) + '</span><h1 style="margin:14px 0 0;font:700 clamp(30px,5vw,60px)/1 var(--f-title);color:var(--head);text-transform:uppercase">' + r.flag + ' ' + esc(r.name) + '</h1>' +
      '<p style="color:var(--text);margin:10px 0 0">' + esc(r.circuit) + ' · ' + esc(r.country) + '</p>' +
      '<div class="count" id="cd" aria-live="polite"></div><p class="crumb" style="margin-top:8px;text-transform:none;letter-spacing:0">Cuenta atrás a la ' + esc(race.name) + '.</p></div>' +
      '<div class="stage" style="position:relative;aspect-ratio:16/9;border-radius:22px;overflow:hidden">' + U.vis(sid, { label: "R" + r.round, x: 70 }) + '</div></div>' +
      '<h2 class="h2">Sesiones <span class="demo">Horario orientativo · pendiente del oficial</span></h2><div class="sess">' +
      ss.map(function (x) {
        var past = x.utc.getTime() + 3600000 < now, isRace = /Race$|^Race|Feature/.test(x.name);
        return '<div class="se' + (isRace ? ' race' : '') + (past ? ' past' : '') + '"><span class="bar"></span><span class="dy">' + esc(fmtDay.format(x.utc)) + '</span><b>' + esc(x.name) + '</b>' +
          '<div class="tm"><div><small>Tu hora</small><span>' + fmtT.format(x.utc) + '</span></div><div><small>Circuito</small><span>' + String(x.trackHour).padStart(2, "0") + ':' + x.trackMin + '</span></div></div></div>';
      }).join("") + '</div>' +
      '<h2 class="h2">Prepara el fin de semana</h2><div class="links">' +
        [["Weekend Brief", "La predicción de estrategia", "/weekend?k=brief&s="], ["Race Card", "Los umbrales clave", "/weekend?k=racecard&s="], ["Standings", "Cómo llegan", "/clasificacion?s="], ["Schedule", "Toda la temporada", "/calendario?s="]].map(function (l) { return '<a class="lk" href="' + l[2] + sid + '"><b>' + l[0] + '</b><small>' + l[1] + '</small><span class="arr">→</span></a>'; }).join("") +
      '</div><h2 class="h2">Otras categorías</h2><div class="sgrid">' + PS.SERIES.filter(function (s) { return s.id !== sid; }).map(function (s) { var n = PS.nextRace(s.id); return '<a class="scard' + (n ? '' : ' off') + '" style="--h:' + s.hue + '" href="/proximas?s=' + s.id + '">' + PS.car(s.type) + '<b>' + esc(s.short) + '</b><small>' + (n ? n.flag + ' ' + esc(n.name) : 'Off-season') + '</small><span class="info"><span>' + (n ? U.range(n) : '') + '</span></span></a>'; }).join("") + '</div></div>');
    var box = D.getElementById("cd");
    function tick() {
      var ms = race.utc.getTime() - Date.now();
      if (ms <= 0) { box.innerHTML = '<div><b>✓</b><small>Done</small></div>'; return; }
      var d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60;
      box.innerHTML = [[d, "Días"], [h, "Horas"], [m, "Min"]].map(function (x) { return '<div><b>' + String(x[0]).padStart(2, "0") + '</b><small>' + x[1] + '</small></div>'; }).join("");
    }
    tick(); setInterval(tick, 30000);
  }

  // ======================= WEEKEND (Brief / Race Card / Sprint Card / Debrief) =======================
  function weekend() {
    var k = Q.get("k") || "brief";
    var NAMES = { brief: "Weekend Brief", racecard: "Race Card", sprintcard: "Sprint Card", debrief: "Debrief" };
    if (!NAMES[k]) k = "brief";
    var r = k === "debrief" ? U.lastRace(sid) : k === "sprintcard" ? U.nextSprint(sid) : PS.nextRace(sid);
    D.title = NAMES[k] + " " + S.short + " — PURSEC";
    $('<section class="ph"><div class="wrap">' + crumb([[NAMES[k], null], [S.name, "/categorias?s=" + sid]]) +
      '<nav class="tabs">' + Object.keys(NAMES).map(function (x) { return '<a href="/weekend?k=' + x + '&s=' + sid + '"' + (x === k ? ' aria-current="page"' : '') + '>' + NAMES[x] + '</a>'; }).join("") + '</nav>' + seriesTabs("/weekend?k=" + k + "&s=") +
      '<h1>' + NAMES[k] + '</h1><p>' + (r ? r.flag + ' ' + esc(r.name) + ' · ' + U.range(r) : (k === "sprintcard" ? esc(S.name) + " no tiene sprint próximo." : "Off-season")) + '</p><div class="row"><span class="demo">Ejemplo de formato · contenido real con cada carrera</span></div></div></section>');
    if (!r) return;
    var R = PS.rng(k + sid + r.round);
    var strategies = [["1 stop · M–H", [["M", 42], ["H", 58]]], ["2 stops · S–M–H", [["S", 22], ["M", 38], ["H", 40]]], ["1 stop · H–M", [["H", 55], ["M", 45]]]];
    var probs = [48 + Math.round(R() * 20)]; probs.push(Math.round((100 - probs[0]) * .7)); probs.push(100 - probs[0] - probs[1]);
    var free = '<div class="wgrid"><div class="box"><h3>Estrategias previstas</h3><div class="strat">' + strategies.map(function (s, i) { return '<div class="sr2"><span>' + s[0] + '</span><span class="lane">' + s[1].map(function (st) { return '<i class="' + st[0] + '" style="width:' + st[1] + '%"></i>'; }).join("") + '</span><b>' + probs[i] + '%</b></div>'; }).join("") + '</div>' +
      '<p style="margin:14px 0 0;font-size:13px;color:var(--muted)">S, M y H: compuestos blando, medio y duro.</p></div>' +
      '<div class="rc"><span class="demo">' + NAMES[k] + ' · R' + r.round + '</span><h3 style="margin:12px 0 0;font:700 22px/1.1 var(--f-title);color:var(--head)">' + esc(r.circuit) + '</h3><div class="row3">' +
        '<div class="cell"><small>Pit loss</small><b>' + (18 + Math.round(R() * 8)) + ' s</b></div><div class="cell"><small>Undercut</small><b>' + (0.8 + R() * 1.4).toFixed(1) + ' s</b></div><div class="cell"><small>Safety Car</small><b>' + (30 + Math.round(R() * 60)) + '%</b></div>' +
        '<div class="cell"><small>Overtake</small><b>' + ["Low", "Mid", "High"][Math.floor(R() * 3)] + '</b></div><div class="cell"><small>Track temp</small><b>' + (28 + Math.round(R() * 20)) + '°</b></div><div class="cell"><small>Deg</small><b>' + ["Low", "Mid", "High"][Math.floor(R() * 3)] + '</b></div>' +
      '</div></div></div>';
    var locked = '<h2 class="h2">Análisis completo <span class="demo">Trackside</span></h2><div class="locked"><div class="blur"><div class="wgrid"><div class="box"><h3>Ventanas de parada</h3><p>Vueltas 14–19 para el Undercut con M, 22–27 si el Safety Car llega antes de la vuelta 12. El tráfico en el sector 2 penaliza ~0,4 s por vuelta al salir detrás del grupo medio…</p></div><div class="box"><h3>Umbrales</h3><p>Si el gap al coche de delante cae por debajo de 1,1 s en la vuelta 15, parada inmediata. Si el delta de deg supera 0,08 s/vuelta, el plan pasa a 2 stops…</p></div></div></div>' +
      '<div class="gate"><span class="lockic">' + U.I.lock + '</span><b>Solo para Trackside</b><p>Ventanas exactas, umbrales y el razonamiento completo. Prueba 7 días gratis.</p><div class="row" style="justify-content:center"><a class="btn p" href="/planes">Probar Trackside</a><a class="btn g" href="/acceso">Ya soy miembro</a></div></div></div>';
    $('<div class="wrap">' + free + locked + '</div>');
  }

  // ======================= NOTICIAS =======================
  function news() {
    var f = Q.get("s");
    D.title = "News — PURSEC";
    var list = PS.NEWS.map(function (n, i) { return [n, i]; }).filter(function (x) { return !f || x[0].s === f; });
    $('<section class="ph"><div class="wrap">' + crumb([["News", null]]) + '<nav class="tabs"><a href="/noticias"' + (!f ? ' aria-current="page"' : '') + '>Todas</a>' + PS.SERIES.map(function (s) { return '<a href="/noticias?s=' + s.id + '"' + (f === s.id ? ' aria-current="page"' : '') + '>' + esc(s.short) + '</a>'; }).join("") + '</nav>' +
      '<h1>Latest News</h1><p>Análisis, previas y debriefs de todas las series.</p><div class="row"><span class="demo">Titulares de ejemplo</span></div></div></section>');
    if (!list.length) { $('<div class="wrap"><div class="box"><h3>Sin noticias aún</h3><p>Pronto habrá contenido de ' + esc(PS.BY[f].name) + '.</p></div></div>'); return; }
    var a = list[0], rest = list.slice(1);
    $('<div class="wrap"><div class="nfeat"><a class="lead" id="n' + a[1] + '" href="#n' + a[1] + '">' + U.vis(a[0].s, { x: 40 }) + '<div class="cap"><span class="tagl">' + esc(a[0].k) + '</span><h2>' + esc(a[0].t) + '</h2><p style="margin:8px 0 0;color:var(--text)">' + esc(a[0].d) + '</p></div></a>' +
      '<div class="stackc">' + rest.slice(0, 2).map(function (x) { return '<a class="nn" id="n' + x[1] + '" href="#n' + x[1] + '">' + U.vis(x[0].s, { x: 30 }) + '<span class="k">' + esc(PS.BY[x[0].s].short) + ' · ' + esc(x[0].k) + '</span><h3>' + esc(x[0].t) + '</h3></a>'; }).join("") + '</div></div>' +
      '<h2 class="h2">Más noticias</h2><div class="ngrid">' + rest.slice(2).map(function (x, i) { return '<a class="nn" id="n' + x[1] + '" href="#n' + x[1] + '">' + U.vis(x[0].s, { x: 20 + (i * 23) % 70 }) + '<span class="k">' + esc(PS.BY[x[0].s].short) + ' · ' + esc(x[0].k) + '</span><h3>' + esc(x[0].t) + '</h3><p>' + esc(x[0].d) + '</p></a>'; }).join("") + '</div></div>');
  }

  // ======================= VÍDEOS =======================
  function videos() {
    D.title = "Videos — PURSEC";
    $('<section class="ph"><div class="wrap">' + crumb([["Videos", null]]) + '<h1>Videos</h1><p>Lo que publicamos en redes y, para Trackside, vídeos exclusivos de la web.</p></div></section>');
    $('<div class="wrap"><h2 class="h2" style="margin-top:0">From our socials <span class="demo">Reels · TikTok · Shorts</span></h2><div class="vgrid">' + PS.VIDEOS.map(U.reel).join("") + '</div>' +
      '<h2 class="h2" id="trackside">Trackside Exclusives <span class="demo">Solo en la web</span></h2><div class="locked"><div class="blur"><div class="dgrid">' +
      ["Debrief en vídeo: Sepang, vuelta a vuelta", "Sector 4: rehacemos el Undercut de Bakú", "Race Card explicada: Singapur", "Cómo leer la degradación con datos públicos", "Le Mans de noche: la estrategia de stints", "MotoGP: el neumático delantero en Mandalika"].map(function (t, i) {
        var s = ["f1", "f1", "f1", "f2", "wec", "motogp"][i];
        return '<a class="vc" href="#trackside"><div class="vis" style="--h:' + PS.BY[s].hue + ';aspect-ratio:16/9;border-radius:8px"><span class="speed"></span><span class="big">' + esc(PS.BY[s].short) + '</span>' + PS.car(PS.BY[s].type) + '<span class="play"></span><span class="dur">' + (8 + i * 3) + ':' + String(10 + i * 7).slice(0, 2) + '</span></div><h3>' + esc(t) + '</h3></a>';
      }).join("") + '</div></div>' +
      '<div class="gate"><span class="lockic">' + U.I.lock + '</span><b>Vídeos exclusivos para Trackside</b><p>Debriefs en vídeo, Sector 4 explicado y análisis largos que no publicamos en redes.</p><div class="row" style="justify-content:center"><a class="btn p" href="/planes">Desbloquear con Trackside</a><a class="btn g" href="/acceso">Ya soy miembro</a></div></div></div></div>');
  }

  var R = { home: home, categorias: category, calendario: schedule, clasificacion: standings, pilotos: drivers, equipos: teams, proximas: next, weekend: weekend, noticias: news, videos: videos };
  if (R[page]) R[page]();

  // Plan del usuario (desbloquea los contenidos Trackside si hay sesión con plan activo)
  if (window.PURSEC && window.PURSEC.auth) {
    window.PURSEC.auth.session().then(function (s) { if (!s) return; return window.PURSEC.auth.profile().then(function (p) { D.documentElement.setAttribute("data-tier", window.PURSEC.auth.tierOf(p)); }); }).catch(function () {});
  }
})();
