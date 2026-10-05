// PURSEC — interacciones de la web pública (sin dependencias)
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce && "IntersectionObserver" in window) root.classList.add("js-reveal");

  // Aparición suave de bloques al entrar en pantalla
  var items = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  // Vuelta del ciclo: la línea se completa a medida que haces scroll
  var lap = document.querySelector("[data-lap]");
  if (lap) {
    var stops = lap.querySelectorAll(".stop");
    var tick = function () {
      var r = lap.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.55 - r.top) / r.height;
      p = Math.max(0, Math.min(1, p));
      lap.style.setProperty("--p", p.toFixed(3));
      stops.forEach(function (s) {
        var sr = s.getBoundingClientRect();
        s.classList.toggle("on", sr.top < vh * 0.6);
      });
    };
    if (reduce) {
      lap.style.setProperty("--p", "1");
      stops.forEach(function (s) { s.classList.add("on"); });
    } else {
      var queued = false;
      window.addEventListener("scroll", function () {
        if (queued) return; queued = true;
        requestAnimationFrame(function () { queued = false; tick(); });
      }, { passive: true });
      window.addEventListener("resize", tick);
      tick();
    }
  }

  // Cabecera: estado al hacer scroll, vuelta de la página (tres sectores) y menú móvil.
  var top = document.getElementById("top");
  if (top) {
    var laps = [].slice.call(top.querySelectorAll(".hlap i")), last = [-1, -1, -1], hq = false, wasScrolled = null;
    var paint = function () {
      hq = false;
      var y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
      var sc = y > 12;
      if (sc !== wasScrolled) { top.classList.toggle("scrolled", sc); wasScrolled = sc; }
      var p = max > 0 ? Math.min(1, y / max) : 0;
      for (var k = 0; k < 3; k++) {
        var v = Math.round(Math.max(0, Math.min(1, p * 3 - k)) * 1000) / 1000;
        if (v !== last[k]) { laps[k].style.transform = "scaleX(" + v + ")"; last[k] = v; }
      }
    };
    window.addEventListener("scroll", function () { if (!hq) { hq = true; requestAnimationFrame(paint); } }, { passive: true });
    window.addEventListener("resize", paint);
    paint();

    var btn = top.querySelector(".menu"), sheet = document.getElementById("sheet");
    var setOpen = function (open) {
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      document.body.classList.toggle("menu-open", open);
      if (open) {
        sheet.hidden = false;
        requestAnimationFrame(function () { requestAnimationFrame(function () { top.classList.add("open"); }); });
      } else {
        top.classList.remove("open");
        setTimeout(function () { if (!top.classList.contains("open")) sheet.hidden = true; }, reduce ? 0 : 450);
      }
    };
    if (btn && sheet) {
      btn.addEventListener("click", function () { setOpen(btn.getAttribute("aria-expanded") !== "true"); });
      sheet.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape" && top.classList.contains("open")) { setOpen(false); btn.focus(); } });
      window.matchMedia("(min-width: 821px)").addEventListener("change", function (m) { if (m.matches) setOpen(false); });
    }
  }
})();
