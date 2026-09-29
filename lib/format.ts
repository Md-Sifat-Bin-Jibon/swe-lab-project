import type { DatabaseSync } from "node:sqlite";
import type {
  Conversation,
  CompletedSwap,
  MatchProfile,
  OngoingSwap,
  ProposalSwap,
  SessionUser,
  Swap,
} from "@/types";

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  phone: string | null;
  location: string | null;
  bio: string | null;
  avatar: string | null;
  balance: number;
  available: number;
  rating: string | null;
  member_since: string | null;
  completed_swaps: number;
  offer_skill: string | null;
  want_skill: string | null;
  is_browseable: number;
  email_verified: number;
  onboarding_complete: number;
  status?: string | null;
  suspended_reason?: string | null;
  id_verification_status?: string | null;
  id_verified_at?: string | null;
  created_at?: string | null;
};

export type SwapRow = {
  id: string;
  owner_id: string;
  partner_id: string | null;
  type: "ongoing" | "proposal" | "completed";
  swapping: string | null;
  exchange: string | null;
  offering: string | null;
  swapped: string | null;
  partner_name: string | null;
  timer: string | null;
  action: string | null;
  status: string | null;
  status_label: string | null;
  started_at: string | null;
  deadline: string | null;
  received_at: string | null;
  completed_at: string | null;
  rating: string | null;
  description: string | null;
  deposit: number | null;
  awaiting_user_id?: string | null;
  counter_count?: number | null;
  last_action_by?: string | null;
  deposit_held?: number | null;
};

export type ConversationRow = {
  id: string;
  owner_id: string;
  participant_name: string;
  participant_avatar: string | null;
  participant_initials: string | null;
  preview: string | null;
  time_label: string | null;
  unread: number;
  online: number;
  is_active: number;
};

export function firstNameFrom(fullName: string | null | undefined): string {
  const trimmed = (fullName || "").trim();
  if (!trimmed) return "Member";
  return trimmed.split(/\s+/)[0];
}

/** Skills a user offers (what other members can learn from them). */
export function getUserSkills(db: DatabaseSync, userId: string): string[] {
  return getUserSkillsByKind(db, userId).offer;
}

/** Offered and wanted skills, each in the order the user added them. */
export function getUserSkillsByKind(
  db: DatabaseSync,
  userId: string
): { offer: string[]; want: string[] } {
  const rows = db
    .prepare(
      "SELECT skill, kind FROM user_skills WHERE user_id = ? ORDER BY id"
    )
    .all(userId) as { skill: string; kind: string }[];

  return {
    offer: rows.filter((r) => r.kind !== "want").map((r) => r.skill),
    want: rows.filter((r) => r.kind === "want").map((r) => r.skill),
  };
}

/** Session user shape used by the dashboard header and stats. */
export function formatSessionUser(
  row: UserRow,
  skillsOffer: string[] = [],
  skillsWant: string[] = []
): SessionUser {
  const fullName = row.full_name || "SwapSpot Member";
  const firstName = firstNameFrom(fullName);

  return {
    id: row.id,
    fullName,
    firstName,
    email: row.email,
    phone: row.phone || "",
    location: row.location || "",
    bio: row.bio || "",
    avatar:
      row.avatar ||
      `https://i.pravatar.cc/80?u=${encodeURIComponent(firstName.toLowerCase())}`,
    skillsOffer,
    skillsWant,
    balance: Number(row.balance ?? 0),
    onboardingComplete: Boolean(row.onboarding_complete),
    idVerified: row.id_verification_status === "verified",
    idVerifiedAt: row.id_verified_at ?? null,
  };
}

/** Browse / match profile card shape. */
export function formatMatchProfile(
  row: UserRow,
  skills: string[] = [],
  wants: string[] = []
): MatchProfile {
  return {
    id: row.id,
    name: row.full_name?.trim() || "SwapSpot Member",
    location: row.location || "",
    rating: row.rating || "4.5 (0)",
    avatar:
      row.avatar ||
      `https://i.pravatar.cc/96?u=${encodeURIComponent(row.id)}`,
    available: Boolean(row.available),
    offer: row.offer_skill || skills[0] || "",
    want: row.want_skill || "",
    bio: row.bio || "",
    memberSince: row.member_since || "",
    completedSwaps: row.completed_swaps ?? 0,
    skills,
    wants: wants.length ? wants : row.want_skill ? [row.want_skill] : [],
    verified: Boolean(row.email_verified),
    idVerified: row.id_verification_status === "verified",
  };
}

