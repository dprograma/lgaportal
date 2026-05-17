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

// ─── Investment: Investor welcome ──────────────────────────────────────────

export async function sendInvestorWelcomeEmail(
  email: string,
  fullName: string
): Promise<void> {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:24px;font-weight:700;">Welcome to LGA Portal Investor Network</h2>
    <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
      Dear <strong>${fullName}</strong>, thank you for registering as an investor on LGA Portal.
      Your profile has been received and is currently under review by our team.
    </p>
    <div style="margin:0 0 24px;padding:20px;background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;">
      <p style="margin:0 0 10px;color:#15803d;font-size:14px;font-weight:600;">What happens next?</p>
      <ul style="margin:0;padding-left:20px;color:#475569;font-size:13px;line-height:2;">
        <li>Our team reviews your investment profile (1&ndash;2 business days)</li>
        <li>You will be matched with LGAs whose endowments align with your sectors</li>
        <li>We will send you a curated list of verified LGA opportunities</li>
        <li>You can then reach out directly to LGA investment desks</li>
      </ul>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${appUrl}/lgas?tab=investment"
         style="background:linear-gradient(135deg,#15803d,#16a34a);color:#ffffff;text-decoration:none;
                padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;display:inline-block;">
        Browse LGA Opportunities
      </a>
    </div>
    <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
      Questions? Reply to this email or contact invest@lgaportal.ng
    </p>
  `);

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: "Your LGA Portal investor profile has been received",
    html,
  });

  if (error) {
    throw new Error(`Failed to send investor welcome email: ${error.message}`);
  }
}

// ─── Investment: Inquiry notification to LGA ──────────────────────────────

interface InquiryNotificationParams {
  lgaEmail:      string;
  lgaName:       string;
  investorName:  string;
  investorEmail: string;
  company?:      string;
  message:       string;
}

export async function sendInquiryNotificationToLGA(
  params: InquiryNotificationParams
): Promise<void> {
  const { lgaEmail, lgaName, investorName, investorEmail, company, message } = params;

  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:24px;font-weight:700;">New Investment Inquiry</h2>
    <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
      <strong>${lgaName} LGA</strong> has received a new investment inquiry via LGA Portal.
    </p>
    <div style="margin:0 0 24px;padding:20px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:13px;width:130px;vertical-align:top;">Investor Name</td>
          <td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:600;">${investorName}</td>
        </tr>
        ${company ? `
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:13px;vertical-align:top;">Company</td>
          <td style="padding:6px 0;color:#0f172a;font-size:13px;">${company}</td>
        </tr>` : ""}
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:13px;vertical-align:top;">Email</td>
          <td style="padding:6px 0;color:#15803d;font-size:13px;"><a href="mailto:${investorEmail}" style="color:#15803d;">${investorEmail}</a></td>
        </tr>
      </table>
    </div>
    <div style="margin:0 0 24px;padding:20px;background:#f0fdf4;border-radius:10px;border-left:4px solid #16a34a;">
      <p style="margin:0 0 6px;color:#15803d;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
      <p style="margin:0;color:#0f172a;font-size:14px;line-height:1.7;">${message}</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="mailto:${investorEmail}"
         style="background:linear-gradient(135deg,#15803d,#16a34a);color:#ffffff;text-decoration:none;
                padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;display:inline-block;">
        Reply to Investor
      </a>
    </div>
    <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
      You can also view and manage this inquiry from your LGA dashboard.
    </p>
  `);

  const { error } = await resend.emails.send({
    from,
    to: lgaEmail,
    subject: `New investment inquiry — ${lgaName} LGA`,
    html,
  });

  if (error) {
    throw new Error(`Failed to send inquiry notification: ${error.message}`);
  }
}
