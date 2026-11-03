/* =========================================================
   LIO TWEAKS — Controller Lab
   ========================================================= */
(function (LT) {
  const { $, $$, esc } = LT;
  const MAP = { type: "ctType", look: "ctLook", aim: "ctAim", build: "ctBuild", edit: "ctEdit", ldz: "ctLdz", rdz: "ctRdz", layout: "ctLayout", style: "ctStyle", aimPref: "ctAimPref" };
  const NUMERIC = ["look", "aim", "build", "edit", "ldz", "rdz"];
  const LABELS = {
    type: { playstation: "PlayStation controller", xbox: "Xbox controller", other: "Other controller" },
    layout: { "builder-pro": "Builder Pro", "combat-pro": "Combat Pro", "quick-builder": "Quick Builder", default: "Default", custom: "Custom / paddles" },
    style: { aggressive: "Aggressive", balanced: "Balanced", defensive: "Defensive", builder: "Heavy builder", zerobuild: "Zero Build" },
    aimPref: { exponential: "Smooth / exponential", linear: "Direct / linear" }
  };
  const BASE = {
    aggressive: { look: 60, aim: 50, build: 70, edit: 72, ldz: 8, rdz: 6 },
    balanced: { look: 50, aim: 45, build: 60, edit: 62, ldz: 10, rdz: 8 },
    defensive: { look: 42, aim: 36, build: 52, edit: 55, ldz: 10, rdz: 8 },
    builder: { look: 55, aim: 45, build: 82, edit: 85, ldz: 8, rdz: 6 },
    zerobuild: { look: 52, aim: 44, build: 50, edit: 50, ldz: 10, rdz: 7 }
  };
  let lastSettings = null, renderSaveCard = null, lastRec = null;

  const read = () => {
    const s = {};
    Object.entries(MAP).forEach(([k, id]) => { s[k] = NUMERIC.includes(k) ? +$("#" + id).value : $("#" + id).value; });
    return s;
  };
  const write = (s) => {
    Object.entries(MAP).forEach(([k, id]) => { if (s[k] !== undefined) $("#" + id).value = s[k]; });
    syncOutputs();
  };
  function syncOutputs() {
    $$("#ctForm input[type=range]").forEach(r => {
      const out = r.parentElement.querySelector("output");
      out.textContent = r.value + (/dz/i.test(r.id) ? "%" : "");
    });
  }

  function recommend(s) {
    const r = { ...BASE[s.style] };
    if (s.aimPref === "linear") { r.look -= 5; r.aim -= 4; }
    if (s.type === "other") { r.ldz += 2; r.rdz += 2; }
    return r;
  }

  function render(s) {
    const r = recommend(s);
    lastRec = r;
    const diff = (k, unit = "") => {
      const d = s[k] - r[k];
      if (Math.abs(d) <= 3) return `<span class="y">${s[k]}${unit}</span> <span class="muted small">(on target)</span>`;
      return `${s[k]}${unit} → <b class="y">${r[k]}${unit}</b> <span class="muted small">(${d > 0 ? "lower" : "raise"} by ${Math.abs(d)})</span>`;
    };
    const rows = [
      ["Look sensitivity", diff("look")], ["Aim sensitivity", diff("aim")],
      ["Build sensitivity", diff("build")], ["Edit sensitivity", diff("edit")],
      ["Left stick deadzone", diff("ldz", "%")], ["Right stick deadzone", diff("rdz", "%")]
    ];
    const tips = [];
    if (s.rdz < 5 || s.ldz < 5) tips.push("Very low deadzones feel fast but show stick drift. If your view moves on its own, raise the deadzone 1–2% at a time.");
    if (s.rdz > 15) tips.push("A right-stick deadzone above 15% can make small aim adjustments feel sluggish. Lower it unless you need it for drift.");
    if (s.aim > s.look) tips.push("Aim sensitivity is usually set a little lower than look sensitivity so aiming down sights stays precise.");
    if (s.style === "builder" && s.build < 65) tips.push("Heavy builders usually benefit from a higher build multiplier so turning while building stays quick.");
    if (s.style === "zerobuild") tips.push("In Zero Build, focus on look and aim sensitivity — build and edit values matter less.");
    if (s.layout === "custom") tips.push("With paddles, map jump and your most-used build or edit button to the back so your thumb stays on the right stick.");
    if (s.layout === "quick-builder") tips.push("Quick Builder is easier to learn. If you build a lot, Builder Pro is worth practicing later.");
    if (s.aimPref === "linear") tips.push("Linear response is direct but harder to control for small movements — that's why the recommended values are a bit lower.");
    tips.push("Change one value at a time and play a few sessions before judging it.");

    $("#ctResults").innerHTML =
      LT.block("Your controller profile", `<dl class="kv"><dt>Controller</dt><dd>${LABELS.type[s.type]}</dd>
        <dt>Layout</dt><dd>${LABELS.layout[s.layout]}</dd><dt>Playstyle</dt><dd>${LABELS.style[s.style]}</dd>
        <dt>Aim preference</dt><dd>${LABELS.aimPref[s.aimPref]}</dd></dl>`) +
      LT.block("Your values vs recommended starting points",
        '<table class="settings-table"><tbody>' + rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("") + "</tbody></table>" +
        '<div class="btn-row"><button type="button" class="btn small" id="ctApplyRec">Apply Recommended Values</button></div>') +
      LT.block("Tips for your setup", LT.list(tips.map(esc))) +
      `<p class="disclaimer">These are starting points on a 1–100 scale. Every game uses its own scale — match the closest setting, then adjust to feel. These settings don't change your controller automatically.</p>`;
    $("#ctApplyRec").onclick = () => { write({ ...read(), ...lastRec }); generate(); LT.toast("Recommended values applied — save to keep them."); };
  }

  function generate() {
    const s = read();
    LT.msg("#ctMsg", "");
    render(s);
    lastSettings = s;
    renderSaveCard = LT.profiles.mountSaveCard($("#ctSaveCard"), "controller", () => lastSettings,
      () => `${LABELS.style[s.style]} ${s.type === "playstation" ? "PS" : s.type === "xbox" ? "Xbox" : "Controller"}`);
    LT.msg("#ctMsg", "Profile ready.", "ok");
  }

  /* ---------- Pro presets (loaded from the server only for Pro members) ---------- */
  async function renderPresets() {
    const box = $("#ctProPresets");
    box.classList.remove("hidden");
    if (!LT.isPro()) {
      box.innerHTML = `<h3>⭐ Pro controller presets</h3><p>Pro members get advanced presets — builder, Zero Build tracking, precision and drift-safe setups — that apply in one click.</p>
        <a class="btn yellow small" href="#/pro">See Lio Tweaks Pro</a>`;
      return;
    }
    box.innerHTML = '<h3>⭐ Pro controller presets</h3><div class="spinner"></div>';
    const { data, error } = await LT.sb.from("pro_content").select("id, title, summary, body").eq("kind", "preset").eq("tool", "controller").order("sort");
    if (error || !data) { box.innerHTML = '<h3>⭐ Pro controller presets</h3><p class="msg err">Couldn\'t load presets. Please refresh.</p>'; return; }
    box.innerHTML = '<h3>⭐ Pro controller presets</h3><div class="profile-list">' + data.map(p => `
      <div class="profile-item"><div><div class="p-name">${esc(p.title)}</div><div class="p-meta">${esc(p.summary)}</div></div>
      <div class="btn-row"><button type="button" class="btn small yellow" data-preset="${esc(p.id)}">Apply</button></div></div>`).join("") + "</div>";
    $$("[data-preset]", box).forEach(b => b.onclick = () => {
      const p = data.find(x => x.id === b.dataset.preset);
      write({ ...read(), ...(p.body?.settings || {}) });
      generate();
      LT.toast(`Applied "${p.title}"`);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    $$("#ctForm input[type=range]").forEach(r => r.addEventListener("input", syncOutputs));
    $("#ctForm").addEventListener("submit", (e) => { e.preventDefault(); generate(); if (window.innerWidth < 900) $("#ctResults").scrollIntoView({ behavior: "smooth" }); });
    syncOutputs();
  });

  LT.profiles.appliers.controller = (settings) => { write(settings); generate(); };
  LT.on("auth", () => { if (renderSaveCard) renderSaveCard(); if (LT.currentRoute() === "controller") renderPresets(); });
  LT.on("loaded-cleared", (t) => { if (t === "controller" && renderSaveCard) renderSaveCard(); });

  LT.routes.controller = {
    onEnter() {
      LT.markRecent("#/controller", "Controller Lab");
      LT.profiles.applyPending("controller");
      LT.profiles.showLoadedBanner("controller", $("#ctLoaded"));
      renderPresets();
    }
  };
})(window.LT);
