/* =========================================================
   LIO TWEAKS — accounts (Supabase Auth)
   ========================================================= */
(function (LT) {
  const { $, $$ } = LT;

  // Create the Supabase client (publishable key only)
  try {
    if (window.supabase && LT.config.supabaseUrl.startsWith("https://")) {
      LT.sb = window.supabase.createClient(LT.config.supabaseUrl, LT.config.supabaseKey);
    }
  } catch (e) { console.error("Supabase setup failed", e); }

  LT.requireSb = (msgEl) => {
    if (LT.sb) return true;
    LT.msg(msgEl, "Accounts are temporarily unavailable. Please try again later.", "err");
    return false;
  };

  /* ---------- Membership (read-only; set by the server) ---------- */
  LT.fetchMembership = async () => {
    if (!LT.sb || !LT.state.user) return "free";
    try {
      const { data, error } = await LT.sb.from("profiles").select("membership").eq("id", LT.state.user.id).maybeSingle();
      if (error) throw error;
      return data?.membership || "free";
    } catch (e) {
      console.error(e);
      return "free";
    }
  };
  LT.isPro = () => LT.state.membership === "pro";

  async function setUser(user) {
    LT.state.user = user || null;
    LT.state.membership = user ? await LT.fetchMembership() : "free";
    LT.state.authReady = true;
    updateChrome();
    LT.emit("auth", LT.state);
  }
  LT.refreshMembership = async () => {
    LT.state.membership = await LT.fetchMembership();
    updateChrome();
    LT.emit("auth", LT.state);
    return LT.state.membership;
  };

  LT.displayName = () => {
    const u = LT.state.user;
    return u ? (u.user_metadata?.display_name || u.email) : "";
  };

  LT.updateChrome = () => updateChrome();
  function updateChrome() {
    const chip = $("#accountChip");
    if (LT.state.user) {
      chip.innerHTML = `${LT.esc(LT.displayName())} · <b>${LT.isPro() ? "PRO" : "FREE"}</b>`;
    } else {
      chip.textContent = "Not logged in";
    }
    const signedIn = !!LT.state.user;
    $("#acctSignedIn").style.display = signedIn ? "block" : "none";
    $("#acctForms").style.display = signedIn && !recovering ? "none" : "block";
    if (signedIn) $("#acctEmail").innerHTML = `Signed in as <b class="y">${LT.esc(LT.state.user.email)}</b>`;
  }

  /* ---------- Account page tabs ---------- */
  let recovering = false;
  function showTab(name) {
    $$("#acctForms [data-tab]").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
    $$("#acctForms [data-panel]").forEach(f => f.classList.toggle("hidden", f.dataset.panel !== name));
    LT.msg("#acctMsg", "");
  }
  LT.showAccountTab = showTab;

  /* ---------- Forms ---------- */
  async function onLogin(e) {
    e.preventDefault();
    const form = e.target, msg = $("#acctMsg"), btn = form.querySelector("button");
    LT.clearInvalid(form);
    const email = $("#loginEmail").value.trim(), pw = $("#loginPw").value;
    if (!LT.validEmail(email)) return LT.invalid($("#loginEmail"), msg, "Enter a valid email address.");
    if (!pw) return LT.invalid($("#loginPw"), msg, "Enter your password.");
    if (!LT.requireSb(msg)) return;
    LT.busy(btn, true);
    const { error } = await LT.sb.auth.signInWithPassword({ email, password: pw });
    LT.busy(btn, false);
    if (error) {
      const text = /confirm/i.test(error.message) ? "Please confirm your email first — check your inbox for the link." :
        /invalid/i.test(error.message) ? "Email or password is incorrect." : error.message;
      return LT.msg(msg, text, "err");
    }
    $("#loginPw").value = "";
    LT.toast("Welcome back to Lio Tweaks!");
    LT.go("#/dashboard");
  }

  async function onSignup(e) {
    e.preventDefault();
    const form = e.target, msg = $("#acctMsg"), btn = form.querySelector("button");
    LT.clearInvalid(form);
    const email = $("#suEmail").value.trim(), pw = $("#suPw").value, pw2 = $("#suPw2").value;
    if (!LT.validEmail(email)) return LT.invalid($("#suEmail"), msg, "Enter a valid email address.");
    if (pw.length < 8) return LT.invalid($("#suPw"), msg, "Password must be at least 8 characters.");
    if (pw !== pw2) return LT.invalid($("#suPw2"), msg, "Passwords don't match.");
    if (!LT.requireSb(msg)) return;
    LT.busy(btn, true);
    const { data, error } = await LT.sb.auth.signUp({
      email, password: pw,
      options: { emailRedirectTo: location.origin + location.pathname }
    });
    LT.busy(btn, false);
    if (error) return LT.msg(msg, error.message, "err");
    form.reset();
    if (data?.session) { LT.toast("Account created!"); LT.go("#/dashboard"); }
    else LT.msg(msg, "Account created! Check your email inbox and click the confirmation link to activate it.", "ok");
  }

  async function onForgot(e) {
    e.preventDefault();
    const form = e.target, msg = $("#acctMsg"), btn = form.querySelector("button");
    LT.clearInvalid(form);
    const email = $("#fpEmail").value.trim();
    if (!LT.validEmail(email)) return LT.invalid($("#fpEmail"), msg, "Enter a valid email address.");
    if (!LT.requireSb(msg)) return;
    LT.busy(btn, true);
    const { error } = await LT.sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    LT.busy(btn, false);
    if (error) return LT.msg(msg, error.message, "err");
    LT.msg(msg, "If that email has an account, a reset link is on its way.", "ok");
  }

  async function onReset(e) {
    e.preventDefault();
    const form = e.target, msg = $("#acctMsg"), btn = form.querySelector("button");
    LT.clearInvalid(form);
    const pw = $("#rpPw").value, pw2 = $("#rpPw2").value;
    if (pw.length < 8) return LT.invalid($("#rpPw"), msg, "Password must be at least 8 characters.");
    if (pw !== pw2) return LT.invalid($("#rpPw2"), msg, "Passwords don't match.");
    LT.busy(btn, true);
    const { error } = await LT.sb.auth.updateUser({ password: pw });
    LT.busy(btn, false);
    if (error) return LT.msg(msg, error.message, "err");
    recovering = false;
    form.reset();
    LT.toast("Password updated.");
    updateChrome();
    LT.go("#/dashboard");
  }

  LT.logout = async () => {
    if (!LT.sb) return;
    await LT.sb.auth.signOut();
    LT.toast("You have been logged out.");
    LT.go("#/");
  };

  /* ---------- Wire up ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    $$("#acctForms [data-tab]").forEach(b => b.addEventListener("click", () => showTab(b.dataset.tab)));
    $("#loginForm").addEventListener("submit", onLogin);
    $("#signupForm").addEventListener("submit", onSignup);
    $("#forgotForm").addEventListener("submit", onForgot);
    $("#resetForm").addEventListener("submit", onReset);
    document.addEventListener("click", (e) => {
      const b = e.target.closest('[data-action="logout"]');
      if (b) { e.preventDefault(); LT.logout(); }
    });

    // Show errors from email links (expired link etc.)
    const h = new URLSearchParams(location.hash.replace(/^#\/?/, ""));
    if (h.get("error_description")) LT.toast(h.get("error_description").replace(/\+/g, " "), "err");

    if (!LT.sb) { setUser(null); return; }
    LT.sb.auth.onAuthStateChange((event, session) => {
      // Keep Supabase calls out of the callback itself (recommended by Supabase)
      setTimeout(() => {
        if (event === "PASSWORD_RECOVERY") {
          recovering = true;
          LT.go("#/account");
          showTab("reset");
        }
        setUser(session?.user || null);
      }, 0);
    });
  });

  LT.routes.account = { onEnter() { updateChrome(); } };
})(window.LT);
