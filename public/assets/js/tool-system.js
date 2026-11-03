/* =========================================================
   LIO TWEAKS — System Information
   Shows ONLY what the browser reports. Clearly labeled as hints.
   ========================================================= */
(function (LT) {
  const { $, esc } = LT;
  let last = {};

  function measureRefresh() {
    return new Promise((resolve) => {
      const times = [];
      let prev = null;
      const tick = (t) => {
        if (prev !== null) times.push(t - prev);
        prev = t;
        if (times.length < 90) requestAnimationFrame(tick);
        else {
          times.sort((a, b) => a - b);
          const median = times[Math.floor(times.length / 2)];
          resolve(median > 0 ? Math.round(1000 / median) : null);
        }
      };
      requestAnimationFrame(tick);
      setTimeout(() => resolve(null), 4000);
    });
  }

  function gpuName() {
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
      if (!gl) return null;
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      return String(name || "").replace(/^ANGLE \((.*)\)$/, "$1").replace(/, ?(Direct3D|D3D)\S*.*$/i, "").replace(/^(NVIDIA|AMD|Intel)[^,]*, ?/i, "");
    } catch (e) { return null; }
  }

  async function osName() {
    const ua = navigator.userAgent;
    try {
      if (navigator.userAgentData?.getHighEntropyValues) {
        const v = await navigator.userAgentData.getHighEntropyValues(["platformVersion"]);
        if (navigator.userAgentData.platform === "Windows") {
          return { label: parseInt(v.platformVersion, 10) >= 13 ? "Windows 11" : "Windows 10", key: parseInt(v.platformVersion, 10) >= 13 ? "win11" : "win10" };
        }
      }
    } catch (e) { /* not supported */ }
    if (/Windows NT 10/.test(ua)) return { label: "Windows 10 or 11", key: "win11" };
    if (/Mac OS X/.test(ua)) return { label: "macOS", key: "macos" };
    if (/Linux/.test(ua)) return { label: "Linux", key: "linux" };
    return { label: "Unknown", key: null };
  }

  async function run() {
    const box = $("#sysInfo");
    box.innerHTML = "<dt>Status</dt><dd>Measuring…</dd>";
    const [hz, os] = await Promise.all([measureRefresh(), osName()]);
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(screen.width * dpr), h = Math.round(screen.height * dpr);
    const cores = navigator.hardwareConcurrency;
    const mem = navigator.deviceMemory;
    const gpu = gpuName();
    last = { w, h, hz, os, gpu };
    const row = (k, v, note) => `<dt>${k}</dt><dd>${v}${note ? ` <span class="muted small">${note}</span>` : ""}</dd>`;
    box.innerHTML =
      row("Operating system", esc(os.label)) +
      row("Screen resolution", `${w}×${h}`, dpr !== 1 ? `(display scaling ${Math.round(dpr * 100)}%)` : "") +
      row("Refresh rate", hz ? `about ${hz}Hz` : "Couldn't measure", "(estimate from this browser tab)") +
      row("Processor threads", cores ? String(cores) : "Not reported") +
      row("Memory", mem ? `at least ${mem} GB` : "Not reported", mem ? "(browsers cap this at 8 GB)" : "") +
      row("Graphics", gpu ? esc(gpu) : "Hidden by browser", "(may be generic for privacy)");
  }

  function nearest(options, value) {
    return options.reduce((a, b) => Math.abs(b - value) < Math.abs(a - value) ? b : a);
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("#sysRefresh").addEventListener("click", run);
    $("#sysToAnalyzer").addEventListener("click", () => {
      if (last.hz) $("#pcRefresh").value = String(nearest([60, 75, 120, 144, 165, 180, 240, 360], last.hz));
      const res = `${last.w}x${last.h}`;
      if ([...$("#pcRes").options].some(o => o.value === res)) $("#pcRes").value = res;
      if (last.os?.key) $("#pcOs").value = last.os.key;
      if (last.gpu && !$("#pcGpu").value) $("#pcGpu").value = last.gpu.slice(0, 80);
      LT.go("#/pc");
      LT.toast("Filled in what your browser reported. Please check the values.");
    });
  });

  LT.routes.system = { onEnter() { LT.markRecent("#/system", "System Information"); run(); } };
})(window.LT);
