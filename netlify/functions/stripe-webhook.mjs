// POST /api/stripe-webhook
// Stripe calls this after payments and subscription changes.
// This is the ONLY place membership is ever changed.
import { stripe, supabaseAdmin, missingEnv } from "../lib/server.mjs";

// past_due = card failed but Stripe is still retrying, so keep access for now.
// Remove "past_due" if you want access cut off on the first failed payment.
const PRO_STATUSES = new Set(["active", "trialing", "past_due"]);

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const missing = missingEnv(["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  if (missing.length) {
    console.error("Missing Netlify environment variables:", missing.join(", "));
    return new Response("Server not configured", { status: 500 });   // Stripe will retry later
  }

  // 1. Prove the request really came from Stripe
  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();
  let event;
  try {
    event = stripe().webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature check failed:", err.message);
    return new Response("Invalid signature", { status: 400 });
  }

  // 2. Update membership
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode !== "subscription" || !session.subscription) break;
        const userId = session.client_reference_id || session.metadata?.supabase_user_id;
        if (!userId) break;
        const sub = await stripe().subscriptions.retrieve(session.subscription);
        await applySubscription(userId, sub, false);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const userId = sub.metadata?.supabase_user_id || (await userIdForCustomer(sub.customer));
        if (!userId) break;
        await applySubscription(userId, sub, event.type === "customer.subscription.deleted");
        break;
      }
      default:
        break; // ignore other events
    }
  } catch (err) {
    console.error(`Webhook handling failed for ${event.type}:`, err);
    return new Response("Webhook handler error", { status: 500 }); // Stripe will retry
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

async function applySubscription(userId, sub, deleted) {
  const isPro = !deleted && PRO_STATUSES.has(sub.status);
  const db = supabaseAdmin();

  // Don't let a late event about an OLD subscription downgrade someone
  // who has since started a new one.
  if (!isPro) {
    const { data: profile } = await db
      .from("profiles")
      .select("stripe_subscription_id")
      .eq("id", userId)
      .maybeSingle();
    if (profile?.stripe_subscription_id && profile.stripe_subscription_id !== sub.id) return;
  }

  const { error } = await db.from("profiles").upsert({
    id: userId,
    membership: isPro ? "pro" : "free",
    stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
    stripe_subscription_id: sub.id
  });
  if (error) throw error;
}

async function userIdForCustomer(customerId) {
  if (!customerId) return null;
  const { data } = await supabaseAdmin()
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.id || null;
}

export const config = { path: "/api/stripe-webhook" };
