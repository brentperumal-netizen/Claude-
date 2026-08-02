// Supabase Edge Function (Deno). Deploy with:
//   supabase functions deploy send-email
// Requires the RESEND_API_KEY secret:
//   supabase secrets set RESEND_API_KEY=re_xxx
//
// Call it from your app with the user's Clerk-authenticated Supabase client:
//   await supabase.functions.invoke("send-email", { body: { to, subject, html } })

import { Resend } from "npm:resend@4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
const FROM_ADDRESS = Deno.env.get("EMAIL_FROM")!; // e.g. "App Name <noreply@yourdomain.com>"

Deno.serve(async (req) => {
  const { to, subject, html, text } = await req.json();

  const { data, error } = await resend.emails.send({
    to,
    from: FROM_ADDRESS,
    subject,
    html,
    text,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 502 });
  }
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
});
