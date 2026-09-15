import type {
  DashboardPayload,
  MatchProfile,
  SessionUser,
  Swap,
  SwapsPayload,
  Conversation,
  ChatMessage,
} from "@/types";

const API_BASE = "/api";
const TOKEN_KEY = "swapspotToken";
const USER_KEY = "swapspotUser";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem("swapspotEmail");
}

export function cacheUser(user: SessionUser | null | undefined): void {
  if (typeof window === "undefined" || !user) return;
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getCachedUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errorPayload = payload as { error?: string } | null;
    throw new ApiError(
      errorPayload?.error || "Request failed.",
      response.status
    );
  }

  return payload as T;
}

export function saveSession({
  token,
  user,
}: {
  token?: string;
  user?: SessionUser | null;
}): void {
  if (token) setToken(token);
  if (user) cacheUser(user);
}

export async function register(input: {
  email: string;
  password: string;
  username?: string;
}): Promise<{ message: string; email: string; demoOtp: string }> {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function verifyOtp(input: {
  email: string;
  code: string;
}): Promise<{ token: string; user: SessionUser }> {
  const result = await request<{ token: string; user: SessionUser }>(
    "/auth/verify-otp",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
  saveSession(result);
  return result;
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<{ token: string; user: SessionUser }> {
  const result = await request<{ token: string; user: SessionUser }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
  saveSession(result);
  return result;
}

export async function logout(): Promise<{ ok: boolean }> {
  const result = await request<{ ok: boolean }>("/auth/logout", {
    method: "POST",
  });
  clearSession();
  return result;
}

export async function fetchCurrentUser(): Promise<SessionUser> {
  const result = await request<{ user: SessionUser }>("/users/me");
  cacheUser(result.user);
  return result.user;
}

export async function updateProfile(
  partial: Partial<{
    fullName: string;
    phone: string;
    location: string;
    bio: string;
    avatar: string;
    skillsOffer: string[];
    skillsWant: string[];
    onboardingComplete: boolean;
  }>
): Promise<SessionUser> {
  const body: Record<string, unknown> = {};

  if (partial.fullName !== undefined) body.fullName = partial.fullName;
  if (partial.phone !== undefined) body.phone = partial.phone;
  if (partial.location !== undefined) body.location = partial.location;
  if (partial.bio !== undefined) body.bio = partial.bio;
  if (partial.avatar !== undefined) body.avatar = partial.avatar;
  if (partial.skillsOffer !== undefined) body.skillsOffer = partial.skillsOffer;
  if (partial.skillsWant !== undefined) body.skillsWant = partial.skillsWant;
  if (partial.onboardingComplete !== undefined) {
    body.onboardingComplete = partial.onboardingComplete;
  }

  const result = await request<{ user: SessionUser }>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  cacheUser(result.user);
  return result.user;
}

export async function fetchDashboard(): Promise<DashboardPayload> {
  return request("/users/dashboard");
}

export async function fetchMatches(): Promise<{ matches: MatchProfile[] }> {
  return request("/users/matches");
}

export async function fetchProfile(
  id: string
): Promise<{ profile: MatchProfile }> {
  return request(`/users/profiles/${encodeURIComponent(id)}`);
}

export async function fetchSwaps(): Promise<SwapsPayload> {
  return request("/swaps");
}

export async function fetchSwap(id: string): Promise<{ swap: Swap }> {
  return request(`/swaps/${encodeURIComponent(id)}`);
}

export async function acceptSwapProposal(
  id: string
): Promise<{ swap: Swap }> {
  return request(`/swaps/${encodeURIComponent(id)}/accept`, {
    method: "POST",
  });
}

/** Alias matching legacy swap-actions naming. */
export const acceptProposal = acceptSwapProposal;

export async function declineSwapProposal(
  id: string
): Promise<{ ok: boolean }> {
  return request(`/swaps/${encodeURIComponent(id)}/decline`, {
    method: "POST",
  });
}

/** Alias matching legacy swap-actions naming. */
export const declineProposal = declineSwapProposal;

export async function completeSwap(id: string): Promise<SwapsPayload> {
  return request(`/swaps/${encodeURIComponent(id)}/complete`, {
    method: "POST",
  });
}

/** Alias matching legacy swap-actions naming. */
export const markSwapCompleted = completeSwap;

export async function respondToSwapDispute(
  id: string,
  response: string
): Promise<{ swap: Swap }> {
  return request(`/swaps/${encodeURIComponent(id)}/dispute`, {
    method: "POST",
    body: JSON.stringify({ response }),
  });
}

/** Alias matching legacy swap-actions naming. */
export const respondToDispute = respondToSwapDispute;

export async function reviewSwap(
  id: string,
  rating: string | number
): Promise<{ swap: Swap }> {
  return request(`/swaps/${encodeURIComponent(id)}/review`, {
    method: "POST",
    body: JSON.stringify({ rating }),
  });
}

/** Alias matching legacy swap-actions naming. */
export const submitReview = reviewSwap;

export async function proposeSwap(input: {
  partnerId: string;
  partnerName: string;
  offering: string;
  exchange: string;
  description?: string;
  deadline?: string;
  deposit?: number;
}): Promise<{ ok: true; proposal: Swap }> {
  return request("/swaps/propose", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fileSwapDispute(
  id: string,
  reason: string
): Promise<{ swap: Swap }> {
  return request(`/swaps/${encodeURIComponent(id)}/file-dispute`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function fetchConversations(): Promise<{
  conversations: Conversation[];
}> {
  return request("/conversations");
}

export async function openConversation(
  partnerId: string
): Promise<{ conversation: Conversation; conversations: Conversation[] }> {
  return request("/conversations", {
    method: "POST",
    body: JSON.stringify({ partnerId }),
  });
}

export async function fetchConversationMessages(
  id: string,
  after?: number
): Promise<{
  conversation: Conversation | null;
  messages: ChatMessage[];
}> {
  const query = after && after > 0 ? `?after=${after}` : "";
  return request(`/conversations/${encodeURIComponent(id)}/messages${query}`);
}

export async function sendConversationMessage(
  id: string,
  text: string
): Promise<{ message: ChatMessage }> {
  return request(`/conversations/${encodeURIComponent(id)}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function setConversationTyping(
  id: string,
  isTyping: boolean
): Promise<{ ok: boolean }> {
  return request(`/conversations/${encodeURIComponent(id)}/typing`, {
    method: "POST",
    body: JSON.stringify({ isTyping }),
  });
}

export async function sendConversationMedia(
  id: string,
  file: File,
  caption = ""
): Promise<{ message: ChatMessage }> {
  const form = new FormData();
  form.append("file", file);
  if (caption) form.append("caption", caption);

  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(
    `${API_BASE}/conversations/${encodeURIComponent(id)}/media`,
    {
      method: "POST",
      headers,
      body: form,
      credentials: "include",
    }
  );

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof (payload as { error: unknown }).error === "string"
        ? (payload as { error: string }).error
        : "Upload failed.";
    throw new ApiError(message, response.status);
  }

  return payload as { message: ChatMessage };
}

export async function reactToMessage(
  conversationId: string,
  messageId: number,
  emoji: string
): Promise<{ message: ChatMessage }> {
  return request(
    `/conversations/${encodeURIComponent(conversationId)}/messages/${messageId}/reactions`,
    {
      method: "POST",
      body: JSON.stringify({ emoji }),
    }
  );
}
