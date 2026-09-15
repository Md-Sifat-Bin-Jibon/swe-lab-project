import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { UserRow } from "@/lib/format";
import { loadSessionUser, readSkills, updateOfferWantSkills } from "@/lib/users";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const db = getDb();
  const user = loadSessionUser(db, auth.userId);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const db = getDb();
  const current = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(auth.userId) as UserRow | undefined;

  if (!current) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    fullName,
    phone,
    location,
    bio,
    avatar,
    skillsOffer,
    skillsWant,
    onboardingComplete,
  } = body;

  db.prepare(
    `UPDATE users SET
      full_name = COALESCE(?, full_name),
      phone = COALESCE(?, phone),
      location = COALESCE(?, location),
      bio = COALESCE(?, bio),
      avatar = COALESCE(?, avatar),
      onboarding_complete = COALESCE(?, onboarding_complete),
      is_browseable = CASE
        WHEN ? = 1 THEN 1
        ELSE is_browseable
      END,
      available = CASE
        WHEN ? = 1 THEN 1
        ELSE available
      END
     WHERE id = ?`
  ).run(
    fullName ?? null,
    phone ?? null,
    location ?? null,
    bio ?? null,
    avatar ?? null,
    onboardingComplete === undefined ? null : onboardingComplete ? 1 : 0,
    onboardingComplete === true ? 1 : 0,
    onboardingComplete === true ? 1 : 0,
    auth.userId
  );

  if (skillsOffer || skillsWant) {
    const currentSkills = readSkills(db, auth.userId);
    const offer = skillsOffer ?? currentSkills.skillsOffer;
    const want = skillsWant ?? currentSkills.skillsWant;
    updateOfferWantSkills(db, auth.userId, offer, want);
  }

  const user = loadSessionUser(db, auth.userId);
  return NextResponse.json({ user });
}
