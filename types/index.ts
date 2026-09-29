export type SessionUser = {
  id: string;
  fullName: string;
  firstName: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  avatar: string;
  skillsOffer: string[];
  skillsWant: string[];
  balance: number;
  onboardingComplete: boolean;
  /** Passport / government ID has been verified. */
  idVerified?: boolean;
  idVerifiedAt?: string | null;
};

export type MatchProfile = {
  id: string;
  name: string;
  location: string;
  rating: string;
  avatar: string;
  available: boolean;
  offer: string;
  want: string;
  bio: string;
  memberSince: string;
  completedSwaps: number;
  /** Skills this member offers. */
  skills: string[];
  /** Skills this member wants to learn. */
  wants?: string[];
  verified?: boolean;
  idVerified?: boolean;
  /** How well this member fits the viewer (higher = better). */
  matchScore?: number;
};

export type SwapBase = {
  id: string;
  type: "ongoing" | "proposal" | "completed";
  exchange: string | null;
  partnerId: string | null;
  partnerName: string | null;
  statusLabel: string | null;
  description: string | null;
  deposit: number;
  /** Current user is the original proposer (deposit holder) or the recipient. */
  viewerRole: "proposer" | "recipient";
  profile?: MatchProfile | null;
};

export type OngoingSwap = SwapBase & {
  type: "ongoing";
  swapping: string | null;
  partner: string | null;
  timer: string | null;
  action: string | null;
  status: string | null;
  startedAt: string | null;
  deadline: string | null;
  /** To-do progress (added by the API for active swaps). */
  tasks?: { mineDone: number; mineTotal: number; theirsDone: number; theirsTotal: number };
};

export type ProposalSwap = SwapBase & {
  type: "proposal";
  name: string | null;
  offering: string | null;
  receivedAt: string | null;
  deadline: string | null;
  /** True when it's the current user's turn: they can accept, decline or counter. */
  incoming: boolean;
  /** Skill the viewer would teach under the current terms. */
  youGive: string | null;
  /** Skill the viewer would learn under the current terms. */
  youGet: string | null;
  counterCount: number;
  lastActionByYou: boolean;
  /** Escrow currently taken from the proposer; differs from `deposit` while a new amount awaits their acceptance. */
  depositHeld: number;
};

export type SwapOfferEntry = {
  id: number;
  kind: "proposal" | "counter";
  byYou: boolean;
  authorName: string;
  youGive: string | null;
  youGet: string | null;
  deadline: string | null;
  deposit: number | null;
  message: string | null;
  createdAt: string;
};

export type CompletedSwap = SwapBase & {
  type: "completed";
  swapped: string | null;
  partner: string | null;
  rating: string | null;
  completedAt: string | null;
};

export type Swap = OngoingSwap | ProposalSwap | CompletedSwap;

export type MessageReaction = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
};

export type ChatMessage = {
  id?: number;
  senderId?: string;
  direction: "incoming" | "outgoing";
  text: string;
  time_label: string | null;
  quote: string | null;
  message_type: "text" | "image" | "voice" | string;
  mediaUrl?: string | null;
  createdAt?: string;
  reactions?: MessageReaction[];
};

export type Conversation = {
  id: string;
  partnerId: string;
  name: string;
  avatar?: string;
  initials?: string;
  preview: string;
  time: string;
  unread: number;
  online: boolean;
  active: boolean;
  partnerTyping?: boolean;
};

export type Activity = {
  id: number;
  kind: string;
  icon: "proposal" | "counter" | "accepted" | "declined" | "completed" | "dispute" | "review" | "wallet" | "verified" | "meeting";
  /** Shown in bold ("You" or the other member's name). */
  subject: string;
  /** Rest of the sentence, plain text. */
  text: string;
  href: string | null;
  /** ISO timestamp. */
  at: string;
  /** @deprecated kept for older clients; use `at`. */
  time: string | null;
  order: number;
};

export type DashboardPayload = {
  user: SessionUser | null;
  stats: {
    activeSwaps: number;
    proposals: number;
    newMessages: number;
    balance: number;
  };
  activities: Activity[];
  matches: MatchProfile[];
  allMatches: MatchProfile[];
  searchPlaceholder: string;
  unreadCount: number;
};

export type SwapsPayload = {
  ongoingSwaps: OngoingSwap[];
  pendingProposals: ProposalSwap[];
  completedSwaps: CompletedSwap[];
};

export type DataSource = "live" | "sample";

export type ProfileStats = {
  kpis: {
    completedSwaps: number;
    activeSwaps: number;
    pendingProposals: number;
    averageRating: number | null;
    ratingCount: number;
    balance: number;
    messagesSent: number;
    memberSince: string | null;
  };
  completeness: { percent: number; items: { label: string; done: boolean }[] };
  activity: {
    source: DataSource;
    months: { label: string; started: number; completed: number }[];
  };
  messages: { source: DataSource; months: { label: string; count: number }[] };
  status: {
    source: DataSource;
    segments: {
      key: "active" | "pending" | "completed" | "dispute";
      label: string;
      value: number;
    }[];
  };
  demand: { source: DataSource; skills: { skill: string; wanted: number }[] };
  ratings: {
    source: DataSource;
    average: number;
    total: number;
    buckets: { stars: number; count: number }[];
  };
};

export type VerificationStatus = {
  status: "none" | "verified";
  verifiedAt: string | null;
  documents: { side: "front" | "back"; uploadedAt: string; sizeBytes: number }[];
};

export type WalletTransaction = {
  id: string;
  type: "deposit" | "escrow_hold" | "escrow_release" | "escrow_refund";
  swapId: string | null;
  note: string | null;
  amount: number;
  status: "succeeded" | "declined";
  cardBrand: string | null;
  cardLast4: string | null;
  failureReason: string | null;
  balanceAfter: number | null;
  createdAt: string;
};

export type SwapTask = {
  id: number;
  title: string;
  detail: string | null;
  category: "teach" | "learn" | "together";
  dueDate: string | null;
  done: boolean;
  doneAt: string | null;
  source: "ai" | "template" | "manual";
};

export type SwapTasksPayload = {
  /** none = not created yet · generating = AI working · ready = AI plan · template = standard plan · failed */
  status: "none" | "generating" | "ready" | "template" | "failed";
  notice: string | null;
  aiEnabled: boolean;
  partnerName: string;
  mine: SwapTask[];
  theirs: SwapTask[];
};

export type Project = {
  id: string;
  userId: string;
  title: string;
  description: string;
  /** Main skill this project demonstrates. */
  skill: string | null;
  tags: string[];
  /** Image URLs; the first one is the cover. */
  images: string[];
  projectUrl: string | null;
  /** Free text, e.g. "2 weeks". */
  duration: string | null;
  /** YYYY-MM or YYYY-MM-DD */
  completedOn: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Meeting = {
  id: string;
  swapId: string | null;
  title: string;
  agenda: string | null;
  /** ISO start time. */
  startsAt: string;
  durationMinutes: number;
  status: "pending" | "accepted" | "declined" | "cancelled";
  joinUrl: string | null;
  provider: "google_meet" | "fallback";
  /** Why a Google Meet link couldn't be made, when that happened. */
  linkError: string | null;
  organizer: { id: string; name: string };
  invitee: { id: string; name: string };
  partnerName: string;
  viewerRole: "organizer" | "invitee";
  createdAt: string;
  respondedAt: string | null;
};
