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
})();
