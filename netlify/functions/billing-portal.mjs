// POST /api/billing-portal
// Sends a Pro member to Stripe's page to update their card or cancel.
import { stripe, supabaseAdmin, json, siteUrl, getUserFromRequest, missingEnv } from "../lib/server.mjs";

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const missing = missingEnv(["STRIPE_SECRET_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  if (missing.length) {
    console.error("Missing Netlify environment variables:", missing.join(", "));
    return json(500, { error: `Payments aren't fully set up yet. Missing in Netlify: ${missing.join(", ")}` });
  }

  const user = await getUserFromRequest(req);
  if (!user) return json(401, { error: "Please log in first." });

  try {
    const { data: profile } = await supabaseAdmin()
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.stripe_customer_id) {
      return json(400, { error: "No billing account found for this login." });
    }

    const session = await stripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${siteUrl()}/#/dashboard`
    });
    return json(200, { url: session.url });
  } catch (err) {
    console.error("billing-portal failed:", err);
    return json(500, { error: "Couldn't open billing: " + (err?.message || "unknown error") });
  }
};

export const config = { path: "/api/billing-portal" };
