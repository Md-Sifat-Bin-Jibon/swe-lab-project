import {
  appUrl,
  BRAND,
  button,
  codeBoxes,
  escapeHtml,
  renderLayout,
} from "@/lib/email/layout";

export type OtpEmailInput = {
  code: string;
  email: string;
  name?: string | null;
  expiresInMinutes: number;
};

export function buildOtpEmail({ code, email, name, expiresInMinutes }: OtpEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = name?.trim().split(/\s+/)[0] || "";
  const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : "Hi there,";
  const verifyUrl = appUrl(`/otp?email=${encodeURIComponent(email)}`);

  const body = `
    <h1 style="margin:0 0 16px;font-size:24px;line-height:32px;font-weight:700;color:${BRAND.text};">
      Verify your email address
    </h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:24px;color:#334155;">${greeting}</p>
    <p style="margin:0 0 28px;font-size:15px;line-height:24px;color:#334155;">
      Thanks for joining ${BRAND.name}! Enter the verification code below to confirm
      <strong style="color:${BRAND.text};">${escapeHtml(email)}</strong> and finish setting up your account.
    </p>

    ${codeBoxes(code)}
    <p style="margin:0 0 32px;text-align:center;font-size:13px;line-height:20px;color:${BRAND.muted};">
      This code expires in <strong style="color:${BRAND.text};">${expiresInMinutes} minutes</strong>.
    </p>

    ${button("Enter code on SwapSpot", verifyUrl)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:36px 0 0;">
      <tr>
        <td style="padding:16px 18px;background-color:#f8fafc;border:1px solid ${BRAND.border};border-radius:12px;font-size:13px;line-height:20px;color:${BRAND.muted};">
          <strong style="color:#334155;">Keep this code private.</strong>
          ${BRAND.name} will never ask you for this code by phone, chat, or email.
          If you didn't create an account, you can safely ignore this message.
        </td>
      </tr>
    </table>`;

  const html = renderLayout({
    title: `Your ${BRAND.name} verification code`,
    preheader: `Your verification code is ${code}. It expires in ${expiresInMinutes} minutes.`,
    body,
    footerNote: `You're receiving this email because someone signed up for ${BRAND.name} with ${escapeHtml(email)}.`,
  });

  const text = [
    `${firstName ? `Hi ${firstName},` : "Hi there,"}`,
    "",
    `Thanks for joining ${BRAND.name}! Use this code to verify ${email}:`,
    "",
    `    ${code}`,
    "",
    `This code expires in ${expiresInMinutes} minutes.`,
    `Enter it here: ${verifyUrl}`,
    "",
    `Keep this code private. ${BRAND.name} will never ask you for it.`,
    "If you didn't create an account, you can ignore this email.",
    "",
    `— The ${BRAND.name} team`,
  ].join("\n");

  return {
    subject: `${code} is your ${BRAND.name} verification code`,
    html,
    text,
  };
}
