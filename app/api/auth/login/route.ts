import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { setAuthCookie, signToken } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { UserRow } from "@/lib/format";
import { loadSessionUser } from "@/lib/users";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const identifier = String(body.email || body.username || "")
    .trim()
    .toLowerCase();
  const password = String(body.password || "");

  if (!identifier || !password) {
    return NextResponse.json(
      { error: "Username and password are required." },
      { status: 400 }
    );
  }

  const db = getDb();
  const user = db
    .prepare(
      `SELECT * FROM users
       WHERE lower(email) = ? OR lower(full_name) = ?
       LIMIT 1`
    )
    .get(identifier, identifier) as UserRow | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 401 }
    );
  }

  if (user.email.toLowerCase().endsWith("@profile.swapspot")) {
    return NextResponse.json(
      { error: "This account cannot be used to sign in." },
      { status: 403 }
    );
  }

  const token = signToken(user.id);
  const sessionUser = loadSessionUser(db, user.id);
  const response = NextResponse.json({ token, user: sessionUser });
  setAuthCookie(response, token);
  return response;
}
