// PURSEC — demo animada del simulador de undercut (inicio).
// Mismas fórmulas que packages/sim/src/undercut.js y pace.js: deterministas, sin IA.
// Los valores de entrada son de ejemplo y se pueden mover; no son datos de ninguna carrera.
(function () {
  var root = document.querySelector("[data-undercut]");
  if (!root) return;

  // ---- motor (port de packages/sim) ----
  function lapDelta(c, age) { return c.offset + c.deg * age + (c.deg2 || 0) * age * age; }
  var round3 = function (x) { return Math.round(x * 1000) / 1000; };

  // Vuelta a vuelta: A delante por `gap`. B para al final de la vuelta 0; A para k vueltas después.
  function simulate(p) {
    var C = p.compounds, k = p.k, laps = [];
    var gap = p.gap;
    for (var i = 0; i <= k + 1; i++) {
      var tA, tB, evA = "", evB = "";
      if (i === 0) {
        tA = lapDelta(C[p.a.compound], p.a.age);
        tB = lapDelta(C[p.b.compound], p.b.age) + p.pitLoss; evB = "pit";
      } else if (i <= k) {
        tA = lapDelta(C[p.a.compound], p.a.age + i);
        tB = lapDelta(C[p.newB], i - 1) + (i === 1 ? C[p.newB].warmup || 0 : 0); if (i === 1) evB = "out";
      } else {
        tA = p.pitLoss + lapDelta(C[p.newA], 0) + (C[p.newA].warmup || 0); evA = "pit";
        tB = lapDelta(C[p.newB], k) + (k === 0 ? C[p.newB].warmup || 0 : 0);
      }
      gap -= tA - tB;
      laps.push({ tA: tA, tB: tB, gap: round3(gap), evA: evA, evB: evB });
    }
    return { laps: laps, gapAfter: round3(gap), swing: round3(p.gap - gap) };
  }

  // ---- valores de ejemplo (editables con los controles) ----
  var EX = {
    compounds: {
      medio: { offset: 0.6, deg: 0.09, warmup: 0 },
      duro: { offset: 1.0, deg: 0.05, warmup: 1.4 },
    },
    a: { compound: "medio", age: 22 },
    b: { compound: "medio", age: 22 },
    newA: "duro", newB: "duro",
  };

  var $ = function (s) { return root.querySelector(s); };
  var inGap = $("#u-gap"), inK = $("#u-k"), inPit = $("#u-pit"), inAge = $("#u-age");
  var outGap = $("#u-gap-v"), outK = $("#u-k-v"), outPit = $("#u-pit-v"), outAge = $("#u-age-v");
  var tower = $(".u-tower"), rowA = $("#u-row-a"), rowB = $("#u-row-b");
  var gapNum = $("#u-gapnum"), lapNum = $("#u-lap"), log = $("#u-log"), verdict = $("#u-verdict");
  var bars = $("#u-bars"), meter = $("#u-meter-fill"), gapLbl = $("#u-gaplbl");
  var posA = $("#u-row-a .pos"), posB = $("#u-row-b .pos");
  var fmt = function (x, d) { return x.toFixed(d == null ? 1 : d).replace(".", ","); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var timer = null, step = -1, result = null, visible = false;

  function params() {
    var age = +inAge.value;
    return {
      gap: +inGap.value, k: +inK.value, pitLoss: +inPit.value,
      compounds: EX.compounds, newA: EX.newA, newB: EX.newB,
      a: { compound: EX.a.compound, age: age }, b: { compound: EX.b.compound, age: age },
    };
  }

  // Barras: lo que cuesta el neumático en cada vuelta (sin la pérdida en boxes, que va aparte)
  function drawBars(laps, upto) {
    var pit = +inPit.value, max = 0;
    laps = laps.map(function (l) {
      return { tA: l.tA - (l.evA === "pit" ? pit : 0), tB: l.tB - (l.evB === "pit" ? pit : 0), evA: l.evA, evB: l.evB };
    });
    laps.forEach(function (l) { max = Math.max(max, l.tA, l.tB); });
    bars.innerHTML = laps.map(function (l, i) {
      var on = i <= upto ? " on" : "";
      var hA = Math.max(4, (l.tA / max) * 100), hB = Math.max(4, (l.tB / max) * 100);
      return '<div class="u-lapcol' + on + '"><div class="u-pair">' +
        '<i class="ba' + (l.evA ? " pit" : "") + '" style="height:' + hA + '%"></i>' +
        '<i class="bb' + (l.evB ? " pit" : "") + '" style="height:' + hB + '%"></i></div>' +
        '<span class="mono">V' + (i + 1) + "</span></div>";
    }).join("");
  }

  function show(i) {
    var p = params(), laps = result.laps;
    var g = i < 0 ? p.gap : laps[i].gap; // >0: A delante
    var aAhead = g >= 0;
    tower.classList.toggle("swap", !aAhead);
    gapNum.textContent = fmt(Math.abs(g), 2) + " s";
    gapNum.className = "u-gapnum mono " + (aAhead ? "a" : "b");
    gapLbl.textContent = (aAhead ? "A" : "B") + " va delante";
    posA.textContent = aAhead ? "P1" : "P2"; posB.textContent = aAhead ? "P2" : "P1";
    lapNum.textContent = i < 0 ? "Antes de parar" : "Vuelta " + (i + 1) + " de " + laps.length;
    // indicador: centro = empate; izquierda = A delante, derecha = B delante (±4 s)
    var pct = Math.max(-1, Math.min(1, g / 4));
    meter.style.left = (50 - Math.max(pct, 0) * 50) + "%";
    meter.style.right = (50 + Math.min(pct, 0) * 50) + "%";
    meter.className = aAhead ? "a" : "b";
    var msg = "";
    if (i < 0) msg = "A va delante por " + fmt(p.gap) + " s. Los dos con medios de " + p.a.age + " vueltas.";
    else if (i === 0) msg = "B entra a boxes y monta duros. Pierde " + fmt(p.pitLoss) + " s en el pit lane.";
    else if (i <= p.k) msg = i === 1 ? "B sale con duros fríos. A sigue fuera con medios gastados." : "A aguanta fuera. Cada vuelta, el neumático viejo le cuesta más.";
    else msg = "A entra a boxes y sale con duros fríos.";
    log.textContent = msg;
    drawBars(laps, i);
    var done = i === laps.length - 1;
    verdict.hidden = !done;
    if (done) {
      verdict.textContent = result.gapAfter < 0
        ? "El undercut funciona: B sale delante por " + fmt(-result.gapAfter, 2) + " s."
        : result.gapAfter > 0 ? "El undercut no llega: A sigue delante por " + fmt(result.gapAfter, 2) + " s." : "Salen empatados.";
      verdict.className = "u-verdict " + (result.gapAfter < 0 ? "b" : "a");
    }
  }

  function stop() { if (timer) clearTimeout(timer); timer = null; }
  function play() {
    stop();
    result = simulate(params());
    if (reduce) { show(result.laps.length - 1); return; }
    step = -1; show(step);
    var next = function () {
      if (!visible) { timer = null; return; }
      step++;
      if (step >= result.laps.length) { timer = setTimeout(function () { play(); }, 3800); return; }
      show(step);
      timer = setTimeout(next, step === result.laps.length - 1 ? 1200 : 1400);
    };
    timer = setTimeout(next, 1400);
  }

  function syncLabels() {
    outGap.textContent = fmt(+inGap.value) + " s";
    outK.textContent = inK.value + (inK.value === "1" ? " vuelta" : " vueltas");
    outPit.textContent = fmt(+inPit.value) + " s";
    outAge.textContent = inAge.value + " vueltas";
  }
  [inGap, inK, inPit, inAge].forEach(function (el) {
    el.addEventListener("input", function () { syncLabels(); play(); });
  });
  $("#u-replay").addEventListener("click", function () { play(); });

  syncLabels();
  result = simulate(params());
  show(-1);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var was = visible; visible = e.isIntersecting;
        if (visible && !was) play(); else if (!visible) stop();
      });
    }, { threshold: 0.35 }).observe(root);
  } else { visible = true; play(); }
})();
