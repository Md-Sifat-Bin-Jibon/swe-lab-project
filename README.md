# SwapSpot

Skill-swap platform built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **SQLite** (`node:sqlite`).

## Setup

Requires **Node.js 22.5+** (built-in SQLite).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional: copy `.env.example` to `.env.local` and set `JWT_SECRET`.

## Demo account

| Field | Value |
|-------|-------|
| Email | `demo@swapspot.test` |
| Password | `password123` |

After registering, a 6-digit OTP is emailed via SMTP (see below). If SMTP isn't configured in development, the code is printed in the server console and shown in a toast.

## Email (SMTP)

Set these in `.env.local`:

| Variable | Example | Notes |
|----------|---------|-------|
| `SMTP_HOST` | `smtp.gmail.com` | Required to send mail |
| `SMTP_PORT` | `587` | `465` = SSL, `587` = STARTTLS |
| `SMTP_SECURE` | `false` | Optional; defaults to `true` only for port 465 |
| `SMTP_USER` | `you@gmail.com` | |
| `SMTP_PASS` | `app-password` | For Gmail, use an App Password |
| `SMTP_FROM` | `SwapSpot <you@gmail.com>` | Required sender address |
| `APP_URL` | `http://localhost:3000` | Base URL for links in emails |

OTPs expire after 10 minutes, allow 5 attempts, and can be resent once every 60 seconds. They're stored hashed. Email templates live in `lib/email/`.

## AI swap plans (OpenAI)

When a swap is accepted, both people get a to-do list (teach / learn / together tasks with due dates), generated in the background.

| Variable | Example | Notes |
|----------|---------|-------|
| `OPENAI_API_KEY` | `sk-...` | Enables AI plans. Without it, a built-in standard plan is used |
| `OPENAI_MODEL` | `gpt-4.1-mini` | Optional; any Chat Completions model with Structured Outputs |

Restart `npm run dev` after changing `.env.local`.

## Meetings (Google Meet)

Members can invite each other to a video call from an active swap. With Google credentials set, SwapSpot creates a real Google Meet link through the Calendar API and emails both members a calendar invite; without them it creates its own meeting room link instead.

| Variable | Notes |
|----------|-------|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth client (Google Cloud console) |
| `GOOGLE_REFRESH_TOKEN` | Offline token for the Google account that owns the calendar, scope `https://www.googleapis.com/auth/calendar.events` |
| `GOOGLE_CALENDAR_ID` | Optional, defaults to `primary` |

## Message screening

Chat messages are checked before they are stored: rules catch emails, phone numbers, outside links and messaging handles, and (with `OPENAI_API_KEY` set) an AI pass catches obfuscated attempts. Anything found is replaced with `[removed by SwapSpot]`, the sender is told, and the removal appears in the admin Moderation queue.

## Admin panel

Sign in at [http://localhost:3000/admin](http://localhost:3000/admin). The first admin account is created on first run from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (defaults: `admin@swapspot.test` / `admin12345` — change these before deploying).

Sections: Dashboard, Users, Verifications, Projects, Swaps, Wallet, Chat, Activity log, Admin audit, Settings. Admin sessions use their own cookie and every admin action is written to the audit log.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js in development |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## App routes

| Path | Description |
|------|-------------|
| `/` | Landing |
| `/register`, `/login`, `/otp` | Auth |
| `/forgot-password`, `/reset-password` | Password reset via emailed code |
| `/onboarding/1` … `/4`, `/onboarding/complete` | Onboarding |
| `/dashboard` | Dashboard |
| `/profile` | Your profile (view / edit) |
| `/swaps`, `/swaps/[id]` | Swaps |
| `/swaps/propose?partnerId=` | Propose a swap form |
| `/browse`, `/profiles/[id]` | Browse & profiles |
| `/chat` | Inbox |

## API docs (Swagger)

Interactive docs: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

OpenAPI JSON: [http://localhost:3000/api/openapi](http://localhost:3000/api/openapi)

## API

Base URL: `/api`. Protected routes accept `Authorization: Bearer <token>` or the httpOnly `swapspot_token` cookie.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/resend-otp` | Resend email OTP |
| POST | `/api/auth/forgot-password` | Email a password reset code |
| POST | `/api/auth/reset-password` | Check code (no `password`) or set new password |
| POST | `/api/auth/verify-otp` | Verify email OTP |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Clear session cookie |
| GET/PATCH | `/api/users/me` | Current user |
| GET | `/api/users/dashboard` | Dashboard payload |
| GET | `/api/users/matches` | Ranked matches |
| GET | `/api/users/profiles/:id` | Public profile |
| GET | `/api/swaps` | User swaps |
| GET | `/api/swaps/:id` | Swap details |
| POST | `/api/swaps/propose` | Propose a swap (`deadline`, `deposit` optional) |
| POST | `/api/swaps/:id/accept` | Accept proposal |
| POST | `/api/swaps/:id/decline` | Decline proposal |
| POST | `/api/swaps/:id/complete` | Mark complete |
| POST | `/api/swaps/:id/file-dispute` | File a dispute on an active swap |
| POST | `/api/swaps/:id/dispute` | Respond to dispute |
| POST | `/api/swaps/:id/review` | Submit rating |
| GET/POST | `/api/swaps/:id/tasks` | Swap plan (to-dos) / add a personal to-do |
| POST | `/api/swaps/:id/tasks/regenerate` | Rebuild the AI plan |
| PATCH/DELETE | `/api/swaps/:id/tasks/:taskId` | Tick a to-do / delete a personal one |
| GET | `/api/conversations` | Inbox |
| GET | `/api/conversations/:id/messages` | Thread messages |

## Database

SQLite file: `data/swapspot.db` (created and seeded on first API use).
