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

After registering a new account, use OTP **`123456`**.

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
| GET | `/api/conversations` | Inbox |
| GET | `/api/conversations/:id/messages` | Thread messages |

## Database

SQLite file: `data/swapspot.db` (created and seeded on first API use).
