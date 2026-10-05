// PURSEC — /acceso: entrar, crear cuenta, Google y recuperar contraseña.
(function () {
  var A = window.PURSEC && window.PURSEC.auth;
  var $ = function (id) { return document.getElementById(id); };
  var msg = $("msg");
  function say(text, kind) { msg.textContent = text; msg.className = "msg" + (kind ? " " + kind : ""); }
  if (!A) { say("No se ha podido cargar el acceso. Recarga la página.", "err"); return; }

  var params = new URLSearchParams(location.search);
  var next = A.safeNext(params.get("next"));
  var go = function () { location.replace(next); };

  // Pestañas
  var tabs = { in: [$("t-in"), $("f-in")], up: [$("t-up"), $("f-up")] };
  function show(which) {
    Object.keys(tabs).forEach(function (k) {
      var on = k === which;
      tabs[k][0].setAttribute("aria-selected", String(on));
      tabs[k][1].hidden = !on;
    });
    $("f-new").hidden = true;
    say("");
  }
  $("t-in").addEventListener("click", function () { show("in"); });
  $("t-up").addEventListener("click", function () { show("up"); });
  if (params.get("modo") === "crear") show("up");

  // Errores de Supabase en palabras de usuario
  function human(err) {
    var m = (err && err.message) || "";
    if (/Invalid login credentials/i.test(m)) return "Email o contraseña incorrectos.";
    if (/Email not confirmed/i.test(m)) return "Confirma tu email: te enviamos un enlace al crear la cuenta.";
    if (/already registered|already exists/i.test(m)) return "Ya hay una cuenta con ese email. Entra con él.";
    if (/at least|password/i.test(m)) return "La contraseña necesita al menos 8 caracteres.";
    if (/rate limit|too many/i.test(m)) return "Demasiados intentos. Espera un minuto y vuelve a probar.";
    return "No se ha podido completar. Inténtalo de nuevo.";
  }
  function busy(form, on) { form.querySelectorAll("button").forEach(function (b) { b.disabled = on; }); }

  // Si ya hay sesión, directo al Garage (salvo que venga a cambiar la contraseña)
  A.client.auth.onAuthStateChange(function (event) {
    if (event === "PASSWORD_RECOVERY") {
      tabs.in[1].hidden = true; tabs.up[1].hidden = true; $("f-new").hidden = false;
      say("");
    }
  });
  A.session().then(function (s) { if (s && !location.hash.includes("type=recovery") && params.get("reset") !== "1") go(); });

  $("f-in").addEventListener("submit", async function (e) {
    e.preventDefault();
    var email = $("in-email").value.trim(), pass = $("in-pass").value;
    if (!email || !pass) return say("Escribe tu email y tu contraseña.", "err");
    busy(this, true); say("Entrando…");
    var r = await A.client.auth.signInWithPassword({ email: email, password: pass });
    busy(this, false);
    if (r.error) return say(human(r.error), "err");
    go();
  });

  $("f-up").addEventListener("submit", async function (e) {
    e.preventDefault();
    var email = $("up-email").value.trim(), pass = $("up-pass").value;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return say("Revisa el email.", "err");
    if (pass.length < 8) return say("La contraseña necesita al menos 8 caracteres.", "err");
    if (!$("up-legal").checked) return say("Para crear la cuenta tienes que aceptar los términos y la privacidad.", "err");
    busy(this, true); say("Creando la cuenta…");
    var r = await A.client.auth.signUp({ email: email, password: pass, options: { emailRedirectTo: location.origin + next } });
    busy(this, false);
    if (r.error) return say(human(r.error), "err");
    if (r.data && r.data.session) return go();
    say("Cuenta creada. Te hemos enviado un email para confirmarla: abre el enlace y entrarás al Garage.", "ok");
  });

  $("google").addEventListener("click", async function () {
    say("Abriendo Google…");
    var r = await A.client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + next } });
    if (r.error) say(human(r.error), "err");
  });

  $("forgot").addEventListener("click", async function () {
    var email = $("in-email").value.trim();
    if (!email) return say("Escribe tu email arriba y vuelve a pulsar.", "err");
    var r = await A.client.auth.resetPasswordForEmail(email, { redirectTo: location.origin + "/acceso?reset=1" });
    if (r.error) return say(human(r.error), "err");
    say("Si hay una cuenta con ese email, te llegará un enlace para cambiar la contraseña.", "ok");
  });

  $("f-new").addEventListener("submit", async function (e) {
    e.preventDefault();
    var pass = $("new-pass").value;
    if (pass.length < 8) return say("La contraseña necesita al menos 8 caracteres.", "err");
    busy(this, true);
    var r = await A.client.auth.updateUser({ password: pass });
    busy(this, false);
    if (r.error) return say(human(r.error), "err");
    say("Contraseña cambiada. Entrando…", "ok");
    setTimeout(go, 800);
  });
})();
