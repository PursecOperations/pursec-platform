/* PURSEC — web v3. Sin dependencias.
   Solo hay lista de espera: se guarda en Supabase con la clave publicable (RLS).
   Aquí no hay ninguna clave secreta. */
(() => {
"use strict";

const SUPABASE_URL = "https://uymgrzlbpaqorbwajhfh.supabase.co";
const SUPABASE_KEY = "sb_publishable_aKv-FR4J-9LYHz45Np-u_Q_TUoF9ybe";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const page = document.body.dataset.page || "";

/* =================================================================== cabecera y pie */
function chrome() {
  const hdr = $("[data-header]");
  if (hdr) hdr.outerHTML = `
  <a class="skip" href="#main">Skip to content</a>
  <header class="hdr" id="hdr">
    <a class="brand" href="/" aria-label="PURSEC — home"><img src="/img/brand/pursec-white.svg" width="1612" height="403" alt="PURSEC"></a>
    <a class="join" href="${page === "home" ? "#list" : "/#list"}">Join the list</a>
  </header>`;

  const ftr = $("[data-footer]");
  if (ftr) ftr.outerHTML = `
  <footer class="ftr">
    <img class="mega" src="/img/brand/pursec-red.svg" width="1612" height="403" alt="" loading="lazy" data-reveal>
    <div class="base mono">
      <span>© ${new Date().getFullYear()} PURSEC</span>
      <span><a href="/legal">Legal</a> · <a href="mailto:hola@pursec.club">hola@pursec.club</a></span>
    </div>
  </footer>`;

  // barra roja bajo la cabecera: avanza con el scroll
  const h = $("#hdr");
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    h.style.setProperty("--p", max > 0 ? Math.min(1, scrollY / max).toFixed(4) : 0);
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
}

/* =================================================================== lista de espera */
function bindWaitlists() {
  $$("form[data-waitlist]").forEach((f) => f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $(".form-msg", f), btn = $("button[type=submit]", f), input = $("input[type=email]", f), consent = $("input[type=checkbox]", f);
    const email = input.value.trim();
    msg.className = "form-msg"; msg.textContent = "";
    if (!email || !input.checkValidity()) { msg.className = "form-msg err"; msg.textContent = "Enter a valid email."; return; }
    if (consent && !consent.checked) { msg.className = "form-msg err"; msg.textContent = "Please accept the privacy policy to join."; return; }
    btn.disabled = true;
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ email, lang: "en", source: f.dataset.waitlist || "web" }),
      });
      if (!r.ok && r.status !== 409) throw new Error(String(r.status));
      msg.className = "form-msg ok"; msg.textContent = "You're on the list. We'll email you when we open.";
      input.value = "";
    } catch { msg.className = "form-msg err"; msg.textContent = "Could not join right now. Try again in a minute."; }
    finally { btn.disabled = false; }
  }));
}

/* =================================================================== aparición al hacer scroll */
function reveals() {
  const els = $$("[data-reveal]");
  if (reduce || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
  const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  els.forEach((e) => io.observe(e));
}

chrome();
bindWaitlists();
reveals();
})();
