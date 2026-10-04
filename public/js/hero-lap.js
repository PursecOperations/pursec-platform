// PURSEC — portada: el logo es el circuito.
// Una luz da la vuelta recorriendo el contorno de las letras: S1 (PU) y S2 (RS) en verde, S3 (EC) en morado.
// Al cerrar el S3 el logo entero se enciende en morado (el "sector morado"). Después, vueltas de reconocimiento
// en bucle. Al hacer scroll, los tres sectores se separan. Sin dependencias.
(function () {
  var hero = document.getElementById("portada");
  if (!hero) return;
  var svg = hero.querySelector(".lapmark");
  var car = svg.querySelector(".car");
  var inks = [].slice.call(svg.querySelectorAll(".ink"));
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduce || !inks[0].getTotalLength) { hero.classList.add("lit", "done"); return; }

  // Longitud real de cada contorno (las rutas usan pathLength=1 para el trazo, la real para el tiempo)
  var segs = inks.map(function (p) { return { el: p, s: +p.getAttribute("data-s"), len: p.getTotalLength(), jelly: p.closest(".jelly") }; });
  var lastJelly = null;
  function boing(j) {
    if (!j || !hero.classList.contains("lit")) return;
    j.classList.remove("boing"); void j.getBBox(); j.classList.add("boing");
  }
  [].slice.call(svg.querySelectorAll(".jelly")).forEach(function (j) {
    j.addEventListener("animationend", function () { j.classList.remove("boing"); });
    j.parentNode.addEventListener("pointerenter", function () { boing(j); });
  });
  var total = segs.reduce(function (a, b) { return a + b.len; }, 0);
  var bars = { 1: svg.querySelector(".b1 .fill"), 2: svg.querySelector(".b2 .fill"), 3: svg.querySelector(".b3 .fill") };
  var secLen = { 1: 0, 2: 0, 3: 0 };
  segs.forEach(function (g) { secLen[g.s] += g.len; });

  var visible = true, raf = 0, lap = 0, t0 = 0, paused = 0;
  var FIRST = 4200, LAP = 6500, GAP = 2200; // ms: vuelta de salida, vueltas en bucle, pausa entre vueltas

  function setSector(k) {
    hero.setAttribute("data-sector", k);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    var dur = lap === 0 ? FIRST : LAP;
    var el = now - t0;
    if (el > dur + GAP) { lap++; t0 = now; hero.classList.add("done"); resetLap(); return; }
    var p = Math.min(1, el / dur);
    // easing suave: arranca rápido, frena al final (como cruzar meta)
    var e = 1 - Math.pow(1 - p, 1.6);
    var d = e * total, acc = 0, cur = null, local = 0;
    var done = { 1: 0, 2: 0, 3: 0 };
    for (var i = 0; i < segs.length; i++) {
      var g = segs[i];
      var f = Math.max(0, Math.min(1, (d - acc) / g.len));
      if (lap === 0) g.el.style.strokeDashoffset = String(1 - f);
      done[g.s] += f * g.len;
      if (!cur && d < acc + g.len) { cur = g; local = d - acc; }
      acc += g.len;
    }
    // barra de cada sector = parte recorrida de ese sector
    [1, 2, 3].forEach(function (k) { bars[k].style.transform = "scaleX(" + (done[k] / secLen[k]).toFixed(4) + ")"; });
    if (cur && p < 1) {
      var pt = cur.el.getPointAtLength(local);
      // las letras se mueven (flotan y rebotan): pasar el punto a coordenadas del SVG
      var m = cur.el.getScreenCTM(), inv = svg.getScreenCTM();
      if (m && inv) {
        var sp = svg.createSVGPoint(); sp.x = pt.x; sp.y = pt.y;
        pt = sp.matrixTransform(m).matrixTransform(inv.inverse());
      }
      car.setAttribute("cx", pt.x.toFixed(1)); car.setAttribute("cy", pt.y.toFixed(1));
      if (cur.jelly !== lastJelly) { boing(cur.jelly); lastJelly = cur.jelly; }
      car.setAttribute("data-s", cur.s);
      setSector(cur.s);
      hero.classList.add("moving");
    } else {
      hero.classList.remove("moving");
      setSector(4);
      if (!hero.classList.contains("lit")) hero.classList.add("lit");
    }
  }

  function resetLap() {
    [1, 2, 3].forEach(function (k) { bars[k].style.transform = "scaleX(0)"; });
    setSector(0);
  }

  // Preparar trazo vacío y arrancar
  segs.forEach(function (g) { g.el.style.strokeDasharray = "1"; g.el.style.strokeDashoffset = "1"; });
  resetLap();
  setTimeout(function () { t0 = performance.now(); hero.classList.add("go"); raf = requestAnimationFrame(frame); }, 500);

  // Pausa fuera de pantalla (y retoma sin saltos)
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      var v = es[0].isIntersecting;
      if (!v && visible) paused = performance.now();
      if (v && !visible && paused) t0 += performance.now() - paused;
      visible = v;
    }).observe(hero);
  }

  // Scroll: los tres sectores se separan y la portada se apaga
  var queued = false;
  function onScroll() {
    if (queued) return; queued = true;
    requestAnimationFrame(function () {
      queued = false;
      var p = Math.max(0, Math.min(1, window.scrollY / (hero.offsetHeight * 0.8)));
      hero.style.setProperty("--split", p.toFixed(3));
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
