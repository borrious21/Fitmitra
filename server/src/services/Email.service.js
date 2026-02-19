// src/services/email.service.js
import transporter, { MAIL_FROM } from "../config/mailer.config.js";

const OTP_EXPIRY_MINUTES = 10;

// ── Shared HTML shell ─────────────────────────────────────────────────────────
function buildEmailHtml({ title, preheader, bodyHtml }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <!-- preheader (hidden preview text) -->
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;
                      box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#16a34a;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;
                         letter-spacing:0.5px;">FitMitra</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;text-align:center;
                       border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                This email was sent by FitMitra. If you didn't request this, you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── OTP block shared between both email types ─────────────────────────────────
function otpBlock(otp) {
  return `
    <div style="margin:28px 0;text-align:center;">
      <div style="display:inline-block;background:#f0fdf4;border:2px solid #16a34a;
                  border-radius:10px;padding:18px 40px;">
        <span style="font-size:36px;font-weight:700;letter-spacing:8px;
                     color:#15803d;font-family:monospace;">${otp}</span>
      </div>
    </div>
    <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-align:center;">
      This code expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.
    </p>
    <p style="margin:0;font-size:13px;color:#6b7280;text-align:center;">
      Do not share this code with anyone.
    </p>`;
}

// ── 1. Email verification OTP ─────────────────────────────────────────────────
export async function sendVerificationOtp(to, otp) {
  const bodyHtml = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827;">Verify your email</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      Thanks for signing up! Use the code below to verify your email address
      and activate your FitMitra account.
    </p>
    ${otpBlock(otp)}`;

  await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject: `${otp} is your FitMitra verification code`,
    html: buildEmailHtml({
      title: "Verify your email – FitMitra",
      preheader: `Your verification code is ${otp}. Expires in ${OTP_EXPIRY_MINUTES} minutes.`,
      bodyHtml,
    }),
  });
}

// ── 2. Password reset OTP ─────────────────────────────────────────────────────
export async function sendPasswordResetOtp(to, otp) {
  const bodyHtml = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827;">Reset your password</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      We received a request to reset the password for your account.
      Enter the code below to proceed.
    </p>
    ${otpBlock(otp)}
    <p style="margin:20px 0 0;font-size:13px;color:#6b7280;text-align:center;">
      If you did not request a password reset, no action is required.
    </p>`;

  await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject: `${otp} is your FitMitra password reset code`,
    html: buildEmailHtml({
      title: "Reset your password – FitMitra",
      preheader: `Your password reset code is ${otp}. Expires in ${OTP_EXPIRY_MINUTES} minutes.`,
      bodyHtml,
    }),
  });
}