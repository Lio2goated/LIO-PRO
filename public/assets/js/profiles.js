/* =========================================================
   LIO TWEAKS — saved profiles (create / load / update / delete)
   Each row belongs to the logged-in user. Row Level Security in
   Supabase makes sure nobody can read or change anyone else's.
   ========================================================= */
(function (LT) {
  const { $, esc } = LT;

  const TYPES = {
    fortnite: { label: "Fortnite", route: "#/fortnite" },
    controller: { label: "Controller", route: "#/controller" },
    keyboard_mouse: { label: "Keyboard & Mouse", route: "#/kbm" },
    studio_design: { label: "Controller Design", route: "#/studio" }
  };
  LT.PROFILE_TYPES = TYPES;

  const P = LT.profiles = {
    cache: [],
    appliers: {},       // type -> function(settings, profile) that fills the tool
    loaded: {}          // type -> profile currently loaded in that tool
  };

  P.limit = () => LT.isPro() ? LT.config.proProfileLimit : LT.config.freeProfileLimit;

  function friendly(error) {
    const m = error?.message || String(error);
    if (/row-level security|violates/i.test(m)) {
      return LT.isPro()
        ? `You've reached the ${LT.config.proProfileLimit}-profile limit. Delete a profile to save a new one.`
        : `You've reached the Free limit of ${LT.config.freeProfileLimit} saved profiles. Delete one, or upgrade to Pro for up to ${LT.config.proProfileLimit}.`;
    }
    if (/JWT|session/i.test(m)) return "Your session expired. Please log in again.";
    return "Something went wrong: " + m;
  }

  P.fetch = async () => {
    if (!LT.sb || !LT.state.user) { P.cache = []; LT.emit("profiles", P.cache); return P.cache; }
    const { data, error } = await LT.sb
      .from("saved_profiles")
      .select("id, profile_name, profile_type, settings, created_at, updated_at")
      .order("updated_at", { ascending: false });
    if (error) { console.error(error); throw new Error(friendly(error)); }
    P.cache = data || [];
    LT.emit("profiles", P.cache);
    return P.cache;
  };

  P.create = async (type, name, settings) => {
    const { data, error } = await LT.sb.from("saved_profiles")
      .insert({ user_id: LT.state.user.id, profile_type: type, profile_name: name, settings })
      .select("id, profile_name, profile_type, settings, created_at, updated_at").single();
    if (error) throw new Error(friendly(error));
    P.cache.unshift(data);
    LT.emit("profiles", P.cache);
    return data;
  };

  P.update = async (id, changes) => {
    const { data, error } = await LT.sb.from("saved_profiles")
      .update(changes).eq("id", id)
      .select("id, profile_name, profile_type, settings, created_at, updated_at").single();
    if (error) throw new Error(friendly(error));
    P.cache = P.cache.map(p => p.id === id ? data : p);
    Object.keys(P.loaded).forEach(t => { if (P.loaded[t]?.id === id) P.loaded[t] = data; });
    LT.emit("profiles", P.cache);
    return data;
  };

  P.remove = async (id) => {
    const { error } = await LT.sb.from("saved_profiles").delete().eq("id", id);
    if (error) throw new Error(friendly(error));
    P.cache = P.cache.filter(p => p.id !== id);
    Object.keys(P.loaded).forEach(t => { if (P.loaded[t]?.id === id) P.loaded[t] = null; });
    LT.emit("profiles", P.cache);
  };

  /* Load a saved profile into its tool and open that tool */
  P.open = (profile) => {
    const t = TYPES[profile.profile_type];
    if (!t) return;
    P.loaded[profile.profile_type] = profile;
    P.pending = profile;           // the tool applies it when its page opens
    LT.go(t.route);
  };
  P.applyPending = (type) => {
    if (P.pending && P.pending.profile_type === type && P.appliers[type]) {
      const p = P.pending; P.pending = null;
      P.appliers[type](p.settings || {}, p);
      LT.toast(`Loaded "${p.profile_name}"`);
      return true;
    }
    return false;
  };

  /* Banner at the top of a tool showing which profile is loaded */
  P.showLoadedBanner = (type, el) => {
    const p = P.loaded[type];
    if (!el) return;
    if (!p) { el.classList.add("hidden"); return; }
    el.classList.remove("hidden");
    el.innerHTML = `<div class="loaded-banner"><span>Editing saved profile: <b>${esc(p.profile_name)}</b></span>
      <button type="button" class="btn small ghost">Start fresh</button></div>`;
    el.querySelector("button").onclick = () => { P.loaded[type] = null; el.classList.add("hidden"); LT.emit("loaded-cleared", type); };
  };

  /* Reusable "Save to my account" card for each tool */
  P.mountSaveCard = (cardEl, type, getSettings, defaultName) => {
    const render = () => {
      cardEl.classList.remove("hidden");
      if (!LT.state.user) {
        cardEl.innerHTML = `<h3>Save these settings</h3><p>Log in to save this profile to your account and load it anytime.</p>
          <a class="btn" href="#/account">Log In to Save</a>`;
        return;
      }
      const loaded = P.loaded[type];
      cardEl.innerHTML = `<h3>Save these settings</h3>
        <label for="${type}-pname">Profile name</label>
        <input id="${type}-pname" maxlength="60" placeholder="e.g. ${esc(defaultName())}" value="${loaded ? esc(loaded.profile_name) : ""}">
        <div class="btn-row">
          <button type="button" class="btn" data-act="new">Save as New Profile</button>
          ${loaded ? `<button type="button" class="btn ghost" data-act="update">Update "${esc(loaded.profile_name)}"</button>` : ""}
        </div>
        <p class="msg"></p>
        <p class="disclaimer">${P.cache.length} of ${P.limit()} saved profiles used.</p>`;
      const nameEl = cardEl.querySelector("input"), msg = cardEl.querySelector(".msg");
      cardEl.querySelector('[data-act="new"]').onclick = async (e) => {
        const name = nameEl.value.trim() || defaultName();
        if (name.length > 60) return LT.invalid(nameEl, msg, "Keep the name under 60 characters.");
        LT.busy(e.target, true);
        try {
          const p = await P.create(type, name, getSettings());
          P.loaded[type] = p;
          LT.toast(`Saved "${p.profile_name}"`);
          render();
          LT.emit("profile-saved", type);
        } catch (err) { LT.msg(msg, err.message, "err"); LT.busy(e.target, false); }
      };
      const up = cardEl.querySelector('[data-act="update"]');
      if (up) up.onclick = async (e) => {
        const name = nameEl.value.trim() || loaded.profile_name;
        LT.busy(e.target, true);
        try {
          await P.update(loaded.id, { profile_name: name, settings: getSettings() });
          LT.toast("Profile updated");
          render();
          LT.emit("profile-saved", type);
        } catch (err) { LT.msg(msg, err.message, "err"); LT.busy(e.target, false); }
      };
    };
    render();
    return render;
  };

  LT.on("auth", async (s) => {
    if (s.user) { try { await P.fetch(); } catch (e) { /* shown where used */ } }
    else { P.cache = []; P.loaded = {}; LT.emit("profiles", P.cache); }
  });
})(window.LT);
