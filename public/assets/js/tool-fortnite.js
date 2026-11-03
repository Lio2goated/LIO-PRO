/* =========================================================
   LIO TWEAKS — Fortnite Optimizer
   Starting recommendations only — no promised FPS gains.
   ========================================================= */
(function (LT) {
  const { $, esc } = LT;
  const FIELDS = ["fnPlatform", "fnCpu", "fnGpu", "fnRefresh", "fnRes", "fnGoal", "fnQuality", "fnInput"];
  const KEYS = ["platform", "cpu", "gpu", "refresh", "res", "goal", "quality", "input"];
  const PLATFORM = { pc: "PC", ps5: "PlayStation 5", xsx: "Xbox Series X", xss: "Xbox Series S", ps4: "PlayStation 4", xone: "Xbox One", switch: "Nintendo Switch" };
  const QUALITY = ["Low", "Medium", "High", "Epic"];
  let lastSettings = null, renderSaveCard = null;

  const read = () => Object.fromEntries(KEYS.map((k, i) => [k, $("#" + FIELDS[i]).value.trim()]));
  const write = (s) => KEYS.forEach((k, i) => { if (s[k] !== undefined) $("#" + FIELDS[i]).value = s[k]; });

  function togglePc() { $("#fnPcFields").classList.toggle("hidden", $("#fnPlatform").value !== "pc"); }

  function pcPlan(s) {
    const g = LT.gpuTier(s.gpu), c = LT.cpuTier(s.cpu);
    let power = g ?? 2;
    if (c !== null) power = Math.min(power, c + 1);
    power += { "1080": 0, "1440": -1, "2160": -2 }[s.res];
    power = Math.max(0, Math.min(4, power));

    // Start from the quality the player wants, then pull it toward what the goal + hardware support
    let q = QUALITY.indexOf(s.quality.charAt(0).toUpperCase() + s.quality.slice(1));
    if (s.goal === "fps") q = Math.min(q, 0 + (power >= 4 ? 1 : 0));
    if (s.goal === "balanced") q = Math.min(q, Math.max(1, power - 1) >= 3 ? 2 : 1);
    q = Math.min(q, Math.max(0, power - 1));
    const qName = QUALITY[q];

    const performanceMode = power <= 1 || (s.goal === "fps" && power <= 2);
    const brand = /rtx|gtx|nvidia|geforce/i.test(s.gpu) ? "nvidia" : /\brx\b|radeon|amd/i.test(s.gpu) ? "amd" : /arc|intel/i.test(s.gpu) ? "intel" : "unknown";
    const upscaler = brand === "nvidia" && /rtx/i.test(s.gpu) ? "NVIDIA DLSS" : "TSR (Epic's upscaler)";
    const competitive = s.goal === "fps";

    const display = [
      ["Window Mode", "Fullscreen"],
      ["Resolution", { "1080": "1920×1080", "1440": "2560×1440", "2160": "3840×2160" }[s.res] + " (native)"],
      ["V-Sync", "Off"],
      ["Frame Rate Limit", `${s.refresh} FPS` + (power <= 1 && +s.refresh > 60 ? " — or lower if it isn't steady" : "")],
      ["Rendering Mode", performanceMode ? "Performance (lower graphical fidelity)" : "DirectX 12"]
    ];
    const graphics = performanceMode ? [
      ["Quality presets", "Custom"],
      ["3D Resolution", power === 0 ? "75–85%" : "90–100%"],
      ["View Distance", "Medium or Far"],
      ["Textures", power === 0 ? "Low" : "Medium"],
      ["Anything else offered", "Lowest / Off"]
    ] : [
      ["Quality presets", "Custom (starting from " + qName + ")"],
      ["Anti-Aliasing & Super Resolution", power <= 2 ? `${upscaler} — performance-focused` : (competitive ? `${upscaler} — balanced` : `${upscaler} — quality, or native`)],
      ["3D Resolution", power <= 2 ? "Controlled by upscaler" : "100%"],
      ["View Distance", power >= 2 ? "Far" : "Medium"],
      ["Shadows", competitive || power <= 2 ? "Off" : (q >= 3 ? "High" : "Medium")],
      ["Global Illumination / Reflections", competitive || power <= 3 ? "Off / Low" : "Medium"],
      ["Textures", power >= 3 ? "High" : "Medium"],
      ["Effects", competitive ? "Low" : QUALITY[Math.min(q, 2)]],
      ["Post Processing", competitive ? "Low" : QUALITY[Math.min(q, 2)]],
      ["Motion Blur", "Off"]
    ];
    const latency = [];
    if (brand === "nvidia") latency.push(["NVIDIA Reflex Low Latency", competitive ? "On + Boost" : "On"]);
    latency.push(["Show FPS", "On while testing"]);

    return { power, display, graphics, latency, performanceMode, brand };
  }

  function consolePlan(s) {
    const next = ["ps5", "xsx", "xss"].includes(s.platform);
    const rows = [];
    if (next) {
      const can120 = +s.refresh >= 120;
      rows.push(["120 FPS Mode", can120 ? "On" : "Off (your display is 60Hz)"]);
      if (can120) rows.push(["Console 120Hz output", s.platform === "ps5" ? "Settings › Screen and Video › Video Output › 120Hz Output: Automatic" : "Settings › General › TV & display options › Refresh rate: 120Hz"]);
    } else {
      rows.push(["Frame rate", "Fortnite targets 30–60 FPS on this console; there's no 120 FPS mode"]);
    }
    rows.push(["Motion Blur", "Off"]);
    rows.push(["Show FPS (if listed)", "On while testing"]);
    rows.push(["TV picture mode", "Game Mode"]);
    return { next, rows };
  }

  function inputPlan(s) {
    if (s.input === "controller") {
      return {
        title: "Controller settings",
        rows: [
          ["Layout", s.goal === "fps" ? "Builder Pro (or Combat Pro for Zero Build)" : "Builder Pro or Quick Builder"],
          ["Look / targeting sensitivity", "Start mid-range, adjust in small steps"],
          ["Build & edit multipliers", "Slightly above default if building feels slow"],
          ["Left / right deadzone", "As low as possible without drift (often 5–12%)"],
          ["Look input curve", "Exponential for smoother small adjustments"]
        ],
        link: '<a href="#/controller">Fine-tune these in the Controller Lab →</a>'
      };
    }
    return {
      title: "Keyboard & mouse settings",
      rows: [
        ["Mouse DPI", "400–1600 in your mouse software (pick one and keep it)"],
        ["X / Y sensitivity", "Keep them equal to start"],
        ["Build & edit multipliers", "Slightly above 1.0 if building feels slow"],
        ["Keybinds", "Put build pieces and edit within reach of WASD or on mouse buttons"]
      ],
      link: '<a href="#/kbm">Get personalized binds in the Keyboard & Mouse Lab →</a>'
    };
  }

  function render(s) {
    let html = LT.block("Your setup", `<dl class="kv"><dt>Platform</dt><dd>${PLATFORM[s.platform]}</dd>
      ${s.platform === "pc" ? `<dt>CPU / GPU</dt><dd>${esc(s.cpu)} / ${esc(s.gpu)}</dd>` : ""}
      <dt>Display</dt><dd>${{ "1080": "1080p", "1440": "1440p", "2160": "4K" }[s.res]} at ${s.refresh}Hz</dd>
      <dt>Goal</dt><dd>${{ fps: "Maximum FPS", balanced: "Balanced", visuals: "Best visuals" }[s.goal]}</dd>
      <dt>Input</dt><dd>${s.input === "controller" ? "Controller" : "Keyboard & mouse"}</dd></dl>`);

    if (s.platform === "pc") {
      const p = pcPlan(s);
      html += LT.block("Display settings", LT.table(p.display));
      html += LT.block(p.performanceMode ? "Graphics settings — Performance Mode" : "Graphics settings", LT.table(p.graphics) +
        (p.performanceMode ? '<p class="disclaimer">Performance Mode lowers visual quality to make Fortnite much lighter. Fortnite asks you to restart after switching rendering mode.</p>' : ""));
      html += LT.block("Latency & testing", LT.table(p.latency));
      const win = [
        "Turn on Game Mode: Settings › Gaming › Game Mode.",
        "Confirm your monitor runs at " + s.refresh + "Hz: Settings › System › Display › Advanced display.",
        "On laptops, set Fortnite to High performance in Settings › System › Display › Graphics, and keep the charger plugged in.",
        "Update your graphics driver using " + ({ nvidia: "the NVIDIA App", amd: "AMD Software: Adrenalin Edition", intel: "Intel's graphics software" }[p.brand] || "your GPU maker's official app") + "."
      ];
      html += LT.block("Windows settings", LT.list(win.map(esc)));
    } else {
      const c = consolePlan(s);
      html += LT.block("Console & display settings", LT.table(c.rows));
      if (!c.next && +s.refresh >= 120) html += LT.block("Good to know", "<p style='margin:0'>Your display supports 120Hz, but this console can't output 120 FPS in Fortnite.</p>", true);
    }
    const inp = inputPlan(s);
    html += LT.block(inp.title, LT.table(inp.rows) + `<p class="disclaimer">${inp.link}</p>`);
    html += `<p class="disclaimer">These are starting recommendations, not guaranteed FPS gains. Fortnite's menus can change with updates. Test each change in Creative before a real match.</p>`;
    $("#fnResults").innerHTML = html;
  }

  function generate() {
    const s = read(), msg = $("#fnMsg");
    LT.clearInvalid($("#fnForm")); LT.msg(msg, "");
    if (s.platform === "pc") {
      if (s.cpu.length < 2) return LT.invalid($("#fnCpu"), msg, "Enter your processor so we can tailor PC settings.");
      if (s.gpu.length < 2) return LT.invalid($("#fnGpu"), msg, "Enter your graphics card so we can tailor PC settings.");
    }
    render(s);
    lastSettings = s;
    renderSaveCard = LT.profiles.mountSaveCard($("#fnSaveCard"), "fortnite", () => lastSettings,
      () => `${PLATFORM[s.platform]} ${s.goal === "fps" ? "Max FPS" : s.goal === "visuals" ? "Visuals" : "Balanced"}`);
    LT.msg(msg, "Settings ready.", "ok");
    return true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("#fnPlatform").addEventListener("change", togglePc);
    $("#fnForm").addEventListener("submit", (e) => { e.preventDefault(); if (generate() && window.innerWidth < 900) $("#fnResults").scrollIntoView({ behavior: "smooth" }); });
    togglePc();
  });

  LT.profiles.appliers.fortnite = (settings) => { write(settings); togglePc(); generate(); };
  LT.on("auth", () => { if (renderSaveCard) renderSaveCard(); });
  LT.on("loaded-cleared", (t) => { if (t === "fortnite" && renderSaveCard) renderSaveCard(); });

  LT.routes.fortnite = {
    onEnter() {
      LT.markRecent("#/fortnite", "Fortnite Optimizer");
      LT.profiles.applyPending("fortnite");
      LT.profiles.showLoadedBanner("fortnite", $("#fnLoaded"));
    }
  };
})(window.LT);
