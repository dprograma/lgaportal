import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const from = process.env.RESEND_FROM || "LGA Portal <noreply@lgaportal.ng>";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ─── Base HTML template ────────────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LGA Citizen Portal</title>
</head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#15803d,#16a34a);padding:32px;text-align:center;">
            <div style="display:inline-block;margin-bottom:8px;">
              <span style="display:inline-block;width:40px;height:40px;background:rgba(255,255,255,0.2);border-radius:10px;line-height:40px;text-align:center;font-size:20px;vertical-align:middle;">&#127963;</span>
              <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;vertical-align:middle;margin-left:10px;">LGA Citizen Portal</span>
            </div>
            <p style="color:rgba(255,255,255,0.85);margin:0;font-size:13px;">Connecting Citizens with Local Government</p>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:40px 32px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#64748b;font-size:12px;">© ${new Date().getFullYear()} LGA Citizen Portal &middot; Nigeria</p>
            <p style="margin:6px 0 0;color:#94a3b8;font-size:11px;">This email was sent because you have an account on LGA Citizen Portal.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Citizen: Email verification ──────────────────────────────────────────

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;

  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:24px;font-weight:700;">Verify Your Email Address</h2>
    <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
      Hi <strong>${name}</strong>, welcome to LGA Citizen Portal! Please verify your email address to
      activate your account and start engaging with your local government.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${verifyUrl}"
         style="background:linear-gradient(135deg,#15803d,#16a34a);color:#ffffff;text-decoration:none;
                padding:14px 32px;border-radius:10px;font-size:16px;font-weight:600;display:inline-block;">
        Verify Email Address
      </a>
    </div>
    <p style="margin:0;color:#64748b;font-size:13px;text-align:center;">
      This link expires in <strong>24 hours</strong>. If you did not create an account, you can safely ignore this email.
    </p>
    <div style="margin:24px 0 0;padding:16px;background:#f0fdf4;border-radius:8px;border-left:4px solid #16a34a;">
      <p style="margin:0;color:#15803d;font-size:12px;">
        Or copy this link into your browser:<br />
        <span style="word-break:break-all;">${verifyUrl}</span>
      </p>
    </div>
  `);

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: "Verify your LGA Portal account",
    html,
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

// ─── Citizen: Password reset ───────────────────────────────────────────────

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:24px;font-weight:700;">Reset Your Password</h2>
    <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
      Hi <strong>${name}</strong>, we received a request to reset the password for your account.
      Click the button below to choose a new password.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${resetUrl}"
         style="background:linear-gradient(135deg,#15803d,#16a34a);color:#ffffff;text-decoration:none;
                padding:14px 32px;border-radius:10px;font-size:16px;font-weight:600;display:inline-block;">
        Reset Password
      </a>
    </div>
    <p style="margin:0;color:#64748b;font-size:13px;text-align:center;">
      This link expires in <strong>1 hour</strong>. If you didn't request a password reset,
      please ignore this email — your password will remain unchanged.
    </p>
    <div style="margin:24px 0 0;padding:16px;background:#fef2f2;border-radius:8px;border-left:4px solid #ef4444;">
      <p style="margin:0;color:#b91c1c;font-size:12px;">
        If you didn't request this, your account may be at risk. Consider changing your password.
      </p>
    </div>
  `);

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: "Reset your LGA Portal password",
    html,
  });

  if (error) {
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
}

// ─── LGA: Email verification ───────────────────────────────────────────────

export async function sendLGAVerificationEmail(
  email: string,
  chairmanName: string,
  lgaName: string,
  token: string
): Promise<void> {
  const verifyUrl = `${appUrl}/lga-verify-email?token=${token}`;

  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:24px;font-weight:700;">Verify Your LGA Account</h2>
    <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
      Hi <strong>${chairmanName}</strong>, your LGA registration for <strong>${lgaName}</strong> has been
      submitted successfully. Please verify your email address to complete the registration process.
    </p>
    <div style="margin:0 0 24px;padding:16px;background:#fefce8;border-radius:8px;border-left:4px solid #ca8a04;">
      <p style="margin:0;color:#854d0e;font-size:13px;font-weight:600;">
        &#9888;&#65039; After email verification, your LGA profile will undergo an admin review
        (3&ndash;5 business days) before being activated on the platform.
      </p>
    </div>
    <div style="text-align:center;margin:32px 0;">
      <a href="${verifyUrl}"
         style="background:linear-gradient(135deg,#15803d,#16a34a);color:#ffffff;text-decoration:none;
                padding:14px 32px;border-radius:10px;font-size:16px;font-weight:600;display:inline-block;">
        Verify Email Address
      </a>
    </div>
    <p style="margin:0;color:#64748b;font-size:13px;text-align:center;">
      This link expires in <strong>24 hours</strong>.
    </p>
    <div style="margin:24px 0 0;padding:16px;background:#f0fdf4;border-radius:8px;border-left:4px solid #16a34a;">
      <p style="margin:0;color:#15803d;font-size:12px;">
        Or copy this link:<br />
        <span style="word-break:break-all;">${verifyUrl}</span>
      </p>
    </div>
  `);

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: `LGA Portal — Verify ${lgaName} account`,
    html,
  });

  if (error) {
    throw new Error(`Failed to send LGA verification email: ${error.message}`);
  }
}

// ─── LGA: Password reset ───────────────────────────────────────────────────

export async function sendLGAPasswordResetEmail(
  email: string,
  chairmanName: string,
  token: string
): Promise<void> {
  const resetUrl = `${appUrl}/lga-reset-password?token=${token}`;

  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:24px;font-weight:700;">Reset LGA Account Password</h2>
    <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
      Hi <strong>${chairmanName}</strong>, we received a request to reset the password for your LGA
      administrator account. Click the button below to set a new password.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${resetUrl}"
         style="background:linear-gradient(135deg,#15803d,#16a34a);color:#ffffff;text-decoration:none;
                padding:14px 32px;border-radius:10px;font-size:16px;font-weight:600;display:inline-block;">
        Reset Password
      </a>
    </div>
    <p style="margin:0;color:#64748b;font-size:13px;text-align:center;">
      This link expires in <strong>1 hour</strong>. If you didn't request this, please ignore this email.
    </p>
  `);

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: "Reset your LGA Portal admin password",
    html,
  });

  if (error) {
    throw new Error(`Failed to send LGA password reset email: ${error.message}`);
  }
}
