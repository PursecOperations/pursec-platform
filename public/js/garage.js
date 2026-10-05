// PURSEC — Garage: exige sesión y marca el plan en <html data-tier="owner|trackside|paddock">.
(function () {
  var A = window.PURSEC && window.PURSEC.auth;
  if (!A) { location.replace("/acceso"); return; }
  A.requireMember().then(function (ctx) {
    if (!ctx) return;
    document.dispatchEvent(new CustomEvent("pursec:member", { detail: ctx }));
  }).catch(function () {
    location.replace("/acceso?next=" + encodeURIComponent(location.pathname));
  });
})();
