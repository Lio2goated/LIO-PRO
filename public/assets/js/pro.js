/* =========================================================
   LIO TWEAKS — Pro membership page + Stripe checkout
   Membership is set ONLY by the server (Stripe webhook).
   Pro content is protected by Supabase Row Level Security,
   so changing this file can't unlock anything.
   ========================================================= */
(function (LT) {
  const { $, esc } = LT;

  async function callApi(path) {
    const { data: { session } } = await LT.sb.auth.getSession();
    if (!session) throw new Error("Please log in first.");
    let res;
    try {
      res = await fetch(path, { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } });
    } catch (e) { throw new Error("Couldn't reach the payment server. Check your connection and try again."); }
    const body = await res.json().catch(() => null);
    // No JSON back means the payment functions aren't deployed on this site yet
    if (!body) throw new Error("Pro payments aren't switched on for this site yet. Please check back soon.");
    if (!res.ok) throw new Error(body.error || body.errorMessage || `The payment server had a problem (code ${res.status}). Check the function log in Netlify.`);
    return body;
  }

  async function subscribe(btn) {
    const msg = $("#proMsg");
    LT.msg(msg, "");
    if (!LT.requireSb(msg)) return;
    if (!LT.state.user) { LT.msg(msg, "Create an account or log in first, then come back to upgrade.", "err"); LT.go("#/account"); return; }
    LT.busy(btn, true, "Opening secure checkout…");
    // Stripe Payment Link: pass the user's ID so the webhook knows who paid
    const link = (LT.config.stripePaymentLink || "").trim();
    if (link) {
      const u = new URL(link);
      u.searchParams.set("client_reference_id", LT.state.user.id);
      if (LT.state.user.email) u.searchParams.set("prefilled_email", LT.state.user.email);
      location.href = u.toString();
      return;
    }
    try { const { url } = await callApi(LT.config.api.checkout); location.href = url; }
    catch (e) { LT.msg(msg, e.message, "err"); LT.busy(btn, false); }
  }

  LT.openBillingPortal = async (btn) => {
    const msg = $("#proMsg");
    LT.busy(btn, true, "Opening…");
    try { const { url } = await callApi(LT.config.api.portal); location.href = url; }
    catch (e) { LT.toast(e.message, "err"); LT.msg(msg, e.message, "err"); LT.busy(btn, false); }
  };

  function render() {
    const pro = LT.isPro(), user = LT.state.user;
    $("#proStatus").innerHTML = !user ? '<span class="badge free">Not logged in</span>'
      : pro ? '<span class="badge">You are a Pro member ⭐</span>' : '<span class="badge free">Current plan: Free</span>';
    $("#proSubscribe").classList.toggle("hidden", pro);
    $("#proManage").classList.toggle("hidden", !pro);
    $("#proLibrary").innerHTML = LT.PRO_CATALOG.map(p => `<a class="card pro" href="#/guides/${esc(p.id)}">
      <span class="badge">${pro ? "Unlocked" : "🔒 Pro"}</span><h3 style="margin-top:10px">${esc(p.title)}</h3><p>${esc(p.summary)}</p></a>`).join("") +
      `<a class="card pro" href="#/controller"><span class="badge">${pro ? "Unlocked" : "🔒 Pro"}</span><h3 style="margin-top:10px">Advanced Controller Presets</h3><p>One-click presets inside the Controller Lab.</p></a>`;
  }

  // After Stripe sends the user back, wait for the webhook to switch them to Pro
  let checkoutHandled = false;
  async function handleCheckoutReturn() {
    const q = new URLSearchParams(location.search);
    const result = q.get("checkout");
    if (!result || checkoutHandled || !LT.state.authReady) return;
    checkoutHandled = true;
    history.replaceState(null, "", location.pathname + "#/pro");
    if (result === "cancelled") { LT.toast("Checkout cancelled — you haven't been charged."); return; }
    if (LT.isPro()) { LT.toast("Welcome to Lio Tweaks Pro! ⭐"); return; }
    LT.msg("#proMsg", "Payment received! Activating your Pro membership…", "ok");
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 2000));
      if (await LT.refreshMembership() === "pro") { LT.msg("#proMsg", "Welcome to Lio Tweaks Pro! ⭐", "ok"); return; }
    }
    LT.msg("#proMsg", "Your payment went through. Pro can take a minute to activate — refresh this page shortly.", "ok");
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("#proSubscribe").addEventListener("click", (e) => subscribe(e.currentTarget));
    $("#proManage").addEventListener("click", (e) => LT.openBillingPortal(e.currentTarget));
  });

  LT.on("auth", () => { render(); handleCheckoutReturn(); });
  LT.routes.pro = { onEnter() { render(); handleCheckoutReturn(); } };
})(window.LT);
