import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const from   = process.env.RESEND_FROM    || "LGA Portal <noreply@lgaportal.ng>";
const to     = process.env.CONTACT_EMAIL  || "support@lgaportal.ng";

const schema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email:    z.email("Please enter a valid email address"),
  subject:  z.string().min(1, "Please select a subject"),
  message:  z.string().min(20, "Message must be at least 20 characters"),
});

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;">
        <tr>
          <td style="background:linear-gradient(135deg,#15803d,#16a34a);padding:32px;text-align:center;">
            <span style="color:#fff;font-size:22px;font-weight:700;">🏛️ LGA Citizen Portal</span>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:13px;">Connecting Citizens with Local Government</p>
          </td>
        </tr>
        <tr><td style="padding:40px 32px;">${content}</td></tr>
        <tr>
          <td style="background:#f8fafc;padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#64748b;font-size:12px;">© ${new Date().getFullYear()} LGA Citizen Portal · Nigeria</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 422 }
    );
  }

  const { fullName, email, subject, message } = result.data;

  // Email to support team
  const adminHtml = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;font-weight:700;">New Contact Form Submission</h2>
    <p style="margin:0 0 24px;color:#475569;font-size:14px;">A new message has been submitted via the LGA Citizen Portal contact form.</p>
    <div style="background:#f8fafc;border-radius:10px;padding:20px;border:1px solid #e2e8f0;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:7px 0;color:#64748b;font-size:13px;width:110px;vertical-align:top;">From</td>
          <td style="padding:7px 0;color:#0f172a;font-size:13px;font-weight:600;">${fullName}</td>
        </tr>
        <tr>
          <td style="padding:7px 0;color:#64748b;font-size:13px;vertical-align:top;">Email</td>
          <td style="padding:7px 0;font-size:13px;"><a href="mailto:${email}" style="color:#15803d;">${email}</a></td>
        </tr>
        <tr>
          <td style="padding:7px 0;color:#64748b;font-size:13px;vertical-align:top;">Subject</td>
          <td style="padding:7px 0;color:#0f172a;font-size:13px;">${subject}</td>
        </tr>
      </table>
    </div>
    <div style="background:#f0fdf4;border-radius:10px;padding:20px;border-left:4px solid #16a34a;margin-bottom:24px;">
      <p style="margin:0 0 8px;color:#15803d;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
      <p style="margin:0;color:#0f172a;font-size:14px;line-height:1.75;white-space:pre-wrap;">${message}</p>
    </div>
    <div style="text-align:center;">
      <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}"
         style="background:linear-gradient(135deg,#15803d,#16a34a);color:#fff;text-decoration:none;
                padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;display:inline-block;">
        Reply to ${fullName}
      </a>
    </div>
  `);

  // Auto-reply to sender
  const senderHtml = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;font-weight:700;">We received your message!</h2>
    <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
      Hi <strong>${fullName}</strong>, thank you for reaching out to LGA Citizen Portal.
      Our team will review your message and get back to you within <strong>1–2 business days</strong>.
    </p>
    <div style="background:#f8fafc;border-radius:10px;padding:20px;border:1px solid #e2e8f0;margin-bottom:24px;">
      <p style="margin:0 0 8px;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Your message</p>
      <p style="margin:0 0 6px;color:#0f172a;font-size:13px;font-weight:600;">Subject: ${subject}</p>
      <p style="margin:0;color:#475569;font-size:13px;line-height:1.7;white-space:pre-wrap;">${message}</p>
    </div>
    <p style="margin:0;color:#64748b;font-size:13px;text-align:center;">
      If you need urgent assistance, you can also reach us at
      <a href="mailto:${to}" style="color:#15803d;">${to}</a>
    </p>
  `);

  try {
    await Promise.all([
      resend.emails.send({
        from,
        to,
        replyTo: email,
        subject: `[Contact] ${subject} — from ${fullName}`,
        html: adminHtml,
      }),
      resend.emails.send({
        from,
        to: email,
        subject: "We received your message — LGA Citizen Portal",
        html: senderHtml,
      }),
    ]);
  } catch (err) {
    console.error("Contact email error:", err);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
