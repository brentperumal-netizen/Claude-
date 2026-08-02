// Supabase Edge Function (Deno) that receives Resend's inbound-email webhook.
// Deploy with:
//   supabase functions deploy inbound-email --no-verify-jwt
// (--no-verify-jwt because this is called by Resend, not a signed-in user)
//
// Requires the RESEND_INBOUND_WEBHOOK_SECRET secret (shown when you create
// the webhook in the Resend dashboard):
//   supabase secrets set RESEND_INBOUND_WEBHOOK_SECRET=whsec_xxx
//
// Point Resend's inbound webhook at:
//   https://<project-ref>.supabase.co/functions/v1/inbound-email

import { Webhook } from "npm:svix@1";
import { createClient } from "npm:@supabase/supabase-js@2";

const webhookSecret = Deno.env.get("RESEND_INBOUND_WEBHOOK_SECRET")!;
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);

  let event: unknown;
  try {
    event = new Webhook(webhookSecret).verify(payload, headers);
  } catch {
    return new Response("invalid signature", { status: 401 });
  }

  // Shape it however this app needs — store the raw event for now.
  // See Resend's inbound email docs for the full payload schema.
  const { error } = await supabase.from("inbound_emails").insert({ payload: event });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response("ok");
});
