// Shared helpers for the Netlify Functions.
// These run on Netlify's servers — secret keys here are never sent to the browser.
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

let _stripe, _supabase;

export function stripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return _stripe;
}

// Admin client: uses the service_role key, which bypasses RLS.
// That's why ONLY server code (these functions) may use it.
export function supabaseAdmin() {
  if (!_supabase) {
    _supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return _supabase;
}

export function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

// Netlify sets URL to your site's main address automatically.
export function siteUrl() {
  return (process.env.URL || "http://localhost:8888").replace(/\/$/, "");
}

// Reads "Authorization: Bearer <token>" and asks Supabase who it belongs to.
// Never trust a user ID sent from the browser — only a verified token.
export async function getUserFromRequest(req) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    const { data, error } = await supabaseAdmin().auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  } catch (err) {
    console.error("Token check failed:", err);
    return null;
  }
}

// Returns the names of any required Netlify environment variables that are missing.
export function missingEnv(names) {
  return names.filter((n) => !process.env[n] || !String(process.env[n]).trim());
}