export function formatSwapRow(row: SwapRow, viewerId: string): Swap {
  const isProposer = row.owner_id === viewerId;
  const viewerRole = isProposer ? "proposer" : "recipient";

  if (row.type === "ongoing") {
    const myOffer = isProposer ? row.swapping : row.exchange;
    const theirOffer = isProposer ? row.exchange : row.swapping;
    return {
      id: row.id,
      type: "ongoing",
      exchange: theirOffer,
      partnerId: isProposer ? row.partner_id : row.owner_id,
      partnerName: row.partner_name, // may be remapped by caller
      statusLabel: row.status_label,
      description: row.description,
      deposit: Number(row.deposit ?? 0),
      viewerRole,
      swapping: myOffer,
      partner: row.partner_name,
      timer: row.timer,
      action: row.action,
      status: row.status,
      startedAt: row.started_at,
      deadline: row.deadline,
    } satisfies OngoingSwap;
  }

  if (row.type === "proposal") {
    // Whoever made the latest offer waits; the other person responds.
    const awaitingId = row.awaiting_user_id ?? row.partner_id;
    const incoming = awaitingId === viewerId;
    const counterCount = Number(row.counter_count ?? 0);
    const proposerOffer = row.exchange;
    const wantFromRecipient = row.offering;
    return {
      id: row.id,
      type: "proposal",
      exchange: wantFromRecipient,
      partnerId: isProposer ? row.partner_id : row.owner_id,
      partnerName: row.partner_name,
      statusLabel: incoming
        ? counterCount
          ? "Counter-offer · your turn"
          : "Awaiting your response"
        : counterCount
          ? "Counter sent · awaiting their response"
          : "Awaiting their response",
      description: row.description,
      deposit: Number(row.deposit ?? 0),
      viewerRole,
      name: row.partner_name,
      offering: proposerOffer,
      receivedAt: row.received_at,
      deadline: row.deadline,
      incoming,
      youGive: isProposer ? row.exchange : row.offering,
      youGet: isProposer ? row.offering : row.exchange,
      counterCount,
      lastActionByYou: (row.last_action_by ?? row.owner_id) === viewerId,
      depositHeld: Number(row.deposit_held ?? row.deposit ?? 0),
    } satisfies ProposalSwap;
  }

  return {
    id: row.id,
    type: "completed",
    exchange: isProposer ? row.exchange : row.swapped,
    partnerId: isProposer ? row.partner_id : row.owner_id,
    partnerName: row.partner_name,
    statusLabel: row.status_label,
    description: row.description,
    deposit: Number(row.deposit ?? 0),
    viewerRole,
    swapped: isProposer ? row.swapped : row.exchange,
    partner: row.partner_name,
    rating: row.rating,
    completedAt: row.completed_at,
  } satisfies CompletedSwap;
}

/** Formats an ISO date (YYYY-MM-DD) or Date into "24 May 2025". */
export function formatDisplayDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Hours remaining until deadline as HH:MM:SS timer string (capped). */
export function timerUntilDeadline(deadlineIso: string | null | undefined): string {
  if (!deadlineIso) return "336:00:00";
  const end = new Date(deadlineIso).getTime();
  if (Number.isNaN(end)) return "336:00:00";
  const ms = Math.max(0, end - Date.now());
  const totalHours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return `${String(totalHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatConversationRow(row: ConversationRow): Conversation {
  return {
    id: row.id,
    partnerId: "",
    name: row.participant_name,
    avatar: row.participant_avatar || undefined,
    initials: row.participant_initials || undefined,
    preview: row.preview || "",
    time: row.time_label || "",
    unread: row.unread ?? 0,
    online: Boolean(row.online),
    active: Boolean(row.is_active),
  };
}
