/* =========================================================
   LIO TWEAKS — Keyboard & Mouse Lab
   ========================================================= */
(function (LT) {
  const { $, esc } = LT;
  const MAP = { dpi: "kmDpi", sens: "kmSens", poll: "kmPoll", style: "kmStyle", layout: "kmLayout", lang: "kmLang", binds: "kmBinds" };
  const LABEL = {
    style: { tracking: "Tracking aim", flicking: "Flicking aim", balanced: "Balanced", builder: "Heavy builder" },
    layout: { full: "Full size", tkl: "Tenkeyless", "75": "75%", "65": "65%", "60": "60%" },
    binds: { default: "Game defaults", custom: "Custom around WASD", mouse: "Custom + mouse side buttons", lefty: "Left-handed" }
  };
  let lastSettings = null, renderSaveCard = null;

  const read = () => ({
    dpi: +$("#kmDpi").value, sens: +$("#kmSens").value, poll: +$("#kmPoll").value,
    style: $("#kmStyle").value, layout: $("#kmLayout").value, lang: $("#kmLang").value, binds: $("#kmBinds").value
  });
  const write = (s) => Object.entries(MAP).forEach(([k, id]) => { if (s[k] !== undefined) $("#" + id).value = s[k]; });

  function movementKeys(s) {
    if (s.binds === "lefty") return { move: "I J K L (or the arrow keys)", near: ["U", "O", "H", "; (semicolon)", "N", "M", "P"] };
    if (s.lang === "azerty") return { move: "Z Q S D", near: ["A", "E", "R", "F", "C", "X", "W", "Shift"] };
    return { move: "W A S D", near: ["Q", "E", "R", "F", "C", s.lang === "qwertz" ? "Y (left of X)" : "Z", "X", "Shift"] };
  }

  function render(s) {
    const edpi = Math.round(s.dpi * s.sens * 100) / 100;
    const dpiTips = [];
    if (s.dpi < 400) dpiTips.push("Very low DPI can make menus and desktop use feel slow. 400–1600 is the most common range.");
    else if (s.dpi > 3200) dpiTips.push("Very high DPI means tiny in-game sensitivity values. It works, but many players find 400–1600 easier to keep consistent.");
    else dpiTips.push(`${s.dpi} DPI is in a comfortable range. Keep it fixed and change sensitivity in-game instead.`);
    dpiTips.push("DPI is how far the cursor moves per inch of mouse movement. Higher DPI isn't 'better' — it just changes the scale.");
    dpiTips.push("Turn off Windows 'Enhance pointer precision' (Settings › Bluetooth & devices › Mouse › Additional mouse settings) so movement stays consistent.");

    const sensTips = {
      tracking: "Tracking players (following a moving target) often feels easier at a slightly higher sensitivity with smooth arm-and-wrist movement.",
      flicking: "Flick aim usually benefits from a lower sensitivity using more arm movement — it's more forgiving when you overshoot.",
      balanced: "Choose a sensitivity where a comfortable arm swipe turns you about 180° — fast enough to react, slow enough to aim.",
      builder: "Builders usually keep normal aim sensitivity and raise the build and edit multipliers for fast turns while building."
    };

    const pollTips = [];
    if (s.poll < 500) pollTips.push("125Hz is low for gaming. Set 1000Hz in your mouse software for smoother tracking.");
    else if (s.poll <= 1000) pollTips.push(`${s.poll}Hz is the standard for gaming mice and a good choice.`);
    else pollTips.push(`${s.poll}Hz can feel slightly smoother but uses more CPU. If games stutter, try 1000Hz. Only use it if your mouse officially supports it.`);

    const keys = movementKeys(s);
    const bindTips = [`Movement: <b>${esc(keys.move)}</b>.`,
      `Best keys for building and abilities: <b>${keys.near.map(esc).join(", ")}</b> — reachable without leaving movement.`];
    if (s.binds === "mouse") bindTips.push("Put your two most-used actions (for example edit and a build piece) on the mouse side buttons.");
    if (s.binds === "default") bindTips.push("Default binds are fine to start. Rebind one action at a time once you find a key that's awkward.");
    if (s.binds === "lefty") bindTips.push("For left-handed setups, a full-size or TKL keyboard rotated slightly gives your right hand more room.");
    if (["60", "65"].includes(s.layout)) bindTips.push("Compact keyboards don't have every key — avoid binding gameplay actions to F-keys or keys that need the Fn layer.");
    if (["full", "tkl"].includes(s.layout)) bindTips.push("If your mouse hits the keyboard at low sensitivity, a smaller layout (TKL, 75% or 65%) frees up space.");

    $("#kmResults").innerHTML =
      LT.block("Your setup", `<dl class="kv"><dt>Mouse DPI</dt><dd>${s.dpi}</dd><dt>In-game sensitivity</dt><dd>${s.sens}</dd>
        <dt>Effective sensitivity</dt><dd>${edpi} <span class="muted small">(DPI × sensitivity)</span></dd>
        <dt>Polling rate</dt><dd>${s.poll}Hz</dd><dt>Playstyle</dt><dd>${LABEL.style[s.style]}</dd>
        <dt>Keyboard</dt><dd>${LABEL.layout[s.layout]} · ${s.lang.toUpperCase()}</dd><dt>Keybinds</dt><dd>${LABEL.binds[s.binds]}</dd></dl>
        <p class="disclaimer">Effective sensitivity lets you compare your own setups in the same game. Each game calculates sensitivity differently, so it can't be copied directly between games.</p>`) +
      LT.block("Sensitivity", `<p style="margin:0">${esc(sensTips[s.style])}</p>`) +
      LT.block("DPI", LT.list(dpiTips.map(esc))) +
      LT.block("Polling rate", LT.list(pollTips.map(esc))) +
      LT.block("Keybind suggestions", LT.list(bindTips)) +
      LT.block("Keyboard tips", LT.list([
        "Keep your keyboard angled slightly so your wrist stays straight.",
        "Turn off the Windows key in your keyboard software (gaming mode) so you don't tab out mid-fight.",
        "Turn off Sticky Keys shortcuts: Settings › Accessibility › Keyboard."
      ].map(esc)));
  }

  function generate() {
    const s = read(), msg = $("#kmMsg");
    LT.clearInvalid($("#kmForm")); LT.msg(msg, "");
    if (!Number.isFinite(s.dpi) || s.dpi < 100 || s.dpi > 32000) return LT.invalid($("#kmDpi"), msg, "Enter a DPI between 100 and 32,000.");
    if (!Number.isFinite(s.sens) || s.sens <= 0 || s.sens > 100) return LT.invalid($("#kmSens"), msg, "Enter your in-game sensitivity (a number above 0).");
    render(s);
    lastSettings = s;
    renderSaveCard = LT.profiles.mountSaveCard($("#kmSaveCard"), "keyboard_mouse", () => lastSettings, () => `${s.dpi} DPI ${LABEL.style[s.style]}`);
    LT.msg(msg, "Recommendations ready.", "ok");
    return true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("#kmForm").addEventListener("submit", (e) => { e.preventDefault(); if (generate() && window.innerWidth < 900) $("#kmResults").scrollIntoView({ behavior: "smooth" }); });
  });

  LT.profiles.appliers.keyboard_mouse = (settings) => { write(settings); generate(); };
  LT.on("auth", () => { if (renderSaveCard) renderSaveCard(); });
  LT.on("loaded-cleared", (t) => { if (t === "keyboard_mouse" && renderSaveCard) renderSaveCard(); });

  LT.routes.kbm = {
    onEnter() {
      LT.markRecent("#/kbm", "Keyboard & Mouse Lab");
      LT.profiles.applyPending("keyboard_mouse");
      LT.profiles.showLoadedBanner("keyboard_mouse", $("#kmLoaded"));
    }
  };
})(window.LT);
