import { Resend } from "resend";
import { Webhook } from "svix";

export interface SendEmailInput {
  to: string | string[];
  from: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}

/** Outbound transactional email, sent via Resend. */
export function createEmailSender(resendApiKey: string) {
  const resend = new Resend(resendApiKey);
  return async (input: SendEmailInput) => {
    const { data, error } = await resend.emails.send({
      to: input.to,
      from: input.from,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    });
    if (error) throw new Error(`Resend send failed: ${error.message}`);
    return data;
  };
}

/**
 * Resend signs inbound webhook payloads (received emails) with Svix.
 * Call this in your webhook handler before trusting the payload.
 * `secret` is the signing secret shown when you create the webhook in Resend.
 */
export function verifyInboundWebhook(
  secret: string,
  payload: string,
  headers: Record<string, string>
): unknown {
  const webhook = new Webhook(secret);
  return webhook.verify(payload, headers);
}
