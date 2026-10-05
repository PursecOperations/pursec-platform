// PURSEC — sesión y acceso del Garage (script clásico; necesita antes el UMD de supabase-js).
//
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js"></script>
//   <script src="/js/pursec-auth.js"></script>
//
// La clave publicable es pública por diseño. Lo que de verdad protege el contenido de pago es RLS en Supabase
// (has_trackside()); esto solo decide qué se pinta y a dónde se redirige.
(function () {
  var SUPABASE_URL = "https://uymgrzlbpaqorbwajhfh.supabase.co";
  var SUPABASE_KEY = "sb_publishable_aKv-FR4J-9LYHz45Np-u_Q_TUoF9ybe";

  if (!window.supabase || !window.supabase.createClient) {
    console.error("PURSEC: falta supabase-js");
    return;
  }
  var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
  });

  var profileCache = null;

  async function session() {
    var r = await client.auth.getSession();
    return r.data ? r.data.session : null;
  }

  async function profile(force) {
    if (profileCache && !force) return profileCache;
    var s = await session();
    if (!s) return null;
    var r = await client
      .from("profiles")
      .select("email, plan, role, subscription_status, billing_interval, trial_end, current_period_end, cancel_at_period_end")
      .maybeSingle();
    profileCache = r.data || { email: s.user.email, plan: "PADDOCK", role: "member", subscription_status: "none" };
    return profileCache;
  }

  // "owner" | "trackside" | "paddock"
  function tierOf(p) {
    if (!p) return "paddock";
    if (p.role === "owner") return "owner";
    if (p.plan === "TRACKSIDE" && (p.subscription_status === "active" || p.subscription_status === "trialing")) return "trackside";
    return "paddock";
  }

  function safeNext(n) {
    return typeof n === "string" && n.charAt(0) === "/" && n.charAt(1) !== "/" ? n : "/garage/";
  }

  // Para las páginas del Garage: sin sesión, a /acceso con vuelta a esta página.
  async function requireMember() {
    var s = await session();
    if (!s) {
      var next = location.pathname + location.search;
      location.replace("/acceso?next=" + encodeURIComponent(next));
      return null;
    }
    var p = await profile();
    var t = tierOf(p);
    document.documentElement.setAttribute("data-tier", t);
    paintAccount(p, t);
    return { session: s, profile: p, tier: t, full: t !== "paddock" };
  }

  // Rellena los elementos con data-acc-* del Garage
  function paintAccount(p, t) {
    var label = t === "owner" ? "Owner" : t === "trackside" ? "TRACKSIDE" : "PADDOCK";
    document.querySelectorAll("[data-acc-plan]").forEach(function (el) {
      el.textContent = label;
      el.setAttribute("data-plan", t);
    });
    document.querySelectorAll("[data-acc-email]").forEach(function (el) { el.textContent = (p && p.email) || ""; });
    document.querySelectorAll("[data-acc-upsell]").forEach(function (el) { el.hidden = t !== "paddock"; });
    document.querySelectorAll("[data-signout]").forEach(function (el) {
      el.addEventListener("click", async function (e) {
        e.preventDefault();
        await client.auth.signOut();
        location.replace("/");
      });
    });
  }

  window.PURSEC = window.PURSEC || {};
  window.PURSEC.auth = {
    client: client,
    session: session,
    profile: profile,
    tierOf: tierOf,
    safeNext: safeNext,
    requireMember: requireMember,
  };
})();
