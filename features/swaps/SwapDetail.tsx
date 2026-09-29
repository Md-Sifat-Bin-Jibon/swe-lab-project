"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { SwapCountdown } from "@/features/swaps/useSwapCountdown";
import { useSwapActions } from "@/features/swaps/SwapActionsProvider";
import { SwapPlan } from "@/features/swaps/SwapPlan";
import { MeetingsPanel } from "@/features/meetings/MeetingsPanel";
import type { MatchProfile, Swap, SwapOfferEntry } from "@/types";

type DetailSwap = Swap & { history?: SwapOfferEntry[]; profile?: MatchProfile | null };

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
    return swap.viewerRole === "recipient"
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

/** "2026-12-31" → "Dec 31, 2026"; other formats are shown as-is. */
function formatDay(value: string | null | undefined): string {
  if (!value) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatWhen(value: string) {
  const d = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function NegotiationHistory({ history }: { history: SwapOfferEntry[] }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Negotiation history</h2>
      <ol className="mt-5 space-y-0">
        {history.map((entry, i) => {
          const prev = history[i - 1];
          const changed = (a: string | null, b: string | null | undefined) =>
            Boolean(prev) && (a ?? "").toLowerCase() !== (b ?? "").toLowerCase();
          const latest = i === history.length - 1;
          return (
            <li key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
              {!latest ? (
                <span className="absolute left-[11px] top-7 h-[calc(100%-1.25rem)] w-0.5 bg-slate-100" aria-hidden="true" />
              ) : null}
              <span
                className={`relative mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  latest ? "bg-swapspot-blue text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-800">
                  <span className="font-semibold">{entry.authorName}</span>{" "}
                  {entry.kind === "proposal" ? "proposed the swap" : "sent a counter-offer"}
                  {latest ? (
                    <span className="ml-2 rounded bg-swapspot-blue/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-swapspot-blue">
                      Current
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-slate-400">{formatWhen(entry.createdAt)}</p>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  <span className="text-slate-500">
                    You teach:{" "}
                    <span className={`font-medium ${changed(entry.youGive, prev?.youGive) ? "text-amber-700" : "text-slate-800"}`}>
                      {entry.youGive || "—"}
                    </span>
                  </span>
                  <span className="text-slate-500">
                    You learn:{" "}
                    <span className={`font-medium ${changed(entry.youGet, prev?.youGet) ? "text-amber-700" : "text-slate-800"}`}>
                      {entry.youGet || "—"}
                    </span>
                  </span>
                  {entry.deposit !== null ? (
                    <span className="text-slate-500">
                      Escrow:{" "}
                      <span
                        className={`font-medium ${
                          prev && prev.deposit !== null && prev.deposit !== entry.deposit ? "text-amber-700" : "text-slate-800"
                        }`}
                      >
                        ${entry.deposit.toFixed(2)}
                      </span>
                    </span>
                  ) : null}
                  {entry.deadline ? (
                    <span className="text-slate-500">
                      Ends:{" "}
                      <span className={`font-medium ${changed(entry.deadline, prev?.deadline) ? "text-amber-700" : "text-slate-800"}`}>
                        {formatDay(entry.deadline)}
                      </span>
                    </span>
                  ) : null}
                </div>
                {entry.message ? (
                  <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm italic text-slate-600">&ldquo;{entry.message}&rdquo;</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function ProposalActions({ swap }: { swap: DetailSwap }) {
  const router = useRouter();
  const { accept, decline, openCounter } = useSwapActions();
  const [busy, setBusy] = useState(false);

  if (swap.type !== "proposal") return null;

  if (!swap.incoming) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const ok = await decline(swap.id, "withdraw");
          setBusy(false);
          if (ok) {
            window.setTimeout(() => {
              router.push("/swaps?tab=pending");
            }, 900);
          }
        }}
        className="rounded-lg border-2 border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-70"
      >
        {busy ? "Processing…" : "Withdraw proposal"}
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
        onClick={() => openCounter({ ...swap, profile: swap.profile })}
        className="rounded-lg border-2 border-swapspot-blue px-5 py-2.5 text-sm font-semibold text-swapspot-blue transition hover:bg-swapspot-blue/5 disabled:opacity-70"
      >
        Counter-offer
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const ok = await decline(swap.id, "decline");
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

export function SwapDetail({ swap }: { swap: DetailSwap }) {
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
          <MetaItem label="Swap End">{formatDay(swap.deadline) || "TBD"}</MetaItem>
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
                  {swap.partnerName}&apos;s Offer (you learn):
                </p>
                <div className="mt-2">
                  <OfferPill text={swap.youGet ?? ""} tone="partner" />
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500">My Offer (you teach):</p>
                <div className="mt-2">
                  <OfferPill text={swap.youGive ?? ""} tone="mine" />
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

      {swap.type === "proposal" ? (
        <div
          className={`rounded-2xl px-5 py-4 text-sm ${
            swap.incoming
              ? "border border-swapspot-blue/20 bg-swapspot-blue/5 text-slate-700"
              : "border border-slate-100 bg-slate-50 text-slate-500"
          }`}
        >
          {swap.incoming
            ? swap.counterCount > 0
              ? `${swap.partnerName} countered your offer. Accept these terms, send another counter-offer, or decline.`
              : `${swap.partnerName} proposed this swap. Accept it, suggest different terms with a counter-offer, or decline.`
            : `Waiting for ${swap.partnerName} to accept, decline or counter your ${
                swap.counterCount > 0 ? "counter-offer" : "proposal"
              }.`}
        </div>
      ) : null}

      {swap.type === "ongoing" || swap.type === "completed" ? (
        <SwapPlan swapId={swap.id} readOnly={swap.type === "completed"} />
      ) : null}

      {swap.type === "ongoing" ? (
        <MeetingsPanel swapId={swap.id} partnerId={swap.partnerId} partnerName={swap.partnerName || "your partner"} />
      ) : null}

      {swap.history && swap.history.length > 1 ? <NegotiationHistory history={swap.history} /> : null}

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
        {swap.type === "proposal" && swap.depositHeld !== swap.deposit ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {swap.viewerRole === "proposer"
              ? `${swap.partnerName} asked to change the deposit from ${formatDeposit(swap.depositHeld)}. Accepting will ${
                  swap.deposit > swap.depositHeld
                    ? `hold ${formatDeposit(swap.deposit - swap.depositHeld)} more from your balance`
                    : `return ${formatDeposit(swap.depositHeld - swap.deposit)} to your balance`
                }.`
              : `You asked to change the deposit (currently ${formatDeposit(swap.depositHeld)} held). It only changes if ${swap.partnerName} accepts.`}
          </p>
        ) : null}
        <p className="text-xs leading-relaxed text-slate-500">
          Held in escrow from {swap.viewerRole === "proposer" ? "your" : `${swap.partnerName}'s`} balance
          (the person who proposed the swap) and returned when the swap is completed, minus a 5%
          platform fee. It can be changed in a counter-offer before the swap is accepted.
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
