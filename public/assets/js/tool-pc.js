/* =========================================================
   LIO TWEAKS — PC Analyzer
   Rule-based recommendations from what the user enters.
   It does NOT scan hardware and never invents FPS numbers.
   ========================================================= */
(function (LT) {
  const { $, esc } = LT;

  /* ---------- Hardware recognition (rough tiers, 0–4) ---------- */
  // 0 = integrated/very old, 1 = entry, 2 = lower-mid, 3 = mid, 4 = high-end
  const TIER_NAMES = ["Integrated / very entry-level", "Entry-level", "Lower mid-range", "Mid-range", "High-end"];

  LT.gpuTier = function (raw) {
    const s = String(raw || "").toLowerCase().replace(/\s+/g, " ");
    if (!s.trim()) return null;
    if (/(uhd|iris|hd graphics|intel graphics|arc graphics|vega \d|radeon( \(tm\))? graphics|radeon \d{3}m|integrated)/.test(s)) return 0;
    let m;
    if ((m = s.match(/rtx ?(\d{4})/))) {
      const n = +m[1], series = Math.floor(n / 1000), model = n % 100;
      if (series >= 3) { if (model >= 80) return 4; if (model >= 70) return series >= 4 ? 4 : 3; if (model >= 60) return 3; return 2; }
      if (series === 2) return model >= 70 ? 3 : 2;
    }
    if ((m = s.match(/gtx ?(\d{3,4})/))) {
      const n = +m[1];
      if (n >= 1660) return 2;
      if (n >= 1650) return 1;
      if (n >= 1070) return 2;
      if (n >= 1050) return 1;
      return 0;
    }
    if ((m = s.match(/rx ?(\d{3,4})/))) {
      const n = +m[1];
      if (n >= 9070) return 4;
      if (n >= 9000) return 3;
      if (n >= 7800 || (n >= 6800 && n < 7000)) return 4;
      if (n >= 7600 || (n >= 6600 && n < 7000)) return 3;
      if (n >= 5600 && n < 6000) return n >= 5700 ? 3 : 2;
      if (n >= 6400 && n < 6600) return 1;
      if (n >= 5500 && n < 5600) return 2;
      if (n >= 470 && n < 1000) return 1;
      return 1;
    }
    if ((m = s.match(/(arc )?([ab])(\d{3})/)) && /arc|a7|a5|b5|b7/.test(s)) {
      const n = +m[3];
      if (m[2] === "b") return 3;
      return n >= 700 ? 3 : n >= 500 ? 2 : 1;
    }
    if (/m[1-4]( pro| max| ultra)?/.test(s) && /apple|m[1-4]/.test(s)) return 2;
    return null;
  };

  LT.cpuTier = function (raw) {
    const s = String(raw || "").toLowerCase();
    if (!s.trim()) return null;
    let m, tier = null;
    if (/core ultra|ultra [579]/.test(s)) tier = 3;
    else if ((m = s.match(/ryzen ?([3579]) ?(\d)(\d)(\d{2})/))) {
      const cls = +m[1], gen = +m[2];
      if (gen >= 7) tier = cls >= 5 ? 3 : 2;
      else if (gen >= 5) tier = cls >= 7 ? 3 : cls === 5 ? (/x3d/.test(s) ? 3 : 2) : 1;
      else if (gen >= 3) tier = cls >= 5 ? 2 : 1;
      else tier = 1;
      if (/x3d/.test(s)) tier = 3;
    } else if ((m = s.match(/i([3579])[- ]?(\d{4,5})/))) {
      const cls = +m[1], num = m[2];
      const gen = (num.length === 5 || num[0] === "1") ? +num.slice(0, 2) : +num[0];   // 1135G7 = 11th gen
      if (gen >= 12) tier = cls >= 5 ? 3 : 2;
      else if (gen >= 10) tier = cls >= 5 ? 2 : 1;
      else if (gen >= 8) tier = cls >= 7 ? 2 : 1;
      else tier = 1;
    } else if (/pentium|celeron|athlon|fx-|a[468]-|core 2/.test(s)) tier = 0;
    else if (/apple|m[1-4]/.test(s)) tier = 2;
    if (tier !== null && /\d{4,5}u\b/.test(s)) tier = Math.max(0, tier - 1);   // low-power laptop chips
    return tier;
  };

  const GAME_DEMAND = { fortnite: 0, cod: -1, apex: 0, valorant: 1, roblox: 1, minecraft: 1, other: 0 };
  const GAME_LABEL = { fortnite: "Fortnite", cod: "Call of Duty", apex: "Apex Legends", valorant: "Valorant", roblox: "Roblox", minecraft: "Minecraft", other: "Other / general" };

  const GAME_SETTINGS = {
    fortnite: (p) => [
      ["Rendering Mode", p <= 1 ? "Performance" : "DirectX 12"],
      ["Quality preset to start from", ["Low", "Low", "Medium", "High", "Epic"][p]],
      ["Shadows", p >= 4 ? "Medium (or Off for competitive)" : "Off"],
      ["View Distance", p >= 2 ? "Far" : "Medium"],
      ["Upscaling", p <= 2 ? "TSR / DLSS / FSR on a performance-focused mode" : "TSR / DLSS / FSR quality mode, or Off"],
      ["Frame Rate Limit", "Match your refresh rate"]
    ],
    cod: (p) => [
      ["Quality preset to start from", ["Minimum", "Low", "Low–Balanced", "Balanced", "High / Ultra"][p]],
      ["Upscaling", p <= 2 ? "DLSS / FSR / XeSS on Balanced or Performance" : "DLSS / FSR / XeSS on Quality"],
      ["Motion blur", "Off"],
      ["Depth of field", "Off"],
      ["Field of view", "Wider than default, as long as targets stay clear"]
    ],
    apex: (p) => [
      ["Quality preset to start from", ["Lowest", "Low", "Medium", "High", "High"][p]],
      ["Adaptive resolution FPS target", p <= 1 ? "Try your target FPS (dynamic resolution)" : "0 (off) for a sharp image"],
      ["Texture streaming budget", "Match your graphics card memory"],
      ["Ambient occlusion & volumetric lighting", p >= 4 ? "Low–Medium" : "Disabled"],
      ["V-Sync", "Disabled"]
    ],
    valorant: (p) => [
      ["Material / Texture / Detail quality", p >= 3 ? "Medium" : "Low"],
      ["Multithreaded rendering", "On"],
      ["NVIDIA Reflex (if available)", "On"],
      ["Anti-aliasing", p >= 2 ? "MSAA 2x" : "None"],
      ["Limit FPS", "Use a cap you can hold steadily"]
    ],
    roblox: (p) => [
      ["Graphics Mode", "Manual"],
      ["Graphics Quality bar", ["1–3", "3–5", "5–7", "7–9", "8–10"][p]],
      ["Maximum frame rate (if shown)", "Match your refresh rate"]
    ],
    minecraft: (p) => [
      ["Render distance", ["6–8 chunks", "8–10 chunks", "10–12 chunks", "12–16 chunks", "16+ chunks"][p]],
      ["Simulation distance", p <= 1 ? "5–6 chunks" : "8+ chunks"],
      ["Graphics", p <= 1 ? "Fast" : "Fancy"],
      ["Java edition", "Consider the Sodium performance mod (Fabric)"]
    ],
    other: (p) => [
      ["Quality preset to start from", ["Lowest", "Low", "Medium", "High", "High / Ultra"][p]],
      ["Upscaling (DLSS / FSR / XeSS)", p <= 2 ? "On — performance-focused mode" : "On — quality mode, if needed"],
      ["Motion blur", "Off"],
      ["V-Sync", "Off (use G-SYNC / FreeSync instead)"]
    ]
  };

  function readForm() {
    return {
      cpu: $("#pcCpu").value.trim(), gpu: $("#pcGpu").value.trim(),
      ram: +$("#pcRam").value, storage: $("#pcStorage").value,
      refresh: +$("#pcRefresh").value, res: $("#pcRes").value,
      os: $("#pcOs").value, game: $("#pcGame").value
    };
  }

  function analyze(d) {
    const gT = LT.gpuTier(d.gpu), cT = LT.cpuTier(d.cpu);
    const known = [gT, cT].filter(t => t !== null);
    let base = known.length ? Math.min(...known) : 2;
    if (gT !== null && cT !== null) base = Math.min(gT, cT + 1);   // GPU usually decides graphics settings
    const resAdj = { "1366x768": 1, "1920x1080": 0, "2560x1440": -1, "3440x1440": -1, "3840x2160": -2 }[d.res] ?? 0;
    let p = base + resAdj + (GAME_DEMAND[d.game] || 0);
    if (d.ram <= 8) p -= 1;
    p = Math.max(0, Math.min(4, p));

    const limits = [], improve = [], upgrades = [];

    // RAM
    if (d.ram <= 4) limits.push("<b>4 GB RAM</b> is below the minimum for most modern games. Expect stutters and long loading.");
    else if (d.ram === 8) limits.push("<b>8 GB RAM</b> is enough to run many games, but modern titles can stutter when other apps are open.");
    // Storage
    if (d.storage === "hdd") limits.push("<b>Hard drive storage</b> causes longer loading and texture pop-in, and can cause stutter in large games like Fortnite and Call of Duty.");
    if (d.storage === "unknown") improve.push("Check whether your games are on an SSD: Task Manager › Performance shows each disk as SSD or HDD.");
    // GPU / CPU
    if (gT === 0) limits.push("<b>Integrated graphics</b> share memory with the CPU and are best suited to low settings and lower resolutions.");
    if (gT === null) improve.push(`We couldn't recognize "${esc(d.gpu)}". Recommendations assume a mid-range graphics card — double-check the exact model name.`);
    if (cT === null) improve.push(`We couldn't recognize "${esc(d.cpu)}". Check the exact model under Settings › System › About.`);
    if (cT !== null && cT <= 1 && d.refresh >= 144) limits.push(`Your processor may struggle to reach <b>${d.refresh} FPS</b> in busy matches — CPU-heavy moments (lots of players, building) are where you'll feel it.`);
    if (gT !== null && gT <= 3 && d.res === "3840x2160") limits.push("<b>4K</b> is very demanding. Upscaling (DLSS / FSR / XeSS) or 1440p will be much smoother.");
    if (gT !== null && gT <= 2 && (d.res === "2560x1440" || d.res === "3440x1440")) limits.push("At <b>1440p</b>, a lower mid-range card usually needs upscaling or lower settings.");
    // OS
    if (d.os === "win10") limits.push("<b>Windows 10</b> stopped receiving free security updates in October 2025. Upgrade to Windows 11 if your PC supports it.");
    if (d.os === "macos" && ["fortnite", "valorant", "cod", "apex"].includes(d.game)) limits.push(`<b>${GAME_LABEL[d.game]}</b> doesn't run natively on macOS. Cloud gaming services are the usual option on a Mac.`);
    if (d.os === "linux" && ["fortnite", "valorant", "cod", "apex"].includes(d.game)) limits.push(`<b>${GAME_LABEL[d.game]}</b> typically doesn't run on Linux because its anti-cheat doesn't support it. Check before relying on it.`);
    if (d.refresh === 60 && p >= 3) improve.push("Your PC can likely run above 60 FPS in many games — a high-refresh monitor (144Hz+) would make a visible difference.");

    // General improvements
    improve.push("Update your graphics driver from NVIDIA, AMD or Intel's official app.");
    if (d.os === "win11" || d.os === "win10") improve.push("Turn on Game Mode (Settings › Gaming) and confirm your monitor's refresh rate in Settings › System › Display › Advanced display.");
    improve.push(`Set your in-game frame limit to <b>${d.refresh} FPS</b> if your PC holds it, or the next lower value it holds steadily.`);
    improve.push("Close browsers, launchers and recording apps you aren't using while you play.");
    if (/laptop|\d{4,5}[hu]\b|mobile|max-q/i.test(d.cpu + " " + d.gpu) || d.res === "1366x768") improve.push("On a laptop, keep it plugged in and set Windows power mode to Best performance.");

    // Upgrades, most impactful first
    if (d.ram < 16) upgrades.push("Upgrade to <b>16 GB RAM</b> (two matching sticks for dual-channel) — usually the cheapest meaningful upgrade.");
    if (d.storage === "hdd") upgrades.push("Move your games to an <b>SSD</b>. Even a basic SATA SSD makes a big difference to loading and stutter.");
    if (gT !== null && cT !== null) {
      if (gT < cT) upgrades.push("Your <b>graphics card</b> is the weaker part. A GPU upgrade would give the biggest boost to settings and resolution.");
      else if (cT < gT) upgrades.push("Your <b>processor</b> is the weaker part. It will mostly limit high-refresh gaming and busy matches.");
    } else if (gT === 0) upgrades.push("A dedicated <b>graphics card</b> would be the single biggest improvement (desktop only — most laptops can't be upgraded).");

    return { p, gT, cT, limits, improve, upgrades };
  }

  function render(d, r) {
    const resLabel = d.res.replace("x", "×");
    const presetName = ["Low with upscaling", "Low", "Medium", "High", "High to Ultra"][r.p];
    const tierText = (t) => t === null ? "Not recognized" : TIER_NAMES[t];
    const targets = [
      "Prioritize a stable 60 FPS before raising settings",
      "Aim for a stable 60 FPS, then push higher if it holds",
      `Aim for a steady frame rate between 60 FPS and your ${d.refresh}Hz refresh rate`,
      `Aim to get close to your ${d.refresh}Hz refresh rate with competitive settings`,
      `Aim to match your ${d.refresh}Hz refresh rate in most games`
    ];

    $("#pcResults").innerHTML =
      LT.block("Your hardware summary", `<dl class="kv">
        <dt>Processor</dt><dd>${esc(d.cpu)} <span class="muted small">(${tierText(r.cT)})</span></dd>
        <dt>Graphics</dt><dd>${esc(d.gpu)} <span class="muted small">(${tierText(r.gT)})</span></dd>
        <dt>Memory</dt><dd>${d.ram === 64 ? "64 GB or more" : d.ram + " GB"}</dd>
        <dt>Storage</dt><dd>${{ nvme: "NVMe SSD", sata: "SATA SSD", hdd: "Hard drive", unknown: "Not sure" }[d.storage]}</dd>
        <dt>Display</dt><dd>${resLabel} at ${d.refresh}Hz</dd>
        <dt>System</dt><dd>${{ win11: "Windows 11", win10: "Windows 10", macos: "macOS", linux: "Linux / SteamOS" }[d.os]}</dd>
        <dt>Main game</dt><dd>${GAME_LABEL[d.game]}</dd></dl>`) +
      LT.block("Performance outlook", `<p style="margin:0 0 6px">Suggested starting point: <b class="y">${presetName}</b> settings.</p>
        <p style="margin:0" class="muted">${targets[r.p]}.</p>`) +
      (r.limits.length ? LT.block("Potential limitations", LT.list(r.limits), true) : LT.block("Potential limitations", "<p style='margin:0'>No obvious bottlenecks from what you entered.</p>")) +
      LT.block(`Recommended settings — ${GAME_LABEL[d.game]}`, LT.table(GAME_SETTINGS[d.game](r.p))) +
      LT.block("Performance improvements", LT.list(r.improve)) +
      (r.upgrades.length ? LT.block("Upgrade suggestions", LT.list(r.upgrades)) : "") +
      `<p class="disclaimer">This is an estimate based on the specs you typed in — not a hardware scan or benchmark. Real performance depends on drivers, temperatures, background apps and game updates.</p>`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("#pcGame").innerHTML = LT.GAMES.map(g => `<option value="${g.id}">${esc(g.name)}</option>`).join("") + '<option value="other">Other</option>';
    $("#pcForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const form = e.target, msg = $("#pcMsg");
      LT.clearInvalid(form); LT.msg(msg, "");
      const d = readForm();
      if (d.cpu.length < 2) return LT.invalid($("#pcCpu"), msg, "Enter your processor model.");
      if (d.gpu.length < 2) return LT.invalid($("#pcGpu"), msg, "Enter your graphics card model.");
      render(d, analyze(d));
      LT.msg(msg, "Analysis ready.", "ok");
      if (window.innerWidth < 900) $("#pcResults").scrollIntoView({ behavior: "smooth" });
    });
  });

  LT.routes.pc = { onEnter() { LT.markRecent("#/pc", "PC Analyzer"); } };
  LT.pcAnalyze = analyze;   // exposed for testing
})(window.LT);
