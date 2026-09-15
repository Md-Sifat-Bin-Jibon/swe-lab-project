import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  formatMatchProfile,
  getUserSkills,
  type UserRow,
} from "@/lib/format";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM users WHERE id = ? AND is_browseable = 1")
    .get(id) as UserRow | undefined;

  if (!row) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  return NextResponse.json({
    profile: formatMatchProfile(row, getUserSkills(db, row.id)),
  });
}
