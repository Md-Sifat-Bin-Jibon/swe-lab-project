/**
 * One-time helper: turns the Google OAuth client in .env.local into a refresh token.
 *
 *   node scripts/google-oauth.mjs
 *
 * It prints a consent URL, waits for Google to redirect back to
 * http://localhost:5055/oauth2callback, exchanges the code and writes
 * GOOGLE_REFRESH_TOKEN into .env.local. Nothing is sent anywhere else.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const ENV_PATH = path.join(process.cwd(), ".env.local");
const PORT = 5055;
const REDIRECT = `http://localhost:${PORT}/oauth2callback`;
const SCOPE = "https://www.googleapis.com/auth/calendar.events";

function readEnv() {
  const text = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8") : "";
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (match) values[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  return { text, values };
}

function writeRefreshToken(token) {
  const { text } = readEnv();
  const line = `GOOGLE_REFRESH_TOKEN=${token}`;
  const updated = /^GOOGLE_REFRESH_TOKEN=.*$/m.test(text)
    ? text.replace(/^GOOGLE_REFRESH_TOKEN=.*$/m, line)
    : `${text.replace(/\s*$/, "")}\n${line}\n`;
  fs.writeFileSync(ENV_PATH, updated);
}

const { values } = readEnv();
const clientId = values.GOOGLE_CLIENT_ID;
const clientSecret = values.GOOGLE_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error("Put GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local first.");
  process.exit(1);
}

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
  });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== "/oauth2callback") {
    res.writeHead(404).end("Not found");
    return;
  }

  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  if (error || !code) {
    res.writeHead(400, { "content-type": "text/html" }).end(`<p>Google said: ${error || "no code"}</p>`);
    console.error("Consent failed:", error || "no code returned");
    server.close();
    process.exit(1);
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT,
        grant_type: "authorization_code",
      }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.refresh_token) {
      throw new Error(payload.error_description || payload.error || "no refresh_token in response");
    }
    writeRefreshToken(payload.refresh_token);
    res.writeHead(200, { "content-type": "text/html" }).end(
      "<h2>SwapSpot is connected to Google Meet.</h2><p>You can close this tab and restart the dev server.</p>"
    );
    console.log("\nGOOGLE_REFRESH_TOKEN written to .env.local. Restart `npm run dev`.");
  } catch (err) {
    res.writeHead(500, { "content-type": "text/html" }).end(`<p>${String(err.message || err)}</p>`);
    console.error("Token exchange failed:", err.message || err);
  } finally {
    server.close();
    setTimeout(() => process.exit(0), 300);
  }
});

server.listen(PORT, () => {
  console.log("\nOpen this URL in your browser, sign in as the account that owns the calendar, and allow access:\n");
  console.log(authUrl.toString());
  console.log(`\nWaiting for the redirect on ${REDIRECT} …`);
});
