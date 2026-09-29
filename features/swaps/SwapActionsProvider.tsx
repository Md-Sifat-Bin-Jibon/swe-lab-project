"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import {
  acceptProposal,
  ApiError,
  counterSwapProposal,
  declineProposal,
  fetchCurrentUser,
  getCachedUser,
  fileSwapDispute,
  markSwapCompleted,
  respondToDispute,
  submitReview,
} from "@/services/api";
import type { MatchProfile, ProposalSwap, Swap } from "@/types";
import { CounterOfferModal, type CounterTarget } from "./CounterOfferModal";

type ProposeProfile = Pick<MatchProfile, "id" | "name" | "offer" | "want">;

interface SwapActionsContextValue {
  goToChat: (partnerId?: string | null) => void;
  accept: (swapId: string) => Promise<Swap | null>;
  decline: (swapId: string, kind?: "decline" | "withdraw") => Promise<boolean>;
  openCounter: (swap: ProposalSwap & { profile?: MatchProfile | null }) => void;
  complete: (swapId: string) => Promise<boolean>;
  propose: (profile: ProposeProfile) => Promise<boolean>;
  openDispute: (swapId: string) => void;
  openFileDispute: (swapId: string) => void;
  openReview: (swapId: string) => void;
  setOnMutate: (fn: (() => void | Promise<void>) | null) => void;
}

const SwapActionsContext = createContext<SwapActionsContextValue | null>(null);

export function useSwapActions(): SwapActionsContextValue {
  const context = useContext(SwapActionsContext);
  if (!context) {
    throw new Error("useSwapActions must be used within SwapActionsProvider");
  }
  return context;
}

