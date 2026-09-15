"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { SwapCountdown } from "@/features/swaps/useSwapCountdown";
import { useSwapActions } from "@/features/swaps/SwapActionsProvider";
import type { Swap } from "@/types";

function formatDeposit(amount: number): string {
  return `$${amount.toFixed(2)} USD`;
}

function statusText(swap: Swap): string {
  if (swap.type === "proposal") return swap.statusLabel || "Pending";
  if (swap.type === "completed") return "Completed";
  if (swap.status === "dispute") return "Dispute";
  return "Active";
}

function statusColor(swap: Swap): string {
  if (swap.type === "proposal") return "text-orange-600";
  if (swap.type === "completed") return "text-slate-600";
  if (swap.status === "dispute") return "text-rose-600";
  return "text-emerald-600";
}

function MetaItem({
  label,
  children,
  valueClass = "text-swapspot-blue",
}: {
  label: string;
  children: ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-base font-semibold ${valueClass}`}>{children}</p>
    </div>
  );
}

function OfferPill({
  text,
  tone,
}: {
  text: string;
  tone: "partner" | "mine" | "muted";
}) {
  const styles =
    tone === "partner"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "mine"
        ? "bg-swapspot-blue/10 text-swapspot-blue"
        : "bg-slate-100 text-slate-600";

  return (
    <span
      className={`inline-flex rounded-full px-4 py-1.5 text-sm font-semibold ${styles}`}
    >
      {text}
    </span>
  );
}

function swapTitle(swap: Swap): string {
  if (swap.type === "ongoing") {
    const a = swap.exchange || "Skill";
    const b = swap.swapping || "Skill";
    return `${a} for ${b}`;
  }
  if (swap.type === "proposal") {
    return swap.incoming
      ? `Proposal from ${swap.partnerName}`
      : `Proposal to ${swap.partnerName}`;
  }
  return `Completed swap with ${swap.partnerName}`;
}

function OngoingActions({ swap }: { swap: Swap }) {
  const router = useRouter();
  const { goToChat, complete, openFileDispute, openDispute } = useSwapActions();
  const [busy, setBusy] = useState(false);
  const inDispute = swap.type === "ongoing" && swap.status === "dispute";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => goToChat(swap.partnerId)}
        aria-label="Open chat"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
      </button>

      {inDispute ? (
        <button
          type="button"
          onClick={() => openDispute(swap.id)}
          className="rounded-lg border-2 border-rose-400 bg-white px-5 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
        >
          Respond to Dispute
        </button>
      ) : (
        <button
          type="button"
          onClick={() => openFileDispute(swap.id)}
          className="rounded-lg border-2 border-swapspot-blue bg-white px-5 py-2.5 text-sm font-semibold text-swapspot-blue transition hover:bg-swapspot-blue/5"
        >
          File A Dispute
        </button>
      )}

      <button
        type="button"
        disabled={busy || inDispute}
        onClick={async () => {
          setBusy(true);
          const ok = await complete(swap.id);
          setBusy(false);
          if (ok) {
            window.setTimeout(() => {
              router.push("/swaps?tab=history");
            }, 900);
          }
        }}
        className="rounded-lg bg-swapspot-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3f52c4] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Processing…" : "Mark Completed"}
      </button>
    </div>
  );
}

function ProposalActions({ swap }: { swap: Swap }) {
  const router = useRouter();
  const { accept, decline } = useSwapActions();
  const [busy, setBusy] = useState(false);

  if (swap.type !== "proposal") return null;

  if (!swap.incoming) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const ok = await decline(swap.id);
          setBusy(false);
          if (ok) {
            window.setTimeout(() => {
              router.push("/swaps?tab=pending");
            }, 900);
          }
        }}
        className="rounded-lg border-2 border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-70"
      >
        {busy ? "Processing…" : "Cancel proposal"}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const updated = await accept(swap.id);
          setBusy(false);
          if (updated) {
            window.setTimeout(() => {
              router.push(`/swaps/${encodeURIComponent(updated.id)}`);
            }, 900);
          }
        }}
        className="rounded-lg bg-swapspot-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3f52c4] disabled:opacity-70"
      >
        {busy ? "Processing…" : "Accept proposal"}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const ok = await decline(swap.id);
          setBusy(false);
          if (ok) {
            window.setTimeout(() => {
              router.push("/swaps?tab=pending");
            }, 900);
          }
        }}
        className="rounded-lg border-2 border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-70"
      >
        Decline
      </button>
    </div>
  );
}

export function SwapDetail({ swap }: { swap: Swap }) {
  const { goToChat, openReview } = useSwapActions();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Link
          href="/swaps"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-swapspot-blue"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              d="m15 18-6-6 6-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Swap: {swap.id}
        </Link>

        {swap.type === "ongoing" ? (
          <OngoingActions swap={swap} />
        ) : swap.type === "proposal" ? (
          <ProposalActions swap={swap} />
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => goToChat(swap.partnerId)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800"
              aria-label="Open chat"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => openReview(swap.id)}
              className="rounded-lg border-2 border-swapspot-blue px-5 py-2.5 text-sm font-semibold text-swapspot-blue transition hover:bg-swapspot-blue/5"
            >
              Leave a review
            </button>
          </div>
        )}
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {swapTitle(swap)}
        </h1>
        <p className="mt-2 text-slate-500">
          Swapping with{" "}
          <span className="font-medium text-slate-700">{swap.partnerName}</span>
        </p>
      </div>

      {swap.type === "ongoing" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetaItem label="Status" valueClass={statusColor(swap)}>
            {statusText(swap)}
          </MetaItem>
          <MetaItem label="Time Remaining">
            <SwapCountdown timer={swap.timer} />
          </MetaItem>
          <MetaItem label="Swap Started">{swap.startedAt || "—"}</MetaItem>
          <MetaItem label="Swap End">{swap.deadline || "—"}</MetaItem>
        </div>
      ) : swap.type === "proposal" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetaItem label="Status" valueClass={statusColor(swap)}>
            {statusText(swap)}
          </MetaItem>
          <MetaItem label="Received">{swap.receivedAt || "—"}</MetaItem>
          <MetaItem label="Partner">{swap.partnerName || "—"}</MetaItem>
          <MetaItem label="Swap End">{swap.deadline || "TBD"}</MetaItem>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetaItem label="Status" valueClass={statusColor(swap)}>
            Completed
          </MetaItem>
          <MetaItem label="Completed">{swap.completedAt || "—"}</MetaItem>
          <MetaItem label="Partner">{swap.partnerName || "—"}</MetaItem>
          <MetaItem label="Rating">{`${swap.rating ?? "—"} ★`}</MetaItem>
        </div>
      )}

      <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Offers</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {swap.type === "ongoing" ? (
            <>
              <div>
                <p className="text-sm text-slate-500">
                  {swap.partnerName}&apos;s Offer:
                </p>
                <div className="mt-2">
                  <OfferPill text={swap.exchange ?? ""} tone="partner" />
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500">My Offer:</p>
                <div className="mt-2">
                  <OfferPill text={swap.swapping ?? ""} tone="mine" />
                </div>
              </div>
            </>
          ) : swap.type === "proposal" ? (
            <>
              <div>
                <p className="text-sm text-slate-500">
                  {swap.incoming
                    ? `${swap.partnerName}'s Offer:`
                    : "My Offer:"}
                </p>
                <div className="mt-2">
                  <OfferPill
                    text={swap.offering ?? ""}
                    tone={swap.incoming ? "partner" : "mine"}
                  />
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500">
                  {swap.incoming ? "My Offer:" : "I want:"}
                </p>
                <div className="mt-2">
                  <OfferPill
                    text={swap.exchange ?? ""}
                    tone={swap.incoming ? "mine" : "partner"}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-sm text-slate-500">
                  {swap.partnerName}&apos;s Offer:
                </p>
                <div className="mt-2">
                  <OfferPill text={swap.exchange ?? ""} tone="muted" />
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500">My Offer:</p>
                <div className="mt-2">
                  <OfferPill text={swap.swapped ?? ""} tone="muted" />
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Swap Details</h2>
        <p className="text-sm leading-relaxed text-slate-600">
          {swap.description || "No additional details were provided."}
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Escrow Deposit</h2>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900">
          {formatDeposit(swap.deposit ?? 0)}
        </div>
        <p className="text-xs leading-relaxed text-slate-500">
          This deposit is held in escrow and returned to both parties upon
          successful swap completion. (5% platform fee)
        </p>
      </section>

      {swap.type === "ongoing" && swap.status === "dispute" ? (
        <section className="rounded-2xl border border-rose-100 bg-rose-50/50 p-6">
          <h2 className="text-lg font-bold text-rose-800">
            Dispute information
          </h2>
          <p className="mt-2 text-sm text-rose-700">
            A dispute is open on this swap. Review the details and submit your
            response when ready.
          </p>
        </section>
      ) : null}

      {swap.partnerId ? (
        <div className="flex justify-end">
          <Link
            href={`/profiles/${encodeURIComponent(swap.partnerId)}`}
            className="text-sm font-semibold text-swapspot-blue hover:underline"
          >
            View {swap.partnerName}&apos;s profile
          </Link>
        </div>
      ) : null}
    </div>
  );
}
