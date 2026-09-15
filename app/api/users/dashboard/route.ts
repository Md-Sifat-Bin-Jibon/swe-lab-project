import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  formatMatchProfile,
  getUserSkills,
  type SwapRow,
  type UserRow,
} from "@/lib/format";
import { rankProfiles } from "@/lib/matches";
import {
  countIncomingProposals,
  countParticipantSwaps,
} from "@/lib/swaps";
import { countUnreadMessages } from "@/lib/chat";
import { loadSessionUser } from "@/lib/users";
import type { Activity } from "@/types";

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
    formatMatchProfile(row, getUserSkills(db, row.id))
  );
  const matches = rankProfiles(allProfiles, user);

  const activeSwaps = countParticipantSwaps(db, auth.userId, "ongoing");
  const incomingProposals = countIncomingProposals(db, auth.userId);
  const allProposals = countParticipantSwaps(db, auth.userId, "proposal");

  const newMessages = countUnreadMessages(db, auth.userId);

  const completedSwaps = db
    .prepare(
      `SELECT * FROM swaps
       WHERE type = 'completed' AND (owner_id = ? OR partner_id = ?)
       ORDER BY rowid DESC`
    )
    .all(auth.userId, auth.userId) as SwapRow[];

  const incomingProposalRows = db
    .prepare(
      `SELECT * FROM swaps
       WHERE type = 'proposal' AND partner_id = ?
       ORDER BY rowid DESC`
    )
    .all(auth.userId) as SwapRow[];

  const activities: Activity[] = [
    ...incomingProposalRows.map((proposal, index) => {
      const proposer = db
        .prepare("SELECT full_name FROM users WHERE id = ?")
        .get(proposal.owner_id) as { full_name: string | null } | undefined;
      const name = proposer?.full_name || "Someone";
      return {
        text: `<strong>${name}</strong> sent you a new swap proposal.`,
        time: proposal.received_at,
        order: index,
      };
    }),
    ...completedSwaps.map((swap, index) => ({
      text: `Swap <strong>${swap.exchange ?? "skill exchange"}</strong> was completed.`,
      time: swap.completed_at,
      order: index + incomingProposalRows.length,
    })),
  ].slice(0, 5);

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
