import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  formatMatchProfile,
  getUserSkillsByKind,
  type UserRow,
} from "@/lib/format";
import { sortByMatch } from "@/lib/matches";
import { loadSessionUser } from "@/lib/users";

export const runtime = "nodejs";

/** All browseable members, scored against the viewer's skills (best first). */
export async function GET(request: Request) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const db = getDb();
  const user = loadSessionUser(db, auth.userId);
  const rows = db
    .prepare(
      "SELECT * FROM users WHERE is_browseable = 1 AND id != ? ORDER BY full_name"
    )
    .all(auth.userId) as UserRow[];

  const profiles = rows.map((row) => {
    const { offer, want } = getUserSkillsByKind(db, row.id);
    return formatMatchProfile(row, offer, want);
  });

  return NextResponse.json({ matches: sortByMatch(profiles, user) });
}
