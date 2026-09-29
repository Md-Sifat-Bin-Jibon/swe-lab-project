import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  formatMatchProfile,
  getUserSkillsByKind,
  type UserRow,
} from "@/lib/format";
import { rankProfiles } from "@/lib/matches";
import {
  countIncomingProposals,
  countParticipantSwaps,
} from "@/lib/swaps";
import { countUnreadMessages } from "@/lib/chat";
import { loadSessionUser } from "@/lib/users";
import { buildActivityFeed } from "@/lib/activity";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const db = getDb();
  const user = loadSessionUser(db, auth.userId);

  const rows = db
    .prepare("SELECT * FROM users WHERE is_browseable = 1 AND id != ?")
    .all(auth.userId) as UserRow[];

  const allProfiles = rows.map((row) =>
    formatMatchProfile(
      row,
      getUserSkillsByKind(db, row.id).offer,
      getUserSkillsByKind(db, row.id).want
    )
  );
  const matches = rankProfiles(allProfiles, user);

  const activeSwaps = countParticipantSwaps(db, auth.userId, "ongoing");
  const incomingProposals = countIncomingProposals(db, auth.userId);
  const allProposals = countParticipantSwaps(db, auth.userId, "proposal");

  const newMessages = countUnreadMessages(db, auth.userId);

  const activities = buildActivityFeed(db, auth.userId, 8);

  const unreadCount = newMessages + incomingProposals;

  return NextResponse.json({
    user,
    stats: {
      activeSwaps,
      proposals: allProposals,
      newMessages: unreadCount,
      balance: user?.balance ?? 0,
    },
    activities,
    matches,
    allMatches: matches,
    searchPlaceholder: matches[0]?.name ?? "Search matches…",
    unreadCount,
  });
}
