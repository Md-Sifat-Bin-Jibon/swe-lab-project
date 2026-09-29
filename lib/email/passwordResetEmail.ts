import {
  appUrl,
  BRAND,
  button,
  codeBoxes,
  escapeHtml,
  renderLayout,
} from "@/lib/email/layout";
import type { OtpEmailInput } from "@/lib/email/otpEmail";

export function buildPasswordResetEmail({
  code,
  email,
  name,
  expiresInMinutes,
}: OtpEmailInput): { subject: string; html: string; text: string } {
  const firstName = name?.trim().split(/\s+/)[0] || "";
  const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : "Hi there,";
  const resetUrl = appUrl(`/reset-password?email=${encodeURIComponent(email)}`);

  const body = `
    <h1 style="margin:0 0 16px;font-size:24px;line-height:32px;font-weight:700;color:${BRAND.text};">
      Reset your password
    </h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:24px;color:#334155;">${greeting}</p>
    <p style="margin:0 0 28px;font-size:15px;line-height:24px;color:#334155;">
      We received a request to reset the password for your ${BRAND.name} account
      <strong style="color:${BRAND.text};">${escapeHtml(email)}</strong>.
      Use the code below to choose a new password.
    </p>

    ${codeBoxes(code)}
    <p style="margin:0 0 32px;text-align:center;font-size:13px;line-height:20px;color:${BRAND.muted};">
      This code expires in <strong style="color:${BRAND.text};">${expiresInMinutes} minutes</strong>.
    </p>

    ${button("Reset password", resetUrl)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:36px 0 0;">
      <tr>
        <td style="padding:16px 18px;background-color:#fff7ed;border:1px solid #fed7aa;border-radius:12px;font-size:13px;line-height:20px;color:#9a3412;">
          <strong>Didn't request this?</strong>
          You can safely ignore this email — your password won't change unless you enter this code.
          Never share this code with anyone, including ${BRAND.name} staff.
        </td>
      </tr>
    </table>`;

  const html = renderLayout({
    title: `Reset your ${BRAND.name} password`,
    preheader: `Your password reset code is ${code}. It expires in ${expiresInMinutes} minutes.`,
    body,
    footerNote: `You're receiving this email because a password reset was requested for ${escapeHtml(email)}.`,
  });

  const text = [
    firstName ? `Hi ${firstName},` : "Hi there,",
    "",
    `We received a request to reset the password for your ${BRAND.name} account (${email}).`,
    "",
    `Your reset code: ${code}`,
    "",
    `This code expires in ${expiresInMinutes} minutes.`,
    `Reset your password here: ${resetUrl}`,
    "",
    "Didn't request this? Ignore this email — your password won't change.",
    "",
    `— The ${BRAND.name} team`,
  ].join("\n");

  return {
    subject: `${code} is your ${BRAND.name} password reset code`,
    html,
    text,
  };
}
