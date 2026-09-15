"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageLoading } from "@/components/shared/PageLoading";
import { AppHeader } from "@/features/shared/AppHeader";
import {
  SwapsTabFilter,
  type SwapsTab,
} from "@/features/swaps/SwapsTabFilter";
import { SwapsSections } from "@/features/swaps/SwapsSections";
import { useSwapActions } from "@/features/swaps/SwapActionsProvider";
import {
  fetchDashboard,
  fetchSwaps,
  getCachedUser,
} from "@/services/api";
import type { SessionUser, SwapsPayload } from "@/types";

function parseTab(value: string | null): SwapsTab {
  if (value === "pending" || value === "history" || value === "current") {
    return value;
  }
  return "current";
}

function SwapsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab"));
  const { setOnMutate } = useSwapActions();
  const [cached, setCached] = useState<SessionUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shellUser, setShellUser] = useState<SessionUser | null>(null);
  const [searchPlaceholder, setSearchPlaceholder] = useState("Search matches…");
  const [unreadCount, setUnreadCount] = useState(0);
  const [swaps, setSwaps] = useState<SwapsPayload>({
    ongoingSwaps: [],
    pendingProposals: [],
    completedSwaps: [],
  });

  useEffect(() => {
    setCached(getCachedUser());
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [shell, swapsPayload] = await Promise.all([
        fetchDashboard(),
        fetchSwaps(),
      ]);
      setShellUser(shell.user);
      setSearchPlaceholder(shell.searchPlaceholder);
      setUnreadCount(shell.unreadCount);
      setSwaps(swapsPayload);
    } catch {
      setError("Failed to load the swaps page.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    setOnMutate(load);
    return () => setOnMutate(null);
  }, [load, setOnMutate]);

  if (loading) {
    return <PageLoading title="Loading your swaps…" embedded />;
  }

  if (error && !shellUser) {
    return (
      <main className="flex-1 p-6 lg:p-8">
        <p className="text-sm text-rose-600">{error}</p>
      </main>
    );
  }

  return (
    <>
      <AppHeader
        user={{
          avatar: shellUser?.avatar || cached?.avatar || "",
          firstName: shellUser?.firstName || cached?.firstName || "Member",
        }}
        searchPlaceholder={searchPlaceholder}
        unreadCount={unreadCount}
      />

      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-slate-900">Your Swaps</h1>
          <SwapsTabFilter
            active={activeTab}
            onChange={(tab) => {
              const params = new URLSearchParams(searchParams.toString());
              if (tab === "current") params.delete("tab");
              else params.set("tab", tab);
              const qs = params.toString();
              router.replace(qs ? `/swaps?${qs}` : "/swaps");
            }}
          />
        </div>

        <SwapsSections {...swaps} activeTab={activeTab} />
      </main>
    </>
  );
}

export default function SwapsPage() {
  return (
    <Suspense fallback={<PageLoading title="Loading your swaps…" embedded />}>
      <SwapsPageContent />
    </Suspense>
  );
}
