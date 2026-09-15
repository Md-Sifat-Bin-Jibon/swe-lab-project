"use client";

import type { SwapsPayload } from "@/types";
import type { SwapsTab } from "@/features/swaps/SwapsTabFilter";
import {
  SwapCardCompleted,
  SwapCardOngoing,
  SwapCardProposal,
} from "@/features/swaps/SwapCard";

export interface SwapsSectionsProps extends SwapsPayload {
  activeTab: SwapsTab;
}

export function SwapsSections({
  ongoingSwaps = [],
  pendingProposals = [],
  completedSwaps = [],
  activeTab,
}: SwapsSectionsProps) {
  // Legacy: "current" shows ongoing + pending; "pending" only proposals; "history" only completed
  const showOngoingSection = activeTab === "current";
  const showPendingSection =
    activeTab === "current" || activeTab === "pending";
  const showHistorySection = activeTab === "history";

  return (
    <div className="space-y-10">
      {showOngoingSection ? (
        <section aria-labelledby="ongoing-heading">
          <h2
            id="ongoing-heading"
            className="mb-4 text-lg font-bold text-slate-900"
          >
            Your ongoing skill exchanges
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {ongoingSwaps.length > 0 ? (
              ongoingSwaps.map((swap) => (
                <SwapCardOngoing key={swap.id} {...swap} />
              ))
            ) : (
              <p className="text-sm text-slate-500">No ongoing swaps yet.</p>
            )}
          </div>
        </section>
      ) : null}

      {showPendingSection ? (
        <section aria-labelledby="proposals-heading">
          <h2
            id="proposals-heading"
            className="mb-4 text-lg font-bold text-slate-900"
          >
            Proposals that are awaiting a response
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {pendingProposals.length > 0 ? (
              pendingProposals.map((proposal) => (
                <SwapCardProposal key={proposal.id} {...proposal} />
              ))
            ) : (
              <p className="text-sm text-slate-500">No pending proposals.</p>
            )}
          </div>
        </section>
      ) : null}

      {showHistorySection ? (
        <section aria-labelledby="completed-heading">
          <h2
            id="completed-heading"
            className="mb-4 text-lg font-bold text-slate-900"
          >
            See your completed skill exchanges
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {completedSwaps.length > 0 ? (
              completedSwaps.map((swap) => (
                <SwapCardCompleted key={swap.id} {...swap} />
              ))
            ) : (
              <p className="text-sm text-slate-500">No completed swaps yet.</p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
