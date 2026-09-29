import fs from "node:fs";
import path from "node:path";
import nodemailer, { type Transporter } from "nodemailer";
import { LOGO_CID } from "@/lib/email/layout";
import { buildOtpEmail, type OtpEmailInput } from "@/lib/email/otpEmail";
import { buildPasswordResetEmail } from "@/lib/email/passwordResetEmail";

type GlobalMailer = typeof globalThis & { __swapspotMailer?: Transporter };

/** True when the SMTP env vars needed to send mail are present. */
export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

function getTransporter(): Transporter {
  const g = globalThis as GlobalMailer;
  if (g.__swapspotMailer) return g.__swapspotMailer;

  const port = Number(process.env.SMTP_PORT || 587);
  // Port 465 uses implicit TLS; 587/25 upgrade with STARTTLS.
  const secure =
    process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === "true"
      : port === 465;

  g.__swapspotMailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return g.__swapspotMailer;
}

const LOGO_PATH = path.join(process.cwd(), "public", "images", "email-logo.png");

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  // Attach the logo inline (cid:) so it shows even when remote images are blocked.
  const attachments =
    options.html?.includes(`cid:${LOGO_CID}`) && fs.existsSync(LOGO_PATH)
      ? [{ filename: "swapspot-logo.png", path: LOGO_PATH, cid: LOGO_CID }]
      : [];

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM,
    ...options,
    attachments,
  });
}

export async function sendOtpEmail(input: OtpEmailInput): Promise<void> {
  const { subject, html, text } = buildOtpEmail(input);
  await sendMail({ to: input.email, subject, html, text });
}

export async function sendPasswordResetEmail(input: OtpEmailInput): Promise<void> {
  const { subject, html, text } = buildPasswordResetEmail(input);
  await sendMail({ to: input.email, subject, html, text });
}
