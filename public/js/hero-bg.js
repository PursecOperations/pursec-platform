// PURSEC — fondo animado de la portada (canvas, sin dependencias).
// Tres capas muy tenues que forman parte del fondo:
//   1. suelo de pista en perspectiva que avanza hacia ti (sensación de velocidad)
//   2. trazas de telemetría (velocidad, acelerador) que fluyen de lado a lado
//   3. un circuito gigante dibujado en la penumbra, con un cometa que lo recorre por sectores
// Se pausa fuera de pantalla y no se anima con prefers-reduced-motion.
(function () {
  var hero = document.getElementById("portada");
  var cv = hero && hero.querySelector(".bgc");
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var W = 0, H = 0, dpr = 1, visible = true, raf = 0;

  // circuito inventado (coordenadas 0..1), mismo trazado que se usa como motivo
  var TRACK = [[.08, .78], [.05, .55], [.16, .42], [.38, .34], [.47, .2], [.6, .13], [.8, .16], [.92, .3], [.9, .48],
               [.76, .58], [.6, .7], [.44, .86], [.26, .9], [.12, .86]];
  var trackPts = [];
  function catmull(pts, n) {
    var out = [], L = pts.length;
    for (var i = 0; i < L; i++) {
      var p0 = pts[(i - 1 + L) % L], p1 = pts[i], p2 = pts[(i + 1) % L], p3 = pts[(i + 2) % L];
      for (var t = 0; t < 1; t += 1 / n) {
        var t2 = t * t, t3 = t2 * t;
        out.push([
          .5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }
    return out;
  }
  var trackN = catmull(TRACK, 24);

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // circuito escalado a toda la portada, un poco girado
    var cx = W * .5, cy = H * .5, sx = W * 1.05, sy = H * 1.0, a = -0.12, ca = Math.cos(a), sa = Math.sin(a);
    trackPts = trackN.map(function (p) {
      var x = (p[0] - .5) * sx, y = (p[1] - .5) * sy;
      return [cx + x * ca - y * sa, cy + x * sa + y * ca];
    });
  }

  function floor(t) {
    var hz = H * .6, vx = W * .5;
    var g = ctx.createLinearGradient(0, hz, 0, H);
    g.addColorStop(0, "rgba(168,85,247,0)"); g.addColorStop(1, "rgba(168,85,247,.22)");
    ctx.strokeStyle = g; ctx.lineWidth = 1;
    // líneas de fuga
    ctx.beginPath();
    for (var i = -14; i <= 14; i++) {
      ctx.moveTo(vx + i * W * .012, hz);
      ctx.lineTo(vx + i * W * .16, H + 40);
    }
    ctx.stroke();
    // líneas transversales que avanzan (velocidad)
    var speed = .55, n = 14;
    for (var k = 0; k < n; k++) {
      var z = ((k / n) + (t * speed / 1000) % 1) % 1;   // 0 horizonte -> 1 cerca
      var y = hz + (H - hz) * Math.pow(z, 2.2);
      ctx.strokeStyle = "rgba(201,167,255," + (0.05 + 0.22 * z).toFixed(3) + ")";
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // bordillo verde/morado que pasa por los lados
    var kerb = (t / 220) % 2;
    for (var side = -1; side <= 1; side += 2) {
      for (var j = 0; j < 10; j++) {
        var z0 = ((j / 10) + (t * speed / 1000)) % 1, z1 = Math.min(1, z0 + .05);
        var y0 = hz + (H - hz) * Math.pow(z0, 2.2), y1 = hz + (H - hz) * Math.pow(z1, 2.2);
        var x0 = vx + side * (W * .03 + W * .5 * Math.pow(z0, 2.2)), x1 = vx + side * (W * .03 + W * .5 * Math.pow(z1, 2.2));
        ctx.strokeStyle = (j % 2 ? "rgba(34,197,94," : "rgba(168,85,247,") + (0.12 + .35 * z0).toFixed(3) + ")";
        ctx.lineWidth = 1 + 5 * z0;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      }
    }
    ctx.lineWidth = 1;
  }

  function telemetry(t) {
    var lines = [
      { y: .16, amp: .05, f: [2.1, 7.3], sp: .00011, c: "rgba(201,167,255,.30)", w: 1.6 },
      { y: .27, amp: .03, f: [3.4, 11.2], sp: .00017, c: "rgba(74,222,128,.22)", w: 1.2 },
      { y: .08, amp: .025, f: [5.1, 13.7], sp: .00023, c: "rgba(168,85,247,.22)", w: 1 }
    ];
    lines.forEach(function (L) {
      ctx.strokeStyle = L.c; ctx.lineWidth = L.w; ctx.beginPath();
      for (var x = 0; x <= W; x += 6) {
        var u = x / W + t * L.sp;
        var v = Math.sin(u * Math.PI * 2 * L.f[0]) * .7 + Math.sin(u * Math.PI * 2 * L.f[1]) * .3;
        var y = H * (L.y + L.amp * v);
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    });
  }

  function track(t) {
    if (!trackPts.length) return;
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(168,85,247,.10)"; ctx.lineWidth = 22;
    ctx.beginPath(); trackPts.forEach(function (p, i) { i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.closePath(); ctx.stroke();
    ctx.strokeStyle = "rgba(201,167,255,.16)"; ctx.lineWidth = 1.2; ctx.stroke();
    // cometa: recorre el circuito; color por sector (verde, verde, morado)
    var N = trackPts.length, head = Math.floor((t / 9000 % 1) * N), tail = Math.floor(N * .07);
    for (var k = 0; k < tail; k++) {
      var i0 = (head - k + N) % N, i1 = (head - k - 1 + N) % N;
      var sec = i0 / N < 1 / 3 ? 0 : i0 / N < 2 / 3 ? 1 : 2;
      var a = (1 - k / tail);
      ctx.strokeStyle = (sec < 2 ? "rgba(74,222,128," : "rgba(192,132,252,") + (.85 * a).toFixed(3) + ")";
      ctx.lineWidth = 1 + 4 * a;
      ctx.beginPath(); ctx.moveTo(trackPts[i0][0], trackPts[i0][1]); ctx.lineTo(trackPts[i1][0], trackPts[i1][1]); ctx.stroke();
    }
    var hp = trackPts[head];
    var rg = ctx.createRadialGradient(hp[0], hp[1], 0, hp[0], hp[1], 26);
    rg.addColorStop(0, "rgba(242,232,255,.9)"); rg.addColorStop(1, "rgba(242,232,255,0)");
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(hp[0], hp[1], 26, 0, Math.PI * 2); ctx.fill();
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    track(t);
    telemetry(t);
    floor(t);
  }
  function loop(t) {
    raf = requestAnimationFrame(loop);
    if (visible) draw(t);
  }

  resize();
  window.addEventListener("resize", resize);
  if (reduce) { draw(0); return; }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(hero);
  }
  raf = requestAnimationFrame(loop);
})();