function delay(minMs = 400, maxMs = 900): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function SwapActionsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { showToast } = useToast();
  const onMutateRef = useRef<(() => void | Promise<void>) | null>(null);

  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeMode, setDisputeMode] = useState<"file" | "respond">("respond");
  const [disputeSwapId, setDisputeSwapId] = useState<string | null>(null);
  const [disputeText, setDisputeText] = useState("");
  const [disputeBusy, setDisputeBusy] = useState(false);

  const [counterTarget, setCounterTarget] = useState<CounterTarget | null>(null);
  const [counterBusy, setCounterBusy] = useState(false);
  const [counterError, setCounterError] = useState<string | null>(null);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewSwapId, setReviewSwapId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewBusy, setReviewBusy] = useState(false);

  const runMutate = useCallback(async () => {
    if (onMutateRef.current) await onMutateRef.current();
  }, []);

  const setOnMutate = useCallback(
    (fn: (() => void | Promise<void>) | null) => {
      onMutateRef.current = fn;
    },
    []
  );

  const goToChat = useCallback(
    (partnerId?: string | null) => {
      if (partnerId) {
        router.push(`/chat?with=${encodeURIComponent(partnerId)}`);
        return;
      }
      router.push("/chat");
    },
    [router]
  );

  const accept = useCallback(
    async (swapId: string) => {
      try {
        await delay();
        const { swap } = await acceptProposal(swapId);
        await runMutate();
        showToast(
          `Proposal accepted — swap with ${swap.partnerName} is now active.`
        );
        return swap;
      } catch (error) {
        showToast(
          error instanceof ApiError && error.status !== 404
            ? error.message
            : "Could not accept — the terms may have changed. Refresh and try again."
        );
        await runMutate();
        return null;
      }
    },
    [runMutate, showToast]
  );

  const decline = useCallback(
    async (swapId: string, kind: "decline" | "withdraw" = "decline") => {
      try {
        await delay();
        await declineProposal(swapId);
        await runMutate();
        showToast(kind === "withdraw" ? "Proposal withdrawn." : "Proposal declined.");
        return true;
      } catch {
        showToast("Could not decline this proposal.");
        return false;
      }
    },
    [runMutate, showToast]
  );

  const complete = useCallback(
    async (swapId: string) => {
      try {
        await delay();
        await markSwapCompleted(swapId);
        await runMutate();
        showToast("Swap marked as completed!");
        return true;
      } catch {
        showToast("Could not mark swap as completed.");
        return false;
      }
    },
    [runMutate, showToast]
  );

  const propose = useCallback(
    async (profile: ProposeProfile) => {
      router.push(
        `/swaps/propose?partnerId=${encodeURIComponent(profile.id)}`
      );
      return true;
    },
    [router]
  );

  const openDispute = useCallback((swapId: string) => {
    setDisputeMode("respond");
    setDisputeSwapId(swapId);
    setDisputeText("");
    setDisputeOpen(true);
  }, []);

  const openFileDispute = useCallback((swapId: string) => {
    setDisputeMode("file");
    setDisputeSwapId(swapId);
    setDisputeText("");
    setDisputeOpen(true);
  }, []);

  const openCounter = useCallback(
    (swap: ProposalSwap & { profile?: MatchProfile | null }) => {
      const me = getCachedUser();
      setCounterError(null);
      setCounterTarget({
        id: swap.id,
        partnerName: swap.partnerName,
        youGive: swap.youGive,
        youGet: swap.youGet,
        deadline: swap.deadline,
        deposit: swap.deposit ?? 0,
        depositHeld: swap.depositHeld ?? swap.deposit ?? 0,
        viewerRole: swap.viewerRole,
        myBalance: me?.balance ?? null,
        mySkills: me?.skillsOffer ?? [],
        theirSkills: swap.profile?.skills ?? [],
      });
    },
    []
  );

  const submitCounter = useCallback(
    async (input: {
      youGive: string;
      youGet: string;
      deadline: string | null;
      deposit: number;
      message: string | null;
    }) => {
      if (!counterTarget) return;
      setCounterBusy(true);
      setCounterError(null);
      try {
        await counterSwapProposal(counterTarget.id, input);
        setCounterTarget(null);
        fetchCurrentUser().catch(() => {}); // balance may have changed
        await runMutate();
        showToast(`Counter-offer sent to ${counterTarget.partnerName || "your partner"}.`);
      } catch (error) {
        setCounterError(error instanceof Error ? error.message : "Could not send counter-offer.");
      } finally {
        setCounterBusy(false);
      }
    },
    [counterTarget, runMutate, showToast]
  );

  const openReview = useCallback((swapId: string) => {
    setReviewSwapId(swapId);
    setReviewRating(0);
    setReviewOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      goToChat,
      accept,
      decline,
      complete,
      propose,
      openCounter,
      openDispute,
      openFileDispute,
      openReview,
      setOnMutate,
    }),
    [
      openCounter,
      goToChat,
      accept,
      decline,
      complete,
      propose,
      openDispute,
      openFileDispute,
      openReview,
      setOnMutate,
    ]
  );

  return (
    <SwapActionsContext.Provider value={value}>
      {children}

      {disputeOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setDisputeOpen(false);
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dispute-modal-title"
          >
            <h2
              id="dispute-modal-title"
              className="text-xl font-bold text-slate-900"
            >
              {disputeMode === "file" ? "File a dispute" : "Respond to dispute"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {disputeMode === "file"
                ? "Describe the issue. Your partner will be notified and the swap will move to dispute status."
                : "Explain your side of the issue. Your partner will be notified."}
            </p>
            <textarea
              rows={5}
              value={disputeText}
              onChange={(event) => setDisputeText(event.target.value)}
              className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-swapspot-blue focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20"
              placeholder={
                disputeMode === "file"
                  ? "What went wrong with this swap?"
                  : "Describe what you delivered and your proposed resolution…"
              }
              autoFocus
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDisputeOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={disputeBusy}
                onClick={async () => {
                  const text = disputeText.trim();
                  if (!text || !disputeSwapId) {
                    showToast("Please enter a response.");
                    return;
                  }
                  setDisputeBusy(true);
                  try {
                    await delay();
                    if (disputeMode === "file") {
                      await fileSwapDispute(disputeSwapId, text);
                      showToast("Dispute filed. Swap is now in dispute.");
                    } else {
                      await respondToDispute(disputeSwapId, text);
                      showToast(
                        "Dispute response submitted. Swap is back in progress."
                      );
                    }
                    setDisputeOpen(false);
                    await runMutate();
                  } catch {
                    showToast(
                      disputeMode === "file"
                        ? "Could not file dispute."
                        : "Could not submit dispute response."
                    );
                  } finally {
                    setDisputeBusy(false);
                  }
                }}
                className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-70"
              >
                {disputeBusy
                  ? "Processing…"
                  : disputeMode === "file"
                    ? "File dispute"
                    : "Submit response"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {counterTarget ? (
        <CounterOfferModal
          target={counterTarget}
          busy={counterBusy}
          error={counterError}
          onClose={() => setCounterTarget(null)}
          onSubmit={(input) => void submitCounter(input)}
        />
      ) : null}

      {reviewOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setReviewOpen(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
          >
            <h2
              id="review-modal-title"
              className="text-xl font-bold text-slate-900"
            >
              Leave a review
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              How was your swap experience?
            </p>
            <div className="mt-5 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`${star} stars`}
                  onClick={() => setReviewRating(star)}
                  className={`rounded-lg p-2 text-2xl transition hover:scale-110 ${
                    star <= reviewRating
                      ? "text-amber-400"
                      : "text-slate-300 hover:text-amber-400"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reviewRating || reviewBusy}
                onClick={async () => {
                  if (!reviewSwapId || !reviewRating) return;
                  setReviewBusy(true);
                  try {
                    await delay();
                    await submitReview(reviewSwapId, reviewRating);
                    setReviewOpen(false);
                    await runMutate();
                    showToast(`Review submitted — ${reviewRating} stars!`);
                  } catch {
                    showToast("Could not submit review.");
                  } finally {
                    setReviewBusy(false);
                  }
                }}
                className="rounded-lg bg-swapspot-blue px-4 py-2 text-sm font-semibold text-white hover:bg-[#3f52c4] disabled:opacity-70"
              >
                {reviewBusy ? "Processing…" : "Submit review"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </SwapActionsContext.Provider>
  );
}
