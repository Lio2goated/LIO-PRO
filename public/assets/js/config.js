/* =========================================================
   LIO TWEAKS — site settings
   Edit this file to change keys and limits.
   The publishable key is SAFE to be public.
   NEVER put the service_role key or any Stripe secret key here.
   ========================================================= */
window.LT_CONFIG = {
  supabaseUrl: "https://hbyqplzdzkuiibhaofcg.supabase.co",
  supabaseKey: "sb_publishable_pAnqASHfkApz3NQJnmgq-g_1TVQmPvs",

  // Shown to users. The real limits are enforced by the database (see supabase/setup.sql).
  freeProfileLimit: 10,
  proProfileLimit: 100,

  // Stripe Payment Link for Pro ($15/month). When this is set, the
  // "Get Lio Tweaks Pro" button uses it. Leave it as "" to use the
  // checkout function instead. Test links start with https://buy.stripe.com/test_
  stripePaymentLink: "https://buy.stripe.com/bJe3cv2tW2nG8dfeHH0Jq01",

  // Netlify Functions used for Pro payments
  api: {
    checkout: "/api/create-checkout",
    portal: "/api/billing-portal"
  },

  discordUrl: "https://discord.gg/meK8HTgKV"
};
