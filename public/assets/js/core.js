/* =========================================================
   LIO TWEAKS — core helpers + router
   Every other file adds itself to the shared LT object.
   ========================================================= */
window.LT = (function () {
  const LT = {
    config: window.LT_CONFIG,
    state: { user: null, membership: "free", authReady: false },
    routes: {},          // name -> { onEnter(param) }
    _listeners: {}
  };

  /* ---------- DOM helpers ---------- */
  LT.$ = (sel, root = document) => root.querySelector(sel);
  LT.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  LT.esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  LT.list = (items) => "<ul>" + items.map(i => `<li>${i}</li>`).join("") + "</ul>";   // items must already be safe HTML
  LT.block = (title, html, warn = false) => `<div class="result-block${warn ? " warn" : ""}"><h4>${LT.esc(title)}</h4>${html}</div>`;
  LT.table = (rows) => '<table class="settings-table"><tbody>' + rows.map(([k, v]) => `<tr><th>${LT.esc(k)}</th><td>${LT.esc(v)}</td></tr>`).join("") + "</tbody></table>";

  /* ---------- Events ---------- */
  LT.on = (name, fn) => { (LT._listeners[name] ||= []).push(fn); };
  LT.emit = (name, data) => (LT._listeners[name] || []).forEach(fn => { try { fn(data); } catch (e) { console.error(e); } });

  /* ---------- Feedback ---------- */
  LT.toast = (text, type = "ok") => {
    const el = document.createElement("div");
    el.className = "toast" + (type === "err" ? " err" : "");
    el.textContent = text;
    LT.$("#toast-stack").appendChild(el);
    setTimeout(() => el.remove(), 4200);
  };
  LT.msg = (el, text, type = "") => {
    if (typeof el === "string") el = LT.$(el);
    if (!el) return;
    el.textContent = text || "";
    el.className = "msg" + (type ? " " + type : "");
  };
  LT.busy = (btn, on, label) => {
    if (!btn) return;
    if (on) { btn.dataset.label = btn.textContent; btn.disabled = true; btn.classList.add("loading"); if (label) btn.textContent = label; }
    else { btn.disabled = false; btn.classList.remove("loading"); if (btn.dataset.label) btn.textContent = btn.dataset.label; }
  };

  /* ---------- Validation ---------- */
  LT.clearInvalid = (form) => LT.$$(".invalid", form).forEach(el => el.classList.remove("invalid"));
  LT.invalid = (el, msgEl, text) => { el.classList.add("invalid"); el.focus(); LT.msg(msgEl, text, "err"); return false; };
  LT.validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  /* ---------- Recently used tools (this device only) ---------- */
  LT.markRecent = (route, label) => {
    try {
      const list = JSON.parse(localStorage.getItem("lt_recent") || "[]").filter(x => x.route !== route);
      list.unshift({ route, label, at: Date.now() });
      localStorage.setItem("lt_recent", JSON.stringify(list.slice(0, 6)));
    } catch (e) { /* storage blocked — ignore */ }
  };
  LT.getRecent = () => { try { return JSON.parse(localStorage.getItem("lt_recent") || "[]"); } catch (e) { return []; } };

  /* ---------- Router (#/page/param) ---------- */
  const ALIASES = { "": "home", guides: "guides", games: "game" };
  LT.go = (hash) => { if (location.hash === hash) render(); else location.hash = hash; };
  LT.currentRoute = () => parseHash().name;

  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, "");
    // Supabase auth redirects put tokens/errors in the hash — treat those as home
    if (/^(access_token|error|type)=/.test(raw)) return { name: "home", param: "" };
    const clean = raw.split("?")[0];
    const [first = "", ...rest] = clean.split("/");
    let name = ALIASES[first] ?? first;
    const param = rest.join("/");
    if (first === "guides" && param) name = "guide";
    return { name, param: decodeURIComponent(param) };
  }

  function render() {
    const { name, param } = parseHash();
    const view = LT.$(`.view[data-view="${name}"]`) ? name : "notfound";
    LT.$$(".view").forEach(v => v.classList.toggle("active", v.dataset.view === view));
    const navName = { guide: "guides", game: "guides", pc: "tools", system: "tools", studio: "tools" }[view] || view;
    LT.$$("#mainNav a").forEach(a => a.classList.toggle("active", a.dataset.route === navName));
    LT.$("#mainNav").classList.remove("open");
    LT.$("#navToggle").setAttribute("aria-expanded", "false");
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    const r = LT.routes[view];
    if (r && r.onEnter) { try { r.onEnter(param); } catch (e) { console.error(e); } }
  }

  LT.startRouter = () => {
    window.addEventListener("hashchange", render);
    render();
  };

  /* ---------- Mobile nav ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    const toggle = LT.$("#navToggle"), nav = LT.$("#mainNav");
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    const y = LT.$("#year"); if (y) y.textContent = new Date().getFullYear();
  });

  return LT;
})();
