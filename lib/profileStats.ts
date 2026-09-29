import type { DatabaseSync } from "node:sqlite";
import { getUserSkillsByKind, type UserRow } from "@/lib/format";
import type { ProfileStats } from "@/types";

type SwapLite = {
  type: "ongoing" | "proposal" | "completed";
  status: string | null;
  started_at: string | null;
  completed_at: string | null;
  received_at: string | null;
  rating: string | null;
};

const MONTHS = 6;

function lastMonths(count: number): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("en-US", { month: "short" }),
    });
  }
  return out;
}

/** Parses ISO or display dates ("22 Sep 2026"); ignores labels like "Just now". */
function monthKey(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/just now/i.test(value)) {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}`;
  }
  const d = new Date(value.includes(" ") && /^\d{4}-/.test(value) ? value.replace(" ", "T") + "Z" : value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function normalize(skill: string): string {
  return skill.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function skillsMatch(a: string, b: string): boolean {
  const x = normalize(a);
  const y = normalize(b);
  return Boolean(x && y) && (x === y || x.includes(y) || y.includes(x));
}

function parseRating(value: string | null): number | null {
  if (!value) return null;
  const n = parseFloat(value);
  return Number.isFinite(n) && n > 0 && n <= 5 ? n : null;
}

// Generic data shown until a user has real activity of their own.
const SAMPLE = {
  activity: [
    [1, 0],
    [2, 1],
    [1, 1],
    [3, 2],
    [2, 2],
    [4, 3],
  ],
  messages: [6, 11, 9, 17, 14, 22],
  status: { active: 2, pending: 3, completed: 5, dispute: 1 },
  demand: [
    { skill: "Web Development", wanted: 9 },
    { skill: "UI Design", wanted: 7 },
    { skill: "Photography", wanted: 4 },
  ],
  ratings: [0, 0, 1, 4, 9],
};

export function buildProfileStats(db: DatabaseSync, userId: string): ProfileStats | null {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as
    | UserRow
    | undefined;
  if (!user) return null;

  const { offer, want } = getUserSkillsByKind(db, userId);
  const months = lastMonths(MONTHS);
  const monthIndex = new Map(months.map((m, i) => [m.key, i]));

  const swaps = db
    .prepare(
      `SELECT type, status, started_at, completed_at, received_at, rating
       FROM swaps WHERE owner_id = ? OR partner_id = ?`
    )
    .all(userId, userId) as SwapLite[];

  // --- Swap status breakdown -------------------------------------------
  const statusCounts = { active: 0, pending: 0, completed: 0, dispute: 0 };
  for (const s of swaps) {
    if (s.type === "completed") statusCounts.completed++;
    else if (s.type === "proposal") statusCounts.pending++;
    else if (s.status === "dispute") statusCounts.dispute++;
    else statusCounts.active++;
  }
  const statusTotal = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const statusLive = statusTotal > 0;
  const status = statusLive ? statusCounts : SAMPLE.status;

  // --- Swap activity per month ------------------------------------------
  const started = Array(MONTHS).fill(0) as number[];
  const completed = Array(MONTHS).fill(0) as number[];
  for (const s of swaps) {
    const startKey = monthKey(s.started_at ?? (s.type === "proposal" ? s.received_at : null));
    const si = startKey ? monthIndex.get(startKey) : undefined;
    if (si !== undefined) started[si]++;
    if (s.type === "completed") {
      const ck = monthKey(s.completed_at);
      const ci = ck ? monthIndex.get(ck) : undefined;
      if (ci !== undefined) completed[ci]++;
    }
  }
  const activityLive = started.some(Boolean) || completed.some(Boolean);

  // --- Messages sent per month ------------------------------------------
  const messageRows = db
    .prepare("SELECT created_at FROM messages WHERE sender_id = ?")
    .all(userId) as { created_at: string }[];
  const messages = Array(MONTHS).fill(0) as number[];
  for (const m of messageRows) {
    const k = monthKey(m.created_at);
    const i = k ? monthIndex.get(k) : undefined;
    if (i !== undefined) messages[i]++;
  }
  const messagesLive = messages.some(Boolean);

  // --- Demand for the user's offered skills -----------------------------
  const otherWants = db
    .prepare(
      `SELECT u.id AS user_id, s.skill AS skill FROM user_skills s
         JOIN users u ON u.id = s.user_id
       WHERE s.kind = 'want' AND u.id != ? AND u.is_browseable = 1
       UNION
       SELECT id AS user_id, want_skill AS skill FROM users
       WHERE id != ? AND is_browseable = 1 AND want_skill IS NOT NULL AND want_skill != ''`
    )
    .all(userId, userId) as { user_id: string; skill: string }[];

  const demandLive = offer.length > 0;
  const demand = demandLive
    ? offer
        .map((skill) => ({
          skill,
          wanted: new Set(
            otherWants.filter((w) => skillsMatch(w.skill, skill)).map((w) => w.user_id)
          ).size,
        }))
        .sort((a, b) => b.wanted - a.wanted)
        .slice(0, 6)
    : SAMPLE.demand;

  // --- Ratings received --------------------------------------------------
  const ratingValues = swaps
    .filter((s) => s.type === "completed")
    .map((s) => parseRating(s.rating))
    .filter((n): n is number => n !== null);
  const ratingsLive = ratingValues.length > 0;
  const buckets = [0, 0, 0, 0, 0];
  if (ratingsLive) {
    for (const r of ratingValues) buckets[Math.min(5, Math.max(1, Math.round(r))) - 1]++;
  } else {
    SAMPLE.ratings.forEach((c, i) => (buckets[i] = c));
  }
  const bucketTotal = buckets.reduce((a, b) => a + b, 0);
  const ratingAverage = ratingsLive
    ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length
    : bucketTotal
      ? buckets.reduce((sum, c, i) => sum + c * (i + 1), 0) / bucketTotal
      : 0;

  // --- Profile completeness ---------------------------------------------
  const items = [
    { label: "Full name", done: Boolean(user.full_name?.trim()) },
    { label: "Profile photo", done: Boolean(user.avatar?.trim()) },
    { label: "Bio", done: Boolean(user.bio && user.bio.trim().length >= 20) },
    { label: "Location", done: Boolean(user.location?.trim()) },
    { label: "Phone", done: Boolean(user.phone?.trim()) },
    { label: "Skills you offer", done: offer.length > 0 },
    { label: "Skills you want", done: want.length > 0 },
    { label: "Email verified", done: Boolean(user.email_verified) },
  ];
  const percent = Math.round((items.filter((i) => i.done).length / items.length) * 100);

  const activeSwaps = statusCounts.active + statusCounts.dispute;

  return {
    kpis: {
      completedSwaps: Math.max(user.completed_swaps ?? 0, statusCounts.completed),
      activeSwaps,
      pendingProposals: statusCounts.pending,
      averageRating: ratingValues.length
        ? Math.round((ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length) * 10) / 10
        : null,
      ratingCount: ratingValues.length,
      balance: Number(user.balance ?? 0),
      messagesSent: messageRows.length,
      memberSince: user.member_since || user.created_at || null,
    },
    completeness: { percent, items },
    activity: {
      source: activityLive ? "live" : "sample",
      months: months.map((m, i) => ({
        label: m.label,
        started: activityLive ? started[i] : SAMPLE.activity[i][0],
        completed: activityLive ? completed[i] : SAMPLE.activity[i][1],
      })),
    },
    messages: {
      source: messagesLive ? "live" : "sample",
      months: months.map((m, i) => ({
        label: m.label,
        count: messagesLive ? messages[i] : SAMPLE.messages[i],
      })),
    },
    status: {
      source: statusLive ? "live" : "sample",
      segments: [
        { key: "active", label: "Active", value: status.active },
        { key: "pending", label: "Pending", value: status.pending },
        { key: "completed", label: "Completed", value: status.completed },
        { key: "dispute", label: "In dispute", value: status.dispute },
      ],
    },
    demand: { source: demandLive ? "live" : "sample", skills: demand },
    ratings: {
      source: ratingsLive ? "live" : "sample",
      average: Math.round(ratingAverage * 10) / 10,
      total: bucketTotal,
      buckets: buckets.map((count, i) => ({ stars: i + 1, count })).reverse(),
    },
  };
}
