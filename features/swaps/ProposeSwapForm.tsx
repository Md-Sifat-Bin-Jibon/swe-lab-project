"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FormField } from "@/components/ui/FormField";
import { useToast } from "@/hooks/useToast";
import { proposeSwap } from "@/services/api";
import type { MatchProfile } from "@/types";

export function ProposeSwapForm({
  profile,
  balance,
}: {
  profile: MatchProfile;
  balance: number;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const available = Math.max(0, balance);
  const defaultDeposit = useMemo(
    () => String(Math.min(50, available)),
    [available]
  );

  const [yourOffer, setYourOffer] = useState(profile.want || "");
  const [wantInReturn, setWantInReturn] = useState(profile.offer || "");
  const [details, setDetails] = useState("");
  const [deadline, setDeadline] = useState("");
  const [deposit, setDeposit] = useState(defaultDeposit);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const offer = yourOffer.trim();
    const want = wantInReturn.trim();
    if (!offer || !want) {
      showToast("Please fill in your offer and what you want in return.");
      return;
    }

    const depositValue = Number(deposit);
    if (!Number.isFinite(depositValue) || depositValue < 0) {
      showToast("Enter a valid deposit amount.");
      return;
    }

    if (depositValue > available) {
      showToast(
        `Deposit cannot exceed your balance ($${available.toFixed(2)}).`
      );
      return;
    }

    setBusy(true);
    try {
      const description =
        details.trim() ||
        `You proposed swapping ${offer} in exchange for ${want}.`;

      const { proposal } = await proposeSwap({
        partnerId: profile.id,
        partnerName: profile.name,
        // API: offering = partner skill / what you want; exchange = your offer
        offering: want,
        exchange: offer,
        description,
        deadline: deadline || undefined,
        deposit: depositValue,
      });

      showToast(`Swap proposal sent to ${profile.name}!`);
      router.push(`/swaps/${encodeURIComponent(proposal.id)}`);
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : `Could not send proposal to ${profile.name}.`
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/profiles/${encodeURIComponent(profile.id)}`}
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
        Propose a Swap
      </Link>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Create Your Proposal
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          You&apos;re proposing a swap with{" "}
          <span className="font-semibold text-slate-700">{profile.name}</span>.
        </p>
        <p className="mt-1 text-sm font-medium text-swapspot-blue">
          Available balance: ${available.toFixed(2)}
        </p>

        <form className="mt-8 space-y-5" onSubmit={(e) => void handleSubmit(e)}>
          <FormField
            id="your-offer"
            label="Your Offer:"
            placeholder="Type a skill..."
            value={yourOffer}
            onChange={(e) => setYourOffer(e.target.value)}
            required
          />

          <FormField
            id="want-in-return"
            label="What You Want in Return:"
            placeholder="Type a skill..."
            value={wantInReturn}
            onChange={(e) => setWantInReturn(e.target.value)}
            required
          />

          <div className="space-y-2">
            <label
              htmlFor="swap-details"
              className="block text-sm font-medium text-slate-500"
            >
              Swap Details:
            </label>
            <textarea
              id="swap-details"
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Explain what this swap involves..."
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-swapspot-blue focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="swap-duration"
              className="block text-sm font-medium text-slate-500"
            >
              Swap Duration:
            </label>
            <div className="relative">
              <input
                id="swap-duration"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-900 focus:border-swapspot-blue focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20"
              />
              <svg
                className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
          </div>

          <div className="space-y-2">
            <FormField
              id="deposit"
              label="Associated Deposit:"
              type="number"
              placeholder="Enter deposit amount"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              inputProps={{ min: 0, max: available, step: "0.01" }}
            />
            <p className="text-xs leading-relaxed text-slate-500">
              Max ${available.toFixed(2)}. This deposit is held in escrow from
              your balance and returned (minus a 5% platform fee) when the swap
              completes successfully.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={busy || !profile.available}
              className="rounded-lg bg-swapspot-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3f52c4] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send Proposal"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
