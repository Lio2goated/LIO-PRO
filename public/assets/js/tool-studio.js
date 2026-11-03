/* =========================================================
   LIO TWEAKS — Controller Studio (2D live preview)
   Original Lio Tweaks controller shape. Visual concept only.
   ========================================================= */
(function (LT) {
  const { $, $$, esc } = LT;
  const FIELDS = { shell: "stShell", buttons: "stButtons", sticks: "stSticks", touchpad: "stTouchpad", accent: "stAccent", logo: "stLogo", paddles: "stPaddles" };
  const THEMES = {
    "Lio Classic": { shell: "#151515", buttons: "#ef2525", sticks: "#ffd600", touchpad: "#222222", accent: "#ef2525" },
    "Inferno": { shell: "#8b0d0d", buttons: "#ffd600", sticks: "#111111", touchpad: "#2a0606", accent: "#ffd600" },
    "Stealth": { shell: "#1c1c1c", buttons: "#3a3a3a", sticks: "#111111", touchpad: "#262626", accent: "#555555" },
    "Gold Rush": { shell: "#111111", buttons: "#ffd600", sticks: "#ffd600", touchpad: "#1a1a1a", accent: "#ffd600" },
    "Arctic": { shell: "#e9edf2", buttons: "#ef2525", sticks: "#1a1a1a", touchpad: "#cfd6de", accent: "#ef2525" }
  };
  const PALETTE = ["#151515", "#ef2525", "#ffd600", "#ffffff", "#2a2a2a", "#8b0d0d", "#1e64ff", "#22c55e"];
  let theme = "Lio Classic";

  const read = () => {
    const d = {};
    Object.entries(FIELDS).forEach(([k, id]) => d[k] = $("#" + id).value);
    d.logo = d.logo.trim().slice(0, 14) || "LIO TWEAKS";
    d.theme = theme;
    return d;
  };
  const write = (d) => {
    Object.entries(FIELDS).forEach(([k, id]) => { if (d[k] !== undefined) $("#" + id).value = d[k]; });
    if (d.theme) theme = d.theme;
    draw();
  };

  function isLight(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) > 150;
  }

  function draw() {
    const d = read();
    const ink = isLight(d.shell) ? "#111" : "#f2f2f2";
    const btnInk = isLight(d.buttons) ? "#111" : "#fff";
    const pads = +d.paddles;
    const paddleRects = [];
    if (pads >= 2) paddleRects.push([92, 300, -14], [488, 300, 14]);
    if (pads >= 4) paddleRects.push([122, 290, -8], [458, 290, 8]);

    $("#studioStage").innerHTML = `
<svg viewBox="0 0 600 390" role="img" aria-label="Controller preview">
  <defs>
    <linearGradient id="shellShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/>
    </linearGradient>
    <radialGradient id="stickShade" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></radialGradient>
  </defs>
  ${paddleRects.map(([x, y, rot]) => `<rect x="${x}" y="${y}" width="22" height="62" rx="9" fill="${d.accent}" stroke="#000" stroke-opacity=".4" transform="rotate(${rot} ${x + 11} ${y + 31})"/>`).join("")}
  <rect x="118" y="50" width="122" height="30" rx="14" fill="${d.accent}"/>
  <rect x="360" y="50" width="122" height="30" rx="14" fill="${d.accent}"/>
  <path d="M170 70 H430 C500 70 540 100 560 170 C585 260 580 330 530 345 C490 357 465 330 445 300 C425 270 400 255 360 255 H240 C200 255 175 270 155 300 C135 330 110 357 70 345 C20 330 15 260 40 170 C60 100 100 70 170 70 Z"
        fill="${d.shell}" stroke="${d.accent}" stroke-width="4"/>
  <path d="M170 70 H430 C500 70 540 100 560 170 C585 260 580 330 530 345 C490 357 465 330 445 300 C425 270 400 255 360 255 H240 C200 255 175 270 155 300 C135 330 110 357 70 345 C20 330 15 260 40 170 C60 100 100 70 170 70 Z" fill="url(#shellShade)"/>
  <rect x="232" y="84" width="136" height="70" rx="14" fill="${d.touchpad}" stroke="${d.accent}" stroke-opacity=".6" stroke-width="2"/>
  <rect x="250" y="80" width="100" height="4" rx="2" fill="${d.accent}"/>
  <rect x="198" y="96" width="22" height="10" rx="5" fill="${ink}" opacity=".55"/>
  <rect x="380" y="96" width="22" height="10" rx="5" fill="${ink}" opacity=".55"/>
  <g fill="${d.buttons}">
    <rect x="153" y="130" width="24" height="80" rx="6"/><rect x="125" y="158" width="80" height="24" rx="6"/>
  </g>
  <g>
    ${[[435, 132], [473, 170], [435, 208], [397, 170]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" fill="${d.buttons}" stroke="#000" stroke-opacity=".35" stroke-width="2"/><circle cx="${x}" cy="${y}" r="5" fill="${btnInk}" opacity=".35"/>`).join("")}
  </g>
  ${[[222, 212], [378, 212]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="31" fill="#0b0b0b"/><circle cx="${x}" cy="${y}" r="24" fill="${d.sticks}"/><circle cx="${x}" cy="${y}" r="24" fill="url(#stickShade)"/><circle cx="${x}" cy="${y}" r="15" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="2"/>`).join("")}
  <text x="300" y="181" text-anchor="middle" font-family="Chakra Petch, Arial Black, sans-serif" font-size="15" font-weight="700" letter-spacing="2" fill="${ink}">${esc(d.logo)}</text>
  <circle cx="300" cy="232" r="9" fill="${d.accent}"/>
  ${pads ? `<text x="300" y="380" text-anchor="middle" font-family="Inter, Arial" font-size="12" fill="#888">${pads} rear paddles shown below the grips</text>` : ""}
</svg>`;
    $("#studioLabel").textContent = `${theme} theme · ${d.logo} · ${pads ? pads + " back paddles" : "no paddles"}`;
    $$("#stThemes label").forEach(l => l.querySelector("input").checked = l.dataset.theme === theme);
    $$(".swatches").forEach(sw => {
      const val = $("#" + sw.dataset.for).value.toLowerCase();
      $$(".swatch", sw).forEach(b => b.classList.toggle("active", b.dataset.c === val));
    });
  }

  /* ---------- Saving ---------- */
  async function save(update) {
    const msg = $("#stMsg"), d = read();
    const name = $("#stName").value.trim() || `${d.theme} design`;
    LT.msg(msg, "");
    if (!LT.state.user) {
      try {
        localStorage.setItem("lt_studio_design", JSON.stringify({ ...d, name }));
        LT.msg(msg, "Saved on this device. Log in to save designs to your account.", "ok");
      } catch (e) { LT.msg(msg, "Couldn't save on this device (storage blocked). Log in to save to your account.", "err"); }
      return;
    }
    const btn = update ? $("#stUpdate") : $("#stSave");
    LT.busy(btn, true);
    try {
      if (update && LT.profiles.loaded.studio_design) {
        await LT.profiles.update(LT.profiles.loaded.studio_design.id, { profile_name: name, settings: d });
        LT.toast("Design updated");
      } else {
        LT.profiles.loaded.studio_design = await LT.profiles.create("studio_design", name, d);
        LT.toast(`Saved "${name}" to your account`);
      }
      syncLoaded();
    } catch (e) { LT.msg(msg, e.message, "err"); }
    LT.busy(btn, false);
  }

  function syncLoaded() {
    const p = LT.profiles.loaded.studio_design;
    $("#stUpdate").classList.toggle("hidden", !p);
    if (p) { $("#stUpdate").textContent = `Update "${p.profile_name}"`; $("#stUpdate").dataset.label = $("#stUpdate").textContent; }
    LT.profiles.showLoadedBanner("studio_design", $("#stLoaded"));
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("#stThemes").innerHTML = Object.keys(THEMES).map(n => `<label data-theme="${esc(n)}"><input type="radio" name="stTheme" value="${esc(n)}"><span>${esc(n)}</span></label>`).join("");
    $$("#stThemes input").forEach(i => i.addEventListener("change", () => { theme = i.value; write({ ...THEMES[theme], theme }); }));
    $$(".swatches").forEach(sw => {
      sw.innerHTML = PALETTE.map(c => `<button type="button" class="swatch" data-c="${c}" style="background:${c}" aria-label="Color ${c}"></button>`).join("");
      sw.addEventListener("click", (e) => {
        const b = e.target.closest(".swatch"); if (!b) return;
        $("#" + sw.dataset.for).value = b.dataset.c; theme = "Custom"; draw();
      });
    });
    Object.values(FIELDS).forEach(id => $("#" + id).addEventListener("input", () => { if (id !== "stLogo" && id !== "stPaddles") theme = "Custom"; draw(); }));
    $("#stSave").addEventListener("click", () => save(false));
    $("#stUpdate").addEventListener("click", () => save(true));
    // Restore a design saved on this device
    try {
      const local = JSON.parse(localStorage.getItem("lt_studio_design") || "null");
      if (local) { write(local); if (local.name) $("#stName").value = local.name; }
    } catch (e) { /* ignore */ }
    draw();
  });

  LT.profiles.appliers.studio_design = (settings, profile) => { write(settings); $("#stName").value = profile.profile_name; };
  LT.on("loaded-cleared", (t) => { if (t === "studio_design") syncLoaded(); });
  LT.on("auth", () => syncLoaded());

  LT.routes.studio = {
    onEnter() {
      LT.markRecent("#/studio", "Controller Studio");
      LT.profiles.applyPending("studio_design");
      syncLoaded();
    }
  };
})(window.LT);
