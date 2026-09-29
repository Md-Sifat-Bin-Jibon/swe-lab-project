import { ApiError } from "@/services/api";

const BASE = "/api/admin";

async function call<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: options.body ? { "Content-Type": "application/json", ...options.headers } : options.headers,
  });
  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    throw new ApiError((payload as { error?: string })?.error || "Request failed.", response.status);
  }
  return payload as T;
}

export const adminApi = {
  login: (email: string, password: string) =>
    call<{ admin: AdminAccount }>("/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => call<{ ok: true }>("/logout", { method: "POST" }),
  me: () => call<{ admin: AdminAccount }>("/me"),
  overview: () => call<{ overview: Overview }>("/overview"),
  users: (q: Record<string, string | number>) => call<Paged<AdminUserRow>>(`/users?${qs(q)}`),
  user: (id: string) => call<UserDetail>(`/users/${encodeURIComponent(id)}`),
  userAction: (id: string, body: Record<string, unknown>) =>
    call<UserDetail>(`/users/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(body) }),
  swaps: (q: Record<string, string | number>) => call<Paged<AdminSwapRow>>(`/swaps?${qs(q)}`),
  swap: (id: string) => call<SwapDetail>(`/swaps/${encodeURIComponent(id)}`),
  swapAction: (id: string, body: Record<string, unknown>) =>
    call<{ refunded?: number; swap?: SwapDetail }>(`/swaps/${encodeURIComponent(id)}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  verifications: (status: string) => call<{ verifications: VerificationRow[] }>(`/verifications?status=${status}`),
  verificationAction: (userId: string, action: "approve" | "reject", reason = "") =>
    call<unknown>(`/verifications/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      body: JSON.stringify({ action, reason }),
    }),
  transactions: (q: Record<string, string | number>) => call<Paged<TransactionRow> & { totals: Totals }>(`/transactions?${qs(q)}`),
  projects: (q: Record<string, string | number>) => call<Paged<AdminProjectRow>>(`/projects?${qs(q)}`),
  deleteProject: (id: string, reason = "") =>
    call<{ ok: true }>(`/projects/${encodeURIComponent(id)}?reason=${encodeURIComponent(reason)}`, { method: "DELETE" }),
  conversations: (search = "") => call<{ conversations: ConversationRow[] }>(`/conversations?search=${encodeURIComponent(search)}`),
  messages: (id: string) => call<{ messages: AdminMessage[] }>(`/conversations/${encodeURIComponent(id)}`),
  activity: (q: Record<string, string | number>) => call<Paged<ActivityRow>>(`/activity?${qs(q)}`),
  moderation: (q: Record<string, string | number>) => call<Paged<FlagRow>>(`/moderation?${qs(q)}`),
  meetings: (q: Record<string, string | number>) => call<Paged<AdminMeetingRow>>(`/meetings?${qs(q)}`),
  audit: (q: Record<string, string | number>) => call<Paged<AuditRow>>(`/audit?${qs(q)}`),
  settings: () => call<{ system: SystemInfo }>("/settings"),
};

function qs(q: Record<string, string | number>): string {
  return new URLSearchParams(Object.entries(q).map(([k, v]) => [k, String(v)])).toString();
}

// ----------------------------------------------------------------- types ---

export type AdminAccount = { id: string; email: string; name: string; role: string };
export type Paged<T> = { rows: T[]; total: number; page: number; pageSize: number };

export type Overview = {
  users: { total: number; verified: number; suspended: number; onboarded: number; browseable: number; newLast7Days: number };
  swaps: { ongoing: number; proposals: number; completed: number; disputes: number };
  money: { escrowHeld: number; memberBalances: number; depositsTotal: number; depositsCount: number };
  content: { projects: number; messages: number; conversations: number; tasks: number };
  pendingVerifications: number;
  moderation: { flaggedLast7Days: number; flaggedTotal: number };
  meetings: { upcoming: number; total: number };
  months: { label: string; signups: number; proposals: number; completed: number }[];
  topOffered: { skill: string; count: number }[];
  topWanted: { skill: string; count: number }[];
};

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  location: string;
  status: string;
  suspendedReason: string | null;
  idVerified: boolean;
  emailVerified: boolean;
  onboarded: boolean;
  browseable: boolean;
  balance: number;
  completedSwaps: number;
  rating: string;
  createdAt: string | null;
  activeSwaps: number;
  projects: number;
};

export type UserDetail = {
  user: AdminUserRow & {
    phone: string;
    bio: string;
    avatar: string;
    idVerifiedAt: string | null;
    memberSince: string;
  };
  skills: { offer: string[]; want: string[] };
  swaps: { id: string; type: string; status: string; role: string; gives: string; gets: string; deposit: number; deadline: string | null }[];
  transactions: { id: string; type: string; amount: number; status: string; note: string | null; balanceAfter: number | null; createdAt: string }[];
  documents: { side: "front" | "back"; uploadedAt: string; sizeBytes: number; mimeType: string }[];
  projects: { id: string; title: string; images: string[]; skill: string | null }[];
  activity: { kind: string; createdAt: string; swapId: string | null }[];
};

export type AdminSwapRow = {
  id: string;
  type: string;
  status: string;
  inDispute: boolean;
  owner: { id: string; name: string };
  partner: { id: string; name: string } | null;
  ownerOffer: string;
  partnerOffer: string;
  deposit: number;
  depositHeld: number;
  counters: number;
  deadline: string | null;
  startedAt: string | null;
  completedAt: string | null;
  rating: string | null;
  tasks: { done: number; total: number };
};

export type SwapDetail = {
  swap: AdminSwapRow & { description: string; awaiting: string | null };
  offers: { kind: string; author: string; ownerOffer: string; partnerOffer: string; deposit: number | null; deadline: string | null; message: string | null; createdAt: string }[];
  tasks: { assignee: string; title: string; category: string; dueDate: string | null; done: boolean; source: string }[];
};

export type VerificationRow = {
  userId: string;
  name: string;
  email: string;
  verified: boolean;
  verifiedAt: string | null;
  submittedAt: string;
  documents: number;
};

export type TransactionRow = {
  id: string;
  user: { id: string; name: string; email: string };
  type: string;
  amount: number;
  status: string;
  card: string | null;
  note: string | null;
  swapId: string | null;
  failureReason: string | null;
  balanceAfter: number | null;
  createdAt: string;
};
export type Totals = { deposits: number; holds: number; releases: number };

export type AdminProjectRow = {
  id: string;
  userId: string;
  owner: string;
  title: string;
  description: string;
  skill: string | null;
  tags: string[];
  images: string[];
  projectUrl: string | null;
  createdAt: string;
};

export type ConversationRow = { id: string; participants: string[]; messageCount: number; lastMessage: string; updatedAt: string | null };
export type AdminMessage = { id: number; sender: string; text: string; type: string; mediaUrl: string | null; createdAt: string };
export type ActivityRow = { id: number; kind: string; actor: string; target: string | null; swapId: string | null; data: Record<string, unknown> | null; createdAt: string };
export type AuditRow = { id: number; admin: string; action: string; targetType: string | null; targetId: string | null; detail: string | null; createdAt: string };

export type FlagRow = {
  id: number;
  user: { id: string; name: string; email: string };
  kind: string;
  excerpt: string;
  source: string;
  context: string;
  conversationId: string | null;
  messageId: number | null;
  originalText: string | null;
  createdAt: string;
};

export type AdminMeetingRow = {
  id: string;
  title: string;
  organizer: { id: string; name: string };
  invitee: { id: string; name: string };
  startsAt: string;
  durationMinutes: number;
  status: string;
  provider: string;
  joinUrl: string | null;
  swapId: string | null;
  linkError: string | null;
  createdAt: string;
};

export type SystemInfo = {
  integrations: { smtp: boolean; openai: boolean; googleMeet: boolean; openaiModel: string; appUrl: string };
  counts: Record<string, number>;
  admins: { id: string; email: string; name: string; role: string; createdAt: string; lastLoginAt: string | null }[];
  node: string;
  environment: string;
};
