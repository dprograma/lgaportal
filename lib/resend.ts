import { Resend } from "resend";

/**
 * Shared, crash-safe Resend client.
 *
 * The Resend constructor THROWS when no API key is provided. Any module that
 * builds a client at import time (`const resend = new Resend(process.env...)`)
 * therefore turns its whole route into a 500 in every environment where
 * RESEND_API_KEY is unset — local dev, CI, previews.
 *
 * Build the real client only when a key exists; otherwise fall back to a no-op
 * sender that logs a warning and reports success, so callers proceed as if the
 * email was accepted for delivery. Import this instead of `new Resend(...)`.
 */
export type SendResult = { error: { message: string } | null };

export interface EmailSender {
  emails: {
    send(opts: {
      from: string;
      to: string | string[];
      subject: string;
      html?: string;
      text?: string;
      replyTo?: string;
      [key: string]: unknown;
    }): Promise<SendResult>;
  };
}

const apiKey = process.env.RESEND_API_KEY;

export const resend: EmailSender = apiKey
  ? (new Resend(apiKey) as unknown as EmailSender)
  : {
      emails: {
        async send({ to, subject }) {
          console.warn(`[email] RESEND_API_KEY not set — skipping email "${subject}" to ${to}`);
          return { error: null };
        },
      },
    };
