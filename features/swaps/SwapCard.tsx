"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { SkillPill } from "@/components/ui/SkillPill";
import { ChatButton } from "@/components/ui/ChatButton";
import { SwapCountdown } from "@/features/swaps/useSwapCountdown";
import { useSwapActions } from "@/features/swaps/SwapActionsProvider";
import type { CompletedSwap, MatchProfile, OngoingSwap, ProposalSwap } from "@/types";

const starIcon = (
  <svg
    className="h-4 w-4 text-amber-400"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
  </svg>
);

type ActionVariant = "outline" | "primary" | "danger" | "ghost";

const actionStyles: Record<ActionVariant, string> = {
  outline:
    "rounded-lg border-2 border-swapspot-blue px-4 py-2 text-sm font-semibold text-swapspot-blue transition hover:bg-swapspot-blue/5",
  primary:
    "rounded-lg bg-swapspot-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3f52c4]",
  danger:
    "rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600",
  ghost:
    "rounded-lg border-2 border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50",
};

function ActionButton({
  label,
  variant = "outline",
  onClick,
  busy,
}: {
  label: string;
  variant?: ActionVariant;
  onClick: () => void | Promise<void>;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void onClick()}
      className={`${actionStyles[variant]} disabled:opacity-70`}
    >
      {busy ? "Processing…" : label}
    </button>
  );
}

function ViewDetailsLink({ id }: { id: string }) {
  return (
    <Link
      href={`/swaps/${encodeURIComponent(id)}`}
      className="rounded-lg border-2 border-swapspot-blue px-4 py-2 text-sm font-semibold text-swapspot-blue transition hover:bg-swapspot-blue/5"
    >
      View Details
    </Link>
  );
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function CardActions({
  buttons,
  chatLabel,
  partnerId,
}: {
  buttons: ReactNode;
  chatLabel: string;
  partnerId?: string | null;
}) {
  const { goToChat } = useSwapActions();
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      {buttons}
      <ChatButton label={chatLabel} onClick={() => goToChat(partnerId)} />
    </div>
  );
}

export function SwapCardOngoing({
  id,
  swapping,
  exchange,
  partner,
  partnerId,
  timer,
  action = "dispute",
  tasks,
}: OngoingSwap) {
  const { complete, openDispute } = useSwapActions();
  const [busy, setBusy] = useState(false);

  return (
    <article
      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
      data-swap-card={id}
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <FieldRow label="You are swapping">
          <SkillPill text={swapping ?? ""} />
        </FieldRow>
        <FieldRow label="In exchange for">
          <SkillPill text={exchange ?? ""} />
        </FieldRow>
        <FieldRow label="With">
          <span className="font-semibold text-slate-900">{partner}</span>
        </FieldRow>
        <FieldRow label="Time Remaining">
          <SwapCountdown
            timer={timer}
            className="font-semibold text-rose-600"
          />
        </FieldRow>
      </div>
      {tasks && tasks.mineTotal > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 px-4 py-3 text-xs">
          {[
            { label: "Your to-dos", done: tasks.mineDone, total: tasks.mineTotal },
            { label: `${partner ?? "Partner"}'s to-dos`, done: tasks.theirsDone, total: tasks.theirsTotal },
          ].map((p) => (
            <div key={p.label}>
              <div className="mb-1 flex justify-between text-slate-500">
                <span className="truncate">{p.label}</span>
                <span className="tabular-nums font-semibold text-slate-700">
                  {p.done}/{p.total}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-swapspot-blue"
                  style={{ width: `${p.total ? (p.done / p.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <CardActions
        chatLabel={`Chat with ${partner}`}
        partnerId={partnerId}
        buttons={
          <>
            <ViewDetailsLink id={id} />
            {action === "dispute" ? (
              <ActionButton
                label="Respond to a Dispute"
                variant="danger"
                onClick={() => openDispute(id)}
              />
            ) : (
              <ActionButton
                label="Mark Completed"
                variant="outline"
                busy={busy}
                onClick={async () => {
                  setBusy(true);
                  await complete(id);
                  setBusy(false);
                }}
              />
            )}
          </>
        }
      />
    </article>
  );
}

export function SwapCardProposal(
  props: ProposalSwap & { profile?: MatchProfile | null }
) {
  const { id, name, partnerId, incoming, statusLabel, youGive, youGet, counterCount } = props;
  const { accept, decline, openCounter } = useSwapActions();
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);

  return (
    <article
      className={`rounded-2xl border bg-white p-5 shadow-sm ${
        incoming ? "border-swapspot-blue/30" : "border-slate-100"
      }`}
      data-swap-card={id}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {incoming ? "Needs your response" : "Waiting on " + (name || "partner")}
        </p>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            incoming ? "bg-swapspot-blue/10 text-swapspot-blue" : "bg-slate-100 text-slate-500"
          }`}
        >
          {statusLabel}
        </span>
        {counterCount > 0 ? (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
            {counterCount} counter{counterCount === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldRow label="You teach">
          <SkillPill text={youGive ?? ""} />
        </FieldRow>
        <FieldRow label={`You learn from ${name || "them"}`}>
          <SkillPill text={youGet ?? ""} />
        </FieldRow>
      </div>
      <CardActions
        chatLabel={`Chat with ${name}`}
        partnerId={partnerId}
        buttons={
          <>
            <ViewDetailsLink id={id} />
            {incoming ? (
              <>
                <ActionButton
                  label="Accept"
                  variant="primary"
                  busy={busy === "accept"}
                  onClick={async () => {
                    setBusy("accept");
                    await accept(id);
                    setBusy(null);
                  }}
                />
                <ActionButton
                  label="Counter"
                  variant="outline"
                  onClick={() => openCounter(props)}
                />
                <ActionButton
                  label="Decline"
                  variant="ghost"
                  busy={busy === "decline"}
                  onClick={async () => {
                    setBusy("decline");
                    await decline(id, "decline");
                    setBusy(null);
                  }}
                />
              </>
            ) : (
              <ActionButton
                label="Withdraw"
                variant="ghost"
                busy={busy === "decline"}
                onClick={async () => {
                  setBusy("decline");
                  await decline(id, "withdraw");
                  setBusy(null);
                }}
              />
            )}
          </>
        }
      />
    </article>
  );
}

export function SwapCardCompleted({
  id,
  swapped,
  exchange,
  partner,
  partnerId,
  rating,
}: CompletedSwap) {
  const { openReview } = useSwapActions();

  return (
    <article
      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
      data-swap-card={id}
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <FieldRow label="You swapped">
          <SkillPill text={swapped ?? ""} muted />
        </FieldRow>
        <FieldRow label="In exchange for">
          <SkillPill text={exchange ?? ""} muted />
        </FieldRow>
        <FieldRow label="With">
          <span className="font-semibold text-slate-900">{partner}</span>
        </FieldRow>
        <FieldRow label="Review Given">
          <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
            {rating} {starIcon}
          </span>
        </FieldRow>
      </div>
      <CardActions
        chatLabel={`Chat with ${partner}`}
        partnerId={partnerId}
        buttons={
          <>
            <ViewDetailsLink id={id} />
            <ActionButton
              label="Review"
              variant="outline"
              onClick={() => openReview(id)}
            />
          </>
        }
      />
    </article>
  );
}
