/* =========================================================
   LIO TWEAKS — start the site (loads last)
   ========================================================= */
(function (LT) {
  LT.routes.home = { onEnter() {} };
  LT.routes.tools = { onEnter() {} };
  LT.routes.community = { onEnter() {} };
  document.addEventListener("DOMContentLoaded", () => LT.startRouter());
})(window.LT);
