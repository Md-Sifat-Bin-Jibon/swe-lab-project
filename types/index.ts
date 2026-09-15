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
  skills: string[];
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
};

export type ProposalSwap = SwapBase & {
  type: "proposal";
  name: string | null;
  offering: string | null;
  receivedAt: string | null;
  deadline: string | null;
  /** True when the current user can accept/decline this proposal. */
  incoming: boolean;
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
  text: string;
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
