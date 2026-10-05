// PURSEC — portada: el logo es el circuito.
// Una luz da la vuelta recorriendo el contorno de las letras: S1 (PU) y S2 (RS) en verde, S3 (EC) en morado.
// Al cruzar meta las letras se inflan como chicle. Después, vueltas en bucle: el sector en curso se ilumina
// y cada letra rebota cuando pasa la luz. Al hacer scroll, los tres sectores se separan.
// Rendimiento: solo se cambian transform y opacity (capas de GPU); nada se repinta por fotograma.
(function () {
  var hero = document.getElementById("portada");
  if (!hero) return;
  var title = hero.querySelector(".title");
  var car = hero.querySelector(".car");
  var inks = [].slice.call(hero.querySelectorAll(".letters .ink"));
  var bars = [1, 2, 3].map(function (k) { return hero.querySelector(".barfill.b" + k); });
  var sectors = [1, 2, 3].map(function (k) { return hero.querySelector(".letters .s" + k); });
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduce || !inks.length || !inks[0].getTotalLength) { hero.classList.add("lit", "done"); hero.setAttribute("data-sector", "4"); return; }

  var segs = inks.map(function (p) {
    return { el: p, s: +p.getAttribute("data-s"), len: p.getTotalLength(), jelly: p.closest(".jelly"), svgEl: p.ownerSVGElement };
  });
  var total = 0, secLen = { 1: 0, 2: 0, 3: 0 };
  segs.forEach(function (g) { total += g.len; secLen[g.s] += g.len; });

  // ---- rebote de cada letra ----
  function boing(j) {
    if (!j || !hero.classList.contains("lit")) return;
    j.classList.remove("boing"); void j.offsetWidth; j.classList.add("boing");
  }
  [].slice.call(hero.querySelectorAll(".jelly")).forEach(function (j) {
    j.addEventListener("animationend", function (e) { if (e.animationName === "boing") j.classList.remove("boing"); });
    j.parentNode.addEventListener("pointerenter", function () { boing(j); });
  });

  // ---- posición de cada letra dentro del título (cacheada; se recalcula al cambiar el tamaño) ----
  var cache = new Map();
  function letterRect(svgEl) {
    var lt = svgEl.closest(".lt"), r = cache.get(lt);
    if (!r) {
      r = { x: lt.offsetLeft, y: lt.offsetTop, w: lt.offsetWidth, h: lt.offsetHeight, vb: svgEl.viewBox.baseVal };
      cache.set(lt, r);
    }
    return r;
  }
  window.addEventListener("resize", function () { cache.clear(); });

  var visible = true, lap = 0, t0 = 0, pausedAt = 0, lastJelly = null, lastSector = -1, lastBars = [-1, -1, -1];
  var FIRST = 4200, LAP = 7000, GAP = 2400;

  function setSector(k) {
    if (k === lastSector) return;
    lastSector = k; hero.setAttribute("data-sector", k);
    car.classList.toggle("g", k === 1 || k === 2);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) return;
    var dur = lap === 0 ? FIRST : LAP, el = now - t0;
    if (el > dur + GAP) { lap++; t0 = now; hero.classList.add("done"); resetLap(); return; }
    var p = Math.min(1, el / dur);
    var e = lap === 0 ? 1 - Math.pow(1 - p, 1.6) : (p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
    var d = e * total, acc = 0, cur = null, local = 0, done = { 1: 0, 2: 0, 3: 0 };
    for (var i = 0; i < segs.length; i++) {
      var g = segs[i], f = Math.max(0, Math.min(1, (d - acc) / g.len));
      if (lap === 0) g.el.style.strokeDashoffset = (1 - f).toFixed(4);
      done[g.s] += f * g.len;
      if (!cur && d < acc + g.len) { cur = g; local = d - acc; }
      acc += g.len;
    }
    for (var k = 1; k <= 3; k++) {
      var v = Math.round(done[k] / secLen[k] * 1000) / 1000;
      if (v !== lastBars[k - 1]) { bars[k - 1].style.transform = "scaleX(" + v + ")"; lastBars[k - 1] = v; }
    }
    if (cur && p < 1) {
      var pt = cur.el.getPointAtLength(local), r = letterRect(cur.svgEl);
      var x = r.x + (pt.x - r.vb.x) / r.vb.width * r.w, y = r.y + (pt.y - r.vb.y) / r.vb.height * r.h;
      car.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
      if (cur.jelly !== lastJelly) { boing(cur.jelly); lastJelly = cur.jelly; }
      setSector(cur.s);
      if (!hero.classList.contains("moving")) hero.classList.add("moving");
    } else {
      if (hero.classList.contains("moving")) hero.classList.remove("moving");
      setSector(4);
      if (!hero.classList.contains("lit")) hero.classList.add("lit");
    }
  }
  function resetLap() {
    bars.forEach(function (b, i) { b.style.transform = "scaleX(0)"; lastBars[i] = 0; });
    lastJelly = null; setSector(0);
  }

  segs.forEach(function (g) { g.el.style.strokeDasharray = "1"; g.el.style.strokeDashoffset = "1"; });
  resetLap();
  setTimeout(function () { t0 = performance.now(); hero.classList.add("go"); requestAnimationFrame(frame); }, 500);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      var v = es[0].isIntersecting;
      if (!v && visible) pausedAt = performance.now();
      if (v && !visible && pausedAt) t0 += performance.now() - pausedAt;
      visible = v;
    }).observe(hero);
  }

  // ---- scroll: los sectores se separan con un valor suavizado (transform directo, sin variables CSS) ----
  var target = 0, current = 0, easing = false;
  function readScroll() {
    target = Math.max(0, Math.min(1, window.scrollY / (hero.offsetHeight * 0.8)));
    if (!easing) { easing = true; requestAnimationFrame(ease); }
  }
  function apply(v) {
    var vw = window.innerWidth / 100, vh = window.innerHeight / 100;
    sectors[0].style.transform = "translate3d(" + (-14 * vw * v).toFixed(1) + "px,0,0)";
    sectors[1].style.transform = "translate3d(0," + (-4 * vh * v).toFixed(1) + "px,0)";
    sectors[2].style.transform = "translate3d(" + (14 * vw * v).toFixed(1) + "px,0,0)";
    title.style.opacity = Math.max(0, 1 - v * 1.1).toFixed(3);
  }
  function ease() {
    current += (target - current) * 0.16;
    if (Math.abs(target - current) < 0.0006) { current = target; easing = false; }
    apply(current);
    if (easing) requestAnimationFrame(ease);
  }
  window.addEventListener("scroll", readScroll, { passive: true });
  readScroll();
})();
