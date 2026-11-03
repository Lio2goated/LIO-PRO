/* =========================================================
   LIO TWEAKS — guides, game pages, home page lists
   ========================================================= */
(function (LT) {
  const { $, $$, esc } = LT;
  let filter = "all";

  const catName = (id) => (LT.GUIDE_CATS.find(c => c.id === id) || {}).name || id;

  function card(g) {
    const isPro = g.pro;
    return `<a class="card${isPro ? " pro" : ""}" href="#/guides/${esc(g.id)}">
      <span class="badge ${isPro ? "" : "free"}">${isPro ? "Pro" : esc(catName(g.cat))}</span>
      <h3 style="margin-top:10px">${isPro ? '<span class="lock">🔒</span> ' : ""}${esc(g.title)}</h3>
      <p>${esc(g.summary)}</p>${g.mins ? `<span class="muted small">${g.mins} min read</span>` : ""}</a>`;
  }

  const proGuides = () => LT.PRO_CATALOG.map(p => ({ ...p, cat: "pro", pro: true }));
  const allGuides = () => LT.GUIDES.concat(proGuides());

  function renderList() {
    $("#guideFilters").innerHTML = [{ id: "all", name: "All" }].concat(LT.GUIDE_CATS)
      .map(c => `<button type="button" class="chip${c.id === filter ? " active" : ""}" data-f="${c.id}">${esc(c.name)}</button>`).join("");
    $$("#guideFilters .chip").forEach(b => b.onclick = () => { filter = b.dataset.f; renderList(); });
    const list = allGuides().filter(g => filter === "all" || g.cat === filter);
    $("#guideList").innerHTML = list.map(card).join("");
  }

  function steps(arr) {
    return '<ol class="steps">' + arr.map(([t, x]) => `<li><b>${esc(t)}</b>${esc(x)}</li>`).join("") + "</ol>";
  }

  async function renderArticle(id) {
    const el = $("#guideArticle");
    const free = LT.GUIDES.find(g => g.id === id);
    const pro = LT.PRO_CATALOG.find(g => g.id === id);
    const game = free?.game ? LT.gameById(free.game) : null;
    $("#guideBack").href = game && game.id !== "fortnite" ? `#/games/${game.id}` : "#/guides";
    $("#guideBack").textContent = game && game.id !== "fortnite" ? `← ${game.name}` : "← All guides";

    if (free) {
      el.innerHTML = `<span class="badge free">${esc(catName(free.cat))}</span>
        <h1 style="margin-top:12px;font-size:clamp(28px,4.5vw,40px)">${esc(free.title)}</h1>
        <p class="muted">${esc(free.intro || free.summary)}</p>${steps(free.steps)}
        ${free.tip ? `<div class="tip"><b>Tip:</b> ${esc(free.tip)}</div>` : ""}
        <p class="disclaimer">Menu names can change with game and Windows updates.</p>`;
      return;
    }
    if (!pro) { el.innerHTML = `<h1>Guide not found</h1><p><a href="#/guides">Back to all guides</a></p>`; return; }

    // Pro guide — content only comes from the server for verified Pro members
    if (!LT.state.authReady) { el.innerHTML = '<div class="spinner"></div>'; return; }
    if (!LT.isPro()) {
      el.innerHTML = `<span class="badge">Pro</span><h1 style="margin-top:12px">${esc(pro.title)}</h1>
        <p class="muted">${esc(pro.summary)}</p>
        <div class="card pro"><h3>🔒 This guide is part of Lio Tweaks Pro</h3>
        <p>${LT.state.user ? "Upgrade to Pro to unlock this guide and the full Pro library." : "Log in with a Pro membership to read this guide."}</p>
        <div class="btn-row"><a class="btn yellow" href="#/pro">See Lio Tweaks Pro</a>${LT.state.user ? "" : '<a class="btn ghost" href="#/account">Log In</a>'}</div></div>`;
      return;
    }
    el.innerHTML = '<div class="spinner"></div>';
    const { data, error } = await LT.sb.from("pro_content").select("title, summary, body").eq("id", id).maybeSingle();
    if (error || !data) {
      el.innerHTML = `<h1>${esc(pro.title)}</h1><p class="msg err">We couldn't load this guide. Please refresh, and contact us on Discord if it keeps happening.</p>`;
      return;
    }
    const b = data.body || {};
    el.innerHTML = `<span class="badge">Pro</span><h1 style="margin-top:12px;font-size:clamp(28px,4.5vw,40px)">${esc(data.title)}</h1>
      <p class="muted">${esc(b.intro || data.summary)}</p>${steps(b.steps || [])}
      ${b.tip ? `<div class="tip"><b>Pro tip:</b> ${esc(b.tip)}</div>` : ""}`;
  }

  function renderGame(id) {
    const g = LT.gameById(id);
    if (!g) { $("#gameHead").innerHTML = "<h1>Game not found</h1>"; $("#gameGuides").innerHTML = ""; $("#gameTools").innerHTML = ""; return; }
    $("#gameHead").innerHTML = `<a class="back-link" href="#/">← Home</a><span class="eyebrow" style="display:block">Supported game</span>
      <h1>${esc(g.name.toUpperCase())}</h1><p>${esc(g.blurb)}</p>`;
    const guides = LT.GUIDES.filter(x => x.game === id);
    $("#gameGuides").innerHTML = guides.length ? guides.map(card).join("") : '<div class="card"><p>Guides for this game are coming soon.</p></div>';
    const toolInfo = {
      fortnite: ["Fortnite Optimizer", "#/fortnite"], pc: ["PC Analyzer", "#/pc"],
      controller: ["Controller Lab", "#/controller"], kbm: ["Keyboard & Mouse Lab", "#/kbm"]
    };
    $("#gameTools").innerHTML = `<div class="card-cat">Tools for ${esc(g.name)}</div><div class="grid">` +
      g.tools.map(t => `<a class="card" href="${toolInfo[t][1]}"><h3>${esc(toolInfo[t][0])}</h3><p>${t === "pc" ? `Choose ${esc(g.name)} as your main game for tailored settings.` : "Personalized starting settings you can save."}</p></a>`).join("") + "</div>";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const featured = LT.GUIDES.filter(g => g.featured).concat(proGuides().slice(0, 1));
    $("#featuredGuides").innerHTML = featured.map(card).join("");
    $("#gamesGrid").innerHTML = LT.GAMES.map(g => `<a class="game-chip" href="#/games/${g.id}"><span class="g-icon">${esc(g.short)}</span>
      <span>${esc(g.name)}<br><span class="muted small" style="font-weight:500">${esc(g.blurb)}</span></span></a>`).join("");
  });

  let currentGuide = null;
  LT.on("auth", () => { if (LT.currentRoute() === "guide" && currentGuide) renderArticle(currentGuide); });

  LT.routes.guides = { onEnter() { LT.markRecent("#/guides", "Guides"); renderList(); } };
  LT.routes.guide = { onEnter(id) { currentGuide = id; renderArticle(id); } };
  LT.routes.game = { onEnter(id) { renderGame(id); } };
})(window.LT);
