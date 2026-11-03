/* =========================================================
   LIO TWEAKS — personal dashboard
   ========================================================= */
(function (LT) {
  const { $, $$, esc } = LT;

  const when = (iso) => {
    try { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); } catch (e) { return ""; }
  };

  function renderAccount() {
    const u = LT.state.user;
    $("#dashLoggedOut").classList.toggle("hidden", !!u);
    $("#dashLoggedIn").classList.toggle("hidden", !u);
    if (!u) return;
    $("#dashWho").innerHTML = `<p class="dash-stat">${esc(LT.displayName())}</p><p class="muted small" style="margin:0">${esc(u.email)}</p>`;
    $("#dashMember").innerHTML = LT.isPro()
      ? `<p class="dash-stat">PRO MEMBER</p><button type="button" class="btn small ghost" id="dashManage">Manage Subscription</button>`
      : `<p class="dash-stat" style="color:#ccc">FREE MEMBER</p><a class="btn small yellow" href="#/pro">Upgrade to Pro</a>`;
    const m = $("#dashManage"); if (m) m.onclick = () => LT.openBillingPortal(m);
    if (document.activeElement !== $("#dashName")) $("#dashName").value = u.user_metadata?.display_name || "";
  }

  function renderProfiles(list) {
    if (!LT.state.user) return;
    const counts = {};
    list.forEach(p => counts[p.profile_type] = (counts[p.profile_type] || 0) + 1);
    $("#dashCounts").innerHTML = `<p class="dash-stat">${list.length} <span class="muted small">of ${LT.profiles.limit()}</span></p>
      <p class="muted small" style="margin:0">${Object.entries(LT.PROFILE_TYPES).map(([k, t]) => `${t.label}: ${counts[k] || 0}`).join(" · ")}</p>`;
    $$("#dashLoggedIn .profile-list[data-ptype]").forEach(box => {
      const type = box.dataset.ptype;
      const items = list.filter(p => p.profile_type === type);
      if (!items.length) {
        box.innerHTML = `<p class="muted small" style="margin:0">Nothing saved yet. <a href="${LT.PROFILE_TYPES[type].route}">Open the tool</a> and save your settings.</p>`;
        return;
      }
      box.innerHTML = items.map(p => `<div class="profile-item" data-id="${esc(p.id)}">
        <div><div class="p-name">${esc(p.profile_name)}</div><div class="p-meta">Updated ${when(p.updated_at || p.created_at)}</div></div>
        <div class="btn-row">
          <button type="button" class="btn small" data-act="load">Load</button>
          <button type="button" class="btn small ghost" data-act="rename">Rename</button>
          <button type="button" class="btn small ghost" data-act="delete">Delete</button>
        </div></div>`).join("");
    });
  }

  async function onListClick(e) {
    const btn = e.target.closest("[data-act]"); if (!btn) return;
    const item = btn.closest(".profile-item"); if (!item) return;
    const p = LT.profiles.cache.find(x => x.id === item.dataset.id); if (!p) return;
    const act = btn.dataset.act;
    if (act === "load") return LT.profiles.open(p);
    if (act === "rename") {
      const name = prompt("New name for this profile:", p.profile_name);
      if (name === null) return;
      const clean = name.trim();
      if (!clean || clean.length > 60) return LT.toast("Name must be 1–60 characters.", "err");
      LT.busy(btn, true);
      try { await LT.profiles.update(p.id, { profile_name: clean }); LT.toast("Profile renamed"); }
      catch (err) { LT.toast(err.message, "err"); LT.busy(btn, false); }
    }
    if (act === "delete") {
      if (!confirm(`Delete "${p.profile_name}"? This can't be undone.`)) return;
      LT.busy(btn, true);
      try { await LT.profiles.remove(p.id); LT.toast("Profile deleted"); }
      catch (err) { LT.toast(err.message, "err"); LT.busy(btn, false); }
    }
  }

  function renderRecent() {
    const r = LT.getRecent();
    $("#dashRecent").innerHTML = r.length
      ? '<div class="profile-list">' + r.map(x => `<a class="profile-item" style="text-decoration:none" href="${esc(x.route)}"><span class="p-name">${esc(x.label)}</span><span class="p-meta">${when(x.at)}</span></a>`).join("") + "</div>"
      : '<p class="muted small" style="margin:0">Tools you open will show up here.</p>';
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("#dashLoggedIn").addEventListener("click", onListClick);
    $("#nameForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector("button"), msg = $("#nameMsg");
      const name = $("#dashName").value.trim();
      if (name.length > 40) return LT.invalid($("#dashName"), msg, "Keep it under 40 characters.");
      LT.busy(btn, true);
      const { data, error } = await LT.sb.auth.updateUser({ data: { display_name: name } });
      LT.busy(btn, false);
      if (error) return LT.msg(msg, error.message, "err");
      if (data?.user) LT.state.user = data.user;
      LT.msg(msg, "Name saved.", "ok");
      LT.updateChrome();
      LT.emit("auth", LT.state);
    });
    $("#pwForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target, btn = form.querySelector("button"), msg = $("#pwMsg");
      LT.clearInvalid(form);
      const pw = $("#dashPw").value, pw2 = $("#dashPw2").value;
      if (pw.length < 8) return LT.invalid($("#dashPw"), msg, "Password must be at least 8 characters.");
      if (pw !== pw2) return LT.invalid($("#dashPw2"), msg, "Passwords don't match.");
      LT.busy(btn, true);
      const { error } = await LT.sb.auth.updateUser({ password: pw });
      LT.busy(btn, false);
      if (error) return LT.msg(msg, error.message, "err");
      form.reset();
      LT.msg(msg, "Password changed.", "ok");
    });
  });

  LT.on("auth", () => { if (LT.currentRoute() === "dashboard") { renderAccount(); renderProfiles(LT.profiles.cache); } });
  LT.on("profiles", (list) => { if (LT.currentRoute() === "dashboard") renderProfiles(list); });

  LT.routes.dashboard = {
    async onEnter() {
      renderAccount(); renderRecent();
      if (LT.state.user) {
        renderProfiles(LT.profiles.cache);
        try { await LT.profiles.fetch(); } catch (e) { LT.toast(e.message, "err"); }
      }
    }
  };
})(window.LT);
