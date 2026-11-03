// POST /api/create-checkout
// Starts a Stripe Checkout page for the $15/month Pro plan.
import { stripe, supabaseAdmin, json, siteUrl, getUserFromRequest, missingEnv } from "../lib/server.mjs";

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const missing = missingEnv(["STRIPE_SECRET_KEY", "STRIPE_PRICE_ID", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  if (missing.length) {
    console.error("Missing Netlify environment variables:", missing.join(", "));
    return json(500, { error: `Payments aren't fully set up yet. Missing in Netlify: ${missing.join(", ")}` });
  }

  const user = await getUserFromRequest(req);
  if (!user) return json(401, { error: "Please log in first." });

  try {
    const { data: profile } = await supabaseAdmin()
      .from("profiles")
      .select("membership, stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.membership === "pro") {
      return json(400, { error: "You're already a Pro member." });
    }

    const params = {
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      client_reference_id: user.id,
      metadata: { supabase_user_id: user.id },
      subscription_data: { metadata: { supabase_user_id: user.id } },
      allow_promotion_codes: true,
      success_url: `${siteUrl()}/?checkout=success#/pro`,
      cancel_url: `${siteUrl()}/?checkout=cancelled#/pro`
    };

    // Reuse the same Stripe customer if they've subscribed before
    if (profile?.stripe_customer_id) params.customer = profile.stripe_customer_id;
    else params.customer_email = user.email;

    const session = await stripe().checkout.sessions.create(params);
    return json(200, { url: session.url });
  } catch (err) {
    console.error("create-checkout failed:", err);
    return json(500, { error: "Couldn't start checkout: " + (err?.message || "unknown error") });
  }
};

export const config = { path: "/api/create-checkout" };
