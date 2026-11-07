/**
 * Transactional email. Uses Resend when configured; otherwise logs in development.
 * Never logs message bodies in production.
 */
import { config } from "@/lib/config";

export async function sendMail({ to, subject, html, text }) {
  if (!config.mail.resendKey) {
    if (!config.isProd) {
      console.info(`[mail:dev] to=${to} subject="${subject}"`);
      if (text) console.info(`[mail:dev] ${text}`);
    } else {
      console.warn("[mail] RESEND_API_KEY is not configured; email was not sent.");
    }
    return { delivered: false, reason: "not-configured" };
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.mail.resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: config.mail.from, to, subject, html, text }),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`[mail] provider error ${response.status}: ${body.slice(0, 300)}`);
      return { delivered: false, reason: "provider-error" };
    }
    return { delivered: true };
  } catch (error) {
    console.error(`[mail] request failed: ${error?.message || error}`);
    return { delivered: false, reason: "network" };
  }
}

export async function sendVerificationEmail({ to, name, link }) {
  return sendMail({
    to,
    subject: "Verify your MIC TECH account",
    text: `Hello ${name},\n\nConfirm your email to activate your MIC TECH account:\n${link}\n\nThis link expires in 24 hours. If you did not register, ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#151515">
      <h1 style="font-family:Georgia,serif">MIC TECH</h1>
      <p>Hello ${escape(name)},</p>
      <p>Confirm your email address to activate your MIC TECH account.</p>
      <p><a href="${link}" style="background:#C5A24B;color:#151515;padding:12px 20px;text-decoration:none;font-weight:bold">Verify email</a></p>
      <p style="color:#666;font-size:13px">This link expires in 24 hours. If you did not register, you can ignore this email.</p>
    </div>`,
  });
}

export async function sendPasswordResetEmail({ to, name, link }) {
  return sendMail({
    to,
    subject: "Reset your MIC TECH password",
    text: `Hello ${name},\n\nReset your password using this link (valid for one hour):\n${link}\n\nIf you did not request this, ignore the email.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#151515">
      <h1 style="font-family:Georgia,serif">MIC TECH</h1>
      <p>Hello ${escape(name)},</p>
      <p>Use the button below to choose a new password.</p>
      <p><a href="${link}" style="background:#C5A24B;color:#151515;padding:12px 20px;text-decoration:none;font-weight:bold">Reset password</a></p>
      <p style="color:#666;font-size:13px">The link expires in one hour. If you did not request this, ignore the email.</p>
    </div>`,
  });
}

function escape(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
