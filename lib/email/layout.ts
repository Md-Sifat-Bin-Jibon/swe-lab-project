/**
 * Shared, email-client-safe layout (table-based, inline styles, 600px max).
 * Works in Gmail, Outlook, Apple Mail and mobile clients.
 */

export const BRAND = {
  name: "SwapSpot",
  blue: "#4a5fd9",
  blueDark: "#3f52c4",
  blueSoft: "#eef1fd",
  bg: "#f8f7ff",
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  font:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
} as const;

/** Content-ID of the inline logo attachment (see lib/mailer.ts). */
export const LOGO_CID = "swapspot-logo";

export function appUrl(path = ""): string {
  const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  return `${base}${path}`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function button(label: string, href: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
    <tr>
      <td align="center" bgcolor="${BRAND.blue}" style="border-radius:12px;">
        <a href="${escapeHtml(href)}" target="_blank"
           style="display:inline-block;padding:14px 32px;font-family:${BRAND.font};font-size:15px;font-weight:600;line-height:20px;color:#ffffff;text-decoration:none;border-radius:12px;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

/** Renders a numeric code as individual, large, spaced boxes. */
export function codeBoxes(code: string): string {
  const spacer = `<td width="8" style="width:8px;font-size:0;">&nbsp;</td>`;
  const cells = code
    .split("")
    .map(
      (d) => `
        <td class="otp-digit" align="center" valign="middle" width="48" height="60"
            style="width:48px;height:60px;border:1px solid #d7ddfa;border-radius:12px;background-color:${BRAND.blueSoft};font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:28px;font-weight:700;color:${BRAND.blue};">
          ${escapeHtml(d)}
        </td>`
    )
    .join(spacer);

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 12px;border-collapse:separate;">
      <tr>${cells}</tr>
    </table>`;
}

export function renderLayout(options: {
  title: string;
  preheader: string;
  body: string;
  footerNote?: string;
}): string {
  const year = new Date().getFullYear();
  const { title, preheader, body, footerNote } = options;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin:0; padding:0; width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table { border-collapse:collapse; mso-table-lspace:0; mso-table-rspace:0; }
    img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
    a { color:${BRAND.blue}; }
    @media only screen and (max-width:620px) {
      .container { width:100% !important; }
      .px { padding-left:24px !important; padding-right:24px !important; }
      .otp-digit { width:40px !important; height:52px !important; font-size:24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};">
  <!-- Preheader: shown as the inbox preview line, hidden in the body -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${BRAND.bg};opacity:0;">
    ${escapeHtml(preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.bg}" style="background-color:${BRAND.bg};">
    <tr>
      <td align="center" style="padding:40px 12px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

          <!-- Header / logo -->
          <tr>
            <td align="center" style="padding:0 0 24px;">
              <a href="${escapeHtml(appUrl("/"))}" target="_blank" style="text-decoration:none;">
                <img src="cid:${LOGO_CID}" width="52" height="48" alt="${BRAND.name}" style="display:block;margin:0 auto 8px;">
                <span style="font-family:${BRAND.font};font-size:22px;font-weight:700;letter-spacing:-0.3px;color:${BRAND.text};">${BRAND.name}</span>
              </a>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:20px;border:1px solid ${BRAND.border};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td height="6" bgcolor="${BRAND.blue}" style="height:6px;line-height:6px;font-size:0;background-color:${BRAND.blue};border-radius:20px 20px 0 0;">&nbsp;</td>
                </tr>
                <tr>
                  <td class="px" style="padding:40px 48px 44px;font-family:${BRAND.font};color:${BRAND.text};">
                    ${body}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="px" align="center" style="padding:28px 48px 0;font-family:${BRAND.font};font-size:12px;line-height:18px;color:${BRAND.muted};">
              ${footerNote ? `<p style="margin:0 0 10px;">${footerNote}</p>` : ""}
              <p style="margin:0 0 6px;">${BRAND.name} &middot; Trade skills, not money.</p>
              <p style="margin:0;">&copy; ${year} ${BRAND.name}. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
